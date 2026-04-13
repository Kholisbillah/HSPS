import { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, Link } from '@inertiajs/react';
import ModalForm from '@/Components/ModalForm';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import {
    Search, Plus, Edit2, Trash2, Bike, Car, Truck,
    AlertTriangle, ShieldAlert, TicketX, Info, CircleDollarSign,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Utility: merge Tailwind classes
function cn(...inputs) {
    return twMerge(clsx(inputs));
}

export default function DendaIndex({ auth, dendas }) {
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

    // Form Handling — menggunakan Inertia useForm hook
    const { data, setData, post, put, delete: destroy, processing, errors, reset, clearErrors } = useForm({
        id_tarif: '',
        jenis_kendaraan: 'motor',
        tarif_per_jam: '',
    });

    // Buka modal (tambah baru atau edit)
    const openModal = (denda = null) => {
        clearErrors();
        if (denda) {
            // Mode edit: isi form dengan data yang sudah ada
            setIsEditing(true);
            setData({
                id_tarif: denda.id_tarif,
                jenis_kendaraan: denda.jenis_kendaraan,
                tarif_per_jam: denda.tarif_per_jam,
            });
        } else {
            // Mode tambah baru: reset form
            setIsEditing(false);
            reset();
        }
        setShowModal(true);
    };

    // Submit form (create atau update)
    const submit = (e) => {
        e.preventDefault();
        if (isEditing) {
            // Update: PUT ke route admin.dendas.update
            put(route('admin.dendas.update', data.id_tarif), {
                onSuccess: () => {
                    setShowModal(false);
                    reset();
                }
            });
        } else {
            // Create: POST ke route admin.dendas.store
            post(route('admin.dendas.store'), {
                onSuccess: () => {
                    setShowModal(false);
                    reset();
                }
            });
        }
    };

    // Konfirmasi & hapus denda
    const handleDelete = (denda) => {
        destroy(route('admin.dendas.destroy', denda.id_tarif), {
            onSuccess: () => setShowDeleteConfirm(null),
        });
    };

    // Format angka ke Rupiah
    const formatRupiah = (number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(number);
    };

    // Konfigurasi icon per jenis kendaraan
    const getIconConfig = (jenis) => {
        if (jenis === 'motor') return {
            icon: <Bike className="w-6 h-6 text-rose-600 group-hover:scale-110 transition-transform" />,
            bg: 'bg-rose-100/80 border border-rose-200 shadow-sm shadow-rose-100/50',
            glow: 'bg-rose-500',
            label: 'Motor',
            emoji: '🏍️',
        };
        if (jenis === 'mobil') return {
            icon: <Car className="w-6 h-6 text-amber-600 group-hover:scale-110 transition-transform" />,
            bg: 'bg-amber-100/80 border border-amber-200 shadow-sm shadow-amber-100/50',
            glow: 'bg-amber-500',
            label: 'Mobil',
            emoji: '🚗',
        };
        return {
            icon: <Truck className="w-6 h-6 text-orange-600 group-hover:scale-110 transition-transform" />,
            bg: 'bg-orange-100/80 border border-orange-200 shadow-sm shadow-orange-100/50',
            glow: 'bg-orange-500',
            label: 'Lainnya',
            emoji: '📦',
        };
    };

    // Cek jenis kendaraan yang sudah memiliki denda (untuk disable di dropdown)
    const existingTypes = dendas?.data?.map(d => d.jenis_kendaraan) || [];

    // Animasi container & item
    const containerVariants = {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.1 } },
    };

    const itemVariants = {
        hidden: { opacity: 0, scale: 0.98, y: 10 },
        show: { opacity: 1, scale: 1, y: 0 },
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-bold text-2xl text-slate-800 leading-tight font-heading">Denda Tiket Hilang</h2>}
        >
            <Head title="Denda Tiket Hilang" />

            <div className="min-h-screen bg-slate-50/50 py-8 font-sans">
                <div className="max-w-5xl mx-auto sm:px-6 lg:px-8 space-y-6">

                    {/* Header Section */}
                    <div className="flex flex-col md:flex-row md:justify-between md:items-center p-6 bg-white rounded-[2rem] shadow-sm border border-slate-100">
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center">
                                    <TicketX className="w-5 h-5 text-rose-600" />
                                </div>
                                <h2 className="font-bold text-2xl text-slate-800 leading-tight font-heading">
                                    Denda Tiket Hilang
                                </h2>
                            </div>
                            <p className="text-sm text-slate-500 mt-2 ml-[52px]">
                                Kelola biaya denda flat yang dikenakan saat pengunjung kehilangan karcis parkir
                            </p>
                        </div>

                        <div className="flex items-center gap-4 mt-6 md:mt-0">
                            <button
                                onClick={() => openModal()}
                                className="bg-slate-900 hover:bg-rose-600 text-white rounded-full px-6 py-3 text-sm font-bold shadow-lg shadow-slate-200 transition-all flex items-center whitespace-nowrap active:scale-95"
                            >
                                <Plus className="w-5 h-5 mr-2" />
                                Tambah Denda
                            </button>
                        </div>
                    </div>

                    {/* Info Banner — Penjelasan bagaimana denda bekerja */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-4"
                    >
                        <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                            <Info className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                            <h4 className="font-bold text-sm text-amber-800 mb-1">Cara Kerja Denda</h4>
                            <p className="text-sm text-amber-700 leading-relaxed">
                                Denda tiket hilang adalah biaya <strong>flat (tetap)</strong> yang ditambahkan di atas biaya parkir normal.
                                Contoh: jika biaya parkir normal <span className="font-mono font-bold">Rp 5.000</span> dan denda <span className="font-mono font-bold">Rp 20.000</span>,
                                maka total yang harus dibayar = <span className="font-mono font-bold">Rp 25.000</span>.
                            </p>
                        </div>
                    </motion.div>

                    {/* Denda Cards */}
                    {dendas.data && dendas.data.length > 0 ? (
                        <motion.div
                            className="flex flex-col gap-4"
                            variants={containerVariants}
                            initial="hidden"
                            animate="show"
                        >
                            {dendas.data.map((denda) => {
                                const iconConf = getIconConfig(denda.jenis_kendaraan);

                                return (
                                    <motion.div
                                        key={denda.id_tarif}
                                        variants={itemVariants}
                                        className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between relative overflow-hidden group hover:shadow-md hover:border-slate-200 transition-all gap-5"
                                    >
                                        {/* BG Accent Glow (muncul saat hover) */}
                                        <div className={cn(
                                            "absolute -top-16 -left-16 w-32 h-32 rounded-full blur-3xl opacity-0 pointer-events-none transition-opacity duration-500 group-hover:opacity-10",
                                            iconConf.glow
                                        )}></div>

                                        {/* A. Info Jenis Kendaraan */}
                                        <div className="flex items-center gap-4 flex-1 min-w-[250px] z-10 w-full md:w-auto">
                                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${iconConf.bg}`}>
                                                {iconConf.icon}
                                            </div>
                                            <div className="flex-1">
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">
                                                    Jenis Kendaraan
                                                </span>
                                                <h3 className="text-xl font-bold text-slate-800 leading-tight truncate capitalize pr-4">
                                                    {denda.jenis_kendaraan}
                                                </h3>
                                            </div>
                                        </div>

                                        {/* B. Badge Tipe */}
                                        <div className="flex-shrink-0 z-10">
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-rose-100 text-rose-700 border border-rose-200">
                                                <ShieldAlert className="w-3.5 h-3.5" />
                                                DENDA FLAT
                                            </span>
                                        </div>

                                        {/* C. Biaya Denda */}
                                        <div className="flex-1 w-full md:w-auto z-10 px-0 md:px-4 flex items-center justify-start md:justify-end border-t md:border-transparent border-slate-100 pt-4 md:pt-0 mt-2 md:mt-0">
                                            <div className="text-left md:text-right">
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                                                    Biaya Denda
                                                </span>
                                                <span className="text-2xl font-bold font-mono text-rose-600 block leading-none">
                                                    {formatRupiah(denda.tarif_per_jam)}
                                                </span>
                                                <span className="text-xs text-slate-400 mt-1 block">per kejadian</span>
                                            </div>
                                        </div>

                                        {/* D. Tombol Aksi */}
                                        <div className="flex items-center gap-2 flex-none justify-end w-full md:w-auto z-10">
                                            <button
                                                onClick={() => openModal(denda)}
                                                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 md:p-3 rounded-xl md:rounded-full bg-slate-50 md:bg-transparent text-slate-500 hover:bg-emerald-50 hover:text-emerald-600 hover:shadow-sm md:hover:border-emerald-100 md:border md:border-transparent transition-all"
                                                title="Edit Denda"
                                            >
                                                <Edit2 className="w-[18px] h-[18px]" />
                                                <span className="text-sm font-bold md:hidden">Edit</span>
                                            </button>
                                            <button
                                                onClick={() => setShowDeleteConfirm(denda)}
                                                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 md:p-3 rounded-xl md:rounded-full bg-slate-50 md:bg-transparent text-slate-500 hover:bg-rose-50 hover:text-rose-600 hover:shadow-sm md:hover:border-rose-100 md:border md:border-transparent transition-all"
                                                title="Hapus Denda"
                                            >
                                                <Trash2 className="w-[18px] h-[18px]" />
                                                <span className="text-sm font-bold md:hidden">Hapus</span>
                                            </button>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </motion.div>
                    ) : (
                        /* Empty State — Belum ada denda */
                        <motion.div
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white rounded-[2rem] p-12 text-center border border-slate-100 shadow-sm flex flex-col items-center justify-center min-h-[300px]"
                        >
                            <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mb-6 shadow-inner border border-rose-100">
                                <TicketX className="w-10 h-10 text-rose-300" />
                            </div>
                            <h3 className="text-2xl text-slate-600 font-bold mb-2">Belum Ada Tarif Denda</h3>
                            <p className="text-slate-400 max-w-md">
                                Tambahkan tarif denda tiket hilang agar sistem bisa mengenakan biaya tambahan
                                saat pengunjung kehilangan karcis parkir.
                            </p>
                            <button
                                onClick={() => openModal()}
                                className="mt-8 bg-rose-50 border border-rose-100 text-rose-600 hover:bg-rose-600 hover:text-white px-8 py-3 rounded-full font-bold shadow-sm transition-all focus:ring-4 focus:ring-rose-100"
                            >
                                <Plus className="w-5 h-5 inline mr-2 -mt-0.5" />
                                Tambah Denda Pertama
                            </button>
                        </motion.div>
                    )}

                    {/* PAGINATION */}
                    {dendas && dendas.total > 10 && (
                        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-8 bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
                            <div className="text-sm text-slate-500 font-medium px-2">
                                Menampilkan <span className="font-bold text-slate-900">{dendas.from}</span> - <span className="font-bold text-slate-900">{dendas.to}</span> dari <span className="font-bold text-slate-900">{dendas.total}</span> data
                            </div>
                            <div className="flex gap-1.5 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                                {dendas.links.map((link, key) => (
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

            {/* ============================================================= */}
            {/* MODAL FORM: Tambah / Edit Denda */}
            {/* ============================================================= */}
            <ModalForm
                show={showModal}
                onClose={() => setShowModal(false)}
                title={isEditing ? "Edit Denda Tiket Hilang" : "Tambah Denda Baru"}
                onSubmit={submit}
                processing={processing}
            >
                <div className="space-y-5">
                    {/* Jenis Kendaraan */}
                    <div>
                        <InputLabel htmlFor="jenis_kendaraan" value="Jenis Kendaraan" className="font-bold text-slate-700 mb-1" />
                        <select
                            id="jenis_kendaraan"
                            className="mt-1 block w-full border-slate-200 rounded-xl shadow-sm focus:ring-rose-500 focus:border-rose-500 text-sm font-medium text-slate-700 py-2.5 px-4"
                            value={data.jenis_kendaraan}
                            onChange={(e) => setData('jenis_kendaraan', e.target.value)}
                            disabled={isEditing}
                        >
                            <option value="motor" disabled={!isEditing && existingTypes.includes('motor')}>
                                🏍️ Motor {!isEditing && existingTypes.includes('motor') ? '(sudah ada)' : ''}
                            </option>
                            <option value="mobil" disabled={!isEditing && existingTypes.includes('mobil')}>
                                🚗 Mobil {!isEditing && existingTypes.includes('mobil') ? '(sudah ada)' : ''}
                            </option>
                            <option value="lainnya" disabled={!isEditing && existingTypes.includes('lainnya')}>
                                📦 Lainnya {!isEditing && existingTypes.includes('lainnya') ? '(sudah ada)' : ''}
                            </option>
                        </select>
                        {isEditing && (
                            <p className="text-xs text-slate-400 mt-2 flex items-center">
                                <span className="w-1 h-1 bg-slate-400 rounded-full mr-1.5"></span>
                                Jenis kendaraan tidak dapat diubah setelah dibuat.
                            </p>
                        )}
                        <InputError message={errors.jenis_kendaraan} className="mt-2" />
                    </div>

                    {/* Biaya Denda */}
                    <div>
                        <InputLabel htmlFor="tarif_per_jam" value="Biaya Denda Tiket Hilang (Rp)" className="font-bold text-slate-700 mb-1" />
                        <div className="relative mt-1">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                                <span className="text-slate-500 font-bold text-sm">Rp</span>
                            </div>
                            <TextInput
                                id="tarif_per_jam"
                                type="number"
                                className="block w-full pl-11 rounded-xl border-slate-200 focus:border-rose-500 focus:ring-rose-500 py-2.5 pr-4 font-mono font-bold text-lg"
                                value={data.tarif_per_jam}
                                onChange={(e) => setData('tarif_per_jam', e.target.value)}
                                required
                                min="1000"
                                step="1000"
                                placeholder="cth: 20000"
                            />
                        </div>
                        <p className="text-xs text-slate-400 mt-1.5">
                            Biaya flat yang dikenakan saat pengunjung kehilangan karcis (ditambahkan ke biaya parkir normal)
                        </p>
                        <InputError message={errors.tarif_per_jam} className="mt-2" />
                    </div>

                    {/* Preview Simulasi */}
                    {data.tarif_per_jam && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="bg-rose-50 rounded-xl p-4 border border-rose-100"
                        >
                            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 block mb-3">
                                Simulasi Perhitungan
                            </span>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-500">Biaya parkir normal (contoh)</span>
                                    <span className="font-mono font-bold text-slate-600">Rp 5.000</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-rose-600 font-medium flex items-center gap-1.5">
                                        <AlertTriangle className="w-3.5 h-3.5" />
                                        Denda tiket hilang
                                    </span>
                                    <span className="font-mono font-bold text-rose-600">
                                        +{formatRupiah(Number(data.tarif_per_jam))}
                                    </span>
                                </div>
                                <div className="border-t border-rose-200 pt-2 mt-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="font-bold text-slate-700">Total Bayar</span>
                                        <span className="font-mono font-bold text-lg text-slate-900">
                                            {formatRupiah(5000 + Number(data.tarif_per_jam))}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </div>
            </ModalForm>

            {/* ============================================================= */}
            {/* MODAL KONFIRMASI HAPUS */}
            {/* ============================================================= */}
            <AnimatePresence>
                {showDeleteConfirm && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center">
                        {/* Overlay gelap */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                            onClick={() => setShowDeleteConfirm(null)}
                        />

                        {/* Dialog */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            transition={{ duration: 0.2 }}
                            className="relative bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-slate-100"
                        >
                            <div className="flex items-start gap-4 mb-6">
                                <div className="w-12 h-12 rounded-xl bg-rose-100 flex items-center justify-center flex-shrink-0">
                                    <AlertTriangle className="w-6 h-6 text-rose-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900">Hapus Denda?</h3>
                                    <p className="text-sm text-slate-500 mt-1">
                                        Apakah Anda yakin ingin menghapus denda tiket hilang untuk{' '}
                                        <strong className="text-slate-700 capitalize">{showDeleteConfirm.jenis_kendaraan}</strong>
                                        {' '}sebesar{' '}
                                        <strong className="font-mono text-rose-600">{formatRupiah(showDeleteConfirm.tarif_per_jam)}</strong>?
                                    </p>
                                    <p className="text-xs text-amber-600 mt-2 flex items-center gap-1.5 bg-amber-50 px-3 py-1.5 rounded-lg">
                                        <AlertTriangle className="w-3.5 h-3.5" />
                                        Sistem tidak akan bisa mengenakan denda untuk jenis kendaraan ini
                                    </p>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setShowDeleteConfirm(null)}
                                    className="px-4 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all"
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={() => handleDelete(showDeleteConfirm)}
                                    disabled={processing}
                                    className="px-4 py-2.5 text-sm font-bold text-white bg-rose-600 rounded-xl hover:bg-rose-700 shadow-lg shadow-rose-200 transition-all disabled:opacity-50 flex items-center gap-2"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    {processing ? 'Menghapus...' : 'Ya, Hapus'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </AuthenticatedLayout>
    );
}
