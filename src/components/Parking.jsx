import { Car, Moon, SunMedium } from 'lucide-react';
import { LazyMapEmbed } from './LazyMapEmbed';
import { useCompany } from '../lib/CompanyProvider';

export function Parking() {
    const { company } = useCompany();
    const content = company.sectionContent?.parking || {};
    const parkingImage = company.siteImages?.sectionBackgrounds?.parking || '/kennydink/kennydinktarp.jpg';

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

                        <div className="grid gap-0 md:grid-cols-2">
                            <ParkingMap
                                icon={<SunMedium size={20} />}
                                label="6:00 AM - 8:00 PM"
                                title="Mandaue City Parking Building"
                                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1231.7332439194204!2d123.94227780570394!3d10.326561079742241!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x33a999b23fbbda97%3A0x873ce5859e106bfd!2sMandaue%20City%20Parking%20Building!5e1!3m2!1sen!2sph!4v1769845352536!5m2!1sen!2sph"
                                mapTitle="Mandaue City Parking Building map"
                                buttonLabel="Show day parking map"
                                helper="Located a short walk from the courts."
                            />
                            <ParkingMap
                                icon={<Moon size={20} />}
                                label="8:00 PM - 6:00 AM"
                                title="Mandaue City Hall"
                                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d615.8653893176781!2d123.94299730826987!3d10.327190424017024!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x33a999b240f0bd77%3A0xbfe6ac0f099de4a4!2sLANDBANK%20-%20Mandaue%20City%20Hall!5e1!3m2!1sen!2sph!4v1769845543147!5m2!1sen!2sph"
                                mapTitle="Mandaue City Hall map"
                                buttonLabel="Show night parking map"
                                helper="Use the City Hall grounds for late sessions."
                            />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

function ParkingMap({ icon, label, title, src, mapTitle, buttonLabel, helper }) {
    return (
        <div className="border-b border-primary-dark/10 p-4 last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0 sm:p-5 lg:p-6">
            <div className="mb-5 flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-primary-dark/10 bg-primary-dark text-secondary">
                    {icon}
                </div>
                <div>
                    <span className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-secondary">{label}</span>
                    <h4 className="mt-1 text-xl font-bold tracking-tight text-primary-dark">{title}</h4>
                </div>
            </div>
            <LazyMapEmbed
                src={src}
                title={mapTitle}
                description={`Open the ${title} map only when needed.`}
                buttonLabel={buttonLabel}
                aspectClassName="min-h-[260px] sm:min-h-[310px] lg:min-h-[360px]"
                className="rounded-lg border-primary-dark/10"
            />
            <p className="mt-4 text-center text-sm font-semibold text-primary-dark/52">{helper}</p>
        </div>
    );
}
