<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

/**
 * Seeder untuk menambahkan akun gate dedicated.
 * Akun ini digunakan sebagai "petugas virtual" untuk perangkat gate otomatis.
 */
class GateAccountSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();

        // Cek apakah akun sudah ada, jika belum buat
        $accounts = [
            [
                'username'     => 'gate-motor',
                'nama_lengkap' => 'Sistem Gate Motor',
                'password'     => Hash::make('gate-motor-2026!'),
                'role'         => 'petugas',
                'status_aktif' => 1,
                'created_at'   => $now,
                'updated_at'   => $now,
            ],
            [
                'username'     => 'gate-mobil',
                'nama_lengkap' => 'Sistem Gate Mobil',
                'password'     => Hash::make('gate-mobil-2026!'),
                'role'         => 'petugas',
                'status_aktif' => 1,
                'created_at'   => $now,
                'updated_at'   => $now,
            ],
        ];

        foreach ($accounts as $account) {
            // Gunakan updateOrInsert agar tidak duplikat jika di-run ulang
            $exists = DB::table('users')->where('username', $account['username'])->exists();

            if (!$exists) {
                DB::table('users')->insert($account);
                $this->command->info("✅ Akun gate '{$account['username']}' berhasil dibuat.");
            } else {
                $this->command->info("⚡ Akun gate '{$account['username']}' sudah ada, dilewati.");
            }
        }
    }
}
