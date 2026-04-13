import { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Clock, ParkingCircle, ArrowLeft } from 'lucide-react';
import PasswordConfirmModal from '@/Components/PasswordConfirmModal';

export default function GateLayout({ title, gateName, children, gateType = 'motor' }) {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [showBackModal, setShowBackModal] = useState(false);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const accentClasses = {
        motor: {
            border: 'border-cyan-500/30',
            text: 'text-cyan-400',
            bg: 'bg-cyan-500/20',
            glow: 'shadow-cyan-500/50',
        },
        mobil: {
            border: 'border-amber-500/30',
            text: 'text-amber-400',
            bg: 'bg-amber-500/20',
            glow: 'shadow-amber-500/50',
        },
    };
    const accent = accentClasses[gateType] || accentClasses.motor;

    const handleBackConfirmed = () => {
        setShowBackModal(false);
        router.visit(route('dashboard'));
    };

    return (
        <>
            <Head title={title || gateName} />

            {/* DARK MODE: Mesh Gradient Background */}
            <div className="min-h-screen bg-gradient-to-br from-[#022c22] via-[#064e3b] to-[#0f172a] flex flex-col select-none relative overflow-hidden text-white font-sans">
                {/* Immersive Background Effects */}
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-500 rounded-full mix-blend-overlay filter blur-[120px] opacity-20 -translate-y-1/2 translate-x-1/3"></div>
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-teal-400 rounded-full mix-blend-overlay filter blur-[100px] opacity-20 translate-y-1/3 -translate-x-1/3"></div>
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-30 brightness-100 contrast-150 pointer-events-none"></div>

                <div className="relative z-10 flex flex-col min-h-screen">
                    {/* Header Bar — Frosted Glass Dark */}
                    <header className="flex items-center justify-between px-8 py-5 border-b border-white/10 bg-black/20 backdrop-blur-2xl">
                        <div className="flex items-center gap-5">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setShowBackModal(true)}
                                className="w-11 h-11 rounded-[14px] bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 hover:border-white/20 transition-all group shadow-lg backdrop-blur-md"
                                title="Kembali ke Dashboard"
                            >
                                <ArrowLeft className="w-5 h-5 text-slate-300 group-hover:text-white transition-colors" />
                            </motion.button>

                            <div className="flex items-center gap-3">
                                <div className={`w-12 h-12 rounded-2xl ${accent.bg} flex items-center justify-center border border-white/5`}>
                                    <ParkingCircle className={`w-7 h-7 ${accent.text}`} />
                                </div>
                                <div>
                                    <h1 className="text-white font-['Outfit'] font-bold text-xl tracking-tight leading-tight">
                                        RS Hermina Arcamanik
                                    </h1>
                                    <p className={`text-xs font-['DM_Sans'] ${accent.text} tracking-[0.2em] font-bold uppercase mt-0.5`}>
                                        SMART PARKING SYSTEM
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Nama Gate */}
                        <div className="text-center absolute left-1/2 -translate-x-1/2">
                            <motion.h2
                                initial={{ opacity: 0, y: -8 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`text-2xl font-['Outfit'] font-bold text-white tracking-wide border px-6 py-2 rounded-full backdrop-blur-md bg-white/5 ${accent.border}`}
                            >
                                {gateName}
                            </motion.h2>
                        </div>

                        {/* Clock Realtime */}
                        <div className="flex items-center gap-4 bg-white/5 border border-white/10 px-5 py-2.5 rounded-2xl backdrop-blur-md">
                            <Clock className="w-6 h-6 text-emerald-400" />
                            <div className="text-right">
                                <p className="text-white font-['JetBrains_Mono'] text-2xl font-bold tracking-widest leading-none">
                                    {currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                </p>
                                <p className="text-emerald-200/70 text-[10px] uppercase font-bold tracking-wider font-['DM_Sans'] mt-1 leading-none">
                                    {currentTime.toLocaleDateString('id-ID', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
                                </p>
                            </div>
                        </div>
                    </header>

                    {/* Main Content Area */}
                    <main className="flex-1 flex flex-col p-6 overflow-hidden">
                        {children}
                    </main>

                    {/* Footer — Minimal */}
                    <footer className="px-8 py-4 border-t border-white/10 bg-black/20 backdrop-blur-xl">
                        <div className="flex items-center justify-between text-[11px] text-slate-400 font-['DM_Sans'] font-bold tracking-widest uppercase">
                            <span className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                Hermina Smart Parking System v2.0
                            </span>
                            <span>Sistem Scan Kamera Otomatis Aktif</span>
                        </div>
                    </footer>
                </div>
            </div>

            <PasswordConfirmModal
                show={showBackModal}
                onClose={() => setShowBackModal(false)}
                onConfirm={handleBackConfirmed}
                title="Kembali ke Dashboard"
                description="Masukkan password petugas untuk keluar dari mode gate."
            />
        </>
    );
}
