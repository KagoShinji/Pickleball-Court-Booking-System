import { Car, Moon, SunMedium } from 'lucide-react';
import { LazyMapEmbed } from './LazyMapEmbed';

export function Parking() {
    return (
        <section id="parking" className="relative overflow-hidden bg-[linear-gradient(145deg,#edf4d7_0%,#f5ead4_48%,#d9eef2_100%)] py-24 sm:py-36">
            <div className="absolute inset-x-0 top-1/2 h-px bg-gradient-to-r from-transparent via-primary/15 to-transparent" aria-hidden="true" />

            <div className="relative mx-auto max-w-[1500px] px-4 sm:px-6 lg:px-8">
                <div className="venue-panel overflow-hidden rounded-[2.5rem]">
                    <div className="grid gap-0 lg:grid-cols-[0.8fr_1.2fr]">
                        <div className="relative bg-primary-dark p-8 text-white sm:p-10 lg:p-12">
                            <div className="absolute bottom-[-6rem] right-[-5rem] h-64 w-64 rounded-full bg-secondary/28 blur-3xl" aria-hidden="true" />
                            <div className="relative">
                                <span className="inline-flex h-14 w-14 items-center justify-center rounded-[1.35rem] bg-white/12 text-secondary ring-1 ring-white/14">
                                    <Car size={27} aria-hidden="true" />
                                </span>
                                <h3 className="mt-7 text-balance text-4xl font-extrabold leading-[0.98] tracking-[-0.045em]">
                                    Parking guidance for different play windows.
                                </h3>
                                <p className="mt-5 max-w-md text-sm leading-7 text-white/72">
                                    Keep arrival details clear without forcing every venue into the same parking layout.
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
        <div className="border-b border-stone-200/70 p-5 last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0 sm:p-6 lg:p-8">
            <div className="mb-5 flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-secondary-light text-secondary">
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
            />
            <p className="mt-4 text-center text-sm text-stone-500">{helper}</p>
        </div>
    );
}
