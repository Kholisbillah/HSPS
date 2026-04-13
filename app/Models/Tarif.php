<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Tarif extends Model
{
    use HasFactory;

    protected $table = 'tarif';
    protected $primaryKey = 'id_tarif';

    // Override agar Route Model Binding menggunakan id_tarif (bukan 'id' default)
    public function getRouteKeyName()
    {
        return 'id_tarif';
    }

    protected $fillable = [
        'jenis_kendaraan',
        'tarif_per_jam',
        'tarif_jam_selanjutnya', // Tarif per jam untuk jam ke-2 dst
        'tipe_tarif', // 'normal' atau 'denda' (karcis hilang)
    ];

    public function transaksi()
    {
        return $this->hasMany(Transaksi::class, 'id_tarif', 'id_tarif');
    }
}
