import { Link } from '@inertiajs/react';
import { ArrowRight } from 'lucide-react';
import { useState, useEffect } from 'react';

/**
 * PublicNavbar — Komponen navbar yang dipakai bersama di semua halaman publik.
 * @param {object} auth - Data autentikasi user
 * @param {string} activePage - Halaman yang sedang aktif ('home' | 'about' | 'services' | 'contact')
 */
export default function PublicNavbar({ auth, activePage = 'home' }) {
    // Deteksi scroll untuk efek shrink navbar
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Daftar link navigasi
    const navLinks = [
        { href: '/', label: 'Home', key: 'home' },
        { href: '/about', label: 'About', key: 'about' },
        { href: '/services', label: 'Services', key: 'services' },
        { href: '/contact', label: 'Contact', key: 'contact' },
    ];

    return (
        <nav
            className={`
                fixed top-6 left-1/2 -translate-x-1/2 z-50
                transition-all duration-500 ease-in-out shadow-2xl rounded-full
                flex items-center gap-6 border border-white/20
                ${isScrolled
                    ? 'bg-white/80 backdrop-blur-md py-3 px-8 min-w-[450px]'
                    : 'bg-white/95 backdrop-blur-xl py-2.5 px-10 min-w-[550px]'
                }
            `}
        >
            {/* LOGO SECTION */}
            <Link href="/" className="flex items-center gap-3">
                <img
                    src="/images/hermina_logo.png"
                    alt="Logo"
                    className={`transition-all duration-500 w-auto ${isScrolled ? 'h-9' : 'h-10'}`}
                />
                <div className="flex flex-col justify-center">
                    <span className={`font-bold text-slate-900 tracking-tight leading-none transition-all duration-500 ${isScrolled ? 'text-lg' : 'text-xl'}`}>
                        Hermina
                    </span>
                    <span className={`font-bold text-emerald-600 tracking-widest uppercase leading-none mt-0.5 ${isScrolled ? 'text-[0.6rem]' : 'text-[0.65rem]'}`}>
                        Smart Parking
                    </span>
                </div>
            </Link>

            {/* SPACER */}
            <div className="flex-1"></div>

            {/* NAV LINKS */}
            <div className={`hidden md:flex items-center text-slate-500 font-medium transition-all duration-500 ${isScrolled ? 'text-xs gap-6' : 'text-sm gap-8'}`}>
                {navLinks.map((link) => (
                    <Link
                        key={link.key}
                        href={link.href}
                        className={
                            activePage === link.key
                                ? 'text-emerald-600 font-bold transition-colors'
                                : 'hover:text-emerald-600 transition-colors'
                        }
                    >
                        {link.label}
                    </Link>
                ))}
            </div>

            {/* CTA BUTTON */}
            <Link href={route('login')}>
                <button className={`
                    bg-slate-950 text-white rounded-full font-bold hover:bg-emerald-600 transition-all shadow-lg flex items-center gap-2 uppercase tracking-wide
                    ${isScrolled ? 'px-5 py-2 text-xs' : 'px-6 py-2.5 text-xs'}
                `}>
                    {auth?.user ? 'Dashboard' : 'Login'}
                    <ArrowRight size={16} />
                </button>
            </Link>
        </nav>
    );
}
