import { Car } from 'lucide-react';
import { LazyMapEmbed } from './LazyMapEmbed';
import { useCompany } from '../lib/CompanyProvider';

export function Parking() {
    const { company } = useCompany();
    const content = company.sectionContent?.parking || {};
    const parkingImage = company.siteImages?.sectionBackgrounds?.parking || '/images/court2.jpg';

    const isInside = company.parkingIsInside === true;
    const mapLink = company.parkingMapLink || company.location || company.mapQuery || '';
    const mapSrc = `https://www.google.com/maps?q=${encodeURIComponent(mapLink)}&output=embed`;

    return (
        <section id="parking" className="sport-section sport-section-parking flex items-center py-16 sm:py-20 lg:py-24">
            <p className="pointer-events-none absolute -bottom-6 right-4 z-1 hidden select-none font-display text-[clamp(5rem,14vw,15rem)] font-extrabold uppercase leading-none text-primary-dark/4.5 sm:block lg:right-12">
                Parking
            </p>

            <div className="mx-auto w-full max-w-385 px-5 sm:px-8 lg:px-12 xl:px-14">
                <div className="venue-panel overflow-hidden rounded-xl p-2">
                    <div className="grid gap-0 overflow-hidden rounded-[0.55rem] border border-primary-dark/10 bg-white/72 lg:grid-cols-[0.58fr_1.42fr]">
                        <div className="relative overflow-hidden p-6 text-primary-dark sm:p-8 lg:p-9">
                            <img src={parkingImage} alt="" className="absolute inset-0 h-full w-full object-cover opacity-24 brightness-[1.04] contrast-[1.08] saturate-[1.06]" />
                            <div className="absolute inset-0 bg-linear-to-r from-[#fff8e7]/96 via-[#fff8e7]/84 to-[#fff8e7]/58" aria-hidden="true" />
                            <div className="relative z-1">
                                <span className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-primary-dark/10 bg-primary-dark text-secondary">
                                    <Car size={27} aria-hidden="true" />
                                </span>
                                <h3 className="mt-6 text-balance font-display text-[clamp(3rem,5vw,6rem)] font-extrabold leading-[0.9] tracking-normal">
                                    {content.title || 'Easy arrival, day or night.'}
                                </h3>
                                <p className="mt-5 max-w-md text-sm font-semibold leading-7 text-primary-dark/62">
                                    {content.description || 'Keep arrival details clear without forcing every venue into the same parking layout.'}
                                </p>
                            </div>
                        </div>

                        {isInside ? (
                            <div className="relative flex flex-col justify-center bg-[linear-gradient(135deg,rgba(255,253,244,0.92),rgba(241,255,212,0.78),rgba(218,246,242,0.76))] p-6 text-primary-dark lg:p-9">
                                <div className="w-full max-w-xl mx-auto rounded-[1.25rem] border border-primary-dark/10 bg-white/84 p-5 shadow-[0_22px_76px_-50px_rgba(9,31,26,0.6)] backdrop-blur-md sm:p-7 space-y-5">
                                    <div className="flex items-center gap-3">
                                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-secondary">
                                            <Car size={20} aria-hidden="true" />
                                        </span>
                                        <div>
                                            <span className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-secondary">On-Site Facility</span>
                                            <h4 className="mt-0.5 text-lg font-bold tracking-tight text-primary-dark">Premium Direct Parking</h4>
                                        </div>
                                    </div>
                                    <p className="text-sm font-semibold leading-6 text-primary-dark/72">
                                        No external walk required. Park directly inside the court facility. The venue features secure, well-lit, and spacious parking slots reserved exclusively for booked players and guests.
                                    </p>
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <div className="rounded-xl border border-primary-dark/8 bg-primary-light/50 p-2.5">
                                            <p className="font-display text-xs font-extrabold text-primary uppercase tracking-wider">Direct Court Access</p>
                                            <p className="mt-1 text-[11px] font-semibold text-primary-dark/62">Park and walk straight to your court in less than 30 seconds.</p>
                                        </div>
                                        <div className="rounded-xl border border-primary-dark/8 bg-primary-light/50 p-2.5">
                                            <p className="font-display text-xs font-extrabold text-primary uppercase tracking-wider">Secure & Well-Lit</p>
                                            <p className="mt-1 text-[11px] font-semibold text-primary-dark/62">24/7 security presence and premium illumination for night rallies.</p>
                                        </div>
                                        <div className="rounded-xl border border-primary-dark/8 bg-primary-light/50 p-2.5">
                                            <p className="font-display text-xs font-extrabold text-primary uppercase tracking-wider">Complimentary</p>
                                            <p className="mt-1 text-[11px] font-semibold text-primary-dark/62">Always 100% free for all registered pickleball players and matches.</p>
                                        </div>
                                        <div className="rounded-xl border border-primary-dark/8 bg-primary-light/50 p-2.5">
                                            <p className="font-display text-xs font-extrabold text-primary uppercase tracking-wider">Spacious Slots</p>
                                            <p className="mt-1 text-[11px] font-semibold text-primary-dark/62">Extra wide spaces to safely accommodate SUVs, sedans, and vans.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="p-6 sm:p-8 lg:p-9 flex flex-col justify-center bg-[linear-gradient(135deg,rgba(255,253,244,0.92),rgba(241,255,212,0.78),rgba(218,246,242,0.76))]">
                                <div className="mb-4 flex items-start gap-3">
                                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-primary-dark/10 bg-primary-dark text-secondary">
                                        <Car size={20} />
                                    </div>
                                    <div>
                                        <span className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-secondary">Parking Pinpoint</span>
                                        <h4 className="mt-1 text-lg font-bold tracking-tight text-primary-dark">{company.shortName || company.name || 'Venue'} Parking Lot</h4>
                                    </div>
                                </div>
                                <LazyMapEmbed
                                    src={mapSrc}
                                    title={`${company.shortName || company.name || 'Venue'} Parking Lot map`}
                                    description="Open the Google Maps pinpoint to locate the dedicated parking lot."
                                    buttonLabel="Show parking map"
                                    aspectClassName="min-h-[260px] sm:min-h-[300px] lg:min-h-[340px]"
                                    className="rounded-lg border-primary-dark/10 shadow-inner"
                                />
                                {mapLink && (
                                    <p className="mt-3 text-center text-xs font-semibold text-primary-dark/52">
                                        Target Pin: {mapLink}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}
