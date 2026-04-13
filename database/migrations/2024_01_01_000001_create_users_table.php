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
        Schema::create('users', function (Blueprint $table) {
            $table->id('id_user'); // ID User (Primary Key)
            $table->string('nama_lengkap'); // Nama Lengkap Pengguna
            $table->string('username')->unique(); // Username untuk Login
            $table->string('password'); // Password terenkripsi (Diff with standard Laravel uses 'password')
            $table->enum('role', ['admin', 'petugas', 'owner']); // Role pengguna
            $table->enum('status_aktif', ['aktif', 'nonaktif'])->default('aktif'); // Status akun pengguna
            $table->rememberToken(); // Token untuk fitur remember me
            $table->timestamps(); // Created at & Updated at
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};
