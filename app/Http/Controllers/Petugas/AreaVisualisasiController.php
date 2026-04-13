<?php

namespace App\Http\Controllers\Petugas;

use App\Http\Controllers\Controller;
use App\Models\AreaParkir;
use App\Models\Transaksi;
use Inertia\Inertia;

class AreaVisualisasiController extends Controller
{
    /**
     * Halaman visualisasi area parkir real-time.
     * Menampilkan peta slot parkir, okupansi per area, dan daftar kendaraan parkir.
     */
    public function index()
    {
        // 1. Ambil semua area parkir dengan statistik okupansi
        $areas = AreaParkir::select('id_area', 'nama_area', 'kapasitas', 'terisi', 'peruntukan')
            ->get()
            ->map(fn($area) => [
        'id_area' => $area->id_area,
        'nama_area' => $area->nama_area,
        'kapasitas' => $area->kapasitas,
        'terisi' => $area->terisi,
        'peruntukan' => $area->peruntukan,
        'sisa_slot' => $area->kapasitas - $area->terisi,
        'persen' => $area->kapasitas > 0
        ? round(($area->terisi / $area->kapasitas) * 100)
        : 0,
        ]);

        // 2. Ambil kendaraan yang sedang parkir (status = 'masuk')
        $parkedVehicles = Transaksi::with('kendaraan')
            ->where('status', 'masuk')
            ->orderBy('waktu_masuk', 'desc')
            ->get()
            ->map(fn($t) => [
        'id_parkir' => $t->id_parkir,
        'plat_nomor' => $t->plat_nomor,
        'jenis_kendaraan' => $t->jenis_kendaraan,
        'waktu_masuk' => $t->waktu_masuk->toISOString(),
        'id_area' => $t->id_area,
        'is_vip' => $t->kendaraan !== null,
        ]);

        // 3. Summary global untuk header
        $summary = [
            'total_kapasitas' => AreaParkir::sum('kapasitas'),
            'total_terisi' => AreaParkir::sum('terisi'),
            'total_kendaraan' => Transaksi::where('status', 'masuk')->count(),
        ];

        return Inertia::render('Petugas/AreaVisualisasi', [
            'areas' => $areas,
            'parkedVehicles' => $parkedVehicles,
            'summary' => $summary,
        ]);
    }
}
