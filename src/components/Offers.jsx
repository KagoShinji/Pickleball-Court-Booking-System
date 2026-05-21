import { Armchair, Car, Coffee, DoorOpen, Gamepad2, Music, ShowerHead, TreePine, Volleyball, Wifi } from 'lucide-react';
import { useCompany } from '../lib/CompanyProvider';

const ICONS = {
    shower: <ShowerHead size={22} strokeWidth={1.5} />,
    toilet: <ShowerHead size={22} strokeWidth={1.5} />,
    lounge: <Armchair size={22} strokeWidth={1.5} />,
    parking: <Car size={22} strokeWidth={1.5} />,
    pingpong: <Volleyball size={22} strokeWidth={1.5} />,
    billiards: <Gamepad2 size={22} strokeWidth={1.5} />,
    door: <DoorOpen size={22} strokeWidth={1.5} />,
    wifi: <Wifi size={22} strokeWidth={1.5} />,
    coffee: <Coffee size={22} strokeWidth={1.5} />,
    music: <Music size={22} strokeWidth={1.5} />,
    outdoor: <TreePine size={22} strokeWidth={1.5} />,
};

const AMENITY_TITLES = {
    shower: 'Changing rooms',
    toilet: 'Restrooms',
    lounge: 'Player lounge',
    parking: 'Nearby parking',
    pingpong: 'Ping pong',
    billiards: 'Billiards',
    door: 'Indoor court',
    wifi: 'Guest Wi-Fi',
    coffee: 'Coffee counter',
    music: 'Sound system',
    outdoor: 'Outdoor court',
};

const AMENITY_IMAGES = ['/images/court1.jpg', '/images/court2.jpg'];

function formatAmenityTitle(key) {
    if (AMENITY_TITLES[key]) return AMENITY_TITLES[key];
    return String(key)
        .replace(/[-_]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function Offers() {
    const { company } = useCompany();
    const content = company.sectionContent?.offers || {};
    const venueImages = company.siteImages?.galleries?.venue?.length
        ? company.siteImages.galleries.venue
        : AMENITY_IMAGES;

    const amenities = company.amenities && company.amenities.length > 0
        ? company.amenities
        : ['shower', 'lounge', 'parking', 'wifi', 'music'];

    return (
        <section id="offers" className="sport-section sport-section-offers flex items-center py-16 sm:py-20 lg:py-24">
            <p className="pointer-events-none absolute right-4 top-6 z-1 hidden select-none font-display text-[clamp(5rem,14vw,15rem)] font-extrabold uppercase leading-none text-primary-dark/4.5 sm:block lg:right-12">
                Amenities
            </p>

            <div className="mx-auto w-full max-w-385 px-5 sm:px-8 lg:px-12 xl:px-14">
                <div className="grid gap-7 lg:grid-cols-[0.58fr_1.42fr] lg:items-center">
                    <div className="lg:self-start">
                        <span className="section-kicker">{content.kicker || 'After the rally'}</span>
                        <h2 className="mt-4 max-w-112 text-balance font-display text-[clamp(3rem,5.3vw,6.4rem)] font-extrabold leading-[0.9] tracking-normal text-primary-dark">
                            {content.title || 'Tropical extras. Match-ready.'}
                        </h2>
                        <p className="mt-5 max-w-sm text-sm font-semibold leading-7 text-primary-dark/62">
                            {content.description || 'Quick comforts for players, diners, and groups without letting the amenity list dominate the scroll.'}
                        </p>

                        <div className="mt-6 grid max-w-sm grid-cols-3 gap-2">
                            {venueImages.slice(0, 3).map((src, index) => (
                                <div key={src} className={`overflow-hidden rounded-[0.45rem] border border-primary-dark/10 bg-white/70 p-1 shadow-[0_18px_48px_-38px_rgba(9,31,26,0.45)] ${index === 1 ? 'translate-y-4' : ''}`}>
                                    <img src={src} alt="Kenny Dink venue detail" className="aspect-4/5 h-full w-full rounded-[0.28rem] object-cover brightness-[1.04] contrast-[1.08] saturate-[1.05] transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:scale-105" />
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="rounded-[0.65rem] border border-primary-dark/10 bg-white/72 p-3 shadow-[0_34px_100px_-72px_rgba(9,31,26,0.5)] sm:p-4">
                        <div className="flex flex-col gap-3 border-b border-primary-dark/10 px-2 pb-4 sm:flex-row sm:items-end sm:justify-between">
                            <div>
                                <p className="font-mono text-[0.64rem] font-bold uppercase tracking-[0.18em] text-secondary">{content.panelKicker || 'Venue extras'}</p>
                                <h3 className="mt-2 font-display text-3xl font-extrabold leading-[0.95] tracking-normal text-primary-dark sm:text-4xl">
                                    {amenities.length} ready-to-use perks
                                </h3>
                            </div>
                            <p className="max-w-xs text-sm font-semibold leading-6 text-primary-dark/56">
                                {content.panelDescription || 'Compact cards keep the section balanced as the list grows.'}
                            </p>
                        </div>

                        <div
                            className="mt-4 grid max-h-[min(36rem,calc(100dvh-12rem))] gap-2.5 overflow-y-auto pr-1"
                            style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(10.5rem, 100%), 1fr))' }}
                        >
                            {amenities.map((key, index) => {
                                const icon = ICONS[key] || <Armchair size={20} strokeWidth={1.5} />;
                                const title = formatAmenityTitle(key);
                                return <AmenityCard key={`${key}-${index}`} icon={icon} title={title} />;
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

function AmenityCard({ icon, title }) {
    return (
        <div className="group min-h-[6.35rem] rounded-[0.45rem] border border-primary-dark/10 bg-[#fffdf4]/88 p-3 transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1 hover:border-secondary/55 hover:bg-white">
            <div className="flex h-full flex-col justify-between gap-5">
                <div className="flex items-center justify-between gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-primary-dark/10 bg-primary-dark text-secondary transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-105">
                        {icon}
                    </div>
                    <span className="h-2 w-2 rounded-full bg-secondary shadow-[0_0_20px_rgba(185,255,63,0.55)]" />
                </div>
                <div>
                    <h3 className="text-base font-extrabold leading-tight tracking-[-0.02em] text-primary-dark">{title}</h3>
                    <p className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-primary-dark/38">Included</p>
                </div>
            </div>
        </div>
    );
}
