<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

/**
 * Migration untuk menyesuaikan tabel transaksi dengan schema UKK:
 * 1. Rename PK id_transaksi → id_parkir (menggunakan CHANGE COLUMN untuk MariaDB)
 * 2. Tambah FK id_kendaraan (nullable) untuk kendaraan member
 *
 * Migration ini idempotent — aman dijalankan ulang jika sebelumnya gagal sebagian.
 */
return new class extends Migration 
{
    public function up(): void
    {
        // 1. Rename PK (skip jika sudah di-rename dari attempt sebelumnya)
        if (Schema::hasColumn('transaksi', 'id_transaksi')) {
            DB::statement('ALTER TABLE `transaksi` CHANGE `id_transaksi` `id_parkir` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT');
        }

        // 2. Tambah kolom id_kendaraan (skip jika sudah ada dari attempt sebelumnya)
        if (!Schema::hasColumn('transaksi', 'id_kendaraan')) {
            Schema::table('transaksi', function (Blueprint $table) {
                $table->unsignedBigInteger('id_kendaraan')->nullable()->after('id_user');
            });
        }

        // 3. Tambah FK constraint (skip jika sudah ada)
        // Cek apakah foreign key sudah ada
        $fkExists = DB::select("
            SELECT CONSTRAINT_NAME FROM information_schema.TABLE_CONSTRAINTS
            WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_NAME = 'transaksi'
            AND CONSTRAINT_NAME = 'transaksi_id_kendaraan_foreign'
        ");

        if (empty($fkExists)) {
            Schema::table('transaksi', function (Blueprint $table) {
                $table->foreign('id_kendaraan')
                    ->references('id_kendaraan')
                    ->on('kendaraan')
                    ->onDelete('set null');
            });
        }
    }

    public function down(): void
    {
        // Drop FK jika ada
        $fkExists = DB::select("
            SELECT CONSTRAINT_NAME FROM information_schema.TABLE_CONSTRAINTS
            WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_NAME = 'transaksi'
            AND CONSTRAINT_NAME = 'transaksi_id_kendaraan_foreign'
        ");

        if (!empty($fkExists)) {
            Schema::table('transaksi', function (Blueprint $table) {
                $table->dropForeign(['id_kendaraan']);
            });
        }

        if (Schema::hasColumn('transaksi', 'id_kendaraan')) {
            Schema::table('transaksi', function (Blueprint $table) {
                $table->dropColumn('id_kendaraan');
            });
        }

        // Rename kembali
        if (Schema::hasColumn('transaksi', 'id_parkir')) {
            DB::statement('ALTER TABLE `transaksi` CHANGE `id_parkir` `id_transaksi` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT');
        }
    }
};
