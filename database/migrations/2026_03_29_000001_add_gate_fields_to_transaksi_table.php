<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Menambahkan kolom gate_type dan metode_pembayaran ke tabel transaksi
 * untuk mendukung flow multi-gate (2 gate masuk + 4 gate keluar).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('transaksi', function (Blueprint $table) {
            // Tipe gate: gate_in_motor, gate_in_mobil, gate_out_1-4
            $table->string('gate_type', 20)->nullable()->after('metode_entry');

            // Metode pembayaran: cash, cashless, vip
            $table->string('metode_pembayaran', 20)->nullable()->after('gate_type');
        });
    }

    public function down(): void
    {
        Schema::table('transaksi', function (Blueprint $table) {
            $table->dropColumn(['gate_type', 'metode_pembayaran']);
        });
    }
};
