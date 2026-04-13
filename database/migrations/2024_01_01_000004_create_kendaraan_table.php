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
        Schema::create('kendaraan', function (Blueprint $table) {
            $table->id('id_kendaraan'); // ID Kendaraan (Primary Key)
            $table->string('plat_nomor'); // Nomor Plat Kendaraan
            $table->enum('jenis_kendaraan', ['motor', 'mobil', 'lainnya']); // Jenis Kendaraan
            $table->string('warna'); // Warna Kendaraan
            $table->string('pemilik'); // Nama Pemilik
            $table->foreignId('id_user')->constrained('users', 'id_user')->onDelete('cascade'); // ID User (FK ke users)
            $table->timestamps(); // Created at & Updated at
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('kendaraan');
    }
};
