import { useState } from 'react';
import { Link, usePage, router } from '@inertiajs/react';
import { motion } from 'framer-motion';
import {
    LayoutDashboard,
    LogIn,
    LogOut,
    Database,
    FileText,
    User,
    Menu,
    X,
    Activity,
    Landmark,
    ChevronRight,
    Car,
    Bike,
    Map,
    Monitor,
    Banknote,
    CreditCard,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import PasswordConfirmModal from '@/Components/PasswordConfirmModal';

export default function Authenticated({ user, header, children }) {
    // State terpisah: submenu dropdown (string|null) dan mobile menu (boolean)
    const [activeSubmenu, setActiveSubmenu] = useState(() => {
        const url = window.location.pathname;
        if (url.startsWith('/admin/')) return 'master';
        if (url.startsWith('/gate/masuk') || url.startsWith('/petugas/gate-in')) return 'gate-in';
        if (url.startsWith('/gate/keluar') || url.startsWith('/petugas/gate-out')) return 'gate-out';
        return null;
    });
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const { url } = usePage();

    // State untuk modal konfirmasi password
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [pendingGateUrl, setPendingGateUrl] = useState(null);

    const isActive = (route) => url.startsWith(route);

    const NavItem = ({ href, icon: Icon, label, active }) => (
        <Link
            href={href}
            className={cn(
                "flex items-center px-6 py-3 text-sm font-medium transition-all duration-200 border-l-4",
                active
                    ? "text-emerald-700 bg-emerald-50 border-emerald-500"
                    : "text-gray-500 border-transparent hover:bg-gray-50 hover:text-emerald-600"
            )}
        >
            <Icon className={cn("w-5 h-5 mr-3", active ? "text-emerald-600" : "text-gray-400")} />
            {label}
        </Link>
    );

    // Handler: klik menu gate → buka password modal dulu
    const handleGateClick = (gateUrl) => {
        setPendingGateUrl(gateUrl);
        setShowPasswordModal(true);
    };

    // Setelah password valid → navigasi ke halaman gate
    const handlePasswordConfirmed = () => {
        setShowPasswordModal(false);
        if (pendingGateUrl) {
            router.visit(pendingGateUrl);
        }
    };

    // Submenu gate item (tanpa Link, pakai onClick + password confirm)
    const GateNavItem = ({ gateUrl, icon: Icon, label, active, iconColor = 'text-gray-400' }) => (
        <button
            onClick={() => handleGateClick(gateUrl)}
            className={cn(
                "w-full flex items-center pl-14 pr-6 py-2.5 text-sm font-medium transition-all duration-200 text-left",
                active
                    ? "text-emerald-600 font-semibold bg-emerald-50/50"
                    : "text-gray-500 hover:text-emerald-600 hover:bg-gray-50"
            )}
        >
            <Icon className={cn("w-4 h-4 mr-2.5", active ? 'text-emerald-600' : iconColor)} />
            {label}
        </button>
    );

    return (
        <div className="flex min-h-screen bg-slate-50">
            {/* Sidebar Desktop */}
            <aside className="hidden md:flex flex-col w-72 bg-white border-r border-slate-200 shadow-sm fixed h-full z-10">
                <div className="flex items-center justify-center h-20 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                        <img src="/images/hermina_logo.png" alt="Logo" className="w-8 h-8 object-contain" />
                        <span className="text-xl font-bold text-gray-800 tracking-tight font-heading">
                            Hermina<span className="text-emerald-600">Smart</span>
                        </span>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto py-6 space-y-1">
                    <div className="px-6 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        Menu
                    </div>

                    <NavItem href={route('dashboard')} icon={LayoutDashboard} label="Dashboard" active={route().current('dashboard')} />

                    {/* Role: Petugas & Admin — Gate Operations */}
                    {['petugas', 'admin'].includes(user.role) && (
                        <>
                            <div className="px-6 mt-6 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                Operasional Gate
                            </div>

                            {/* === SUBMENU: Gate Masuk === */}
                            <div className="space-y-0.5">
                                <button
                                    onClick={() => setActiveSubmenu(prev => prev === 'gate-in' ? null : 'gate-in')}
                                    className={cn(
                                        "w-full flex items-center justify-between px-6 py-3 text-sm font-medium transition-all duration-200 border-l-4 border-transparent hover:bg-gray-50",
                                        isActive('/gate/masuk') ? "text-emerald-700" : "text-gray-500 hover:text-emerald-600"
                                    )}
                                >
                                    <div className="flex items-center">
                                        <LogIn className={cn("w-5 h-5 mr-3", isActive('/gate/masuk') ? "text-emerald-600" : "text-gray-400")} />
                                        Gate Masuk
                                    </div>
                                    <ChevronRight className={cn("w-4 h-4 transition-transform", activeSubmenu === 'gate-in' ? "rotate-90" : "")} />
                                </button>

                                {activeSubmenu === 'gate-in' && (
                                    <div className="bg-slate-50 py-1">
                                        <GateNavItem
                                            gateUrl="/gate/masuk/motor"
                                            icon={Bike}
                                            label="Gate A — Roda 2 (Motor)"
                                            active={url.includes('/gate/masuk/motor')}
                                            iconColor="text-cyan-500"
                                        />
                                        <GateNavItem
                                            gateUrl="/gate/masuk/mobil"
                                            icon={Car}
                                            label="Gate B — Roda 4 (Mobil)"
                                            active={url.includes('/gate/masuk/mobil')}
                                            iconColor="text-amber-500"
                                        />
                                    </div>
                                )}
                            </div>

                            {/* === SUBMENU: Gate Keluar === */}
                            <div className="space-y-0.5">
                                <button
                                    onClick={() => setActiveSubmenu(prev => prev === 'gate-out' ? null : 'gate-out')}
                                    className={cn(
                                        "w-full flex items-center justify-between px-6 py-3 text-sm font-medium transition-all duration-200 border-l-4 border-transparent hover:bg-gray-50",
                                        isActive('/gate/keluar') ? "text-emerald-700" : "text-gray-500 hover:text-emerald-600"
                                    )}
                                >
                                    <div className="flex items-center">
                                        <LogOut className={cn("w-5 h-5 mr-3", isActive('/gate/keluar') ? "text-emerald-600" : "text-gray-400")} />
                                        Gate Keluar
                                    </div>
                                    <ChevronRight className={cn("w-4 h-4 transition-transform", activeSubmenu === 'gate-out' ? "rotate-90" : "")} />
                                </button>

                                {activeSubmenu === 'gate-out' && (
                                    <div className="bg-slate-50 py-1">
                                        <GateNavItem
                                            gateUrl="/gate/keluar/1"
                                            icon={Banknote}
                                            label="Gate 1 — Motor Cash"
                                            active={url.includes('/gate/keluar/1')}
                                            iconColor="text-cyan-500"
                                        />
                                        <GateNavItem
                                            gateUrl="/gate/keluar/2"
                                            icon={Banknote}
                                            label="Gate 2 — Mobil Cash"
                                            active={url.includes('/gate/keluar/2')}
                                            iconColor="text-amber-500"
                                        />
                                        <GateNavItem
                                            gateUrl="/gate/keluar/3"
                                            icon={CreditCard}
                                            label="Gate 3 — Motor Cashless"
                                            active={url.includes('/gate/keluar/3')}
                                            iconColor="text-cyan-500"
                                        />
                                        <GateNavItem
                                            gateUrl="/gate/keluar/4"
                                            icon={CreditCard}
                                            label="Gate 4 — Mobil Cashless"
                                            active={url.includes('/gate/keluar/4')}
                                            iconColor="text-amber-500"
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Peta Parkir */}
                            <NavItem href={route('area.monitor')} icon={Map} label="Peta Parkir" active={route().current('area.monitor')} />
                        </>
                    )}

                    {/* Role: Admin */}
                    {user.role === 'admin' && (
                        <>
                            <div className="px-6 mt-6 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                Master Data
                            </div>

                            {/* Manual Submenu Implementation for Data Master */}
                            <div className="space-y-1">
                                <button
                                    onClick={() => setActiveSubmenu(prev => prev === 'master' ? null : 'master')}
                                    className={cn(
                                        "w-full flex items-center justify-between px-6 py-3 text-sm font-medium transition-all duration-200 border-l-4 border-transparent hover:bg-gray-50",
                                        (route().current('admin.*')) ? "text-emerald-700" : "text-gray-500 hover:text-emerald-600"
                                    )}
                                >
                                    <div className="flex items-center">
                                        <Database className={cn("w-5 h-5 mr-3", (route().current('admin.*')) ? "text-emerald-600" : "text-gray-400")} />
                                        Data Master
                                    </div>
                                    <ChevronRight className={cn("w-4 h-4 transition-transform", (activeSubmenu === 'master') ? "rotate-90" : "")} />
                                </button>

                                {/* Submenu Items */}
                                {(activeSubmenu === 'master') && (
                                    <div className="bg-slate-50 py-2">
                                        <Link href={route('admin.users.index')} className={cn("flex items-center pl-14 pr-6 py-2 text-sm", route().current('admin.users.*') ? "text-emerald-600 font-semibold" : "text-gray-500 hover:text-emerald-600")}>
                                            Data Petugas
                                        </Link>
                                        <Link href={route('admin.areas.index')} className={cn("flex items-center pl-14 pr-6 py-2 text-sm", route().current('admin.areas.*') ? "text-emerald-600 font-semibold" : "text-gray-500 hover:text-emerald-600")}>
                                            Data Area
                                        </Link>
                                        <Link href={route('admin.tarifs.index')} className={cn("flex items-center pl-14 pr-6 py-2 text-sm", route().current('admin.tarifs.*') ? "text-emerald-600 font-semibold" : "text-gray-500 hover:text-emerald-600")}>
                                            Data Tarif
                                        </Link>
                                        <Link href={route('admin.dendas.index')} className={cn("flex items-center pl-14 pr-6 py-2 text-sm", route().current('admin.dendas.*') ? "text-rose-600 font-semibold" : "text-gray-500 hover:text-rose-600")}>
                                            Denda Tiket Hilang
                                        </Link>
                                        <Link href={route('admin.kendaraans.index')} className={cn("flex items-center pl-14 pr-6 py-2 text-sm", route().current('admin.kendaraans.*') ? "text-emerald-600 font-semibold" : "text-gray-500 hover:text-emerald-600")}>
                                            Data VIP
                                        </Link>
                                    </div>
                                )}
                            </div>

                            <NavItem href={route('admin.gates.index')} icon={Monitor} label="Manajemen Gate" active={route().current('admin.gates.*')} />
                        </>
                    )}

                    {/* Role: Owner */}
                    {['owner', 'admin'].includes(user.role) && (
                        <>
                            <div className="px-6 mt-6 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                Laporan
                            </div>
                            <NavItem href={route('admin.laporan.index')} icon={FileText} label="Laporan & Audit" active={route().current('admin.laporan.*')} />
                        </>
                    )}
                </div>

                {/* User Profile Footer */}
                <div className="p-4 border-t border-slate-100">
                    <div className="flex items-center gap-3 mb-4 px-2">
                        <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold">
                            {user?.username?.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{user?.nama_lengkap || user?.username}</p>
                            <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                        </div>
                    </div>
                    <Link
                        href={route('logout')}
                        method="post"
                        as="button"
                        className="w-full flex items-center justify-center px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
                    >
                        <LogOut className="w-4 h-4 mr-2" />
                        Keluar
                    </Link>
                </div>
            </aside>

            {/* Mobile Header */}
            <div className="md:hidden fixed top-0 w-full bg-white border-b border-gray-200 z-20 px-4 h-16 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <img src="/images/hermina_logo.png" alt="Logo" className="w-8 h-8 object-contain" />
                    <span className="text-lg font-bold text-gray-800">HSPS</span>
                </div>
                <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                    {mobileMenuOpen ? <X className="w-6 h-6 text-gray-600" /> : <Menu className="w-6 h-6 text-gray-600" />}
                </button>
            </div>

            {/* Main Content Area */}
            <main className={cn(
                "flex-1 min-h-screen transition-all duration-300",
                "md:ml-72", // Offset for fixed sidebar
                "pt-20 md:pt-8 p-4 md:p-8" // Padding adjustments
            )}>
                {header && (
                    <header className="mb-8">
                        <div className="max-w-7xl mx-auto">
                            {header}
                        </div>
                    </header>
                )}
                {/* Animasi Framer Motion: fade-up saat pindah halaman */}
                <motion.div
                    key={url}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: 'easeOut' }}
                >
                    {children}
                </motion.div>
            </main>

            {/* Modal Konfirmasi Password untuk akses Gate */}
            <PasswordConfirmModal
                show={showPasswordModal}
                onClose={() => setShowPasswordModal(false)}
                onConfirm={handlePasswordConfirmed}
                title="Konfirmasi Akses Gate"
                description="Masukkan password petugas untuk membuka layar gate."
            />
        </div>
    );
}
