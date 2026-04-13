import { useEffect, useRef, useState, forwardRef, useImperativeHandle, useId } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { motion, AnimatePresence } from 'framer-motion';
import { CameraOff, QrCode, ShieldCheck, Loader2 } from 'lucide-react';

/**
 * GateCamera — Komponen kamera reusable untuk semua Gate (Masuk & Keluar).
 *
 * Menggunakan html5-qrcode untuk mendukung Barcode (CODE128) karcis parkir,
 * maupun QR Code (VIP). 
 *
 * Expose method `getVideoElement()` ke parent via ref agar tetap bisa captureFrame.
 *
 * @param {boolean} active - Kamera aktif/mati
 * @param {Function} onQrDetected - Callback saat QR/Barcode terdeteksi
 * @param {Function} onReady - Callback saat kamera sudah siap streaming
 * @param {boolean} showQrOverlay - Tampilkan overlay area scan
 * @param {boolean} qrPaused - Pause scanning sementara
 * @param {string} className - Custom CSS class
 */
const GateCamera = forwardRef(function GateCamera(
    { active = true, onQrDetected, onReady, showQrOverlay = true, qrPaused = false, className = '' },
    ref
) {
    const uniqueId = useId().replace(/:/g, '');
    const containerId = `scanner-${uniqueId}`;

    const scannerRef = useRef(null);
    const qrCooldownRef = useRef(false);

    const [cameraReady, setCameraReady] = useState(false);
    const [cameraError, setCameraError] = useState(false);
    const [lastQrResult, setLastQrResult] = useState(null);

    // =====================================================================
    // Expose getVideoElement ke parent via ref
    // =====================================================================
    useImperativeHandle(ref, () => ({
        getVideoElement: () => document.querySelector(`#${containerId} video`),
    }));

    // Simpan callback ke ref agar interval tidak perlu dibuat ulang jika callback berubah
    const callbacksRef = useRef({ onQrDetected, qrPaused });
    useEffect(() => {
        callbacksRef.current = { onQrDetected, qrPaused };
    }, [onQrDetected, qrPaused]);

    // =====================================================================
    // Inisialisasi Html5Qrcode (kamera + scanner QR/Barcode)
    // =====================================================================
    useEffect(() => {
        let isMounted = true;

        const startCamera = async () => {
            // Beri waktu agar div wrapper tersedia di DOM
            await new Promise(r => setTimeout(r, 100));
            if (!isMounted || !document.getElementById(containerId)) return;

            try {
                setCameraError(false);
                setCameraReady(false);

                if (!scannerRef.current) {
                    scannerRef.current = new Html5Qrcode(containerId);
                }

                // Hentikan jika sedang berjalan (prevent err saat remount cepat)
                try {
                    const state = scannerRef.current.getState();
                    if (state === 2) { // 2 = SCANNING
                        await scannerRef.current.stop();
                    }
                } catch(e) {}

                await scannerRef.current.start(
                    { facingMode: 'environment' },
                    {
                        fps: 10,
                        aspectRatio: 1.333334
                    },
                    (decodedText) => {
                        const { onQrDetected, qrPaused } = callbacksRef.current;
                        if (isMounted) {
                            if (qrPaused || qrCooldownRef.current) return;
                            
                            qrCooldownRef.current = true;
                            setLastQrResult(decodedText);
                            if (onQrDetected) onQrDetected(decodedText);

                            // Jeda antar scan
                            setTimeout(() => {
                                qrCooldownRef.current = false;
                                setLastQrResult(null);
                            }, 3000);
                        }
                    },
                    (errorMessage) => {
                        // Diabaikan: banyak frame gagal mendeteksi
                    }
                );

                if (isMounted) {
                    setCameraReady(true);
                    if (onReady) onReady();
                }

            } catch (err) {
                console.error('Gagal mengakses kamera:', err);
                if (isMounted) setCameraError(true);
            }
        };

        const stopCamera = async () => {
            if (scannerRef.current) {
                try {
                    const state = scannerRef.current.getState();
                    if (state === 2) {
                        await scannerRef.current.stop();
                    }
                    scannerRef.current.clear();
                } catch (err) {
                    console.error('Stop camera failed', err);
                }
            }
            if (isMounted) setCameraReady(false);
        };

        if (active) {
            startCamera();
        } else {
            stopCamera();
        }

        return () => {
            isMounted = false;
            stopCamera();
        };
    }, [active, onReady, containerId]);


    // =====================================================================
    // RENDER: Error state — kamera tidak tersedia
    // =====================================================================
    if (cameraError) {
        return (
            <div className={`w-full h-full flex flex-col items-center justify-center bg-slate-900/80 border border-slate-700/50 rounded-2xl p-6 text-center min-h-[300px] ${className}`}>
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
        <div className={`relative w-full h-full min-h-[300px] rounded-2xl overflow-hidden bg-black ${className}`}>
            {/* Div target render kamera oleh html5-qrcode */}
            <div 
                id={containerId} 
                className="absolute inset-0 [&_video]:object-cover [&_video]:w-full [&_video]:h-full"
            />

            {/* Loading state saat kamera belum siap */}
            {!cameraReady && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/90 z-10">
                    <Loader2 className="w-10 h-10 text-cyan-400 animate-spin mb-3" />
                    <span className="text-slate-400 font-['DM_Sans'] text-sm">Memuat kamera...</span>
                </div>
            )}

            {/* Overlay UI di atas video */}
            <div className="absolute inset-0 pointer-events-none z-20">
                {/* Badge LIVE — pojok kiri atas */}
                {cameraReady && (
                    <div className="absolute top-3 left-3 flex items-center gap-2 z-20">
                        <div className="flex items-center gap-2 bg-black/50 rounded-full px-3 py-1.5">
                            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                            <span className="text-white font-['JetBrains_Mono'] text-xs tracking-wider">
                                LIVE
                            </span>
                        </div>
                    </div>
                )}

                {/* Badge QR Scanning aktif — pojok kanan atas */}
                {showQrOverlay && cameraReady && (
                    <div className="absolute top-3 right-3 z-20">
                        <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 rounded-full px-3 py-1.5">
                            <QrCode className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400 font-['DM_Sans'] text-xs">
                                QR / Barcode Otomatis
                            </span>
                        </div>
                    </div>
                )}

                {/* Area scan QR — kotak tengah dengan corner markers */}
                {showQrOverlay && cameraReady && (
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[220px] h-[220px]">
                        {/* Scanning line animasi */}
                        <div className="w-full h-0.5 bg-emerald-500/60 shadow-[0_0_15px_rgba(16,185,129,0.5)] animate-scan-y absolute top-0 z-10" />

                        {/* Corner markers */}
                        <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-emerald-400 rounded-tl-lg" />
                        <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-emerald-400 rounded-tr-lg" />
                        <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-emerald-400 rounded-bl-lg" />
                        <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-emerald-400 rounded-br-lg" />

                        {/* Label area scan */}
                        <div className="absolute -bottom-7 left-0 right-0 text-center text-emerald-400/70 font-['DM_Sans'] text-xs whitespace-nowrap">
                            Arahkan Barcode atau QR ke area ini
                        </div>
                    </div>
                )}

                {/* Notifikasi Terdeteksi */}
                <AnimatePresence>
                    {lastQrResult && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="absolute bottom-16 left-0 right-0 flex justify-center z-30"
                        >
                            <div className="bg-emerald-500/20 border border-emerald-500/40 rounded-2xl px-6 py-3 flex items-center gap-3 shadow-xl backdrop-blur-md">
                                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                                <span className="text-emerald-400 font-['DM_Sans'] font-semibold text-sm">
                                    Berhasil dipindai — Memverifikasi...
                                </span>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
});

export default GateCamera;
