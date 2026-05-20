import { ArrowRight, Menu, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useCompany } from '../lib/CompanyProvider';

const baseNavItems = [
    { href: '#courts', label: 'Courts' },
    { href: '#offers', label: 'Offers' },
    { href: '#contact', label: 'Visit' },
];

function brandLabel(company) {
    return (company.shortName || company.name || 'KennyDink').replace(/pickleball court/gi, '').trim();
}

export function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const [isPastHero, setIsPastHero] = useState(false);
    const { company } = useCompany();
    const brand = brandLabel(company);
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

    const scrollToCourts = () => {
        setIsOpen(false);
        document.getElementById('courts')?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <nav
            className={`inset-x-0 top-0 z-[70] px-4 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] sm:px-6 lg:px-14 ${
                isPastHero ? 'fixed py-3' : 'absolute py-7'
            }`}
            aria-label="Primary navigation"
        >
            <div
                className={`mx-auto flex items-center justify-between gap-5 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                    isPastHero
                        ? 'max-w-[1120px] rounded-full border border-white/16 bg-[#061617]/88 px-3 py-2 shadow-[0_22px_70px_-42px_rgba(0,0,0,0.95)] backdrop-blur-2xl sm:px-4'
                        : 'max-w-[1540px]'
                }`}
            >
                <a href="#top" className="group inline-flex items-start rounded-sm text-white" aria-label={`${company.name} home`}>
                    <span
                        className={`font-condensed uppercase leading-[0.72] tracking-normal drop-shadow-[0_10px_28px_rgba(0,0,0,0.35)] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:-translate-y-0.5 ${
                            isPastHero ? 'text-[2.35rem] sm:text-[2.85rem]' : 'text-[2.9rem] sm:text-[4rem]'
                        }`}
                    >
                        {brand}
                    </span>
                    <span className={`ml-1 font-black uppercase tracking-[0.12em] text-white/76 transition-all duration-500 ${isPastHero ? 'mt-0.5 text-[0.5rem]' : 'mt-1 text-[0.58rem]'}`}>TM</span>
                </a>

                <div className={`hidden items-center rounded-full text-sm font-bold text-white/86 transition-all duration-500 lg:flex ${isPastHero ? 'gap-7 px-3 py-2' : 'gap-9 px-5 py-3'}`}>
                    {navItems.map((item, index) => (
                        <a
                            key={item.href}
                            href={item.href}
                            className={`relative rounded-full transition-colors duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:text-white ${index === 0 ? 'text-white' : ''}`}
                        >
                            {item.label}
                            {index === 0 && <span className="absolute -bottom-3 left-0 h-px w-full bg-white" />}
                        </a>
                    ))}
                </div>

                <div className="hidden items-center gap-3 md:flex">
                    <button
                        type="button"
                        onClick={scrollToCourts}
                        className={`group inline-flex items-center gap-3 rounded-full border border-white/72 bg-white/10 text-sm font-extrabold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.22)] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-white hover:text-[#071514] active:scale-[0.98] ${
                            isPastHero ? 'h-11 px-5' : 'h-14 px-6'
                        }`}
                    >
                        Book a court
                        <ArrowRight size={17} className="transition-transform duration-500 group-hover:translate-x-1" aria-hidden="true" />
                    </button>
                </div>

                <button
                    type="button"
                    onClick={() => setIsOpen((value) => !value)}
                    className={`relative flex items-center justify-center rounded-full border border-white/26 bg-black/20 text-white transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-95 md:hidden ${
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
                    <div className="rounded-[1rem] border border-white/18 bg-[#061617]/94 p-3 text-white shadow-[0_32px_90px_-58px_rgba(0,0,0,0.95)]">
                        {navItems.map((item, index) => (
                            <a
                                key={item.href}
                                href={item.href}
                                onClick={() => setIsOpen(false)}
                                className="block rounded-[0.7rem] px-4 py-3 font-condensed text-4xl uppercase leading-none tracking-normal transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-white/10"
                                style={{ transitionDelay: `${index * 45}ms` }}
                            >
                                {item.label}
                            </a>
                        ))}
                        <button
                            type="button"
                            onClick={scrollToCourts}
                            className="mt-3 inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-full bg-white px-5 text-sm font-extrabold text-[#071514] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98]"
                        >
                            Book a court
                            <ArrowRight size={17} aria-hidden="true" />
                        </button>
                    </div>
                </div>
            )}
        </nav>
    );
}
