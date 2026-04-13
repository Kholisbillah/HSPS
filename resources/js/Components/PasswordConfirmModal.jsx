import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Eye, EyeOff, AlertTriangle, ShieldCheck, X } from 'lucide-react';
import axios from 'axios';

/**
 * Modal konfirmasi password sebelum masuk/keluar mode kiosk gate.
 * Digunakan untuk keamanan agar gate tidak disalahgunakan.
 *
 * @param {boolean} show - Tampilkan modal
 * @param {function} onClose - Callback tutup modal
 * @param {function} onConfirm - Callback setelah password valid
 * @param {string} title - Judul modal
 * @param {string} description - Deskripsi aksi
 */
export default function PasswordConfirmModal({ show, onClose, onConfirm, title = 'Konfirmasi Password', description = 'Masukkan password Anda untuk melanjutkan.' }) {
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [processing, setProcessing] = useState(false);
    const inputRef = useRef(null);

    // Fokus otomatis ke input saat modal muncul
    useEffect(() => {
        if (show) {
            setPassword('');
            setError('');
            setShowPassword(false);
            // Delay focus agar animasi selesai
            setTimeout(() => inputRef.current?.focus(), 200);
        }
    }, [show]);

    // Handle submit password
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!password.trim()) {
            setError('Password tidak boleh kosong.');
            return;
        }

        setProcessing(true);
        setError('');

        try {
            // Verifikasi password via API
            const response = await axios.post(route('password.verify'), {
                password: password,
            });

            if (response.data.status === 'success') {
                setPassword('');
                onConfirm();
            }
        } catch (err) {
            if (err.response?.status === 422) {
                setError('Password salah. Coba lagi.');
            } else {
                setError(err.response?.data?.message || 'Terjadi kesalahan.');
            }
        } finally {
            setProcessing(false);
        }
    };

    // Handle ESC key
    const handleKeyDown = (e) => {
        if (e.key === 'Escape') onClose();
    };

    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center"
                    onKeyDown={handleKeyDown}
                >
                    {/* Backdrop gelap tanpa backdrop-blur agar lebih ringan */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/60"
                        onClick={onClose}
                    />

                    {/* Modal Card */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="relative z-10 w-full max-w-md mx-4"
                    >
                        {/* Hapus backdrop-blur di sini untuk optimisasi */}
                        <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden">
                            {/* Header dengan gaya Clinical Precision */}
                            <div className="px-8 pt-8 pb-6 text-center relative border-b border-slate-100/60">
                                <button
                                    onClick={onClose}
                                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                                    <Lock className="w-8 h-8 text-emerald-600" />
                                </div>
                                <h3 className="text-2xl font-['Outfit'] font-bold text-slate-800">
                                    {title}
                                </h3>
                                <p className="text-slate-500 font-['DM_Sans'] text-sm mt-2">
                                    {description}
                                </p>
                            </div>

                            {/* Body — Form Password */}
                            <form onSubmit={handleSubmit} className="p-8 bg-slate-50/30">
                                {/* Error Alert */}
                                <AnimatePresence>
                                    {error && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm font-['DM_Sans'] flex items-start gap-3 shadow-sm"
                                        >
                                            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                            <span className="font-medium">{error}</span>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Input Password */}
                                <div className="relative mb-8">
                                    <label className="block text-sm font-['DM_Sans'] font-semibold text-slate-700 mb-2">
                                        Password Akun
                                    </label>
                                    <div className="relative">
                                        <input
                                            ref={inputRef}
                                            type={showPassword ? 'text' : 'password'}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="Masukkan password..."
                                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3.5 text-slate-800 font-['DM_Sans'] text-lg placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all pr-12 shadow-sm"
                                            autoComplete="current-password"
                                            disabled={processing}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-600 p-2 rounded-lg transition-colors"
                                        >
                                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>

                                {/* Tombol Submit */}
                                <div className="space-y-3">
                                    <motion.button
                                        type="submit"
                                        whileHover={{ scale: processing ? 1 : 1.01 }}
                                        whileTap={{ scale: processing ? 1 : 0.98 }}
                                        disabled={processing}
                                        className={`w-full py-3.5 rounded-xl font-['Outfit'] font-bold text-base transition-all flex items-center justify-center gap-2 ${
                                            processing
                                                ? 'bg-slate-100 text-slate-400 cursor-wait border border-slate-200'
                                                : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-600/20'
                                        }`}
                                    >
                                        {processing ? (
                                            <>
                                                <span className="animate-spin w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full" />
                                                <span>Memverifikasi...</span>
                                            </>
                                        ) : (
                                            <>
                                                <ShieldCheck className="w-5 h-5" />
                                                <span>Konfirmasi Akses</span>
                                            </>
                                        )}
                                    </motion.button>

                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="w-full py-3 pr-2 text-sm text-slate-500 font-['DM_Sans'] font-semibold hover:text-slate-800 hover:bg-white border border-transparent hover:border-slate-200 rounded-xl transition-all"
                                    >
                                        Batal
                                    </button>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
