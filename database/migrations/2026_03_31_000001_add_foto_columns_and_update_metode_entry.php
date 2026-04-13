<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

/**
 * Menambahkan kolom foto_masuk & foto_keluar ke tabel transaksi,
 * serta mengubah enum metode_entry: 'OCR' → 'Kamera'.
 *
 * Foto disimpan sebagai URL Cloudinary (varchar), bukan file binary.
 */
return new class extends Migration
{
    public function up(): void
    {
        // Tambah kolom foto_masuk dan foto_keluar
        Schema::table('transaksi', function (Blueprint $table) {
            $table->string('foto_masuk', 255)->nullable()->after('metode_pembayaran');
            $table->string('foto_keluar', 255)->nullable()->after('foto_masuk');
        });

        // Update data lama yang mungkin punya metode_entry = 'OCR'
        DB::table('transaksi')
            ->where('metode_entry', 'OCR')
            ->update(['metode_entry' => 'Manual']);

        // Ubah enum metode_entry: OCR diganti Kamera
        DB::statement("ALTER TABLE transaksi MODIFY COLUMN metode_entry ENUM('Kamera','QR','Manual') DEFAULT 'Manual'");
    }

    public function down(): void
    {
        // Kembalikan enum ke versi lama
        DB::statement("ALTER TABLE transaksi MODIFY COLUMN metode_entry ENUM('OCR','QR','Manual') DEFAULT 'Manual'");

        // Hapus kolom foto
        Schema::table('transaksi', function (Blueprint $table) {
            $table->dropColumn(['foto_masuk', 'foto_keluar']);
        });
    }
};
