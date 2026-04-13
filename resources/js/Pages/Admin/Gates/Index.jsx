import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MonitorCheck, Power, PowerOff, LogIn, LogOut,
    AlertTriangle, Car, Bike, Banknote, CreditCard, Activity
} from 'lucide-react';

/**
 * Halaman Admin — Manajemen Gate Parkir.
 * Palette: slate-900 (dominan) + emerald (aksen) — konsisten dgn seluruh halaman app.
 */
export default function GatesIndex({ auth, gates }) {
    const [confirmAction, setConfirmAction] = useState(null);

    const handleToggle = (kodeGate) => {
        router.post(route('admin.gates.toggle', kodeGate), {}, { preserveScroll: true });
    };

    const handleOpenAll = () => {
        router.post(route('admin.gates.open-all'), {}, {
            preserveScroll: true,
            onSuccess: () => setConfirmAction(null),
        });
    };

    const handleCloseAll = () => {
        router.post(route('admin.gates.close-all'), {}, {
            preserveScroll: true,
            onSuccess: () => setConfirmAction(null),
        });
    };

    // Grouping gate berdasarkan arah
    const gatesMasuk  = gates.filter(g => g.direction === 'masuk');
    const gatesKeluar = gates.filter(g => g.direction === 'keluar');

    const totalAktif = gates.filter(g => g.is_active).length;
    const pctAktif   = gates.length > 0 ? Math.round((totalAktif / gates.length) * 100) : 0;

    const masukAktif  = gatesMasuk.filter(g => g.is_active).length;
    const keluarAktif = gatesKeluar.filter(g => g.is_active).length;

    const containerVariants = {
        hidden: { opacity: 0 },
        show:   { opacity: 1, transition: { staggerChildren: 0.07 } }
    };
    const itemVariants = {
        hidden: { opacity: 0, y: 14 },
        show:   { opacity: 1, y: 0, transition: { duration: 0.3 } }
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight text-slate-900 leading-tight font-heading">
                            Manajemen Gate
                        </h2>
                        <p className="text-slate-500 text-sm mt-1">Kelola status operasional semua gate secara realtime.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        {/* Tombol Aktifkan Semua */}
                        <motion.button
                            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                            onClick={() => setConfirmAction('open-all')}
                            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-emerald-200 text-emerald-700 rounded-full text-sm font-bold shadow-sm hover:bg-emerald-50 hover:border-emerald-300 transition-all"
                        >
                            <Power className="w-4 h-4" />
                            Aktifkan Semua
                        </motion.button>
                        {/* Tombol Lockdown */}
                        <motion.button
                            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                            onClick={() => setConfirmAction('close-all')}
                            className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 text-white rounded-full text-sm font-bold shadow-sm shadow-rose-200 hover:bg-rose-700 transition-all"
                        >
                            <PowerOff className="w-4 h-4" />
                            Lockdown
                        </motion.button>
                    </div>
                </div>
            }
        >
            <Head title="Manajemen Gate" />

            <div className="min-h-screen bg-slate-50/50 py-8 font-sans">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">

                    {/* ============================================ */}
                    {/* BENTO GRID — STATUS OVERVIEW (3 kolom)       */}
                    {/* ============================================ */}
                    <motion.div
                        className="grid grid-cols-1 md:grid-cols-3 gap-4"
                        variants={containerVariants} initial="hidden" animate="show"
                    >
                        {/* Card 1 — Dominan: Total Gate Aktif (slate-900, identik dgn Revenue Card dashboard) */}
                        <motion.div
                            variants={itemVariants}
                            className="bg-slate-900 text-white rounded-[2rem] p-7 relative overflow-hidden flex flex-col justify-between shadow-xl shadow-slate-200"
                        >
                            <div className="relative z-10">
                                <div className="flex items-center gap-2 text-slate-400 mb-3">
                                    <MonitorCheck className="w-5 h-5" />
                                    <span className="text-sm font-medium">Total Gate Aktif</span>
                                </div>
                                {/* Angka besar dengan font-mono */}
                                <p className="text-6xl font-bold font-mono text-white leading-none">
                                    {totalAktif}
                                    <span className="text-3xl text-slate-500 font-normal">/{gates.length}</span>
                                </p>
                            </div>
                            <div className="relative z-10 mt-5">
                                {/* Progress bar emerald */}
                                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden mb-3">
                                    <div
                                        className="h-full bg-emerald-400 rounded-full transition-all duration-700"
                                        style={{ width: `${pctAktif}%` }}
                                    />
                                </div>
                                {/* Ping indicator — identik dgn System Health di dashboard */}
                                <div className="flex items-center gap-2">
                                    <span className="flex h-2.5 w-2.5 relative">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                                    </span>
                                    <span className="text-xs text-slate-400 font-medium">{pctAktif}% gate beroperasi</span>
                                </div>
                            </div>
                            {/* Ikon dekoratif di background */}
                            <Activity className="absolute -bottom-10 -right-10 w-52 h-52 text-white opacity-[0.04]" />
                        </motion.div>

                        {/* Card 2 — Gate Masuk: emerald-50, layout kaya dengan mini gate list */}
                        <motion.div
                            variants={itemVariants}
                            className="bg-emerald-50 rounded-[2rem] p-6 border border-emerald-100 relative overflow-hidden flex flex-col justify-between shadow-sm hover:shadow-md transition-all"
                        >
                            {/* Header card */}
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-9 h-9 bg-white border border-emerald-200 rounded-xl flex items-center justify-center shadow-sm">
                                        <LogIn className="w-5 h-5 text-emerald-600" />
                                    </div>
                                    <span className="text-sm font-bold text-emerald-800 uppercase tracking-wide">Gate Masuk</span>
                                </div>
                                {/* Badge status keseluruhan */}
                                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-white border border-emerald-200 text-emerald-700">
                                    {masukAktif === gatesMasuk.length ? 'SEMUA AKTIF' : `${masukAktif}/${gatesMasuk.length} AKTIF`}
                                </span>
                            </div>

                            {/* Angka besar */}
                            <p className="text-5xl font-bold font-mono text-emerald-900 leading-none mb-4">
                                {masukAktif}
                                <span className="text-2xl text-emerald-400 font-normal">/{gatesMasuk.length}</span>
                            </p>

                            {/* Mini list status per gate */}
                            <div className="space-y-2 mb-4">
                                {gatesMasuk.slice(0, 3).map(g => (
                                    <div key={g.id_gate} className="flex items-center justify-between bg-white/70 rounded-xl px-3 py-2 border border-emerald-100/60">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${g.is_active ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                                            <span className="text-xs font-medium text-slate-700 truncate max-w-[120px]">{g.nama_gate}</span>
                                        </div>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                            g.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'
                                        }`}>
                                            {g.is_active ? 'ON' : 'OFF'}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            {/* Progress bar */}
                            <div>
                                <div className="h-1.5 bg-emerald-200 rounded-full overflow-hidden mb-1.5">
                                    <div
                                        className="h-full bg-emerald-500 rounded-full transition-all duration-700"
                                        style={{ width: gatesMasuk.length > 0 ? `${Math.round((masukAktif / gatesMasuk.length) * 100)}%` : '0%' }}
                                    />
                                </div>
                                <p className="text-xs text-emerald-600 font-medium">Self-service · penerimaan kendaraan</p>
                            </div>
                        </motion.div>

                        {/* Card 3 — Gate Keluar: bg-white, layout kaya dengan mini gate list */}
                        <motion.div
                            variants={itemVariants}
                            className="bg-white rounded-[2rem] p-6 border border-slate-100 relative overflow-hidden flex flex-col justify-between shadow-sm hover:shadow-md transition-all group"
                        >
                            {/* Header card */}
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-9 h-9 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-center shadow-sm group-hover:bg-emerald-100 transition-colors">
                                        <LogOut className="w-5 h-5 text-emerald-600" />
                                    </div>
                                    <span className="text-sm font-bold text-slate-700 uppercase tracking-wide">Gate Keluar</span>
                                </div>
                                {/* Badge status keseluruhan */}
                                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700">
                                    {keluarAktif === gatesKeluar.length ? 'SEMUA AKTIF' : `${keluarAktif}/${gatesKeluar.length} AKTIF`}
                                </span>
                            </div>

                            {/* Angka besar */}
                            <p className="text-5xl font-bold font-mono text-slate-800 leading-none mb-4">
                                {keluarAktif}
                                <span className="text-2xl text-slate-300 font-normal">/{gatesKeluar.length}</span>
                            </p>

                            {/* Mini list status per gate */}
                            <div className="space-y-2 mb-4">
                                {gatesKeluar.slice(0, 3).map(g => (
                                    <div key={g.id_gate} className="flex items-center justify-between bg-slate-50 rounded-xl px-3 py-2 border border-slate-100 group-hover:border-slate-200 transition-colors">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${g.is_active ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                                            <span className="text-xs font-medium text-slate-700 truncate max-w-[120px]">{g.nama_gate}</span>
                                        </div>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                            g.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'
                                        }`}>
                                            {g.is_active ? 'ON' : 'OFF'}
                                        </span>
                                    </div>
                                ))}
                                {gatesKeluar.length > 3 && (
                                    <p className="text-[11px] text-slate-400 text-center pt-1">+{gatesKeluar.length - 3} gate lainnya</p>
                                )}
                            </div>

                            {/* Progress bar */}
                            <div>
                                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mb-1.5">
                                    <div
                                        className="h-full bg-emerald-500 rounded-full transition-all duration-700"
                                        style={{ width: gatesKeluar.length > 0 ? `${Math.round((keluarAktif / gatesKeluar.length) * 100)}%` : '0%' }}
                                    />
                                </div>
                                <p className="text-xs text-slate-400 font-medium">Petugas & Kasir · pengeluaran kendaraan</p>
                            </div>
                        </motion.div>
                    </motion.div>

                    {/* ============================================ */}
                    {/* SECTION: GATE MASUK                          */}
                    {/* ============================================ */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.25 }}
                        className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden"
                    >
                        {/* Header seksi dengan strip emerald tipis */}
                        <div className="bg-emerald-50/60 border-b border-emerald-100/80 px-6 py-4 flex items-center gap-3">
                            <div className="w-9 h-9 bg-white border border-emerald-200 rounded-xl flex items-center justify-center shadow-sm">
                                <LogIn className="w-5 h-5 text-emerald-600" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800 leading-none font-heading">
                                    Gate Masuk <span className="text-emerald-600 font-medium">(Self-Service)</span>
                                </h3>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    {masukAktif} aktif dari {gatesMasuk.length} gate
                                </p>
                            </div>
                        </div>

                        <div className="p-6">
                            <motion.div
                                className="grid grid-cols-1 md:grid-cols-2 gap-4"
                                variants={containerVariants} initial="hidden" animate="show"
                            >
                                {gatesMasuk.length > 0 ? (
                                    gatesMasuk.map(gate => (
                                        <motion.div key={gate.id_gate} variants={itemVariants}>
                                            <GateCard gate={gate} onToggle={handleToggle} />
                                        </motion.div>
                                    ))
                                ) : (
                                    <div className="col-span-2 py-10 text-center text-slate-400 italic text-sm">
                                        Tidak ada gate masuk terdaftar.
                                    </div>
                                )}
                            </motion.div>
                        </div>
                    </motion.div>

                    {/* ============================================ */}
                    {/* SECTION: GATE KELUAR                         */}
                    {/* ============================================ */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.35 }}
                        className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden"
                    >
                        {/* Header seksi dengan strip slate lebih netral */}
                        <div className="bg-slate-50/80 border-b border-slate-100 px-6 py-4 flex items-center gap-3">
                            <div className="w-9 h-9 bg-white border border-slate-200 rounded-xl flex items-center justify-center shadow-sm">
                                <LogOut className="w-5 h-5 text-emerald-600" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800 leading-none font-heading">
                                    Gate Keluar <span className="text-slate-400 font-medium">(Petugas & Kasir)</span>
                                </h3>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    {keluarAktif} aktif dari {gatesKeluar.length} gate
                                </p>
                            </div>
                        </div>

                        <div className="p-6">
                            <motion.div
                                className="grid grid-cols-1 md:grid-cols-2 gap-4"
                                variants={containerVariants} initial="hidden" animate="show"
                            >
                                {gatesKeluar.length > 0 ? (
                                    gatesKeluar.map(gate => (
                                        <motion.div key={gate.id_gate} variants={itemVariants}>
                                            <GateCard gate={gate} onToggle={handleToggle} />
                                        </motion.div>
                                    ))
                                ) : (
                                    <div className="col-span-2 py-10 text-center text-slate-400 italic text-sm">
                                        Tidak ada gate keluar terdaftar.
                                    </div>
                                )}
                            </motion.div>
                        </div>
                    </motion.div>

                </div>
            </div>

            {/* ============================================ */}
            {/* MODAL KONFIRMASI                             */}
            {/* ============================================ */}
            <AnimatePresence>
                {confirmAction && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
                        onClick={() => setConfirmAction(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.92, opacity: 0, y: 12 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.92, opacity: 0, y: 12 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                            className="bg-white rounded-[2rem] p-8 max-w-md w-full mx-4 shadow-2xl border border-slate-100"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="text-center">
                                {confirmAction === 'open-all' ? (
                                    <>
                                        {/* Icon aktifkan — emerald */}
                                        <div className="w-20 h-20 bg-emerald-50 border border-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5 shadow-sm">
                                            <Power className="w-9 h-9 text-emerald-500" />
                                        </div>
                                        <h3 className="text-xl font-bold text-slate-800 mb-2 font-heading">
                                            Aktifkan Semua Gate?
                                        </h3>
                                        <p className="text-slate-500 text-sm mb-7">
                                            Semua gate akan diaktifkan dan dapat menerima kendaraan masuk maupun keluar.
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        {/* Icon lockdown — rose/merah */}
                                        <div className="w-20 h-20 bg-rose-50 border border-rose-100 rounded-full flex items-center justify-center mx-auto mb-5 shadow-sm">
                                            <AlertTriangle className="w-9 h-9 text-rose-500" />
                                        </div>
                                        <h3 className="text-xl font-bold text-slate-800 mb-2 font-heading">
                                            LOCKDOWN Semua Gate?
                                        </h3>
                                        <p className="text-slate-500 text-sm mb-7">
                                            Semua gate akan dinonaktifkan. Kendaraan{' '}
                                            <strong className="text-rose-600">tidak bisa masuk maupun keluar</strong>{' '}
                                            sampai gate diaktifkan kembali.
                                        </p>
                                    </>
                                )}
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setConfirmAction(null)}
                                        className="flex-1 py-3 rounded-2xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 text-sm transition-colors"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        onClick={confirmAction === 'open-all' ? handleOpenAll : handleCloseAll}
                                        className={`flex-1 py-3 rounded-2xl font-bold text-white text-sm transition-all ${
                                            confirmAction === 'open-all'
                                                ? 'bg-emerald-500 hover:bg-emerald-600 shadow-md shadow-emerald-100'
                                                : 'bg-rose-500 hover:bg-rose-600 shadow-md shadow-rose-100'
                                        }`}
                                    >
                                        {confirmAction === 'open-all' ? 'Ya, Aktifkan' : 'Ya, Lockdown'}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </AuthenticatedLayout>
    );
}

/**
 * GateCard — Kartu gate individual.
 * Palette: white bg, emerald aksen untuk gate aktif, slate untuk nonaktif.
 * Left-border emerald sebagai penanda visual kuat namun tidak norak.
 */
function GateCard({ gate, onToggle }) {
    const isActive = gate.is_active;
    const isMasuk  = gate.direction === 'masuk';

    return (
        <div className={`relative rounded-2xl border-l-4 border border-slate-100 p-5 overflow-hidden group transition-all ${
            isActive
                ? 'border-l-emerald-400 bg-white shadow-sm hover:shadow-md hover:border-slate-200'
                : 'border-l-slate-200 bg-slate-50 opacity-60 hover:opacity-80'
        }`}>
            {/* Subtle emerald glow saat aktif */}
            {isActive && (
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/[0.04] to-transparent pointer-events-none" />
            )}

            {/* Baris atas: info gate + toggle */}
            <div className="relative z-10 flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    {/* Dot animasi — sama persis dgn System Health di dashboard */}
                    <div className={`relative w-3 h-3 rounded-full flex-shrink-0 mt-0.5 ${
                        isActive ? 'bg-emerald-500' : 'bg-slate-300'
                    }`}>
                        {isActive && (
                            <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-40" />
                        )}
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-800 text-sm leading-tight font-heading">
                            {gate.nama_gate}
                        </h4>
                        <p className="text-[11px] text-slate-400 font-mono mt-0.5">{gate.kode_gate}</p>
                    </div>
                </div>

                {/* Toggle Switch — selalu emerald saat aktif */}
                <button
                    onClick={() => onToggle(gate.kode_gate)}
                    title={isActive ? 'Nonaktifkan Gate' : 'Aktifkan Gate'}
                    className={`relative w-12 h-6 rounded-full transition-all duration-300 flex-shrink-0 shadow-inner ${
                        isActive ? 'bg-emerald-500' : 'bg-slate-200'
                    }`}
                >
                    <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-300 ${
                        isActive ? 'translate-x-[26px]' : 'translate-x-0.5'
                    }`} />
                </button>
            </div>

            {/* Baris bawah: badge info */}
            <div className="relative z-10 flex items-center gap-2 flex-wrap">
                {/* Badge Arah — emerald untuk masuk, slate untuk keluar */}
                <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 ${
                    isMasuk
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                }`}>
                    {isMasuk ? <LogIn className="w-3 h-3" /> : <LogOut className="w-3 h-3" />}
                    {isMasuk ? 'Masuk' : 'Keluar'}
                </span>

                {/* Badge Jenis Kendaraan */}
                <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200 flex items-center gap-1">
                    {gate.jenis_kendaraan === 'motor'
                        ? <Bike className="w-3 h-3" />
                        : <Car className="w-3 h-3" />
                    }
                    {gate.jenis_kendaraan === 'motor' ? 'Motor' : 'Mobil'}
                </span>

                {/* Badge Metode Pembayaran */}
                {gate.pembayaran && (
                    <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200 flex items-center gap-1">
                        {gate.pembayaran === 'cash'
                            ? <Banknote className="w-3 h-3" />
                            : <CreditCard className="w-3 h-3" />
                        }
                        {gate.pembayaran === 'cash' ? 'Cash' : 'Cashless'}
                    </span>
                )}

                {/* Badge Status — emerald aktif, slate nonaktif */}
                <span className={`ml-auto px-2.5 py-1 rounded-lg text-[11px] font-bold border ${
                    isActive
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-slate-100 text-slate-400 border-slate-200'
                }`}>
                    {isActive ? '● Aktif' : '○ Nonaktif'}
                </span>
            </div>
        </div>
    );
}
