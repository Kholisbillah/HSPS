<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Model untuk konfigurasi gate parkir.
 * Menyimpan status aktif/nonaktif dan tipe setiap gate.
 */
class Gate extends Model
{
    use HasFactory;

    protected $table = 'gates';
    protected $primaryKey = 'id_gate';

    // Route Model Binding menggunakan kode_gate
    public function getRouteKeyName()
    {
        return 'kode_gate';
    }

    protected $fillable = [
        'kode_gate',
        'nama_gate',
        'jenis_kendaraan',
        'direction',
        'metode_pembayaran',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    /**
     * Scope: hanya gate yang aktif
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope: gate masuk saja
     */
    public function scopeMasuk($query)
    {
        return $query->where('direction', 'masuk');
    }

    /**
     * Scope: gate keluar saja
     */
    public function scopeKeluar($query)
    {
        return $query->where('direction', 'keluar');
    }
}
