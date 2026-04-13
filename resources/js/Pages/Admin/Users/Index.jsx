import { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, router, Link } from '@inertiajs/react';
import ModalForm from '@/Components/ModalForm';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import { Search, Plus, Edit2, Trash2, UserCircle, Shield, Key } from 'lucide-react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Helper for classes
function cn(...inputs) {
    return twMerge(clsx(inputs));
}

export default function UserIndex({ auth, users, filters }) {
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    // Form Handling
    const { data, setData, post, put, delete: destroy, processing, errors, reset, clearErrors } = useForm({
        id_user: '',
        nama_lengkap: '',
        username: '',
        password: '',
        password_confirmation: '',
        role: 'petugas',
        status_aktif: 'aktif', // Enum: 'aktif' / 'nonaktif'
    });

    const openModal = (user = null) => {
        clearErrors();
        if (user) {
            setIsEditing(true);
            setData({
                id_user: user.id_user,
                nama_lengkap: user.nama_lengkap,
                username: user.username,
                role: user.role,
                status_aktif: user.status_aktif || 'aktif',
                password: '',
                password_confirmation: ''
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
            put(route('admin.users.update', data.id_user), {
                onSuccess: () => {
                    setShowModal(false);
                    reset();
                }
            });
        } else {
            post(route('admin.users.store'), {
                onSuccess: () => {
                    setShowModal(false);
                    reset();
                }
            });
        }
    };

    const handleDelete = (user) => {
        if (confirm(`Yakin ingin menghapus user ${user.nama_lengkap}?`)) {
            destroy(route('admin.users.destroy', user.id_user));
        }
    };

    const getRoleConfig = (role) => {
        if (role === 'admin') return { icon: <Shield className="w-6 h-6 text-purple-600 group-hover:scale-110 transition-transform" />, bg: 'bg-purple-100/80 border border-purple-200 shadow-sm shadow-purple-100/50', glow: 'bg-purple-500', badge: 'text-purple-700 bg-purple-50 border-purple-200' };
        if (role === 'owner') return { icon: <Key className="w-6 h-6 text-orange-600 group-hover:scale-110 transition-transform" />, bg: 'bg-orange-100/80 border border-orange-200 shadow-sm shadow-orange-100/50', glow: 'bg-orange-500', badge: 'text-orange-700 bg-orange-50 border-orange-200' };
        return { icon: <UserCircle className="w-6 h-6 text-emerald-600 group-hover:scale-110 transition-transform" />, bg: 'bg-emerald-100/80 border border-emerald-200 shadow-sm shadow-emerald-100/50', glow: 'bg-emerald-500', badge: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
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
            header={<h2 className="font-bold text-2xl text-slate-800 leading-tight font-heading">Manajemen Petugas & User</h2>}
        >
            <Head title="Data Petugas" />

            <div className="min-h-screen bg-slate-50/50 py-8 font-sans">
                <div className="max-w-5xl mx-auto sm:px-6 lg:px-8 space-y-6">

                    {/* Header Section */}
                    <div className="flex flex-col md:flex-row md:justify-between md:items-center p-6 bg-white rounded-[2rem] shadow-sm border border-slate-100">
                        <div>
                            <h2 className="font-bold text-2xl text-slate-800 leading-tight font-heading">Data Petugas</h2>
                            <p className="text-sm text-slate-500 mt-1">Kelola data user, petugas gate, dan hak akses</p>
                        </div>

                        <div className="flex items-center gap-4 mt-6 md:mt-0">
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Cari user..."
                                    defaultValue={filters?.search || ''}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            router.get(route('admin.users.index'), { search: e.target.value }, { preserveState: true, replace: true });
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
                                Tambah User
                            </button>
                        </div>
                    </div>

                    {/* Stacked Data Cards List */}
                    {users.data && users.data.length > 0 ? (
                        <motion.div
                            className="flex flex-col gap-4"
                            variants={containerVariants}
                            initial="hidden"
                            animate="show"
                        >
                            {users.data.map((user) => {
                                const roleConf = getRoleConfig(user.role);

                                return (
                                    <motion.div
                                        key={user.id_user}
                                        variants={itemVariants}
                                        className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between relative overflow-hidden group hover:shadow-md hover:border-slate-200 transition-all gap-5"
                                    >
                                        {/* BG Accent Glow */}
                                        <div className={cn(
                                            "absolute -top-16 -left-16 w-32 h-32 rounded-full blur-3xl opacity-0 pointer-events-none transition-opacity duration-500 group-hover:opacity-10",
                                            roleConf.glow
                                        )}></div>

                                        {/* A. Info Utama */}
                                        <div className="flex items-center gap-4 flex-1 min-w-[250px] z-10 w-full md:w-auto">
                                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${roleConf.bg}`}>
                                                {roleConf.icon}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className={`px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-md border ${roleConf.badge}`}>
                                                        {user.role}
                                                    </span>
                                                    {user.status_aktif === 'nonaktif' && (
                                                        <span className="px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-md border text-red-700 bg-red-50 border-red-200">
                                                            BANNED
                                                        </span>
                                                    )}
                                                </div>
                                                <h3 className="text-lg font-bold text-slate-800 leading-tight truncate pr-4">{user.nama_lengkap}</h3>
                                            </div>
                                        </div>

                                        {/* C. Detail Status & Username */}
                                        <div className="flex-1 w-full md:w-auto md:max-w-[35%] z-10 px-0 md:px-4">
                                            <div className="flex flex-col justify-center h-full">
                                                <div className="flex items-baseline gap-2 mb-1">
                                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider w-20">Username</span>
                                                    <span className="text-sm font-semibold font-mono text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">@{user.username}</span>
                                                </div>
                                                <div className="flex items-baseline gap-2">
                                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider w-20">Status</span>
                                                    <div className="flex items-center gap-1.5">
                                                        <div className={cn(
                                                            "w-2 h-2 rounded-full",
                                                            user.status_aktif === 'aktif' ? "bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]" : "bg-red-500"
                                                        )}></div>
                                                        <span className="text-sm font-bold text-slate-700 capitalize">
                                                            {user.status_aktif === 'aktif' ? 'Aktif' : 'Non-Aktif'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* D. Aksi */}
                                        <div className="flex items-center gap-2 flex-none justify-end w-full md:w-auto mt-2 md:mt-0 pt-4 md:pt-0 border-t md:border-transparent border-slate-100 z-10">
                                            <button
                                                onClick={() => openModal(user)}
                                                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 md:p-3 rounded-xl md:rounded-full bg-slate-50 md:bg-transparent text-slate-500 hover:bg-emerald-50 hover:text-emerald-600 hover:shadow-sm md:hover:border-emerald-100 md:border md:border-transparent transition-all"
                                                title="Edit User"
                                            >
                                                <Edit2 className="w-[18px] h-[18px]" />
                                                <span className="text-sm font-bold md:hidden">Edit</span>
                                            </button>
                                            <button
                                                onClick={() => handleDelete(user)}
                                                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 md:p-3 rounded-xl md:rounded-full bg-slate-50 md:bg-transparent text-slate-500 hover:bg-rose-50 hover:text-rose-600 hover:shadow-sm md:hover:border-rose-100 md:border md:border-transparent transition-all"
                                                title="Hapus User"
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
                                <UserCircle className="w-10 h-10 text-slate-300" />
                            </div>
                            <h3 className="text-2xl text-slate-600 font-bold mb-2">Data Petugas Kosong</h3>
                            <p className="text-slate-400">Belum ada data user atau petugas yang ditambahkan.</p>
                            <button
                                onClick={() => openModal()}
                                className="mt-8 bg-emerald-50 border border-emerald-100 text-emerald-600 hover:bg-emerald-600 hover:text-white px-8 py-3 rounded-full font-bold shadow-sm transition-all focus:ring-4 focus:ring-emerald-100"
                            >
                                <Plus className="w-5 h-5 inline mr-2 -mt-0.5" />
                                Tambah User Pertama
                            </button>
                        </motion.div>
                    )}

                    {/* PAGINATION */}
                    {users && users.total > 10 && (
                        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-8 bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
                            <div className="text-sm text-slate-500 font-medium px-2">
                                Menampilkan <span className="font-bold text-slate-900">{users.from}</span> - <span className="font-bold text-slate-900">{users.to}</span> dari <span className="font-bold text-slate-900">{users.total}</span> data
                            </div>
                            <div className="flex gap-1.5 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                                {users.links.map((link, key) => (
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
                title={isEditing ? "Edit Data User" : "Tambah User Baru"}
                onSubmit={submit}
                processing={processing}
            >
                <div className="space-y-5">
                    <div>
                        <InputLabel htmlFor="nama_lengkap" value="Nama Lengkap" className="font-bold text-slate-700 mb-1" />
                        <TextInput
                            id="nama_lengkap"
                            type="text"
                            className="mt-1 block w-full rounded-xl border-slate-200 focus:border-emerald-500 focus:ring-emerald-500 py-2.5 px-4"
                            value={data.nama_lengkap}
                            onChange={(e) => setData('nama_lengkap', e.target.value)}
                            required
                            isFocused
                        />
                        <InputError message={errors.nama_lengkap} className="mt-2" />
                    </div>

                    <div>
                        <InputLabel htmlFor="username" value="Username Login" className="font-bold text-slate-700 mb-1" />
                        <TextInput
                            id="username"
                            type="text"
                            className="mt-1 block w-full font-mono rounded-xl border-slate-200 focus:border-emerald-500 focus:ring-emerald-500 py-2.5 px-4"
                            value={data.username}
                            onChange={(e) => setData('username', e.target.value)}
                            required
                        />
                        <InputError message={errors.username} className="mt-2" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <InputLabel htmlFor="role" value="Role Akses" className="font-bold text-slate-700 mb-1" />
                            <select
                                id="role"
                                className="mt-1 block w-full border-slate-200 rounded-xl shadow-sm focus:ring-emerald-500 focus:border-emerald-500 text-sm font-medium text-slate-700 py-2.5 px-4"
                                value={data.role}
                                onChange={(e) => setData('role', e.target.value)}
                            >
                                <option value="petugas">Petugas Gate</option>
                                <option value="admin">Admin IT</option>
                                <option value="owner">Owner / Direksi</option>
                            </select>
                            <InputError message={errors.role} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="status_aktif" value="Status User" className="font-bold text-slate-700 mb-1" />
                            <select
                                id="status_aktif"
                                className="mt-1 block w-full border-slate-200 rounded-xl shadow-sm focus:ring-emerald-500 focus:border-emerald-500 text-sm font-medium text-slate-700 py-2.5 px-4"
                                value={data.status_aktif}
                                onChange={(e) => setData('status_aktif', e.target.value)}
                            >
                                <option value="aktif">Aktif</option>
                                <option value="nonaktif">Non-Aktif (Banned)</option>
                            </select>
                            <InputError message={errors.status_aktif} className="mt-2" />
                        </div>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mt-4">
                        <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                            <Key className="w-4 h-4 text-emerald-600" />
                            Keamanan Password
                        </h4>
                        <div className="space-y-4">
                            <div>
                                <InputLabel htmlFor="password" value={isEditing ? "Password Baru (Opsional)" : "Password"} className="font-semibold text-slate-600 mb-1 text-sm" />
                                <TextInput
                                    id="password"
                                    type="password"
                                    className="mt-1 block w-full rounded-xl border-slate-200 focus:border-emerald-500 focus:ring-emerald-500 py-2 px-3 text-sm"
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    required={!isEditing}
                                    placeholder={isEditing ? "Kosongkan jika tidak ubah" : "Masukkan password baru"}
                                />
                                <InputError message={errors.password} className="mt-2" />
                            </div>

                            <div>
                                <InputLabel htmlFor="password_confirmation" value="Konfirmasi Password" className="font-semibold text-slate-600 mb-1 text-sm" />
                                <TextInput
                                    id="password_confirmation"
                                    type="password"
                                    className="mt-1 block w-full rounded-xl border-slate-200 focus:border-emerald-500 focus:ring-emerald-500 py-2 px-3 text-sm"
                                    value={data.password_confirmation}
                                    onChange={(e) => setData('password_confirmation', e.target.value)}
                                    required={!isEditing || data.password.length > 0}
                                    placeholder="Ulangi password"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </ModalForm>
        </AuthenticatedLayout>
    );
}
