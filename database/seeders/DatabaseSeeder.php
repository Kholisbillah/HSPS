<?php

namespace Database\Seeders;

// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use App\Models\Tarif;
use App\Models\AreaParkir;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Create Users
        User::create([
            'nama_lengkap' => 'Admin System',
            'username' => 'admin',
            'password' => Hash::make('password'),
            'role' => 'admin',
            'status_aktif' => 'aktif', // Enum: sesuai skema database
        ]);

        User::create([
            'nama_lengkap' => 'Petugas Gate 1',
            'username' => 'petugas',
            'password' => Hash::make('password'),
            'role' => 'petugas',
            'status_aktif' => 'aktif', // Enum: sesuai skema database
        ]);

        User::create([
            'nama_lengkap' => 'Owner Hermina',
            'username' => 'owner',
            'password' => Hash::make('password'),
            'role' => 'owner',
            'status_aktif' => 'aktif', // Enum: sesuai skema database
        ]);

        // 2. Create Tarif
        Tarif::create([
            'jenis_kendaraan' => 'motor',
            'tarif_per_jam' => 2000,
        ]);

        Tarif::create([
            'jenis_kendaraan' => 'mobil',
            'tarif_per_jam' => 5000,
        ]);

        Tarif::create([
            'jenis_kendaraan' => 'lainnya',
            'tarif_per_jam' => 0, // Ambulans / Darurat
        ]);

        // 3. Create Area Parkir (dengan peruntukan kendaraan)
        AreaParkir::create([
            'nama_area' => 'Basement 1 - Motor Umum',
            'kapasitas' => 200,
            'terisi' => 0,
            'peruntukan' => 'motor',
        ]);

        AreaParkir::create([
            'nama_area' => 'Pelataran Depan - Mobil Umum',
            'kapasitas' => 50,
            'terisi' => 0,
            'peruntukan' => 'mobil',
        ]);

        AreaParkir::create([
            'nama_area' => 'Area VIP / Dokter',
            'kapasitas' => 20,
            'terisi' => 0,
            'peruntukan' => 'mobil',
        ]);

        AreaParkir::create([
            'nama_area' => 'IGD / Emergency Drop',
            'kapasitas' => 5,
            'terisi' => 0,
            'peruntukan' => 'semua',
        ]);
    }
}
