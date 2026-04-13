<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Menambahkan kolom tarif_jam_selanjutnya ke tabel tarif.
 * Kolom ini menyimpan tarif per jam untuk jam ke-2 dan seterusnya.
 * tarif_per_jam sekarang berfungsi sebagai "Tarif Jam Pertama".
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tarif', function (Blueprint $table) {
            // Tarif untuk jam ke-2 dan seterusnya (default 0 agar backward compatible)
            $table->decimal('tarif_jam_selanjutnya', 10, 2)->default(0)->after('tarif_per_jam');
        });
    }

    public function down(): void
    {
        Schema::table('tarif', function (Blueprint $table) {
            $table->dropColumn('tarif_jam_selanjutnya');
        });
    }
};
