import { ArrowRight, ChevronDown } from 'lucide-react';
import { useCompany } from '../lib/CompanyProvider';

const heroImage = '/kennydink/court%203.jpg';
const detailImages = [
    '/kennydink/kennydinkhero.jpg',
    '/kennydink/paddle.jpg',
    '/kennydink/net.jpg'
];

function compactBrandName(name = 'KENNYDINK') {
    return name.replace(/pickleball court/gi, '').replace(/[-|].*$/g, '').trim() || 'KENNYDINK';
}

export function Hero() {
    const { company } = useCompany();
    const brand = compactBrandName(company.shortName || company.name);
    const location = company.location || 'Upper Tunga, Moalboal';
    const heroBadge = company.heroBadge || location;
    const heroTitle = (company.heroTitle || `Book your next ${brand}`).trim();
    const heroSubtitle = company.heroSubtitle || 'Check available time slots and reserve before you head to the court.';
    const rawPlayerStat = String(company.heroStatPlayers || '50+ active players');
    const playerStatMatch = rawPlayerStat.match(/^([\d.,+]+)/);
    const playerStat = playerStatMatch ? playerStatMatch[1] : rawPlayerStat;
    const playerLabel = playerStatMatch ? rawPlayerStat.replace(playerStatMatch[1], '').trim() || 'players' : 'players';
    const openStat = company.heroStatDays || 'Open 7 days';

    const scrollToCourts = () => {
        document.getElementById('courts')?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <section id="top" className="relative isolate overflow-hidden bg-[#061617]">
            <div className="relative isolate min-h-svh overflow-hidden bg-[#061617] text-white">
                <img
                    src={heroImage}
                    alt="KennyDink pickleball court framed by trees and netting"
                    className="absolute inset-0 h-full w-full scale-[1.04] object-cover object-center brightness-[0.58] contrast-[1.18] saturate-[0.72] animate-image-drift"
                />

                <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(2,8,8,0.94)_0%,rgba(3,18,20,0.78)_36%,rgba(4,31,34,0.48)_62%,rgba(3,13,13,0.72)_100%)]" aria-hidden="true" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_82%_26%,rgba(34,211,238,0.24),transparent_25rem),radial-gradient(circle_at_22%_78%,rgba(190,242,100,0.18),transparent_25rem)]" aria-hidden="true" />
                <div className="absolute inset-0 opacity-[0.13] bg-[linear-gradient(rgba(255,255,255,0.28)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.2)_1px,transparent_1px)] bg-size-[72px_72px]" aria-hidden="true" />

                <div className="relative z-10 mx-auto flex min-h-svh max-w-385 flex-col px-5 pb-5 pt-24 sm:px-8 sm:pb-7 lg:px-12 lg:pb-8 lg:pt-28 xl:px-14">
                    <div className="flex flex-1 items-center pb-6 pt-6 sm:pb-8 lg:pb-10">
                        <div className="max-w-5xl">
                            <p className="mb-4 max-w-md font-mono text-[0.66rem] font-semibold uppercase tracking-[0.22em] text-white/62 sm:mb-6">
                                {heroBadge}
                            </p>
                            <h1 className="max-w-5xl font-condensed text-[clamp(5rem,12vw,12.4rem)] uppercase leading-[0.74] tracking-normal text-white drop-shadow-[0_18px_50px_rgba(0,0,0,0.32)] sm:text-[clamp(6.5rem,11vw,12.4rem)]">
                                {heroTitle.split('\n').map((line, index) => (
                                    <span key={`${line}-${index}`} className="block">
                                        {line}
                                    </span>
                                ))}
                            </h1>
                        </div>
                    </div>

                    <div className="pointer-events-none absolute inset-x-4 bottom-4 z-0 hidden select-none overflow-hidden sm:inset-x-8 sm:block lg:inset-x-12">
                        <p className="translate-y-[18%] text-right font-condensed text-[clamp(8rem,22vw,24rem)] uppercase leading-none tracking-normal text-white/18 mix-blend-screen">
                            {brand}
                        </p>
                    </div>

                    <div className="relative z-20 grid gap-4 lg:grid-cols-[minmax(19rem,24rem)_1fr_auto] lg:items-end">
                        <div className="rounded-[0.45rem] border border-white/30 bg-[#130f0d]/72 p-5 shadow-[0_26px_70px_-44px_rgba(0,0,0,0.95)] backdrop-blur-sm lg:p-6">
                            <div className="flex items-center gap-3">
                                <span className="font-mono text-[0.63rem] font-bold uppercase tracking-[0.14em] text-secondary">Step 1/3</span>
                                <span className="h-px w-14 bg-secondary" />
                                <span className="h-px w-12 bg-white/24" />
                            </div>
                            <h2 className="mt-5 max-w-60 font-condensed text-4xl uppercase leading-[0.86] tracking-normal text-white sm:text-[2.65rem]">
                                What court are you booking today?
                            </h2>
                            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                                <button
                                    type="button"
                                    onClick={scrollToCourts}
                                    className="group inline-flex min-h-12 flex-1 items-center justify-between rounded-full border border-white/44 bg-white/5 px-5 text-sm font-extrabold text-white transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-white/12 active:scale-[0.98]"
                                >
                                    Choose court
                                    <ChevronDown size={17} className="transition-transform duration-500 group-hover:translate-y-0.5" aria-hidden="true" />
                                </button>
                                <button
                                    type="button"
                                    onClick={scrollToCourts}
                                    className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-white px-6 text-sm font-extrabold text-[#071514] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-secondary active:scale-[0.98]"
                                >
                                    Next
                                    <ArrowRight size={17} className="transition-transform duration-500 group-hover:translate-x-1" aria-hidden="true" />
                                </button>
                            </div>
                            <p className="mt-5 text-sm font-medium leading-6 text-white/72">
                                {heroSubtitle}
                            </p>
                        </div>

                        <div className="hidden lg:block" aria-hidden="true" />

                        <div className="flex items-center justify-between gap-5 rounded-full border border-white/18 bg-black/22 py-3 pl-4 pr-3 backdrop-blur-sm sm:justify-end lg:bg-transparent lg:p-0 lg:backdrop-blur-0">
                            <div className="flex -space-x-3">
                                {detailImages.map((src, index) => (
                                    <div key={src} className="h-11 w-11 overflow-hidden rounded-full border-2 border-white/70 bg-white shadow-[0_14px_28px_-18px_rgba(0,0,0,0.9)] sm:h-12 sm:w-12">
                                        <img src={src} alt="" className="h-full w-full object-cover" style={{ objectPosition: index === 0 ? '50% 76%' : '50% 50%' }} />
                                    </div>
                                ))}
                            </div>
                            <div className="border-r border-white/24 pr-5 text-right sm:min-w-[6.8rem]">
                                <p className="font-condensed text-4xl uppercase leading-none text-white sm:text-5xl">{playerStat}</p>
                                <p className="text-xs font-semibold leading-tight text-white/68">{playerLabel}</p>
                            </div>
                            <div className="hidden h-20 w-20 overflow-hidden rounded-full border border-white/40 bg-white p-1 shadow-[0_22px_48px_-30px_rgba(0,0,0,0.9)] sm:block">
                                <img src="/kennydink/kennydinklogo.jpg" alt={`${brand} logo`} className="h-full w-full rounded-full object-cover" />
                            </div>
                            <p className="hidden max-w-24 text-xs font-semibold leading-tight text-white/68 xl:block">{openStat}</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
