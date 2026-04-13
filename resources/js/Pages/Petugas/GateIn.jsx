import { useState, useRef, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';
import { Camera, RefreshCw, Printer, QrCode, CheckCircle, Car, Bike, Truck } from 'lucide-react';
import axios from 'axios';
import { ParkingTicket } from '@/Components/Print/ParkingTicket';
import Swal from 'sweetalert2';
import { cn } from '@/lib/utils';
// OCRScanner dihapus — diganti sistem kamera baru di Gate Screen
import QRScanner from '@/Components/GateIn/QRScanner';

export default function GateIn({ auth, areas, flash = {} }) {
    const [activeTab, setActiveTab] = useState('ocr'); // 'ocr' | 'qr'

    // OCR State
    const [imgSrc, setImgSrc] = useState(null);
    const [ocrResult, setOcrResult] = useState('');

    // QR State
    const [qrResult, setQrResult] = useState(null);
    const [isVip, setIsVip] = useState(false);

    // Flag: auto-submit setelah VIP QR terdeteksi & state sudah ter-update
    const [pendingAutoSubmit, setPendingAutoSubmit] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        plat_nomor: '',
        jenis_kendaraan: 'motor',
        id_area: '',
        metode_entry: 'Manual',
    });

    // --- DEPENDENT DROPDOWN: Filter area berdasarkan jenis kendaraan ---
    const filteredAreas = areas.filter(area =>
        area.peruntukan === data.jenis_kendaraan || area.peruntukan === 'semua'
    );

    // Auto-set area pertama yang sesuai saat jenis kendaraan berubah
    useEffect(() => {
        const currentAreaStillValid = filteredAreas.some(a => a.id_area == data.id_area);
        if (!currentAreaStillValid) {
            setData('id_area', filteredAreas.length > 0 ? filteredAreas[0].id_area : '');
        }
    }, [data.jenis_kendaraan]);



    // --- PRINTING LOGIC ---
    const [showPrintModal, setShowPrintModal] = useState(false);
    const [ticketData, setTicketData] = useState(null);
    const componentRef = useRef();

    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        const t = ticketData;
        const masuk = new Date(t.waktu_masuk).toLocaleString('id-ID');
        // Gunakan tarif dari database (dikirim backend), bukan hardcoded
        const tarifPerJam = t.tarif_per_jam
            ? new Intl.NumberFormat('id-ID').format(t.tarif_per_jam)
            : '-';
        const tariffList = `<div>Tarif: Rp ${tarifPerJam} / jam</div>`;

        printWindow.document.write(`
            <html>
                <head>
                    <title>Cetak Karcis Parkir</title>
                    <style>
                        body { font-family: monospace; text-align: center; max-width: 300px; margin: 0 auto; padding: 20px; color: black; }
                        h1 { font-size: 24px; font-weight: bold; margin: 5px 0; text-transform: uppercase; }
                        p { font-size: 10px; margin: 2px 0; }
                        .divider { border-bottom: 2px dashed black; margin: 10px 0; }
                        .plat { font-size: 32px; font-weight: 900; margin: 10px 0; letter-spacing: 2px; }
                        .info { font-size: 10px; text-align: left; margin-top: 10px; }
                        .info div { display: flex; justify-content: space-between; }
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
                    
                    <p>NOMOR PLAT</p>
                    <div class="plat">${t.plat_nomor}</div>
                    
                    <div class="divider"></div>

                    <div class="info">
                        <div><span>JENIS</span> <span style="text-transform: uppercase; font-weight: bold;">${t.jenis_kendaraan || 'KENDARAAN'}</span></div>
                        <div><span>MASUK</span> <span>${masuk}</span></div>
                    </div>

                    <div class="divider"></div>

                    <div class="info" style="text-align: center;">
                        <p style="font-weight: bold; margin-bottom: 5px;">DAFTAR TARIF (${(t.jenis_kendaraan || 'UMUM').toUpperCase()})</p>
                        ${t.is_vip
                ? `<div style="font-size: 14px; font-weight: bold; padding: 10px; border: 2px solid black; margin: 5px 0;">VIP<br>GRATIS PARKIR</div>`
                : tariffList + `<p style="font-style: italic; margin-top: 5px;">*Tarif maks per 24 jam berlaku</p>`
            }
                    </div>

                    <div class="divider"></div>

                    <div class="footer">
                        <p>Simpan tiket ini.</p>
                        <p>Denda tiket hilang Rp 50.000</p>
                        
                        <div class="barcode">
                           <svg id="barcode"></svg>
                        </div>
                        
                        <p>${new Date().toLocaleDateString()}</p>
                    </div>

                    <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
                    <script>
                        JsBarcode("#barcode", "${t.plat_nomor}", {
                            format: "CODE128",
                            width: 2,
                            height: 50,
                            displayValue: true
                        });
                        window.onload = function() { window.print(); window.close(); }
                    </script>
                </body>
            </html>
        `);
        printWindow.document.close();
    };

    useEffect(() => {
        if (flash?.new_ticket) {
            setTicketData(flash.new_ticket);
            setShowPrintModal(true);
        }
    }, [flash]);

    const handleCloseModal = () => {
        setShowPrintModal(false);
        setTicketData(null);
    };

    // --- CHECK VIP VIA QR ---
    // Setelah VIP ditemukan, set form lalu trigger auto-submit
    const checkVip = async (platNomor) => {
        try {
            const response = await axios.post(route('gate.in.check-vip'), { plat_nomor: platNomor });

            if (response.data.status === 'success') {
                const vipData = response.data.data;
                setIsVip(true);

                // Cari area yang cocok dengan jenis kendaraan VIP
                // Prioritaskan area VIP (nama area mengandung 'VIP')
                const matchingAreas = areas.filter(a =>
                    a.peruntukan === vipData.jenis_kendaraan || a.peruntukan === 'semua'
                );
                const vipArea = matchingAreas.find(a =>
                    a.nama_area.toLowerCase().includes('vip')
                );
                const bestArea = vipArea
                    ? vipArea.id_area
                    : (matchingAreas.length > 0 ? matchingAreas[0].id_area : '');

                // Set semua form data sekaligus, termasuk metode_entry dan area
                setData({
                    plat_nomor: vipData.plat_nomor,
                    jenis_kendaraan: vipData.jenis_kendaraan,
                    id_area: bestArea,
                    metode_entry: 'QR',
                });

                // Tampilkan notifikasi VIP
                Swal.fire({
                    title: 'VIP TERDETEKSI',
                    text: `Selamat Datang, ${vipData.pemilik || 'VIP'}! Transaksi sedang diproses...`,
                    icon: 'success',
                    timer: 2000,
                    timerProgressBar: true,
                    showConfirmButton: false,
                    background: '#ecfdf5',
                    color: '#065f46',
                    customClass: {
                        popup: 'rounded-[2rem] shadow-2xl border-2 border-emerald-100'
                    },
                    backdrop: `rgba(0,0,0,0.4)`
                });

                // Trigger auto-submit setelah React state ter-update (via useEffect)
                setPendingAutoSubmit(true);
            }
        } catch (error) {
            console.error(error);
            Swal.fire({
                title: 'Data Tidak Ditemukan',
                text: 'QR Code valid, tapi data VIP tidak ada di sistem.',
                icon: 'warning',
                confirmButtonColor: '#f59e0b',
                confirmButtonText: 'Input Manual',
                customClass: {
                    popup: 'rounded-[2rem] shadow-xl'
                }
            });
            setData('plat_nomor', platNomor);
        }
    };

    // --- SUBMIT LOGIC (dipakai oleh form submit DAN auto-submit) ---
    const doSubmit = (metodeOverride = null) => {
        // Untuk auto-submit (QR), metode_entry sudah di-set di checkVip via setData
        // Untuk manual submit, deteksi metode berdasarkan state saat ini
        if (!metodeOverride) {
            let metode = 'Manual';
            if (ocrResult && data.plat_nomor === ocrResult) metode = 'OCR';
            if (isVip || qrResult) metode = 'QR';
            // Gunakan transform agar metode_entry ikut saat post (menghindari race condition setData)
            data.metode_entry = metode; // mutasi langsung ke internal Inertia form object
        }

        post(route('gate.in.store'), {
            onSuccess: () => {
                reset();
                setImgSrc(null);
                setOcrResult('');
                setQrResult(null);
                setIsVip(false);
                setPendingAutoSubmit(false);
            },
            onError: () => {
                setPendingAutoSubmit(false);
            }
        });
    };

    // --- AUTO-SUBMIT: Trigger setelah setData selesai (state React async) ---
    // Saat pendingAutoSubmit = true DAN plat_nomor sudah terisi, kirim form otomatis
    useEffect(() => {
        if (pendingAutoSubmit && data.plat_nomor && data.id_area && !processing) {
            setPendingAutoSubmit(false);
            doSubmit('QR');
        }
    }, [pendingAutoSubmit, data.plat_nomor, data.id_area]);

    const submit = (e) => {
        e.preventDefault();
        doSubmit();
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex items-center space-x-3">
                    <h2 className="font-bold text-2xl text-gray-800 leading-tight font-heading">Terminal Gate Masuk</h2>
                    <span className="flex h-3 w-3 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                    </span>
                    <span className="text-xs font-mono font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100">
                        SISTEM AI AKTIF
                    </span>
                </div>
            }
        >
            <Head title="Gate Entry" />

            <div className="h-[calc(100vh-6rem)] bg-slate-50 p-6 md:p-8 font-sans overflow-hidden">
                <form onSubmit={submit} className="h-full">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">

                        {/* LEFT PANEL: VISION DECK (Span 7) — hidden saat modal cetak agar kamera mati */}
                        <div className={cn("lg:col-span-7 bg-black rounded-[2.5rem] relative overflow-hidden shadow-2xl ring-4 ring-slate-200 flex flex-col items-center justify-center", showPrintModal && "invisible")}>

                            {/* Mode Switcher Overlay */}
                            <div className="absolute top-6 left-1/2 transform -translate-x-1/2 bg-black/50 backdrop-blur-md rounded-full p-1 border border-white/20 z-50 flex space-x-1">
                                <button
                                    type="button"
                                    onClick={() => { setActiveTab('ocr'); setQrResult(null); setIsVip(false); }}
                                    className={cn(
                                        "px-6 py-2 rounded-full text-xs font-bold transition-all flex items-center",
                                        activeTab === 'ocr' ? "bg-emerald-500 text-white shadow-lg" : "text-gray-400 hover:text-white"
                                    )}
                                >
                                    <Camera className="w-4 h-4 mr-2" />
                                    AI VISION
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setActiveTab('qr'); setImgSrc(null); setOcrResult(''); }}
                                    className={cn(
                                        "px-6 py-2 rounded-full text-xs font-bold transition-all flex items-center",
                                        activeTab === 'qr' ? "bg-emerald-500 text-white shadow-lg" : "text-gray-400 hover:text-white"
                                    )}
                                >
                                    <QrCode className="w-4 h-4 mr-2" />
                                    VIP QR
                                </button>
                            </div>

                            {/* --- SCANNERS --- */}
                            {activeTab === 'ocr' ? (
                                <div className="flex flex-col items-center justify-center h-full text-white/60 p-12 text-center">
                                    <Camera className="w-16 h-16 mb-4 opacity-50" />
                                    <p className="font-['Outfit'] font-bold text-lg">Fitur OCR Tidak Tersedia</p>
                                    <p className="text-sm mt-2 opacity-70">Gunakan Gate Screen baru untuk fitur kamera otomatis.</p>
                                </div>
                            ) : (
                                <QRScanner
                                    active={activeTab === 'qr'}
                                    qrResult={qrResult}
                                    onScanSuccess={(res) => { setQrResult(res); checkVip(res); }}
                                    onNext={() => { setQrResult(null); setIsVip(false); setData('plat_nomor', ''); }}
                                />
                            )}
                        </div>

                        {/* RIGHT PANEL: CONTROL DECK (Span 5) */}
                        <div className="lg:col-span-5 bg-white rounded-[2.5rem] p-6 shadow-xl flex flex-col h-[calc(100vh-9rem)] overflow-y-auto border border-white/50">

                            {/* A. PLAT DISPLAY (Hero Input) */}
                            <div className="mb-4 relative">
                                <label className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2 block ml-2">Nomor Plat Kendaraan</label>
                                <div className={cn(
                                    "relative transition-all duration-500",
                                    ocrResult || isVip ? "shadow-[0_0_40px_rgba(16,185,129,0.3)]" : ""
                                )}>
                                    <input
                                        type="text"
                                        value={data.plat_nomor}
                                        onChange={(e) => setData('plat_nomor', e.target.value.toUpperCase())}
                                        className={cn(
                                            "w-full bg-slate-900 text-white font-mono text-4xl text-center uppercase tracking-widest py-6 rounded-3xl border-4 outline-none transition-all placeholder:text-slate-800",
                                            ocrResult || isVip ? "border-emerald-500" : "border-slate-800 focus:border-slate-600"
                                        )}
                                        placeholder="B 1234"
                                    />
                                    {/* Valid Indicator */}
                                    {(ocrResult || isVip) && (
                                        <div className="absolute top-4 right-4 text-emerald-500 animate-pulse">
                                            <CheckCircle className="w-6 h-6" />
                                        </div>
                                    )}
                                </div>
                                {errors.plat_nomor && <p className="text-red-500 text-sm mt-2 font-bold ml-2">{errors.plat_nomor}</p>}
                            </div>

                            {/* B. VEHICLE SELECTOR (Toggle Cards) — 3 jenis sesuai UKK */}
                            <div className="grid grid-cols-3 gap-3 mb-4">
                                <label className={cn(
                                    "cursor-pointer rounded-3xl p-4 flex flex-col items-center justify-center transition-all border-2",
                                    data.jenis_kendaraan === 'motor'
                                        ? "bg-emerald-600 text-white border-emerald-600 ring-4 ring-emerald-100 shadow-xl"
                                        : "bg-slate-50 text-slate-400 border-slate-100 hover:bg-slate-100"
                                )}>
                                    <input type="radio" name="jenis_kendaraan" value="motor" checked={data.jenis_kendaraan === 'motor'} onChange={() => setData('jenis_kendaraan', 'motor')} className="hidden" />
                                    <Bike className="w-8 h-8 mb-2" />
                                    <span className="font-bold text-sm tracking-wider">MOTOR</span>
                                </label>

                                <label className={cn(
                                    "cursor-pointer rounded-3xl p-4 flex flex-col items-center justify-center transition-all border-2",
                                    data.jenis_kendaraan === 'mobil'
                                        ? "bg-emerald-600 text-white border-emerald-600 ring-4 ring-emerald-100 shadow-xl"
                                        : "bg-slate-50 text-slate-400 border-slate-100 hover:bg-slate-100"
                                )}>
                                    <input type="radio" name="jenis_kendaraan" value="mobil" checked={data.jenis_kendaraan === 'mobil'} onChange={() => setData('jenis_kendaraan', 'mobil')} className="hidden" />
                                    <Car className="w-8 h-8 mb-2" />
                                    <span className="font-bold text-sm tracking-wider">MOBIL</span>
                                </label>

                                <label className={cn(
                                    "cursor-pointer rounded-3xl p-4 flex flex-col items-center justify-center transition-all border-2",
                                    data.jenis_kendaraan === 'lainnya'
                                        ? "bg-emerald-600 text-white border-emerald-600 ring-4 ring-emerald-100 shadow-xl"
                                        : "bg-slate-50 text-slate-400 border-slate-100 hover:bg-slate-100"
                                )}>
                                    <input type="radio" name="jenis_kendaraan" value="lainnya" checked={data.jenis_kendaraan === 'lainnya'} onChange={() => setData('jenis_kendaraan', 'lainnya')} className="hidden" />
                                    <Truck className="w-8 h-8 mb-2" />
                                    <span className="font-bold text-sm tracking-wider">LAINNYA</span>
                                </label>
                            </div>

                            {/* Location — Dependent Dropdown: hanya area yang sesuai jenis kendaraan */}
                            <div className="mb-auto">
                                <label className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2 block ml-2">Area Parkir</label>
                                <select
                                    value={data.id_area}
                                    onChange={(e) => setData('id_area', e.target.value)}
                                    className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 text-slate-700 font-bold focus:ring-2 focus:ring-emerald-500"
                                >
                                    {filteredAreas.length > 0 ? filteredAreas.map(area => (
                                        <option key={area.id_area} value={area.id_area}>
                                            {area.nama_area} (Sisa: {area.sisa_slot})
                                        </option>
                                    )) : (
                                        <option value="" disabled>Tidak ada area untuk jenis ini</option>
                                    )}
                                </select>
                            </div>

                            {/* C. ACTION BUTTON */}
                            <div className="mt-4">
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="w-full bg-slate-900 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-lg font-bold py-5 rounded-[2rem] shadow-xl shadow-slate-200 hover:shadow-emerald-200 transition-all flex items-center justify-center gap-4 group"
                                >
                                    {processing ? (
                                        <RefreshCw className="w-6 h-6 animate-spin" />
                                    ) : (
                                        <>
                                            <Printer className="w-6 h-6 group-hover:scale-110 transition-transform" />
                                            <span>CETAK KARCIS</span>
                                        </>
                                    )}
                                </button>
                            </div>

                        </div>
                    </div>
                </form>
            </div>

            {/* PRINT MODAL — solid bg, tanpa backdrop-blur */}
            {showPrintModal && ticketData && (
                <div className="fixed inset-0 z-[99] bg-slate-900 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2rem] p-8 max-w-4xl w-full shadow-2xl">
                        <div className="flex flex-col md:flex-row gap-8 items-center">

                            <div className="flex-1 text-center md:text-left space-y-6">
                                <div>
                                    <div className="inline-flex items-center justify-center p-4 bg-emerald-100 rounded-full mb-4">
                                        <CheckCircle className="w-12 h-12 text-emerald-600" />
                                    </div>
                                    <h3 className="text-3xl font-black text-slate-800 leading-tight">Tiket<br />Dicetak!</h3>
                                    <p className="text-slate-500 text-lg mt-2">Silakan ambil struk fisik di printer.</p>
                                </div>

                                <div className="flex flex-col gap-3">
                                    <button onClick={handlePrint} className="w-full py-4 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-200 flex items-center justify-center gap-2">
                                        <Printer className="w-5 h-5" />
                                        Print Ulang
                                    </button>
                                    <button onClick={handleCloseModal} className="w-full py-4 rounded-xl font-bold text-slate-500 hover:bg-slate-100 border-2 border-transparent hover:border-slate-200">
                                        Tutup & Lanjut
                                    </button>
                                </div>
                            </div>

                            <div className="flex-none max-h-[60vh] overflow-y-auto custom-scrollbar bg-gray-100 p-4 rounded-xl border-2 border-dashed border-gray-300">
                                <div className="scale-90 origin-top">
                                    <ParkingTicket ref={componentRef} transaction={ticketData} />
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
