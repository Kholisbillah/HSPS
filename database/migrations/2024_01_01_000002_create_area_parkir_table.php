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
        Schema::create('area_parkir', function (Blueprint $table) {
            $table->id('id_area'); // ID Area (Primary Key)
            $table->string('nama_area'); // Nama area parkir (Contoh: Basement, Gedung A)
            $table->integer('kapasitas'); // Kapasitas maksimal area
            $table->integer('terisi')->default(0); // Jumlah slot yang terisi saat ini
            $table->timestamps(); // Created at & Updated at
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('area_parkir');
    }
};
