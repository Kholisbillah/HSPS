import { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, Link } from '@inertiajs/react';
import ModalForm from '@/Components/ModalForm';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import { Search, Plus, Edit2, Trash2, Bike, Car, Truck } from 'lucide-react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Helper for classes
function cn(...inputs) {
    return twMerge(clsx(inputs));
}

export default function TarifIndex({ auth, tarifs }) {
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    // Form Handling
    const { data, setData, post, put, delete: destroy, processing, errors, reset, clearErrors } = useForm({
        id_tarif: '',
        jenis_kendaraan: 'motor',
        tarif_per_jam: '',
        tarif_jam_selanjutnya: '',
    });

    const openModal = (tarif = null) => {
        clearErrors();
        if (tarif) {
            setIsEditing(true);
            setData({
                id_tarif: tarif.id_tarif,
                jenis_kendaraan: tarif.jenis_kendaraan,
                tarif_per_jam: tarif.tarif_per_jam,
                tarif_jam_selanjutnya: tarif.tarif_jam_selanjutnya || '',
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
            put(route('admin.tarifs.update', data.id_tarif), {
                onSuccess: () => {
                    setShowModal(false);
                    reset();
                }
            });
        } else {
            post(route('admin.tarifs.store'), {
                onSuccess: () => {
                    setShowModal(false);
                    reset();
                }
            });
        }
    };

    const handleDelete = (tarif) => {
        if (confirm(`Yakin ingin menghapus tarif ${tarif.jenis_kendaraan}?`)) {
            destroy(route('admin.tarifs.destroy', tarif.id_tarif));
        }
    };

    const formatRupiah = (number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(number);
    };

    const getIconConfig = (jenis) => {
        if (jenis === 'motor') return { icon: <Bike className="w-6 h-6 text-emerald-600 group-hover:scale-110 transition-transform" />, bg: 'bg-emerald-100/80 border border-emerald-200 shadow-sm shadow-emerald-100/50', glow: 'bg-emerald-500' };
        if (jenis === 'mobil') return { icon: <Car className="w-6 h-6 text-blue-600 group-hover:scale-110 transition-transform" />, bg: 'bg-blue-100/80 border border-blue-200 shadow-sm shadow-blue-100/50', glow: 'bg-blue-500' };
        return { icon: <Truck className="w-6 h-6 text-orange-600 group-hover:scale-110 transition-transform" />, bg: 'bg-orange-100/80 border border-orange-200 shadow-sm shadow-orange-100/50', glow: 'bg-orange-500' };
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
            header={<h2 className="font-bold text-2xl text-slate-800 leading-tight font-heading">Manajemen Tarif</h2>}
        >
            <Head title="Data Tarif" />

            <div className="min-h-screen bg-slate-50/50 py-8 font-sans">
                <div className="max-w-5xl mx-auto sm:px-6 lg:px-8 space-y-6">

                    {/* Header Section */}
                    <div className="flex flex-col md:flex-row md:justify-between md:items-center p-6 bg-white rounded-[2rem] shadow-sm border border-slate-100">
                        <div>
                            <h2 className="font-bold text-2xl text-slate-800 leading-tight font-heading">Data Tarif Parkir</h2>
                            <p className="text-sm text-slate-500 mt-1">Kelola harga parkir per jam untuk setiap jenis kendaraan</p>
                        </div>

                        <div className="flex items-center gap-4 mt-6 md:mt-0">
                            {/* Dummy search to keep layout consistent but it is non-functional right now just like before */}
                            <div className="relative hidden md:block opacity-50 cursor-not-allowed">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Cari tarif..."
                                    disabled
                                    className="pl-11 pr-5 py-3 text-sm bg-slate-50 border border-slate-200 rounded-full shadow-inner w-full md:w-72 outline-none cursor-not-allowed"
                                />
                            </div>
                            <button
                                onClick={() => openModal()}
                                className="bg-slate-900 hover:bg-emerald-600 text-white rounded-full px-6 py-3 text-sm font-bold shadow-lg shadow-slate-200 transition-all flex items-center whitespace-nowrap active:scale-95"
                            >
                                <Plus className="w-5 h-5 mr-2" />
                                Tambah Tarif
                            </button>
                        </div>
                    </div>

                    {/* Stacked Data Cards List */}
                    {tarifs.data && tarifs.data.length > 0 ? (
                        <motion.div
                            className="flex flex-col gap-4"
                            variants={containerVariants}
                            initial="hidden"
                            animate="show"
                        >
                            {tarifs.data.map((tarif) => {
                                const iconConf = getIconConfig(tarif.jenis_kendaraan);

                                return (
                                    <motion.div
                                        key={tarif.id_tarif}
                                        variants={itemVariants}
                                        className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between relative overflow-hidden group hover:shadow-md hover:border-slate-200 transition-all gap-5"
                                    >
                                        {/* BG Accent Glow */}
                                        <div className={cn(
                                            "absolute -top-16 -left-16 w-32 h-32 rounded-full blur-3xl opacity-0 pointer-events-none transition-opacity duration-500 group-hover:opacity-10",
                                            iconConf.glow
                                        )}></div>

                                        {/* A. Info Utama */}
                                        <div className="flex items-center gap-4 flex-1 min-w-[300px] z-10 w-full md:w-auto">
                                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${iconConf.bg}`}>
                                                {iconConf.icon}
                                            </div>
                                            <div className="flex-1">
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">
                                                    Jenis Kendaraan
                                                </span>
                                                <h3 className="text-xl font-bold text-slate-800 leading-tight truncate capitalize pr-4">{tarif.jenis_kendaraan}</h3>
                                            </div>
                                        </div>

                                        {/* C. Tarif / Harga — Jam Pertama & Selanjutnya */}
                                        <div className="flex-1 w-full md:w-auto z-10 px-0 md:px-4 flex items-center justify-start md:justify-end border-t md:border-transparent border-slate-100 pt-4 md:pt-0 mt-2 md:mt-0 gap-6">
                                            <div className="text-left md:text-right">
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Jam Pertama</span>
                                                <span className="text-2xl font-bold font-mono text-emerald-600 block leading-none">
                                                    {formatRupiah(tarif.tarif_per_jam)}
                                                </span>
                                            </div>
                                            <div className="text-left md:text-right">
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Jam Selanjutnya</span>
                                                <span className="text-2xl font-bold font-mono text-blue-600 block leading-none">
                                                    +{formatRupiah(tarif.tarif_jam_selanjutnya || 0)}
                                                </span>
                                            </div>
                                        </div>

                                        {/* D. Aksi */}
                                        <div className="flex items-center gap-2 flex-none justify-end w-full md:w-auto z-10">
                                            <button
                                                onClick={() => openModal(tarif)}
                                                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 md:p-3 rounded-xl md:rounded-full bg-slate-50 md:bg-transparent text-slate-500 hover:bg-emerald-50 hover:text-emerald-600 hover:shadow-sm md:hover:border-emerald-100 md:border md:border-transparent transition-all"
                                                title="Edit Tarif"
                                            >
                                                <Edit2 className="w-[18px] h-[18px]" />
                                                <span className="text-sm font-bold md:hidden">Edit</span>
                                            </button>
                                            <button
                                                onClick={() => handleDelete(tarif)}
                                                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 md:p-3 rounded-xl md:rounded-full bg-slate-50 md:bg-transparent text-slate-500 hover:bg-rose-50 hover:text-rose-600 hover:shadow-sm md:hover:border-rose-100 md:border md:border-transparent transition-all"
                                                title="Hapus Tarif"
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
                        <motion.div
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white rounded-[2rem] p-12 text-center border border-slate-100 shadow-sm flex flex-col items-center justify-center min-h-[300px]"
                        >
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6 shadow-inner border border-slate-100">
                                <Search className="w-10 h-10 text-slate-300" />
                            </div>
                            <h3 className="text-2xl text-slate-600 font-bold mb-2">Data Tarif Kosong</h3>
                            <p className="text-slate-400">Belum ada data tarif yang ditambahkan.</p>
                            <button
                                onClick={() => openModal()}
                                className="mt-8 bg-emerald-50 border border-emerald-100 text-emerald-600 hover:bg-emerald-600 hover:text-white px-8 py-3 rounded-full font-bold shadow-sm transition-all focus:ring-4 focus:ring-emerald-100"
                            >
                                <Plus className="w-5 h-5 inline mr-2 -mt-0.5" />
                                Tambah Tarif Pertama
                            </button>
                        </motion.div>
                    )}

                    {/* PAGINATION */}
                    {tarifs && tarifs.total > 10 && (
                        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-8 bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
                            <div className="text-sm text-slate-500 font-medium px-2">
                                Menampilkan <span className="font-bold text-slate-900">{tarifs.from}</span> - <span className="font-bold text-slate-900">{tarifs.to}</span> dari <span className="font-bold text-slate-900">{tarifs.total}</span> data
                            </div>
                            <div className="flex gap-1.5 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                                {tarifs.links.map((link, key) => (
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
                title={isEditing ? "Edit Tarif" : "Tambah Tarif Baru"}
                onSubmit={submit}
                processing={processing}
            >
                <div className="space-y-5">
                    <div>
                        <InputLabel htmlFor="jenis_kendaraan" value="Jenis Kendaraan" className="font-bold text-slate-700 mb-1" />
                        <select
                            id="jenis_kendaraan"
                            className="mt-1 block w-full border-slate-200 rounded-xl shadow-sm focus:ring-emerald-500 focus:border-emerald-500 text-sm font-medium text-slate-700 py-2.5 px-4"
                            value={data.jenis_kendaraan}
                            onChange={(e) => setData('jenis_kendaraan', e.target.value)}
                            disabled={isEditing}
                        >
                            <option value="motor">🏍️ Motor</option>
                            <option value="mobil">🚗 Mobil</option>
                            <option value="lainnya">📦 Lainnya (Ambulans/Box/Truck)</option>
                        </select>
                        {isEditing && <p className="text-xs text-slate-400 mt-2 flex items-center"><span className="w-1 h-1 bg-slate-400 rounded-full mr-1.5"></span> *Jenis kendaraan tidak dapat diubah setelah dibuat.</p>}
                        <InputError message={errors.jenis_kendaraan} className="mt-2" />
                    </div>

                    {/* Tarif Jam Pertama */}
                    <div>
                        <InputLabel htmlFor="tarif_per_jam" value="Tarif Jam Pertama (Rp)" className="font-bold text-slate-700 mb-1" />
                        <div className="relative mt-1">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                                <span className="text-slate-500 font-bold text-sm">Rp</span>
                            </div>
                            <TextInput
                                id="tarif_per_jam"
                                type="number"
                                className="block w-full pl-11 rounded-xl border-slate-200 focus:border-emerald-500 focus:ring-emerald-500 py-2.5 pr-4 font-mono font-bold text-lg"
                                value={data.tarif_per_jam}
                                onChange={(e) => setData('tarif_per_jam', e.target.value)}
                                required
                                min="0"
                                placeholder="cth: 2000"
                            />
                        </div>
                        <p className="text-xs text-slate-400 mt-1.5">Harga yang dikenakan untuk 1 jam pertama parkir</p>
                        <InputError message={errors.tarif_per_jam} className="mt-2" />
                    </div>

                    {/* Tarif Jam Selanjutnya */}
                    <div>
                        <InputLabel htmlFor="tarif_jam_selanjutnya" value="Tarif Jam Selanjutnya (Rp)" className="font-bold text-slate-700 mb-1" />
                        <div className="relative mt-1">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                                <span className="text-slate-500 font-bold text-sm">+Rp</span>
                            </div>
                            <TextInput
                                id="tarif_jam_selanjutnya"
                                type="number"
                                className="block w-full pl-14 rounded-xl border-slate-200 focus:border-blue-500 focus:ring-blue-500 py-2.5 pr-4 font-mono font-bold text-lg"
                                value={data.tarif_jam_selanjutnya}
                                onChange={(e) => setData('tarif_jam_selanjutnya', e.target.value)}
                                required
                                min="0"
                                placeholder="cth: 1000"
                            />
                        </div>
                        <p className="text-xs text-slate-400 mt-1.5">Harga per jam tambahan setelah jam pertama</p>
                        <InputError message={errors.tarif_jam_selanjutnya} className="mt-2" />
                    </div>

                    {/* Preview Simulasi Harga */}
                    {data.tarif_per_jam && data.tarif_jam_selanjutnya && (
                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">Simulasi Harga</span>
                            <div className="space-y-1">
                                {[1, 2, 3, 5].map((jam) => {
                                    const harga = jam <= 1
                                        ? Number(data.tarif_per_jam)
                                        : Number(data.tarif_per_jam) + (Number(data.tarif_jam_selanjutnya) * (jam - 1));
                                    return (
                                        <div key={jam} className="flex items-center justify-between text-sm">
                                            <span className="text-slate-500">{jam} jam</span>
                                            <span className="font-mono font-bold text-slate-800">{formatRupiah(harga)}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </ModalForm>
        </AuthenticatedLayout>
    );
}
