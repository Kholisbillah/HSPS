import { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { motion } from 'framer-motion';
import {
    Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement, Filler
} from 'chart.js';
import { Doughnut, Line } from 'react-chartjs-2';
import {
    Download, Search, Printer, Shield, Calendar, Activity, Car,
    ArrowUp, ArrowDown, TrendingUp, PieChart, Wallet, Clock,
    ChevronLeft, ChevronRight, FileText, BarChart3, Users
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Helper untuk menggabungkan class Tailwind
function cn(...inputs) {
    return twMerge(clsx(inputs));
}

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement, Filler);

// Animasi container & item (konsisten dengan Dashboard)
const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } }
};
const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
};

// Format mata uang Rupiah
const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency', currency: 'IDR', minimumFractionDigits: 0
    }).format(number || 0);
};

// Format angka pendek (1.500.000 → 1.5M)
const formatShort = (n) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
    return n?.toString() || '0';
};

export default function LaporanIndex({
    auth,
    transactions,
    auditLogs,
    filters,
    dashboard_summary,
    chart_vehicle,
    chart_revenue_source,
    chart_daily_income,
    area_stats,
    user_role,
}) {
    // State
    const [activeTab, setActiveTab] = useState('transaksi');
    const [startDate, setStartDate] = useState(filters.start_date);
    const [endDate, setEndDate] = useState(filters.end_date);
    const [auditSearch, setAuditSearch] = useState('');

    // Pagination
    const [transPage, setTransPage] = useState(1);
    const [auditPage, setAuditPage] = useState(1);
    const itemsPerPage = 10;

    // --- LOGIC ---
    const handleFilter = () => {
        router.visit(route('admin.laporan.index'), {
            method: 'get',
            data: { start_date: startDate, end_date: endDate },
            preserveState: true, replace: true,
        });
    };

    // Totals dari data transaksi (client side)
    const totalFilteredRevenue = transactions.reduce((acc, curr) => acc + (parseInt(curr.biaya_total) || 0), 0);

    // Rata-rata durasi
    const avgDuration = transactions.length > 0
        ? (transactions.reduce((acc, t) => acc + (parseFloat(t.durasi_jam) || 0), 0) / transactions.length).toFixed(1)
        : '0';

    // Pagination: Transaksi
    const totalTransPages = Math.ceil(transactions.length / itemsPerPage);
    const paginatedTransactions = transactions.slice((transPage - 1) * itemsPerPage, transPage * itemsPerPage);

    // Filtered Audit Logs
    const filteredLogs = (auditLogs || []).filter(log =>
        (log.user?.nama_lengkap || '').toLowerCase().includes(auditSearch.toLowerCase()) ||
        (log.aktivitas || '').toLowerCase().includes(auditSearch.toLowerCase())
    );
    const totalAuditPages = Math.ceil(filteredLogs.length / itemsPerPage);
    const paginatedLogs = filteredLogs.slice((auditPage - 1) * itemsPerPage, auditPage * itemsPerPage);

    // --- PRINT LOGIC ---
    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        const rows = transactions.map((t, i) => `
            <tr>
                <td style="text-align:center">${i + 1}</td>
                <td>
                    <div style="font-weight:bold;font-family:monospace">${t.plat_nomor}</div>
                    ${t.is_vip ? `<div style="font-size:9px;color:green">VIP: ${t.vip_name}</div>` : ''}
                </td>
                <td style="text-transform:uppercase">${t.jenis_kendaraan || '-'}</td>
                <td>${new Date(t.waktu_masuk).toLocaleString('id-ID')}</td>
                <td>${new Date(t.waktu_keluar).toLocaleString('id-ID')}</td>
                <td style="text-align:center">${t.durasi_jam ?? '-'} jam</td>
                <td style="text-align:right">${formatRupiah(t.biaya_total)}</td>
                <td>${t.petugas_name || '-'}</td>
            </tr>
        `).join('');

        const signerName = auth.user.nama_lengkap;
        printWindow.document.write(`
            <html><head><title>Laporan Pendapatan Parkir - RS Hermina</title>
            <style>
                body{font-family:'Arial',sans-serif;padding:20px;color:#333;font-size:11px}
                h2{text-align:center;margin-bottom:5px;color:#047857;text-transform:uppercase}
                .subtitle{text-align:center;margin-top:0;font-size:12px;color:#666}
                .summary{display:flex;justify-content:space-between;margin:15px 0;padding:10px;background:#f9fafb;border-radius:8px}
                .summary-item{text-align:center}
                .summary-item .label{font-size:9px;color:#999;text-transform:uppercase}
                .summary-item .value{font-size:16px;font-weight:bold;color:#047857}
                table{width:100%;border-collapse:collapse;margin-top:15px}
                th,td{border:1px solid #ddd;padding:6px 8px}
                th{background-color:#f3f4f6;color:#333;font-weight:bold;text-transform:uppercase;font-size:9px}
                .total-row{background-color:#047857;color:white;font-weight:bold}
                .footer-section{margin-top:40px;display:flex;justify-content:space-between;page-break-inside:avoid}
                .signature-box{text-align:center;margin-right:50px}
                .signature-line{margin-top:60px;border-top:1px solid #000;display:inline-block;min-width:150px;padding-top:5px;font-weight:bold}
            </style></head><body>
                <h2>Laporan Transaksi Parkir</h2>
                <p class="subtitle">RS Hermina Smart Parking System</p>
                <p class="subtitle">Periode: ${startDate} s/d ${endDate}</p>
                <div class="summary">
                    <div class="summary-item"><div class="label">Total Transaksi</div><div class="value">${transactions.length}</div></div>
                    <div class="summary-item"><div class="label">Total Pendapatan</div><div class="value">${formatRupiah(totalFilteredRevenue)}</div></div>
                </div>
                <table>
                    <thead><tr>
                        <th width="4%">No</th><th width="14%">Kendaraan</th><th width="8%">Tipe</th>
                        <th width="18%">Waktu Masuk</th><th width="18%">Waktu Keluar</th>
                        <th width="8%">Durasi</th><th width="14%">Biaya</th><th width="14%">Petugas</th>
                    </tr></thead>
                    <tbody>${rows}</tbody>
                    <tfoot><tr class="total-row">
                        <td colspan="6" style="text-align:right;padding-right:15px">TOTAL PENDAPATAN</td>
                        <td style="text-align:right">${formatRupiah(totalFilteredRevenue)}</td><td></td>
                    </tr></tfoot>
                </table>
                <div class="footer-section">
                    <div style="flex:1"></div>
                    <div class="signature-box">
                        <div style="margin-bottom:5px">Bandung, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                        <div>Mengetahui,</div>
                        <div class="signature-line">${signerName}</div>
                        <div style="font-size:10px;margin-top:2px">${auth.user.role === 'owner' ? 'Pemilik' : 'Administrator'}</div>
                    </div>
                </div>
                <script>window.onload=function(){window.print()}<\/script>
            </body></html>
        `);
        printWindow.document.close();
    };

    // --- CHART CONFIG ---
    // Komposisi Kendaraan (Doughnut)
    const vehicleData = {
        labels: (chart_vehicle || []).map(d => (d.jenis_kendaraan || 'Lainnya').toUpperCase()),
        datasets: [{
            data: (chart_vehicle || []).map(d => d.count),
            backgroundColor: ['#10B981', '#34D399', '#6EE7B7', '#A7F3D0'],
            borderWidth: 0, hoverOffset: 4
        }]
    };

    // Revenue Source (Doughnut VIP vs Umum)
    const revenueSourceData = {
        labels: (chart_revenue_source || []).map(d => d.source),
        datasets: [{
            data: (chart_revenue_source || []).map(d => d.count),
            backgroundColor: ['#059669', '#94A3B8'],
            borderWidth: 0, hoverOffset: 4
        }]
    };

    const doughnutOptions = {
        cutout: '72%',
        plugins: { legend: { display: false } }
    };

    // Pendapatan Harian (Line/Area Chart)
    const dailyChartData = {
        labels: (chart_daily_income || []).map(d => d.date),
        datasets: [{
            label: 'Pendapatan',
            data: (chart_daily_income || []).map(d => d.total),
            borderColor: '#059669',
            backgroundColor: 'rgba(5, 150, 105, 0.08)',
            fill: true, tension: 0.4,
            pointRadius: 0, pointHoverRadius: 5,
            pointBackgroundColor: '#059669',
            borderWidth: 2,
        }]
    };

    const dailyChartOptions = {
        responsive: true, maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: '#fff', titleColor: '#1e293b', bodyColor: '#1e293b',
                borderColor: '#e2e8f0', borderWidth: 1, padding: 10,
                titleFont: { family: "'Outfit',sans-serif", size: 12 },
                bodyFont: { family: "'JetBrains Mono',monospace", size: 13, weight: 'bold' },
                displayColors: false,
                callbacks: { label: (ctx) => formatRupiah(ctx.raw) }
            }
        },
        scales: {
            y: {
                beginAtZero: true, border: { display: false },
                ticks: { font: { size: 10, family: "'JetBrains Mono',monospace" }, color: '#94a3b8', callback: v => formatShort(v) },
                grid: { color: '#f1f5f9', drawBorder: false }
            },
            x: {
                grid: { display: false }, border: { display: false },
                ticks: { font: { size: 10, family: "'Outfit',sans-serif" }, color: '#94a3b8' }
            }
        },
        interaction: { mode: 'index', intersect: false }
    };


    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight text-slate-900 leading-tight font-heading">Laporan & Audit</h2>
                        <p className="text-slate-500 text-sm mt-1">Ringkasan Operasional & Analitik Parkir</p>
                    </div>
                    {/* Date Filter — konsisten dengan style Dashboard */}
                    <div className="bg-white rounded-full shadow-sm border border-slate-100 p-1.5 flex items-center space-x-2 w-full md:w-auto">
                        <div className="flex items-center px-4 py-2 bg-slate-50 rounded-full border border-slate-100 flex-1 md:flex-none justify-center">
                            <Calendar className="w-4 h-4 text-emerald-600 mr-2 flex-shrink-0" />
                            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                                className="bg-transparent border-none text-[11px] font-bold text-slate-700 focus:ring-0 p-0 w-24 uppercase" />
                            <span className="mx-2 text-slate-300 font-bold">—</span>
                            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                                className="bg-transparent border-none text-[11px] font-bold text-slate-700 focus:ring-0 p-0 w-24 uppercase" />
                        </div>
                        <button onClick={handleFilter}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white p-2.5 rounded-full transition-all shadow-md hover:shadow-lg flex-shrink-0">
                            <Search className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            }
        >
            <Head title="Laporan & Audit" />

            <div className="py-8 bg-slate-50/50 min-h-screen font-sans">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">

                    {/* === SECTION 1: BENTO HERO GRID (Konsisten dengan Dashboard) === */}
                    <motion.div
                        className="grid grid-cols-1 md:grid-cols-3 gap-5"
                        variants={containerVariants} initial="hidden" animate="show"
                    >
                        {/* HERO: Pendapatan Periode (Dark Card — seperti Revenue Card Dashboard) */}
                        <motion.div variants={itemVariants}
                            className="bg-slate-900 text-white rounded-[2rem] p-7 relative overflow-hidden flex flex-col justify-between min-h-[200px] shadow-xl shadow-slate-200"
                        >
                            <div className="relative z-10">
                                <div className="flex items-center space-x-2 text-slate-400 mb-1">
                                    <Wallet className="w-4 h-4" />
                                    <span className="text-xs font-medium uppercase tracking-wider">Pendapatan Periode</span>
                                </div>
                                <h3 className="text-3xl font-bold tracking-tighter text-white font-mono mt-2">
                                    {formatRupiah(dashboard_summary.total_pendapatan_range).replace('Rp', '')}
                                    <span className="text-lg text-slate-500 align-top ml-1">IDR</span>
                                </h3>
                            </div>
                            <div className="relative z-10 flex items-center gap-3 mt-4">
                                <div className={cn(
                                    "inline-flex items-center backdrop-blur-sm rounded-full px-3 py-1.5 text-xs font-bold",
                                    dashboard_summary.kenaikan_pendapatan >= 0 ? "bg-white/10 text-emerald-300" : "bg-red-900/40 text-red-300"
                                )}>
                                    {dashboard_summary.kenaikan_pendapatan >= 0 ? <ArrowUp className="w-3 h-3 mr-1" /> : <ArrowDown className="w-3 h-3 mr-1" />}
                                    {Math.abs(dashboard_summary.kenaikan_pendapatan)}% vs kemarin
                                </div>
                                <span className="text-[10px] text-slate-500 font-mono uppercase">{startDate} — {endDate}</span>
                            </div>
                            <Wallet className="absolute -bottom-10 -right-10 w-48 h-48 text-white opacity-[0.04] rotate-12" />
                        </motion.div>

                        {/* STACKED: 3 Compact Cards */}
                        <div className="flex flex-col gap-4">
                            {/* Total Transaksi */}
                            <motion.div variants={itemVariants}
                                className="bg-white rounded-[2rem] p-5 shadow-sm border border-slate-100 flex-1 flex items-center justify-between group hover:shadow-md transition-all"
                            >
                                <div>
                                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">Total Transaksi</p>
                                    <h4 className="text-2xl font-bold text-slate-900 font-mono">{dashboard_summary.total_transaksi_range}</h4>
                                </div>
                                <div className="w-11 h-11 bg-blue-50 rounded-full flex items-center justify-center text-blue-500">
                                    <BarChart3 className="w-5 h-5" />
                                </div>
                            </motion.div>

                            {/* Okupansi */}
                            <motion.div variants={itemVariants}
                                className="bg-white rounded-[2rem] p-5 shadow-sm border border-slate-100 flex-1 flex flex-col justify-center group hover:shadow-md transition-all"
                            >
                                <div className="flex justify-between items-center mb-2">
                                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Okupansi</p>
                                    <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full",
                                        dashboard_summary.okupansi_rate > 80 ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"
                                    )}>
                                        {dashboard_summary.parkir_terisi}/{dashboard_summary.total_kapasitas}
                                    </span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="flex-1 bg-slate-100 rounded-full h-2.5 overflow-hidden">
                                        <div className={cn("h-2.5 rounded-full transition-all duration-700",
                                            dashboard_summary.okupansi_rate > 80 ? "bg-red-500" : "bg-emerald-500"
                                        )} style={{ width: `${Math.min(dashboard_summary.okupansi_rate, 100)}%` }} />
                                    </div>
                                    <span className="text-sm font-bold font-mono text-slate-700">{dashboard_summary.okupansi_rate}%</span>
                                </div>
                            </motion.div>
                        </div>

                        {/* Rata-rata Durasi + Pendapatan Hari Ini */}
                        <div className="flex flex-col gap-4">
                            <motion.div variants={itemVariants}
                                className="bg-emerald-50 rounded-[2rem] p-5 border border-emerald-100 flex-1 flex items-center justify-between group hover:bg-emerald-100/50 transition-colors"
                            >
                                <div>
                                    <p className="text-emerald-700 text-[10px] font-bold uppercase tracking-widest mb-1">Pendapatan Hari Ini</p>
                                    <h4 className="text-xl font-bold text-emerald-900 font-mono">{formatRupiah(dashboard_summary.total_pendapatan_hari_ini)}</h4>
                                </div>
                                <div className="w-11 h-11 bg-white rounded-full flex items-center justify-center text-emerald-600 shadow-sm">
                                    <TrendingUp className="w-5 h-5" />
                                </div>
                            </motion.div>

                            <motion.div variants={itemVariants}
                                className="bg-white rounded-[2rem] p-5 shadow-sm border border-slate-100 flex-1 flex items-center justify-between group hover:shadow-md transition-all"
                            >
                                <div>
                                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">Rata-rata Durasi</p>
                                    <h4 className="text-2xl font-bold text-slate-900 font-mono">{avgDuration}<span className="text-sm text-slate-400 ml-1">jam</span></h4>
                                </div>
                                <div className="w-11 h-11 bg-orange-50 rounded-full flex items-center justify-center text-orange-500">
                                    <Clock className="w-5 h-5" />
                                </div>
                            </motion.div>
                        </div>
                    </motion.div>


                    {/* === SECTION 2: CHART AREA + DOUGHNUTS === */}
                    <motion.div
                        className="grid grid-cols-1 lg:grid-cols-3 gap-5"
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                    >
                        {/* Area Chart: Pendapatan Harian */}
                        <div className="lg:col-span-2 bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100">
                            <div className="flex justify-between items-center mb-5">
                                <h3 className="font-bold text-slate-800 flex items-center text-sm">
                                    <TrendingUp className="w-4 h-4 mr-2 text-emerald-500" />
                                    Tren Pendapatan Harian
                                </h3>
                                <span className="text-[10px] bg-slate-50 text-slate-400 px-3 py-1 rounded-full font-bold uppercase tracking-widest border border-slate-100">
                                    {startDate} — {endDate}
                                </span>
                            </div>
                            <div className="h-[220px] w-full">
                                {(chart_daily_income || []).length > 0 ? (
                                    <Line data={dailyChartData} options={dailyChartOptions} />
                                ) : (
                                    <div className="h-full flex items-center justify-center text-slate-400 text-sm">Tidak ada data pada periode ini</div>
                                )}
                            </div>
                        </div>

                        {/* Doughnut Column */}
                        <div className="flex flex-col gap-5">
                            {/* Komposisi Kendaraan */}
                            <div className="bg-white rounded-[2rem] p-5 shadow-sm border border-slate-100 flex-1">
                                <h3 className="font-bold text-slate-800 mb-3 flex items-center text-[11px] uppercase tracking-wider">
                                    <PieChart className="w-4 h-4 mr-2 text-emerald-500" />
                                    Komposisi Kendaraan
                                </h3>
                                <div className="relative flex items-center justify-center">
                                    <div className="w-28 h-28">
                                        <Doughnut data={vehicleData} options={doughnutOptions} />
                                    </div>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                        <span className="text-lg font-bold text-slate-800 font-mono">{transactions.length}</span>
                                        <span className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">Total</span>
                                    </div>
                                </div>
                                {/* Legend compact */}
                                <div className="flex justify-center gap-4 mt-3">
                                    {(chart_vehicle || []).map((v, i) => (
                                        <div key={i} className="flex items-center gap-1.5">
                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: ['#10B981', '#34D399', '#6EE7B7', '#A7F3D0'][i] }} />
                                            <span className="text-[10px] text-slate-500 font-medium uppercase">{v.jenis_kendaraan}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Sumber Pendapatan */}
                            <div className="bg-white rounded-[2rem] p-5 shadow-sm border border-slate-100 flex-1">
                                <h3 className="font-bold text-slate-800 mb-3 flex items-center text-[11px] uppercase tracking-wider">
                                    <Users className="w-4 h-4 mr-2 text-emerald-500" />
                                    VIP vs Umum
                                </h3>
                                <div className="relative flex items-center justify-center">
                                    {(chart_revenue_source || []).length > 0 ? (
                                        <>
                                            <div className="w-28 h-28">
                                                <Doughnut data={revenueSourceData} options={doughnutOptions} />
                                            </div>
                                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center leading-tight">
                                                <span className="text-[10px] font-bold text-slate-400">Revenue</span>
                                                <span className="text-[10px] font-bold text-slate-400">Source</span>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="text-slate-400 text-xs py-8">Tidak ada data</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </motion.div>


                    {/* === SECTION 3: DATA TABLE (Compact) === */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                        className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden"
                    >
                        {/* Header: Tabs + Actions */}
                        <div className="px-6 py-5 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div className="flex items-center gap-3">
                                {/* Tab Switcher (pill style) */}
                                <div className="bg-slate-100 p-1 rounded-full inline-flex">
                                    <button onClick={() => setActiveTab('transaksi')}
                                        className={cn("px-5 py-1.5 rounded-full text-xs font-bold transition-all",
                                            activeTab === 'transaksi' ? "bg-emerald-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-700"
                                        )}>
                                        Transaksi
                                    </button>
                                    {/* Tab audit hanya untuk Admin — sesuai UKK */}
                                    {user_role === 'admin' && (
                                        <button onClick={() => setActiveTab('audit')}
                                            className={cn("px-5 py-1.5 rounded-full text-xs font-bold transition-all",
                                                activeTab === 'audit' ? "bg-emerald-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-700"
                                            )}>
                                            Log Aktivitas
                                        </button>
                                    )}
                                </div>
                                <span className="text-xs text-slate-400 font-mono hidden md:inline">
                                    {activeTab === 'transaksi' ? `${transactions.length} records` : `${filteredLogs.length} logs`}
                                </span>
                            </div>

                            <div className="flex items-center gap-2 w-full md:w-auto">
                                {/* Search (untuk audit) */}
                                {activeTab === 'audit' && (
                                    <div className="relative flex-1 md:flex-none">
                                        <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                                        <input type="text" placeholder="Cari log..." value={auditSearch}
                                            onChange={(e) => { setAuditSearch(e.target.value); setAuditPage(1); }}
                                            className="pl-8 pr-3 py-2 bg-slate-50 border-none rounded-xl text-xs w-full md:w-48 focus:ring-2 focus:ring-emerald-500/20" />
                                    </div>
                                )}
                                {/* Print button */}
                                {activeTab === 'transaksi' && (
                                    <button onClick={handlePrint}
                                        className="flex items-center text-xs font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-4 py-2 rounded-xl transition-colors">
                                        <Printer className="w-3.5 h-3.5 mr-1.5" />
                                        Cetak
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* TAB: TRANSAKSI */}
                        {activeTab === 'transaksi' && (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-slate-50/80">
                                            <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider w-12">No</th>
                                            <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kendaraan</th>
                                            <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tipe</th>
                                            <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Waktu Masuk</th>
                                            <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Waktu Keluar</th>
                                            <th className="px-4 py-3 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">Durasi</th>
                                            <th className="px-4 py-3 text-right text-[10px] font-bold text-slate-400 uppercase tracking-wider">Biaya</th>
                                            <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Petugas</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {paginatedTransactions.length > 0 ? paginatedTransactions.map((t, idx) => (
                                            <tr key={t.id_parkir || idx} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-4 py-3 text-slate-400 font-mono text-xs">{(transPage - 1) * itemsPerPage + idx + 1}</td>
                                                <td className="px-4 py-3">
                                                    <div className="font-mono font-bold text-slate-800 text-sm">{t.plat_nomor}</div>
                                                    {t.is_vip && (
                                                        <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded mt-0.5 inline-block">
                                                            VIP
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={cn("px-2 py-0.5 rounded text-[9px] font-bold uppercase",
                                                        (t.jenis_kendaraan || '').toLowerCase() === 'mobil' ? "bg-blue-50 text-blue-600" : "bg-orange-50 text-orange-600"
                                                    )}>
                                                        {t.jenis_kendaraan || '-'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-xs text-slate-600 font-mono">
                                                    {new Date(t.waktu_masuk).toLocaleString('id-ID', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                                </td>
                                                <td className="px-4 py-3 text-xs text-slate-600 font-mono">
                                                    {new Date(t.waktu_keluar).toLocaleString('id-ID', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                                </td>
                                                <td className="px-4 py-3 text-center text-xs font-mono text-slate-500">{t.durasi_jam ?? '-'}h</td>
                                                <td className="px-4 py-3 text-right font-mono font-bold text-emerald-600 text-sm">{formatRupiah(t.biaya_total)}</td>
                                                <td className="px-4 py-3 text-xs text-slate-500 truncate max-w-[100px]">{t.petugas_name || '-'}</td>
                                            </tr>
                                        )) : (
                                            <tr><td colSpan={8} className="px-4 py-16 text-center text-slate-400">Tidak ada transaksi pada periode ini.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* TAB: LOG AKTIVITAS */}
                        {activeTab === 'audit' && (
                            <div className="p-5 space-y-2">
                                {paginatedLogs.length > 0 ? paginatedLogs.map((log, idx) => (
                                    <div key={log.id_log || idx} className="flex items-start gap-3 p-3 hover:bg-slate-50 rounded-xl transition-colors">
                                        <div className={cn("w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0",
                                            (log.aktivitas || '').toUpperCase().includes('HAPUS') || (log.aktivitas || '').toUpperCase().includes('DELETE')
                                                ? "bg-red-500" : (log.aktivitas || '').toLowerCase().includes('login')
                                                    ? "bg-blue-500" : "bg-emerald-500"
                                        )} />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-center">
                                                <span className="font-bold text-slate-800 text-sm truncate">{log.user?.nama_lengkap || 'Sistem'}</span>
                                                <span className="text-[10px] font-mono text-slate-400 flex-shrink-0 ml-2">
                                                    {new Date(log.waktu_aktivitas).toLocaleString('id-ID', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-500 mt-0.5 truncate">{log.aktivitas}</p>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="text-center py-16 text-slate-400 text-sm">Tidak ada log yang cocok.</div>
                                )}
                            </div>
                        )}

                        {/* Pagination Footer */}
                        {((activeTab === 'transaksi' && transactions.length > itemsPerPage) ||
                            (activeTab === 'audit' && filteredLogs.length > itemsPerPage)) && (
                                <div className="px-6 py-4 border-t border-slate-100 flex justify-between items-center">
                                    <span className="text-xs text-slate-400">
                                        Halaman <span className="font-bold text-slate-600 font-mono">
                                            {activeTab === 'transaksi' ? transPage : auditPage}
                                        </span> dari <span className="font-mono">
                                            {activeTab === 'transaksi' ? totalTransPages : totalAuditPages}
                                        </span>
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => activeTab === 'transaksi' ? setTransPage(p => Math.max(1, p - 1)) : setAuditPage(p => Math.max(1, p - 1))}
                                            disabled={(activeTab === 'transaksi' ? transPage : auditPage) === 1}
                                            className="p-2 rounded-xl bg-slate-50 text-slate-500 disabled:opacity-30 hover:bg-slate-100 transition-colors"
                                        >
                                            <ChevronLeft className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => activeTab === 'transaksi' ? setTransPage(p => Math.min(totalTransPages, p + 1)) : setAuditPage(p => Math.min(totalAuditPages, p + 1))}
                                            disabled={(activeTab === 'transaksi' ? transPage : auditPage) >= (activeTab === 'transaksi' ? totalTransPages : totalAuditPages)}
                                            className="p-2 rounded-xl bg-emerald-600 text-white disabled:opacity-30 hover:bg-emerald-700 transition-colors"
                                        >
                                            <ChevronRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                    {/* Total Pendapatan (hanya di tab transaksi) */}
                                    {activeTab === 'transaksi' && (
                                        <div className="hidden md:block text-right">
                                            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Total</div>
                                            <div className="text-lg font-bold text-emerald-600 font-mono leading-none">{formatRupiah(totalFilteredRevenue)}</div>
                                        </div>
                                    )}
                                </div>
                            )}
                    </motion.div>

                </div>
            </div>
        </AuthenticatedLayout>
    );
}
