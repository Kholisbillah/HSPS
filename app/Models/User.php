<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $primaryKey = 'id_user';

    // Override agar Route Model Binding menggunakan id_user (bukan 'id' default)
    public function getRouteKeyName()
    {
        return 'id_user';
    }

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'nama_lengkap',
        'username',
        'password',
        'role',
        'status_aktif',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'password' => 'hashed',
        // status_aktif: enum('aktif','nonaktif') — tidak di-cast, tetap string
    ];

    // Relationships

    public function logAktivitas()
    {
        return $this->hasMany(LogAktivitas::class , 'id_user', 'id_user');
    }

    public function kendaraan()
    {
        return $this->hasMany(Kendaraan::class , 'id_user', 'id_user');
    }

    public function transaksi()
    {
        return $this->hasMany(Transaksi::class , 'id_user', 'id_user');
    }
}
