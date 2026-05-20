import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from './ui';
import { useCompany } from '../lib/CompanyProvider';

const navItems = [
    { href: '#courts', label: 'Courts' },
    { href: '#offers', label: 'Amenities' },
    { href: '#contact', label: 'Visit' },
];

export function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const { company } = useCompany();

    const scrollToCourts = () => {
        setIsOpen(false);
        document.getElementById('courts')?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <nav className="fixed inset-x-0 top-0 z-50 px-3 py-5 sm:px-6" aria-label="Primary navigation">
            <div className="glass-panel mx-auto flex max-w-6xl items-center justify-between gap-3 rounded-full px-3 py-2">
                <a href="#top" className="flex min-w-0 items-center gap-3 rounded-full pr-2" aria-label={`${company.name} home`}>
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white p-1 shadow-[0_18px_34px_-24px_rgba(9,31,26,0.9)]">
                        <img src="/kennydink/kennydinklogo.jpg" alt={`${company.name} logo`} className="h-full w-full rounded-full object-cover" />
                    </div>
                    <div className="min-w-0 pr-2">
                        <span className="block truncate font-display text-base font-extrabold tracking-[-0.04em] text-primary-dark sm:text-lg">
                            {company.name}
                        </span>
                        <span className="hidden truncate font-mono text-[0.58rem] font-semibold uppercase tracking-[0.18em] text-stone-500 sm:block">
                            Reserve courts fast
                        </span>
                    </div>
                </a>

                <div className="hidden items-center rounded-full border border-stone-900/8 bg-white/50 p-1 md:flex">
                    {navItems.map((item) => (
                        <a
                            key={item.href}
                            href={item.href}
                            className="rounded-full px-4 py-2 text-sm font-bold text-stone-600 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-primary-dark hover:text-white"
                        >
                            {item.label}
                        </a>
                    ))}
                </div>

                <div className="hidden items-center gap-3 md:flex">
                    <div className="hidden max-w-[190px] truncate rounded-full bg-white/50 px-3 py-2 font-mono text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-stone-500 lg:block">
                        {company.location}
                    </div>
                    <Button size="sm" onClick={scrollToCourts} className="bg-primary-dark text-white hover:bg-primary">
                        Book now
                    </Button>
                </div>

                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className="relative flex h-11 w-11 items-center justify-center rounded-full bg-primary-dark text-white transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-95 md:hidden"
                    aria-label="Toggle navigation menu"
                    aria-expanded={isOpen}
                >
                    {isOpen ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
                </button>
            </div>

            {isOpen && (
                <div className="mx-auto mt-3 max-w-6xl px-1 md:hidden">
                    <div className="rounded-[2rem] border border-white/16 bg-primary-dark/94 p-3 text-white shadow-[0_36px_100px_-64px_rgba(9,31,26,0.9)] backdrop-blur-3xl">
                        {navItems.map((item, index) => (
                            <a
                                key={item.href}
                                href={item.href}
                                onClick={() => setIsOpen(false)}
                                className="block rounded-[1.4rem] px-5 py-4 font-display text-3xl font-extrabold tracking-[-0.05em] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-white/10"
                                style={{ transitionDelay: `${index * 45}ms` }}
                            >
                                {item.label}
                            </a>
                        ))}
                        <div className="p-2 pt-4">
                            <Button onClick={scrollToCourts} className="w-full bg-secondary text-primary-dark hover:bg-white">
                                Book now
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
}
