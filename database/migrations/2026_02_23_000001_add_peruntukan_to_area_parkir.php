<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration 
{
    /**
     * Tambah kolom 'peruntukan' ke tabel area_parkir.
     * Menentukan jenis kendaraan yang boleh parkir di area tersebut.
     */
    public function up(): void
    {
        Schema::table('area_parkir', function (Blueprint $table) {
            // Kolom peruntukan: motor, mobil, atau semua (universal)
            $table->string('peruntukan', 10)->default('semua')->after('kapasitas');
        });
    }

    public function down(): void
    {
        Schema::table('area_parkir', function (Blueprint $table) {
            $table->dropColumn('peruntukan');
        });
    }
};
