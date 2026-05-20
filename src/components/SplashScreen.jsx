import { useEffect, useState } from 'react';
import { useCompany } from '../lib/CompanyProvider';

export function SplashScreen({ onComplete }) {
    const [isFadingOut, setIsFadingOut] = useState(false);
    const { company } = useCompany();

    useEffect(() => {
        document.body.style.overflow = 'hidden';

        const timer1 = setTimeout(() => {
            setIsFadingOut(true);
        }, 1800);

        const timer2 = setTimeout(() => {
            onComplete();
        }, 2450);

        return () => {
            document.body.style.overflow = 'unset';
            clearTimeout(timer1);
            clearTimeout(timer2);
        };
    }, [onComplete]);

    return (
        <div
            className={`fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden bg-primary-dark transition-all duration-700 ease-out ${isFadingOut ? 'scale-105 opacity-0 pointer-events-none' : 'scale-100 opacity-100'}`}
        >
            <div className="absolute left-1/2 top-1/2 h-[32rem] w-[32rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-secondary/18 blur-3xl" aria-hidden="true" />
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/18 to-transparent" aria-hidden="true" />

            <div className="relative flex flex-col items-center px-6 text-center">
                <div className="relative mb-7">
                    <div className="absolute inset-0 rounded-[2rem] bg-secondary/35 blur-2xl" aria-hidden="true" />
                    <div className="relative flex h-24 w-24 rotate-6 items-center justify-center overflow-hidden rounded-[2rem] border border-white/12 bg-white/10 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.22)] backdrop-blur-xl animate-bounce-slow">
                        <span className="text-4xl font-extrabold tracking-tight">{company.initials}</span>
                    </div>
                </div>

                <div className="overflow-hidden">
                    <h1 className="animate-slide-up-fade text-4xl font-extrabold tracking-[-0.05em] text-white sm:text-6xl">
                        {company.name}
                    </h1>
                </div>

                <div className="mt-4 overflow-hidden">
                    <p className="animate-slide-up-fade font-mono text-xs font-semibold uppercase tracking-[0.28em] text-white/60 sm:text-sm" style={{ animationDelay: '160ms', animationFillMode: 'both' }}>
                        Court booking portal
                    </p>
                </div>

                <div className="mt-14 h-1 w-56 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full origin-left rounded-full bg-secondary animate-progress" />
                </div>
            </div>
        </div>
    );
}
