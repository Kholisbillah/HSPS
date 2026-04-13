<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * BUG-07 Fix: Menambahkan kolom jenis_kendaraan ke tabel transaksi.
 * Kolom ini digunakan oleh TransaksiController@storeGateIn() tapi belum ada di migration awal.
 */
return new class extends Migration 
{
    public function up(): void
    {
        Schema::table('transaksi', function (Blueprint $table) {
            // Menambahkan kolom jenis_kendaraan setelah plat_nomor
            $table->enum('jenis_kendaraan', ['motor', 'mobil', 'lainnya'])
                ->nullable()
                ->after('plat_nomor');
        });
    }

    public function down(): void
    {
        Schema::table('transaksi', function (Blueprint $table) {
            $table->dropColumn('jenis_kendaraan');
        });
    }
};
