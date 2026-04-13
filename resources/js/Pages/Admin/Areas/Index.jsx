import { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, router, Link } from '@inertiajs/react';
import ModalForm from '@/Components/ModalForm';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import { Search, Plus, Edit2, Trash2, Bike, Car, Box, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Helper for classes
function cn(...inputs) {
    return twMerge(clsx(inputs));
}

export default function AreaIndex({ auth, areas, filters }) {
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    const { data, setData, post, put, delete: destroy, processing, errors, reset, clearErrors } = useForm({
        id_area: '',
        nama_area: '',
        kapasitas: '',
        peruntukan: 'semua', // Default: universal
    });

    const openModal = (area = null) => {
        clearErrors();
        if (area) {
            setIsEditing(true);
            setData({
                id_area: area.id_area,
                nama_area: area.nama_area,
                kapasitas: area.kapasitas,
                peruntukan: area.peruntukan || 'semua',
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
            put(route('admin.areas.update', data.id_area), {
                onSuccess: () => {
                    setShowModal(false);
                    reset();
                }
            });
        } else {
            post(route('admin.areas.store'), {
                onSuccess: () => {
                    setShowModal(false);
                    reset();
                }
            });
        }
    };

    const handleDelete = (area) => {
        if (area.terisi > 0) {
            alert('Gagal: Area sedang terisi kendaraan.');
            return;
        }
        if (confirm(`Yakin ingin menghapus area ${area.nama_area}?`)) {
            destroy(route('admin.areas.destroy', area.id_area));
        }
    };

    const getIconConfig = (peruntukan) => {
        if (peruntukan === 'motor') return { icon: <Bike className="w-6 h-6 text-emerald-600 group-hover:scale-110 transition-transform" />, bg: 'bg-emerald-100/80 border border-emerald-200 shadow-sm shadow-emerald-100/50', glow: 'bg-emerald-500' };
        if (peruntukan === 'mobil') return { icon: <Car className="w-6 h-6 text-blue-600 group-hover:scale-110 transition-transform" />, bg: 'bg-blue-100/80 border border-blue-200 shadow-sm shadow-blue-100/50', glow: 'bg-blue-500' };
        return { icon: <Box className="w-6 h-6 text-slate-600 group-hover:scale-110 transition-transform" />, bg: 'bg-slate-100/80 border border-slate-200 shadow-sm shadow-slate-100/50', glow: 'bg-slate-500' };
    };

    const getBadgeConfig = (peruntukan) => {
        if (peruntukan === 'motor') return { label: 'MOTOR', styles: 'text-emerald-700 bg-emerald-50 border-emerald-100' };
        if (peruntukan === 'mobil') return { label: 'MOBIL', styles: 'text-blue-700 bg-blue-50 border-blue-100' };
        return { label: 'UNIVERSAL', styles: 'text-slate-600 bg-slate-50 border-slate-200' };
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
            header={<h2 className="font-bold text-2xl text-slate-800 leading-tight font-heading">Manajemen Area Parkir</h2>}
        >
            <Head title="Data Area Parkir" />

            <div className="min-h-screen bg-slate-50/50 py-8 font-sans">
                <div className="max-w-5xl mx-auto sm:px-6 lg:px-8 space-y-6">

                    {/* Header Section */}
                    <div className="flex flex-col md:flex-row md:justify-between md:items-center p-6 bg-white rounded-[2rem] shadow-sm border border-slate-100">
                        <div>
                            <h2 className="font-bold text-2xl text-slate-800 leading-tight font-heading">Data Area Parkir</h2>
                            <p className="text-sm text-slate-500 mt-1">Kelola zonasi dan kapasitas ruang parkir</p>
                        </div>

                        <div className="flex items-center gap-4 mt-6 md:mt-0">
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Cari area..."
                                    defaultValue={filters?.search || ''}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            router.get(route('admin.areas.index'), { search: e.target.value }, { preserveState: true, replace: true });
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
                                Tambah Area
                            </button>
                        </div>
                    </div>

                    {/* Stacked Data Cards List */}
                    {areas.data && areas.data.length > 0 ? (
                        <motion.div
                            className="flex flex-col gap-4"
                            variants={containerVariants}
                            initial="hidden"
                            animate="show"
                        >
                            {areas.data.map((area) => {
                                const iconConf = getIconConfig(area.peruntukan);
                                const badgeConf = getBadgeConfig(area.peruntukan);
                                const terisiPercentage = Math.min((area.terisi / area.kapasitas) * 100, 100);
                                const isAlmostFull = terisiPercentage >= 90;

                                return (
                                    <motion.div
                                        key={area.id_area}
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
                                                <div className="flex items-center gap-3 mb-1">
                                                    <span className={`px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-md border ${badgeConf.styles}`}>
                                                        {badgeConf.label}
                                                    </span>
                                                    {isAlmostFull && (
                                                        <span className="flex items-center text-xs font-bold text-red-500 animate-pulse">
                                                            <AlertCircle className="w-3 h-3 mr-1" /> Hampir Penuh
                                                        </span>
                                                    )}
                                                </div>
                                                <h3 className="text-lg font-bold text-slate-800 leading-tight truncate pr-4">{area.nama_area}</h3>
                                            </div>
                                        </div>

                                        {/* C. Visual Indicator Kapasitas */}
                                        <div className="flex-1 w-full md:w-auto md:max-w-[35%] z-10 px-0 md:px-4">
                                            <div className="flex justify-between items-end mb-2">
                                                <div className="flex items-baseline gap-1">
                                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Terisi</span>
                                                    <span className={cn(
                                                        "text-xl font-bold font-mono ml-2",
                                                        isAlmostFull ? "text-red-500" : "text-slate-800"
                                                    )}>
                                                        {area.terisi}
                                                    </span>
                                                    <span className="text-xs font-medium text-slate-400">/ {area.kapasitas} Slot</span>
                                                </div>
                                                <span className={cn(
                                                    "text-xs font-bold font-mono",
                                                    isAlmostFull ? "text-red-500" : "text-emerald-500"
                                                )}>
                                                    {terisiPercentage.toFixed(0)}%
                                                </span>
                                            </div>
                                            <div className="h-2.5 w-full bg-slate-100/80 rounded-full overflow-hidden shadow-inner flex">
                                                <div
                                                    className={cn(
                                                        "h-full rounded-full transition-all duration-1000 ease-out",
                                                        isAlmostFull ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" : "bg-emerald-500"
                                                    )}
                                                    style={{ width: `${terisiPercentage}%` }}
                                                ></div>
                                            </div>
                                        </div>

                                        {/* D. Aksi */}
                                        <div className="flex items-center gap-2 flex-none justify-end w-full md:w-auto mt-2 md:mt-0 pt-4 md:pt-0 border-t md:border-transparent border-slate-100 z-10">
                                            <button
                                                onClick={() => openModal(area)}
                                                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 md:p-3 rounded-xl md:rounded-full bg-slate-50 md:bg-transparent text-slate-500 hover:bg-emerald-50 hover:text-emerald-600 hover:shadow-sm md:hover:border-emerald-100 md:border md:border-transparent transition-all"
                                                title="Edit Area"
                                            >
                                                <Edit2 className="w-[18px] h-[18px]" />
                                                <span className="text-sm font-bold md:hidden">Edit</span>
                                            </button>
                                            <button
                                                onClick={() => handleDelete(area)}
                                                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 md:p-3 rounded-xl md:rounded-full bg-slate-50 md:bg-transparent text-slate-500 hover:bg-rose-50 hover:text-rose-600 hover:shadow-sm md:hover:border-rose-100 md:border md:border-transparent transition-all"
                                                title="Hapus Area"
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
                                <Box className="w-10 h-10 text-slate-300" />
                            </div>
                            <h3 className="text-2xl text-slate-600 font-bold mb-2">Area Parkir Kosong</h3>
                            <p className="text-slate-400">Belum ada data area parkir yang ditambahkan. Mari buat area pertamamu!</p>
                            <button
                                onClick={() => openModal()}
                                className="mt-8 bg-emerald-50 border border-emerald-100 text-emerald-600 hover:bg-emerald-600 hover:text-white px-8 py-3 rounded-full font-bold shadow-sm transition-all focus:ring-4 focus:ring-emerald-100"
                            >
                                <Plus className="w-5 h-5 inline mr-2 -mt-0.5" />
                                Tambah Area Pertama
                            </button>
                        </motion.div>
                    )}

                    {/* PAGINATION */}
                    {areas && areas.total > 10 && (
                        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-8 bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
                            <div className="text-sm text-slate-500 font-medium px-2">
                                Menampilkan <span className="font-bold text-slate-900">{areas.from}</span> - <span className="font-bold text-slate-900">{areas.to}</span> dari <span className="font-bold text-slate-900">{areas.total}</span> area
                            </div>
                            <div className="flex gap-1.5 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                                {areas.links.map((link, key) => (
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
                title={isEditing ? "Edit Area Parkir" : "Tambah Area Baru"}
                onSubmit={submit}
                processing={processing}
            >
                <div className="space-y-5">
                    <div>
                        <InputLabel htmlFor="nama_area" value="Nama Area (Gedung/Lantai)" className="font-bold text-slate-700 mb-1" />
                        <TextInput
                            id="nama_area"
                            type="text"
                            className="mt-1 block w-full rounded-xl border-slate-200 focus:border-emerald-500 focus:ring-emerald-500 py-2.5 px-4"
                            value={data.nama_area}
                            onChange={(e) => setData('nama_area', e.target.value)}
                            required
                            isFocused
                            placeholder="Contoh: Basement 1 - Motor Umum"
                        />
                        <InputError message={errors.nama_area} className="mt-2" />
                    </div>

                    <div>
                        <InputLabel htmlFor="kapasitas" value="Kapasitas Maksimal (Slot)" className="font-bold text-slate-700 mb-1" />
                        <TextInput
                            id="kapasitas"
                            type="number"
                            className="mt-1 block w-full font-mono rounded-xl border-slate-200 focus:border-emerald-500 focus:ring-emerald-500 py-2.5 px-4"
                            value={data.kapasitas}
                            onChange={(e) => setData('kapasitas', e.target.value)}
                            required
                            min="1"
                            placeholder="0"
                        />
                        <p className="text-xs text-slate-400 mt-2 font-medium flex items-center">
                            <span className="w-1 h-1 bg-slate-400 rounded-full mr-1.5"></span>
                            Jumlah kendaraan maksimal yang dapat ditampung.
                        </p>
                        <InputError message={errors.kapasitas} className="mt-2" />
                    </div>

                    <div>
                        <InputLabel htmlFor="peruntukan" value="Peruntukan Kendaraan" className="font-bold text-slate-700 mb-1" />
                        <select
                            id="peruntukan"
                            className="mt-1 block w-full border-slate-200 rounded-xl shadow-sm focus:ring-emerald-500 focus:border-emerald-500 text-sm font-medium text-slate-700 py-2.5 px-4"
                            value={data.peruntukan}
                            onChange={(e) => setData('peruntukan', e.target.value)}
                            required
                        >
                            <option value="motor">🏍️ Khusus Motor</option>
                            <option value="mobil">🚗 Khusus Mobil</option>
                            <option value="semua">🅿️ Universal (Semua Jenis)</option>
                        </select>
                        <p className="text-xs text-slate-400 mt-2 font-medium flex items-center">
                            <span className="w-1 h-1 bg-slate-400 rounded-full mr-1.5"></span>
                            Jenis kendaraan yang diperbolehkan parkir di area ini.
                        </p>
                        <InputError message={errors.peruntukan} className="mt-2" />
                    </div>
                </div>
            </ModalForm>
        </AuthenticatedLayout>
    );
}
