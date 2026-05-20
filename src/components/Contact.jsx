import { Clock, Facebook, Instagram, Mail, MapPin, Phone } from 'lucide-react';
import { LazyMapEmbed } from './LazyMapEmbed';
import { useCompany } from '../lib/CompanyProvider';

export function Contact() {
    const { company } = useCompany();

    return (
        <section id="contact" className="sport-section sport-section-contact flex w-full items-center py-16 sm:py-20 lg:py-24">
            <p className="pointer-events-none absolute left-4 top-4 z-1 hidden select-none font-condensed text-[clamp(5rem,14vw,15rem)] uppercase leading-none text-primary-dark/4.5 sm:block lg:left-12">
                Visit
            </p>

            <div className="mx-auto w-full max-w-385 px-5 sm:px-8 lg:px-12 xl:px-14">
                <div className="mb-8 grid gap-5 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
                    <div className="lg:order-2 lg:justify-self-end lg:text-right">
                        <span className="section-kicker">Visit the venue</span>
                        <h2 className="mt-4 max-w-136 font-condensed text-[clamp(3.8rem,6.5vw,7.2rem)] uppercase leading-[0.78] tracking-normal text-primary-dark">
                            Find us before the first serve.
                        </h2>
                    </div>
                    <p className="max-w-2xl text-sm font-semibold leading-7 text-primary-dark/62 lg:order-1">
                        Contact, hours, and directions stay venue-specific while the booking flow stays fast and familiar.
                    </p>
                </div>

                <div className={`grid ${company.parkingEnabled !== false ? 'lg:grid-cols-[0.82fr_1.18fr]' : 'max-w-2xl'} gap-6 lg:gap-8`}>
                    <div className="space-y-5">
                        <div className="venue-panel rounded-[0.65rem] p-5 sm:p-7">
                            <h3 className="font-condensed text-4xl uppercase leading-none tracking-normal text-primary-dark sm:text-5xl">Contact information</h3>

                            <div className="mt-6 grid gap-3">
                                <ContactRow icon={<Phone size={22} />} label="Phone number" value={company.phone} />
                                <ContactRow
                                    icon={<Clock size={22} />}
                                    label="Operating hours"
                                    value={`${company.operatingHours?.open} - ${company.operatingHours?.close}`}
                                    helper="Late-night reservations may require advance booking."
                                />
                                <ContactRow icon={<Mail size={22} />} label="Email address" value={company.email} breakAll />
                                <ContactRow icon={<MapPin size={22} />} label="Location" value={company.name} helper={company.location} />
                            </div>
                        </div>

                        <div className="relative overflow-hidden rounded-[0.65rem] border border-primary-dark/10 bg-white/72 p-5 text-primary-dark shadow-[0_30px_90px_-64px_rgba(9,31,26,0.56)] sm:p-7">
                            <img src="/kennydink/kennydinktarp.jpg" alt="" className="absolute inset-0 h-full w-full object-cover opacity-18 brightness-[1.04] contrast-[1.08] saturate-[1.06]" />
                            <div className="absolute inset-0 bg-linear-to-r from-[#fff8e7]/94 via-[#fff8e7]/84 to-[#fff8e7]/56" aria-hidden="true" />
                            <p className="relative font-mono text-xs font-semibold uppercase tracking-[0.18em] text-primary-dark/56">Private events</p>
                            <h3 className="relative mt-3 font-condensed text-5xl uppercase leading-none tracking-normal">Talk with the venue team</h3>
                            <p className="relative mt-3 text-sm font-semibold leading-6 text-primary-dark/66">For group play, tournaments, or event reservations, use the venue's social channels or direct contact details.</p>

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
