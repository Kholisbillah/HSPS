<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AreaParkir extends Model
{
    use HasFactory;

    protected $table = 'area_parkir';
    protected $primaryKey = 'id_area';

    // Override agar Route Model Binding menggunakan id_area (bukan 'id' default)
    public function getRouteKeyName()
    {
        return 'id_area';
    }

    protected $fillable = [
        'nama_area',
        'kapasitas',
        'terisi',
        'peruntukan',
    ];

    public function transaksi()
    {
        return $this->hasMany(Transaksi::class , 'id_area', 'id_area');
    }
}
