import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from "html5-qrcode";
import { CheckCircle, CameraOff } from 'lucide-react';

export default function QRScanner({ active, onScanSuccess, qrResult, onNext }) {
    const scannerRef = useRef(null);
    const [cameraError, setCameraError] = useState(false);

    useEffect(() => {
        let isMounted = true;
        const scannerId = "reader";

        const startScanner = async () => {
            await new Promise(r => setTimeout(r, 100)); // allow DOM refresh
            if (!isMounted) return;
            if (!document.getElementById(scannerId)) return;

            try {
                if (!scannerRef.current) {
                    scannerRef.current = new Html5Qrcode(scannerId);
                }

                try {
                    const state = scannerRef.current.getState();
                    if (state === 1 || state === 2) {
                        await scannerRef.current.stop();
                    }
                } catch (e) { }

                await scannerRef.current.start(
                    { facingMode: "environment" },
                    { fps: 10, qrbox: { width: 400, height: 400 }, aspectRatio: 1 },
                    (decodedText) => {
                        if (isMounted) {
                            onScanSuccess(decodedText);
                            if (scannerRef.current) {
                                scannerRef.current.stop()
                                    .then(() => scannerRef.current.clear())
                                    .catch(err => console.warn(err));
                            }
                        }
                    },
                    (err) => { }
                ).catch(err => {
                    if (isMounted) {
                        console.error("Camera fail for QR:", err);
                        setCameraError(true);
                    }
                });
            } catch (err) {
                if (isMounted) {
                    console.error("QR Start Error:", err);
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
                    try { scannerRef.current.clear(); } catch (e) { }
                } catch (err) { }
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
    }, [active, onScanSuccess]);

    if (cameraError) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 border border-slate-700/50 rounded-3xl p-6 text-center">
                <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-4">
                    <CameraOff className="w-10 h-10 text-slate-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Kamera Tidak Tersedia</h3>
                <p className="text-slate-400 text-sm max-w-sm">
                    Izin akses kamera ditolak atau perangkat kamera tidak ditemukan. Pastikan Anda mengizinkan akses kamera pada browser.
                </p>
            </div>
        );
    }

    return (
        <div className="w-full h-full bg-black flex flex-col items-center justify-center relative">
            {!qrResult ? (
                <div id="reader" className="w-full h-full opacity-80 [&_video]:object-cover [&_video]:w-full [&_video]:h-full [&_video]:scale-x-[-1]"></div>
            ) : (
                <div className="text-center z-10 w-full p-8 bg-black/80 backdrop-blur-md rounded-2xl mx-4">
                    <CheckCircle className="w-24 h-24 text-emerald-500 mx-auto mb-4 animate-bounce" />
                    <h3 className="text-2xl font-bold text-white">QR VERIFIED</h3>
                    <p className="text-emerald-400 mt-2 font-mono">{qrResult}</p>
                    <button type="button" onClick={onNext} className="mt-8 px-6 py-2 bg-emerald-600 rounded-full text-white font-bold hover:bg-emerald-500 transition-colors">
                        SCAN NEXT
                    </button>
                </div>
            )}
        </div>
    );
}
