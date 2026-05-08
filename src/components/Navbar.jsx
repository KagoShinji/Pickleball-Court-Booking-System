import { MapPin, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from './ui';
import { useCompany } from '../lib/CompanyProvider';

export function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const { company } = useCompany();

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 glass-panel border-b border-white/50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center gap-2">
                        <div className="bg-secondary p-1.5 rounded-lg rotate-3 shadow-sm shadow-secondary/20">
                            <span className="text-white font-bold text-lg">{company.initials}</span>
                        </div>
                        <span className="font-display font-bold text-xl tracking-tight text-primary-dark">
                            {company.name}<span className="text-secondary">.</span>
                        </span>
                    </div>

                    <div className="hidden md:block">
                        <div className="ml-10 flex items-baseline space-x-8 text-gray-600">
                            <a href="#courts" className="font-medium hover:text-secondary transition-colors">Courts</a>
                            <a href="#offers" className="font-medium hover:text-secondary transition-colors">Offers</a>
                            <a href="#contact" className="font-medium hover:text-secondary transition-colors">Contact</a>
                        </div>
                    </div>

                    <div className="hidden md:flex items-center gap-4">
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                            <MapPin size={16} className="text-primary" />
                            <span className="max-w-[200px] truncate">{company.location}</span>
                        </div>
                    </div>

                    <div className="-mr-2 flex md:hidden">
                        <button onClick={() => setIsOpen(!isOpen)} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                            {isOpen ? <X /> : <Menu />}
                        </button>
                    </div>
                </div>
            </div>

            {isOpen && (
                <div className="md:hidden bg-bg-user border-t border-gray-100 animate-in slide-in-from-top duration-200">
                    <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                        <a
                            href="#courts"
                            onClick={() => setIsOpen(false)}
                            className="block px-3 py-3 rounded-xl text-base font-medium hover:bg-gray-50 text-gray-700"
                        >
                            Courts
                        </a>
                        <a
                            href="#offers"
                            onClick={() => setIsOpen(false)}
                            className="block px-3 py-3 rounded-xl text-base font-medium hover:bg-gray-50 text-gray-700"
                        >
                            Offers
                        </a>
                        <a
                            href="#contact"
                            onClick={() => setIsOpen(false)}
                            className="block px-3 py-3 rounded-xl text-base font-medium hover:bg-gray-50 text-gray-700"
                        >
                            Contact
                        </a>
                        <div className="pt-2">
                            <Button
                                onClick={() => {
                                    setIsOpen(false);
                                    document.getElementById('courts')?.scrollIntoView({ behavior: 'smooth' });
                                }}
                                className="w-full text-white shadow-lg shadow-primary/20"
                            >
                                Book Now
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
}