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
        Schema::create('log_aktivitas', function (Blueprint $table) {
            $table->id('id_log'); // ID Log (Primary Key)
            $table->foreignId('id_user')->constrained('users', 'id_user')->onDelete('cascade'); // ID User (FK ke users)
            $table->text('aktivitas'); // Deskripsi aktivitas
            $table->dateTime('waktu_aktivitas')->useCurrent(); // Waktu aktivitas terjadi
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('log_aktivitas');
    }
};
