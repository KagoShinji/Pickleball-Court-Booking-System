import { Clock, Facebook, Instagram, Mail, MapPin, Phone } from 'lucide-react';
import { LazyMapEmbed } from './LazyMapEmbed';
import { useCompany } from '../lib/CompanyProvider';

function getOperatingDaysText(openDays) {
    if (!openDays || openDays.length === 7) return "Open 7 Days a Week";
    const shortDaysMap = { 1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri', 6: 'Sat', 0: 'Sun' };
    
    const sortedLogical = [...openDays].sort((a, b) => {
        const orderA = a === 0 ? 7 : a;
        const orderB = b === 0 ? 7 : b;
        return orderA - orderB;
    });
    
    const isMonFri = openDays.length === 5 && [1, 2, 3, 4, 5].every(d => openDays.includes(d));
    if (isMonFri) return "Open Monday - Friday";
    
    const isMonSat = openDays.length === 6 && [1, 2, 3, 4, 5, 6].every(d => openDays.includes(d));
    if (isMonSat) return "Open Monday - Saturday";
    
    const names = sortedLogical.map(d => shortDaysMap[d]);
    return `Open: ${names.join(', ')}`;
}

export function Contact() {
    const { company } = useCompany();
    const content = company.sectionContent?.contact || {};
    const eventImage = company.siteImages?.sectionBackgrounds?.contact
        || company.siteImages?.sectionBackgrounds?.parking
        || '/images/court1.jpg';

    return (
        <section id="contact" className="sport-section sport-section-contact flex w-full items-center py-16 sm:py-20 lg:py-24">
            <p className="pointer-events-none absolute left-4 top-4 z-1 hidden select-none font-display text-[clamp(5rem,14vw,15rem)] font-extrabold uppercase leading-none text-primary-dark/4.5 sm:block lg:left-12">
                Visit
            </p>

            <div className="mx-auto w-full max-w-385 px-5 sm:px-8 lg:px-12 xl:px-14">
                <div className="mb-8 grid gap-5 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
                    <div className="lg:order-2 lg:justify-self-end lg:text-right">
                        <span className="section-kicker">{content.kicker || 'Visit the venue'}</span>
                        <h2 className="mt-4 max-w-136 text-balance font-display text-[clamp(3rem,5.8vw,6.9rem)] font-extrabold leading-[0.9] tracking-normal text-primary-dark">
                            {content.title || 'Find us before the first serve.'}
                        </h2>
                    </div>
                    <p className="max-w-2xl text-sm font-semibold leading-7 text-primary-dark/62 lg:order-1">
                        {content.description || 'Contact, hours, and directions stay venue-specific while the booking flow stays fast and familiar.'}
                    </p>
                </div>

                <div className={`grid ${company.parkingEnabled !== false ? 'lg:grid-cols-[0.82fr_1.18fr]' : 'max-w-2xl'} gap-6 lg:gap-8`}>
                    <div className="space-y-5">
                        <div className="venue-panel rounded-[0.65rem] p-5 sm:p-7">
                            <h3 className="font-display text-3xl font-extrabold leading-[0.95] tracking-normal text-primary-dark sm:text-4xl">{content.contactTitle || 'Contact information'}</h3>

                            <div className="mt-6 grid gap-3">
                                <ContactRow icon={<Phone size={22} />} label="Phone number" value={company.phone} />
                                <ContactRow
                                    icon={<Clock size={22} />}
                                    label="Operating hours"
                                    value={`${company.operatingHours?.open} - ${company.operatingHours?.close}`}
                                    helper={getOperatingDaysText(company.operatingHours?.openDays)}
                                />
                                <ContactRow icon={<Mail size={22} />} label="Email address" value={company.email} breakAll />
                                <ContactRow icon={<MapPin size={22} />} label="Location" value={company.name} helper={company.location} />
                            </div>
                        </div>

                        <div className="relative overflow-hidden rounded-[0.65rem] border border-primary-dark/10 bg-white/72 p-5 text-primary-dark shadow-[0_30px_90px_-64px_rgba(9,31,26,0.56)] sm:p-7">
                            <img src={eventImage} alt="" className="absolute inset-0 h-full w-full object-cover opacity-18 brightness-[1.04] contrast-[1.08] saturate-[1.06]" />
                            <div className="absolute inset-0 bg-linear-to-r from-[#fff8e7]/94 via-[#fff8e7]/84 to-[#fff8e7]/56" aria-hidden="true" />
                            <p className="relative font-mono text-xs font-semibold uppercase tracking-[0.18em] text-primary-dark/56">{content.eventKicker || 'Private events'}</p>
                            <h3 className="relative mt-3 font-display text-4xl font-extrabold leading-[0.95] tracking-normal sm:text-5xl">{content.eventTitle || 'Talk with the venue team'}</h3>
                            <p className="relative mt-3 text-sm font-semibold leading-6 text-primary-dark/66">{content.eventDescription || "For group play, tournaments, or event reservations, use the venue's social channels or direct contact details."}</p>

                            <div className="relative mt-6 flex gap-3">
                                {company.socialFacebook && (
                                    <a
                                        href={company.socialFacebook}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex h-11 w-11 items-center justify-center rounded-full border border-primary-dark/12 bg-primary-dark text-white transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-secondary hover:text-primary-dark"
                                        aria-label="Open Facebook page"
                                    >
                                        <Facebook size={21} aria-hidden="true" />
                                    </a>
                                )}

                                {company.socialInstagram && (
                                    <a
                                        href={company.socialInstagram}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex h-11 w-11 items-center justify-center rounded-full border border-primary-dark/12 bg-primary-dark text-white transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-secondary hover:text-primary-dark"
                                        aria-label="Open Instagram profile"
                                    >
                                        <Instagram size={21} aria-hidden="true" />
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>

                    {company.parkingEnabled !== false && (
                        <div className="venue-panel overflow-hidden rounded-xl p-2">
                            <LazyMapEmbed
                                src={`https://www.google.com/maps?q=${encodeURIComponent(company.mapQuery || (company.name + ' ' + company.location))}&output=embed`}
                                title={`${company.name} map`}
                                description="Load the venue map only when you want to view directions."
                                buttonLabel="Show venue map"
                                aspectClassName="min-h-[320px] sm:min-h-[420px] lg:min-h-[620px]"
                                className="rounded-lg border-0 shadow-none"
                            />
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}

function ContactRow({ icon, label, value, helper, breakAll = false }) {
    return (
        <div className="flex items-start gap-4 rounded-[0.45rem] border border-primary-dark/10 bg-white/62 p-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-primary-dark/10 bg-primary-dark text-secondary">
                {icon}
            </div>
            <div className="min-w-0">
                <p className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-primary-dark/42">{label}</p>
                <p className={`mt-1 text-lg font-semibold text-primary-dark ${breakAll ? 'break-all' : 'wrap-break-word'}`}>{value}</p>
                {helper && <p className="mt-1 text-sm leading-6 text-primary-dark/56">{helper}</p>}
            </div>
        </div>
    );
}
