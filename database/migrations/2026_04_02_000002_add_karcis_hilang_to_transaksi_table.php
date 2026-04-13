<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Menambahkan kolom karcis_hilang ke tabel transaksi.
 * Kolom ini menandai apakah karcis parkir hilang saat checkout,
 * sehingga sistem bisa menerapkan tarif denda (flat penalty).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('transaksi', function (Blueprint $table) {
            // Boolean flag: false = karcis ada, true = karcis hilang (kena denda)
            $table->boolean('karcis_hilang')->default(false)->after('metode_pembayaran');
        });
    }

    public function down(): void
    {
        Schema::table('transaksi', function (Blueprint $table) {
            $table->dropColumn('karcis_hilang');
        });
    }
};
