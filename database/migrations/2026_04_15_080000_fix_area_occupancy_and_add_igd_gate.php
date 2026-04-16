<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Fix area occupancy double increment dan tambah gate IGD.
     *
     * Masalah:
     * 1. Backend `$area->increment('terisi')` + Trigger `tr_transaksi_masuk` = double increment
     *    → Solusi: hapus manual increment di PHP, reset terisi berdasarkan hitungan aktual
     * 2. Area IGD (peruntukan 'semua') ikut terpilih saat motor/mobil masuk
     *    → Solusi: ubah peruntukan 'semua' ke 'lainnya', hapus logic OR 'semua' di PHP
     * 3. Belum ada gate khusus IGD
     *    → Solusi: tambah gate_in_igd dan gate_out_5
     */
    public function up(): void
    {
        // 1. Sync area_parkir.terisi berdasarkan hitungan AKTUAL transaksi masuk
        //    Ini memperbaiki selisih akibat double increment sebelumnya
        DB::statement("
            UPDATE area_parkir ap
            SET ap.terisi = (
                SELECT COUNT(*)
                FROM transaksi t
                WHERE t.id_area = ap.id_area AND t.status = 'masuk'
            )
        ");

        // 2. Alter gates.jenis_kendaraan enum → tambah 'lainnya' untuk IGD
        DB::statement("ALTER TABLE gates MODIFY jenis_kendaraan ENUM('motor','mobil','semua','lainnya') NOT NULL");

        // 3. Update area IGD: peruntukan 'semua' → 'lainnya' (khusus ambulan/IGD)
        DB::statement("UPDATE area_parkir SET peruntukan = 'lainnya' WHERE peruntukan = 'semua'");

        // 4. Insert gate masuk IGD
        DB::table('gates')->insert([
            'kode_gate'          => 'gate_in_igd',
            'nama_gate'          => 'Gate Masuk C — IGD / Emergency',
            'jenis_kendaraan'    => 'lainnya',
            'direction'          => 'masuk',
            'metode_pembayaran'  => null,
            'is_active'          => 1,
            'created_at'         => now(),
            'updated_at'         => now(),
        ]);

        // 5. Insert gate keluar IGD (1 gate saja, gratis — tidak perlu cash/cashless)
        DB::table('gates')->insert([
            'kode_gate'          => 'gate_out_5',
            'nama_gate'          => 'Gate Keluar 5 — IGD / Emergency',
            'jenis_kendaraan'    => 'lainnya',
            'direction'          => 'keluar',
            'metode_pembayaran'  => 'cash',
            'is_active'          => 1,
            'created_at'         => now(),
            'updated_at'         => now(),
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Hapus gate IGD
        DB::table('gates')->where('kode_gate', 'gate_in_igd')->delete();
        DB::table('gates')->where('kode_gate', 'gate_out_5')->delete();

        // Kembalikan area IGD ke peruntukan 'semua'
        DB::statement("UPDATE area_parkir SET peruntukan = 'semua' WHERE peruntukan = 'lainnya'");

        // Kembalikan enum gates
        DB::statement("ALTER TABLE gates MODIFY jenis_kendaraan ENUM('motor','mobil','semua') NOT NULL");

        // Sync ulang terisi
        DB::statement("
            UPDATE area_parkir ap
            SET ap.terisi = (
                SELECT COUNT(*)
                FROM transaksi t
                WHERE t.id_area = ap.id_area AND t.status = 'masuk'
            )
        ");
    }
};
