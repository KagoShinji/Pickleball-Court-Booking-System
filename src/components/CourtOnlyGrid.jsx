import { useState, useEffect, useCallback, useRef } from 'react';
import {
    addMonths,
    eachDayOfInterval,
    endOfMonth,
    format,
    getDay,
    isBefore,
    isSameDay,
    startOfMonth,
    startOfToday,
    subMonths
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from './ui';
import { subscribeToBookings } from '../services/booking';
import { useOCR } from '../providers/OCRContext';

const BOOKING_CACHE_TTL = 30_000;
const gridBookingCache = {};
const gridBlockedCache = {};
const gridMonthlyCache = {};

function getCached(cache, key) {
    const entry = cache[key];
    if (entry && Date.now() - entry.timestamp < BOOKING_CACHE_TTL) return entry.data;
    return null;
}

function setCache(cache, key, data) {
    cache[key] = { data, timestamp: Date.now() };
}

export function CourtOnlyGrid({ courts, onBookSlot }) {
    const today = startOfToday();
    const { initializeOCR } = useOCR();
    const [selectedDate, setSelectedDate] = useState(today);
    const [currentMonth, setCurrentMonth] = useState(startOfMonth(today));
    const [allBookings, setAllBookings] = useState([]);
    const [allBlockedSlots, setAllBlockedSlots] = useState([]);
    const [monthlyBookings, setMonthlyBookings] = useState([]);
    const [selectedCourtId, setSelectedCourtId] = useState(null);
    const [selectedSlots, setSelectedSlots] = useState([]);
    const mountedRef = useRef(true);

    useEffect(() => {
        mountedRef.current = true;
        return () => { mountedRef.current = false; };
    }, []);

    useEffect(() => {
        if (selectedDate) {
            setCurrentMonth(startOfMonth(selectedDate));
            setSelectedSlots([]);
            setSelectedCourtId(null);
            // Pre-warm Tesseract OCR engine when date is selected/changed
            initializeOCR().catch(() => {});
        }
    }, [selectedDate, initializeOCR]);

    // Load daily bookings for all courts
    const loadBookings = useCallback(async (force = false) => {
        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        const cacheKey = `grid-daily-${dateStr}`;

        if (!force) {
            const cached = getCached(gridBookingCache, cacheKey);
            if (cached) { setAllBookings(cached); return; }
        }

        try {
            const { getDailyBookings } = await import('../services/booking');
            const bookings = await getDailyBookings(dateStr);
            const result = bookings || [];
            setCache(gridBookingCache, cacheKey, result);
            if (mountedRef.current) setAllBookings(result);
        } catch {
            if (mountedRef.current) setAllBookings([]);
        }
    }, [selectedDate]);

    // Load blocked slots for all courts
    const loadBlockedSlots = useCallback(async (force = false) => {
        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        const cacheKey = `grid-blocked-${dateStr}`;

        if (!force) {
            const cached = getCached(gridBlockedCache, cacheKey);
            if (cached) { setAllBlockedSlots(cached); return; }
        }

        try {
            const { supabase } = await import('../lib/supabaseClient');
            const courtIds = courts.map((c) => c.id);
            const { data, error } = await supabase
                .from('blocked_time_slots')
                .select('time_slot, court_id')
                .eq('blocked_date', dateStr)
                .in('court_id', courtIds);

            if (error) {
                if (mountedRef.current) setAllBlockedSlots([]);
            } else {
                const result = data || [];
                setCache(gridBlockedCache, cacheKey, result);
                if (mountedRef.current) setAllBlockedSlots(result);
            }
        } catch {
            if (mountedRef.current) setAllBlockedSlots([]);
        }
    }, [selectedDate, courts]);

    // Load monthly bookings for calendar indicators
    const loadMonthlyBookings = useCallback(async (force = false) => {
        const monthKey = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}`;
        const cacheKey = `grid-monthly-${monthKey}`;

        if (!force) {
            const cached = getCached(gridMonthlyCache, cacheKey);
            if (cached) { setMonthlyBookings(cached); return; }
        }

        try {
            const startOfMonthDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
            const endOfMonthDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);

            const { supabase } = await import('../lib/supabaseClient');
            const { data, error } = await supabase
                .from('bookings')
                .select('id, court_id, booking_date, start_time, end_time, booked_times, status')
                .gte('booking_date', format(startOfMonthDate, 'yyyy-MM-dd'))
                .lte('booking_date', format(endOfMonthDate, 'yyyy-MM-dd'))
                .in('status', ['Confirmed', 'Rescheduled']);

            if (error) {
                if (mountedRef.current) setMonthlyBookings([]);
            } else {
                const result = data || [];
                setCache(gridMonthlyCache, cacheKey, result);
                if (mountedRef.current) setMonthlyBookings(result);
            }
        } catch {
            if (mountedRef.current) setMonthlyBookings([]);
        }
    }, [selectedDate]);

    useEffect(() => {
        loadBookings();
        loadBlockedSlots();
        loadMonthlyBookings();

        const subscription = subscribeToBookings(() => {
            loadBookings(true);
            loadBlockedSlots(true);
            loadMonthlyBookings(true);
        });

        return () => {
            if (subscription) subscription.unsubscribe();
        };
    }, [loadBookings, loadBlockedSlots, loadMonthlyBookings]);

    // Build time slots (24 hours)
    const timeSlots = Array.from({ length: 24 }, (_, i) => {
        const hour = i.toString().padStart(2, '0');
        const startPeriod = i < 12 ? 'am' : 'pm';
        const startDisplayHour = i === 0 ? 12 : (i > 12 ? i - 12 : i);
        const endHourNum = (i + 1) % 24;
        const endPeriod = endHourNum < 12 ? 'am' : 'pm';
        const endDisplayHour = endHourNum === 0 ? 12 : (endHourNum > 12 ? endHourNum - 12 : endHourNum);

        return {
            id: `${hour}:00`,
            label: `${startDisplayHour}${startPeriod}-${endDisplayHour}${endPeriod}`
        };
    });

    // Check if a specific slot is booked for a specific court
    const isSlotBooked = (courtId, slotId) => {
        // Check blocked slots
        const isBlocked = allBlockedSlots.some(
            (b) => b.court_id === courtId && b.time_slot?.substring(0, 5) === slotId
        );
        if (isBlocked) return true;

        // Check past times for today
        const isToday = format(selectedDate, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
        if (isToday) {
            const now = new Date();
            const slotHour = parseInt(slotId.split(':')[0], 10);
            if (slotHour <= now.getHours()) return true;
        }

        // Check bookings
        return allBookings.some((booking) => {
            if (booking.court_id !== courtId) return false;

            if (booking.booked_times && Array.isArray(booking.booked_times) && booking.booked_times.length > 0) {
                return booking.booked_times.some((time) => time?.substring(0, 5) === slotId);
            }

            if (booking.start_time && booking.end_time) {
                const [startHour] = booking.start_time.substring(0, 5).split(':').map(Number);
                const [endHour] = booking.end_time.substring(0, 5).split(':').map(Number);
                const slotHour = parseInt(slotId.split(':')[0], 10);
                return slotHour >= startHour && slotHour < endHour;
            }

            return false;
        });
    };

    // Also check if exclusive court bookings block these courts
    const isSlotBlockedByExclusive = (slotId) => {
        return allBookings.some((booking) => {
            const bookingType = booking.courts?.type || '';
            const isExclusive = bookingType.includes('Exclusive') || bookingType.includes('Whole');
            if (!isExclusive) return false;

            if (booking.booked_times && Array.isArray(booking.booked_times) && booking.booked_times.length > 0) {
                return booking.booked_times.some((time) => time?.substring(0, 5) === slotId);
            }

            if (booking.start_time && booking.end_time) {
                const [startHour] = booking.start_time.substring(0, 5).split(':').map(Number);
                const [endHour] = booking.end_time.substring(0, 5).split(':').map(Number);
                const slotHour = parseInt(slotId.split(':')[0], 10);
                return slotHour >= startHour && slotHour < endHour;
            }

            return false;
        });
    };

    const getSlotStatus = (courtId, slotId) => {
        if (isSlotBooked(courtId, slotId) || isSlotBlockedByExclusive(slotId)) return 'booked';
        return 'open';
    };

    // Calendar logic
    const days = eachDayOfInterval({
        start: startOfMonth(currentMonth),
        end: endOfMonth(currentMonth),
    });
    const startingDayIndex = getDay(startOfMonth(currentMonth));
    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

    // Calendar date statuses
    const getDateStatus = (dateStr) => {
        const courtIds = courts.map((c) => c.id);
        const dayBookings = monthlyBookings.filter((b) => b.booking_date === dateStr && courtIds.includes(b.court_id));
        if (dayBookings.length === 0) return null;

        const bookedSlots = new Set();
        dayBookings.forEach((booking) => {
            if (booking.booked_times?.length > 0) {
                booking.booked_times.forEach((t) => bookedSlots.add(t?.substring(0, 5)));
            } else if (booking.start_time && booking.end_time) {
                const [sh] = booking.start_time.split(':').map(Number);
                const [eh] = booking.end_time.split(':').map(Number);
                for (let h = sh; h < eh; h++) bookedSlots.add(`${h.toString().padStart(2, '0')}:00`);
            }
        });

        if (bookedSlots.size >= 24) return 'fully-booked';
        if (bookedSlots.size > 0) return 'partially-booked';
        return null;
    };

    const handleSlotClick = (court, slotId) => {
        if (selectedCourtId && selectedCourtId !== court.id) {
            // Switching courts — reset and start fresh
            setSelectedCourtId(court.id);
            setSelectedSlots([slotId]);
            return;
        }

        setSelectedCourtId(court.id);
        setSelectedSlots((prev) =>
            prev.includes(slotId)
                ? prev.filter((s) => s !== slotId)
                : [...prev, slotId]
        );
    };

    const handleProceed = () => {
        if (!selectedCourtId || selectedSlots.length === 0) return;
        const court = courts.find((c) => c.id === selectedCourtId);
        if (court && onBookSlot) {
            onBookSlot(court, selectedDate, selectedSlots.sort());
        }
    };

    const selectedCourtName = selectedCourtId
        ? courts.find((c) => c.id === selectedCourtId)?.name
        : null;

    return (
        <div className="max-w-6xl mx-auto">
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                <div className="flex flex-col lg:flex-row">
                    {/* LEFT: Calendar + Legend */}
                    <div className="lg:w-[320px] p-6 border-b lg:border-b-0 lg:border-r border-gray-100 bg-gradient-to-b from-white to-gray-50/50">
                        {/* Legend */}
                        <div className="mb-6 p-3 bg-white rounded-xl border border-gray-100 shadow-sm">
                            <div className="flex flex-wrap gap-3 text-xs">
                                <div className="flex items-center gap-1.5">
                                    <div className="w-3 h-3 rounded-full bg-white border-2 border-brand-green"></div>
                                    <span className="text-gray-600">Available</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-3 h-3 rounded-full bg-brand-orange/30 border-2 border-brand-orange"></div>
                                    <span className="text-gray-600">Partially Booked</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-3 h-3 rounded-full bg-red-100 border-2 border-red-400"></div>
                                    <span className="text-gray-600">Fully Booked</span>
                                </div>
                            </div>
                        </div>

                        {/* Calendar */}
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-display font-bold text-lg text-brand-green-dark">
                                    {format(currentMonth, 'MMMM yyyy')}
                                </h3>
                                <div className="flex gap-1">
                                    <button
                                        onClick={prevMonth}
                                        disabled={isBefore(subMonths(currentMonth, 1), startOfMonth(today))}
                                        className="p-1.5 rounded-full hover:bg-gray-100 disabled:opacity-30 transition-colors"
                                    >
                                        <ChevronLeft size={18} className="text-gray-600" />
                                    </button>
                                    <button
                                        onClick={nextMonth}
                                        className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                                    >
                                        <ChevronRight size={18} className="text-gray-600" />
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-7 gap-y-1.5 mb-1">
                                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
                                    <div key={`${day}-${idx}`} className="text-center text-xs font-semibold text-gray-400">
                                        {day}
                                    </div>
                                ))}

                                {Array.from({ length: startingDayIndex }).map((_, i) => (
                                    <div key={`empty-${i}`} />
                                ))}

                                {days.map((day) => {
                                    const isSelected = isSameDay(day, selectedDate);
                                    const isPast = isBefore(day, today);
                                    const isTodayDate = isSameDay(day, today);
                                    const dateStr = format(day, 'yyyy-MM-dd');
                                    const dateStatus = getDateStatus(dateStr);
                                    const isFullyBooked = dateStatus === 'fully-booked';
                                    const isPartiallyBooked = dateStatus === 'partially-booked';

                                    return (
                                        <div key={day.toString()} className="flex justify-center">
                                            <button
                                                onClick={() => !isPast && !isFullyBooked && setSelectedDate(day)}
                                                disabled={isPast || isFullyBooked}
                                                className={cn(
                                                    'h-9 w-9 rounded-full flex items-center justify-center text-sm transition-all duration-200',
                                                    isSelected && 'bg-brand-green text-white font-bold shadow-md ring-2 ring-brand-green ring-offset-1',
                                                    !isSelected && isPast && 'text-gray-300 cursor-not-allowed',
                                                    !isSelected && !isPast && isFullyBooked && 'bg-red-100 border-2 border-red-400 text-red-600 font-semibold cursor-not-allowed',
                                                    !isSelected && !isPast && isPartiallyBooked && 'bg-brand-orange/30 border-2 border-brand-orange text-gray-700 hover:bg-brand-orange/40',
                                                    !isSelected && !isPast && !isFullyBooked && !isPartiallyBooked && 'hover:bg-brand-green/20 text-gray-700',
                                                    !isSelected && isTodayDate && !isFullyBooked && 'border-2 border-brand-green text-brand-green font-semibold',
                                                )}
                                            >
                                                {format(day, 'd')}
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* RIGHT: Time Slot Grid Table */}
                    <div className="flex-1 flex flex-col min-w-0">
                        {/* Date Header */}
                        <div className="px-4 py-2.5 bg-gradient-to-r from-brand-green-light/50 to-white border-b border-gray-100 text-center">
                            <h3 className="text-lg font-display font-bold text-brand-green-dark">
                                {format(selectedDate, 'EEE, MMMM d, yyyy')}
                            </h3>
                            <p className="text-[11px] text-gray-500 mt-0.5">Tap available slots below to start booking</p>
                        </div>

                        {/* Status Legend */}
                        <div className="px-4 py-1.5 border-b border-gray-100 bg-gray-50/50">
                            <div className="flex items-center justify-center gap-4 text-[11px]">
                                <div className="flex items-center gap-1">
                                    <span className="inline-block w-2.5 h-2.5 rounded border-2 border-brand-green bg-white"></span>
                                    <span className="text-gray-600 font-medium">Open</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <span className="inline-block w-2.5 h-2.5 rounded bg-brand-orange"></span>
                                    <span className="text-gray-600 font-medium">Selected</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <span className="inline-block w-2.5 h-2.5 rounded bg-gray-200"></span>
                                    <span className="text-gray-600 font-medium">Booked</span>
                                </div>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="flex-1 overflow-auto max-h-[520px]">
                            <table className="w-full border-collapse">
                                <thead className="sticky top-0 z-10 bg-white">
                                    <tr>
                                        <th className="px-3 py-2 text-left text-[11px] font-bold uppercase tracking-wider text-gray-400 border-b border-gray-100 bg-white">
                                            Time
                                        </th>
                                        {courts.map((court) => (
                                            <th key={court.id} className="px-2 py-2 text-center border-b border-gray-100 bg-white">
                                                <div className="text-xs font-bold text-brand-green-dark">{court.name}</div>
                                                <div className="text-[10px] text-brand-orange font-semibold">₱{court.price}/hr</div>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {timeSlots.map((slot, idx) => (
                                        <tr
                                            key={slot.id}
                                            className={cn(
                                                'transition-colors',
                                                idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'
                                            )}
                                        >
                                            <td className="px-3 py-1 text-[11px] font-medium text-gray-500 border-r border-gray-50 whitespace-nowrap">
                                                {slot.label}
                                            </td>
                                            {courts.map((court) => {
                                                const status = getSlotStatus(court.id, slot.id);
                                                const isOpen = status === 'open';
                                                const isSelected = selectedCourtId === court.id && selectedSlots.includes(slot.id);

                                                return (
                                                    <td key={court.id} className="px-1.5 py-1 text-center">
                                                        <button
                                                            onClick={() => isOpen && handleSlotClick(court, slot.id)}
                                                            disabled={!isOpen && !isSelected}
                                                            className={cn(
                                                                'inline-flex items-center justify-center px-5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 min-w-[72px]',
                                                                isSelected
                                                                    ? 'bg-brand-orange text-white border border-brand-orange shadow-md cursor-pointer'
                                                                    : isOpen
                                                                        ? 'bg-brand-green/10 text-brand-green border border-brand-green/30 hover:bg-brand-green hover:text-white cursor-pointer'
                                                                        : 'bg-gray-50 text-gray-300 border border-gray-100 cursor-not-allowed'
                                                            )}
                                                        >
                                                            {isSelected ? 'Selected' : isOpen ? 'Open' : 'Booked'}
                                                        </button>
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Proceed Bar */}
                        {selectedSlots.length > 0 && (
                            <div className="shrink-0 px-4 py-3 border-t border-gray-100 bg-white flex items-center justify-between">
                                <p className="text-sm text-gray-600">
                                    <span className="font-semibold text-brand-green-dark">{selectedCourtName}</span>
                                    {' — '}
                                    <span className="font-bold text-brand-orange">{selectedSlots.length} slot{selectedSlots.length > 1 ? 's' : ''}</span> selected
                                </p>
                                <button
                                    onClick={handleProceed}
                                    className="px-6 py-2 bg-gradient-to-r from-brand-green to-brand-green-dark text-white text-sm font-semibold rounded-xl shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer"
                                >
                                    Proceed to Booking
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
