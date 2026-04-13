import { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, router, Link } from '@inertiajs/react';
import ModalForm from '@/Components/ModalForm';
import Modal from '@/Components/Modal'; // For QR Modal (custom)
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import { QRCodeSVG } from 'qrcode.react';
import { Printer, QrCode, Search, Plus, Edit2, Trash2, User, KeySquare, Bike, Car, Palette } from 'lucide-react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Helper for classes
function cn(...inputs) {
    return twMerge(clsx(inputs));
}

export default function KendaraanIndex({ auth, kendaraans, filters, flash = {} }) {
    const [showModal, setShowModal] = useState(false);
    const [showQrModal, setShowQrModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [selectedKendaraan, setSelectedKendaraan] = useState(null);

    // Main Form (Create/Edit)
    const { data, setData, post, put, delete: destroy, processing, errors, reset, clearErrors } = useForm({
        id_kendaraan: '',
        pemilik: '',
        plat_nomor: '',
        jenis_kendaraan: 'motor',
        warna: '',
    });

    // --- Modal Handling ---
    const openModal = (kendaraan = null) => {
        clearErrors();
        if (kendaraan) {
            setIsEditing(true);
            setData({
                id_kendaraan: kendaraan.id_kendaraan,
                pemilik: kendaraan.pemilik,
                plat_nomor: kendaraan.plat_nomor,
                jenis_kendaraan: kendaraan.jenis_kendaraan,
                warna: kendaraan.warna,
            });
        } else {
            setIsEditing(false);
            reset();
        }
        setShowModal(true);
    };

    const submit = (e) => {
        e.preventDefault();
        if (isEditing) {
            put(route('admin.kendaraans.update', data.id_kendaraan), {
                onSuccess: () => {
                    setShowModal(false);
                    reset();
                }
            });
        } else {
            post(route('admin.kendaraans.store'), {
                onSuccess: () => {
                    setShowModal(false);
                    reset();
                }
            });
        }
    };

    const handleDelete = (kendaraan) => {
        if (confirm(`Yakin ingin menghapus data VIP ${kendaraan.plat_nomor} (${kendaraan.pemilik})?`)) {
            destroy(route('admin.kendaraans.destroy', kendaraan.id_kendaraan));
        }
    };

    // --- QR Modal Handling ---
    const openQrModal = (kendaraan) => {
        setSelectedKendaraan(kendaraan);
        setShowQrModal(true);
    };

    const closeQrModal = () => {
        setShowQrModal(false);
        setTimeout(() => setSelectedKendaraan(null), 300); // Clear after animation
    };

    const printQr = () => {
        if (!selectedKendaraan) return;
        const k = selectedKendaraan;
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>Kartu Akses VIP - ${k.plat_nomor}</title>
                    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;700;900&family=JetBrains+Mono:wght@700&display=swap" rel="stylesheet">
                    <style>
                        * { margin: 0; padding: 0; box-sizing: border-box; }
                        body { font-family: 'Outfit', sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; background: #f1f5f9; }
                        .card {
                            width: 380px; padding: 32px; border-radius: 24px;
                            background: white; border: 3px solid #047857;
                            text-align: center; position: relative; overflow: hidden;
                        }
                        .card::before {
                            content: ''; position: absolute; top: 0; left: 0; right: 0;
                            height: 6px; background: linear-gradient(90deg, #047857, #34d399, #047857);
                        }
                        .hospital-name { font-size: 20px; font-weight: 900; color: #047857; margin-top: 8px; letter-spacing: 2px; }
                        .subtitle { font-size: 10px; color: #64748b; letter-spacing: 3px; text-transform: uppercase; margin-bottom: 16px; }
                        .divider { border: none; border-top: 2px dashed #e2e8f0; margin: 16px 0; }
                        .qr-wrap { display: inline-block; padding: 12px; border: 3px solid #0f172a; border-radius: 16px; background: white; }
                        .plat { font-family: 'JetBrains Mono', monospace; font-size: 28px; font-weight: 700; color: #0f172a; letter-spacing: 3px; margin: 16px 0 4px; }
                        .owner { font-size: 16px; color: #334155; font-weight: 700; }
                        .info-grid { display: flex; justify-content: center; gap: 24px; margin: 12px 0; }
                        .info-item { text-align: center; }
                        .info-label { font-size: 9px; color: #94a3b8; text-transform: uppercase; letter-spacing: 2px; }
                        .info-value { font-size: 13px; font-weight: 700; color: #334155; text-transform: uppercase; }
                        .badge { display: inline-block; padding: 6px 20px; background: #047857; color: white; font-size: 11px; font-weight: 900; border-radius: 100px; letter-spacing: 3px; text-transform: uppercase; margin-top: 12px; }
                        .footer { font-size: 9px; color: #94a3b8; margin-top: 16px; }
                    </style>
                </head>
                <body>
                    <div class="card">
                        <div class="hospital-name">RS HERMINA</div>
                        <div class="subtitle">Kartu Akses Parkir VIP</div>
                        <hr class="divider">
                        <div class="qr-wrap">
                            ${document.getElementById('qr-to-print')?.querySelector('svg')?.outerHTML || ''}
                        </div>
                        <div class="plat">${k.plat_nomor}</div>
                        <div class="owner">${k.pemilik}</div>
                        <div class="info-grid">
                            <div class="info-item">
                                <div class="info-label">Jenis</div>
                                <div class="info-value">${k.jenis_kendaraan}</div>
                            </div>
                            <div class="info-item">
                                <div class="info-label">Warna</div>
                                <div class="info-value">${k.warna}</div>
                            </div>
                        </div>
                        <div class="badge">VIP ★</div>
                        <hr class="divider">
                        <div class="footer">
                            Tunjukkan kartu ini di gate masuk untuk akses cepat.<br>
                            Hermina Smart Parking System &copy; ${new Date().getFullYear()}
                        </div>
                    </div>
                    <script>window.onload = function() { window.print(); }</script>
                </body>
            </html>
        `);
        printWindow.document.close();
    };

    const getIconConfig = (jenis) => {
        if (jenis === 'motor') return { icon: <Bike className="w-6 h-6 text-emerald-600 group-hover:scale-110 transition-transform" />, bg: 'bg-emerald-100/80 border border-emerald-200 shadow-sm', glow: 'bg-emerald-500' };
        if (jenis === 'mobil') return { icon: <Car className="w-6 h-6 text-blue-600 group-hover:scale-110 transition-transform" />, bg: 'bg-blue-100/80 border border-blue-200 shadow-sm', glow: 'bg-blue-500' };
        return { icon: <Car className="w-6 h-6 text-slate-600 group-hover:scale-110 transition-transform" />, bg: 'bg-slate-100/80 border border-slate-200 shadow-sm', glow: 'bg-slate-500' };
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, scale: 0.98, y: 10 },
        show: { opacity: 1, scale: 1, y: 0 }
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-bold text-2xl text-slate-800 leading-tight font-heading">Manajemen VIP (Kendaraan)</h2>}
        >
            <Head title="Data VIP Kendaraan" />

            <div className="min-h-screen bg-slate-50/50 py-8 font-sans">
                <div className="max-w-5xl mx-auto sm:px-6 lg:px-8 space-y-6">

                    {/* Header Section */}
                    <div className="flex flex-col md:flex-row md:justify-between md:items-center p-6 bg-white rounded-[2rem] shadow-sm border border-slate-100">
                        <div>
                            <h2 className="font-bold text-2xl text-slate-800 leading-tight font-heading">Data VIP</h2>
                            <p className="text-sm text-slate-500 mt-1">Kelola data kendaraan dokter dan staf (Free Pass)</p>
                        </div>

                        <div className="flex items-center gap-4 mt-6 md:mt-0">
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Cari plat / nama..."
                                    defaultValue={filters?.search || ''}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            router.get(route('admin.kendaraans.index'), { search: e.target.value }, { preserveState: true, replace: true });
                                        }
                                    }}
                                    className="pl-11 pr-5 py-3 text-sm bg-slate-50 border border-slate-200 rounded-full shadow-inner focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 w-full md:w-72 outline-none transition-all"
                                />
                            </div>
                            <button
                                onClick={() => openModal()}
                                className="bg-slate-900 hover:bg-emerald-600 text-white rounded-full px-6 py-3 text-sm font-bold shadow-lg shadow-slate-200 transition-all flex items-center whitespace-nowrap active:scale-95"
                            >
                                <Plus className="w-5 h-5 mr-2" />
                                Tambah VIP
                            </button>
                        </div>
                    </div>

                    {/* Stacked Data Cards List */}
                    {kendaraans.data && kendaraans.data.length > 0 ? (
                        <motion.div
                            className="flex flex-col gap-4"
                            variants={containerVariants}
                            initial="hidden"
                            animate="show"
                        >
                            {kendaraans.data.map((kendaraan) => {
                                const iconConf = getIconConfig(kendaraan.jenis_kendaraan);

                                return (
                                    <motion.div
                                        key={kendaraan.id_kendaraan}
                                        variants={itemVariants}
                                        className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between relative overflow-hidden group hover:shadow-md hover:border-slate-200 transition-all gap-5"
                                    >
                                        {/* BG Accent Glow */}
                                        <div className={cn(
                                            "absolute -top-16 -left-16 w-32 h-32 rounded-full blur-3xl opacity-0 pointer-events-none transition-opacity duration-500 group-hover:opacity-10",
                                            iconConf.glow
                                        )}></div>

                                        {/* A. Info Utama */}
                                        <div className="flex items-center gap-4 flex-1 min-w-[250px] z-10 w-full md:w-auto">
                                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${iconConf.bg}`}>
                                                {iconConf.icon}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className={`px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-md border text-slate-700 bg-slate-50 border-slate-200`}>
                                                        {kendaraan.jenis_kendaraan}
                                                    </span>
                                                    <span className="flex items-center text-[10px] text-slate-400 capitalize bg-slate-50 px-2 py-0.5 rounded border border-transparent">
                                                        <Palette className="w-3 h-3 mr-1" /> {kendaraan.warna}
                                                    </span>
                                                </div>
                                                <h3 className="text-lg font-bold text-slate-800 leading-tight truncate pr-4">{kendaraan.pemilik}</h3>
                                            </div>
                                        </div>

                                        {/* C. Detail Plat */}
                                        <div className="flex-1 w-full md:w-auto md:max-w-[30%] z-10 px-0 md:px-4 border-t border-slate-100 pt-4 md:border-t-0 md:pt-0">
                                            <div className="flex flex-col justify-center h-full">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Plat Nomor</span>
                                                <div className="flex items-center gap-2">
                                                    <div className="bg-slate-900 text-white font-mono font-bold text-lg px-3 py-1 rounded-lg tracking-[0.1em] shadow-inner border border-slate-700 w-fit">
                                                        {kendaraan.plat_nomor}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* D. Aksi (QR & Edit/Delete) */}
                                        <div className="flex items-center gap-2 flex-none justify-end w-full md:w-auto mt-4 md:mt-0 z-10">
                                            <button
                                                onClick={() => openQrModal(kendaraan)}
                                                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 hover:shadow-lg shadow-emerald-200 md:mr-2 transition-all font-bold text-sm"
                                            >
                                                <QrCode className="w-5 h-5" />
                                                <span className="md:hidden lg:inline">Akses QR</span>
                                            </button>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => openModal(kendaraan)}
                                                    className="w-11 h-11 rounded-xl flex items-center justify-center bg-slate-50 md:bg-transparent text-slate-500 hover:bg-emerald-50 hover:text-emerald-600 hover:shadow-sm md:border md:border-transparent md:hover:border-emerald-100 transition-all border border-slate-100"
                                                    title="Edit VIP"
                                                >
                                                    <Edit2 className="w-[18px] h-[18px]" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(kendaraan)}
                                                    className="w-11 h-11 rounded-xl flex items-center justify-center bg-slate-50 md:bg-transparent text-slate-500 hover:bg-rose-50 hover:text-rose-600 hover:shadow-sm md:border md:border-transparent md:hover:border-rose-100 transition-all border border-slate-100"
                                                    title="Hapus VIP"
                                                >
                                                    <Trash2 className="w-[18px] h-[18px]" />
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </motion.div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white rounded-[2rem] p-12 text-center border border-slate-100 shadow-sm flex flex-col items-center justify-center min-h-[300px]"
                        >
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6 shadow-inner border border-slate-100">
                                <KeySquare className="w-10 h-10 text-slate-300" />
                            </div>
                            <h3 className="text-2xl text-slate-600 font-bold mb-2">Data VIP Kosong</h3>
                            <p className="text-slate-400">Belum ada data kendaraan VIP atau staff yang terdaftar.</p>
                            <button
                                onClick={() => openModal()}
                                className="mt-8 bg-emerald-50 border border-emerald-100 text-emerald-600 hover:bg-emerald-600 hover:text-white px-8 py-3 rounded-full font-bold shadow-sm transition-all focus:ring-4 focus:ring-emerald-100"
                            >
                                <Plus className="w-5 h-5 inline mr-2 -mt-0.5" />
                                Daftarkan VIP Pertama
                            </button>
                        </motion.div>
                    )}

                    {/* PAGINATION */}
                    {kendaraans && kendaraans.total > 10 && (
                        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-8 bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
                            <div className="text-sm text-slate-500 font-medium px-2">
                                Menampilkan <span className="font-bold text-slate-900">{kendaraans.from}</span> - <span className="font-bold text-slate-900">{kendaraans.to}</span> dari <span className="font-bold text-slate-900">{kendaraans.total}</span> data
                            </div>
                            <div className="flex gap-1.5 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                                {kendaraans.links.map((link, key) => (
                                    <Link
                                        key={key}
                                        href={link.url || '#'}
                                        className={cn(
                                            "px-4 py-2 text-sm font-bold rounded-xl transition-all",
                                            link.active
                                                ? "bg-slate-900 text-white shadow-md shadow-slate-200"
                                                : !link.url
                                                    ? "text-slate-300 cursor-not-allowed hidden md:block"
                                                    : "text-slate-600 hover:bg-white hover:text-slate-900 hover:shadow-sm"
                                        )}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <ModalForm
                show={showModal}
                onClose={() => setShowModal(false)}
                title={isEditing ? "Edit VIP" : "Tambah VIP Baru"}
                onSubmit={submit}
                processing={processing}
            >
                <div className="space-y-5">
                    <div>
                        <InputLabel htmlFor="pemilik" value="Nama Pemilik / Dokter" className="font-bold text-slate-700 mb-1" />
                        <TextInput
                            id="pemilik"
                            type="text"
                            className="mt-1 block w-full rounded-xl border-slate-200 focus:border-emerald-500 focus:ring-emerald-500 py-2.5 px-4"
                            value={data.pemilik}
                            onChange={(e) => setData('pemilik', e.target.value)}
                            placeholder="Dr. Budi Santoso"
                            required
                            isFocused
                        />
                        <InputError message={errors.pemilik} className="mt-2" />
                    </div>

                    <div>
                        <InputLabel htmlFor="plat_nomor" value="Nomor Plat Kendaraan" className="font-bold text-slate-700 mb-1" />
                        <TextInput
                            id="plat_nomor"
                            type="text"
                            className="mt-1 block w-full font-mono uppercase rounded-xl border-slate-200 focus:border-emerald-500 focus:ring-emerald-500 py-2.5 px-4 text-lg"
                            value={data.plat_nomor}
                            onChange={(e) => setData('plat_nomor', e.target.value.toUpperCase())}
                            placeholder="B 1234 XYZ"
                            required
                        />
                        <p className="text-xs text-slate-400 mt-2 font-medium flex items-center">
                            <span className="w-1 h-1 bg-slate-400 rounded-full mr-1.5"></span>
                            Hanya huruf dan angka. Simbol dihapus otomatis.
                        </p>
                        <InputError message={errors.plat_nomor} className="mt-2" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <InputLabel htmlFor="jenis_kendaraan" value="Jenis" className="font-bold text-slate-700 mb-1" />
                            <select
                                className="mt-1 block w-full border-slate-200 rounded-xl shadow-sm focus:ring-emerald-500 focus:border-emerald-500 text-sm font-medium text-slate-700 py-2.5 px-4"
                                value={data.jenis_kendaraan}
                                onChange={(e) => setData('jenis_kendaraan', e.target.value)}
                            >
                                <option value="motor">🏍️ Motor</option>
                                <option value="mobil">🚗 Mobil</option>
                            </select>
                        </div>
                        <div>
                            <InputLabel htmlFor="warna" value="Warna" className="font-bold text-slate-700 mb-1" />
                            <TextInput
                                id="warna"
                                type="text"
                                className="mt-1 block w-full rounded-xl border-slate-200 focus:border-emerald-500 focus:ring-emerald-500 py-2.5 px-4"
                                value={data.warna}
                                onChange={(e) => setData('warna', e.target.value)}
                                placeholder="Cth: Hitam Metalik"
                                required
                            />
                        </div>
                    </div>
                </div>
            </ModalForm>

            {/* QR Code Modal (Custom) */}
            <Modal show={showQrModal} onClose={closeQrModal} maxWidth="sm">
                <div className="p-8 text-center bg-white rounded-t-2xl relative" id="qr-to-print">
                    <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-emerald-600 via-emerald-400 to-emerald-600 rounded-t-2xl"></div>
                    <div className="mb-4 text-[10px] font-black text-slate-400 tracking-[0.2em] uppercase mt-2">KARTU AKSES PARKIR VIP</div>

                    <div className="border-4 border-slate-900 p-4 inline-block rounded-[1.5rem] bg-white shadow-xl">
                        {selectedKendaraan && (
                            <QRCodeSVG
                                value={selectedKendaraan.plat_nomor}
                                size={200}
                                level="H"
                            />
                        )}
                    </div>

                    {selectedKendaraan && (
                        <div className="mt-8 bg-slate-50 p-4 rounded-2xl border border-slate-100 shadow-inner">
                            <h2 className="text-4xl font-black font-mono text-slate-900 tracking-wider">
                                {selectedKendaraan.plat_nomor}
                            </h2>
                            <p className="text-lg font-bold text-slate-600 mt-2">{selectedKendaraan.pemilik}</p>
                            <div className="mt-3 inline-block px-4 py-1.5 bg-emerald-600 text-white shadow-md shadow-emerald-200 text-xs font-black rounded-full uppercase tracking-widest">
                                VIP / STAFF AKSES
                            </div>
                        </div>
                    )}
                </div>
                <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-center gap-3 rounded-b-2xl">
                    <button
                        onClick={closeQrModal}
                        className="px-6 py-3 bg-white border border-slate-200 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 font-bold transition-all w-full"
                    >
                        Tutup
                    </button>
                    <button
                        onClick={printQr}
                        className="px-6 py-3 bg-slate-900 text-white rounded-xl hover:bg-emerald-600 font-bold shadow-lg flex items-center justify-center transition-all w-full"
                    >
                        <Printer className="w-5 h-5 mr-2" />
                        Cetak Kartu
                    </button>
                </div>
            </Modal>

        </AuthenticatedLayout>
    );
}
