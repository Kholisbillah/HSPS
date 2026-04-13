<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Migration: Menambahkan kolom doku_reference_no ke tabel transaksi
 * Kolom ini menyimpan partnerReferenceNo dari DOKU untuk tracking pembayaran QRIS
 * dan mencegah double payment.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('transaksi', function (Blueprint $table) {
            // Kolom referensi DOKU (nullable karena hanya diisi untuk transaksi cashless QRIS)
            $table->string('doku_reference_no', 100)->nullable()->after('metode_pembayaran');

            // Index untuk pencarian cepat saat webhook masuk
            $table->index('doku_reference_no', 'idx_doku_reference_no');
        });
    }

    public function down(): void
    {
        Schema::table('transaksi', function (Blueprint $table) {
            $table->dropIndex('idx_doku_reference_no');
            $table->dropColumn('doku_reference_no');
        });
    }
};
