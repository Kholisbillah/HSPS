<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

/**
 * Menambahkan kolom tipe_tarif ke tabel tarif untuk mendukung tarif denda karcis hilang.
 * Juga menyisipkan data tarif denda (flat rate).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tarif', function (Blueprint $table) {
            // Tipe tarif: 'normal' (default) atau 'denda' (karcis hilang)
            $table->enum('tipe_tarif', ['normal', 'denda'])->default('normal')->after('tarif_per_jam');
        });

        // Sisipkan tarif denda flat rate (sesuai keputusan user)
        DB::table('tarif')->insert([
            [
                'jenis_kendaraan' => 'motor',
                'tarif_per_jam'   => 20000, // Rp 20.000 flat (bukan per jam)
                'tipe_tarif'      => 'denda',
                'created_at'      => now(),
                'updated_at'      => now(),
            ],
            [
                'jenis_kendaraan' => 'mobil',
                'tarif_per_jam'   => 50000, // Rp 50.000 flat (bukan per jam)
                'tipe_tarif'      => 'denda',
                'created_at'      => now(),
                'updated_at'      => now(),
            ],
        ]);
    }

    public function down(): void
    {
        // Hapus tarif denda terlebih dahulu
        DB::table('tarif')->where('tipe_tarif', 'denda')->delete();

        Schema::table('tarif', function (Blueprint $table) {
            $table->dropColumn('tipe_tarif');
        });
    }
};
