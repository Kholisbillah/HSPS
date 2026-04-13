import { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import Tesseract from 'tesseract.js';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, CameraOff, Zap, QrCode, ScanLine, ShieldCheck } from 'lucide-react';

/**
 * LiveCamera — Komponen kamera live untuk Gate Masuk.
 *
 * Kamera selalu aktif dan berjalan dalam 2 mode secara bersamaan:
 * 1. QR Scanner: Selalu aktif di background, jika terdeteksi QR code VIP → langsung proses.
 * 2. OCR Mode: Diaktifkan saat user klik "Ambil Karcis" → capture frame & proses Tesseract OCR.
 *
 * @param {boolean} active - Apakah kamera harus aktif
 * @param {Function} onQrDetected - Callback saat QR code terdeteksi (VIP)
 * @param {boolean} ocrMode - Apakah sedang dalam mode OCR (ambil karcis)
 * @param {Function} onOcrResult - Callback hasil OCR plat nomor
 * @param {boolean} qrPaused - Pause QR scanning (saat sedang memproses)
 */
export default function LiveCamera({ active, onQrDetected, ocrMode, onOcrResult, qrPaused = false }) {
    const scannerRef = useRef(null);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [cameraError, setCameraError] = useState(false);
    const [ocrProcessing, setOcrProcessing] = useState(false);
    const [lastQrResult, setLastQrResult] = useState(null);
    const qrCooldownRef = useRef(false);

    // ID unik untuk element html5-qrcode
    const scannerId = 'live-camera-reader';

    // =====================================================================
    // Inisialisasi kamera dengan html5-qrcode (mode QR scanner)
    // Kamera selalu hidup, QR scanning berjalan terus di background
    // =====================================================================
    useEffect(() => {
        let isMounted = true;

        const startScanner = async () => {
            // Tunggu DOM siap
            await new Promise(r => setTimeout(r, 200));
            if (!isMounted) return;
            if (!document.getElementById(scannerId)) return;

            try {
                // Buat instance baru jika belum ada
                if (!scannerRef.current) {
                    scannerRef.current = new Html5Qrcode(scannerId);
                }

                // Stop scanner jika sedang berjalan
                try {
                    const state = scannerRef.current.getState();
                    if (state === 1 || state === 2) {
                        await scannerRef.current.stop();
                    }
                } catch (e) { /* ignore */ }

                // Mulai scanner dengan kamera belakang
                await scannerRef.current.start(
                    { facingMode: 'environment' },
                    {
                        fps: 10,
                        qrbox: { width: 300, height: 300 },
                        aspectRatio: 16 / 9,
                        disableFlip: false,
                    },
                    (decodedText) => {
                        // QR terdeteksi — cek cooldown agar tidak spam
                        if (isMounted && !qrCooldownRef.current && !qrPaused) {
                            qrCooldownRef.current = true;
                            setLastQrResult(decodedText);
                            onQrDetected(decodedText);
                            // Cooldown 3 detik sebelum scan QR berikutnya
                            setTimeout(() => {
                                qrCooldownRef.current = false;
                                setLastQrResult(null);
                            }, 3000);
                        }
                    },
                    () => { /* QR scan miss — ignore */ }
                ).catch(err => {
                    if (isMounted) {
                        console.error('Camera fail:', err);
                        setCameraError(true);
                    }
                });
            } catch (err) {
                if (isMounted) {
                    console.error('Camera init error:', err);
                    setCameraError(true);
                }
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

        if (active) {
            setCameraError(false);
            startScanner();
        } else {
            stopScanner();
        }

        return () => {
            isMounted = false;
            stopScanner();
        };
    }, [active]);

    // Update ref callback saat props berubah (tanpa restart scanner)
    useEffect(() => {
        // tidak ada yang perlu dilakukan, onQrDetected selalu terbaru via closure
    }, [onQrDetected, qrPaused]);

    // =====================================================================
    // OCR MODE: Capture frame dari video element lalu proses Tesseract
    // =====================================================================
    const captureAndOCR = useCallback(async () => {
        if (ocrProcessing) return;

        // Ambil video element dari html5-qrcode
        const container = document.getElementById(scannerId);
        if (!container) return;

        const videoEl = container.querySelector('video');
        if (!videoEl) {
            console.error('Video element tidak ditemukan');
            return;
        }

        setOcrProcessing(true);

        try {
            // Buat canvas dari frame video
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            const w = videoEl.videoWidth;
            const h = videoEl.videoHeight;

            // Crop area tengah (fokus ke plat nomor)
            const cropW = w * 0.7;
            const cropH = h * 0.35;
            const cropX = (w - cropW) / 2;
            const cropY = (h - cropH) / 2;

            canvas.width = cropW;
            canvas.height = cropH;

            // Gambar frame yang di-crop
            ctx.drawImage(videoEl, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

            // Preprocessing: grayscale + threshold untuk OCR lebih akurat
            const imageData = ctx.getImageData(0, 0, cropW, cropH);
            const d = imageData.data;
            for (let i = 0; i < d.length; i += 4) {
                const r = d[i], g = d[i + 1], b = d[i + 2];
                // Konversi ke grayscale
                let v = 0.2126 * r + 0.7152 * g + 0.0722 * b;
                // Binary threshold untuk kontras tinggi
                v = v >= 100 ? 255 : 0;
                d[i] = d[i + 1] = d[i + 2] = v;
            }
            ctx.putImageData(imageData, 0, 0);

            const processedImage = canvas.toDataURL('image/jpeg');

            // Jalankan Tesseract OCR
            const result = await Tesseract.recognize(processedImage, 'eng', {
                logger: m => console.log(m.status),
                tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
            });

            // Bersihkan hasil OCR — hanya alfanumerik
            const cleanText = result.data.text.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
            onOcrResult(cleanText);
        } catch (err) {
            console.error('OCR Error:', err);
            onOcrResult('');
        } finally {
            setOcrProcessing(false);
        }
    }, [ocrProcessing, onOcrResult]);

    // Trigger OCR capture saat ocrMode diaktifkan
    useEffect(() => {
        if (ocrMode && !ocrProcessing) {
            captureAndOCR();
        }
    }, [ocrMode]);

    // =====================================================================
    // RENDER: Kamera error state
    // =====================================================================
    if (cameraError) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900/80 border border-slate-700/50 rounded-3xl p-6 text-center min-h-[300px]">
                <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-4">
                    <CameraOff className="w-10 h-10 text-slate-400" />
                </div>
                <h3 className="text-xl font-['Outfit'] font-bold text-white mb-2">
                    Kamera Tidak Tersedia
                </h3>
                <p className="text-slate-400 text-sm font-['DM_Sans'] max-w-sm">
                    Izin akses kamera ditolak atau perangkat tidak ditemukan.
                    Pastikan browser mengizinkan akses kamera.
                </p>
            </div>
        );
    }

    // =====================================================================
    // RENDER: Live Camera Feed + Overlay
    // =====================================================================
    return (
        <div className="relative w-full h-full min-h-[300px] rounded-2xl overflow-hidden bg-black">
            {/* Container html5-qrcode — video feed ditampilkan di sini */}
            <div
                id={scannerId}
                className="w-full h-full [&_video]:object-cover [&_video]:w-full [&_video]:h-full"
            />

            {/* Overlay UI di atas video */}
            <div className="absolute inset-0 pointer-events-none">
                {/* Status indikator — LIVE badge */}
                <div className="absolute top-4 left-4 flex items-center gap-2 z-20">
                    <div className="flex items-center gap-2 bg-black/50 backdrop-blur-sm rounded-full px-3 py-1.5">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                        <span className="text-white font-['JetBrains_Mono'] text-xs tracking-wider">
                            LIVE
                        </span>
                    </div>
                </div>

                {/* Status QR Scanning aktif — pojok kanan atas */}
                <div className="absolute top-4 right-4 z-20">
                    <div className="flex items-center gap-2 bg-emerald-500/10 backdrop-blur-sm border border-emerald-500/30 rounded-full px-3 py-1.5">
                        <QrCode className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400 font-['DM_Sans'] text-xs">
                            QR Otomatis
                        </span>
                    </div>
                </div>

                {/* Area scan QR — kotak tengah dengan corner markers */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[280px] h-[280px]">
                    {/* Scanning line animasi */}
                    <div className="w-full h-0.5 bg-emerald-500/60 shadow-[0_0_15px_rgba(16,185,129,0.5)] animate-scan-y absolute top-0 z-10" />

                    {/* Corner markers */}
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-3 border-l-3 border-emerald-400 rounded-tl-lg" />
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-3 border-r-3 border-emerald-400 rounded-tr-lg" />
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-3 border-l-3 border-emerald-400 rounded-bl-lg" />
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-3 border-r-3 border-emerald-400 rounded-br-lg" />

                    {/* Label di bawah kotak scan */}
                    <div className="absolute -bottom-8 left-0 right-0 text-center">
                        <span className="text-emerald-400/70 font-['DM_Sans'] text-xs">
                            Arahkan QR VIP ke area ini
                        </span>
                    </div>
                </div>

                {/* Notifikasi QR terdeteksi */}
                <AnimatePresence>
                    {lastQrResult && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="absolute bottom-20 left-0 right-0 flex justify-center z-30"
                        >
                            <div className="bg-emerald-500/20 backdrop-blur-md border border-emerald-500/40 rounded-2xl px-6 py-3 flex items-center gap-3">
                                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                                <span className="text-emerald-400 font-['DM_Sans'] font-semibold text-sm">
                                    QR VIP Terdeteksi — Memverifikasi...
                                </span>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Overlay saat OCR processing */}
                <AnimatePresence>
                    {ocrProcessing && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/70 backdrop-blur-sm z-40 flex flex-col items-center justify-center"
                        >
                            <motion.div
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ repeat: Infinity, duration: 1.5 }}
                            >
                                <Zap className="w-14 h-14 text-cyan-400 mb-4" />
                            </motion.div>
                            <p className="text-cyan-400 font-['JetBrains_Mono'] text-sm tracking-widest animate-pulse">
                                MEMPROSES PLAT NOMOR...
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
