import { Clock, Facebook, Instagram, Mail, MapPin, Phone } from 'lucide-react';
import { LazyMapEmbed } from './LazyMapEmbed';
import { useCompany } from '../lib/CompanyProvider';

export function Contact() {
    const { company } = useCompany();

    return (
        <section id="contact" className="relative w-full overflow-hidden bg-[linear-gradient(135deg,#dfeadd_0%,#f6ecd6_50%,#eef4e6_100%)] py-24 sm:py-36">
            <div className="absolute left-[12%] top-0 h-64 w-64 rounded-full bg-primary-light/60 blur-3xl" aria-hidden="true" />

            <div className="relative mx-auto max-w-[1500px] px-4 sm:px-6 lg:px-8">
                <div className="mb-10 grid gap-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-end">
                    <div>
                        <span className="section-kicker">Visit the venue</span>
                        <h2 className="mt-5 text-balance text-4xl font-extrabold leading-[0.98] tracking-[-0.045em] text-primary-dark sm:text-5xl">
                            Details players need before they leave home.
                        </h2>
                    </div>
                    <p className="max-w-2xl text-base leading-7 text-stone-600 lg:justify-self-end">
                        Contact, hours, and directions stay venue-specific while the booking flow stays fast and familiar.
                    </p>
                </div>

                <div className={`grid ${company.parkingEnabled !== false ? 'lg:grid-cols-[0.82fr_1.18fr]' : 'max-w-2xl'} gap-6 lg:gap-8`}>
                    <div className="space-y-5">
                        <div className="venue-panel rounded-[2rem] p-6 sm:p-8">
                            <h3 className="text-2xl font-bold tracking-[-0.03em] text-primary-dark">Contact information</h3>

                            <div className="mt-7 space-y-5">
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

                        <div className="relative overflow-hidden rounded-[2rem] bg-primary-dark p-6 text-white shadow-[0_30px_90px_-58px_rgba(10,63,55,0.85)] sm:p-8">
                            <div className="absolute right-[-4rem] top-[-4rem] h-40 w-40 rounded-full bg-secondary/30 blur-2xl" aria-hidden="true" />
                            <p className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-white/60">Private events</p>
                            <h3 className="mt-3 text-2xl font-bold tracking-tight">Talk with the venue team</h3>
                            <p className="mt-3 text-sm leading-6 text-white/76">For group play, tournaments, or event reservations, use the venue's social channels or direct contact details.</p>

                            <div className="mt-6 flex gap-3">
                                {company.socialFacebook && (
                                    <a
                                        href={company.socialFacebook}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex h-11 w-11 items-center justify-center rounded-full border border-white/16 bg-white/12 text-white transition-colors hover:bg-white/22"
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
                                        className="flex h-11 w-11 items-center justify-center rounded-full border border-white/16 bg-white/12 text-white transition-colors hover:bg-white/22"
                                        aria-label="Open Instagram profile"
                                    >
                                        <Instagram size={21} aria-hidden="true" />
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>

                    {company.parkingEnabled !== false && (
                        <div className="venue-panel overflow-hidden rounded-[2.25rem] p-3">
                            <LazyMapEmbed
                                src={`https://www.google.com/maps?q=${encodeURIComponent(company.mapQuery || (company.name + ' ' + company.location))}&output=embed`}
                                title={`${company.name} map`}
                                description="Load the venue map only when you want to view directions."
                                buttonLabel="Show venue map"
                                aspectClassName="min-h-[320px] sm:min-h-[420px] lg:min-h-[620px]"
                                className="rounded-[1.7rem] border-0 shadow-none"
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
        <div className="flex items-start gap-4 rounded-[1.35rem] bg-white/50 p-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary-light text-primary-dark">
                {icon}
            </div>
            <div className="min-w-0">
                <p className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">{label}</p>
                <p className={`mt-1 text-lg font-semibold text-stone-800 ${breakAll ? 'break-all' : 'break-words'}`}>{value}</p>
                {helper && <p className="mt-1 text-sm leading-6 text-stone-600">{helper}</p>}
            </div>
        </div>
    );
}
