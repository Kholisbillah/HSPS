<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LogAktivitas extends Model
{
    use HasFactory;

    protected $table = 'log_aktivitas';
    protected $primaryKey = 'id_log';
    public $timestamps = false; // Karena hanya ada waktu_aktivitas

    protected $fillable = [
        'id_user',
        'aktivitas',
        'waktu_aktivitas',
    ];

    protected $casts = [
        'waktu_aktivitas' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'id_user', 'id_user');
    }

    /**
     * Helper untuk mencatat log aktivitas
     */
    public static function catat($aktivitas)
    {
        // Guard: skip logging jika user tidak terautentikasi (kolom id_user NOT NULL di DB)
        if (!auth()->check()) {
            return;
        }

        self::create([
            'id_user' => auth()->id(),
            'aktivitas' => $aktivitas,
            'waktu_aktivitas' => now(),
        ]);
    }
}
