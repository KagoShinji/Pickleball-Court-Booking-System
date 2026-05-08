import { ArrowRight, Calendar, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from './ui';
import { useCompany } from '../lib/CompanyProvider';

export function Hero() {
    const { company } = useCompany();
    const [currentSlide, setCurrentSlide] = useState(0);

    const heroImages = (company.heroContent && company.heroContent.length > 0)
        ? company.heroContent 
        : [
            {
                src: "/images/picklepoint.jpg",
                title: "Center Court",
                subtitle: "Premium Surface • Lighting"
            },
            {
                src: "/images/court1.jpg",
                title: "Pro-Grade Surface",
                subtitle: "Optimized for Performance"
            },
            {
                src: "/images/court2.jpg",
                title: "Vibrant Community",
                subtitle: "Join the Club"
            }
        ];

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % heroImages.length);
        }, 5000);
        return () => clearInterval(timer);
    }, [heroImages.length]);

    const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % heroImages.length);
    const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + heroImages.length) % heroImages.length);

    return (
        <div className="relative pt-24 pb-16 sm:pt-32 sm:pb-24 overflow-hidden bg-bg-user">
            {/* Background blobs */}
            <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 w-96 h-96 bg-primary-light rounded-full blur-3xl opacity-50 -z-10"></div>
            <div className="absolute bottom-0 left-0 translate-y-12 -translate-x-12 w-96 h-96 bg-secondary-light rounded-full blur-3xl opacity-50 -z-10"></div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-primary/20 mb-6 shadow-sm">
                            <span className="flex h-2 w-2 rounded-full bg-primary"></span>
                            <span className="text-sm font-medium text-gray-600">{company.heroBadge}</span>
                        </div>

                        <h1 className="text-5xl sm:text-6xl font-display font-bold leading-tight text-primary-dark mb-6">
                            {company.heroTitle}
                        </h1>

                        <p className="text-lg text-gray-600 mb-8 max-w-lg leading-relaxed">
                            {company.heroSubtitle}
                        </p>

                        <div className="flex flex-wrap gap-4">
                            <Button
                                size="lg"
                                className="shadow-primary/25 shadow-lg text-white"
                                onClick={() => document.getElementById('courts')?.scrollIntoView({ behavior: 'smooth' })}
                            >
                                Book a Court <ArrowRight size={18} />
                            </Button>
                        </div>

                        <div className="mt-10 flex items-center gap-6 text-gray-500 text-sm font-medium">
                            <div className="flex items-center gap-2">
                                <Users size={18} className="text-secondary" />
                                <span>{company.heroStatPlayers}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Calendar size={18} className="text-secondary" />
                                <span>{company.heroStatDays}</span>
                            </div>
                        </div>
                    </div>

                    <div className="relative group">
                        <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white aspect-[4/3] transform transition-transform duration-500 hover:scale-[1.01]">

                            {/* Slides */}
                            {heroImages.map((img, index) => (
                                <div
                                    key={index}
                                    className={`absolute inset-0 transition-opacity duration-1000 ${index === currentSlide ? 'opacity-100' : 'opacity-0'}`}
                                >
                                    <img
                                        src={img.src}
                                        alt={img.title}
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-transparent"></div>
                                    <div className="absolute bottom-6 left-6 text-white transform transition-all duration-700 translate-y-0">
                                        <p className="font-bold text-xl">{img.title}</p>
                                        <p className="text-white/80 text-sm">{img.subtitle}</p>
                                    </div>
                                </div>
                            ))}

                            {/* Controls (visible on hover) */}
                            <button
                                onClick={prevSlide}
                                className="absolute left-4 top-1/2 -translate-y-12 bg-white/20 backdrop-blur-md hover:bg-white/40 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300"
                            >
                                <ChevronLeft size={24} />
                            </button>
                            <button
                                onClick={nextSlide}
                                className="absolute right-4 top-1/2 -translate-y-12 bg-white/20 backdrop-blur-md hover:bg-white/40 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300"
                            >
                                <ChevronRight size={24} />
                            </button>

                            {/* Dots */}
                            <div className="absolute bottom-6 right-6 flex gap-2">
                                {heroImages.map((_, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setCurrentSlide(index)}
                                        className={`w-2 h-2 rounded-full transition-all duration-300 ${index === currentSlide ? 'w-6 bg-secondary' : 'bg-white/50 hover:bg-white/80'}`}
                                        aria-label={`Go to slide ${index + 1}`}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Decorative element behind */}
                        <div className="absolute -inset-4 bg-primary/20 rounded-[2.5rem] -z-10 rotate-3 group-hover:rotate-6 transition-transform duration-500"></div>
                    </div>
                </div>
            </div>
        </div>
    );
}
