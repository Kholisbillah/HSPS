<?php

namespace App\Http\Controllers\Petugas;

use App\Http\Controllers\Controller;
use App\Models\AreaParkir;
use App\Models\Transaksi;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\LogAktivitas;
use App\Services\TransaksiService;
use App\Http\Requests\StoreGateInRequest;
use Inertia\Inertia;
use Illuminate\Validation\ValidationException;

class TransaksiController extends Controller
{
    /**
     * Show Gate In Page
     */
    public function gateIn()
    {
        // Ambil semua area beserta info slot tersisa (termasuk peruntukan untuk filter dropdown)
        $areas = AreaParkir::select('id_area', 'nama_area', 'kapasitas', 'terisi', 'peruntukan')
            ->get()
            ->map(function ($area) {
            return [
            'id_area' => $area->id_area,
            'nama_area' => $area->nama_area,
            'peruntukan' => $area->peruntukan, // Diperlukan untuk filter di frontend
            'sisa_slot' => $area->kapasitas - $area->terisi,
            'disabled' => $area->terisi >= $area->kapasitas
            ];
        });

        return Inertia::render('Petugas/GateIn', [
            'areas' => $areas,
        ]);
    }

    /**
     * Store Gate In Transaction
     */
    public function storeGateIn(StoreGateInRequest $request)
    {
        // Validasi sudah dilakukan oleh StoreGateInRequest (termasuk sanitasi plat)

        return DB::transaction(function () use ($request) {
            // Lock area row for consistency
            $area = AreaParkir::where('id_area', $request->id_area)->lockForUpdate()->first();

            if ($area->terisi >= $area->kapasitas) {
                throw ValidationException::withMessages([
                    'id_area' => 'Area parkir penuh! Silakan pilih area lain.'
                ]);
            }

            // Get Tarif
            $tarif = \App\Models\Tarif::where('jenis_kendaraan', $request->jenis_kendaraan)->first();

            if (!$tarif) {
                throw ValidationException::withMessages([
                    'jenis_kendaraan' => 'Tarif untuk jenis kendaraan ini belum diatur oleh Admin.'
                ]);
            }

            // Cek VIP berdasarkan plat nomor (plat sudah disanitasi oleh FormRequest)
            $vip = \App\Models\Kendaraan::where('plat_nomor', $request->plat_nomor)->first();
            $isVip = $vip !== null;

            // Create Transaction — set id_kendaraan jika VIP agar relasi Eloquent berfungsi
            $metode = $request->metode_entry ?? 'Manual';
            $transaksi = Transaksi::create([
                'id_user' => auth()->id(),
                'id_area' => $area->id_area,
                'id_tarif' => $tarif->id_tarif,
                'id_kendaraan' => $vip?->id_kendaraan, // FK ke tabel kendaraan (null untuk non-VIP)
                'jenis_kendaraan' => $request->jenis_kendaraan,
                'plat_nomor' => $request->plat_nomor, // Sudah disanitasi oleh StoreGateInRequest
                'waktu_masuk' => now(),
                'status' => 'masuk',
                'metode_entry' => $metode, // Simpan metode input plat nomor
                'biaya_total' => 0, // Dihitung saat checkout (gate out)
            ]);

            // CATATAN: area_parkir.terisi otomatis di-increment oleh Trigger Database `tr_transaksi_masuk`
            // JANGAN manual increment di sini — akan menyebabkan double increment!

            // Buat data ticket sebagai array (bukan Eloquent object)
            // agar tarif_per_jam ikut terserialisasi melalui flash session
            $ticketArray = $transaksi->toArray();
            $ticketArray['is_vip'] = $isVip;
            $ticketArray['tarif_per_jam'] = $tarif->tarif_per_jam;

            $responseData = [
                'success' => "Berhasil Masuk! Plat: {$transaksi->plat_nomor}" . ($isVip ? " (VIP)" : ""),
                'new_ticket' => $ticketArray,
            ];

            // Catat log aktivitas dengan metode entry (sesuai Security Checklist)
            LogAktivitas::catat('Petugas memproses Kendaraan Masuk: ' . $transaksi->plat_nomor . ' (via ' . $metode . ')');

            return redirect()->route('gate.in')->with($responseData);
        });
    }

    /**
     * Check VIP by QR Code (Plat Nomor)
     */
    public function checkVip(Request $request)
    {
        $request->validate(['plat_nomor' => 'required|string']);

        $platNomor = strtoupper(str_replace(' ', '', $request->plat_nomor));

        $vip = \App\Models\Kendaraan::where('plat_nomor', $platNomor)->first();

        if (!$vip) {
            return response()->json([
                'status' => 'not_found',
                'message' => 'Data VIP tidak ditemukan.'
            ], 404);
        }

        // Cek apakah kendaraan VIP ini sudah ada sesi parkir aktif (belum keluar)
        $existingSession = Transaksi::where('plat_nomor', $platNomor)
            ->where('status', 'masuk')
            ->first();

        if ($existingSession) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Kendaraan VIP (' . $vip->pemilik . ') sudah berada di dalam area parkir. Tidak dapat masuk dua kali.',
            ], 422);
        }

        // Hanya expose field yang diperlukan (jangan expose id_user dll)
        return response()->json([
            'status' => 'success',
            'data' => $vip->only(['plat_nomor', 'jenis_kendaraan', 'pemilik', 'warna']),
            'message' => 'VIP Terdeteksi!'
        ]);
    }
}
