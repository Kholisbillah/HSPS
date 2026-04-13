<?php

namespace App\Http\Controllers;

use App\Models\AreaParkir;
use App\Models\LogAktivitas;
use App\Models\Transaksi;
use Carbon\Carbon;
use Inertia\Inertia;

class DashboardController extends Controller
{
    /**
     * Tampilkan Dashboard sesuai role user
     * Admin/Owner: Lihat data pendapatan + slot
     * Petugas: Hanya lihat data slot parkir
     */
    public function index()
    {
        $today = Carbon::today();

        // Data dasar — semua role bisa lihat kapasitas parkir
        $dashboardData = [
            'total_slot' => AreaParkir::sum('kapasitas'),
            'slot_terisi' => AreaParkir::sum('terisi'),
            'kendaraan_parkir' => Transaksi::where('status', 'masuk')->count(),
        ];

        // Data keuangan — semua role bisa lihat pendapatan di dashboard
        $revenueToday = Transaksi::whereDate('waktu_keluar', $today)->sum('biaya_total') ?? 0;
        $revenueYesterday = Transaksi::whereDate('waktu_keluar', $today->copy()->subDay())->sum('biaya_total') ?? 0;

        $diff = $revenueToday - $revenueYesterday;
        $percentage = $revenueYesterday > 0
            ? ($diff / $revenueYesterday) * 100
            : ($revenueToday > 0 ? 100 : 0);

        $dashboardData['pendapatan_hari_ini'] = $revenueToday;
        $dashboardData['revenue_stats'] = [
            'today' => $revenueToday,
            'yesterday' => $revenueYesterday,
            'growth_percentage' => round($percentage, 1),
            'is_positive' => $diff >= 0,
        ];

        // Log aktivitas terbaru — tampil untuk semua role di dashboard
        $dashboardData['activities'] = LogAktivitas::with('user')
            ->latest('waktu_aktivitas')
            ->limit(5)
            ->get();

        return Inertia::render('Dashboard', $dashboardData);
    }
}
