<?php

namespace App\Http\Controllers\Gate;

use App\Http\Controllers\Controller;
use App\Models\AreaParkir;
use App\Models\Gate;
use App\Models\Kendaraan;
use App\Models\LogAktivitas;
use App\Models\Tarif;
use App\Models\Transaksi;
use App\Services\DokuPaymentService;
use App\Services\TransaksiService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

/**
 * Controller untuk flow gate parkir otomatis (multi-gate).
 * Menangani Gate Masuk (self-service) dan Gate Keluar (cash/cashless).
 */
class GateController extends Controller
{
    // Konfigurasi gate: mapping kode_gate ke jenis kendaraan dan tipe
    private const GATE_OUT_CONFIG = [
        '1' => ['kode' => 'gate_out_1', 'jenis' => 'motor', 'pembayaran' => 'cash'],
        '2' => ['kode' => 'gate_out_2', 'jenis' => 'mobil', 'pembayaran' => 'cash'],
        '3' => ['kode' => 'gate_out_3', 'jenis' => 'motor', 'pembayaran' => 'cashless'],
        '4' => ['kode' => 'gate_out_4', 'jenis' => 'mobil', 'pembayaran' => 'cashless'],
        '5' => ['kode' => 'gate_out_5', 'jenis' => 'lainnya', 'pembayaran' => 'cash'],
    ];

    /**
     * Map gate type URL parameter ke jenis_kendaraan di database.
     * 'igd' → 'lainnya' (enum value yang sudah ada di tabel transaksi/tarif)
     */
    private function mapGateTypeToJenis(string $gateType): string
    {
        return match ($gateType) {
            'igd' => 'lainnya',
            default => $gateType,
        };
    }

    // ========================================================================
    // GATE MASUK (Self-Service Touchscreen)
    // ========================================================================

    /**
     * Tampilkan halaman Gate Masuk (layar sentuh).
     * URL: GET /gate/masuk/{gateType} — gateType: 'motor' | 'mobil'
     */
    public function showGateIn(string $gateType, TransaksiService $service)
    {
        // Validasi tipe gate
        if (!in_array($gateType, ['motor', 'mobil', 'igd'])) {
            abort(404, 'Gate tidak ditemukan.');
        }

        // Cek apakah gate aktif
        $gate = Gate::where('kode_gate', 'gate_in_' . $gateType)->first();
        if ($gate && !$gate->is_active) {
            return Inertia::render('Gate/GateDisabled', [
                'gateName' => $gate->nama_gate,
                'message'  => 'Gate ini sedang tidak aktif. Silakan gunakan gate lain.',
            ]);
        }

        // Map gate type ke jenis kendaraan DB
        $jenisKendaraan = $this->mapGateTypeToJenis($gateType);

        // Hitung kapasitas untuk jenis kendaraan ini
        $kapasitas = $service->getKapasitas($jenisKendaraan);

        return Inertia::render('Gate/GateInScreen', [
            'gateType'       => $gateType,
            'gateCode'       => 'gate_in_' . $gateType,
            'gateName'       => match ($gateType) {
                'motor' => 'Gate Masuk A — Roda 2 (Motor)',
                'mobil' => 'Gate Masuk B — Roda 4 (Mobil)',
                'igd'   => 'Gate Masuk C — IGD / Emergency',
            },
            'jenisKendaraan' => $jenisKendaraan,
            'kapasitas'      => $kapasitas,
        ]);
    }

    /**
     * Proses kendaraan masuk melalui gate otomatis.
     * Membuat transaksi baru, increment area, cetak karcis.
     */
    public function processGateIn(string $gateType, Request $request, TransaksiService $service)
    {
        // Validasi tipe gate
        if (!in_array($gateType, ['motor', 'mobil', 'igd'])) {
            abort(404);
        }

        // Validasi input — foto_masuk wajib untuk metode Kamera
        $request->validate([
            'plat_nomor'   => 'nullable|string|max:15',
            'metode_entry' => 'nullable|string|in:Kamera,QR,Manual',
            'foto_masuk'   => 'nullable|url|max:500', // URL Cloudinary dari frontend
        ]);

        // Map gate type ke jenis kendaraan DB ('igd' → 'lainnya')
        $jenisKendaraan = $this->mapGateTypeToJenis($gateType);
        $platNomor = $request->plat_nomor
            ? $service->sanitizePlatNomor($request->plat_nomor)
            : null;
        $fotoMasuk = $request->foto_masuk;

        // Cek VIP jika ada plat nomor (dari QR scan)
        $vip = null;
        $isVip = false;
        if ($platNomor) {
            $vip = Kendaraan::where('plat_nomor', $platNomor)->first();
            $isVip = $vip !== null;

            // Cek apakah kendaraan ini sudah punya sesi parkir aktif (belum keluar)
            $existingSession = Transaksi::where('plat_nomor', $platNomor)
                ->where('status', 'masuk')
                ->first();

            if ($existingSession) {
                return response()->json([
                    'status'  => 'error',
                    'message' => 'Kendaraan dengan plat ' . $platNomor . ' sudah berada di dalam area parkir. Silakan keluar terlebih dahulu.',
                ], 422);
            }
        }

        // Untuk pengguna umum (non-VIP): plat diisi '-' karena tidak ada input manual
        if (!$platNomor) {
            $platNomor = '-';
        }

        // Tentukan metode entry: VIP = QR, Umum = Kamera (default)
        $metodeEntry = $request->metode_entry ?? ($isVip ? 'QR' : 'Kamera');

        return DB::transaction(function () use ($jenisKendaraan, $platNomor, $gateType, $vip, $isVip, $metodeEntry, $fotoMasuk, $service) {
            // Cari area tersedia untuk jenis kendaraan ini
            $area = $service->getAvailableArea($jenisKendaraan);

            if (!$area) {
                return response()->json([
                    'status'  => 'error',
                    'message' => 'Maaf, area parkir untuk ' . $jenisKendaraan . ' sudah PENUH!',
                ], 422);
            }

            // Ambil tarif normal untuk jenis kendaraan
            $tarif = Tarif::where('jenis_kendaraan', $jenisKendaraan)
                ->where('tipe_tarif', 'normal')
                ->first();

            if (!$tarif) {
                return response()->json([
                    'status'  => 'error',
                    'message' => 'Tarif untuk ' . $jenisKendaraan . ' belum diatur oleh Admin.',
                ], 422);
            }

            // Buat transaksi baru — foto_masuk disimpan sebagai URL Cloudinary
            $transaksi = Transaksi::create([
                'id_user'           => auth()->id(),
                'id_area'           => $area->id_area,
                'id_tarif'          => $tarif->id_tarif,
                'id_kendaraan'      => $vip?->id_kendaraan,
                'jenis_kendaraan'   => $jenisKendaraan,
                'plat_nomor'        => $platNomor,
                'waktu_masuk'       => now(),
                'status'            => 'masuk',
                'metode_entry'      => $metodeEntry,
                'gate_type'         => 'gate_in_' . $gateType,
                'biaya_total'       => 0,
                'foto_masuk'        => $fotoMasuk,
            ]);

            // CATATAN: area_parkir.terisi otomatis di-increment oleh Trigger Database `tr_transaksi_masuk`
            // JANGAN manual increment di sini — akan menyebabkan double increment!

            // Catat log aktivitas
            $logMsg = "Kendaraan Masuk: {$platNomor} via Gate " . strtoupper($gateType);
            $logMsg .= " ({$metodeEntry})";
            $logMsg .= $isVip ? ' [VIP]' : '';
            if ($fotoMasuk) $logMsg .= ' [FOTO]';
            LogAktivitas::catat($logMsg);

            return response()->json([
                'status'  => 'success',
                'message' => $isVip
                    ? 'VIP Terverifikasi! Gerbang Terbuka.'
                    : 'Karcis Tercetak! Silakan Masuk.',
                'ticket'  => [
                    'id_parkir'       => $transaksi->id_parkir,
                    'plat_nomor'      => $platNomor,
                    'jenis_kendaraan' => $jenisKendaraan,
                    'waktu_masuk'     => $transaksi->waktu_masuk->format('d/m/Y H:i'),
                    'area_nama'       => $area->nama_area,
                    'gate_type'       => 'gate_in_' . $gateType,
                    'is_vip'          => $isVip,
                    'vip_name'        => $vip?->pemilik,
                    'tarif_per_jam'   => $tarif->tarif_per_jam,
                    'foto_masuk'      => $fotoMasuk,
                ],
            ]);
        });
    }

    /**
     * Verifikasi QR Code VIP (digunakan di Gate Masuk & Gate Keluar).
     */
    public function checkVip(Request $request, TransaksiService $service)
    {
        $request->validate(['plat_nomor' => 'required|string']);

        $platNomor = $service->sanitizePlatNomor($request->plat_nomor);
        $vip = Kendaraan::where('plat_nomor', $platNomor)->first();

        if (!$vip) {
            return response()->json([
                'status'  => 'not_found',
                'message' => 'Data VIP tidak ditemukan. QR tidak valid.'
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

        return response()->json([
            'status'  => 'success',
            'data'    => $vip->only(['plat_nomor', 'jenis_kendaraan', 'pemilik', 'warna']),
            'message' => 'VIP Terdeteksi!'
        ]);
    }

    // ========================================================================
    // GATE KELUAR (Cash + Cashless)
    // ========================================================================

    /**
     * Tampilkan halaman Gate Keluar.
     * URL: GET /gate/keluar/{gateNum} — gateNum: '1'-'4'
     */
    public function showGateOut(string $gateNum)
    {
        $config = self::GATE_OUT_CONFIG[$gateNum] ?? null;
        if (!$config) {
            abort(404, 'Gate tidak ditemukan.');
        }

        // Cek gate aktif
        $gate = Gate::where('kode_gate', $config['kode'])->first();
        if ($gate && !$gate->is_active) {
            return Inertia::render('Gate/GateDisabled', [
                'gateName' => $gate->nama_gate,
                'message'  => 'Gate ini sedang tidak aktif. Silakan gunakan gate lain.',
            ]);
        }

        // Ambil kendaraan yang sedang parkir (sesuai jenis kendaraan gate ini)
        $parkedVehicles = Transaksi::with(['tarif', 'area'])
            ->where('status', 'masuk')
            ->where('jenis_kendaraan', $config['jenis'])
            ->orderBy('waktu_masuk', 'asc')
            ->get();

        // Pilih view berdasarkan tipe pembayaran
        $view = $config['pembayaran'] === 'cash'
            ? 'Gate/GateOutCashScreen'
            : 'Gate/GateOutCashlessScreen';

        return Inertia::render($view, [
            'gateNum'          => $gateNum,
            'gateCode'         => $config['kode'],
            'gateName'         => $gate->nama_gate ?? "Gate Keluar {$gateNum}",
            'jenisKendaraan'   => $config['jenis'],
            'metodePembayaran' => $config['pembayaran'],
            'parkedVehicles'   => $parkedVehicles,
        ]);
    }

    /**
     * Scan karcis / cari plat nomor — menampilkan preview biaya.
     * Mendukung pencarian by id_parkir (barcode) atau plat_nomor.
     */
    public function scanTicket(string $gateNum, Request $request, TransaksiService $service)
    {
        $config = self::GATE_OUT_CONFIG[$gateNum] ?? null;
        if (!$config) {
            abort(404);
        }

        $request->validate([
            'search'         => 'required|string|max:50',
            'karcis_hilang'  => 'boolean',
        ]);

        $search = trim($request->search);
        $karcisHilang = $request->boolean('karcis_hilang', false);

        // Coba cari berdasarkan id_parkir dulu (barcode/QR karcis), lalu plat nomor
        $transaksi = null;

        if (is_numeric($search)) {
            // Input numerik = kemungkinan id_parkir dari scan karcis
            $transaksi = Transaksi::with(['tarif', 'area'])
                ->where('id_parkir', (int)$search)
                ->where('status', 'masuk')
                ->first();
        }

        if (!$transaksi) {
            // Fallback: cari by plat nomor (di-sanitasi)
            $searchPlat = $service->sanitizePlatNomor($search);
            $transaksi = Transaksi::with(['tarif', 'area'])
                ->where('plat_nomor', $searchPlat)
                ->where('status', 'masuk')
                ->latest()
                ->first();
        }

        if (!$transaksi) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Transaksi tidak ditemukan. Pastikan karcis/plat nomor benar.',
            ], 404);
        }

        // Hitung durasi dan biaya
        $waktuMasuk = Carbon::parse($transaksi->waktu_masuk);
        $waktuKeluar = now();
        $durasiJam = $service->hitungDurasiJam($waktuMasuk, $waktuKeluar);

        // Cek VIP
        $vip = Kendaraan::where('plat_nomor', $transaksi->plat_nomor)->first();
        $isVip = $vip !== null;

        // Hitung biaya berdasarkan kondisi
        if ($isVip) {
            $biaya = 0;
        } elseif ($karcisHilang) {
            $biaya = $service->hitungBiayaDenda($transaksi->jenis_kendaraan, $durasiJam, $transaksi);
        } else {
            $biaya = $service->hitungBiaya($transaksi, $durasiJam, false);
        }

        return response()->json([
            'status' => 'success',
            'data'   => [
                'transaksi'              => $transaksi,
                'durasi_jam'             => $durasiJam,
                'durasi_text'            => $waktuMasuk->diffForHumans($waktuKeluar, true),
                'biaya_total'            => $biaya,
                'is_vip'                 => $isVip,
                'karcis_hilang'          => $karcisHilang,
                'vip_data'               => $vip ? $vip->only(['plat_nomor', 'pemilik', 'jenis_kendaraan', 'warna']) : null,
                'waktu_masuk_formatted'  => $waktuMasuk->format('d M Y H:i'),
                'waktu_keluar_formatted' => $waktuKeluar->format('d M Y H:i'),
                'foto_masuk'             => $transaksi->foto_masuk, // URL foto saat masuk
            ],
        ]);
    }

    /**
     * Proses checkout Gate Keluar.
     * KEAMANAN: Biaya dihitung ulang di backend, BUKAN dari request frontend.
     */
    public function processGateOut(string $gateNum, Request $request, TransaksiService $service)
    {
        $config = self::GATE_OUT_CONFIG[$gateNum] ?? null;
        if (!$config) {
            abort(404);
        }

        $request->validate([
            'id_parkir'          => 'required|exists:transaksi,id_parkir',
            'uang_dibayar'       => 'nullable|numeric|min:0',
            'karcis_hilang'      => 'boolean',
            'metode_pembayaran'  => 'nullable|string|in:cash,cashless,vip',
            'foto_keluar'        => 'nullable|url|max:500', // URL foto Cloudinary saat keluar
        ]);

        return DB::transaction(function () use ($request, $service, $gateNum, $config) {
            // Lock transaksi untuk mencegah double checkout
            $transaksi = Transaksi::with('tarif')
                ->where('id_parkir', $request->id_parkir)
                ->lockForUpdate()
                ->firstOrFail();

            // Cegah double checkout
            if ($transaksi->status === 'keluar') {
                return response()->json(['message' => 'Transaksi ini sudah selesai.'], 400);
            }

            // KALKULASI ULANG di backend (zero-trust, tidak percaya data dari frontend)
            $waktuMasuk = Carbon::parse($transaksi->waktu_masuk);
            $waktuKeluar = now();
            $durasiJam = $service->hitungDurasiJam($waktuMasuk, $waktuKeluar);

            // Cek VIP
            $isVip = $service->isVip($transaksi->plat_nomor);
            $karcisHilang = $request->boolean('karcis_hilang', false);

            $metodePembayaran = $config['pembayaran'];
            $metodePembayaran = $request->metode_pembayaran ?? $metodePembayaran;
            if ($isVip) {
                $metodePembayaran = 'vip';
            }

            // KALKULASI via DATABASE (Stored Procedure)
            $waktuKeluarFormat = $waktuKeluar->format('Y-m-d H:i:s');
            DB::statement("CALL proses_checkout(?, ?, ?)", [
                $transaksi->id_parkir,
                $waktuKeluarFormat,
                $karcisHilang ? 1 : 0
            ]);

            // Refresh karena data dimutasi oleh DB
            $transaksi->refresh();
            
            // Override VIP jika diperlukan (karena prosedur tidak mengecek auth VIP_
            if ($isVip) {
                $transaksi->update(['biaya_total' => 0]);
                $biayaTotal = 0;
            } else {
                $biayaTotal = (int) $transaksi->biaya_total;
            }

            // Update field sisanya yang tidak ditangani prosedur
            $transaksi->update([
                'gate_type'         => $config['kode'],
                'metode_pembayaran' => $metodePembayaran,
                'foto_keluar'       => $request->foto_keluar,
            ]);

            // Catatan: AreaParkir otomatis di-decrement oleh Trigger Database `tr_transaksi_keluar`

            // Hitung kembalian (hanya untuk cash)
            $uangDibayar = $isVip ? 0 : ($request->uang_dibayar ?? $biayaTotal);
            $kembalian = max(0, $uangDibayar - $biayaTotal);

            // Catat log aktivitas
            $logMsg = "Checkout: {$transaksi->plat_nomor} via {$config['kode']}";
            if ($isVip) {
                $logMsg .= ' [VIP - Gratis]';
            } elseif ($karcisHilang) {
                $logMsg .= ' [KARCIS HILANG - Denda] (Rp ' . number_format($biayaTotal) . ')';
            } else {
                $logMsg .= " ({$metodePembayaran}) Rp " . number_format($biayaTotal);
            }
            LogAktivitas::catat($logMsg);

            return response()->json([
                'status'        => 'success',
                'message'       => 'Checkout Berhasil! Gerbang Terbuka.',
                'biaya_total'   => $biayaTotal,
                'kembalian'     => $kembalian,
                'is_vip'        => $isVip,
                'karcis_hilang' => $karcisHilang,
            ]);
        });
    }

    // ========================================================================
    // GATE KELUAR — CASHLESS QRIS (Gate 3 & 4)
    // ========================================================================

    /**
     * Generate QRIS untuk pembayaran cashless.
     * Dipanggil saat user menekan tombol "Bayar dengan QRIS" di frontend.
     *
     * Flow: Validasi input → Hitung biaya ulang (zero-trust) → Generate QRIS via DOKU
     */
    public function generateQris(string $gateNum, Request $request, TransaksiService $transaksiService, DokuPaymentService $dokuService)
    {
        // Validasi gate config
        $config = self::GATE_OUT_CONFIG[$gateNum] ?? null;
        if (!$config || $config['pembayaran'] !== 'cashless') {
            abort(404, 'Gate cashless tidak ditemukan.');
        }

        $request->validate([
            'id_parkir'     => 'required|exists:transaksi,id_parkir',
            'karcis_hilang' => 'boolean',
        ]);

        // Status karcis hilang dari frontend
        $karcisHilang = $request->boolean('karcis_hilang', false);

        try {
            // Ambil transaksi dan hitung biaya ulang (zero-trust)
            $transaksi = Transaksi::with('tarif')
                ->where('id_parkir', $request->id_parkir)
                ->where('status', 'masuk')
                ->firstOrFail();

            // Cegah generate QRIS jika sudah punya reference yang belum expired
            if ($transaksi->doku_reference_no) {
                Log::info('QRIS: Reference lama ditemukan, generate ulang', [
                    'old_ref' => $transaksi->doku_reference_no,
                ]);
            }

            // Hitung durasi dan biaya (kalkulasi server, bukan dari frontend)
            $waktuMasuk = Carbon::parse($transaksi->waktu_masuk);
            $durasiJam = $transaksiService->hitungDurasiJam($waktuMasuk, now());

            // Cek VIP
            $isVip = $transaksiService->isVip($transaksi->plat_nomor);

            // Hitung biaya berdasarkan kondisi (sama dengan logika di scanTicket)
            if ($isVip) {
                $biayaTotal = 0;
            } elseif ($karcisHilang) {
                // Karcis hilang: biaya parkir normal + denda flat
                $biayaTotal = $transaksiService->hitungBiayaDenda($transaksi->jenis_kendaraan, $durasiJam, $transaksi);
            } else {
                $biayaTotal = $transaksiService->hitungBiaya($transaksi, $durasiJam, false);
            }

            // VIP: langsung konfirmasi tanpa QRIS (gratis)
            if ($isVip || $biayaTotal <= 0) {
                $dokuService->confirmPayment($transaksi->id_parkir, $config['kode']);

                return response()->json([
                    'status' => 'vip_free',
                    'message' => 'VIP Terverifikasi! Gratis — Gate Terbuka.',
                ]);
            }

            // Simpan status karcis_hilang ke transaksi di DB
            $transaksi->update(['karcis_hilang' => $karcisHilang]);

            // Generate QRIS via DOKU API
            $qrisData = $dokuService->generateQris(
                $transaksi->id_parkir,
                $biayaTotal,
                $config['kode']
            );

            return response()->json([
                'status' => 'success',
                'qrContent' => $qrisData['qrContent'],
                'referenceNo' => $qrisData['referenceNo'],
                'expiredAt' => $qrisData['expiredAt'],
                'biaya_total' => $biayaTotal,
                'isSimulator' => $qrisData['isSimulator'] ?? false,
            ]);
        } catch (\Exception $e) {
            Log::error('QRIS Generate Error', [
                'id_parkir' => $request->id_parkir,
                'gate' => $gateNum,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Gagal membuat QRIS: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Cek status pembayaran QRIS (polling endpoint).
     * Frontend memanggil endpoint ini setiap 3 detik sampai pembayaran berhasil atau timeout.
     *
     * Jika pembayaran terdeteksi berhasil, otomatis jalankan confirmPayment().
     */
    public function checkQrisStatus(string $gateNum, Request $request, DokuPaymentService $dokuService)
    {
        $config = self::GATE_OUT_CONFIG[$gateNum] ?? null;
        if (!$config || $config['pembayaran'] !== 'cashless') {
            abort(404);
        }

        $request->validate([
            'reference_no' => 'required|string|max:100',
        ]);

        try {
            // Cek status ke DOKU API
            $status = $dokuService->checkPaymentStatus($request->reference_no);

            // Variabel biaya yang akan di-return ke frontend
            $confirmedBiaya = null;

            // Jika pembayaran berhasil, langsung konfirmasi di backend
            if ($status['isPaid']) {
                // Cari transaksi by reference
                $transaksi = Transaksi::where('doku_reference_no', $request->reference_no)->first();

                if ($transaksi && $transaksi->status !== 'keluar') {
                    // Baca karcis_hilang dari kolom transaksi di DB (di-set saat generate QRIS)
                    // confirmPayment() menghitung ulang biaya dan return biaya_total (int)
                    $confirmedBiaya = $dokuService->confirmPayment(
                        $transaksi->id_parkir,
                        $config['kode'],
                        (bool) $transaksi->karcis_hilang
                    );
                } else if ($transaksi && $transaksi->status === 'keluar') {
                    // Sudah diproses sebelumnya — ambil biaya dari DB
                    $confirmedBiaya = (int) $transaksi->biaya_total;
                }
            }

            return response()->json([
                'status' => 'success',
                'isPaid' => $status['isPaid'],
                'responseCode' => $status['responseCode'],
                'message' => $status['message'],
                'biaya_total' => $confirmedBiaya, // Biaya aktual hasil kalkulasi server
            ]);
        } catch (\Exception $e) {
            Log::error('QRIS Status Check Error', [
                'reference' => $request->reference_no,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'status' => 'error',
                'isPaid' => false,
                'message' => 'Gagal cek status: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Verifikasi VIP QR di gate keluar — juga mencari transaksi aktif.
     */
    public function checkVipExit(Request $request, TransaksiService $service)
    {
        $request->validate(['plat_nomor' => 'required|string']);

        $platNomor = $service->sanitizePlatNomor($request->plat_nomor);
        $vip = Kendaraan::where('plat_nomor', $platNomor)->first();

        if (!$vip) {
            return response()->json([
                'status'  => 'not_found',
                'message' => 'QR VIP tidak valid.',
            ], 404);
        }

        // Cari transaksi aktif untuk VIP ini
        $transaksi = Transaksi::with(['tarif', 'area'])
            ->where('plat_nomor', $platNomor)
            ->where('status', 'masuk')
            ->latest()
            ->first();

        if (!$transaksi) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Tidak ada transaksi aktif untuk VIP ini.',
            ], 404);
        }

        return response()->json([
            'status' => 'success',
            'data'   => [
                'transaksi' => $transaksi,
                'vip_data'  => $vip->only(['plat_nomor', 'pemilik', 'jenis_kendaraan', 'warna']),
            ],
        ]);
    }

    // ========================================================================
    // MANUAL OVERRIDE (Petugas / Admin Darurat)
    // ========================================================================

    /**
     * Buka gate secara manual (override darurat).
     * Hanya bisa diakses oleh admin/petugas yang login.
     */
    public function manualOpen(Request $request)
    {
        $request->validate([
            'gate_code' => 'required|string|exists:gates,kode_gate',
            'reason'    => 'nullable|string|max:255',
        ]);

        $gate = Gate::where('kode_gate', $request->gate_code)->firstOrFail();
        $reason = $request->reason ?? 'Tidak ada alasan';

        // Catat log keamanan
        LogAktivitas::catat("MANUAL OVERRIDE: {$gate->nama_gate} dibuka manual. Alasan: {$reason}");

        return response()->json([
            'status'  => 'success',
            'message' => "Gate {$gate->nama_gate} berhasil dibuka secara manual.",
        ]);
    }
}
