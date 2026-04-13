import { Link, Head } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { ScanLine, ShieldCheck, CreditCard, CheckCircle2 } from 'lucide-react';
import PublicNavbar from '@/Components/PublicNavbar';

export default function Services({ auth, tarifs = [] }) {
    // Format Rupiah dari angka database
    const formatRupiah = (num) =>
        new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num || 0);

    // Mapping icon dan warna per jenis kendaraan
    const vehicleConfig = {
        motor: { label: 'Motorcycle', color: 'text-slate-900', features: ['Secure Parking Slot', 'CCTV Monitoring'] },
        mobil: { label: 'Car (Mobil)', color: 'text-white', features: ['Spacious Slots', 'Valet Assistance', 'Covered Area'], featured: true },
        lainnya: { label: 'Other Vehicle', color: 'text-slate-900', features: ['Flexible Slots', 'CCTV Monitoring'] },
    };

    return (
        <>
            <Head title="Services - Hermina Smart Parking" />

            <div className="min-h-screen bg-[#F8F9FA] font-sans selection:bg-emerald-500 selection:text-white pb-20">

                {/* NAVBAR — Komponen bersama */}
                <PublicNavbar auth={auth} activePage="services" />

                {/* HEADER */}
                <header className="relative w-[calc(100%-2rem)] h-[50vh] mx-auto m-4 rounded-[2.5rem] overflow-hidden shadow-xl group bg-slate-900">
                    <div className="absolute inset-0 opacity-40">
                        <img
                            src="/images/photo-1550751827-4bd374c3f58b.avif"
                            alt="Tech Background"
                            className="w-full h-full object-cover grayscale transition-transform duration-1000 ease-out group-hover:scale-105"
                        />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-slate-900/80 to-emerald-900/30"></div>

                    <div className="absolute bottom-0 left-0 p-12">
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-5xl md:text-6xl font-bold text-white tracking-tighter mb-4"
                        >
                            Our <span className="text-emerald-400">Capabilities.</span>
                        </motion.h1>
                        <p className="text-slate-400 max-w-lg text-lg">
                            Engineered for speed, security, and seamless integration.
                        </p>
                    </div>
                </header>

                {/* FEATURES (Zig-Zag) */}
                <section className="max-w-7xl mx-auto px-6 mt-24 flex flex-col gap-24">

                    {/* Feature 1: AI Scan */}
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="flex flex-col md:flex-row items-center gap-12"
                    >
                        <div className="md:w-1/2">
                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mb-6 text-emerald-500 shadow-lg border border-slate-100">
                                <ScanLine className="w-6 h-6" />
                            </div>
                            <h3 className="text-3xl font-bold text-slate-900 tracking-tight mb-4">AI License Recognition</h3>
                            <p className="text-slate-500 text-lg leading-relaxed">
                                Forget paper tickets. Our Tesseract OCR engine instantly reads license plates with 99.8% accuracy, allowing for frictionless entry and exit. It handles low-light conditions and various angles effortlessly.
                            </p>
                        </div>
                        <div className="md:w-1/2">
                            <div className="rounded-[2.5rem] overflow-hidden shadow-2xl h-[350px]">
                                <img
                                    src="/images/photo-1555949963-ff9fe0c870eb.avif"
                                    alt="AI Scanning"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        </div>
                    </motion.div>

                    {/* Feature 2: Cashless */}
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="flex flex-col md:flex-row-reverse items-center gap-12"
                    >
                        <div className="md:w-1/2">
                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mb-6 text-blue-500 shadow-lg border border-slate-100">
                                <CreditCard className="w-6 h-6" />
                            </div>
                            <h3 className="text-3xl font-bold text-slate-900 tracking-tight mb-4">Flexible Payment Options</h3>
                            <p className="text-slate-500 text-lg leading-relaxed">
                                Choose your preferred way to pay. We accept both integrated cashless payments for speed and traditional cash payments for convenience. Automated tariff calculation ensures accuracy every time.
                            </p>
                        </div>
                        <div className="md:w-1/2">
                            <div className="rounded-[2.5rem] overflow-hidden shadow-2xl h-[350px]">
                                <img
                                    src="/images/photo-1556742111-a301076d9d18.avif"
                                    alt="Payment"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        </div>
                    </motion.div>

                    {/* Feature 3: Security */}
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="flex flex-col md:flex-row items-center gap-12"
                    >
                        <div className="md:w-1/2">
                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mb-6 text-emerald-900 shadow-lg border border-slate-100">
                                <ShieldCheck className="w-6 h-6" />
                            </div>
                            <h3 className="text-3xl font-bold text-slate-900 tracking-tight mb-4">Real-time Security Audit</h3>
                            <p className="text-slate-500 text-lg leading-relaxed">
                                Every interaction is logged. From gate opens to weird system behaviors, admins get a full audit trail. Your facility's security is monitored 24/7 with zero data loss.
                            </p>
                        </div>
                        <div className="md:w-1/2">
                            <div className="rounded-[2.5rem] overflow-hidden shadow-2xl h-[350px]">
                                <img
                                    src="/images/photo-1614064641938-3bbee52942c7.avif"
                                    alt="Security"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        </div>
                    </motion.div>

                </section>

                {/* PRICING TABLE — Data dari database, bukan hardcoded */}
                <section className="max-w-7xl mx-auto px-6 mt-32 mb-20">
                    <div className="text-center mb-16">
                        <span className="text-xs font-bold uppercase tracking-[0.3em] text-slate-400">Transparent Pricing</span>
                        <h2 className="text-4xl font-bold text-slate-900 mt-4 tracking-tight">Simple Tariffs.</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Tarif Cards — dinamis dari tabel `tarif`, sembunyikan tarif Rp 0 */}
                        {tarifs.filter(t => t.tarif_per_jam > 0).map((tarif) => {
                            const config = vehicleConfig[tarif.jenis_kendaraan] || vehicleConfig.lainnya;
                            const isFeatured = config.featured;

                            return (
                                <div
                                    key={tarif.id_tarif}
                                    className={`rounded-[2rem] p-8 flex flex-col hover:-translate-y-2 transition-transform duration-300 relative overflow-hidden ${isFeatured
                                        ? 'bg-slate-900 shadow-2xl'
                                        : 'bg-white border border-slate-100 shadow-xl'
                                        }`}
                                >
                                    {isFeatured && (
                                        <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[10px] uppercase font-bold px-3 py-1 rounded-bl-xl">Best Value</div>
                                    )}
                                    <h3 className={`text-lg font-bold uppercase tracking-wider mb-4 ${isFeatured ? 'text-slate-300' : 'text-slate-500'}`}>
                                        {config.label}
                                    </h3>
                                    <div className="flex flex-col mb-6">
                                        <div className="flex items-baseline gap-1">
                                            <span className={`text-4xl font-bold ${isFeatured ? 'text-white' : 'text-slate-900'}`}>
                                                {formatRupiah(tarif.tarif_per_jam)}
                                            </span>
                                            <span className={`text-sm ${isFeatured ? 'text-slate-400' : 'text-slate-400'}`}>/ jam</span>
                                        </div>
                                    </div>
                                    <ul className="space-y-4 mb-2 flex-1">
                                        {config.features.map((feature, idx) => (
                                            <li key={idx} className={`flex items-center gap-3 text-sm ${isFeatured ? 'text-slate-300' : 'text-slate-600'}`}>
                                                <CheckCircle2 className={`w-4 h-4 ${isFeatured ? 'text-emerald-400' : 'text-emerald-500'}`} />
                                                {feature}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            );
                        })}

                        {/* VIP Card — tetap statis karena gratis, bukan dari tabel tarif */}
                        <div className="bg-white rounded-[2rem] p-8 border-2 border-amber-200 shadow-xl flex flex-col hover:-translate-y-2 transition-transform duration-300 relative">
                            <div className="absolute top-0 right-0 bg-amber-100 text-amber-700 text-[10px] uppercase font-bold px-3 py-1 rounded-bl-xl">VIP Access</div>
                            <h3 className="text-lg font-bold text-amber-600 uppercase tracking-wider mb-4">Staff VIP</h3>
                            <div className="flex items-baseline gap-1 mb-6">
                                <span className="text-4xl font-bold text-slate-900">Free</span>
                                <span className="text-slate-400">/unlimited</span>
                            </div>
                            <ul className="space-y-4 mb-2 flex-1">
                                <li className="flex items-center gap-3 text-slate-600 text-sm">
                                    <CheckCircle2 className="w-4 h-4 text-amber-500" /> Fast Track Gate
                                </li>
                                <li className="flex items-center gap-3 text-slate-600 text-sm">
                                    <CheckCircle2 className="w-4 h-4 text-amber-500" /> Dedicated Rows
                                </li>
                                <li className="flex items-center gap-3 text-slate-600 text-sm">
                                    <CheckCircle2 className="w-4 h-4 text-amber-500" /> QR Code Access
                                </li>
                            </ul>
                        </div>
                    </div>
                </section>

                <footer className="px-8 text-center pb-8 pt-8 max-w-7xl mx-auto border-t border-slate-200 mt-20">
                    <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-slate-300 hover:text-emerald-500 transition-colors cursor-pointer">
                        &copy; 2026 RS Hermina Arcamanik
                    </p>
                </footer>

            </div>
        </>
    );
}
