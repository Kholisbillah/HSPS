import { useState, useEffect, useMemo } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Map,
    Car,
    Bike,
    Truck,
    Search,
    Clock,
    Shield,
    Users,
    ParkingCircle,
    Activity,
    ChevronRight,
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import OccupancyGauge from '@/Components/Parking/OccupancyGauge';
import ParkingSlotGrid from '@/Components/Parking/ParkingSlotGrid';

// Helper untuk menggabungkan Tailwind class
function cn(...inputs) {
    return twMerge(clsx(inputs));
}

// Ikon kendaraan berdasarkan peruntukan
const vehicleIcons = {
    motor: Bike,
    mobil: Car,
    semua: Truck,
    lainnya: Truck,
};

// Badge status berdasarkan persentase okupansi
const getStatusBadge = (persen) => {
    if (persen >= 100) return { label: 'PENUH', bg: 'bg-red-100 text-red-700 border-red-200', dot: 'bg-red-500' };
    if (persen > 90) return { label: 'HAMPIR PENUH', bg: 'bg-red-50 text-red-600 border-red-100', dot: 'bg-red-400' };
    if (persen > 70) return { label: 'MENGISI', bg: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-400' };
    return { label: 'TERSEDIA', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' };
};

// Format durasi parkir dari waktu masuk hingga sekarang
const formatDurasi = (waktuMasuk) => {
    const now = new Date();
    const masuk = new Date(waktuMasuk);
    const diffMs = now - masuk;
    const diffMins = Math.floor(diffMs / 60000);
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;

    if (hours === 0) return `${mins} menit`;
    return `${hours} jam ${mins} menit`;
};

export default function AreaVisualisasi({ auth, areas = [], parkedVehicles = [], summary = {} }) {
    // State: area yang sedang dipilih/dilihat detail-nya
    const [selectedAreaId, setSelectedAreaId] = useState(areas[0]?.id_area || null);

    // State: search input untuk filter kendaraan
    const [searchQuery, setSearchQuery] = useState('');

    // State: live tick untuk update durasi setiap menit
    const [, setTick] = useState(0);

    // Update durasi setiap 60 detik (live counter)
    useEffect(() => {
        const timer = setInterval(() => setTick(t => t + 1), 60000);
        return () => clearInterval(timer);
    }, []);

    // Area yang sedang dipilih
    const selectedArea = useMemo(
        () => areas.find(a => a.id_area === selectedAreaId) || areas[0],
        [areas, selectedAreaId]
    );

    // Filter kendaraan berdasarkan area terpilih & search query
    const filteredVehicles = useMemo(() => {
        let vehicles = parkedVehicles;

        // Filter by selected area
        if (selectedAreaId) {
            vehicles = vehicles.filter(v => v.id_area === selectedAreaId);
        }

        // Filter by search query (plat nomor)
        if (searchQuery.trim()) {
            const q = searchQuery.toUpperCase().trim();
            vehicles = vehicles.filter(v => v.plat_nomor.includes(q));
        }

        return vehicles;
    }, [parkedVehicles, selectedAreaId, searchQuery]);

    // Hitung total okupansi global
    const globalPersen = summary.total_kapasitas > 0
        ? Math.round((summary.total_terisi / summary.total_kapasitas) * 100)
        : 0;

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-100 rounded-xl">
                            <Map className="w-6 h-6 text-emerald-600" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight text-slate-900 leading-tight font-heading">
                                Peta Area Parkir
                            </h2>
                            <p className="text-slate-500 text-sm mt-0.5">Visualisasi Real-Time Okupansi Parkir</p>
                        </div>
                        {/* Badge LIVE */}
                        <span className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            LIVE
                        </span>
                    </div>

                    {/* Summary Stats Header */}
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-full text-sm shadow-sm">
                            <ParkingCircle className="w-4 h-4 text-emerald-500" />
                            <span className="text-slate-500">Total:</span>
                            <span className="font-bold font-mono text-slate-800">{summary.total_terisi}/{summary.total_kapasitas}</span>
                            <span className={cn(
                                "ml-1 px-2 py-0.5 rounded text-[10px] font-bold",
                                globalPersen > 90 ? "bg-red-100 text-red-600" : globalPersen > 70 ? "bg-amber-100 text-amber-600" : "bg-emerald-100 text-emerald-600"
                            )}>
                                {globalPersen}%
                            </span>
                        </div>
                        <div className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-full text-sm shadow-sm">
                            <Activity className="w-4 h-4 text-blue-500" />
                            <span className="text-slate-500">Kendaraan Aktif:</span>
                            <span className="font-bold font-mono text-slate-800">{summary.total_kendaraan}</span>
                        </div>
                    </div>
                </div>
            }
        >
            <Head title="Peta Parkir" />

            <div className="py-6 bg-slate-50/50 min-h-screen font-sans">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">

                    {/* ============================== */}
                    {/* SECTION 1: ZONE OVERVIEW CARDS */}
                    {/* ============================== */}
                    <div className="flex gap-5 overflow-x-auto pb-8 pt-4 px-4 -mx-4 -mt-4 scrollbar-thin scrollbar-thumb-slate-200">
                        {areas.map((area) => {
                            const status = getStatusBadge(area.persen);
                            const Icon = vehicleIcons[area.peruntukan] || Car;
                            const isSelected = area.id_area === selectedAreaId;

                            return (
                                <motion.button
                                    key={area.id_area}
                                    onClick={() => setSelectedAreaId(area.id_area)}
                                    whileHover={{ scale: 1.03, y: -4 }}
                                    whileTap={{ scale: 0.98 }}
                                    className={cn(
                                        "flex-none w-[270px] rounded-[2rem] p-6 border-2 transition-all duration-300 text-left group relative overflow-hidden",
                                        isSelected
                                            ? "bg-slate-900 border-slate-800 shadow-xl shadow-slate-300/50"
                                            : "bg-white border-slate-100 hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-100/50"
                                    )}
                                >
                                    {/* Glowing accent for selected card */}
                                    {isSelected && (
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-emerald-500/20 to-transparent blur-2xl -mr-10 -mt-10 rounded-full pointer-events-none"></div>
                                    )}
                                    
                                    <div className="flex items-start justify-between mb-4 relative z-10">
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                "w-11 h-11 rounded-xl flex items-center justify-center transition-colors",
                                                isSelected ? "bg-white/10 text-emerald-400" : "bg-slate-100 text-slate-500 group-hover:bg-emerald-50 group-hover:text-emerald-500"
                                            )}>
                                                <Icon className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h3 className={cn("font-bold text-[15px] leading-tight", isSelected ? "text-white" : "text-slate-800")}>
                                                    {area.nama_area}
                                                </h3>
                                                <span className={cn("text-[10px] font-bold uppercase tracking-wider capitalize mt-1 block", isSelected ? "text-slate-400" : "text-slate-400")}>
                                                    {area.peruntukan}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between relative z-10">
                                        <OccupancyGauge percentage={area.persen} size={75} strokeWidth={7} />
                                        <div className="text-right">
                                            <div className={cn("font-mono font-black text-[28px] leading-none tracking-tight", isSelected ? "text-white" : "text-slate-800")}>
                                                {area.terisi}<span className={cn("text-lg", isSelected ? "text-slate-500" : "text-slate-300")}>/{area.kapasitas}</span>
                                            </div>
                                            <span className={cn(
                                                "inline-flex items-center gap-1.5 mt-2.5 px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest border",
                                                isSelected && status.bg.includes('emerald') ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" :
                                                isSelected && status.bg.includes('red') ? "bg-red-500/20 text-red-300 border-red-500/30" :
                                                isSelected && status.bg.includes('amber') ? "bg-amber-500/20 text-amber-300 border-amber-500/30" :
                                                status.bg
                                            )}>
                                                <span className={cn("w-1.5 h-1.5 rounded-full shadow-sm", status.dot)}></span>
                                                {status.label}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    {/* Bottom highlight line for unselected hover */}
                                    {!isSelected && (
                                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 to-teal-400 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    )}
                                </motion.button>
                            );
                        })}
                    </div>


                    {/* ================================== */}
                    {/* SECTION 2: PARKING SLOT GRID       */}
                    {/* ================================== */}
                    <AnimatePresence mode="wait">
                        {selectedArea && (
                            <motion.div
                                key={selectedArea.id_area}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.35, ease: 'easeOut' }}
                                className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden"
                            >
                                {/* Grid Header */}
                                <div className="px-8 py-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-slate-900 rounded-2xl text-white">
                                            {(() => {
                                                const Icon = vehicleIcons[selectedArea.peruntukan] || Car;
                                                return <Icon className="w-6 h-6" />;
                                            })()}
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-slate-900 font-heading">{selectedArea.nama_area}</h3>
                                            <p className="text-slate-500 text-sm">
                                                <span className="font-mono font-bold text-emerald-600">{selectedArea.sisa_slot}</span> slot tersedia dari {selectedArea.kapasitas} total
                                            </p>
                                        </div>
                                    </div>

                                    {/* Quick Stats */}
                                    <div className="flex items-center gap-3">
                                        <div className="px-4 py-2 bg-slate-50 rounded-xl text-center">
                                            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Terisi</div>
                                            <div className="font-mono font-black text-lg text-slate-800">{selectedArea.terisi}</div>
                                        </div>
                                        <div className="px-4 py-2 bg-emerald-50 rounded-xl text-center">
                                            <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-500">Kosong</div>
                                            <div className="font-mono font-black text-lg text-emerald-700">{selectedArea.sisa_slot}</div>
                                        </div>
                                        <OccupancyGauge percentage={selectedArea.persen} size={56} strokeWidth={6} />
                                    </div>
                                </div>

                                {/* Slot Grid */}
                                <div className="px-8 py-8">
                                    <ParkingSlotGrid
                                        kapasitas={selectedArea.kapasitas}
                                        terisi={selectedArea.terisi}
                                        peruntukan={selectedArea.peruntukan}
                                    />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>


                    {/* ============================== */}
                    {/* SECTION 3: LIVE VEHICLE LIST   */}
                    {/* ============================== */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden"
                    >
                        {/* List Header */}
                        <div className="px-8 py-5 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div className="flex items-center gap-3">
                                <Users className="w-5 h-5 text-slate-400" />
                                <h3 className="text-lg font-bold text-slate-800">
                                    Kendaraan Parkir
                                    {selectedArea && <span className="text-slate-400 font-normal"> — {selectedArea.nama_area}</span>}
                                </h3>
                                <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2.5 py-1 rounded-full font-mono">
                                    {filteredVehicles.length} unit
                                </span>
                            </div>

                            {/* Search Input */}
                            <div className="relative w-full md:w-72">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Cari plat nomor..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm font-medium text-slate-700 focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-400"
                                />
                            </div>
                        </div>

                        {/* Vehicle Table */}
                        <div className="overflow-x-auto">
                            {filteredVehicles.length > 0 ? (
                                <table className="w-full">
                                    <thead>
                                        <tr className="text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-50">
                                            <th className="text-left px-8 py-3">Plat Nomor</th>
                                            <th className="text-left px-4 py-3">Jenis</th>
                                            <th className="text-left px-4 py-3">Waktu Masuk</th>
                                            <th className="text-left px-4 py-3">Durasi</th>
                                            <th className="text-left px-4 py-3">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredVehicles.map((vehicle, index) => {
                                            const VIcon = vehicle.jenis_kendaraan === 'motor' ? Bike : Car;

                                            return (
                                                <motion.tr
                                                    key={vehicle.id_parkir}
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: index * 0.03 }}
                                                    className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors"
                                                >
                                                    <td className="px-8 py-3.5">
                                                        <span className="font-mono font-black text-sm text-slate-800 tracking-wider">
                                                            {vehicle.plat_nomor}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3.5">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center">
                                                                <VIcon className="w-3.5 h-3.5 text-slate-500" />
                                                            </div>
                                                            <span className="text-sm font-medium text-slate-600 capitalize">{vehicle.jenis_kendaraan}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3.5">
                                                        <span className="text-sm text-slate-500 font-mono">
                                                            {new Date(vehicle.waktu_masuk).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                        <span className="text-[10px] text-slate-400 ml-2">
                                                            {new Date(vehicle.waktu_masuk).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3.5">
                                                        <div className="flex items-center gap-1.5">
                                                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                                                            <span className="text-sm font-medium text-slate-700">
                                                                {formatDurasi(vehicle.waktu_masuk)}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3.5">
                                                        {vehicle.is_vip ? (
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-full text-[10px] font-bold uppercase tracking-wider">
                                                                <Shield className="w-3 h-3" />
                                                                VIP
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full text-[10px] font-bold uppercase tracking-wider">
                                                                Umum
                                                            </span>
                                                        )}
                                                    </td>
                                                </motion.tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="px-8 py-16 text-center">
                                    <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 rounded-2xl mb-4">
                                        <ParkingCircle className="w-8 h-8 text-slate-300" />
                                    </div>
                                    <p className="text-slate-400 font-medium text-sm">
                                        {searchQuery ? 'Tidak ditemukan kendaraan dengan plat nomor tersebut.' : 'Belum ada kendaraan parkir di area ini.'}
                                    </p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
