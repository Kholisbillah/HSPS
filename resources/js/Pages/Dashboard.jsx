import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import {
    Car,
    Activity,
    Wallet,
    Clock,
    User,
    Shield,
    Power,
    Cpu,
    Wifi,
    Server
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';

// Helper: Greeting dinamis berdasarkan jam (Bahasa Indonesia)
const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 11) return 'Selamat Pagi';
    if (hour >= 11 && hour < 15) return 'Selamat Siang';
    if (hour >= 15 && hour < 18) return 'Selamat Sore';
    return 'Selamat Malam';
};

// Utility for formatting currency
const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(number);
};

// Clock Component
const DateTimeWidget = () => {
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="bg-white border shadow-sm px-4 py-2 rounded-full flex items-center space-x-3 text-sm font-medium text-slate-600">
            <Clock className="w-4 h-4 text-emerald-500" />
            <span>
                {currentTime.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
            <span className="w-px h-4 bg-slate-200"></span>
            <span className="font-bold text-slate-800 font-mono">
                {currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
            </span>
        </div>
    );
};

export default function Dashboard({ auth, total_slot, slot_terisi, kendaraan_parkir, pendapatan_hari_ini, activities = [], revenue_stats }) {
    const sisa_slot = total_slot - slot_terisi;
    const occupancyRate = total_slot > 0 ? Math.round((slot_terisi / total_slot) * 100) : 0;

    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight text-slate-900 leading-tight font-heading">
                            {getGreeting()}, {auth.user?.nama_lengkap || 'Pengguna'}.
                        </h2>
                        <p className="text-slate-500 text-sm mt-1">Ringkasan aktivitas parkir Hermina hari ini.</p>
                    </div>
                    <DateTimeWidget />
                </div>
            }
        >
            <Head title="Dashboard" />

            <div className="py-8 bg-slate-50/50 min-h-screen font-sans">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-8">

                    {/* === BENTO GRID SECTION === */}
                    <motion.div
                        className="grid grid-cols-1 md:grid-cols-3 gap-6"
                        variants={containerVariants}
                        initial="hidden"
                        animate="show"
                    >
                        {/* 1. REVENUE CARD (Dominant) */}
                        <motion.div variants={itemVariants} className="bg-slate-900 text-white rounded-[2rem] p-8 relative overflow-hidden flex flex-col justify-between h-[320px] shadow-xl shadow-slate-200">
                            <div className="relative z-10">
                                <div className="flex items-center space-x-2 text-slate-400 mb-2">
                                    <Wallet className="w-5 h-5" />
                                    <span className="font-medium text-sm">Total Revenue Today</span>
                                </div>
                                <h3 className="text-5xl font-bold tracking-tighter text-white font-mono break-words">
                                    {formatRupiah(pendapatan_hari_ini).replace('Rp', '')}
                                    <span className="text-2xl text-slate-500 align-top ml-2">IDR</span>
                                </h3>
                            </div>

                            <div className="relative z-10 mt-6">
                                <div className={cn(
                                    "inline-flex items-center backdrop-blur-sm rounded-full px-4 py-2 text-sm font-bold",
                                    (revenue_stats?.is_positive !== false) ? "bg-white/10 text-emerald-300" : "bg-red-900/40 text-red-300"
                                )}>
                                    <Activity className="w-4 h-4 mr-2" />
                                    {revenue_stats?.is_positive ? '+' : ''}{revenue_stats?.growth_percentage ?? 0}% from yesterday
                                </div>
                            </div>

                            {/* Background Icon */}
                            <Wallet className="absolute -bottom-12 -right-12 w-64 h-64 text-white opacity-5 rotate-12" />
                        </motion.div>


                        {/* 2. REAL-TIME STATUS (Stacked) */}
                        <div className="flex flex-col gap-6 h-[320px]">
                            {/* Occupancy */}
                            <motion.div variants={itemVariants} className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 flex-1 flex flex-col justify-center relative overflow-hidden group hover:shadow-md transition-all">
                                <div className="flex justify-between items-center mb-4">
                                    <h4 className="font-bold text-slate-700">Occupancy Rate</h4>
                                    <span className={cn(
                                        "px-2 py-1 rounded text-xs font-bold",
                                        occupancyRate > 90 ? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-600"
                                    )}>
                                        {occupancyRate > 90 ? 'CRITICAL' : 'OPTIMAL'}
                                    </span>
                                </div>
                                <div className="relative pt-1">
                                    <div className="flex mb-2 items-center justify-between">
                                        <div>
                                            <span className="text-xs font-semibold inline-block text-emerald-600">
                                                {slot_terisi} / {total_slot} Slots Used
                                            </span>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-xs font-semibold inline-block text-emerald-600">
                                                {occupancyRate}%
                                            </span>
                                        </div>
                                    </div>
                                    <div className="overflow-hidden h-4 mb-4 text-xs flex rounded-full bg-slate-100">
                                        <div style={{ width: `${occupancyRate}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-emerald-500 transition-all duration-1000 ease-out"></div>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Active Vehicles */}
                            <motion.div variants={itemVariants} className="bg-emerald-50 rounded-[2rem] p-6 border border-emerald-100 flex-1 flex items-center justify-between group hover:bg-emerald-100/50 transition-colors">
                                <div>
                                    <p className="text-emerald-800 font-bold mb-1 text-sm uppercase tracking-wide">Active Vehicles</p>
                                    <h3 className="text-4xl font-bold text-emerald-900 font-mono">{kendaraan_parkir}</h3>
                                </div>
                                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm text-emerald-600">
                                    <Car className="w-8 h-8" />
                                </div>
                            </motion.div>
                        </div>


                        {/* 3. SYSTEM HEALTH (Technical Status) */}
                        <motion.div variants={itemVariants} className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 flex flex-col justify-center h-[320px] relative overflow-hidden group">
                            <div className="flex justify-between items-center mb-6 z-10">
                                <h4 className="font-bold text-slate-700 flex items-center">
                                    <Cpu className="w-5 h-5 mr-2 text-indigo-500" />
                                    System Nodes
                                </h4>
                                <span className="flex h-3 w-3 relative" title="All systems operational">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                                </span>
                            </div>

                            <div className="space-y-4 z-10 mt-1">
                                <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-100 group-hover:border-slate-200 transition-colors">
                                    <div className="flex items-center">
                                        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center mr-3">
                                            <Wifi className="w-4 h-4 text-emerald-600" />
                                        </div>
                                        <span className="text-sm font-bold text-slate-700">Gate In Terminal</span>
                                    </div>
                                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full tracking-wider">ONLINE</span>
                                </div>

                                <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-100 group-hover:border-slate-200 transition-colors">
                                    <div className="flex items-center">
                                        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center mr-3">
                                            <Wifi className="w-4 h-4 text-emerald-600" />
                                        </div>
                                        <span className="text-sm font-bold text-slate-700">Gate Out Terminal</span>
                                    </div>
                                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full tracking-wider">ONLINE</span>
                                </div>

                                <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-100 group-hover:border-slate-200 transition-colors">
                                    <div className="flex items-center">
                                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center mr-3">
                                            <Server className="w-4 h-4 text-indigo-600" />
                                        </div>
                                        <span className="text-sm font-bold text-slate-700">Local Database</span>
                                    </div>
                                    <span className="text-[10px] font-bold text-indigo-600 bg-indigo-100 px-2 py-1 rounded-full tracking-wider">SYNCED</span>
                                </div>
                            </div>

                            {/* Decorative background element */}
                            <div className="absolute -right-8 -bottom-8 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity duration-500">
                                <Cpu className="w-48 h-48 text-indigo-900" />
                            </div>
                        </motion.div>

                    </motion.div>


                    {/* === ACTIVITY TIMELINE === */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                        className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100"
                    >
                        <h3 className="text-xl font-bold text-slate-800 mb-8 flex items-center">
                            <Activity className="w-6 h-6 mr-3 text-emerald-500" />
                            Live Activity Feed
                        </h3>

                        <div className="relative pl-4">
                            {/* Dotted Line */}
                            <div className="absolute left-[19px] top-2 bottom-6 w-px border-l-2 border-dashed border-slate-200"></div>

                            <div className="space-y-8">
                                {activities.length > 0 ? (
                                    activities.map((activity, index) => {
                                        // Determine colors based on activity
                                        let dotColor = "bg-blue-500 shadow-blue-200";
                                        if (activity.aktivitas.includes('Masuk')) dotColor = "bg-emerald-500 shadow-emerald-200";
                                        if (activity.aktivitas.includes('Keluar')) dotColor = "bg-red-500 shadow-red-200";

                                        return (
                                            <div key={index} className="relative flex items-center group">
                                                {/* Dot Indicator */}
                                                <div className={cn(
                                                    "absolute left-0 w-4 h-4 rounded-full border-2 border-white shadow-lg z-10",
                                                    dotColor
                                                )}></div>

                                                <div className="ml-12 flex-1 flex flex-col md:flex-row md:items-center justify-between bg-slate-50 hover:bg-white border border-transparent hover:border-slate-100 p-4 rounded-2xl transition-all hover:shadow-sm">
                                                    <div className="flex items-center flex-1">
                                                        <span className="font-mono font-bold text-slate-500 text-sm mr-6 min-w-[60px]">
                                                            {new Date(activity.waktu_aktivitas).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                        <div>
                                                            <p className="font-bold text-slate-800 text-sm leading-snug">
                                                                {activity.keterangan || activity.aktivitas}
                                                            </p>
                                                            <p className="text-xs text-slate-500 mt-1">
                                                                {new Date(activity.waktu_aktivitas).toLocaleDateString('id-ID', { day: 'numeric', month: 'long' })}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="mt-2 md:mt-0 flex items-center">
                                                        <span className={cn(
                                                            "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center",
                                                            activity.user ? "bg-indigo-50 text-indigo-600" : "bg-slate-200 text-slate-600"
                                                        )}>
                                                            {activity.user ? <User className="w-3 h-3 mr-1" /> : <Shield className="w-3 h-3 mr-1" />}
                                                            {activity.user?.role || 'SYSTEM'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="text-center py-12 text-slate-400 italic">
                                        No recent activity recorded.
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
