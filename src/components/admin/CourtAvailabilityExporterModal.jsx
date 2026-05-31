import { useState, useEffect, useRef } from 'react';
import { format, addDays } from 'date-fns';
import { X, Download, Calendar, Sparkles, Check, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { getCompanyId } from '../../lib/config';
import html2canvas from 'html2canvas';

const THEMES = {
    neonDark: {
        name: 'Neon Dark',
        container: {
            background: 'linear-gradient(135deg, #0f2d1e 0%, #111827 100%)',
            color: '#ffffff'
        },
        accentText: { color: '#adff2f' },
        clubName: { color: '#ffffff' },
        dateText: { color: '#9ca3af' },
        courtName: { color: '#adff2f', borderBottom: '1px solid rgba(173, 255, 47, 0.2)' },
        availableSlot: {
            background: 'rgba(173, 255, 47, 0.15)',
            border: '1px solid rgba(173, 255, 47, 0.5)',
            color: '#adff2f'
        },
        bookedSlot: {
            background: 'rgba(244, 63, 94, 0.1)',
            border: '1px solid rgba(244, 63, 94, 0.4)',
            color: '#f43f5e'
        },
        ctaSection: {
            borderTop: '1px solid rgba(173, 255, 47, 0.2)'
        },
        ctaText: { color: '#ffffff' },
        ctaLink: { color: '#adff2f' },
        qrBorder: { border: '2px solid #adff2f', background: '#ffffff', padding: '4px', borderRadius: '8px' }
    },
    crispTeal: {
        name: 'Crisp Teal',
        container: {
            background: 'linear-gradient(135deg, #f1f5f9 0%, #ccfbfe 100%)',
            color: '#0f766e'
        },
        accentText: { color: '#0f766e' },
        clubName: { color: '#111827' },
        dateText: { color: '#4b5563' },
        courtName: { color: '#0f766e', borderBottom: '1px solid rgba(15, 118, 110, 0.2)' },
        availableSlot: {
            background: '#ffffff',
            border: '1px solid #0f766e',
            color: '#0f766e'
        },
        bookedSlot: {
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid #ef4444',
            color: '#ef4444'
        },
        ctaSection: {
            borderTop: '1px solid rgba(15, 118, 110, 0.2)'
        },
        ctaText: { color: '#111827' },
        ctaLink: { color: '#0f766e' },
        qrBorder: { border: '2px solid #0f766e', background: '#ffffff', padding: '4px', borderRadius: '8px' }
    },
    warmClay: {
        name: 'Warm Clay',
        container: {
            background: 'linear-gradient(135deg, #7c2d12 0%, #431407 100%)',
            color: '#fef3c7'
        },
        accentText: { color: '#f97316' },
        clubName: { color: '#fef3c7' },
        dateText: { color: '#fed7aa' },
        courtName: { color: '#f97316', borderBottom: '1px solid rgba(249, 115, 22, 0.2)' },
        availableSlot: {
            background: 'rgba(254, 243, 199, 0.1)',
            border: '1px solid #f97316',
            color: '#fef3c7'
        },
        bookedSlot: {
            background: 'rgba(28, 25, 23, 0.6)',
            border: '1px solid #292524',
            color: '#a8a29e'
        },
        ctaSection: {
            borderTop: '1px solid rgba(249, 115, 22, 0.2)'
        },
        ctaText: { color: '#fef3c7' },
        ctaLink: { color: '#f97316' },
        qrBorder: { border: '2px solid #f97316', background: '#ffffff', padding: '4px', borderRadius: '8px' }
    },
    minimalLight: {
        name: 'Minimal Light',
        container: {
            background: '#ffffff',
            color: '#1f2937'
        },
        accentText: { color: '#4b5563' },
        clubName: { color: '#111827' },
        dateText: { color: '#6b7280' },
        courtName: { color: '#1f2937', borderBottom: '1px solid #e5e7eb' },
        availableSlot: {
            background: '#ffffff',
            border: '1px solid #d1d5db',
            color: '#1f2937'
        },
        bookedSlot: {
            background: '#f3f4f6',
            border: '1px solid #e5e7eb',
            color: '#6b7280'
        },
        ctaSection: {
            borderTop: '1px solid #e5e7eb'
        },
        ctaText: { color: '#1f2937' },
        ctaLink: { color: '#4b5563' },
        qrBorder: { border: '2px solid #d1d5db', background: '#ffffff', padding: '4px', borderRadius: '8px' }
    }
};

export function CourtAvailabilityExporterModal({ isOpen, onClose, initialDate = new Date() }) {
    const cardRef = useRef(null);
    const wrapperRef = useRef(null);
    const headerRef = useRef(null);
    const bodyRef = useRef(null);
    const footerRef = useRef(null);

    const [scale, setScale] = useState(1);
    const [cardDimension, setCardDimension] = useState(600);
    const [dateOption, setDateOption] = useState('today'); // today, tomorrow, custom
    const [customDate, setCustomDate] = useState(format(initialDate, 'yyyy-MM-dd'));
    const [courts, setCourts] = useState([]);
    const [selectedCourtIds, setSelectedCourtIds] = useState([]);
    const [activeTheme, setActiveTheme] = useState('neonDark');
    const [bookingLink, setBookingLink] = useState('');
    const [showBookedSlots, setShowBookedSlots] = useState(true);

    const [loading, setLoading] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    
    // Calculated schedule data for the preview
    const [scheduleData, setScheduleData] = useState([]);
    const [clubInfo, setClubInfo] = useState({ name: 'PicklePoint Cebu', logoUrl: '', initials: 'PP' });

    // Calculate required card dimension to keep it square without clipping content
    useEffect(() => {
        if (!isOpen || courts.length === 0) return;
        
        const calculateDimension = () => {
            if (headerRef.current && bodyRef.current && footerRef.current) {
                const headerHeight = headerRef.current.offsetHeight || 0;
                const bodyHeight = bodyRef.current.scrollHeight || 0;
                const footerHeight = footerRef.current.offsetHeight || 0;
                
                // Card has 30px padding top/bottom (60px)
                // body has my-4 margin (16px)
                // safety buffer (20px)
                const totalHeight = headerHeight + bodyHeight + footerHeight + 60 + 16 + 20;
                
                setCardDimension(Math.max(600, totalHeight));
            }
        };

        const timer = setTimeout(calculateDimension, 150);
        return () => clearTimeout(timer);
    }, [isOpen, courts, selectedCourtIds, showBookedSlots, activeTheme, scheduleData, clubInfo]);

    // Calculate scale to keep the preview responsive
    useEffect(() => {
        if (!isOpen) return;
        const updateScale = () => {
            if (wrapperRef.current) {
                const width = wrapperRef.current.clientWidth;
                const availableWidth = width - 32;
                if (availableWidth < cardDimension) {
                    setScale(availableWidth / cardDimension);
                } else {
                    setScale(1);
                }
            }
        };

        updateScale();
        
        const observer = new ResizeObserver(updateScale);
        if (wrapperRef.current) {
            observer.observe(wrapperRef.current);
        }
        
        return () => {
            observer.disconnect();
        };
    }, [isOpen, cardDimension]);

    // Handle date resolution
    const getTargetDateStr = () => {
        const todayObj = new Date();
        if (dateOption === 'today') {
            return format(todayObj, 'yyyy-MM-dd');
        } else if (dateOption === 'tomorrow') {
            return format(addDays(todayObj, 1), 'yyyy-MM-dd');
        }
        return customDate;
    };

    const targetDateStr = getTargetDateStr();

    // Fetch initial data: courts and tenant settings
    useEffect(() => {
        if (!isOpen) return;

        const fetchInitData = async () => {
            try {
                setLoading(true);
                // 1. Fetch active courts
                const { data: courtsData, error: courtsError } = await supabase
                    .from('courts')
                    .select('*')
                    .eq('company_id', getCompanyId())
                    .eq('is_active', true)
                    .order('name');

                if (courtsError) throw courtsError;
                setCourts(courtsData || []);
                setSelectedCourtIds((courtsData || []).map(c => c.id));

                // 2. Fetch tenant settings
                const { data: settings, error: settingsError } = await supabase
                    .from('tenant_settings')
                    .select('company_name, logo_url, company_initials, operating_hours')
                    .eq('company_id', getCompanyId())
                    .single();

                if (!settingsError && settings) {
                    setClubInfo({
                        name: settings.company_name || 'PicklePoint Cebu',
                        logoUrl: settings.logo_url || '',
                        initials: settings.company_initials || 'PP',
                        operatingHours: settings.operating_hours || null
                    });
                }

                // Set default booking link
                const clientDomain = window.location.origin;
                setBookingLink(`${clientDomain}/#courts`);

            } catch (err) {
                console.error('Error fetching exporter data:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchInitData();
    }, [isOpen]);

    // Handle modal pre-fill when initialDate changes
    useEffect(() => {
        if (initialDate) {
            setCustomDate(format(initialDate, 'yyyy-MM-dd'));
            // If initialDate is today, select 'today'; if tomorrow, 'tomorrow'; else 'custom'
            const todayStr = format(new Date(), 'yyyy-MM-dd');
            const tomorrowStr = format(addDays(new Date(), 1), 'yyyy-MM-dd');
            const initDateStr = format(initialDate, 'yyyy-MM-dd');

            if (initDateStr === todayStr) {
                setDateOption('today');
            } else if (initDateStr === tomorrowStr) {
                setDateOption('tomorrow');
            } else {
                setDateOption('custom');
            }
        }
    }, [initialDate]);

    // Real-time updates subscription to keep preview database fetches fresh
    useEffect(() => {
        if (!isOpen) return;

        const bookingsSub = supabase
            .channel(`exporter-bookings:${getCompanyId()}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'bookings',
                filter: `company_id=eq.${getCompanyId()}`
            }, () => {
                setRefreshTrigger(prev => prev + 1);
            })
            .subscribe();

        const blockedSub = supabase
            .channel(`exporter-blocked:${getCompanyId()}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'blocked_time_slots',
                filter: `company_id=eq.${getCompanyId()}`
            }, () => {
                setRefreshTrigger(prev => prev + 1);
            })
            .subscribe();

        return () => {
            bookingsSub.unsubscribe();
            blockedSub.unsubscribe();
        };
    }, [isOpen]);

    // Calculate slots availability whenever selected date, courts or options change
    useEffect(() => {
        if (!isOpen || courts.length === 0) return;

        const calculateAvailability = async () => {
            try {
                // Fetch bookings and blocked slots for this date
                const { data: bookings, error: bookingsError } = await supabase
                    .from('bookings')
                    .select('*, courts(*)')
                    .eq('booking_date', targetDateStr)
                    .eq('company_id', getCompanyId())
                    .in('status', ['Confirmed', 'Rescheduled']);

                if (bookingsError) throw bookingsError;

                const { data: blocked, error: blockedError } = await supabase
                    .from('blocked_time_slots')
                    .select('*')
                    .eq('blocked_date', targetDateStr)
                    .eq('company_id', getCompanyId());

                if (blockedError) throw blockedError;

                // Determine operational hours (System operates 24/7, showing all 24 slots)
                let startHour = 0;
                let endHour = 24;

                // Helper to normalize booking times
                const normalizeTimeSlot = (timeSlot) => {
                    if (!timeSlot || typeof timeSlot !== 'string') return '';
                    return timeSlot.replace(':00:00', ':00').replace(':00.000000', ':00').split(':').slice(0, 2).join(':');
                };

                const getBookingSlots = (booking) => {
                    if (!booking) return [];
                    if (Array.isArray(booking.booked_times) && booking.booked_times.length > 0) {
                        return booking.booked_times.map(t => normalizeTimeSlot(t)).filter(Boolean);
                    }
                    if (!booking.start_time || !booking.end_time) return [];
                    const sHour = parseInt(String(booking.start_time).substring(0, 2), 10);
                    const eHour = parseInt(String(booking.end_time).substring(0, 2), 10);
                    const slots = [];
                    for (let h = sHour; h < eHour; h++) {
                        slots.push(`${h.toString().padStart(2, '0')}:00`);
                    }
                    return slots;
                };

                // Identify exclusive courts
                const exclusiveCourtIds = courts.filter(c => c.type === 'Exclusive / Whole Court').map(c => c.id);

                // Check if current date is today in Manila
                const getManilaDateStr = (date = new Date()) =>
                    new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila' }).format(date);
                
                const isSelectedToday = targetDateStr === getManilaDateStr();
                let currentManilaHour = -1;

                if (isSelectedToday) {
                    const nowManila = new Intl.DateTimeFormat('en-US', {
                        timeZone: 'Asia/Manila',
                        hour: 'numeric',
                        hour12: false
                    }).format(new Date());
                    currentManilaHour = parseInt(nowManila, 10);
                }

                // Process each court
                const computedData = courts.map(court => {
                    const isExclusive = court.type === 'Exclusive / Whole Court';
                    const courtSlots = [];

                    // Generate operating slots
                    for (let hour = startHour; hour < endHour; hour++) {
                        const slotId = `${hour.toString().padStart(2, '0')}:00`;

                        // 1. Past filter
                        if (isSelectedToday && hour <= currentManilaHour) {
                            continue; // Skip past slots
                        }

                        // 2. Blocked status check
                        let isBlocked = false;
                        if (blocked) {
                            isBlocked = blocked.some(b => {
                                const bSlot = normalizeTimeSlot(b.time_slot);
                                if (isExclusive) {
                                    return bSlot === slotId;
                                } else {
                                    return bSlot === slotId && (b.court_id === court.id || exclusiveCourtIds.includes(b.court_id));
                                }
                            });
                        }

                        // 3. Booked status check
                        let isBooked = false;
                        if (bookings) {
                            isBooked = bookings.some(booking => {
                                let matchesCourt = false;
                                if (isExclusive) {
                                    matchesCourt = true; // bookings on any court overlaps
                                } else {
                                    matchesCourt = booking.court_id === court.id || booking.courts?.type === 'Exclusive / Whole Court';
                                }

                                if (matchesCourt) {
                                    const slots = getBookingSlots(booking);
                                    return slots.includes(slotId);
                                }
                                return false;
                            });
                        }

                        courtSlots.push({
                            time: slotId,
                            label: formatSlotLabel(hour),
                            status: (isBlocked || isBooked) ? 'booked' : 'available'
                        });
                    }

                    return {
                        id: court.id,
                        name: court.name,
                        slots: courtSlots
                    };
                });

                setScheduleData(computedData);

            } catch (err) {
                console.error('Error calculating availability:', err);
            }
        };

        calculateAvailability();
    }, [isOpen, courts, targetDateStr, dateOption, customDate, clubInfo.operatingHours, refreshTrigger]);

    const formatSlotLabel = (hour) => {
        const period = hour < 12 ? 'AM' : 'PM';
        const displayHour = hour === 0 ? 12 : (hour > 12 ? hour - 12 : hour);
        return `${displayHour} ${period}`;
    };

    const handleCourtToggle = (courtId) => {
        setSelectedCourtIds(prev => 
            prev.includes(courtId) ? prev.filter(id => id !== courtId) : [...prev, courtId]
        );
    };

    const handleDownload = async () => {
        if (!cardRef.current) return;
        try {
            setExporting(true);

            // Give any dynamic images/QR code time to load/render
            await new Promise(resolve => setTimeout(resolve, 300));

            const canvas = await html2canvas(cardRef.current, {
                scale: 2, // Double resolution for high-quality posts
                useCORS: true,
                allowTaint: true,
                backgroundColor: null,
                logging: false
            });

            const dataUrl = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.download = `court_availability_${targetDateStr}.png`;
            link.href = dataUrl;
            link.click();
        } catch (err) {
            console.error('Error exporting image:', err);
            alert('Failed to export image. Please try again.');
        } finally {
            setExporting(false);
        }
    };

    if (!isOpen) return null;

    const currentTheme = THEMES[activeTheme];
    const featuredCourtsData = scheduleData.filter(c => selectedCourtIds.includes(c.id));
    const formattedDisplayDate = format(new Date(targetDateStr), 'EEEE, MMMM d, yyyy');

    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(bookingLink || 'https://picklepoint.cebu')}`;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}></div>

            {/* Modal Box */}
            <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-6xl h-auto max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
                    <div>
                        <h2 className="text-xl font-bold font-display text-gray-800">Court Availability Marketing Exporter</h2>
                        <p className="text-xs text-gray-500 mt-0.5">Generate and download professional square graphics to post on Facebook & marketing channels.</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 flex flex-col lg:flex-row gap-8">
                    {/* Exporter Controls */}
                    <div className="flex-1 space-y-6 max-w-md">
                        {/* 1. Date Selector */}
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700">1. Select Date</label>
                            <div className="grid grid-cols-3 gap-2">
                                {[
                                    { id: 'today', label: 'Today' },
                                    { id: 'tomorrow', label: 'Tomorrow' },
                                    { id: 'custom', label: 'Custom' }
                                ].map(opt => (
                                    <button
                                        key={opt.id}
                                        type="button"
                                        onClick={() => setDateOption(opt.id)}
                                        className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                                            dateOption === opt.id
                                                ? 'bg-brand-green border-brand-green text-white shadow-sm'
                                                : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                                        }`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                            {dateOption === 'custom' && (
                                <input
                                    type="date"
                                    value={customDate}
                                    onChange={(e) => setCustomDate(e.target.value)}
                                    min={format(new Date(), 'yyyy-MM-dd')}
                                    className="w-full mt-2 px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-green focus:border-brand-green outline-none"
                                />
                            )}
                        </div>

                        {/* 2. Featured Courts Checklist */}
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700">2. Featured Courts</label>
                            <div className="border border-gray-200 rounded-xl p-3 max-h-36 overflow-y-auto space-y-2">
                                {courts.map(court => (
                                    <label key={court.id} className="flex items-center gap-2 text-xs font-medium text-gray-600 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={selectedCourtIds.includes(court.id)}
                                            onChange={() => handleCourtToggle(court.id)}
                                            className="h-4.5 w-4.5 rounded border-gray-300 text-brand-green focus:ring-brand-green"
                                        />
                                        <span>{court.name}</span>
                                    </label>
                                ))}
                                {courts.length === 0 && (
                                    <p className="text-xs text-gray-400">Loading courts...</p>
                                )}
                            </div>
                        </div>

                        {/* 3. Design Theme */}
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700">3. Select Theme</label>
                            <div className="grid grid-cols-2 gap-2">
                                {Object.keys(THEMES).map(themeKey => (
                                    <button
                                        key={themeKey}
                                        type="button"
                                        onClick={() => setActiveTheme(themeKey)}
                                        className={`px-3 py-2.5 rounded-xl text-xs font-semibold border flex items-center justify-between transition-all cursor-pointer ${
                                            activeTheme === themeKey
                                                ? 'bg-brand-orange border-brand-orange text-white shadow-sm'
                                                : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                                        }`}
                                    >
                                        <span>{THEMES[themeKey].name}</span>
                                        {activeTheme === themeKey && <Check size={14} />}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* 4. Custom CTA/Link */}
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700 flex items-center justify-between">
                                <span>4. Call-To-Action Link</span>
                                <span className="text-[10px] text-gray-400 font-normal">(QR code dynamically updates)</span>
                            </label>
                            <input
                                type="text"
                                value={bookingLink}
                                onChange={(e) => setBookingLink(e.target.value)}
                                placeholder="e.g. book.picklepointcebu.com"
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-green focus:border-brand-green outline-none"
                            />
                        </div>

                        {/* 5. Visibility Controls */}
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                            <div className="flex flex-col">
                                <span className="text-xs font-semibold text-gray-700">Show Booked Slots</span>
                                <span className="text-[10px] text-gray-500">Toggle whether to render unavailable times</span>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={showBookedSlots}
                                    onChange={(e) => setShowBookedSlots(e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-green"></div>
                            </label>
                        </div>
                    </div>

                    {/* Preview Area */}
                    <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 rounded-2xl p-4 border border-gray-200/60 overflow-hidden">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5 shrink-0">
                            <Sparkles size={13} className="text-brand-orange animate-pulse" /> Live Square Preview
                        </p>
                        
                        {/* Scale container to fit dynamic square preview without overflow */}
                        <div 
                            ref={wrapperRef} 
                            className="w-full flex-1 flex items-start justify-center overflow-hidden"
                            style={{ 
                                minHeight: `${Math.max(300, cardDimension * scale)}px`,
                                height: `${cardDimension * scale}px`,
                                position: 'relative'
                            }}
                        >
                            {/* The Capture Element */}
                            {/* MUST be exactly cardDimension x cardDimension for clean high-res export */}
                            {/* Strict inline styling for color properties */}
                            <div
                                ref={cardRef}
                                style={{
                                    width: `${cardDimension}px`,
                                    height: `${cardDimension}px`,
                                    padding: '30px',
                                    borderRadius: '0px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'space-between',
                                    boxSizing: 'border-box',
                                    transform: `scale(${scale})`,
                                    transformOrigin: 'top center',
                                    position: 'absolute',
                                    top: 0,
                                    left: '50%',
                                    marginLeft: `-${cardDimension / 2}px`,
                                    flexShrink: 0,
                                    ...currentTheme.container
                                }}
                                className="shadow-2xl"
                            >
                                {/* Background Accent Lines */}
                                <div className="absolute top-0 right-0 w-32 h-32 opacity-10 rounded-bl-full pointer-events-none" style={{ backgroundColor: currentTheme.accentText.color }}></div>

                                {/* Card Header */}
                                <div ref={headerRef} className="flex items-center gap-4 shrink-0">
                                    {clubInfo.logoUrl ? (
                                        <div style={{ width: '60px', height: '60px', borderRadius: '50%', overflow: 'hidden', border: `2px solid ${currentTheme.accentText.color || '#fff'}` }}>
                                            <img
                                                src={clubInfo.logoUrl}
                                                crossOrigin="anonymous"
                                                alt="Club Logo"
                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                            />
                                        </div>
                                    ) : (
                                        <div style={{
                                            width: '60px',
                                            height: '60px',
                                            borderRadius: '50%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontWeight: '800',
                                            fontSize: '22px',
                                            backgroundColor: currentTheme.accentText.color || '#adff2f',
                                            color: activeTheme === 'minimalLight' ? '#ffffff' : '#111827',
                                            border: '2px solid rgba(255,255,255,0.2)'
                                        }}>
                                            {clubInfo.initials}
                                        </div>
                                    )}
                                    <div className="flex-1">
                                        <h3 style={{ fontSize: '24px', fontWeight: '800', margin: 0, ...currentTheme.clubName }} className="font-display tracking-tight leading-tight">
                                            {clubInfo.name}
                                        </h3>
                                        <p style={{ fontSize: '14px', margin: '2px 0 0 0', fontWeight: '500', ...currentTheme.dateText }} className="uppercase tracking-widest font-semibold">
                                            Available Slots • {formattedDisplayDate}
                                        </p>
                                    </div>
                                </div>

                                {/* Card Body (Courts & Slots) */}
                                <div ref={bodyRef} className="flex-1 my-4 flex flex-col justify-start gap-3">
                                    {featuredCourtsData.map(court => {
                                        // Filter slots based on showBookedSlots
                                        const visibleSlots = showBookedSlots 
                                            ? court.slots 
                                            : court.slots.filter(s => s.status === 'available');

                                        return (
                                            <div key={court.id} className="space-y-2">
                                                <div style={{ ...currentTheme.courtName, paddingBottom: '4px' }} className="flex justify-between items-end">
                                                    <span style={{ fontSize: '16px', fontWeight: '700' }}>
                                                        {court.name}
                                                    </span>
                                                    <span style={{ fontSize: '11px', opacity: 0.8 }} className="font-semibold uppercase tracking-wider">
                                                        {court.slots.filter(s => s.status === 'available').length} Open Slot(s)
                                                    </span>
                                                </div>

                                                {visibleSlots.length > 0 ? (
                                                    <div className="flex flex-wrap gap-2 pt-1.5">
                                                        {visibleSlots.map(slot => {
                                                            const isAvail = slot.status === 'available';
                                                            const slotStyle = isAvail ? currentTheme.availableSlot : currentTheme.bookedSlot;
                                                            return (
                                                                <div
                                                                    key={slot.time}
                                                                    style={{
                                                                        display: 'inline-flex',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'center',
                                                                        minWidth: '58px',
                                                                        height: '26px',
                                                                        padding: '0 8px',
                                                                        borderRadius: '9999px',
                                                                        fontSize: '10px',
                                                                        fontWeight: '700',
                                                                        lineHeight: '1',
                                                                        textAlign: 'center',
                                                                        textDecoration: isAvail ? 'none' : 'line-through opacity-80',
                                                                        boxSizing: 'border-box',
                                                                        ...slotStyle
                                                                    }}
                                                                >
                                                                    {slot.label}
                                                                    {!isAvail && <span style={{ fontSize: '8px', marginLeft: '4px', opacity: 0.8 }} className="font-bold uppercase tracking-wider">Filled</span>}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                ) : (
                                                    <p style={{ fontSize: '12px', opacity: 0.6, fontStyle: 'italic', margin: '4px 0 0 0' }}>
                                                        No slots available to advertise for this court.
                                                    </p>
                                                )}
                                            </div>
                                        );
                                    })}
                                    {featuredCourtsData.length === 0 && (
                                        <div className="flex-1 flex items-center justify-center">
                                            <p style={{ fontSize: '14px', opacity: 0.6, fontStyle: 'italic' }}>
                                                Select one or more courts on the left to feature them.
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Card Footer (Booking Link & QR Code) */}
                                <div ref={footerRef} style={{ ...currentTheme.ctaSection, paddingTop: '15px' }} className="flex items-center justify-between shrink-0">
                                    <div className="flex-1 pr-6 space-y-1">
                                        <p style={{ fontSize: '12px', margin: 0, fontWeight: '700', opacity: 0.8, ...currentTheme.ctaText }} className="uppercase tracking-wider font-semibold">
                                            How to Book:
                                        </p>
                                        <p style={{ fontSize: '20px', fontWeight: '800', margin: 0, ...currentTheme.ctaLink }} className="font-display tracking-tight break-all">
                                            {bookingLink.replace(/^https?:\/\//, '')}
                                        </p>
                                        <p style={{ fontSize: '11px', margin: '4px 0 0 0', opacity: 0.7, ...currentTheme.ctaText }}>
                                            Scan the QR code or visit the booking link to secure your slot!
                                        </p>
                                    </div>
                                    <div style={{ ...currentTheme.qrBorder }} className="shrink-0 flex items-center justify-center">
                                        <img
                                            src={qrCodeUrl}
                                            crossOrigin="anonymous"
                                            style={{ width: '84px', height: '84px', objectFit: 'contain', display: 'block' }}
                                            alt="Booking QR Code"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-between items-center px-6 py-4 border-t border-gray-100 bg-gray-50 shrink-0">
                    <p className="text-xs text-gray-400">Card output matches square format (1:1 ratio) ideal for social media posts.</p>
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-100 transition-colors cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleDownload}
                            disabled={exporting || loading || selectedCourtIds.length === 0}
                            className="px-5 py-2 bg-brand-green text-white rounded-xl text-sm font-semibold hover:bg-brand-green-dark disabled:opacity-50 transition-colors flex items-center gap-2 cursor-pointer"
                        >
                            {exporting ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    Exporting...
                                </>
                            ) : (
                                <>
                                    <Download size={16} />
                                    Download Image
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
