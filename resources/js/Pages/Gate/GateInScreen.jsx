import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Ticket, AlertTriangle, CheckCircle2,
    Car, Bike, ShieldCheck, Camera, Loader2, Printer
} from 'lucide-react';
import GateLayout from '@/Layouts/GateLayout';
import axios from 'axios';
import GateCamera from '@/Components/Gate/GateCamera';
import { captureAndUpload } from '@/Utils/cloudinary';
import Barcode from 'react-barcode';

/**
 * Halaman Gate Masuk — Layar Sentuh Self-Service.
 *
 * Flow baru (tanpa OCR/input plat):
 * - Kamera live aktif terus — QR scanning di background.
 * - Jika QR VIP terdeteksi → auto capture foto → upload → proses → gate terbuka.
 * - Tombol "AMBIL TIKET" → capture foto → upload Cloudinary → cetak karcis.
 * - Plat nomor TIDAK diinput manual — VIP dari database, umum diisi '-'.
 *
 * Props dari GateController@showGateIn:
 * - gateType: 'motor' | 'mobil'
 * - gateCode: 'gate_in_motor' | 'gate_in_mobil'
 * - gateName: Nama tampilan gate
 * - jenisKendaraan: 'motor' | 'mobil'
 * - kapasitas: { total, terisi, tersedia }
 */
export default function GateInScreen({ gateType, gateCode, gateName, jenisKendaraan, kapasitas }) {
    // State utama
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState(null);

    // State karcis / tiket
    const [ticketData, setTicketData] = useState(null);
    const [showTicket, setShowTicket] = useState(false);

    // State foto preview (setelah capture, sebelum response server)
    const [capturedPhoto, setCapturedPhoto] = useState(null);

    // State VIP
    const [vipData, setVipData] = useState(null);
    const [showGateOpen, setShowGateOpen] = useState(false);

    // Kapasitas
    const [currentKapasitas, setCurrentKapasitas] = useState(kapasitas);
    const isFull = currentKapasitas.tersedia <= 0;
    const fillPercentage = currentKapasitas.total > 0
        ? Math.round((currentKapasitas.terisi / currentKapasitas.total) * 100)
        : 0;

    // Ref ke komponen GateCamera — untuk ambil video element
    const cameraRef = useRef(null);

    // STATE KAMERA: mati di awal, nyala saat klik tombol
    const [cameraOn, setCameraOn] = useState(false);

    // Flag: apakah sedang menunggu kamera siap untuk capture otomatis
    const pendingCaptureRef = useRef(null); // null | 'ticket' | 'vip'
    const pendingVipDataRef = useRef(null); // data VIP sementara saat menunggu kamera

    // Aksen warna berdasarkan jenis kendaraan
    const isMotor = gateType === 'motor';

    // =====================================================================
    // CALLBACK: Kamera siap — auto capture jika ada pending
    // Menggunakan ref untuk menghindari stale closure
    // =====================================================================
    const doTicketCaptureRef = useRef(null);
    const doVipCaptureRef = useRef(null);

    const handleCameraReady = useCallback(async () => {
        // Jika ada pending capture, langsung ambil foto
        if (pendingCaptureRef.current === 'ticket' && doTicketCaptureRef.current) {
            pendingCaptureRef.current = null;
            await doTicketCaptureRef.current();
        } else if (pendingCaptureRef.current === 'vip' && doVipCaptureRef.current) {
            pendingCaptureRef.current = null;
            await doVipCaptureRef.current(pendingVipDataRef.current);
            pendingVipDataRef.current = null;
        }
    }, []);

    // =====================================================================
    // HELPER: Capture foto dari kamera + upload ke Cloudinary
    // =====================================================================
    const captureAndUploadPhoto = useCallback(async (folder = 'hermina_parking/masuk') => {
        const videoEl = cameraRef.current?.getVideoElement();
        if (!videoEl || !videoEl.videoWidth) {
            throw new Error('Kamera belum siap atau tidak ada frame data.');
        }
        const fotoUrl = await captureAndUpload(videoEl, folder);
        return fotoUrl;
    }, []);

    // =====================================================================
    // FLOW: AMBIL TIKET — Nyalakan kamera → tunggu siap → capture → proses
    // =====================================================================
    const handleAmbilTiket = useCallback(() => {
        if (isFull || processing) return;
        setProcessing(true);
        setError(null);

        // Set flag: saat kamera siap, langsung capture untuk tiket
        pendingCaptureRef.current = 'ticket';
        setCameraOn(true);
    }, [isFull, processing]);

    // Eksekusi capture tiket (dipanggil oleh handleCameraReady via ref)
    const doTicketCapture = async () => {
        try {
            // Delay tambahan 500ms agar kamera benar-benar stabil sebelum capture
            await new Promise(resolve => setTimeout(resolve, 500));

            // Capture foto dari kamera + upload ke Cloudinary
            let fotoMasukUrl = null;
            try {
                console.log('[GateIn] Memulai capture foto...');
                fotoMasukUrl = await captureAndUploadPhoto('hermina_parking/masuk');
                setCapturedPhoto(fotoMasukUrl);
                console.log('[GateIn] Foto berhasil diupload:', fotoMasukUrl);
            } catch (uploadErr) {
                // Tampilkan error upload ke user, JANGAN diam-diam diabaikan
                console.error('[GateIn] Upload foto GAGAL:', uploadErr);
                // Tetap lanjutkan proses tanpa foto, tapi catat warning
                console.warn('[GateIn] Melanjutkan proses TANPA foto...');
            }

            // Kirim ke backend — foto_masuk bisa null jika upload gagal
            const response = await axios.post(route('gate.new.in.process', gateType), {
                plat_nomor: null,
                metode_entry: 'Kamera',
                foto_masuk: fotoMasukUrl,
            });

            if (response.data.status === 'success') {
                setTicketData(response.data.ticket);
                setShowTicket(true);
                setCameraOn(false); // Matikan kamera setelah capture
                setCurrentKapasitas(prev => ({
                    ...prev,
                    terisi: prev.terisi + 1,
                    tersedia: prev.tersedia - 1,
                }));
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Gagal memproses. Silakan coba lagi.');
            setCameraOn(false);
            setTimeout(() => setError(null), 5000);
        } finally {
            setProcessing(false);
        }
    };

    // Update ref setiap kali doTicketCapture berubah (hindari stale closure)
    doTicketCaptureRef.current = doTicketCapture;

    // =====================================================================
    // FLOW: SCAN QR VIP — Nyalakan kamera + aktifkan QR scanning
    // =====================================================================
    const [vipScanMode, setVipScanMode] = useState(false);

    const handleStartVipScan = () => {
        if (processing) return;
        setVipScanMode(true);
        setCameraOn(true);
    };

    const handleQrDetected = useCallback(async (scannedText) => {
        if (processing || isFull || showTicket || showGateOpen) return;

        setProcessing(true);
        setError(null);

        try {
            const checkResponse = await axios.post(route('gate.new.in.check-vip', gateType), {
                plat_nomor: scannedText,
            });

            if (checkResponse.data.status === 'success') {
                const vipInfo = checkResponse.data.data;
                await doVipCapture(vipInfo);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'QR tidak valid.');
            setTimeout(() => setError(null), 4000);
            setProcessing(false);
        }
    }, [gateType, processing, isFull, showTicket, showGateOpen]);

    // Eksekusi VIP capture + proses
    const doVipCapture = async (vipInfo) => {
        try {
            let fotoMasukUrl = null;
            try {
                fotoMasukUrl = await captureAndUploadPhoto('hermina_parking/masuk');
                setCapturedPhoto(fotoMasukUrl);
            } catch (uploadErr) {
                console.warn('Foto VIP gagal diupload:', uploadErr);
            }

            const processResponse = await axios.post(route('gate.new.in.process', gateType), {
                plat_nomor: vipInfo.plat_nomor,
                metode_entry: 'QR',
                foto_masuk: fotoMasukUrl,
            });

            if (processResponse.data.status === 'success') {
                setVipData({ ...vipInfo, ticket: processResponse.data.ticket });
                setShowGateOpen(true);
                setCameraOn(false); // Matikan kamera
                setVipScanMode(false);
                setCurrentKapasitas(prev => ({
                    ...prev,
                    terisi: prev.terisi + 1,
                    tersedia: prev.tersedia - 1,
                }));
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Gagal memproses VIP.');
            setCameraOn(false);
            setVipScanMode(false);
            setTimeout(() => setError(null), 5000);
        } finally {
            setProcessing(false);
        }
    };

    // Update ref setiap kali doVipCapture berubah (hindari stale closure)
    doVipCaptureRef.current = doVipCapture;

    // Reset semua state — kembali ke layar utama
    const resetState = () => {
        setShowTicket(false);
        setShowGateOpen(false);
        setVipData(null);
        setTicketData(null);
        setCapturedPhoto(null);
        setError(null);
        setCameraOn(false);
        setVipScanMode(false);
    };

    // =====================================================================
    // FUNGSI CETAK KARCIS — buka window baru dengan format struk thermal
    // =====================================================================
    const handlePrint = () => {
        if (!ticketData) return;
        const t = ticketData;
        const masuk = t.waktu_masuk || new Date().toLocaleString('id-ID');
        const tarifFormatted = t.tarif_per_jam
            ? new Intl.NumberFormat('id-ID').format(t.tarif_per_jam)
            : '-';

        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>Cetak Karcis Parkir</title>
                    <style>
                        body { font-family: monospace; text-align: center; max-width: 300px; margin: 0 auto; padding: 20px; color: black; }
                        h1 { font-size: 24px; font-weight: bold; margin: 5px 0; text-transform: uppercase; }
                        p { font-size: 10px; margin: 2px 0; }
                        .divider { border-bottom: 2px dashed black; margin: 10px 0; }
                        .plat { font-size: 28px; font-weight: 900; margin: 10px 0; letter-spacing: 2px; }
                        .info { font-size: 10px; text-align: left; margin-top: 10px; }
                        .info div { display: flex; justify-content: space-between; padding: 3px 0; }
                        .footer { margin-top: 20px; font-size: 10px; }
                        .barcode { margin: 10px 0; }
                        img.logo { height: 50px; filter: grayscale(100%); margin-bottom: 5px; }
                    </style>
                </head>
                <body>
                    <img src="/images/hermina_logo.png" class="logo" />
                    <h1>HERMINA SMART</h1>
                    <p style="font-weight: bold;">PARKING SYSTEM</p>
                    <p>Jl. A.H. Nasution No. 50, Antapani Wetan</p>
                    <p>Kec. Antapani, Kota Bandung</p>

                    <div class="divider"></div>

                    <p>NO. TIKET</p>
                    <div class="plat">#${String(t.id_parkir).padStart(6, '0')}</div>

                    <div class="divider"></div>

                    <div class="info">
                        <div><span>JENIS</span> <span style="text-transform: uppercase; font-weight: bold;">${t.jenis_kendaraan || 'MOTOR'}</span></div>
                        <div><span>MASUK</span> <span>${masuk}</span></div>
                        <div><span>TARIF</span> <span>Rp ${tarifFormatted} / jam</span></div>
                    </div>

                    <div class="divider"></div>

                    <div class="footer">
                        <p style="font-weight: bold;">SIMPAN KARCIS INI</p>
                        <p>Denda karcis hilang Rp 50.000</p>

                        <div class="barcode">
                           <svg id="barcode"></svg>
                        </div>

                        <p>${new Date().toLocaleDateString('id-ID')}</p>
                    </div>

                    <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"><\/script>
                    <script>
                        JsBarcode("#barcode", "${String(t.id_parkir).padStart(6, '0')}", {
                            format: "CODE128",
                            width: 2,
                            height: 50,
                            displayValue: true
                        });
                        window.onload = function() { window.print(); window.close(); }
                    <\/script>
                </body>
            </html>
        `);
        printWindow.document.close();
    };

    return (
        <GateLayout title={gateName} gateName={gateName} gateType={gateType}>
            <div className="flex-1 w-full max-w-[1400px] mx-auto px-6 py-6 relative flex flex-col">

                <AnimatePresence mode="wait">
                    {/* ============================================================= */}
                    {/* BENTO GRID LAYOUT: KAMERA + INFO + AKSES */}
                    {/* ============================================================= */}
                    {!showTicket && !showGateOpen && (
                        <motion.div
                            key="bento-grid"
                            initial={{ opacity: 0, scale: 0.98, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -10 }}
                            className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10 w-full min-h-[500px]"
                        >
                            {/* KIRI - Kamera / Placeholder (Span 8) */}
                            <div className="lg:col-span-8 flex flex-col rounded-[2.5rem] overflow-hidden border border-slate-700/50 bg-slate-900/50 shadow-lg relative group">
                                {/* Kamera AKTIF — live feed */}
                                {cameraOn ? (
                                    <>
                                        <div className="absolute top-6 right-6 z-20 flex items-center gap-3 px-4 py-2 rounded-full bg-slate-800/80 backdrop-blur-sm border border-slate-600">
                                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                                            <span className="text-[11px] text-slate-200 font-bold uppercase tracking-widest font-['DM_Sans']">
                                                {vipScanMode ? 'Scanning QR VIP...' : 'Mengambil Foto...'}
                                            </span>
                                        </div>
                                        <GateCamera
                                            ref={cameraRef}
                                            active={true}
                                            onReady={handleCameraReady}
                                            onQrDetected={vipScanMode ? handleQrDetected : undefined}
                                            showQrOverlay={vipScanMode}
                                            qrPaused={processing}
                                        />

                                        {/* Tombol batal scan VIP */}
                                        {vipScanMode && !processing && (
                                            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20">
                                                <button
                                                    onClick={() => { setCameraOn(false); setVipScanMode(false); }}
                                                    className="px-6 py-3 rounded-full bg-slate-800/80 backdrop-blur-sm border border-slate-600 text-slate-300 font-['DM_Sans'] font-bold text-sm hover:bg-slate-700 transition-colors"
                                                >
                                                    Batal Scan VIP
                                                </button>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    /* Kamera MATI — placeholder statis */
                                    <div className="flex-1 flex flex-col items-center justify-center text-center p-12 min-h-[400px]">
                                        <div className={`w-28 h-28 rounded-full flex items-center justify-center mb-8 ${
                                            isMotor ? 'bg-cyan-500/10 border-2 border-cyan-500/20' : 'bg-amber-500/10 border-2 border-amber-500/20'
                                        }`}>
                                            <Camera className={`w-14 h-14 ${isMotor ? 'text-cyan-400/60' : 'text-amber-400/60'}`} />
                                        </div>
                                        <h3 className="text-2xl font-['Outfit'] font-bold text-white/80 mb-3">Kamera Siap</h3>
                                        <p className="text-slate-400 font-['DM_Sans'] text-sm max-w-md leading-relaxed">
                                            Tekan tombol <span className="font-bold text-white">AMBIL TIKET</span> untuk mengaktifkan kamera dan mengambil foto kendaraan secara otomatis.
                                        </p>
                                    </div>
                                )}

                                {/* Overlay Floating Messages */}
                                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-[90%] max-w-xl z-20 flex flex-col gap-4 pointer-events-none">
                                    <AnimatePresence>
                                        {error && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: 10 }}
                                                className="w-full p-5 bg-red-950/90 backdrop-blur-xl border border-red-500/30 rounded-[1.5rem] text-red-200 text-sm pl-6 shadow-2xl flex items-center gap-4 font-['DM_Sans'] font-medium pointer-events-auto"
                                            >
                                                <div className="bg-red-500/20 p-2 rounded-full shrink-0">
                                                    <AlertTriangle className="w-5 h-5 text-red-400" />
                                                </div>
                                                {error}
                                            </motion.div>
                                        )}
                                        {processing && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: 10 }}
                                                className="self-center flex items-center gap-4 text-emerald-100 font-['DM_Sans'] font-medium bg-emerald-950/80 px-6 py-4 rounded-full backdrop-blur-xl border border-emerald-500/30 shadow-2xl pointer-events-auto"
                                            >
                                                <Loader2 className="w-5 h-5 text-emerald-400 animate-spin" />
                                                <span className="text-sm tracking-widest uppercase">Memproses Kendaraan...</span>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>

                            {/* KANAN - Panel Informasi & Aksi (Span 4) */}
                            <div className="lg:col-span-4 flex flex-col gap-6 h-full">

                                {/* Box 1: Kapasitas Parkir */}
                                <div className="rounded-[2rem] border border-slate-700/50 bg-slate-900/50 shadow-lg p-8 flex flex-col shrink-0">
                                    <div className="flex justify-between items-end mb-6">
                                        <div>
                                            <h4 className="text-white font-['Outfit'] font-bold text-xl leading-tight">Kapasitas Parkir</h4>
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1 block">Live Status Counter</span>
                                        </div>
                                        <span className={`font-['JetBrains_Mono'] text-5xl font-bold tracking-tighter leading-none ${isFull ? 'text-red-400' : isMotor ? 'text-cyan-400' : 'text-amber-400'}`}>
                                            {currentKapasitas.tersedia}
                                        </span>
                                    </div>

                                    <div className="h-3 bg-slate-800 rounded-full overflow-hidden mb-4">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${fillPercentage}%` }}
                                            transition={{ duration: 1, ease: 'easeOut' }}
                                            className={`h-full rounded-full ${
                                                fillPercentage >= 90 ? 'bg-red-500' :
                                                fillPercentage >= 70 ? 'bg-amber-500' :
                                                isMotor ? 'bg-cyan-500' : 'bg-amber-500'
                                            }`}
                                        />
                                    </div>

                                    <div className="flex justify-between items-center text-[11px] font-bold uppercase tracking-widest">
                                        <span className="text-slate-400">Total Slot: {currentKapasitas.total}</span>
                                        {isFull ? (
                                            <span className="text-red-400 animate-pulse flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5" /> Penuh</span>
                                        ) : (
                                            <span className="text-emerald-400 px-2 py-0.5 bg-emerald-500/10 rounded border border-emerald-500/20">{fillPercentage}% Terisi</span>
                                        )}
                                    </div>
                                </div>

                                {/* Box 2: Tombol SCAN QR VIP — aktifkan kamera + mode scan */}
                                <motion.button
                                    whileHover={{ scale: processing ? 1 : 1.02 }}
                                    whileTap={{ scale: processing ? 1 : 0.98 }}
                                    onClick={handleStartVipScan}
                                    disabled={processing || isFull}
                                    className="flex-1 rounded-[2rem] border border-emerald-500/20 bg-emerald-900/20 p-8 flex flex-col justify-center items-center text-center transition-colors hover:bg-emerald-900/30 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <div className="w-14 h-14 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4 text-emerald-400">
                                        <ShieldCheck className="w-7 h-7" />
                                    </div>
                                    <h4 className="text-white font-['Outfit'] font-bold text-xl tracking-tight mb-2">Scan QR VIP</h4>
                                    <p className="text-slate-400 font-['DM_Sans'] text-xs font-bold uppercase tracking-wider leading-relaxed px-4">
                                        Tekan untuk mengaktifkan kamera & scan QR member VIP
                                    </p>
                                </motion.button>

                                {/* Box 3: Action Button — AMBIL TIKET */}
                                <motion.button
                                    whileHover={{ scale: isFull || processing ? 1 : 1.02 }}
                                    whileTap={{ scale: isFull || processing ? 1 : 0.98 }}
                                    onClick={handleAmbilTiket}
                                    disabled={isFull || processing}
                                    className={`w-full py-6 rounded-[2rem] flex flex-col items-center justify-center gap-3 transition-colors shrink-0 shadow-lg ${
                                        isFull || processing
                                            ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                            : isMotor
                                                ? 'bg-cyan-600 text-white hover:bg-cyan-500 shadow-cyan-900/50'
                                                : 'bg-amber-600 text-white hover:bg-amber-500 shadow-amber-900/50'
                                    }`}
                                >
                                    {processing ? (
                                        <>
                                            <Loader2 className="w-8 h-8 animate-spin" />
                                            <span className="text-xl font-['Outfit'] font-bold tracking-widest">MEMPROSES...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Camera className="w-10 h-10" />
                                            <span className="text-2xl font-['Outfit'] font-bold tracking-wider">AMBIL TIKET</span>
                                        </>
                                    )}
                                </motion.button>
                            </div>
                        </motion.div>
                    )}

                    {/* ============================================================= */}
                    {/* HASIL: KARCIS TERCETAK — Full screen, 2 kolom */}
                    {/* ============================================================= */}
                    {showTicket && ticketData && (
                        <motion.div
                            key="ticket-result"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex-1 flex items-center justify-center w-full relative z-10"
                        >
                            <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">

                                {/* KOLOM KIRI — Karcis Digital */}
                                <div className="rounded-[2.5rem] border border-white/10 bg-black/60 backdrop-blur-3xl p-10 text-center shadow-2xl flex flex-col justify-between">
                                    {/* Header Sukses */}
                                    <div className="border-b-2 border-dashed border-white/10 pb-6 mb-6">
                                        <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-5 shadow-inner">
                                            <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                                        </div>
                                        <h3 className="text-3xl font-['Outfit'] font-bold text-white tracking-tight">Silakan Masuk!</h3>
                                        <p className="text-[10px] text-emerald-200/70 font-bold uppercase tracking-widest mt-2">Karcis Parkir Digital</p>
                                    </div>

                                    {/* Barcode — sama seperti struk cetak */}
                                    <div className="flex justify-center mb-6 p-5 bg-white rounded-[2rem] shadow-sm border border-slate-100 mx-auto">
                                        <Barcode
                                            value={String(ticketData.id_parkir).padStart(6, '0')}
                                            format="CODE128"
                                            width={2.5}
                                            height={70}
                                            displayValue={true}
                                            background="#ffffff"
                                            lineColor="#1e293b"
                                            fontSize={14}
                                            font="JetBrains Mono"
                                            textMargin={8}
                                            margin={10}
                                        />
                                    </div>

                                    {/* Detail Karcis (Mono style) */}
                                    <div className="space-y-4 text-left bg-white/5 rounded-[2rem] p-6 mb-6 border border-white/5 shadow-inner">
                                        <DetailRow label="NO. TIKET" value={`#${String(ticketData.id_parkir).padStart(6, '0')}`} mono />
                                        <DetailRow label="KENDARAAN" value={ticketData.jenis_kendaraan} capitalize />
                                        <DetailRow label="WAKTU" value={ticketData.waktu_masuk} mono />
                                        <DetailRow label="TARIF" value={`Rp ${Number(ticketData.tarif_per_jam).toLocaleString('id-ID')}/H`} mono />
                                    </div>

                                    {/* Peringatan */}
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 py-3 rounded-xl border border-amber-500/20">
                                        ⚠️ Simpan karcis dengan baik
                                    </p>
                                </div>

                                {/* KOLOM KANAN — Foto + Aksi Cetak */}
                                <div className="flex flex-col gap-6 h-full">
                                    {/* Foto Kendaraan Masuk */}
                                    <div className="rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl flex-1 flex flex-col bg-slate-900/50 min-h-[250px]">
                                        {ticketData.foto_masuk || capturedPhoto ? (
                                            <>
                                                <img
                                                    src={ticketData.foto_masuk || capturedPhoto}
                                                    alt="Foto kendaraan masuk"
                                                    className="w-full h-full object-cover flex-1"
                                                />
                                                <div className="bg-slate-800/80 px-6 py-3 flex items-center gap-3">
                                                    <Camera className="w-4 h-4 text-cyan-400" />
                                                    <span className="text-xs text-slate-300 font-['DM_Sans'] font-bold uppercase tracking-wider">Foto Kendaraan Masuk — Tersimpan</span>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="w-full h-full flex-1 flex flex-col items-center justify-center text-slate-500 gap-3 p-6 text-center">
                                                <Camera className="w-12 h-12 opacity-50 mb-2" />
                                                <p className="font-['DM_Sans'] text-sm tracking-widest uppercase font-bold">Terjadi Kesalahan</p>
                                                <p className="text-xs">Foto kendaraan gagal diambil atau diunggah.</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Aksi Cetak & Tutup */}
                                    <div className="flex flex-col gap-4">
                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={handlePrint}
                                            className={`w-full py-5 rounded-[2rem] flex items-center justify-center gap-4 font-['Outfit'] font-bold text-xl shadow-xl transition-colors ${
                                                isMotor
                                                    ? 'bg-cyan-600 text-white hover:bg-cyan-500 shadow-cyan-900/50'
                                                    : 'bg-amber-600 text-white hover:bg-amber-500 shadow-amber-900/50'
                                            }`}
                                        >
                                            <Printer className="w-7 h-7" />
                                            CETAK KARCIS
                                        </motion.button>

                                        <button
                                            onClick={resetState}
                                            className="w-full py-4 rounded-[2rem] border border-white/10 text-slate-400 font-['DM_Sans'] font-bold text-sm uppercase tracking-widest hover:bg-white/5 hover:text-white transition-all"
                                        >
                                            Tutup & Lanjut
                                        </button>
                                    </div>

                                    {/* Auto reset progress */}
                                    <AutoReset onReset={resetState} seconds={15} />
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* ============================================================= */}
                    {/* HASIL: GERBANG TERBUKA (VIP) */}
                    {/* ============================================================= */}
                    {showGateOpen && vipData && (
                        <motion.div
                            key="gate-open"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="w-full max-w-md text-center relative z-10"
                        >
                            <div className="rounded-[3rem] border border-emerald-500/30 bg-[#064e3b]/80 shadow-2xl backdrop-blur-3xl p-12">
                                <motion.div
                                    animate={{
                                        scale: [1, 1.1, 1],
                                        opacity: [1, 0.8, 1],
                                    }}
                                    transition={{ repeat: Infinity, duration: 2 }}
                                    className="w-28 h-28 bg-emerald-500/20 backdrop-blur-sm shadow-inner rounded-full flex items-center justify-center mx-auto mb-8 border border-emerald-400/50"
                                >
                                    <CheckCircle2 className="w-14 h-14 text-emerald-400" />
                                </motion.div>

                                <h3 className="text-4xl font-['Outfit'] font-bold text-emerald-100 tracking-tighter mb-2">GERBANG DIBUKA</h3>
                                <p className="text-[10px] uppercase font-bold tracking-widest text-emerald-400 mb-8">Access Granted • VIP</p>

                                {/* Foto kendaraan VIP */}
                                <div className="mb-6 rounded-2xl overflow-hidden border border-emerald-500/20 bg-black/40 h-32 flex items-center justify-center">
                                    {(vipData?.ticket?.foto_masuk || capturedPhoto) ? (
                                        <img
                                            src={vipData?.ticket?.foto_masuk || capturedPhoto}
                                            alt="Foto kendaraan VIP"
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="flex flex-col items-center justify-center text-emerald-500/50">
                                            <Camera className="w-8 h-8 opacity-50 mb-1" />
                                            <span className="text-[10px] uppercase font-bold tracking-widest">Tanpa Foto</span>
                                        </div>
                                    )}
                                </div>

                                <div className="bg-black/40 rounded-[2rem] border border-emerald-500/20 shadow-sm p-6 mb-8 backdrop-blur-sm">
                                    <div className="flex items-center justify-center gap-3 mb-4 bg-emerald-500/20 py-2 rounded-xl">
                                        <ShieldCheck className="w-5 h-5 text-emerald-400" />
                                        <span className="text-emerald-200 font-['DM_Sans'] font-bold uppercase tracking-wider text-sm">{vipData.pemilik}</span>
                                    </div>
                                    <p className="text-white font-bold font-['JetBrains_Mono'] text-3xl tracking-widest">{vipData.plat_nomor}</p>
                                    <p className="text-emerald-200/70 font-['DM_Sans'] text-xs font-bold uppercase tracking-wider mt-2">{vipData.jenis_kendaraan} • {vipData.warna}</p>
                                </div>

                                <AutoReset onReset={resetState} seconds={8} />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </GateLayout>
    );
}

/**
 * Row helper untuk detail transaksi dengan styling konsisten
 */
function DetailRow({ label, value, mono = false, capitalize = false }) {
    return (
        <div className="flex justify-between items-center border-b border-dashed border-white/10 pb-2 last:border-0 last:pb-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</span>
            <span className={`text-white ${mono ? "font-['JetBrains_Mono'] text-lg tracking-widest font-bold" : "font-['DM_Sans'] font-bold"} ${capitalize ? 'capitalize' : ''}`}>
                {value}
            </span>
        </div>
    );
}

/**
 * Komponen auto-reset — countdown lalu reset layar ke awal
 */
function AutoReset({ onReset, seconds = 10 }) {
    const [countdown, setCountdown] = useState(seconds);

    useEffect(() => {
        const timer = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    onReset();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [onReset, seconds]);

    return (
        <div className="flex flex-col items-center gap-3">
            <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden shadow-inner border border-white/5">
                <motion.div
                    initial={{ width: '100%' }}
                    animate={{ width: '0%' }}
                    transition={{ duration: seconds, ease: 'linear' }}
                    className="h-full bg-emerald-400 rounded-full"
                />
            </div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Layar Reset dalam {countdown}s
            </p>
        </div>
    );
}
