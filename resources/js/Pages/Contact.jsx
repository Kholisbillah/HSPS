import { Link, Head } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { MapPin, Phone, Mail } from 'lucide-react';
import PublicNavbar from '@/Components/PublicNavbar';

export default function Contact({ auth }) {
    return (
        <>
            <Head title="Contact - Hermina Smart Parking" />

            <div className="min-h-screen bg-[#F8F9FA] font-sans selection:bg-emerald-500 selection:text-white pb-20">

                {/* NAVBAR — Komponen bersama */}
                <PublicNavbar auth={auth} activePage="contact" />

                {/* HEADER */}
                <header className="relative w-[calc(100%-2rem)] h-[50vh] mx-auto m-4 rounded-[2.5rem] overflow-hidden shadow-xl group bg-slate-900">
                    <div className="absolute inset-0 opacity-40">
                        <img
                            src="/images/photo-1577563908411-5077b6dc7624.avif"
                            alt="Map Background"
                            className="w-full h-full object-cover grayscale invert transition-transform duration-1000 ease-out group-hover:scale-105"
                        />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-900/50 to-transparent"></div>

                    <div className="absolute bottom-0 left-0 p-12">
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-5xl md:text-6xl font-bold text-white tracking-tighter mb-4"
                        >
                            Get in <span className="text-emerald-400">Touch.</span>
                        </motion.h1>
                        <p className="text-slate-400 max-w-lg text-lg">
                            We are ready to assist you. 24/7 Support for patients and staff.
                        </p>
                    </div>
                </header>

                {/* CONTACT GRID */}
                <section className="max-w-7xl mx-auto px-6 mt-24 mb-20">
                    <div className="max-w-2xl mx-auto">

                        {/* Center: Info Only */}
                        <div className="flex flex-col items-center text-center">
                            <span className="text-xs font-bold uppercase tracking-[0.3em] text-emerald-600 mb-6 block">Headquarters</span>
                            <h2 className="text-4xl font-bold text-slate-900 mb-12 leading-tight">
                                RS Hermina <br /> Arcamanik
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full text-left">
                                <div className="flex flex-col items-center text-center gap-4 group cursor-pointer p-6 rounded-[2rem] hover:bg-white hover:shadow-xl transition-all duration-300">
                                    <div className="p-4 bg-white rounded-2xl shadow-sm border border-slate-100 group-hover:bg-emerald-50 transition-colors">
                                        <MapPin className="w-8 h-8 text-slate-700" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-900 text-lg mb-2">Address</p>
                                        <p className="text-slate-500 text-sm">Jl. A.H. Nasution No.50, Antapani Wetan, Bandung</p>
                                    </div>
                                </div>

                                <div className="flex flex-col items-center text-center gap-4 group cursor-pointer p-6 rounded-[2rem] hover:bg-white hover:shadow-xl transition-all duration-300">
                                    <div className="p-4 bg-white rounded-2xl shadow-sm border border-slate-100 group-hover:bg-emerald-50 transition-colors">
                                        <Phone className="w-8 h-8 text-slate-700" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-900 text-lg mb-2">Emergency</p>
                                        <p className="text-slate-500 text-sm">(022) 8724 2525</p>
                                    </div>
                                </div>

                                <div className="flex flex-col items-center text-center gap-4 group cursor-pointer p-6 rounded-[2rem] hover:bg-white hover:shadow-xl transition-all duration-300">
                                    <div className="p-4 bg-white rounded-2xl shadow-sm border border-slate-100 group-hover:bg-emerald-50 transition-colors">
                                        <Mail className="w-8 h-8 text-slate-700" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-900 text-lg mb-2">Email</p>
                                        <p className="text-slate-500 text-sm">support@hermina.com</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </section>

                {/* FOOTER MAP */}
                <section className="max-w-7xl mx-auto px-6 mb-20">
                    <div className="w-full h-[400px] rounded-[2.5rem] overflow-hidden shadow-xl border border-slate-200">
                        <iframe
                            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3960.835843469315!2d107.66986631477278!3d-6.910214995006935!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e68e7b1a1a1a1a1%3A0x1a1a1a1a1a1a1a1a!2sRS%20Hermina%20Arcamanik!5e0!3m2!1sen!2sid!4v1620000000000!5m2!1sen!2sid"
                            width="100%"
                            height="100%"
                            style={{ border: 0, filter: 'grayscale(100%) contrast(1.2)' }}
                            allowFullScreen=""
                            loading="lazy"
                        ></iframe>
                    </div>
                </section>

                <footer className="px-8 text-center pb-8 pt-8 max-w-7xl mx-auto border-t border-slate-200">
                    <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-slate-300 hover:text-emerald-500 transition-colors cursor-pointer">
                        &copy; 2026 RS Hermina Arcamanik
                    </p>
                </footer>

            </div>
        </>
    );
}
