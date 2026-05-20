import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from './ui';
import { useCompany } from '../lib/CompanyProvider';

const KENNYDINK_IMAGES = [
    {
        src: '/kennydink/court%203.jpg',
        title: 'Blue court, open air',
        subtitle: 'A breezy outdoor court framed by trees and warm Cebu light.'
    },
    {
        src: '/kennydink/net.jpg',
        title: 'Through the net',
        subtitle: 'Textured court details with depth, shade, and movement.'
    },
    {
        src: '/kennydink/paddle.jpg',
        title: 'Ready at the baseline',
        subtitle: 'Paddle, ball, and court details made for focused play.'
    },
    {
        src: '/kennydink/kennydinkhero.jpg',
        title: 'Kenny Dink court',
        subtitle: 'Play where the breeze meets the game.'
    }
];

export function Hero() {
    const { company } = useCompany();
    const [currentSlide, setCurrentSlide] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % KENNYDINK_IMAGES.length);
        }, 5200);
        return () => clearInterval(timer);
    }, []);

    const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % KENNYDINK_IMAGES.length);
    const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + KENNYDINK_IMAGES.length) % KENNYDINK_IMAGES.length);
    const heroTitle = 'Play where the breeze meets the game.';
    const heroSubtitle = `${company.name} keeps court booking fast, calm, and visual. Choose a court, pick your time, and arrive ready to play.`;

    return (
        <section id="top" className="relative isolate min-h-[100dvh] overflow-hidden bg-primary-dark text-white lg:h-[100dvh] lg:min-h-[720px]">
            <div className="absolute inset-0" aria-hidden="true">
                {KENNYDINK_IMAGES.map((image, index) => (
                    <img
                        key={image.src}
                        src={image.src}
                        alt=""
                        className={`absolute inset-0 h-full w-full object-cover transition-all duration-[1400ms] ease-[cubic-bezier(0.32,0.72,0,1)] ${index === currentSlide ? 'opacity-100 animate-image-drift' : 'opacity-0 scale-105'}`}
                    />
                ))}
                <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(6,22,19,0.92)_0%,rgba(6,22,19,0.78)_36%,rgba(6,22,19,0.22)_70%,rgba(6,22,19,0.5)_100%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_24%_16%,rgba(185,255,63,0.22),transparent_25rem),radial-gradient(circle_at_78%_70%,rgba(0,170,220,0.22),transparent_30rem)]" />
            </div>

            <div className="relative z-10 mx-auto flex min-h-[100dvh] max-w-[1500px] flex-col px-4 pb-7 pt-24 sm:px-6 lg:h-[100dvh] lg:min-h-[720px] lg:px-8 lg:pt-24 xl:pt-28">
                <div className="grid flex-1 gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
                    <div className="max-w-[52rem] pb-4 lg:pb-8">
                        <div className="mb-5 flex w-fit items-center gap-3 rounded-full border border-white/14 bg-white/8 px-3 py-2 text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-white/72 shadow-[inset_0_1px_0_rgba(255,255,255,0.14)]">
                            <span className="h-2 w-2 rounded-full bg-secondary shadow-[0_0_22px_rgba(185,255,63,0.78)]" />
                            {company.location || 'Pickleball court booking'}
                        </div>

                        <h1 className="max-w-[52rem] text-balance font-display text-[clamp(3.2rem,5.15vw,6rem)] font-extrabold leading-[0.9] tracking-[-0.068em] text-white">
                            {heroTitle}
                        </h1>

                        <div className="mt-6 grid max-w-3xl gap-5 md:grid-cols-[1fr_auto] md:items-end">
                            <p className="max-w-lg text-sm leading-7 text-white/72 sm:text-base">
                                {heroSubtitle}
                            </p>
                            <div className="flex flex-col gap-3 sm:flex-row md:flex-col">
                                <Button
                                    size="lg"
                                    className="group bg-secondary text-primary-dark hover:bg-white"
                                    onClick={() => document.getElementById('courts')?.scrollIntoView({ behavior: 'smooth' })}
                                >
                                    Book a court
                                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-dark/10 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-1 group-hover:-translate-y-0.5">
                                        <ArrowRight size={16} aria-hidden="true" />
                                    </span>
                                </Button>
                                <a
                                    href="#contact"
                                    className="inline-flex items-center justify-center rounded-full px-6 py-3.5 text-sm font-bold text-white/86 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-white/10 active:scale-[0.98]"
                                >
                                    Venue details
                                </a>
                            </div>
                        </div>
                    </div>

                    <div className="relative hidden h-[min(54dvh,34rem)] min-h-[30rem] lg:block">
                        <div className="premium-shell absolute right-0 top-0 h-[62%] w-[48%] rounded-[2.6rem] p-2 rotate-[4deg]">
                            <div className="relative h-full overflow-hidden rounded-[2.05rem] bg-white">
                                <img src="/kennydink/kennydinkhero.jpg" alt="Kenny Dink court banner and paddle" className="h-full w-full object-cover" />
                                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-primary-dark/82 to-transparent p-5 pt-16">
                                    <p className="font-mono text-[0.64rem] font-semibold uppercase tracking-[0.18em] text-white/80">Breeze meets play</p>
                                </div>
                            </div>
                        </div>

                        <div className="premium-shell absolute left-[7%] top-[42%] h-[38%] w-[26%] rounded-[2.1rem] p-2 rotate-[-7deg]">
                            <div className="relative h-full overflow-hidden rounded-[1.65rem] bg-white">
                                <img src="/kennydink/paddle.jpg" alt="Pickleball paddle and ball on court" className="h-full w-full object-cover" />
                                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-primary-dark/80 to-transparent p-4 pt-14">
                                    <p className="font-mono text-[0.58rem] font-semibold uppercase tracking-[0.18em] text-white/80">Paddle ready</p>
                                </div>
                            </div>
                        </div>

                        <div className="premium-shell absolute bottom-[7%] right-[3%] w-[min(28rem,48vw)] rounded-[2.6rem] p-2 animate-float-soft" style={{ '--float-rotate': '-1.5deg' }}>
                            <div className="rounded-[2.05rem] bg-white p-5 text-primary-dark shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] sm:p-6">
                                <div className="flex items-start justify-between gap-5">
                                    <div>
                                        <p className="font-mono text-[0.64rem] font-semibold uppercase tracking-[0.18em] text-primary/70">Currently showing</p>
                                        <h2 className="mt-2 font-display text-3xl font-extrabold leading-none tracking-[-0.045em]">{KENNYDINK_IMAGES[currentSlide]?.title}</h2>
                                        <p className="mt-3 max-w-xs text-sm leading-6 text-stone-600">{KENNYDINK_IMAGES[currentSlide]?.subtitle}</p>
                                    </div>
                                    <div className="hidden h-24 w-24 shrink-0 overflow-hidden rounded-[1.45rem] bg-stone-100 sm:block">
                                        <img src={KENNYDINK_IMAGES[currentSlide]?.src} alt="" className="h-full w-full object-cover" />
                                    </div>
                                </div>
                                <div className="mt-5 flex items-center justify-between">
                                    <div className="flex gap-1.5">
                                        {KENNYDINK_IMAGES.map((_, index) => (
                                            <button
                                                key={index}
                                                type="button"
                                                onClick={() => setCurrentSlide(index)}
                                                className={`h-2 rounded-full transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${index === currentSlide ? 'w-8 bg-primary-dark' : 'w-2 bg-primary-dark/18 hover:bg-primary-dark/34'}`}
                                                aria-label={`Show hero image ${index + 1}`}
                                            />
                                        ))}
                                    </div>
                                    <div className="flex gap-2">
                                        <HeroArrow label="Previous image" onClick={prevSlide}>
                                            <ChevronLeft size={16} aria-hidden="true" />
                                        </HeroArrow>
                                        <HeroArrow label="Next image" onClick={nextSlide}>
                                            <ChevronRight size={16} aria-hidden="true" />
                                        </HeroArrow>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="relative mt-auto overflow-hidden border-y border-white/12 py-3 text-white/54">
                    <div className="flex w-max animate-marquee gap-10 font-mono text-xs font-semibold uppercase tracking-[0.22em]">
                        {Array.from({ length: 2 }).map((_, group) => (
                            <div key={group} className="flex gap-10">
                                <span>Open air court</span>
                                <span>Fast reservations</span>
                                <span>Clear time slots</span>
                                <span>Private games</span>
                                <span>Community rallies</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}

function HeroArrow({ children, label, onClick }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-dark text-white transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:scale-105 active:scale-95"
            aria-label={label}
        >
            {children}
        </button>
    );
}
