<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Migration: Mengubah tipe data tarif_per_jam dari decimal(10,2) ke decimal(10,0)
 * Alasan: Sesuai skema UKK yang menggunakan decimal(10,0)
 * Tarif parkir di Indonesia selalu bilangan bulat (tanpa desimal)
 */
return new class extends Migration 
{
    public function up(): void
    {
        Schema::table('tarif', function (Blueprint $table) {
            $table->decimal('tarif_per_jam', 10, 0)->change();
        });

        // Ubah juga biaya_total di transaksi agar konsisten
        Schema::table('transaksi', function (Blueprint $table) {
            $table->decimal('biaya_total', 10, 0)->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('tarif', function (Blueprint $table) {
            $table->decimal('tarif_per_jam', 10, 2)->change();
        });

        Schema::table('transaksi', function (Blueprint $table) {
            $table->decimal('biaya_total', 10, 2)->nullable()->change();
        });
    }
};
