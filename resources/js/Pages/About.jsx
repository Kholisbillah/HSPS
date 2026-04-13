import { Link, Head } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Code, Database, Globe, Cpu } from 'lucide-react';
import PublicNavbar from '@/Components/PublicNavbar';

export default function About({ auth }) {
    return (
        <>
            <Head title="About Us - Hermina Smart Parking" />

            <div className="min-h-screen bg-[#F8F9FA] font-sans selection:bg-emerald-500 selection:text-white pb-20">

                {/* NAVBAR — Komponen bersama */}
                <PublicNavbar auth={auth} activePage="about" />

                {/* HEADER (Rounded 50vh) */}
                <header className="relative w-[calc(100%-2rem)] h-[50vh] mx-auto m-4 rounded-[2.5rem] overflow-hidden shadow-xl group">
                    <div className="absolute inset-0">
                        <img
                            src="/images/photo-1519494026892-80bbd2d6fd0d.avif"
                            alt="Hospital Architecture"
                            className="w-full h-full object-cover transition-transform duration-1000 ease-out group-hover:scale-105"
                        />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent"></div>
                    <div className="absolute bottom-0 left-0 p-12">
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-5xl md:text-6xl font-bold text-white tracking-tighter mb-4"
                        >
                            Behind the <span className="text-emerald-400">System.</span>
                        </motion.h1>
                        <p className="text-slate-300 max-w-lg text-lg">
                            Building a faster, safer, and more efficient healthcare access experience.
                        </p>
                    </div>
                </header>

                {/* SECTION 1: VISION (Split View) */}
                <section className="max-w-7xl mx-auto px-6 mt-24">
                    <div className="flex flex-col md:flex-row gap-16 items-center">
                        <div className="md:w-1/2">
                            <span className="inline-block rounded-full border border-slate-300 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-emerald-600 mb-6">
                                Our Vision
                            </span>
                            <h2 className="text-4xl font-bold text-slate-900 tracking-tight mb-6 leading-tight">
                                Dedication to <br /> Clinical Precision.
                            </h2>
                            <p className="text-slate-500 text-lg leading-relaxed mb-6">
                                At RS Hermina Arcamanik, we believe that patient care starts the moment you enter our gates. Our Smart Parking System isn't just about parking cars—it's about removing friction from the healthcare journey.
                            </p>
                            <p className="text-slate-500 text-lg leading-relaxed">
                                By integrating AI-powered License Plate Recognition and real-time data analytics, we ensure that doctors arrive on time and patients find access when they need it most.
                            </p>
                        </div>
                        <div className="md:w-1/2">
                            <div className="relative rounded-[2.5rem] overflow-hidden h-[400px] shadow-2xl">
                                <img
                                    src="/images/photo-1576091160399-112ba8d25d1d.avif"
                                    alt="Doctor Vision"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        </div>
                    </div>
                </section>

                {/* SECTION 2: THE TECH STACK */}
                <section className="max-w-7xl mx-auto px-6 mt-32">
                    <div className="text-center mb-16">
                        <span className="text-xs font-bold uppercase tracking-[0.3em] text-slate-400">Powered By Modern Tech</span>
                    </div>
                    <div className="flex flex-wrap justify-center gap-12 md:gap-20 opacity-70">
                        <div className="flex flex-col items-center gap-4 group transition-all duration-300 hover:opacity-100 grayscale hover:grayscale-0">
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                                <Code className="w-10 h-10 text-red-500" />
                            </div>
                            <span className="font-bold text-slate-600">Laravel 10</span>
                        </div>
                        <div className="flex flex-col items-center gap-4 group transition-all duration-300 hover:opacity-100 grayscale hover:grayscale-0">
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                                <Globe className="w-10 h-10 text-blue-400" />
                            </div>
                            <span className="font-bold text-slate-600">React & Inertia</span>
                        </div>
                        <div className="flex flex-col items-center gap-4 group transition-all duration-300 hover:opacity-100 grayscale hover:grayscale-0">
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                                <Cpu className="w-10 h-10 text-emerald-500" />
                            </div>
                            <span className="font-bold text-slate-600">AI Tesseract OCR</span>
                        </div>
                        <div className="flex flex-col items-center gap-4 group transition-all duration-300 hover:opacity-100 grayscale hover:grayscale-0">
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                                <Database className="w-10 h-10 text-indigo-500" />
                            </div>
                            <span className="font-bold text-slate-600">MySQL</span>
                        </div>
                    </div>
                </section>

                {/* SECTION 3: TEAM */}
                <section className="max-w-7xl mx-auto px-6 mt-32 mb-20">
                    <h2 className="text-3xl font-bold text-slate-900 tracking-tight mb-12 text-center">Meet the Architects</h2>
                    <div className="grid grid-cols-1 md:grid-cols-1 gap-8 max-w-2xl mx-auto">
                        <div className="bg-white p-12 rounded-[2.5rem] border border-slate-100 shadow-xl flex flex-col md:flex-row items-center gap-10 hover:scale-[1.02] transition-transform text-center md:text-left">
                            <div className="w-40 h-40 rounded-full bg-slate-200 overflow-hidden shrink-0 border-4 border-emerald-100 shadow-inner">
                                <img
                                    src="/images/Tauhidan.png"
                                    alt="Tauhidan Kholis Billah"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div>
                                <h3 className="text-3xl font-bold text-slate-900 mb-2">Tauhidan Kholis Billah</h3>
                                <p className="text-emerald-600 text-lg font-bold uppercase tracking-widest mb-3">System Architect</p>
                                <p className="text-slate-500 text-base leading-relaxed">Responsible for the end-to-end development, full-stack architecture, and enterprise-grade security compliance of the Hermina Smart Parking System.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Footer */}
                <footer className="px-8 text-center pb-8 pt-8 max-w-7xl mx-auto border-t border-slate-200 mt-20">
                    <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-slate-300 hover:text-emerald-500 transition-colors cursor-pointer">
                        &copy; 2026 RS Hermina Arcamanik
                    </p>
                </footer>

            </div>
        </>
    );
}
