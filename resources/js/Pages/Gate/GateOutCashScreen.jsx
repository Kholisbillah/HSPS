import { useState, useCallback, useRef } from 'react';
import { router } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search, CheckCircle2, AlertTriangle, ShieldCheck,
    TicketX, X, Bike, Car, Camera, CameraOff, Loader2,
    ScanLine
} from 'lucide-react';
import GateLayout from '@/Layouts/GateLayout';
import GateCamera from '@/Components/Gate/GateCamera';
import { captureAndUpload } from '@/Utils/cloudinary';
import axios from 'axios';

/**
 * Gate Keluar Cash — Dengan Petugas (Gate 1 & 2).
 *
 * Layout:
 * - IDLE: Split kiri (search + karcis hilang) & kanan (kamera + daftar kendaraan)
 * - DETAIL: Full-width split kiri (detail) & kanan (pembayaran) — TANPA kamera
 * - SUCCESS: Full-width centered
 */
export default function GateOutCashScreen({ gateNum, gateCode, gateName, jenisKendaraan, metodePembayaran, parkedVehicles }) {
    // State utama
    const [searchQuery, setSearchQuery] = useState('');
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState(null);

    // State transaksi yang ditemukan
    const [transaksiData, setTransaksiData] = useState(null);
    const [karcisHilang, setKarcisHilang] = useState(false);

    // State pembayaran
    const [uangDibayar, setUangDibayar] = useState('');
    const [showSuccess, setShowSuccess] = useState(false);
    const [checkoutResult, setCheckoutResult] = useState(null);

    // STATE KAMERA: default MATI, nyala saat diklik tombol
    const [cameraOn, setCameraOn] = useState(false);

    // Ref ke komponen GateCamera
    const cameraRef = useRef(null);

    const isMotor = jenisKendaraan === 'motor';

    // =====================================================================
    // SCAN KARCIS / CARI ID PARKIR
    // =====================================================================
    const handleScan = useCallback(async (query, isLostTicket = false) => {
        const searchValue = query || searchQuery;
        if (!searchValue.trim()) return;

        setProcessing(true);
        setError(null);
        setTransaksiData(null);

        try {
            const response = await axios.post(route('gate.new.out.scan', gateNum), {
                search: searchValue.trim(),
                karcis_hilang: isLostTicket || karcisHilang,
            });

            if (response.data.status === 'success') {
                setTransaksiData(response.data.data);
                // Matikan kamera saat masuk ke detail (tidak ditampilkan di detail)
                setCameraOn(false);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Transaksi tidak ditemukan.');
            setTimeout(() => setError(null), 4000);
        } finally {
            setProcessing(false);
        }
    }, [gateNum, searchQuery, karcisHilang]);

    // Toggle karcis hilang & re-scan
    const toggleKarcisHilang = useCallback(() => {
        const newState = !karcisHilang;
        setKarcisHilang(newState);
        if (transaksiData) {
            handleRescan(newState);
        }
    }, [karcisHilang, transaksiData]);

    // Re-scan dengan karcis hilang state baru
    const handleRescan = async (isLost) => {
        if (!transaksiData) return;
        setProcessing(true);
        try {
            const response = await axios.post(route('gate.new.out.scan', gateNum), {
                search: String(transaksiData.transaksi.id_parkir),
                karcis_hilang: isLost,
            });
            if (response.data.status === 'success') {
                setTransaksiData(response.data.data);
            }
        } catch (err) {
            setError('Gagal menghitung ulang biaya.');
        } finally {
            setProcessing(false);
        }
    };

    // =====================================================================
    // QR VIP otomatis — terdeteksi oleh GateCamera di background
    // Hanya aktif saat kamera menyala (di idle screen)
    // =====================================================================
    const handleQrDetected = useCallback(async (scannedText) => {
        if (processing || showSuccess) return;
        setProcessing(true);
        setError(null);

        try {
            const response = await axios.post(route('gate.new.out.check-vip', gateNum), {
                plat_nomor: scannedText,
            });

            if (response.data.status === 'success') {
                // Auto-checkout VIP (tanpa foto keluar)
                const checkoutResponse = await axios.post(route('gate.new.out.process', gateNum), {
                    id_parkir: response.data.data.transaksi.id_parkir,
                    metode_pembayaran: 'vip',
                });

                if (checkoutResponse.data.status === 'success') {
                    setTransaksiData({
                        transaksi: response.data.data.transaksi,
                        is_vip: true,
                        vip_data: response.data.data.vip_data,
                        biaya_total: 0,
                    });
                    setCheckoutResult(checkoutResponse.data);
                    setShowSuccess(true);
                    setCameraOn(false);
                }
            }
        } catch (err) {
            // Jika bukan VIP, coba sebagai scan karcis biasa
            if (err.response?.status === 404) {
                handleScan(scannedText);
            } else {
                setError(err.response?.data?.message || 'QR VIP tidak valid.');
                setTimeout(() => setError(null), 4000);
            }
        } finally {
            setProcessing(false);
        }
    }, [gateNum, processing, showSuccess, handleScan]);

    // =====================================================================
    // PROSES CHECKOUT
    // =====================================================================
    const handleCheckout = useCallback(async () => {
        if (!transaksiData) return;
        setProcessing(true);
        setError(null);

        try {
            const response = await axios.post(route('gate.new.out.process', gateNum), {
                id_parkir: transaksiData.transaksi.id_parkir,
                uang_dibayar: transaksiData.is_vip ? 0 : (parseFloat(uangDibayar) || 0),
                karcis_hilang: karcisHilang,
                metode_pembayaran: transaksiData.is_vip ? 'vip' : 'cash',
            });

            if (response.data.status === 'success') {
                setCheckoutResult(response.data);
                setShowSuccess(true);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Gagal checkout. Coba lagi.');
        } finally {
            setProcessing(false);
        }
    }, [transaksiData, uangDibayar, karcisHilang, gateNum]);

    // Reset state & reload data kendaraan dari server
    const resetState = () => {
        setSearchQuery('');
        setTransaksiData(null);
        setKarcisHilang(false);
        setUangDibayar('');
        setShowSuccess(false);
        setCheckoutResult(null);
        setError(null);
        setCameraOn(false);
        router.reload({ only: ['parkedVehicles'] });
    };

    // Hitung kembalian
    const biayaTotal = transaksiData?.biaya_total || 0;
    const parsedUang = parseFloat(uangDibayar) || 0;
    const kembalian = parsedUang - biayaTotal;
    const isUangCukup = transaksiData?.is_vip || parsedUang >= biayaTotal;

    return (
        <GateLayout title={gateName} gateName={gateName} gateType={jenisKendaraan}>
            <div className="flex-1 flex gap-4 p-5 relative min-h-0">

                <AnimatePresence mode="wait">

                    {/* ===================== SUCCESS SCREEN ===================== */}
                    {showSuccess && checkoutResult && (
                        <motion.div
                            key="success"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex-1 flex items-center justify-center"
                        >
                            <div className="rounded-2xl border border-white/10 bg-black/60 shadow-2xl backdrop-blur-3xl p-10 text-center w-full max-w-xl relative overflow-hidden">
                                <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-500 rounded-full blur-[80px] opacity-20" />

                                <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 2 }}>
                                    <CheckCircle2 className="w-24 h-24 text-emerald-400 mx-auto mb-5 relative z-10" />
                                </motion.div>

                                <h3 className="text-3xl font-['Outfit'] font-bold text-white mb-1 tracking-tight">TRANSAKSI SUKSES</h3>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 mb-6">{checkoutResult.message}</p>

                                {!checkoutResult.is_vip && (
                                    <div className="bg-white/5 border border-white/5 rounded-2xl p-6 mb-6 shadow-inner space-y-3 relative z-10 text-left">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total Bayar</span>
                                            <span className="text-white font-['JetBrains_Mono'] font-bold text-xl">
                                                Rp {Number(checkoutResult.biaya_total).toLocaleString('id-ID')}
                                            </span>
                                        </div>
                                        {checkoutResult.kembalian > 0 && (
                                            <div className="flex justify-between items-center pt-3 border-t border-dashed border-white/10">
                                                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">Kembalian</span>
                                                <span className="text-emerald-400 font-['JetBrains_Mono'] font-bold text-2xl">
                                                    Rp {Number(checkoutResult.kembalian).toLocaleString('id-ID')}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {checkoutResult.is_vip && (
                                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-5 mb-6 relative z-10">
                                        <ShieldCheck className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">Akses VIP Digunakan — Tarif Gratis</p>
                                    </div>
                                )}

                                <button
                                    onClick={resetState}
                                    className="w-full py-4 bg-slate-900 text-white rounded-xl font-['Outfit'] font-bold tracking-widest hover:bg-slate-800 shadow-xl transition-all relative z-10"
                                >
                                    TRANSAKSI BERIKUTNYA
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* ===================== DETAIL + PEMBAYARAN (TANPA KAMERA) ===================== */}
                    {!showSuccess && transaksiData && (
                        <motion.div
                            key="detail"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex-1 flex gap-4 min-h-0"
                        >
                            {/* Kolom Kiri — Detail Transaksi */}
                            <div className="w-1/2 flex flex-col gap-3 min-h-0 overflow-y-auto pr-1">
                                {/* Peringatan Denda */}
                                {karcisHilang && (
                                    <div className="bg-red-500 text-white rounded-xl p-3 shadow-lg flex items-center gap-3 shrink-0">
                                        <div className="bg-white/20 p-2 rounded-lg">
                                            <AlertTriangle className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <h4 className="font-['Outfit'] font-bold text-sm leading-tight">Denda Karcis Hilang Aktif</h4>
                                            <p className="text-red-100 text-[10px] mt-0.5">Biaya parkir + denda flat diterapkan.</p>
                                        </div>
                                    </div>
                                )}

                                {/* Detail Card */}
                                <div className="rounded-2xl border border-white/10 bg-black/40 shadow-xl backdrop-blur-3xl p-5 shrink-0">
                                    <div className="flex items-center justify-between mb-4 border-b border-dashed border-white/10 pb-3">
                                        <h4 className="text-white font-['Outfit'] font-bold text-lg tracking-tight">Detail Transaksi</h4>
                                        {transaksiData.is_vip && (
                                            <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 border border-emerald-500/30">
                                                <ShieldCheck className="w-3 h-3" /> VIP
                                            </span>
                                        )}
                                    </div>

                                    {/* Foto masuk thumbnail */}
                                    {transaksiData.foto_masuk && (
                                        <div className="flex items-center gap-3 mb-3 p-2 rounded-xl bg-white/5 border border-white/5">
                                            <img src={transaksiData.foto_masuk} alt="Foto masuk" className="w-16 h-12 object-cover rounded-lg border border-white/10" />
                                            <div>
                                                <span className="text-[9px] text-cyan-400 font-bold uppercase tracking-wider block">Foto Masuk</span>
                                                <span className="text-[9px] text-slate-500">Tersimpan di Cloudinary</span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Detail rows */}
                                    <div className="space-y-1.5">
                                        <DetailRow label="No. Tiket" value={`#${String(transaksiData.transaksi.id_parkir).padStart(6, '0')}`} mono />
                                        <DetailRow label="Kendaraan" value={transaksiData.transaksi.jenis_kendaraan} capitalize />
                                        <DetailRow label="Area" value={transaksiData.transaksi.area?.nama_area || '-'} capitalize />
                                        <DetailRow label="Waktu Masuk" value={transaksiData.waktu_masuk_formatted} />
                                        <DetailRow label="Waktu Keluar" value={transaksiData.waktu_keluar_formatted || 'Sekarang'} />
                                        <DetailRow label="Durasi" value={transaksiData.durasi_text || `${transaksiData.durasi_jam} jam`} highlight />
                                    </div>
                                </div>

                                {/* Toggle Karcis Hilang */}
                                <button
                                    onClick={toggleKarcisHilang}
                                    className={`flex items-center gap-3 rounded-xl p-3 border transition-all shadow-md shrink-0 ${
                                        karcisHilang
                                            ? 'border-red-500/50 bg-red-900/30 text-red-400'
                                            : 'border-white/10 bg-black/40 text-slate-400 hover:border-white/30 hover:text-white'
                                    }`}
                                >
                                    <div className={`p-2 rounded-lg ${karcisHilang ? 'bg-red-500/20 text-red-500' : 'bg-white/5 text-slate-400'}`}>
                                        <TicketX className="w-4 h-4" />
                                    </div>
                                    <div className="text-left flex-1">
                                        <span className={`font-['Outfit'] font-bold text-sm ${karcisHilang ? 'text-red-400' : 'text-slate-100'}`}>Karcis Hilang?</span>
                                        <p className={`text-[9px] font-bold uppercase tracking-wider ${karcisHilang ? 'text-red-300' : 'text-slate-500'}`}>
                                            {karcisHilang ? 'Denda diaktifkan' : 'Klik untuk mengaktifkan denda'}
                                        </p>
                                    </div>
                                    <div className={`w-10 h-6 rounded-full transition-colors ${karcisHilang ? 'bg-red-500' : 'bg-slate-700'} relative shadow-inner`}>
                                        <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${karcisHilang ? 'translate-x-[18px]' : 'translate-x-0.5'}`} />
                                    </div>
                                </button>
                            </div>

                            {/* Kolom Kanan — Pembayaran */}
                            <div className="w-1/2 flex flex-col gap-3 min-h-0">
                                <div className={`flex-1 rounded-2xl border shadow-xl backdrop-blur-3xl flex flex-col p-5 ${
                                    transaksiData.is_vip
                                        ? 'border-emerald-500/30 bg-[#064e3b]/80'
                                        : karcisHilang
                                            ? 'border-red-500/30 bg-[#450a0a]/80'
                                            : isMotor
                                                ? 'border-cyan-500/20 bg-cyan-950/60'
                                                : 'border-amber-500/20 bg-amber-950/60'
                                }`}>
                                    {/* Total Bayar */}
                                    <div className="text-center mb-4 border-b border-white/10 pb-4">
                                        <span className="text-[9px] font-bold uppercase tracking-widest text-slate-300">TOTAL TAGIHAN</span>
                                        <p className={`text-5xl font-['JetBrains_Mono'] font-extrabold mt-1 tracking-tighter ${
                                            transaksiData.is_vip ? 'text-emerald-400' : karcisHilang ? 'text-red-400' : 'text-white'
                                        }`}>
                                            {transaksiData.is_vip ? 'Rp 0' : `Rp ${Number(biayaTotal).toLocaleString('id-ID')}`}
                                        </p>
                                    </div>

                                    {/* Kolom Uang Tunai */}
                                    {!transaksiData.is_vip && (
                                        <div className="flex-1 flex flex-col justify-center space-y-3">
                                            <div className="bg-black/40 p-4 rounded-xl shadow-inner border border-white/10">
                                                <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-2 block text-center">Uang Diterima</label>
                                                <div className="relative mb-2">
                                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-['JetBrains_Mono'] text-lg font-bold">Rp</span>
                                                    <input
                                                        type="number"
                                                        value={uangDibayar}
                                                        onChange={(e) => setUangDibayar(e.target.value)}
                                                        placeholder="0"
                                                        className="w-full bg-black/60 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white text-xl font-['JetBrains_Mono'] font-bold tracking-widest focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all shadow-inner"
                                                        autoFocus
                                                    />
                                                </div>
                                                {/* Quick amount buttons */}
                                                <div className="grid grid-cols-4 gap-1.5">
                                                    {[5000, 10000, 20000, 50000].map(amount => (
                                                        <button
                                                            key={amount}
                                                            onClick={() => setUangDibayar(String(amount))}
                                                            className="py-2 rounded-lg bg-white/5 border border-white/10 text-white text-xs font-['JetBrains_Mono'] font-bold hover:bg-white/20 transition-all"
                                                        >
                                                            {(amount/1000)}K
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Kembalian */}
                                            <AnimatePresence>
                                                {parsedUang > 0 && (
                                                    <motion.div
                                                        initial={{ opacity: 0, height: 0 }}
                                                        animate={{ opacity: 1, height: 'auto' }}
                                                        exit={{ opacity: 0, height: 0 }}
                                                        className="overflow-hidden"
                                                    >
                                                        <div className={`text-center p-3 rounded-xl border ${kembalian >= 0 ? 'bg-emerald-500 text-white border-emerald-400' : 'bg-red-500/20 border-red-500/30 text-red-400'}`}>
                                                            <span className="text-[9px] font-bold uppercase tracking-widest opacity-80 block mb-0.5">
                                                                {kembalian >= 0 ? 'Kembalian' : 'Kurang'}
                                                            </span>
                                                            <span className="font-['JetBrains_Mono'] font-bold text-xl tracking-tight">
                                                                Rp {Math.abs(kembalian).toLocaleString('id-ID')}
                                                            </span>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    )}

                                    {/* VIP info */}
                                    {transaksiData.is_vip && (
                                        <div className="flex-1 flex flex-col items-center justify-center">
                                            <ShieldCheck className="w-16 h-16 text-emerald-400 mb-3" />
                                            <p className="text-emerald-300 font-['DM_Sans'] font-bold text-sm uppercase tracking-wider">Akses VIP — Gratis</p>
                                        </div>
                                    )}

                                    {/* Action Buttons */}
                                    <div className="flex gap-3 mt-4">
                                        <button
                                            onClick={resetState}
                                            disabled={processing}
                                            className="px-5 py-3.5 rounded-xl text-sm font-['DM_Sans'] font-bold text-slate-400 bg-black/40 hover:bg-black/60 hover:text-white border border-white/10 transition-colors"
                                        >
                                            BATAL
                                        </button>
                                        <motion.button
                                            whileHover={{ scale: processing || (!transaksiData.is_vip && !isUangCukup) ? 1 : 1.02 }}
                                            whileTap={{ scale: processing || (!transaksiData.is_vip && !isUangCukup) ? 1 : 0.98 }}
                                            onClick={handleCheckout}
                                            disabled={processing || (!transaksiData.is_vip && !isUangCukup)}
                                            className={`flex-1 py-3.5 rounded-xl text-lg font-['Outfit'] font-bold tracking-widest transition-all shadow-lg flex items-center justify-center gap-2 ${
                                                processing || (!transaksiData.is_vip && !isUangCukup)
                                                    ? 'bg-white/10 text-slate-500 cursor-not-allowed shadow-none'
                                                    : 'bg-emerald-500 text-white shadow-emerald-500/30 hover:bg-emerald-400 ring-2 ring-emerald-500/10'
                                            }`}
                                        >
                                            {processing ? (
                                                <>
                                                    <Loader2 className="w-5 h-5 animate-spin" />
                                                    MEMPROSES...
                                                </>
                                            ) : (
                                                'BUKA GERBANG'
                                            )}
                                        </motion.button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* ===================== IDLE — Search + Kamera + Daftar Kendaraan ===================== */}
                    {!showSuccess && !transaksiData && (
                        <motion.div
                            key="search-panel"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex-1 flex gap-4 min-h-0"
                        >
                            {/* Kolom Kiri — Search + Karcis Hilang */}
                            <div className="w-1/2 flex flex-col gap-3 min-h-0">
                                {/* Search Input */}
                                <div className={`rounded-2xl border ${isMotor ? 'border-cyan-500/20 bg-cyan-900/20' : 'border-amber-500/20 bg-amber-900/20'} p-5 shadow-xl backdrop-blur-2xl shrink-0`}>
                                    <label className="text-[9px] font-bold uppercase tracking-wider text-slate-300 mb-2 block">
                                        Masukkan No. Karcis atau ID Parkir
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value.toUpperCase())}
                                            onKeyDown={(e) => e.key === 'Enter' && handleScan()}
                                            placeholder="Scan / Ketik No. Karcis"
                                            className="flex-1 bg-black/40 border border-white/10 rounded-xl px-5 py-3.5 text-white font-['JetBrains_Mono'] text-lg font-bold tracking-widest placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all shadow-inner"
                                            autoFocus
                                        />
                                        <motion.button
                                            whileHover={{ scale: processing || !searchQuery.trim() ? 1 : 1.05 }}
                                            whileTap={{ scale: processing || !searchQuery.trim() ? 1 : 0.95 }}
                                            onClick={() => handleScan()}
                                            disabled={processing || !searchQuery.trim()}
                                            className={`px-6 rounded-xl font-['DM_Sans'] font-bold tracking-widest transition-all shadow-lg ${
                                                processing || !searchQuery.trim()
                                                    ? 'bg-slate-800 text-slate-500 shadow-none'
                                                    : isMotor
                                                        ? 'bg-cyan-500 text-white shadow-cyan-500/20'
                                                        : 'bg-amber-500 text-white shadow-amber-500/20'
                                            }`}
                                        >
                                            {processing ? (
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                            ) : (
                                                <Search className="w-5 h-5" />
                                            )}
                                        </motion.button>
                                    </div>
                                </div>

                                {/* Toggle Karcis Hilang */}
                                <button
                                    onClick={toggleKarcisHilang}
                                    className={`flex items-center gap-3 rounded-xl p-3.5 border transition-all shadow-md shrink-0 ${
                                        karcisHilang
                                            ? 'border-red-500/50 bg-red-900/30 text-red-400'
                                            : 'border-white/10 bg-black/40 text-slate-400 hover:border-white/30 hover:text-white'
                                    }`}
                                >
                                    <div className={`p-2 rounded-lg ${karcisHilang ? 'bg-red-500/20 text-red-500' : 'bg-white/5 text-slate-400'}`}>
                                        <TicketX className="w-4 h-4" />
                                    </div>
                                    <div className="text-left flex-1">
                                        <span className={`font-['Outfit'] font-bold text-sm ${karcisHilang ? 'text-red-400' : 'text-slate-100'}`}>Karcis Hilang?</span>
                                        <p className={`text-[9px] font-bold uppercase tracking-wider ${karcisHilang ? 'text-red-300' : 'text-slate-500'}`}>
                                            {karcisHilang ? 'Denda diaktifkan' : 'Klik untuk mengaktifkan denda'}
                                        </p>
                                    </div>
                                    <div className={`w-10 h-6 rounded-full transition-colors ${karcisHilang ? 'bg-red-500' : 'bg-slate-700'} relative shadow-inner`}>
                                        <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${karcisHilang ? 'translate-x-[18px]' : 'translate-x-0.5'}`} />
                                    </div>
                                </button>

                                {/* Daftar Kendaraan Parkir */}
                                <div className="flex-1 rounded-2xl border border-white/10 bg-black/40 overflow-hidden shadow-xl flex flex-col min-h-0">
                                    <div className="px-5 py-3 bg-black/30 border-b border-white/5 shrink-0">
                                        <h4 className="text-[9px] uppercase tracking-wider font-bold text-slate-400">
                                            Kendaraan Terdaftar ({parkedVehicles.length})
                                        </h4>
                                    </div>
                                    <div className="overflow-y-auto flex-1 p-1.5 space-y-0.5">
                                        {parkedVehicles.length > 0 ? parkedVehicles.map((v) => (
                                            <button
                                                key={v.id_parkir}
                                                onClick={() => { setSearchQuery(String(v.id_parkir)); handleScan(String(v.id_parkir)); }}
                                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors text-left group"
                                            >
                                                <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-white/5 border border-white/10 group-hover:bg-white/20 shadow-sm transition-colors shrink-0">
                                                    {isMotor ? <Bike className="w-4 h-4 text-cyan-400" /> : <Car className="w-4 h-4 text-amber-400" />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <span className="font-['JetBrains_Mono'] text-sm font-bold text-white tracking-wide block">
                                                        #{String(v.id_parkir).padStart(6, '0')}
                                                    </span>
                                                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                                                        Masuk: {new Date(v.waktu_masuk).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                                {v.foto_masuk && (
                                                    <img src={v.foto_masuk} alt="" className="w-10 h-7 object-cover rounded-md border border-white/10 shrink-0" />
                                                )}
                                                <div className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                                    <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md uppercase border border-emerald-500/20">Pilih</span>
                                                </div>
                                            </button>
                                        )) : (
                                            <div className="flex flex-col items-center justify-center py-10 opacity-50">
                                                <Search className="w-10 h-10 text-slate-500 mb-2" />
                                                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Tidak Ada Kendaraan</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Kolom Kanan — Kamera (Live Feed / Placeholder) */}
                            <div className="w-1/2 flex flex-col gap-3 min-h-0">
                                {/* Kamera / Placeholder */}
                                <div className="flex-1 rounded-2xl overflow-hidden border border-slate-700/50 bg-slate-900/50 shadow-lg relative min-h-0">
                                    {cameraOn ? (
                                        <GateCamera
                                            ref={cameraRef}
                                            active={true}
                                            onQrDetected={handleQrDetected}
                                            showQrOverlay={true}
                                            qrPaused={processing}
                                        />
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center text-center p-8">
                                            <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-5 ${
                                                isMotor ? 'bg-cyan-500/10 border border-cyan-500/20' : 'bg-amber-500/10 border border-amber-500/20'
                                            }`}>
                                                <CameraOff className={`w-10 h-10 ${isMotor ? 'text-cyan-400/50' : 'text-amber-400/50'}`} />
                                            </div>
                                            <h3 className="text-lg font-['Outfit'] font-bold text-white/80 mb-1">Kamera Tidak Aktif</h3>
                                            <p className="text-slate-400 font-['DM_Sans'] text-xs max-w-xs mb-5 leading-relaxed">
                                                Nyalakan kamera untuk mendeteksi QR VIP secara otomatis.
                                            </p>
                                            <motion.button
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => setCameraOn(true)}
                                                className={`px-6 py-3 rounded-xl font-['Outfit'] font-bold text-base tracking-wider transition-all shadow-lg flex items-center gap-2 ${
                                                    isMotor
                                                        ? 'bg-cyan-600 text-white hover:bg-cyan-500 shadow-cyan-900/50'
                                                        : 'bg-amber-600 text-white hover:bg-amber-500 shadow-amber-900/50'
                                                }`}
                                            >
                                                <Camera className="w-5 h-5" />
                                                NYALAKAN KAMERA
                                            </motion.button>
                                        </div>
                                    )}
                                </div>

                                {/* Tombol Matikan Kamera */}
                                {cameraOn && (
                                    <button
                                        onClick={() => setCameraOn(false)}
                                        className="w-full py-2.5 rounded-xl border border-white/10 bg-black/40 text-slate-400 font-['DM_Sans'] font-bold text-xs uppercase tracking-widest hover:bg-white/5 hover:text-white transition-all flex items-center justify-center gap-2 shrink-0"
                                    >
                                        <CameraOff className="w-3.5 h-3.5" />
                                        Matikan Kamera
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    )}

                </AnimatePresence>

                {/* Error Toast */}
                <AnimatePresence>
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: 50, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 50, scale: 0.9 }}
                            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-slate-900 border border-slate-800 text-white pl-5 pr-3 py-3 rounded-xl shadow-[0_20px_40px_rgba(0,0,0,0.3)] flex items-center gap-3 backdrop-blur-xl"
                        >
                            <div className="bg-red-500 p-1.5 rounded-lg shadow-inner">
                                <AlertTriangle className="w-4 h-4 text-white" />
                            </div>
                            <span className="font-['DM_Sans'] font-medium text-sm">{error}</span>
                            <button onClick={() => setError(null)} className="ml-3 p-1.5 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white">
                                <X className="w-4 h-4" />
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </GateLayout>
    );
}

/**
 * Row helper untuk detail transaksi — compact version
 */
function DetailRow({ label, value, mono = false, capitalize = false, highlight = false }) {
    return (
        <div className={`flex justify-between items-center py-1.5 border-b border-dashed border-white/5 last:border-0 ${highlight ? 'bg-white/5 -mx-2 px-2 rounded-lg' : ''}`}>
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">{label}</span>
            <span className={`text-white ${mono ? "font-['JetBrains_Mono'] text-base tracking-widest font-bold" : "font-['DM_Sans'] font-bold text-sm tracking-wide"} ${capitalize ? 'capitalize' : ''} ${highlight ? 'text-emerald-400' : ''}`}>
                {value}
            </span>
        </div>
    );
}
