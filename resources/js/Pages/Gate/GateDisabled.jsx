import { Head } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { ShieldX, ArrowLeft } from 'lucide-react';

/**
 * Halaman yang ditampilkan ketika gate sedang dinonaktifkan oleh Admin.
 * Kendaraan diarahkan ke gate lain.
 */
export default function GateDisabled({ gateName, message }) {
    return (
        <>
            <Head title={`${gateName} — Tidak Aktif`} />

            <div className="min-h-screen bg-slate-50 flex items-center justify-center select-none">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center max-w-lg bg-white/80 backdrop-blur-md border border-slate-200 shadow-xl rounded-3xl p-12"
                >
                    <motion.div
                        animate={{
                            scale: [1, 1.05, 1],
                            opacity: [1, 0.8, 1],
                        }}
                        transition={{ repeat: Infinity, duration: 3 }}
                    >
                        <ShieldX className="w-32 h-32 text-red-500 mx-auto mb-8" />
                    </motion.div>

                    <h1 className="text-4xl font-['Outfit'] font-bold text-slate-800 mb-4">
                        Gate Tidak Aktif
                    </h1>
                    <p className="text-xl text-slate-600 font-['DM_Sans'] font-medium mb-3">
                        {gateName}
                    </p>
                    <p className="text-slate-500 font-['DM_Sans'] mb-8">
                        {message || 'Gate ini sedang dalam perbaikan. Silakan gunakan gate lain.'}
                    </p>

                    <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-red-50 border border-red-200 text-red-600 font-['DM_Sans'] font-medium">
                        <ArrowLeft className="w-5 h-5" />
                        Silakan Gunakan Gate Lain
                    </div>
                </motion.div>
            </div>
        </>
    );
}
