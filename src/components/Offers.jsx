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

const AMENITY_IMAGES = ['/kennydink/paddle.jpg', '/kennydink/court%201.jpg', '/kennydink/kennydinktarp.jpg'];

export function Offers() {
    const { company } = useCompany();

    const amenities = company.amenities && company.amenities.length > 0
        ? company.amenities
        : ['shower', 'lounge', 'parking', 'wifi', 'music'];

    return (
        <section id="offers" className="relative overflow-hidden bg-[linear-gradient(135deg,#e4edd8_0%,#fff1d4_48%,#d8eef0_100%)] py-28 sm:py-40">
            <div className="absolute right-[-14rem] top-24 h-[34rem] w-[34rem] rounded-full bg-secondary/18 blur-3xl" aria-hidden="true" />
            <div className="absolute left-[-12rem] bottom-0 h-[30rem] w-[30rem] rounded-full bg-sky-300/18 blur-3xl" aria-hidden="true" />

            <div className="relative mx-auto max-w-[1500px] px-4 sm:px-6 lg:px-8">
                <div className="grid gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
                    <div className="lg:sticky lg:top-32">
                        <span className="section-kicker">After the rally</span>
                        <h2 className="mt-6 max-w-4xl text-balance font-display text-5xl font-extrabold leading-[0.88] tracking-[-0.065em] text-primary-dark sm:text-6xl lg:text-8xl">
                            Stay for the court. Come back for the atmosphere.
                        </h2>
                        <p className="mt-7 max-w-xl text-base leading-8 text-stone-600">
                            Amenities are presented like part of the venue story: practical, visual, and easy to scan before a player commits to a booking.
                        </p>

                        <div className="mt-10 grid grid-cols-3 gap-3 sm:max-w-xl">
                            {AMENITY_IMAGES.map((src, index) => (
                                <div key={src} className={`premium-shell overflow-hidden rounded-[2rem] p-1 ${index === 1 ? 'translate-y-8' : ''}`}>
                                    <img src={src} alt="Kenny Dink venue detail" className="aspect-[3/4] h-full w-full rounded-[1.6rem] object-cover transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:scale-105" />
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="grid auto-rows-[minmax(14rem,auto)] grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6 lg:grid-flow-dense">
                        {amenities.slice(0, 6).map((key, index) => {
                            const icon = ICONS[key] || <Armchair size={22} strokeWidth={1.5} />;
                            const title = AMENITY_TITLES[key] || key;
                            const span = index === 0 ? 'lg:col-span-4 lg:row-span-2' : index === 3 ? 'lg:col-span-4' : 'lg:col-span-2';
                            return <AmenityCard key={`${key}-${index}`} icon={icon} title={title} index={index} className={span} large={index === 0} />;
                        })}
                    </div>
                </div>
            </div>
        </section>
    );
}

function AmenityCard({ icon, title, index, className = '', large = false }) {
    return (
        <div className={`group premium-shell rounded-[2.35rem] p-1.5 transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-2 ${className}`}>
            <div className={`relative flex h-full flex-col overflow-hidden rounded-[1.95rem] bg-[#fff8e8] p-6 sm:p-7 ${large ? 'justify-between' : ''}`}>
                {large && (
                    <img src="/kennydink/court%203.jpg" alt="Kenny Dink blue pickleball court" className="absolute inset-0 h-full w-full object-cover opacity-35 transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-105" />
                )}
                <div className="relative flex items-start justify-between gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-dark text-secondary shadow-[0_18px_38px_-28px_rgba(9,31,26,0.85)]">
                        {icon}
                    </div>
                    <span className="font-mono text-[0.64rem] font-semibold text-primary-dark/40">{String(index + 1).padStart(2, '0')}</span>
                </div>
                <div className="relative mt-10">
                    <h3 className={`${large ? 'max-w-sm text-4xl sm:text-5xl' : 'text-2xl'} font-display font-extrabold leading-[0.95] tracking-[-0.05em] text-primary-dark`}>{title}</h3>
                    <p className="mt-4 max-w-sm text-sm leading-6 text-stone-600">
                        Practical venue detail, shaped for quick decisions before booking.
                    </p>
                </div>
            </div>
        </div>
    );
}
