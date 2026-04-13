<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Mengubah AUTO_INCREMENT tabel transaksi agar id_parkir dimulai dari prefix 801xxxx.
 * Tujuan: membuat nomor karcis parkir terlihat lebih profesional dan unik,
 * bukan urutan biasa (1, 2, 3...) melainkan (8010001, 8010002, 8010003...).
 */
return new class extends Migration
{
    public function up(): void
    {
        // Set AUTO_INCREMENT ke 8010001 (prefix 801 + urutan 4 digit)
        DB::statement('ALTER TABLE transaksi AUTO_INCREMENT = 8010001');
    }

    public function down(): void
    {
        // Kembalikan ke nilai setelah data terakhir saat ini
        // Cari id_parkir terbesar yang ada di tabel
        $maxId = DB::table('transaksi')->max('id_parkir') ?? 0;
        DB::statement('ALTER TABLE transaksi AUTO_INCREMENT = ' . ($maxId + 1));
    }
};
