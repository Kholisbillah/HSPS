import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, Link, useForm } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { ArrowLeft, Asterisk, Stethoscope } from 'lucide-react';

export default function ForgotPassword({ status }) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('password.email'));
    };

    return (
        <div className="min-h-screen w-full bg-white flex overflow-hidden font-sans selection:bg-emerald-500 selection:text-white">
            <Head title="Forgot Password" />

            {/* 1. KIRI - FLOATING GREEN PANEL */}
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
                    <div className="relative z-10 flex items-center gap-3">
                        <img src="/images/hermina_logo.png" alt="Hermina Logo" className="h-10 w-auto brightness-0 invert opacity-90" />
                        <div className="flex flex-col justify-center">
                            <span className="font-bold text-white text-lg tracking-tight leading-none">Hermina</span>
                            <span className="font-bold text-emerald-200 text-[0.65rem] uppercase tracking-widest leading-none mt-0.5">Smart Parking</span>
                        </div>
                    </div>

                    {/* Main Text Area */}
                    <div className="relative z-10">
                        <Asterisk className="w-10 h-10 text-emerald-300 mb-6 animate-spin-slow" />
                        <h1 className="text-4xl md:text-5xl font-medium leading-[1.1] tracking-tight mb-6 font-outfit">
                            Account<br />
                            <span className="text-emerald-400">Recovery.</span>
                        </h1>
                        <div className="flex items-center gap-4">
                            <div className="h-px w-8 bg-emerald-400/50"></div>
                            <p className="text-emerald-100/80 max-w-xs text-sm leading-relaxed font-light">
                                Securely reset your password to regain access to the Hermina Smart Parking environment.
                            </p>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* 2. KANAN - FORM ON CANVAS */}
            <div className="w-full lg:w-1/2 h-screen flex flex-col justify-center items-center bg-white relative">

                {/* Back Link */}
                <Link href={route('login')} className="absolute top-8 left-8 lg:top-12 lg:left-12 flex items-center gap-2 text-slate-400 hover:text-emerald-600 transition-colors text-xs font-bold uppercase tracking-wider group">
                    <ArrowLeft className="w-3 h-3 group-hover:-translate-x-1 transition-transform" /> Back to Login
                </Link>

                {/* Decoration for Mobile only */}
                <div className="lg:hidden absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-500 to-teal-500"></div>

                {/* FORM CONTAINER - MATCHING LOGIN SCALE */}
                <div className="max-w-xl w-full px-8 md:px-12">

                    <div className="mb-10">
                        {/* BRAND LOGO (Same as Login) */}
                        <div className="flex items-center gap-3 mb-8">
                            <img src="/images/hermina_logo.png" alt="Hermina Logo" className="h-11 w-auto" />
                            <div className="flex flex-col justify-center">
                                <span className="font-bold text-slate-900 text-2xl tracking-tight leading-none">Hermina</span>
                                <span className="font-bold text-emerald-600 text-[0.7rem] uppercase tracking-widest leading-none mt-1">Smart Parking</span>
                            </div>
                        </div>

                        <h2 className="text-4xl font-bold tracking-tight text-slate-900 mb-3 font-outfit">Forgot Password?</h2>
                        <p className="text-slate-500 text-base leading-relaxed">
                            No problem. Just let us know your email address and we will email you a password reset link.
                        </p>
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
                                <InputLabel htmlFor="email" value="Email" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2" />
                                <TextInput
                                    id="email"
                                    type="email"
                                    name="email"
                                    value={data.email}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-4 text-base font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all placeholder:text-slate-400"
                                    isFocused={true}
                                    onChange={(e) => setData('email', e.target.value)}
                                    placeholder="name@hermina.com"
                                />
                                <InputError message={errors.email} className="mt-2 text-sm" />
                            </div>
                        </div>

                        <PrimaryButton
                            className="w-full bg-slate-900 hover:bg-emerald-600 text-white font-bold rounded-xl py-4 text-base transition-all shadow-xl hover:shadow-2xl hover:shadow-emerald-500/30 justify-center"
                            disabled={processing}
                        >
                            Email Password Reset Link
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
