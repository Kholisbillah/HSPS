<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Transaksi;
use App\Models\LogAktivitas;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class LaporanController extends Controller
{
    public function index(Request $request)
    {
        // Default Range: Awal bulan - Akhir bulan
        $startDate = $request->input('start_date', Carbon::today()->startOfMonth()->format('Y-m-d'));
        $endDate = $request->input('end_date', Carbon::today()->endOfMonth()->format('Y-m-d'));

        // --- 1. SUMMARY CARDS ---
        $today = Carbon::today()->format('Y-m-d');
        $yesterday = Carbon::yesterday()->format('Y-m-d');

        // Pendapatan hari ini vs kemarin
        $revenueToday = Transaksi::whereDate('waktu_keluar', $today)->sum('biaya_total');
        $revenueYesterday = Transaksi::whereDate('waktu_keluar', $yesterday)->sum('biaya_total');

        // Persentase kenaikan pendapatan
        $kenaikanPendapatan = 0;
        if ($revenueYesterday > 0) {
            $kenaikanPendapatan = (($revenueToday - $revenueYesterday) / $revenueYesterday) * 100;
        }
        else {
            $kenaikanPendapatan = $revenueToday > 0 ? 100 : 0;
        }

        // Okupansi: jumlah kendaraan masuk vs total kapasitas
        $parkirTerisi = Transaksi::where('status', 'masuk')->count();
        $totalKapasitas = \App\Models\AreaParkir::sum('kapasitas');
        $okupansiRate = $totalKapasitas > 0 ? ($parkirTerisi / $totalKapasitas) * 100 : 0;

        // BUG-1 FIX: Hitung total transaksi dalam range filter
        $totalTransaksiRange = Transaksi::whereBetween(DB::raw('DATE(waktu_keluar)'), [$startDate, $endDate])
            ->where('status', 'keluar')
            ->count();

        // BUG-2 FIX: Hitung total pendapatan dalam range filter
        $totalPendapatanRange = Transaksi::whereBetween(DB::raw('DATE(waktu_keluar)'), [$startDate, $endDate])
            ->where('status', 'keluar')
            ->sum('biaya_total');

        $summaryData = [
            'total_pendapatan_hari_ini' => $revenueToday,
            'kenaikan_pendapatan' => round($kenaikanPendapatan, 1),
            'parkir_terisi' => $parkirTerisi,
            'total_kapasitas' => $totalKapasitas,
            'okupansi_rate' => round($okupansiRate, 1),
            // Props baru yang sebelumnya missing
            'total_transaksi_range' => $totalTransaksiRange,
            'total_pendapatan_range' => $totalPendapatanRange,
        ];

        // --- 2. CHARTS DATA (berdasarkan filter tanggal) ---

        // A. Hourly Traffic — distribusi kendaraan per jam
        $hourlyTraffic = Transaksi::select(
            DB::raw('HOUR(waktu_masuk) as hour'),
            DB::raw('COUNT(*) as count')
        )
            ->whereBetween(DB::raw('DATE(waktu_masuk)'), [$startDate, $endDate])
            ->groupBy('hour')
            ->orderBy('hour')
            ->get();

        // B. Distribusi jenis kendaraan
        $vehicleDist = Transaksi::join('tarif', 'transaksi.id_tarif', '=', 'tarif.id_tarif')
            ->select(
            'tarif.jenis_kendaraan',
            DB::raw('COUNT(*) as count')
        )
            ->whereBetween(DB::raw('DATE(transaksi.waktu_keluar)'), [$startDate, $endDate])
            ->groupBy('tarif.jenis_kendaraan')
            ->get();

        // C. Revenue Source (VIP vs Umum)
        $transaksiPlats = Transaksi::whereBetween(DB::raw('DATE(waktu_keluar)'), [$startDate, $endDate])
            ->pluck('plat_nomor')
            ->unique()
            ->toArray();
        $vipPlats = \App\Models\Kendaraan::whereIn('plat_nomor', $transaksiPlats)
            ->pluck('plat_nomor')
            ->toArray();

        $vipCount = Transaksi::whereBetween(DB::raw('DATE(waktu_keluar)'), [$startDate, $endDate])
            ->whereIn('plat_nomor', $vipPlats)
            ->count();
        $umumCount = Transaksi::whereBetween(DB::raw('DATE(waktu_keluar)'), [$startDate, $endDate])
            ->whereNotIn('plat_nomor', $vipPlats)
            ->count();

        $revenueSource = collect([
            (object)['source' => 'VIP', 'count' => $vipCount],
            (object)['source' => 'Umum', 'count' => $umumCount],
        ])->filter(fn($item) => $item->count > 0)->values();


        // --- 3. AUDIT DATA — Hanya untuk Admin (sesuai UKK) ---
        $user = auth()->user();
        $auditLogs = collect(); // Default kosong untuk non-admin

        if ($user->role === 'admin') {
            // PERF-1 FIX: Filter audit logs berdasarkan range, bukan ambil semua
            $auditLogs = LogAktivitas::with('user')
                ->whereBetween(DB::raw('DATE(waktu_aktivitas)'), [$startDate, $endDate])
                ->latest('waktu_aktivitas')
                ->limit(200)
                ->get();
        }


        // --- 4. DETAILED TRANSACTIONS (filtered, dengan petugas_name) ---
        // BUG-4 FIX: Eager load relasi 'petugas' untuk mendapatkan nama petugas
        $transactions = Transaksi::with('petugas')
            ->whereBetween(DB::raw('DATE(waktu_keluar)'), [$startDate, $endDate])
            ->where('status', 'keluar')
            ->orderBy('waktu_keluar', 'desc')
            ->get();

        // Enrich: Tambahkan is_vip, vip_name, dan petugas_name
        $platNomors = $transactions->pluck('plat_nomor')->unique()->toArray();
        $vips = \App\Models\Kendaraan::whereIn('plat_nomor', $platNomors)->get()->keyBy('plat_nomor');
        $transactions->transform(function ($t) use ($vips) {
            $vip = $vips->get($t->plat_nomor);
            $t->is_vip = $vip ? true : false;
            $t->vip_name = $vip ? $vip->pemilik : null;
            // BUG-4 FIX: Attach petugas_name dari relasi yang di-eager load
            $t->petugas_name = $t->petugas ? $t->petugas->nama_lengkap : 'Tidak Diketahui';
            // Fallback jenis_kendaraan dari member jika kosong
            if (empty($t->jenis_kendaraan) && $vip) {
                $t->jenis_kendaraan = $vip->jenis_kendaraan;
            }
            return $t;
        });

        // Chart: Pendapatan harian (Line Chart)
        $dailyIncomeChart = Transaksi::select(
            DB::raw('DATE(waktu_keluar) as date'),
            DB::raw('SUM(biaya_total) as total')
        )
            ->whereBetween(DB::raw('DATE(waktu_keluar)'), [$startDate, $endDate])
            ->where('status', 'keluar')
            ->groupBy('date')
            ->orderBy('date', 'asc')
            ->get()
            ->map(function ($item) {
            return [
            'date' => Carbon::parse($item->date)->format('d M'),
            'total' => (int)$item->total
            ];
        });

        // BUG-3 FIX: Kirim area_stats agar section "Rekap Area Parkir" muncul
        $areaStats = \App\Models\AreaParkir::select('nama_area', 'kapasitas', 'terisi')
            ->orderBy('nama_area')
            ->get();


        return Inertia::render('Admin/Laporan/Index', [
            'transactions' => $transactions,
            'auditLogs' => $auditLogs,
            'filters' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
            ],
            'dashboard_summary' => $summaryData,
            'chart_hourly' => $hourlyTraffic,
            'chart_vehicle' => $vehicleDist,
            'chart_revenue_source' => $revenueSource,
            'chart_daily_income' => $dailyIncomeChart,
            // BUG-3 FIX: area_stats sekarang dikirim
            'area_stats' => $areaStats,
            // Role info untuk frontend conditional rendering
            'user_role' => $user->role,
        ]);
    }
}
