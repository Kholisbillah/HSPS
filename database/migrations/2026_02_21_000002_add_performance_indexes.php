<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tambah index pada kolom yang sering di-query untuk optimasi performa
 */
return new class extends Migration 
{
    public function up(): void
    {
        // Index pada tabel transaksi
        Schema::table('transaksi', function (Blueprint $table) {
            $table->index('plat_nomor'); // Digunakan di search Gate Out
            $table->index('status'); // Digunakan di hampir semua query filter
            $table->index('waktu_masuk'); // Digunakan di chart hourly traffic
            $table->index('waktu_keluar'); // Digunakan di laporan filter tanggal
        });

        // Index pada tabel kendaraan (unique constraint = plat harus unik)
        if (!$this->hasIndex('kendaraan', 'plat_nomor')) {
            Schema::table('kendaraan', function (Blueprint $table) {
                $table->unique('plat_nomor');
            });
        }

        // Index pada tabel log_aktivitas
        Schema::table('log_aktivitas', function (Blueprint $table) {
            $table->index('waktu_aktivitas'); // Digunakan untuk sorting latest
        });
    }

    public function down(): void
    {
        Schema::table('transaksi', function (Blueprint $table) {
            $table->dropIndex(['plat_nomor']);
            $table->dropIndex(['status']);
            $table->dropIndex(['waktu_masuk']);
            $table->dropIndex(['waktu_keluar']);
        });

        Schema::table('kendaraan', function (Blueprint $table) {
            $table->dropUnique(['plat_nomor']);
        });

        Schema::table('log_aktivitas', function (Blueprint $table) {
            $table->dropIndex(['waktu_aktivitas']);
        });
    }

    /**
     * Cek apakah index/unique constraint sudah ada pada kolom tertentu
     */
    private function hasIndex(string $table, string $column): bool
    {
        $indexes = Schema::getIndexes($table);
        foreach ($indexes as $index) {
            if (in_array($column, $index['columns'])) {
                return true;
            }
        }
        return false;
    }
};
