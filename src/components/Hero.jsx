import { useState } from 'react';
import { ArrowRight, CalendarDays, ChevronDown, Clock3, MapPin, Users } from 'lucide-react';
import { useCompany } from '../lib/CompanyProvider';

const defaultHeroImage = '/images/court1.jpg';
const fallbackHeroImages = [
    '/images/court1.jpg',
    '/images/court2.jpg'
];

function compactBrandName(name = 'COMPANY') {
    return name.replace(/pickleball court/gi, '').replace(/[-|].*$/g, '').trim() || 'COMPANY';
}

function escapeRegExp(value = '') {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function softenAllCaps(value = '', preserve = '') {
    const text = String(value).trim();
    const letters = text.replace(/[^A-Za-z]/g, '');

    if (letters.length < 4 || letters !== letters.toUpperCase()) {
        return text;
    }

    const brandToken = '%%BRAND%%';
    const withBrandToken = preserve
        ? text.replace(new RegExp(escapeRegExp(preserve), 'gi'), brandToken)
        : text;

    return withBrandToken
        .toLowerCase()
        .replace(/(^|[\s\-/,])([a-z])/g, (_, prefix, letter) => `${prefix}${letter.toUpperCase()}`)
        .replace(/\b(And|At|In|Of|The|For|A|An|To)\b/g, (word) => word.toLowerCase())
        .replace(/%%brand%%/gi, preserve);
}

function getDetailImages(heroImage, images = []) {
    const gallery = images.length > 0 ? images : fallbackHeroImages;

    return gallery
        .filter((src) => src !== heroImage)
        .filter((src, index, allImages) => src && allImages.indexOf(src) === index)
        .slice(0, 3);
}

function LogoBadge({ company, brand }) {
    const [logoFailed, setLogoFailed] = useState(false);
    const initials = (company.initials || brand.slice(0, 2) || 'CT').slice(0, 3).toUpperCase();
    const logoSrc = company.logoUrl && !company.logoUrl.includes('default-logo') && !logoFailed
        ? company.logoUrl
        : '';

    return (
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-[1.15rem] border border-primary-dark/10 bg-white shadow-[0_20px_54px_-38px_rgba(9,31,26,0.72)] sm:h-[4.5rem] sm:w-[4.5rem]">
            {logoSrc ? (
                <img
                    src={logoSrc}
                    alt={`${brand} logo`}
                    className="h-full w-full object-cover"
                    onError={() => setLogoFailed(true)}
                />
            ) : (
                <span className="font-display text-lg font-extrabold text-primary-dark">{initials}</span>
            )}
        </div>
    );
}

export function Hero() {
    const { company } = useCompany();
    const brand = compactBrandName(company.shortName || company.name);
    const heroImage = company.siteImages?.heroBackground || defaultHeroImage;
    const detailImages = getDetailImages(heroImage, company.siteImages?.galleries?.hero);
    const location = company.location || 'Upper Tunga, Moalboal';
    const heroBadge = softenAllCaps(company.heroBadge || location, brand);
    const heroTitle = softenAllCaps(company.heroTitle || `Book your next ${brand}`, brand);
    const heroSubtitle = company.heroSubtitle || 'Check live court availability, pick a time that works, and reserve in a few taps.';
    const rawPlayerStat = String(company.heroStatPlayers || '50+ active players');
    const playerStatMatch = rawPlayerStat.match(/^([\d.,+]+)/);
    const playerStat = playerStatMatch ? playerStatMatch[1] : rawPlayerStat;
    const playerLabel = playerStatMatch ? rawPlayerStat.replace(playerStatMatch[1], '').trim() || 'players' : 'players';
    const openStat = softenAllCaps(company.heroStatDays || 'Open 7 days', brand);
    const marqueeItems = [
        'Live court availability',
        'Reserve in minutes',
        'Friendly local play',
        openStat,
        `${brand} booking`
    ];

    const scrollToCourts = () => {
        document.getElementById('courts')?.scrollIntoView({ behavior: 'smooth' });
    };

    const scrollToOffers = () => {
        document.getElementById('offers')?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <section id="top" className="relative isolate overflow-hidden bg-[#f8ffe8] text-primary-dark">
            <div className="relative isolate min-h-[92svh] overflow-hidden text-primary-dark sm:min-h-[94svh] lg:min-h-svh">
                <img
                    src={heroImage}
                    alt={`${brand} pickleball court ready for play`}
                    className="absolute inset-0 h-full w-full scale-[1.04] object-cover object-center opacity-100 brightness-[1.08] contrast-[1.04] saturate-[1.08] animate-image-drift"
                />

                <div className="absolute inset-0 bg-[linear-gradient(104deg,rgba(255,255,255,0.72)_0%,rgba(255,252,235,0.56)_40%,rgba(237,255,220,0.3)_72%,rgba(218,249,244,0.2)_100%)]" aria-hidden="true" />
                <div className="absolute inset-0 bg-[linear-gradient(rgba(9,31,26,0.034)_1px,transparent_1px),linear-gradient(90deg,rgba(9,31,26,0.028)_1px,transparent_1px)] bg-size-[88px_88px]" aria-hidden="true" />
                <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-[#f8ffe8]/74 via-[#f8ffe8]/34 to-transparent" aria-hidden="true" />

                <div className="relative z-10 mx-auto flex min-h-[92svh] max-w-[1540px] flex-col px-5 pb-4 pt-28 sm:min-h-[94svh] sm:px-8 sm:pt-32 lg:min-h-svh lg:px-12 lg:pt-28 xl:px-14">
                    <div className="flex flex-1 items-center py-8 sm:py-12 lg:py-10">
                        <div className="max-w-5xl">
                            <div className="mb-6 inline-flex max-w-full items-center gap-2 rounded-full border border-primary-dark/10 bg-white/78 px-4 py-2 text-sm font-bold text-primary-dark/68 shadow-[0_18px_58px_-46px_rgba(9,31,26,0.8)] backdrop-blur-xl">
                                <MapPin size={16} className="shrink-0 text-primary" aria-hidden="true" />
                                <span className="truncate">{heroBadge}</span>
                            </div>
                            <h1 className="max-w-5xl text-balance font-display text-[clamp(3.45rem,8.8vw,8.6rem)] font-extrabold leading-[0.9] tracking-normal text-primary-dark drop-shadow-[0_16px_44px_rgba(255,255,255,0.72)]">
                                {heroTitle.split('\n').map((line, index) => (
                                    <span key={`${line}-${index}`} className="block">
                                        {line}
                                    </span>
                                ))}
                            </h1>
                            <p className="mt-6 max-w-2xl text-base font-semibold leading-8 text-primary-dark/68 sm:text-lg">
                                {heroSubtitle}
                            </p>
                            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                                <button
                                    type="button"
                                    onClick={scrollToCourts}
                                    className="group inline-flex min-h-13 items-center justify-center gap-3 rounded-full bg-primary-dark px-6 text-sm font-extrabold text-white shadow-[0_24px_70px_-44px_rgba(9,31,26,0.85)] transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 hover:bg-primary active:scale-[0.98]"
                                >
                                    Book a court
                                    <ArrowRight size={17} className="transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
                                </button>
                                <button
                                    type="button"
                                    onClick={scrollToOffers}
                                    className="group inline-flex min-h-13 items-center justify-center gap-3 rounded-full border border-primary-dark/12 bg-white/82 px-6 text-sm font-extrabold text-primary-dark shadow-[0_20px_58px_-48px_rgba(9,31,26,0.76)] backdrop-blur-xl transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 hover:bg-secondary-light active:scale-[0.98]"
                                >
                                    See offers
                                    <ChevronDown size={17} className="transition-transform duration-300 group-hover:translate-y-0.5" aria-hidden="true" />
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="pointer-events-none absolute inset-x-4 bottom-[6.5rem] z-0 hidden select-none overflow-hidden sm:inset-x-8 sm:block lg:inset-x-12">
                        <p className="translate-y-[18%] text-right font-display text-[clamp(6rem,17vw,18rem)] font-extrabold uppercase leading-none tracking-normal text-primary-dark/[0.055]">
                            {brand}
                        </p>
                    </div>

                    <div className="relative z-20 grid gap-4 pb-4 lg:grid-cols-[minmax(18rem,25rem)_1fr] lg:items-end">
                        <div className="rounded-[1.35rem] border border-white/72 bg-white/78 p-5 shadow-[0_26px_82px_-58px_rgba(9,31,26,0.72)] backdrop-blur-2xl lg:p-6">
                            <div className="flex items-center gap-4">
                                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[0.95rem] bg-secondary-light text-primary-dark">
                                    <CalendarDays size={21} aria-hidden="true" />
                                </span>
                                <div>
                                    <p className="font-mono text-[0.62rem] font-bold uppercase tracking-[0.16em] text-primary-dark/48">Start here</p>
                                    <h2 className="mt-1 text-xl font-extrabold leading-tight text-primary-dark sm:text-2xl">
                                        Pick a court and time
                                    </h2>
                                </div>
                            </div>
                            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                                <button
                                    type="button"
                                    onClick={scrollToCourts}
                                    className="group inline-flex min-h-12 flex-1 items-center justify-between rounded-full border border-primary-dark/12 bg-white px-5 text-sm font-extrabold text-primary-dark shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-secondary-light active:scale-[0.98]"
                                >
                                    Choose court
                                    <ChevronDown size={17} className="transition-transform duration-300 group-hover:translate-y-0.5" aria-hidden="true" />
                                </button>
                                <button
                                    type="button"
                                    onClick={scrollToCourts}
                                    className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-primary-dark px-6 text-sm font-extrabold text-white shadow-[0_18px_42px_-30px_rgba(9,31,26,0.82)] transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-primary active:scale-[0.98]"
                                >
                                    Next
                                    <ArrowRight size={17} className="transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
                                </button>
                            </div>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-3">
                            <div className="rounded-[1.35rem] border border-white/72 bg-white/72 p-4 shadow-[0_24px_72px_-60px_rgba(9,31,26,0.68)] backdrop-blur-2xl">
                                <div className="flex items-center gap-3">
                                    <span className="flex h-10 w-10 items-center justify-center rounded-[0.9rem] bg-primary-dark text-secondary-light">
                                        <Users size={20} aria-hidden="true" />
                                    </span>
                                    <div>
                                        <p className="text-3xl font-extrabold leading-none text-primary-dark">{playerStat}</p>
                                        <p className="mt-1 text-xs font-bold leading-tight text-primary-dark/56">{playerLabel}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="rounded-[1.35rem] border border-white/72 bg-white/72 p-4 shadow-[0_24px_72px_-60px_rgba(9,31,26,0.68)] backdrop-blur-2xl">
                                <div className="flex items-center gap-3">
                                    <span className="flex h-10 w-10 items-center justify-center rounded-[0.9rem] bg-secondary-light text-primary-dark">
                                        <Clock3 size={20} aria-hidden="true" />
                                    </span>
                                    <div>
                                        <p className="text-sm font-extrabold leading-tight text-primary-dark">{openStat}</p>
                                        <p className="mt-1 text-xs font-bold leading-tight text-primary-dark/56">Welcoming play days</p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 rounded-[1.35rem] border border-white/72 bg-white/72 p-4 shadow-[0_24px_72px_-60px_rgba(9,31,26,0.68)] backdrop-blur-2xl">
                                <LogoBadge company={company} brand={brand} />
                                <div className="min-w-0">
                                    <div className="flex -space-x-3">
                                        {detailImages.map((src, index) => (
                                            <div key={src} className="h-10 w-10 overflow-hidden rounded-full border-2 border-white bg-white shadow-[0_14px_30px_-24px_rgba(9,31,26,0.8)]">
                                                <img src={src} alt="" className="h-full w-full object-cover" style={{ objectPosition: index === 0 ? '50% 76%' : '50% 50%' }} />
                                            </div>
                                        ))}
                                    </div>
                                    <p className="mt-2 truncate text-xs font-bold leading-tight text-primary-dark/58">Real venue photos</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="relative z-20 -mx-5 overflow-hidden border-y border-primary-dark/10 bg-white/28 py-3 backdrop-blur-md sm:-mx-8 lg:-mx-12 xl:-mx-14" aria-label="Booking highlights">
                        <div className="flex w-max items-center gap-9 animate-marquee [will-change:transform]" aria-hidden="true">
                            {[...marqueeItems, ...marqueeItems].map((item, index) => (
                                <span key={`${item}-${index}`} className="inline-flex items-center gap-9 whitespace-nowrap font-mono text-[0.66rem] font-semibold uppercase leading-none tracking-[0.22em] text-primary-dark/48">
                                    {item}
                                    <span className="h-px w-10 bg-primary-dark/18" />
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
