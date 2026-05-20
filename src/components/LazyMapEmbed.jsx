import { MapPin } from 'lucide-react';
import { useState } from 'react';
import { Button } from './ui';

export function LazyMapEmbed({
    src,
    title,
    description,
    buttonLabel = 'Show Map',
    className = '',
    aspectClassName = 'min-h-[280px] sm:min-h-[320px] lg:min-h-[360px]'
}) {
    const [isVisible, setIsVisible] = useState(false);

    return (
        <div className={`${aspectClassName} relative w-full overflow-hidden rounded-2xl border border-primary-dark/10 bg-primary-light shadow-inner ${className}`}>
            {isVisible ? (
                <iframe
                    src={src}
                    title={title}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen=""
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    className="absolute inset-0 w-full h-full"
                ></iframe>
            ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-[linear-gradient(135deg,rgba(255,253,244,0.92),rgba(241,255,212,0.78),rgba(218,246,242,0.76))] p-5 text-center sm:p-6">
                    <div className="w-full max-w-sm rounded-[0.55rem] border border-primary-dark/10 bg-white/72 px-4 py-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.72)] sm:px-6">
                        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-primary-dark/10 bg-primary-dark text-secondary sm:h-14 sm:w-14">
                            <MapPin size={24} className="sm:w-7 sm:h-7" />
                        </div>
                        <h4 className="font-display text-base font-bold text-primary-dark sm:text-lg">{title}</h4>
                        {description ? (
                            <p className="mt-2 text-sm leading-relaxed text-primary-dark/58">{description}</p>
                        ) : null}
                        <Button
                            type="button"
                            className="mt-5 w-full bg-primary-dark text-white hover:bg-primary sm:mx-auto sm:w-auto"
                            onClick={() => setIsVisible(true)}
                        >
                            {buttonLabel}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
