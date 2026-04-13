<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Kendaraan extends Model
{
    use HasFactory;

    protected $table = 'kendaraan';
    protected $primaryKey = 'id_kendaraan';

    // Override agar Route Model Binding menggunakan id_kendaraan (bukan 'id' default)
    public function getRouteKeyName()
    {
        return 'id_kendaraan';
    }

    protected $fillable = [
        'plat_nomor',
        'jenis_kendaraan',
        'warna',
        'pemilik',
        'id_user',
    ];

    public function owner()
    {
        return $this->belongsTo(User::class, 'id_user', 'id_user');
    }
}
