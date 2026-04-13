import { useState, useRef, useEffect, useCallback } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage } from '@inertiajs/react';
import axios from 'axios';
import { Html5Qrcode } from 'html5-qrcode';
import {
    Search,
    Clock,
    CreditCard,
    Wallet,
    Printer,
    LogOut,
    ArrowRight,
    CornerDownLeft,
    AlertCircle,
    CheckCircle2,
    ScanBarcode,
    X
} from 'lucide-react';
import Swal from 'sweetalert2';
import { cn } from '@/lib/utils';

export default function GateOut({ auth, parkedVehicles = [] }) {
    // --- State ---
    const [scanResult, setScanResult] = useState('');
    const [loading, setLoading] = useState(false);
    const [recentVehicles, setRecentVehicles] = useState(parkedVehicles);

    // Transaction Data State
    const [data, setData] = useState(null);
    const [uangDibayar, setUangDibayar] = useState('');
    const [kembalian, setKembalian] = useState(0);
    const searchInputRef = useRef(null);

    // Barcode Scanner State
    const [showScanner, setShowScanner] = useState(false);
    const scannerRef = useRef(null);
    const scannerContainerId = 'barcode-reader-gateout';

    // Sync prop changes
    useEffect(() => {
        setRecentVehicles(parkedVehicles);
    }, [parkedVehicles]);

    // Focus Search on Load & After Reset
    useEffect(() => {
        if (!data && !showScanner && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [data, showScanner]);

    // --- Barcode Scanner Logic ---
    useEffect(() => {
        let isMounted = true;

        const startScanner = async () => {
            // Delay sedikit agar DOM element sudah ada
            await new Promise(r => setTimeout(r, 200));
            if (!isMounted) return;
            if (!document.getElementById(scannerContainerId)) return;

            try {
                if (!scannerRef.current) {
                    scannerRef.current = new Html5Qrcode(scannerContainerId);
                }

                // Hentikan jika sudah scanning
                try {
                    const state = scannerRef.current.getState();
                    if (state === 1 || state === 2) {
                        await scannerRef.current.stop();
                    }
                } catch (e) { /* ignore */ }

                // Mulai scan barcode (support CODE128 dari karcis parkir)
                await scannerRef.current.start(
                    { facingMode: 'environment' },
                    {
                        fps: 10,
                        qrbox: { width: 350, height: 150 },
                        aspectRatio: 2.0,
                        formatsToSupport: [
                            0, // QR_CODE
                            2, // CODE_128 (format barcode karcis)
                            4, // CODE_39
                        ]
                    },
                    (decodedText) => {
                        if (isMounted) {
                            // Barcode terbaca — sanitasi dan cari kendaraan
                            const platNomor = decodedText.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
                            setScanResult(platNomor);
                            handleSearch(platNomor);
                            setShowScanner(false);
                        }
                    },
                    (err) => { /* scan gagal, diabaikan */ }
                );
            } catch (err) {
                if (isMounted) console.error('Scanner Error:', err);
            }
        };

        const stopScanner = async () => {
            if (scannerRef.current) {
                try {
                    const state = scannerRef.current.getState();
                    if (state === 1 || state === 2) {
                        await scannerRef.current.stop();
                    }
                    try { scannerRef.current.clear(); } catch (e) { /* ignore */ }
                } catch (err) { /* ignore */ }
            }
        };

        if (showScanner) {
            startScanner();
        } else {
            stopScanner();
        }

        return () => {
            isMounted = false;
            stopScanner();
        };
    }, [showScanner]);

    // --- Format Currency ---
    const formatRupiah = (number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(number);
    };

    // --- Search Logic ---
    const handleSearch = async (platNomor) => {
        if (!platNomor) return;

        setLoading(true);
        setData(null);
        setUangDibayar('');
        setKembalian(0);

        try {
            const response = await axios.post(route('gate.out.scan'), { plat_nomor: platNomor });
            setData(response.data.data);
            setScanResult(platNomor);
            // Auto focus payment input if not VIP
            if (!response.data.data.is_vip) {
                setTimeout(() => document.getElementById('paymentInput')?.focus(), 100);
            }
        } catch (err) {
            console.error(err);
            Swal.fire({
                title: 'Kendaraan Tidak Ditemukan!',
                text: err.response?.data?.message || 'Cek kembali nomor plat.',
                icon: 'error',
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000,
                timerProgressBar: true
            });
        } finally {
            setLoading(false);
        }
    };

    // --- Calculate Change ---
    const handleUangChange = (e) => {
        const val = e.target.value;
        const numVal = parseInt(val) || 0;
        setUangDibayar(val);

        if (data) {
            setKembalian(numVal - data.biaya_total);
        }
    };

    // --- Quick Cash Buttons ---
    const handleQuickCash = (amount) => {
        setUangDibayar(amount.toString());
        if (data) {
            setKembalian(amount - data.biaya_total);
        }
    };

    // --- Submit Checkout ---
    const handleCheckout = async () => {
        if (!data) return;

        // Validation for Public
        if (!data.is_vip && (parseInt(uangDibayar || 0) < data.biaya_total)) {
            Swal.fire({
                title: 'Pembayaran Kurang!',
                text: "Nominal uang kurang dari total tagihan.",
                icon: 'warning',
                confirmButtonColor: '#d33',
                customClass: { popup: 'rounded-[2rem]' }
            });
            return;
        }

        setLoading(true);
        try {
            const response = await axios.post(route('gate.out.store'), {
                id_parkir: data.transaksi.id_parkir,
                uang_dibayar: data.is_vip ? 0 : parseInt(uangDibayar || 0)
            });

            // Optimistic Update
            setRecentVehicles(prev => prev.filter(v => v.id_parkir !== data.transaksi.id_parkir));

            // Success Feedback
            Swal.fire({
                title: 'GATE OPENED! 🟢',
                html: `<div class="text-xl font-bold text-slate-600">${data.transaksi.plat_nomor}</div><div class="text-sm text-slate-400">Transaksi Berhasil</div>`,
                icon: 'success',
                showConfirmButton: false,
                timer: 1500,
                background: '#f0fdf4',
                color: '#166534',
                customClass: { popup: 'rounded-[2rem]' }
            });

            // Reset UI
            setTimeout(() => {
                setData(null);
                setScanResult('');
                setUangDibayar('');
                setKembalian(0);
                searchInputRef.current?.focus();
            }, 1500);

        } catch (err) {
            Swal.fire({
                title: 'Gagal!',
                text: err.response?.data?.message || 'Terjadi kesalahan sistem.',
                icon: 'error',
                confirmButtonColor: '#d33',
                customClass: { popup: 'rounded-[2rem]' }
            });
        } finally {
            setLoading(false);
        }
    }

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex items-center gap-3">
                    <h2 className="font-black text-2xl text-slate-800 tracking-tight">TERMINAL GATE KELUAR</h2>
                    <span className="bg-red-100 text-red-600 text-xs font-bold px-3 py-1 rounded-full animate-pulse border border-red-200">
                        🔴 PAYMENT GATEWAY
                    </span>
                </div>
            }
        >
            <Head title="Gate Out POS" />

            <div className="h-[calc(100vh-6rem)] bg-slate-50 p-4 md:p-6 font-sans overflow-hidden">
                <main className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-full">

                    {/* --- LEFT PANEL: SESSION MONITOR (Span 4) --- */}
                    <section className="lg:col-span-4 bg-slate-900 rounded-3xl p-5 flex flex-col shadow-2xl relative overflow-hidden border border-slate-800">
                        {/* Header */}
                        <div className="flex justify-between items-center mb-4 z-10">
                            <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest">Sesi Parkir Aktif</h3>
                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></div>
                        </div>

                        {/* Barcode Scanner Area */}
                        {showScanner && (
                            <div className="mb-4 z-10 relative">
                                <div className="bg-black rounded-2xl overflow-hidden relative">
                                    <div
                                        id={scannerContainerId}
                                        className="w-full h-48 [&_video]:object-cover [&_video]:w-full [&_video]:h-full [&_video]:scale-x-[-1]"
                                    />
                                    {/* HUD Scanner Overlay */}
                                    <div className="absolute inset-0 pointer-events-none">
                                        <div className="absolute top-3 left-4 text-emerald-400 font-mono text-[10px] tracking-widest flex items-center">
                                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse mr-2"></div>
                                            BARCODE SCANNER AKTIF
                                        </div>
                                    </div>
                                    {/* Tombol tutup */}
                                    <button
                                        type="button"
                                        onClick={() => setShowScanner(false)}
                                        className="absolute top-3 right-3 bg-red-500/80 hover:bg-red-600 text-white p-1.5 rounded-lg transition-colors z-20"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                                <p className="text-emerald-400/60 text-[10px] font-mono text-center mt-2 tracking-wider">
                                    Arahkan kamera ke barcode pada karcis parkir
                                </p>
                            </div>
                        )}

                        {/* Search Bar + Scanner Toggle */}
                        <div className="relative mb-4 z-10 group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Search className="w-5 h-5 text-slate-500 group-focus-within:text-emerald-400 transition-colors" />
                            </div>
                            <input
                                ref={searchInputRef}
                                type="text"
                                value={scanResult}
                                onChange={(e) => setScanResult(e.target.value.toUpperCase())}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch(scanResult)}
                                className="w-full bg-slate-800 border-2 border-slate-700 text-emerald-400 text-lg font-mono font-bold rounded-xl pl-12 pr-14 py-4 focus:ring-0 focus:border-emerald-500 outline-none placeholder:text-slate-600 transition-all uppercase tracking-wider"
                                placeholder="PLAT NOMOR..."
                                autoFocus={!showScanner}
                            />
                            {/* Tombol Scan Barcode */}
                            <button
                                type="button"
                                onClick={() => setShowScanner(!showScanner)}
                                className={cn(
                                    "absolute inset-y-0 right-0 pr-4 flex items-center transition-colors",
                                    showScanner ? "text-emerald-400" : "text-slate-500 hover:text-emerald-400"
                                )}
                                title="Scan Barcode Karcis"
                            >
                                <ScanBarcode className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Vehicle Stream List */}
                        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar z-10 space-y-3">
                            {recentVehicles.length > 0 ? recentVehicles.map((v) => (
                                <div
                                    key={v.id_parkir}
                                    onClick={() => handleSearch(v.plat_nomor)}
                                    className="group p-4 bg-white/5 hover:bg-white/10 border-l-4 border-emerald-500 rounded-r-xl cursor-pointer transition-all flex justify-between items-center"
                                >
                                    <div>
                                        <div className="text-white font-mono font-bold text-lg group-hover:text-emerald-300 transition-colors">
                                            {v.plat_nomor}
                                        </div>
                                        <div className="text-slate-500 text-xs flex items-center gap-2 mt-1">
                                            <Clock className="w-3 h-3" />
                                            {new Date(v.waktu_masuk).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                    <div className="bg-red-500/20 text-red-300 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">
                                        Belum Bayar
                                    </div>
                                </div>
                            )) : (
                                <div className="text-center py-10 text-slate-600 opacity-50">
                                    <p className="font-mono text-sm">TIDAK ADA SESI AKTIF</p>
                                </div>
                            )}
                        </div>

                        {/* Background Decoration */}
                        <div className="absolute bottom-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 pointer-events-none"></div>
                    </section>


                    {/* --- RIGHT PANEL: TRANSACTION DECK (Span 8) --- */}
                    <section className="lg:col-span-8 bg-white rounded-3xl p-6 md:p-8 shadow-xl flex flex-col relative overflow-hidden border border-slate-100">
                        {/* Discrete Watermark */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none">
                            <img src="/images/logo-hermina.png" alt="" className="w-96 grayscale" />
                        </div>

                        {data ? (
                            <>
                                {/* A. DIGITAL RECEIPT (Top) */}
                                <div className="z-10 relative">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="px-4 py-1.5 bg-slate-100 rounded-full text-xs font-bold text-slate-500 uppercase tracking-widest">
                                            Ticket ID: #{data.transaksi.id_parkir}
                                        </div>
                                        {data.is_vip && (
                                            <div className="px-4 py-1.5 bg-purple-100 text-purple-700 rounded-full text-xs font-black uppercase tracking-widest flex items-center gap-2">
                                                <span>VIP</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Plate Hero */}
                                    <div className="text-center my-2 border-b-2 border-dashed border-slate-200 pb-4">
                                        <h1 className="text-5xl font-mono font-black text-slate-900 tracking-widest uppercase selection:bg-emerald-200">
                                            {data.transaksi.plat_nomor}
                                        </h1>
                                        <div className="flex items-center justify-center gap-2 mt-2">
                                            <span className={cn(
                                                "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider",
                                                data.transaksi.jenis_kendaraan === 'mobil'
                                                    ? "bg-blue-100 text-blue-700 border border-blue-200"
                                                    : data.transaksi.jenis_kendaraan === 'motor'
                                                        ? "bg-amber-100 text-amber-700 border border-amber-200"
                                                        : "bg-gray-100 text-gray-700 border border-gray-200"
                                            )}>
                                                {{ mobil: 'Mobil', motor: 'Motor', lainnya: 'Lainnya' }[data.transaksi.jenis_kendaraan] || data.transaksi.jenis_kendaraan}
                                            </span>
                                            <span className="text-slate-400 text-xs font-bold uppercase tracking-[0.15em]">Kendaraan Terverifikasi</span>
                                        </div>
                                    </div>

                                    {/* Info Grid */}
                                    <div className="grid grid-cols-3 gap-4 mt-4">
                                        <div className="text-center p-3 rounded-2xl hover:bg-slate-50 transition-colors group">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 group-hover:text-emerald-500">Waktu Masuk</p>
                                            <p className="text-lg font-black text-slate-700">{data.waktu_masuk_formatted}</p>
                                        </div>
                                        <div className="text-center p-3 rounded-2xl hover:bg-slate-50 transition-colors group">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 group-hover:text-emerald-500">Waktu Keluar</p>
                                            <p className="text-lg font-black text-slate-700">{data.waktu_keluar_formatted}</p>
                                        </div>
                                        <div className="text-center p-3 rounded-2xl bg-emerald-50 border border-emerald-100 relative overflow-hidden">
                                            <div className="absolute top-0 right-0 w-6 h-6 bg-emerald-200 rounded-bl-full opacity-50"></div>
                                            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">Durasi</p>
                                            <p className="text-xl font-black text-emerald-800">{data.durasi_text}</p>
                                        </div>
                                    </div>
                                </div>


                                {/* B. PAYMENT ZONE (Bottom) */}
                                <div className="mt-auto pt-4 border-t-4 border-slate-100 relative z-10">
                                    <div className="flex flex-col md:flex-row gap-4 items-end">

                                        {/* Total & Input */}
                                        <div className="flex-1 w-full space-y-6">
                                            <div>
                                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Biaya</p>
                                                <div className={cn(
                                                    "text-5xl font-black tracking-tighter leading-none",
                                                    data.is_vip ? "text-slate-300 line-through decoration-emerald-500 decoration-4" : "text-emerald-600"
                                                )}>
                                                    {formatRupiah(data.biaya_total)}
                                                </div>
                                                {data.is_vip && <span className="text-emerald-500 font-bold text-2xl ml-2">GRATIS</span>}
                                            </div>

                                            {!data.is_vip && (
                                                <div>
                                                    <div className="relative">
                                                        <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                                                            <span className="text-slate-400 font-bold text-2xl">Rp</span>
                                                        </div>
                                                        <input
                                                            id="paymentInput"
                                                            type="number"
                                                            value={uangDibayar}
                                                            onChange={handleUangChange}
                                                            onKeyDown={(e) => e.key === 'Enter' && handleCheckout()}
                                                            className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl px-6 py-4 pl-16 text-3xl font-bold text-slate-900 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all placeholder:text-slate-300"
                                                            placeholder="0"
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Action Button */}
                                        <div className="w-full md:w-auto md:min-w-[300px] relative">
                                            {/* Kembalian — di atas kanan tombol */}
                                            {kembalian > 0 && (
                                                <div className="absolute -top-10 right-0 bg-emerald-100 text-emerald-700 px-4 py-2 rounded-xl text-base font-black flex items-center gap-2 border border-emerald-200 shadow-sm">
                                                    <Wallet className="w-5 h-5" />
                                                    Kembalian: {formatRupiah(kembalian)}
                                                </div>
                                            )}
                                            <button
                                                onClick={handleCheckout}
                                                disabled={loading || (!data.is_vip && parseInt(uangDibayar || 0) < data.biaya_total)}
                                                className="w-full h-full min-h-[80px] bg-slate-900 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-lg font-bold rounded-2xl shadow-xl shadow-slate-200 hover:shadow-emerald-200 transition-all flex flex-col items-center justify-center gap-1 group"
                                            >
                                                {loading ? (
                                                    <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                ) : (
                                                    <>
                                                        <div className="flex items-center gap-3">
                                                            <span>KONFIRMASI PEMBAYARAN</span>
                                                            <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                                                        </div>
                                                        <span className="text-xs font-normal text-white/50 group-hover:text-white/80">Tekan ENTER untuk Konfirmasi</span>
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </>
                        ) : (
                            // IDLE STATE
                            <div className="flex flex-col items-center justify-center h-full text-slate-300 relative z-10">
                                <div className="w-36 h-36 bg-slate-50 rounded-full flex items-center justify-center mb-6 animate-pulse">
                                    <CreditCard className="w-20 h-20 text-slate-200" />
                                </div>
                                <h1 className="text-4xl font-bold text-slate-400 mb-2">TERMINAL POS SIAP</h1>
                                <p className="text-lg">Pilih kendaraan dari panel kiri atau scan karcis</p>
                            </div>
                        )}
                    </section>

                </main>
            </div>
        </AuthenticatedLayout>
    );
}
