import { useEffect, useState } from 'react';
import { useCompany } from '../lib/CompanyProvider';

export function SplashScreen({ onComplete }) {
    const [isFadingOut, setIsFadingOut] = useState(false);
    const [logoFailed, setLogoFailed] = useState(false);
    const { company } = useCompany();
    const logoSrc = company.logoUrl && !company.logoUrl.includes('default-logo')
        ? company.logoUrl
        : '/kennydink/kennydinklogo.jpg';
    const venueLocation = company.location || 'Pickleball court booking';

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
            role="status"
            aria-live="polite"
            data-splash-state={isFadingOut ? 'leaving' : 'entering'}
            className={`fixed inset-0 z-[100] grid place-items-center overflow-hidden bg-[#fbfaf6] px-5 text-primary-dark transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${isFadingOut ? 'scale-[1.01] opacity-0 pointer-events-none' : 'scale-100 opacity-100'}`}
        >
            <div className="pointer-events-none absolute inset-x-8 top-8 border-t border-primary-dark/8" aria-hidden="true" />
            <div className="pointer-events-none absolute inset-x-8 bottom-8 border-t border-primary-dark/8" aria-hidden="true" />

            <div className="splash-rise relative z-10 flex w-full max-w-sm flex-col items-center text-center">
                <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-xl border border-[#eaeaea] bg-white text-primary-dark">
                    {!logoFailed ? (
                        <img
                            src={logoSrc}
                            alt=""
                            className="h-full w-full object-cover"
                            onError={() => setLogoFailed(true)}
                        />
                    ) : (
                        <span className="font-display text-3xl font-extrabold tracking-[-0.04em]">
                            {company.initials}
                        </span>
                    )}
                </div>

                <div className="mt-8">
                    <p className="font-mono text-[0.66rem] font-semibold uppercase tracking-[0.22em] text-primary-dark/45">
                        Booking portal
                    </p>
                    <h1 className="mt-3 font-display text-[clamp(2.4rem,10vw,4rem)] font-extrabold leading-[0.9] tracking-[-0.055em] text-primary-dark">
                        {company.shortName || company.name}
                    </h1>
                    <p className="mx-auto mt-4 max-w-xs text-sm leading-6 text-primary-dark/58">
                        {venueLocation}
                    </p>
                </div>

                <div className="mt-10 w-full max-w-64">
                    <div className="h-px overflow-hidden bg-primary-dark/10">
                        <div className="splash-progress h-full origin-left bg-primary-dark" />
                    </div>
                </div>

                <span className="sr-only">Loading {company.name} court booking portal.</span>
            </div>
        </div>
    );
}
