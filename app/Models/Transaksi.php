<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Transaksi extends Model
{
    use HasFactory;

    protected $table = 'transaksi';
    protected $primaryKey = 'id_parkir'; // Sesuai schema UKK: PK = id_parkir

    protected $fillable = [
        'id_tarif',
        'id_area',
        'id_user',
        'id_kendaraan', // FK ke tabel kendaraan (nullable untuk non-VIP)
        'plat_nomor',
        'jenis_kendaraan',
        'waktu_masuk',
        'waktu_keluar',
        'durasi_jam',
        'biaya_total',
        'status',
        'metode_entry', // Kamera, QR, atau Manual
        'gate_type', // gate_in_motor, gate_in_mobil, gate_out_1-4
        'metode_pembayaran', // cash, cashless, vip
        'doku_reference_no', // Referensi pembayaran DOKU QRIS (partnerReferenceNo)
        'karcis_hilang', // Flag karcis hilang (boolean: true = kena denda)
        'foto_masuk', // URL foto Cloudinary saat kendaraan masuk
        'foto_keluar', // URL foto Cloudinary saat kendaraan keluar
    ];

    protected $casts = [
        'waktu_masuk' => 'datetime',
        'waktu_keluar' => 'datetime',
        'karcis_hilang' => 'boolean',
    ];

    public function tarif()
    {
        return $this->belongsTo(Tarif::class , 'id_tarif', 'id_tarif');
    }

    public function area()
    {
        return $this->belongsTo(AreaParkir::class , 'id_area', 'id_area');
    }

    public function petugas()
    {
        return $this->belongsTo(User::class , 'id_user', 'id_user');
    }

    // Relasi ke tabel kendaraan (VIP)
    public function kendaraan()
    {
        return $this->belongsTo(Kendaraan::class , 'id_kendaraan', 'id_kendaraan');
    }
}
