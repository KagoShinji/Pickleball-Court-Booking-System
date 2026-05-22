import { ArrowRight, CalendarDays, Menu, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useCompany } from '../lib/CompanyProvider';

const baseNavItems = [
    { href: '#courts', label: 'Courts' },
    { href: '#offers', label: 'Offers' },
    { href: '#contact', label: 'Visit' },
];
const navLogo = '/images/pplogo.jpg';

function brandLabel(company) {
    return (company.shortName || company.name || 'Company').replace(/pickleball court/gi, '').trim() || 'Company';
}

function BrandMark({ brand, compact, logoUrl, initials: propInitials }) {
    const [logoFailed, setLogoFailed] = useState(false);
    const { company } = useCompany();
    const initials = propInitials || company.initials || (brand.slice(0, 2) || 'PP').slice(0, 3).toUpperCase();
    
    useEffect(() => {
        setLogoFailed(false);
    }, [logoUrl]);

    const logoSrc = logoFailed ? '' : (logoUrl || navLogo);

    return (
        <span
            className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-primary-dark/10 bg-secondary-light text-primary-dark shadow-[inset_0_1px_0_rgba(255,255,255,0.88)] transition-all duration-300 ${
                compact ? 'h-9 w-9' : 'h-11 w-11'
            }`}
            aria-hidden="true"
        >
            {logoSrc ? (
                <img
                    src={logoSrc}
                    alt=""
                    className="h-full w-full object-cover"
                    onError={() => setLogoFailed(true)}
                />
            ) : (
                <span className={`font-display font-extrabold ${compact ? 'text-xs' : 'text-sm'}`}>{initials}</span>
            )}
        </span>
    );
}

export function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const [isPastHero, setIsPastHero] = useState(false);
    const { company, loading } = useCompany();
    const brand = brandLabel(company);
    const logoUrl = company.logoUrl || company.siteImages?.logoUrl || navLogo;
    const navItems = company.parkingEnabled !== false
        ? [...baseNavItems, { href: '#parking', label: 'Parking' }]
        : baseNavItems;

    useEffect(() => {
        const updateScrollState = () => {
            const hero = document.getElementById('top');
            const threshold = hero ? Math.max(96, hero.offsetHeight - 88) : 96;
            const nextIsPastHero = window.scrollY >= threshold;
            setIsPastHero((current) => (current === nextIsPastHero ? current : nextIsPastHero));
        };

        updateScrollState();
        window.addEventListener('scroll', updateScrollState, { passive: true });
        window.addEventListener('resize', updateScrollState);

        return () => {
            window.removeEventListener('scroll', updateScrollState);
            window.removeEventListener('resize', updateScrollState);
        };
    }, []);

    if (loading) {
        return (
            <nav
                className="inset-x-0 top-0 z-[70] px-4 absolute py-5 sm:px-6 lg:px-14"
                aria-label="Primary navigation loading"
            >
                <div className="mx-auto flex items-center justify-between gap-4 max-w-[1540px] px-0 py-0">
                    <div className="flex items-center gap-3 pr-2">
                        {/* Circular skeleton for logo */}
                        <div className="h-11 w-11 shrink-0 rounded-full bg-primary-dark/10 animate-pulse" />
                        <div className="flex flex-col gap-1.5">
                            {/* Text skeleton for brand */}
                            <div className="h-5 w-28 rounded bg-primary-dark/10 animate-pulse" />
                            <div className="h-3 w-16 rounded bg-primary-dark/10 animate-pulse" />
                        </div>
                    </div>
                    {/* Skeletal nav items */}
                    <div className="hidden lg:flex items-center gap-4">
                        <div className="h-8 w-16 rounded-full bg-primary-dark/10 animate-pulse" />
                        <div className="h-8 w-16 rounded-full bg-primary-dark/10 animate-pulse" />
                        <div className="h-8 w-16 rounded-full bg-primary-dark/10 animate-pulse" />
                    </div>
                    {/* Button skeleton */}
                    <div className="hidden md:block">
                        <div className="h-12 w-32 rounded-full bg-primary-dark/10 animate-pulse" />
                    </div>
                </div>
            </nav>
        );
    }

    const scrollToCourts = () => {
        setIsOpen(false);
        document.getElementById('courts')?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <nav
            className={`inset-x-0 top-0 z-[70] px-4 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] sm:px-6 lg:px-14 ${
                isPastHero ? 'fixed py-3' : 'absolute py-5'
            }`}
            aria-label="Primary navigation"
        >
            <div
                className={`mx-auto flex items-center justify-between gap-4 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                    isPastHero
                        ? 'max-w-[1120px] rounded-full border border-primary-dark/10 bg-white/88 px-3 py-2 shadow-[0_24px_86px_-62px_rgba(9,31,26,0.7)] backdrop-blur-2xl sm:px-4'
                        : 'max-w-[1540px] px-0 py-0'
                }`}
            >
                <a
                    href="#top"
                    className="group inline-flex min-w-0 items-center gap-3 rounded-full pr-2 text-primary-dark transition-transform duration-300 hover:-translate-y-0.5"
                    aria-label={`${company.name} home`}
                    onClick={() => setIsOpen(false)}
                >
                    <BrandMark brand={brand} compact={isPastHero} logoUrl={logoUrl} />
                    <span className="min-w-0">
                        <span className={`block truncate font-display font-extrabold leading-none tracking-normal text-primary-dark transition-all duration-300 ${isPastHero ? 'max-w-[8.5rem] text-base sm:max-w-[13rem] sm:text-lg' : 'max-w-[9.5rem] text-lg sm:max-w-[15rem] sm:text-xl'}`}>
                            {brand}
                        </span>
                        <span className="mt-1 hidden text-[0.66rem] font-bold leading-none text-primary-dark/48 sm:block">
                            Court booking
                        </span>
                    </span>
                </a>

                <div
                    className={`hidden items-center rounded-full text-sm font-extrabold text-primary-dark/62 transition-all duration-500 lg:flex ${
                        isPastHero
                            ? 'gap-2 border border-primary-dark/8 bg-white/56 px-2 py-1.5'
                            : 'gap-3 border border-transparent bg-transparent px-0 py-0'
                    }`}
                >
                    {navItems.map((item, index) => (
                        <a
                            key={item.href}
                            href={item.href}
                            className={`rounded-full px-4 py-2 transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-secondary-light hover:text-primary-dark ${
                                index === 0 ? 'bg-primary-dark text-white shadow-[0_14px_30px_-24px_rgba(9,31,26,0.76)]' : ''
                            }`}
                        >
                            {item.label}
                        </a>
                    ))}
                </div>

                <div className="hidden items-center gap-3 md:flex">
                    <button
                        type="button"
                        onClick={scrollToCourts}
                        className={`group inline-flex items-center gap-3 rounded-full bg-primary-dark text-sm font-extrabold text-white shadow-[0_20px_54px_-36px_rgba(9,31,26,0.78)] transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 hover:bg-primary active:scale-[0.98] ${
                            isPastHero ? 'h-11 px-5' : 'h-12 px-5 sm:h-13 sm:px-6'
                        }`}
                    >
                        <CalendarDays size={17} aria-hidden="true" />
                        Book a court
                        <ArrowRight size={17} className="transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
                    </button>
                </div>

                <button
                    type="button"
                    onClick={() => setIsOpen((value) => !value)}
                    className={`relative flex items-center justify-center rounded-full border border-primary-dark/10 bg-white/78 text-primary-dark shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-95 md:hidden ${
                        isPastHero ? 'h-10 w-10' : 'h-12 w-12'
                    }`}
                    aria-label="Toggle navigation menu"
                    aria-expanded={isOpen}
                >
                    {isOpen ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
                </button>
            </div>

            {isOpen && (
                <div className="mx-auto mt-4 max-w-[1540px] md:hidden">
                    <div className="rounded-[1.35rem] border border-primary-dark/10 bg-white/94 p-3 text-primary-dark shadow-[0_32px_90px_-58px_rgba(9,31,26,0.72)] backdrop-blur-2xl">
                        {navItems.map((item, index) => (
                            <a
                                key={item.href}
                                href={item.href}
                                onClick={() => setIsOpen(false)}
                                className="block rounded-[1rem] px-4 py-3 text-xl font-extrabold leading-tight tracking-normal transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-secondary-light"
                                style={{ transitionDelay: `${index * 45}ms` }}
                            >
                                {item.label}
                            </a>
                        ))}
                        <button
                            type="button"
                            onClick={scrollToCourts}
                            className="mt-3 inline-flex min-h-13 w-full items-center justify-center gap-2 rounded-full bg-primary-dark px-5 text-sm font-extrabold text-white transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-primary active:scale-[0.98]"
                        >
                            <CalendarDays size={17} aria-hidden="true" />
                            Book a court
                            <ArrowRight size={17} aria-hidden="true" />
                        </button>
                    </div>
                </div>
            )}
        </nav>
    );
}
