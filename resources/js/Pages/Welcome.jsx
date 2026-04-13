import { Link, Head } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { ScanLine, ArrowUpRight, Activity, ArrowRight } from 'lucide-react';
import PublicNavbar from '@/Components/PublicNavbar';

export default function Welcome({ auth, sisa_slot = 0 }) {
    return (
        <>
            <Head title="Smart Access Reimagined" />

            <div className="min-h-screen bg-[#F8F9FA] font-sans selection:bg-emerald-500 selection:text-white pb-20">

                {/* NAVBAR — Komponen bersama */}
                <PublicNavbar auth={auth} activePage="home" />

                {/* 2. HERO SECTION (Full Screen Immersive) */}
                <header className="relative w-[calc(100%-2rem)] h-[calc(100vh-2rem)] mx-auto m-4 rounded-[2.5rem] overflow-hidden shadow-2xl group">
                    {/* Background */}
                    <div className="absolute inset-0 overflow-hidden">
                        <img
                            src="/hermina-building.png"
                            alt="Hermina Architecture"
                            className="w-full h-full object-cover transition-transform duration-[10s] ease-out group-hover:scale-105"
                        />
                    </div>

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>

                    {/* Content (Bottom Left) */}
                    <div className="absolute bottom-0 left-0 p-8 md:p-12 w-full max-w-4xl">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                        >
                            {/* Eyebrow */}
                            <div className="text-xs font-bold tracking-[0.2em] text-emerald-400 mb-4 uppercase">
                                Integrated Hospital System v2.0
                            </div>

                            {/* Heading */}
                            <h1 className="text-5xl md:text-7xl font-bold text-white tracking-minus leading-[1.1] mb-6 drop-shadow-lg">
                                Smart Access.<br />
                                Reimagined.
                            </h1>

                            {/* Subtext */}
                            <p className="text-sm text-gray-300 max-w-md leading-relaxed font-medium">
                                Pengelolaan parkir klinis dengan teknologi AI-OCR dan integrasi data real-time untuk RS Hermina Arcamanik. Efisiensi tanpa kompromi.
                            </p>
                        </motion.div>
                    </div>
                </header>

                {/* 3. INTRO NARRATIVE */}
                <section className="max-w-7xl mx-auto px-6 mt-32 mb-32">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="flex flex-col md:flex-row gap-8 items-start"
                    >
                        {/* Label Badge */}
                        <div className="md:w-1/4">
                            <span className="inline-block rounded-full border border-slate-300 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-slate-500">
                                System Overview
                            </span>
                        </div>

                        {/* Narrative Content */}
                        <div className="md:w-3/4">
                            <p className="text-2xl md:text-4xl font-light leading-snug text-slate-900">
                                Di RS Hermina, setiap detik berharga. Sistem parkir kami dirancang bukan hanya untuk keamanan, tapi untuk <span className="font-semibold text-emerald-600">kecepatan akses</span> tenaga medis tanpa kompromi.
                            </p>
                        </div>
                    </motion.div>
                </section>

                {/* 4. BENTO GRID SECTION (With Descriptions) */}
                <section className="mx-4 mt-6 grid grid-cols-1 md:grid-cols-3 gap-10 pb-20">

                    {/* CARD 1: AI Recognition */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="relative bg-slate-900 rounded-[2.5rem] p-10 flex flex-col justify-between min-h-[360px] overflow-hidden hover:scale-[1.01] transition-transform duration-500 group shadow-2xl shadow-slate-900/20"
                    >
                        {/* Grid Pattern */}
                        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`, backgroundSize: '20px 20px' }}></div>

                        <div className="relative z-10">
                            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-6 text-emerald-400 border border-white/5">
                                <ScanLine className="w-6 h-6" />
                            </div>
                            <h3 className="text-3xl font-semibold text-white leading-tight mb-2">
                                AI License <br /> Recognition
                            </h3>
                            <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
                                Automated entry with Tesseract engine for 99% accuracy.
                            </p>
                        </div>

                        {/* Status UI */}
                        <div className="relative z-10 flex items-center gap-3 bg-white/5 backdrop-blur-sm self-start px-4 py-2 rounded-full border border-white/10 mt-auto">
                            <span className="relative flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                            </span>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">System Operational</span>
                        </div>
                    </motion.div>

                    {/* CARD 2: VIP Track */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="relative bg-emerald-950 rounded-[2.5rem] p-10 min-h-[360px] overflow-hidden group hover:scale-[1.01] transition-transform duration-500 flex flex-col justify-end shadow-2xl shadow-emerald-900/30"
                    >
                        {/* Image */}
                        <div className="absolute inset-0">
                            <img
                                src="/images/photo-1631217868264-e5b90bb7e133.avif"
                                alt="Medical Staff"
                                className="w-full h-full object-cover opacity-60 grayscale mix-blend-luminosity transition-all duration-1000 group-hover:scale-110"
                            />
                        </div>
                        {/* Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-emerald-950 via-emerald-900/20 to-transparent"></div>

                        <div className="relative z-10">
                            <h3 className="text-3xl font-bold text-white tracking-tight leading-none mb-2">
                                VIP <br /> Fast Track
                            </h3>
                            <p className="text-emerald-200/90 text-sm font-medium">
                                Encrypted QR access for Doctors & Staff.
                            </p>
                        </div>

                        {/* Arrow Button */}
                        <div className="absolute top-8 right-8 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg group-hover:bg-emerald-400 transition-colors">
                            <ArrowUpRight className="w-5 h-5 text-slate-900" />
                        </div>
                    </motion.div>

                    {/* CARD 3: Capacity — data dari database */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3 }}
                        className="bg-white rounded-[2.5rem] p-10 min-h-[360px] flex flex-col justify-between hover:scale-[1.01] transition-transform duration-500 shadow-xl shadow-slate-200/50 border border-slate-100"
                    >
                        <div className="flex items-center gap-2 text-slate-400">
                            <Activity className="w-4 h-4 text-emerald-600" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Real-time Monitor</span>
                        </div>

                        <div className="mt-4">
                            <div className="text-6xl font-bold tracking-tighter text-slate-900 leading-none">
                                {sisa_slot}<span className="text-emerald-500 text-4xl align-top">+</span>
                            </div>
                            <p className="text-slate-400 font-medium text-sm mt-2">Available slots verified instantly.</p>
                        </div>

                        {/* Chart */}
                        <div className="flex items-end justify-between gap-1.5 h-16 mt-auto">
                            {[35, 60, 45, 75, 50, 85, 65, 45, 55, 70, 45, 80].map((height, i) => (
                                <div
                                    key={i}
                                    className={`w-full rounded-sm transition-all duration-1000 ease-out ${i === 5 ? 'bg-emerald-500' : 'bg-slate-100'}`}
                                    style={{ height: `${height}%` }}
                                ></div>
                            ))}
                        </div>
                    </motion.div>

                </section>

                {/* 5. IMPACT STATS */}
                <section className="max-w-7xl mx-auto px-6 mt-6 mb-20 bg-slate-50 rounded-[3rem] py-20">
                    <div className="text-center mb-16">
                        <span className="text-xs font-bold uppercase tracking-[0.3em] text-slate-400">Performance Metrics</span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center divide-x divide-slate-200/50">
                        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}>
                            <div className="text-5xl md:text-6xl font-bold text-slate-900 tracking-tighter">99.8%</div>
                            <div className="text-xs text-slate-500 mt-3 font-bold uppercase tracking-wider">OCR Accuracy</div>
                        </motion.div>
                        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}>
                            <div className="text-5xl md:text-6xl font-bold text-slate-900 tracking-tighter">&lt; 2s</div>
                            <div className="text-xs text-slate-500 mt-3 font-bold uppercase tracking-wider">Gate Response</div>
                        </motion.div>
                        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 }}>
                            <div className="text-5xl md:text-6xl font-bold text-slate-900 tracking-tighter">24/7</div>
                            <div className="text-xs text-slate-500 mt-3 font-bold uppercase tracking-wider">Continuous Uptime</div>
                        </motion.div>
                        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.4 }}>
                            <div className="text-5xl md:text-6xl font-bold text-slate-900 tracking-tighter">Zero</div>
                            <div className="text-xs text-slate-500 mt-3 font-bold uppercase tracking-wider">Queue Tolerance</div>
                        </motion.div>
                    </div>
                </section>

                <footer className="px-8 text-center pb-8 border-t border-slate-200 pt-8 max-w-7xl mx-auto">
                    <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-slate-300 hover:text-emerald-500 transition-colors cursor-pointer">
                        &copy; 2026 RS Hermina Arcamanik | UKK Rekayasa Perangkat Lunak
                    </p>
                </footer>
            </div>
        </>
    );
}
