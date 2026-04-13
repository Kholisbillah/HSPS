<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

/**
 * Membuat tabel gates untuk konfigurasi gate parkir.
 * Menyisipkan 6 gate default: 2 gate masuk + 4 gate keluar.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('gates', function (Blueprint $table) {
            $table->id('id_gate');
            $table->string('kode_gate', 20)->unique();           // Identifier unik gate
            $table->string('nama_gate', 100);                     // Nama tampilan gate
            $table->enum('jenis_kendaraan', ['motor', 'mobil', 'semua']);
            $table->enum('direction', ['masuk', 'keluar']);        // Arah gate
            $table->string('metode_pembayaran', 20)->nullable();  // null=masuk, cash/cashless=keluar
            $table->boolean('is_active')->default(true);          // Status aktif gate
            $table->timestamps();
        });

        // Seed 6 gate default
        $now = now();
        DB::table('gates')->insert([
            [
                'kode_gate'         => 'gate_in_motor',
                'nama_gate'         => 'Gate Masuk A — Roda 2 (Motor)',
                'jenis_kendaraan'   => 'motor',
                'direction'         => 'masuk',
                'metode_pembayaran' => null,
                'is_active'         => true,
                'created_at'        => $now,
                'updated_at'        => $now,
            ],
            [
                'kode_gate'         => 'gate_in_mobil',
                'nama_gate'         => 'Gate Masuk B — Roda 4 (Mobil)',
                'jenis_kendaraan'   => 'mobil',
                'direction'         => 'masuk',
                'metode_pembayaran' => null,
                'is_active'         => true,
                'created_at'        => $now,
                'updated_at'        => $now,
            ],
            [
                'kode_gate'         => 'gate_out_1',
                'nama_gate'         => 'Gate Keluar 1 — Roda 2, Cash',
                'jenis_kendaraan'   => 'motor',
                'direction'         => 'keluar',
                'metode_pembayaran' => 'cash',
                'is_active'         => true,
                'created_at'        => $now,
                'updated_at'        => $now,
            ],
            [
                'kode_gate'         => 'gate_out_2',
                'nama_gate'         => 'Gate Keluar 2 — Roda 4, Cash',
                'jenis_kendaraan'   => 'mobil',
                'direction'         => 'keluar',
                'metode_pembayaran' => 'cash',
                'is_active'         => true,
                'created_at'        => $now,
                'updated_at'        => $now,
            ],
            [
                'kode_gate'         => 'gate_out_3',
                'nama_gate'         => 'Gate Keluar 3 — Roda 2, Cashless',
                'jenis_kendaraan'   => 'motor',
                'direction'         => 'keluar',
                'metode_pembayaran' => 'cashless',
                'is_active'         => true,
                'created_at'        => $now,
                'updated_at'        => $now,
            ],
            [
                'kode_gate'         => 'gate_out_4',
                'nama_gate'         => 'Gate Keluar 4 — Roda 4, Cashless',
                'jenis_kendaraan'   => 'mobil',
                'direction'         => 'keluar',
                'metode_pembayaran' => 'cashless',
                'is_active'         => true,
                'created_at'        => $now,
                'updated_at'        => $now,
            ],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('gates');
    }
};
