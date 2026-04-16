<?php

namespace App\Services;

use App\Models\AreaParkir;
use App\Models\Kendaraan;
use App\Models\Tarif;
use App\Models\Transaksi;
use Carbon\Carbon;

/**
 * Service class untuk logika bisnis transaksi parkir.
 * Mengextract kalkulasi dari controller agar reusable dan testable.
 */
class TransaksiService
{
    /**
     * Menghitung durasi parkir dalam jam (pembulatan ke atas, minimum 1 jam).
     *
     * @param Carbon $waktuMasuk Waktu kendaraan masuk
     * @param Carbon $waktuKeluar Waktu kendaraan keluar
     * @return int Durasi dalam jam (min. 1)
     */
    public function hitungDurasiJam(Carbon $waktuMasuk, Carbon $waktuKeluar): int
    {
        // Hitung selisih jam penuh
        $durasiJam = $waktuMasuk->diffInHours($waktuKeluar);

        // Cek sisa menit — jika ada sisa, bulatkan ke atas
        $minutes = $waktuMasuk->diffInMinutes($waktuKeluar) % 60;
        if ($minutes > 0) {
            $durasiJam++;
        }

        // Minimum parkir 1 jam
        return max($durasiJam, 1);
    }

    /**
     * Menghitung biaya parkir berdasarkan tarif dari DATABASE.
     * VIP mendapat tarif gratis (Rp 0) — mencegah pungli.
     *
     * @param Transaksi $transaksi Data transaksi parkir
     * @param int $durasiJam Durasi parkir dalam jam
     * @param bool $isVip Apakah kendaraan terdaftar sebagai VIP
     * @return int Biaya total dalam Rupiah
     */
    public function hitungBiaya(Transaksi $transaksi, int $durasiJam, bool $isVip): int
    {
        // VIP selalu gratis sesuai Security Checklist Poin 6
        if ($isVip) {
            return 0;
        }

        // Ambil tarif dari relasi transaksi
        $tarif = $transaksi->tarif;

        if (!$tarif) {
            // Fallback: cari berdasarkan jenis kendaraan jika relasi kosong
            $tarif = Tarif::where('jenis_kendaraan', $transaksi->jenis_kendaraan)
                ->where('tipe_tarif', 'normal')
                ->first();
        }

        // Safety: jika tarif tidak ditemukan, kembalikan 0
        if (!$tarif) {
            return 0;
        }

        // Kalkulasi progresif: jam pertama berbeda dengan jam selanjutnya
        $tarifJamPertama = (int)$tarif->tarif_per_jam;
        $tarifJamSelanjutnya = (int)($tarif->tarif_jam_selanjutnya ?? 0);

        // Jika tarif jam selanjutnya belum diisi (0), fallback ke tarif_per_jam (flat rate)
        if ($tarifJamSelanjutnya <= 0) {
            $tarifJamSelanjutnya = $tarifJamPertama;
        }

        // Minimum parkir 1 jam — hanya dikenakan tarif jam pertama
        if ($durasiJam <= 1) {
            return $tarifJamPertama;
        }

        // Jam pertama + (sisa jam × tarif jam selanjutnya)
        return $tarifJamPertama + ($tarifJamSelanjutnya * ($durasiJam - 1));
    }

    /**
     * Menghitung biaya denda karcis hilang (tarif flat, BUKAN per jam).
     * Ditambahkan di atas biaya parkir normal.
     *
     * @param string $jenisKendaraan Jenis kendaraan (motor/mobil)
     * @param int $durasiJam Durasi parkir untuk menghitung biaya normal
     * @param Transaksi|null $transaksi Transaksi untuk menghitung biaya parkir normal
     * @return int Total biaya = biaya parkir normal + denda flat
     */
    public function hitungBiayaDenda(string $jenisKendaraan, int $durasiJam = 0, ?Transaksi $transaksi = null): int
    {
        // Ambil tarif denda dari database
        $tarifDenda = Tarif::where('jenis_kendaraan', $jenisKendaraan)
            ->where('tipe_tarif', 'denda')
            ->first();

        $denda = $tarifDenda ? (int)$tarifDenda->tarif_per_jam : 0;

        // Jika ada transaksi, tambahkan biaya parkir normal
        $biayaNormal = 0;
        if ($transaksi && $durasiJam > 0) {
            $biayaNormal = $this->hitungBiaya($transaksi, $durasiJam, false);
        }

        // Total = biaya parkir normal + denda flat
        return $biayaNormal + $denda;
    }

    /**
     * Cek apakah plat nomor terdaftar sebagai VIP di tabel kendaraan.
     *
     * @param string $platNomor Plat nomor kendaraan (sudah disanitasi)
     * @return bool True jika terdaftar sebagai VIP
     */
    public function isVip(string $platNomor): bool
    {
        return Kendaraan::where('plat_nomor', $platNomor)->exists();
    }

    /**
     * Ambil data VIP berdasarkan plat nomor.
     * Hanya return field yang aman (tanpa id_user).
     *
     * @param string $platNomor Plat nomor kendaraan
     * @return array|null Data VIP atau null jika tidak ditemukan
     */
    public function getVipData(string $platNomor): ?array
    {
        $vip = Kendaraan::where('plat_nomor', $platNomor)->first();

        return $vip
            ? $vip->only(['plat_nomor', 'pemilik', 'jenis_kendaraan', 'warna'])
            : null;
    }

    /**
     * Cari area parkir yang tersedia untuk jenis kendaraan tertentu.
     * Menggunakan lockForUpdate untuk keamanan transaksi.
     *
     * @param string $jenisKendaraan Jenis kendaraan (motor/mobil)
     * @return AreaParkir|null Area yang tersedia atau null jika penuh
     */
    public function getAvailableArea(string $jenisKendaraan): ?AreaParkir
    {
        return AreaParkir::where('peruntukan', $jenisKendaraan)
            ->whereRaw('terisi < kapasitas')
            ->lockForUpdate()
            ->first();
    }

    /**
     * Hitung total kapasitas dan ketersediaan per jenis kendaraan.
     *
     * @param string $jenisKendaraan Jenis kendaraan (motor/mobil)
     * @return array ['total' => int, 'terisi' => int, 'tersedia' => int]
     */
    public function getKapasitas(string $jenisKendaraan): array
    {
        $data = AreaParkir::where('peruntukan', $jenisKendaraan)
            ->selectRaw('COALESCE(SUM(kapasitas), 0) as total, COALESCE(SUM(terisi), 0) as terisi')
            ->first();

        return [
            'total'     => (int)$data->total,
            'terisi'    => (int)$data->terisi,
            'tersedia'  => max(0, (int)$data->total - (int)$data->terisi),
        ];
    }

    /**
     * Sanitasi plat nomor: uppercase + hapus karakter non-alfanumerik.
     * Sesuai Security Checklist Poin 2A.
     *
     * @param string $platNomor Input plat nomor mentah
     * @return string Plat nomor yang sudah disanitasi
     */
    public function sanitizePlatNomor(string $platNomor): string
    {
        // Uppercase dulu, lalu hapus karakter non-alfanumerik
        return preg_replace('/[^A-Z0-9]/', '', strtoupper($platNomor));
    }
}
