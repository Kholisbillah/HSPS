<?php

namespace App\Http\Controllers\Petugas;

use App\Http\Controllers\Controller;
use App\Models\Kendaraan;
use App\Models\Transaksi;
use App\Models\Tarif;
use App\Models\AreaParkir;
use App\Models\LogAktivitas;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Carbon\Carbon;
use App\Services\TransaksiService;

class GateOutController extends Controller
{
    /**
     * Tampilkan halaman Gate Out
     */
    public function index()
    {
        // Ambil SEMUA kendaraan yang sedang parkir (status masuk) dengan eager load relasi
        // Tidak di-limit agar petugas bisa melihat semua sesi parkir aktif
        $parkedVehicles = Transaksi::with(['tarif', 'area'])
            ->where('status', 'masuk')
            ->orderBy('waktu_masuk', 'asc') // Kendaraan terlama parkir di atas
            ->get();

        return Inertia::render('Petugas/GateOut', [
            'parkedVehicles' => $parkedVehicles
        ]);
    }

    /**
     * Scan Ticket / Cari Plat Nomor — menampilkan preview biaya
     */
    public function scan(Request $request, TransaksiService $service)
    {
        $request->validate([
            'plat_nomor' => 'required|string',
        ]);

        // Sanitasi plat nomor: uppercase + hapus SEMUA karakter non-alfanumerik (sesuai Security Checklist)
        $searchPlat = strtoupper(preg_replace('/[^A-Z0-9]/', '', $request->plat_nomor));

        // 1. Cari transaksi aktif (Status = Masuk)
        $transaksi = Transaksi::with(['tarif', 'area'])
            ->where('plat_nomor', $searchPlat)
            ->where('status', 'masuk')
            ->latest()
            ->first();

        if (!$transaksi) {
            return response()->json([
                'status' => 'error',
                'message' => 'Transaksi masuk tidak ditemukan untuk plat ini.'
            ], 404);
        }

        // 2. Cek status VIP dari tabel kendaraan
        $vip = Kendaraan::where('plat_nomor', $searchPlat)->first();
        $isVip = $vip !== null;

        // 3. Hitung durasi dan biaya (menggunakan TransaksiService)
        $waktuMasuk = Carbon::parse($transaksi->waktu_masuk);
        $waktuKeluar = now();
        $durasiJam = $service->hitungDurasiJam($waktuMasuk, $waktuKeluar);
        $biaya = $service->hitungBiaya($transaksi, $durasiJam, $isVip);

        return response()->json([
            'status' => 'success',
            'data' => [
                'transaksi' => $transaksi,
                'durasi_jam' => $durasiJam,
                'durasi_text' => $waktuMasuk->diffForHumans($waktuKeluar, true),
                'biaya_total' => $biaya,
                'is_vip' => $isVip,
                // Hanya expose field yang diperlukan, JANGAN expose seluruh model (keamanan)
                'vip_data' => $vip ? $vip->only(['plat_nomor', 'pemilik', 'jenis_kendaraan', 'warna']) : null,
                'waktu_masuk_formatted' => $waktuMasuk->format('d M Y H:i'),
                'waktu_keluar_formatted' => $waktuKeluar->format('d M Y H:i'),
            ]
        ]);
    }

    /**
     * Proses Checkout Gate Out
     * KEAMANAN: Biaya dihitung ulang di backend, BUKAN dari request frontend
     */
    public function store(Request $request, TransaksiService $service)
    {
        // Hanya perlu id_parkir — biaya TIDAK diterima dari frontend
        $request->validate([
            'id_parkir' => 'required|exists:transaksi,id_parkir',
            'uang_dibayar' => 'nullable|numeric|min:0',
        ]);

        return DB::transaction(function () use ($request, $service) {
            // Lock row transaksi untuk mencegah double checkout
            $transaksi = Transaksi::with('tarif')
                ->where('id_parkir', $request->id_parkir)
                ->lockForUpdate()
                ->firstOrFail();

            // Cegah double checkout
            if ($transaksi->status === 'keluar') {
                return response()->json(['message' => 'Transaksi ini sudah selesai.'], 400);
            }

            // Cek status VIP
            $isVip = $service->isVip($transaksi->plat_nomor);
            $karcisHilang = $request->boolean('karcis_hilang', false);
            $waktuKeluar = now();

            // KALKULASI via DATABASE (Stored Procedure)
            $waktuKeluarFormat = $waktuKeluar->format('Y-m-d H:i:s');
            DB::statement("CALL proses_checkout(?, ?, ?)", [
                $transaksi->id_parkir,
                $waktuKeluarFormat,
                $karcisHilang ? 1 : 0
            ]);

            // Refresh karena data dimutasi oleh DB
            $transaksi->refresh();
            
            // Override VIP jika diperlukan
            if ($isVip) {
                $transaksi->update(['biaya_total' => 0]);
                $biayaTotal = 0;
            } else {
                $biayaTotal = (int) $transaksi->biaya_total;
            }

            // Catatan: AreaParkir otomatis di-decrement oleh Trigger Database `tr_transaksi_keluar`

            // Catat log aktivitas
            $logMsg = 'Petugas memproses Checkout: ' . $transaksi->plat_nomor;
            $logMsg .= $isVip ? ' (VIP - Gratis)' : ' (Rp ' . number_format($biayaTotal) . ')';
            LogAktivitas::catat($logMsg);

            // Hitung kembalian
            $uangDibayar = $isVip ? 0 : ($request->uang_dibayar ?? 0);
            $kembalian = $uangDibayar - $biayaTotal;

            return response()->json([
                'status' => 'success',
                'message' => 'Checkout Berhasil. Gate Terbuka.',
                'biaya_total' => $biayaTotal,
                'kembalian' => $kembalian
            ]);
        });
    }
}
