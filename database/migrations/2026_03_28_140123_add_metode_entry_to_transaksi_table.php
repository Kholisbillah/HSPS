<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Menambahkan kolom metode_entry ke tabel transaksi
     * untuk mencatat cara input plat nomor (OCR/QR/Manual).
     */
    public function up(): void
    {
        Schema::table('transaksi', function (Blueprint $table) {
            $table->enum('metode_entry', ['OCR', 'QR', 'Manual'])
                  ->default('Manual')
                  ->after('status');
        });
    }

    /**
     * Rollback: hapus kolom metode_entry.
     */
    public function down(): void
    {
        Schema::table('transaksi', function (Blueprint $table) {
            $table->dropColumn('metode_entry');
        });
    }
};
