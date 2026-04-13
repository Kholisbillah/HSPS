<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('transaksi', function (Blueprint $table) {
            $table->id('id_transaksi'); // ID Transaksi (Primary Key)
            $table->foreignId('id_tarif')->constrained('tarif', 'id_tarif')->onDelete('restrict'); // ID Tarif (FK ke tarif)
            $table->foreignId('id_area')->constrained('area_parkir', 'id_area')->onDelete('restrict'); // ID Area (FK ke area_parkir)
            $table->foreignId('id_user')->constrained('users', 'id_user')->onDelete('restrict'); // ID User (Petugas) (FK ke users)
            $table->string('plat_nomor'); // Plat nomor kendaraan
            $table->dateTime('waktu_masuk'); // Waktu masuk kendaraan
            $table->dateTime('waktu_keluar')->nullable(); // Waktu keluar kendaraan (Nullable saat masuk)
            $table->integer('durasi_jam')->nullable(); // Durasi parkir dalam jam
            $table->decimal('biaya_total', 10, 2)->nullable(); // Biaya total parkir
            $table->enum('status', ['masuk', 'keluar']); // Status transaksi
            $table->timestamps(); // Created at & Updated at
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('transaksi');
    }
};
