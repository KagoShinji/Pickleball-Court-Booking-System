import { DollarSign, Info, MapPin, Maximize2, Timer, Users, X } from 'lucide-react';
import { useState } from 'react';
import { Badge, Button } from './ui';
import { useCompany } from '../lib/CompanyProvider';

const KENNYDINK_COURT_IMAGES = [
    '/kennydink/court%203.jpg',
    '/kennydink/net.jpg',
    '/kennydink/paddle.jpg',
    '/kennydink/kennydinkhero.jpg',
    '/kennydink/court%201.jpg',
];

export function CourtCard({ court, onBook, featured = false, visualIndex = 0 }) {
    const { company } = useCompany();
    const [isExpanded, setIsExpanded] = useState(false);
    const courtTypeLabel = court.type?.trim() || 'Court';
    const hasPricingRules = court.pricing_rules && court.pricing_rules.length > 0;
    const maxPlayers = court.max_players || 10;
    const isActive = court.is_active !== false;
    const courtGallery = company.siteImages?.galleries?.courts?.length
        ? company.siteImages.galleries.courts
        : KENNYDINK_COURT_IMAGES;
    const imageSrc = courtGallery[visualIndex % courtGallery.length]
        || (court.images && court.images[0]?.url)
        || court.image
        || '/images/court1.jpg';

    const formatHour12 = (hour) => {
        const period = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour === 0 ? 12 : (hour > 12 ? hour - 12 : hour);
        return `${displayHour.toString().padStart(2, '0')}:00 ${period}`;
    };

    const formattedPrice = `PHP ${court.price || 0}`;

    return (
        <>
            <div className={`group h-full overflow-hidden rounded-[0.65rem] border border-primary-dark/10 bg-white/82 text-primary-dark shadow-[0_34px_100px_-76px_rgba(9,31,26,0.62)] transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1 hover:border-primary-dark/18 ${!isActive ? 'opacity-80' : ''}`}>
                <div className={`grid h-full ${featured ? 'md:grid-cols-[1.05fr_0.95fr]' : 'grid-cols-1'}`}>
                    <button
                        type="button"
                        className={`relative min-h-64 overflow-hidden bg-primary-light text-left ${featured ? 'md:min-h-full' : 'h-64'}`}
                        onClick={() => setIsExpanded(true)}
                        aria-label={`View details for ${court.name}`}
                    >
                        <img
                            src={imageSrc}
                            alt={court.name}
                            className={`h-full w-full object-cover brightness-[1.04] contrast-[1.08] saturate-[1.06] transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] ${isActive ? 'group-hover:scale-105' : 'grayscale'}`}
                            onError={(e) => { e.currentTarget.src = '/images/court1.jpg'; }}
                        />
                        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,8,8,0.02),rgba(2,8,8,0.82))]" />

                        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                            <Badge variant={isActive ? (court.status === 'Available' ? 'green' : 'gray') : 'red'}>
                                {isActive ? (court.status || 'Available') : 'Unavailable'}
                            </Badge>
                            {featured && <Badge variant="orange">Featured</Badge>}
                        </div>

                        <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-4 text-white">
                            <div>
                                <p className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-white/68">{courtTypeLabel}</p>
                                <p className="mt-1 font-display text-3xl font-extrabold leading-[0.95] tracking-normal sm:text-4xl">{court.name}</p>
                            </div>
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/24 bg-white/12 transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-105">
                                <Maximize2 size={18} aria-hidden="true" />
                            </div>
                        </div>

                        {!isActive && (
                            <div className="absolute inset-0 flex items-center justify-center bg-[#061617]/70">
                                <div className="rounded-full bg-white px-4 py-2 text-sm font-bold text-red-700 shadow-lg">
                                    Court unavailable
                                </div>
                            </div>
                        )}
                    </button>

                    <div className={`flex min-h-full flex-col border-t border-primary-dark/10 bg-[#fffdf4]/88 p-5 sm:p-6 ${featured ? 'md:border-l md:border-t-0' : ''}`}>
                        <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                                <h3 className="font-display text-3xl font-extrabold leading-[0.95] tracking-normal text-primary-dark sm:text-4xl">{court.name}</h3>
                                <div className="mt-2 flex items-center gap-2 text-sm font-semibold text-primary-dark/52">
                                    <MapPin size={15} aria-hidden="true" />
                                    <span>{courtTypeLabel}</span>
                                </div>
                            </div>
                            <div className="shrink-0 text-right">
                                <span className="block font-mono text-lg font-semibold text-secondary">{formattedPrice}</span>
                                <span className="text-xs font-medium text-primary-dark/42">per hour</span>
                            </div>
                        </div>

                        <p className="mt-4 line-clamp-3 text-sm font-semibold leading-6 text-primary-dark/62">
                            {court.description || 'A venue-managed court ready for timed reservations.'}
                        </p>

                        {court.description && court.description.length > 96 && (
                            <button
                                type="button"
                                onClick={() => setIsExpanded(true)}
                                className="mt-3 inline-flex w-fit items-center gap-2 rounded-full text-sm font-semibold text-primary-dark/68 transition-colors duration-500 hover:text-primary"
                            >
                                Read venue notes <Info size={14} aria-hidden="true" />
                            </button>
                        )}

                        {hasPricingRules && isActive && (
                            <div className="mt-5 rounded-[0.45rem] border border-secondary/24 bg-secondary-light/64 p-4">
                                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-secondary">
                                    <Timer size={16} aria-hidden="true" />
                                    Time-based pricing
                                </div>
                                <div className="space-y-2">
                                    {court.pricing_rules.map((rule, idx) => (
                                        <div key={idx} className="flex items-center justify-between gap-3 text-xs text-primary-dark/64">
                                            <span>{formatHour12(rule.startHour)} - {formatHour12(rule.endHour)}</span>
                                            <span className="font-mono font-semibold text-secondary">PHP {rule.price}/hr</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {!isActive && (
                            <div className="mt-5 rounded-[0.45rem] border border-red-200 bg-red-50 px-4 py-3 text-center">
                                <p className="text-xs font-semibold text-red-700">This court is currently unavailable for booking.</p>
                            </div>
                        )}

                        <div className="mt-auto flex items-center justify-between gap-4 pt-6">
                            <div className="flex items-center gap-2 text-sm font-semibold text-primary-dark/54">
                                <Users size={16} className="text-secondary" aria-hidden="true" />
                                Up to {maxPlayers} pax
                            </div>
                            <Button
                                variant="primary"
                                size="sm"
                                onClick={() => onBook(court)}
                                disabled={!isActive}
                                className="bg-primary-dark text-white hover:bg-primary"
                            >
                                {isActive ? 'Book' : 'Unavailable'}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {isExpanded && (
                <div
                    className="fixed inset-0 z-[90] flex items-center justify-center bg-primary-dark/72 p-4"
                    onClick={() => setIsExpanded(false)}
                >
                    <div
                        className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-[0.75rem] border border-primary-dark/12 bg-[#fffdf4] text-primary-dark shadow-[0_38px_120px_-62px_rgba(9,31,26,0.92)]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="relative h-72 overflow-hidden bg-primary-light sm:h-96">
                            <img
                                src={imageSrc}
                                alt={court.name}
                                className={`h-full w-full object-cover brightness-[1.04] contrast-[1.08] saturate-[1.06] ${!isActive ? 'grayscale' : ''}`}
                                onError={(e) => { e.currentTarget.src = '/images/court1.jpg'; }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#020808]/86 via-[#020808]/24 to-transparent" />
                            <button
                                type="button"
                                onClick={() => setIsExpanded(false)}
                                className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full border border-white/70 bg-white/82 text-primary-dark transition-colors duration-500 hover:bg-secondary"
                                aria-label="Close court details"
                            >
                                <X size={20} aria-hidden="true" />
                            </button>
                            <div className="absolute left-5 top-5">
                                <Badge variant={isActive ? (court.status === 'Available' ? 'green' : 'gray') : 'red'}>
                                    {isActive ? (court.status || 'Available') : 'Unavailable'}
                                </Badge>
                            </div>
                            <div className="absolute bottom-6 left-6 right-6 text-white">
                                <p className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-white/70">{courtTypeLabel}</p>
                                <h2 className="mt-2 text-balance font-display text-5xl font-extrabold leading-[0.9] tracking-normal sm:text-7xl">{court.name}</h2>
                            </div>
                        </div>

                        <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1fr_18rem]">
                            <div className="space-y-7">
                                <div>
                                    <h3 className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-primary-dark/48">Court description</h3>
                                    <p className="mt-3 whitespace-pre-line text-base leading-8 text-primary-dark/70">
                                        {court.description || 'No description available.'}
                                    </p>
                                </div>

                                {hasPricingRules && isActive && (
                                    <div>
                                        <h3 className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-primary-dark/48">Time-based pricing</h3>
                                        <div className="mt-3 overflow-hidden rounded-[0.5rem] border border-secondary/24 bg-secondary-light/64">
                                            {court.pricing_rules.map((rule, idx) => (
                                                <div key={idx} className="flex items-center justify-between gap-4 border-b border-secondary/15 px-5 py-4 last:border-b-0">
                                                    <div className="flex items-center gap-3 text-sm font-medium text-primary-dark/68">
                                                        <DollarSign size={16} className="text-secondary" aria-hidden="true" />
                                                        {formatHour12(rule.startHour)} - {formatHour12(rule.endHour)}
                                                    </div>
                                                    <span className="font-mono font-semibold text-secondary">PHP {rule.price}/hr</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <aside className="rounded-[0.55rem] border border-primary-dark/10 bg-white/72 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.72)]">
                                <div className="space-y-5">
                                    <div>
                                        <p className="text-sm font-medium text-primary-dark/52">Base rate</p>
                                        <p className="mt-1 font-mono text-2xl font-semibold text-secondary">{formattedPrice}</p>
                                        <p className="text-xs text-primary-dark/38">per hour</p>
                                    </div>
                                    <div className="h-px bg-primary-dark/10" />
                                    <div className="flex items-center gap-3 text-sm font-semibold text-primary-dark/68">
                                        <Users size={17} className="text-secondary" aria-hidden="true" />
                                        Capacity: up to {maxPlayers} player{maxPlayers !== 1 ? 's' : ''}
                                    </div>
                                    {!isActive && (
                                        <div className="rounded-[0.45rem] border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
                                            This court is currently unavailable for booking.
                                        </div>
                                    )}
                                </div>

                                <div className="mt-6 grid gap-3">
                                    <Button
                                        variant="primary"
                                        onClick={() => {
                                            setIsExpanded(false);
                                            onBook(court);
                                        }}
                                        disabled={!isActive}
                                        className="w-full bg-primary-dark text-white hover:bg-primary"
                                    >
                                        {isActive ? 'Book this court' : 'Unavailable'}
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        className="w-full text-primary-dark hover:bg-primary-dark/5"
                                        onClick={() => setIsExpanded(false)}
                                    >
                                        Close
                                    </Button>
                                </div>
                            </aside>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
