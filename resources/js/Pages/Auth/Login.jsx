import { useEffect } from 'react';
import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, Link, useForm } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { ArrowLeft, Stethoscope, ShieldCheck, Asterisk } from 'lucide-react';

export default function Login({ status, canResetPassword }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        username: '',
        password: '',
        remember: false,
    });

    useEffect(() => {
        return () => {
            reset('password');
        };
    }, []);

    const submit = (e) => {
        e.preventDefault();
        post(route('login'));
    };

    return (
        <div className="min-h-screen w-full bg-white flex overflow-hidden font-sans selection:bg-emerald-500 selection:text-white">
            <Head title="Log in" />

            {/* 1. KIRI - FLOATING GREEN PANEL */}
            {/* The 'p-4' wrapper creates the floating effect inside the canvas */}
            <div className="hidden lg:flex w-1/2 h-screen p-4 items-center justify-center">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="w-full h-full bg-gradient-to-br from-emerald-950 via-emerald-800 to-teal-900 rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col justify-between p-12 lg:p-16 text-white"
                >
                    {/* Background Effects */}
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500 rounded-full mix-blend-overlay filter blur-[100px] opacity-20 -translate-y-1/2 translate-x-1/2"></div>
                    <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-teal-400 rounded-full mix-blend-overlay filter blur-[80px] opacity-20 translate-y-1/3 -translate-x-1/3"></div>
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150"></div>

                    {/* Logo Area */}
                    {/* Logo Area */}
                    <div className="relative z-10 flex items-center gap-3">
                        <img src="/images/hermina_logo.png" alt="Hermina Logo" className="h-10 w-auto brightness-0 invert opacity-90" />
                        <div className="flex flex-col justify-center">
                            <span className="font-bold text-white text-lg tracking-tight leading-none">Hermina</span>
                            <span className="font-bold text-emerald-200 text-[0.65rem] uppercase tracking-widest leading-none mt-0.5">Smart Parking</span>
                        </div>
                    </div>

                    {/* Main Text Area - Balanced Size */}
                    <div className="relative z-10">
                        <Asterisk className="w-10 h-10 text-emerald-300 mb-6 animate-spin-slow" />
                        <h1 className="text-4xl md:text-5xl font-medium leading-[1.1] tracking-tight mb-6 font-outfit">
                            Smart Access.<br />
                            <span className="text-emerald-400">Secure.</span>
                        </h1>
                        <div className="flex items-center gap-4">
                            <div className="h-px w-8 bg-emerald-400/50"></div>
                            <p className="text-emerald-100/80 max-w-xs text-sm leading-relaxed font-light">
                                Panel akses terintegrasi untuk staf medis dan manajemen RS Hermina.
                            </p>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* 2. KANAN - FORM ON CANVAS */}
            {/* Directly on white background, no card borders */}
            <div className="w-full lg:w-1/2 h-screen flex flex-col justify-center items-center bg-white relative">

                {/* Back Link */}
                <Link href="/" className="absolute top-8 left-8 lg:top-12 lg:left-12 flex items-center gap-2 text-slate-400 hover:text-emerald-600 transition-colors text-xs font-bold uppercase tracking-wider group">
                    <ArrowLeft className="w-3 h-3 group-hover:-translate-x-1 transition-transform" /> Kembali
                </Link>

                {/* Decoration for Mobile only */}
                <div className="lg:hidden absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-500 to-teal-500"></div>

                {/* ENLARGED CONTAINER: max-w-xl (was max-w-[400px]) */}
                <div className="max-w-xl w-full px-8 md:px-12">

                    <div className="mb-10">
                        {/* BRAND LOGO */}
                        <div className="flex items-center gap-3 mb-8">
                            <img src="/images/hermina_logo.png" alt="Hermina Logo" className="h-11 w-auto" />
                            <div className="flex flex-col justify-center">
                                <span className="font-bold text-slate-900 text-2xl tracking-tight leading-none">Hermina</span>
                                <span className="font-bold text-emerald-600 text-[0.7rem] uppercase tracking-widest leading-none mt-1">Smart Parking</span>
                            </div>
                        </div>

                        <h2 className="text-4xl font-bold tracking-tight text-slate-900 mb-3 font-outfit">Selamat Datang</h2>
                        <p className="text-slate-500 text-base">Silakan masukkan detail akun Anda untuk masuk.</p>
                    </div>

                    {status && (
                        <div className="mb-8 p-4 rounded-xl bg-emerald-50 text-emerald-700 text-sm font-medium border border-emerald-100 flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                            {status}
                        </div>
                    )}

                    <form onSubmit={submit}>
                        <div className="space-y-6 mb-8">
                            <div>
                                <InputLabel htmlFor="username" value="Username" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2" />
                                <TextInput
                                    id="username"
                                    type="text"
                                    name="username"
                                    value={data.username}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-4 text-base font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all placeholder:text-slate-400"
                                    autoComplete="username"
                                    isFocused={true}
                                    onChange={(e) => setData('username', e.target.value)}
                                    placeholder="e.g. dr.sarah"
                                />
                                <InputError message={errors.username} className="mt-2 text-sm" />
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <InputLabel htmlFor="password" value="Password" className="text-xs font-bold text-slate-500 uppercase tracking-wider" />
                                </div>
                                <TextInput
                                    id="password"
                                    type="password"
                                    name="password"
                                    value={data.password}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-4 text-base font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all placeholder:text-slate-400"
                                    autoComplete="current-password"
                                    onChange={(e) => setData('password', e.target.value)}
                                    placeholder="••••••••••••"
                                />
                                <InputError message={errors.password} className="mt-2 text-sm" />
                            </div>
                        </div>

                        <div className="flex items-center justify-between mb-10">
                            <label className="flex items-center cursor-pointer group">
                                <Checkbox
                                    name="remember"
                                    checked={data.remember}
                                    onChange={(e) => setData('remember', e.target.checked)}
                                    className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 group-hover:border-emerald-500 transition-colors"
                                />
                                <span className="ms-2 text-sm text-slate-500 font-medium group-hover:text-emerald-700 transition-colors">Ingat saya</span>
                            </label>

                            {canResetPassword && (
                                <Link
                                    href={route('password.request')}
                                    className="text-sm font-bold text-slate-400 hover:text-emerald-600 transition-colors"
                                >
                                    Lupa Password?
                                </Link>
                            )}
                        </div>

                        <PrimaryButton
                            className="w-full bg-slate-900 hover:bg-emerald-600 text-white font-bold rounded-xl py-4 text-base transition-all shadow-xl hover:shadow-2xl hover:shadow-emerald-500/30 justify-center"
                            disabled={processing}
                        >
                            Masuk ke Sistem
                        </PrimaryButton>
                    </form>

                    <div className="mt-12 text-center text-slate-300 text-xs">
                        &copy; 2026 RS Hermina Arcamanik.
                    </div>
                </div>
            </div>
        </div>
    );
}
