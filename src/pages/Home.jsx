import { startOfToday, format } from 'date-fns';
import { useEffect, useState } from 'react';
import { ArrowRight, CalendarDays } from 'lucide-react';
import { BookingModal } from '../components/BookingModal';
import { BookingSlotModal } from '../components/BookingSlotModal';
import { Contact } from '../components/Contact';
import { Offers } from '../components/Offers';
import { Parking } from '../components/Parking';
import { CourtCard } from '../components/CourtCard';
import { Footer } from '../components/Footer';
import { Hero } from '../components/Hero';
import { Navbar } from '../components/Navbar';
import { Button } from '../components/ui';
import { orderCourtsForHomepage } from '../lib/courtDisplayOrder';
import { listCourts, subscribeToCourts } from '../services/courts';
import { subscribeToBookings } from '../services/booking';

const BOOKING_CACHE_TTL = 30_000;
const bookingCache = {};
const blockedCache = {};
const monthlyCache = {};

function getCached(cache, key) {
    const entry = cache[key];
    if (entry && Date.now() - entry.timestamp < BOOKING_CACHE_TTL) return entry.data;
    return null;
}

function setCache(cache, key, data) {
    cache[key] = { data, timestamp: Date.now() };
}

function invalidateBookingCaches() {
    Object.keys(bookingCache).forEach((key) => delete bookingCache[key]);
    Object.keys(blockedCache).forEach((key) => delete blockedCache[key]);
    Object.keys(monthlyCache).forEach((key) => delete monthlyCache[key]);
}

export function Home() {
    const [selectedCourt, setSelectedCourt] = useState(null);
    const [selectedDate, setSelectedDate] = useState(startOfToday());
    const [selectedTimes, setSelectedTimes] = useState([]);
    const [isSlotModalOpen, setIsSlotModalOpen] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeCourts, setActiveCourts] = useState([]);
    const [courtBookings, setCourtBookings] = useState([]);
    const [blockedSlots, setBlockedSlots] = useState([]);
    const [monthlyBookings, setMonthlyBookings] = useState([]);
    const [validationError, setValidationError] = useState('');

    const visibleCourts = orderCourtsForHomepage(
        (activeCourts || []).filter((court) => court.is_active !== false)
    );

    const isExclusiveCourtType = (courtType = '') => {
        return courtType.includes('Exclusive') || courtType.includes('Whole');
    };

    useEffect(() => {
        loadCourts();

        const subscription = subscribeToCourts((payload) => {
            const { eventType, new: newRecord, old: oldRecord } = payload;
            if (eventType === 'INSERT') {
                setActiveCourts((prev) => [newRecord, ...prev]);
            } else if (eventType === 'UPDATE') {
                setActiveCourts((prev) => prev.map((court) => (court.id === newRecord.id ? newRecord : court)));
            } else if (eventType === 'DELETE') {
                setActiveCourts((prev) => prev.filter((court) => court.id !== oldRecord.id));
            }
        });

        return () => {
            if (subscription) {
                subscription.unsubscribe();
            }
        };
    }, []);

    const loadCourts = async () => {
        try {
            const courts = await listCourts();
            setActiveCourts(courts || []);
        } catch {
            setActiveCourts([]);
        }
    };

    useEffect(() => {
        if (!selectedCourt) return undefined;

        loadBookings();
        loadBlockedSlots();
        loadMonthlyBookings();

        const subscription = subscribeToBookings((payload) => {
            const eventType = payload?.eventType;
            const records = [payload?.new, payload?.old].filter(Boolean);
            if (records.length === 0) return;

            const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
            const selectedMonth = selectedDate.getMonth();
            const selectedYear = selectedDate.getFullYear();
            const selectedIsExclusive = isExclusiveCourtType(selectedCourt?.type || '');
            const exclusiveCourtIds = new Set(
                (activeCourts || [])
                    .filter((court) => isExclusiveCourtType(court?.type || ''))
                    .map((court) => court.id)
            );

            const touchesSelectedCourtContext = records.some((record) => {
                if (selectedIsExclusive) return true;
                return record.court_id === selectedCourt.id || exclusiveCourtIds.has(record.court_id);
            });

            if (!touchesSelectedCourtContext) return;

            const touchesSelectedDay = records.some((record) => {
                if (!record?.booking_date) return false;
                if (eventType === 'DELETE') return record.booking_date === selectedDateStr;
                return record.booking_date === selectedDateStr;
            });

            const touchesSelectedMonth = records.some((record) => {
                if (!record?.booking_date) return false;
                const [y, m] = record.booking_date.split('-').map(Number);
                if (!y || !m) return false;
                return y === selectedYear && m - 1 === selectedMonth;
            });

            if (touchesSelectedDay) {
                loadBookings({ force: true });
                loadBlockedSlots({ force: true });
            }

            if (touchesSelectedMonth) {
                loadMonthlyBookings({ force: true });
            }
        });

        const handleBookingConflict = () => {
            invalidateBookingCaches();
            loadBookings({ force: true });
            loadBlockedSlots({ force: true });
            loadMonthlyBookings({ force: true });
            setSelectedTimes([]);
            setIsModalOpen(false);
            setIsSlotModalOpen(true);
            setValidationError('Please choose a different available time slot.');
        };

        window.addEventListener('bookingConflict', handleBookingConflict);

        return () => {
            if (subscription) {
                subscription.unsubscribe();
            }
            window.removeEventListener('bookingConflict', handleBookingConflict);
        };
    }, [selectedCourt, selectedDate, activeCourts]);

    const loadBookings = async ({ force = false } = {}) => {
        if (!selectedCourt) return;

        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        const cacheKey = `daily-${selectedCourt.id}-${dateStr}`;

        if (!force) {
            const cached = getCached(bookingCache, cacheKey);
            if (cached) {
                setCourtBookings(cached);
                return;
            }
        }

        try {
            const { getDailyBookings } = await import('../services/booking');
            const bookings = await getDailyBookings(dateStr);
            const result = bookings || [];
            setCache(bookingCache, cacheKey, result);
            setCourtBookings(result);
        } catch {
            setCourtBookings([]);
        }
    };

    const loadBlockedSlots = async ({ force = false } = {}) => {
        if (!selectedCourt) return;

        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        const isExclusive = selectedCourt.type === 'Exclusive / Whole Court';
        const cacheKey = isExclusive
            ? `blocked-all-${dateStr}`
            : `blocked-${selectedCourt.id}-${dateStr}`;

        if (!force) {
            const cached = getCached(blockedCache, cacheKey);
            if (cached) {
                setBlockedSlots(cached);
                return;
            }
        }

        try {
            const { supabase } = await import('../lib/supabaseClient');

            let query = supabase
                .from('blocked_time_slots')
                .select('time_slot')
                .eq('blocked_date', dateStr);

            if (isExclusive && activeCourts.length > 0) {
                query = query.in('court_id', activeCourts.map((court) => court.id));
            } else {
                query = query.eq('court_id', selectedCourt.id);
            }

            const { data, error } = await query;

            if (error) {
                setBlockedSlots([]);
            } else {
                const result = [...new Set(data?.map((item) => item.time_slot) || [])];
                setCache(blockedCache, cacheKey, result);
                setBlockedSlots(result);
            }
        } catch {
            setBlockedSlots([]);
        }
    };

    const loadMonthlyBookings = async ({ force = false } = {}) => {
        if (!selectedCourt) return;

        const monthKey = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}`;
        const cacheKey = `monthly-${selectedCourt.id}-${monthKey}`;

        if (!force) {
            const cached = getCached(monthlyCache, cacheKey);
            if (cached) {
                setMonthlyBookings(cached);
                return;
            }
        }

        try {
            const startOfMonthDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
            const endOfMonthDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);

            const { supabase } = await import('../lib/supabaseClient');
            const { data, error } = await supabase
                .from('bookings')
                .select('id, court_id, booking_date, start_time, end_time, booked_times, status, courts(id, type)')
                .gte('booking_date', format(startOfMonthDate, 'yyyy-MM-dd'))
                .lte('booking_date', format(endOfMonthDate, 'yyyy-MM-dd'))
                .in('status', ['Confirmed', 'Rescheduled']);

            if (error) {
                setMonthlyBookings([]);
            } else {
                const result = data || [];
                setCache(monthlyCache, cacheKey, result);
                setMonthlyBookings(result);
            }
        } catch {
            setMonthlyBookings([]);
        }
    };

    const handleBookClick = (court) => {
        const isActive = court.is_active !== false;
        if (!isActive) {
            setValidationError('This court is currently unavailable for booking.');
            return;
        }

        setSelectedCourt(court);
        setSelectedDate(startOfToday());
        setSelectedTimes([]);
        setValidationError('');
        setIsModalOpen(false);
        setIsSlotModalOpen(true);
    };

    const handleDateSelect = (date) => {
        setSelectedDate(date);
        setSelectedTimes([]);
        setValidationError('');
    };

    const handleTimeSelect = (time) => {
        if (!selectedCourt) {
            setValidationError('Please select a court first.');
            return;
        }

        const newTimes = selectedTimes.includes(time)
            ? selectedTimes.filter((selectedTime) => selectedTime !== time)
            : [...selectedTimes, time];

        setSelectedTimes(newTimes);
        if (newTimes.length > 0) {
            setValidationError('');
        }
    };

    const handleSlotModalClose = () => {
        setIsSlotModalOpen(false);
        setSelectedTimes([]);
        setValidationError('');
    };

    const handleProceedToDetails = () => {
        if (selectedTimes.length === 0) {
            setValidationError('Please select at least one time slot.');
            return;
        }

        setValidationError('');
        setIsSlotModalOpen(false);
        setIsModalOpen(true);
    };

    const getBookedTimes = () => {
        const bookedSlots = new Set();

        blockedSlots.forEach((slot) => {
            bookedSlots.add(slot.substring(0, 5));
        });

        const today = startOfToday();
        const isToday = format(selectedDate, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');

        if (isToday) {
            const now = new Date();
            const currentHour = now.getHours();

            for (let hour = 0; hour <= currentHour; hour += 1) {
                bookedSlots.add(`${hour.toString().padStart(2, '0')}:00`);
            }
        }

        if (!courtBookings || courtBookings.length === 0) {
            return Array.from(bookedSlots);
        }

        const isExclusiveSelected = selectedCourt?.type?.includes('Exclusive') || selectedCourt?.type?.includes('Whole');

        courtBookings.forEach((booking) => {
            let isConflict = false;

            if (booking.court_id === selectedCourt.id) {
                isConflict = true;
            } else if (isExclusiveSelected) {
                isConflict = true;
            } else if (booking.courts?.type?.includes('Exclusive') || booking.courts?.type?.includes('Whole')) {
                isConflict = true;
            }

            if (isConflict && booking.start_time && booking.end_time) {
                if (booking.booked_times && Array.isArray(booking.booked_times) && booking.booked_times.length > 0) {
                    booking.booked_times.forEach((time) => {
                        if (time && typeof time === 'string') {
                            bookedSlots.add(time.substring(0, 5));
                        }
                    });
                } else {
                    const [startHour] = booking.start_time.substring(0, 5).split(':').map(Number);
                    const [endHour] = booking.end_time.substring(0, 5).split(':').map(Number);

                    for (let hour = startHour; hour < endHour; hour += 1) {
                        bookedSlots.add(`${hour.toString().padStart(2, '0')}:00`);
                    }
                }
            }
        });

        return Array.from(bookedSlots);
    };

    const getFullyBookedDates = () => {
        if (!selectedCourt || !monthlyBookings || monthlyBookings.length === 0) return [];

        const isExclusiveSelected = selectedCourt?.type?.includes('Exclusive') || selectedCourt?.type?.includes('Whole');
        const allTimeSlots = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`);
        const totalSlots = allTimeSlots.length;
        const bookingsByDate = {};

        monthlyBookings.forEach((booking) => {
            const bookingDate = booking.booking_date;
            let isConflict = false;

            if (booking.court_id === selectedCourt.id) {
                isConflict = true;
            } else if (isExclusiveSelected) {
                isConflict = true;
            } else if (booking.courts?.type?.includes('Exclusive') || booking.courts?.type?.includes('Whole')) {
                isConflict = true;
            }

            if (!isConflict) return;

            if (!bookingsByDate[bookingDate]) {
                bookingsByDate[bookingDate] = new Set();
            }

            if (booking.booked_times && Array.isArray(booking.booked_times) && booking.booked_times.length > 0) {
                booking.booked_times.forEach((time) => {
                    if (time && typeof time === 'string') {
                        bookingsByDate[bookingDate].add(time.substring(0, 5));
                    }
                });
            } else if (booking.start_time && booking.end_time) {
                const [startHour] = booking.start_time.substring(0, 5).split(':').map(Number);
                const [endHour] = booking.end_time.substring(0, 5).split(':').map(Number);

                for (let hour = startHour; hour < endHour; hour += 1) {
                    bookingsByDate[bookingDate].add(`${hour.toString().padStart(2, '0')}:00`);
                }
            }
        });

        const dateStatuses = [];
        Object.keys(bookingsByDate).forEach((date) => {
            const bookedSlotsCount = bookingsByDate[date].size;

            if (bookedSlotsCount >= totalSlots) {
                dateStatuses.push({ date, status: 'fully-booked' });
            } else if (bookedSlotsCount > 0) {
                dateStatuses.push({ date, status: 'partially-booked' });
            }
        });

        return dateStatuses;
    };

    const bookedTimes = getBookedTimes();
    const fullyBookedDates = getFullyBookedDates();

    const handleBookingConfirm = async (bookingData) => {
        try {
            const { createBooking, uploadProofOfPayment } = await import('../services/booking');

            const timeSlots = bookingData.times && bookingData.times.length > 0
                ? bookingData.times
                : [bookingData.time];

            if (!timeSlots || timeSlots.length === 0) {
                throw new Error('No time slots selected');
            }

            const sortedSlots = [...timeSlots].sort();
            const firstSlot = sortedSlots[0];
            const lastSlot = sortedSlots[sortedSlots.length - 1];

            let startTime = '08:00';
            if (firstSlot && typeof firstSlot === 'string') {
                if (firstSlot.includes('-')) {
                    startTime = firstSlot.split('-')[0].trim();
                } else {
                    startTime = firstSlot.trim();
                }
            }

            let endTime = '09:00';
            if (lastSlot && typeof lastSlot === 'string') {
                let lastSlotTime = lastSlot.trim();
                if (lastSlot.includes('-')) {
                    lastSlotTime = lastSlot.split('-')[0].trim();
                }
                const [hours, minutes] = lastSlotTime.split(':');
                const endHour = parseInt(hours, 10) + 1;
                endTime = `${endHour.toString().padStart(2, '0')}:${minutes}`;
            }

            let proofOfPaymentUrl = null;
            if (bookingData.paymentProof) {
                try {
                    const tempId = `temp-${Date.now()}`;
                    proofOfPaymentUrl = await uploadProofOfPayment(bookingData.paymentProof, tempId);

                    if (!proofOfPaymentUrl) {
                        throw new Error('Failed to get upload URL');
                    }
                } catch {
                    throw new Error('Failed to upload proof of payment. Please try again.');
                }
            }

            const newBooking = await createBooking({
                courtId: selectedCourt.id,
                customerName: bookingData.name,
                customerEmail: bookingData.email,
                customerPhone: bookingData.phone,
                bookingDate: format(selectedDate, 'yyyy-MM-dd'),
                startTime,
                endTime,
                totalPrice: bookingData.totalPrice || 0,
                notes: bookingData.reference || '',
                proofOfPaymentUrl,
                bookedTimes: sortedSlots,
                courtType: selectedCourt.type
            });

            invalidateBookingCaches();
            await loadBookings({ force: true });

            return newBooking;
        } catch (err) {
            invalidateBookingCaches();
            await loadBookings({ force: true });
            await loadBlockedSlots({ force: true });
            await loadMonthlyBookings({ force: true });
            throw err;
        }
    };

    return (
        <div className="min-h-[100dvh] overflow-hidden bg-bg-user font-sans text-primary-dark selection:bg-secondary-light selection:text-secondary">
            <a href="#courts" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[80] focus:rounded-full focus:bg-white focus:px-5 focus:py-3 focus:text-sm focus:font-semibold focus:text-primary-dark focus:shadow-xl">
                Skip to court booking
            </a>
            <Navbar />
            <Hero />
            <Offers />

            <main className="relative overflow-hidden bg-[linear-gradient(145deg,#f6ebd2_0%,#ebf5d5_46%,#dceff4_100%)]">
                <section id="courts" className="relative mx-auto max-w-[1500px] scroll-mt-28 px-4 py-28 sm:px-6 sm:py-36 lg:px-8">
                    <div className="absolute -left-36 top-20 h-96 w-96 rounded-full bg-secondary/20 blur-3xl" aria-hidden="true" />
                    <div className="absolute -right-24 bottom-20 h-80 w-80 rounded-full bg-sky-300/20 blur-3xl" aria-hidden="true" />

                    <div className="relative mb-16 grid gap-10 lg:grid-cols-[1fr_0.9fr] lg:items-end">
                        <div>
                            <span className="section-kicker">Court selection</span>
                            <h2 className="mt-6 max-w-5xl text-balance font-display text-5xl font-extrabold leading-[0.86] tracking-[-0.065em] text-primary-dark sm:text-6xl lg:text-8xl">
                                Choose the court. Keep the rest easy.
                            </h2>
                        </div>

                        <div className="premium-shell rounded-[2.6rem] p-2">
                            <div className="grid overflow-hidden rounded-[2.1rem] bg-primary-dark text-white sm:grid-cols-[0.8fr_1.2fr]">
                                <div className="p-7 sm:p-8">
                                    <p className="font-mono text-[0.64rem] font-semibold uppercase tracking-[0.18em] text-secondary">Booking flow</p>
                                    <p className="mt-4 text-2xl font-extrabold tracking-[-0.04em]">Real court photos, real slots, no admin clutter.</p>
                                    <p className="mt-3 text-sm leading-6 text-white/68">
                                        Guests see the court, pick a date, select available hours, and continue to payment details.
                                    </p>
                                </div>
                                <div className="relative min-h-64 overflow-hidden">
                                    <img src="/kennydink/net.jpg" alt="Kenny Dink court seen through the net" className="h-full w-full object-cover" />
                                    <div className="absolute inset-0 bg-gradient-to-l from-transparent to-primary-dark/28" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {visibleCourts.length > 0 ? (
                        <div className="grid gap-6 lg:grid-cols-12">
                            {visibleCourts.map((court, index) => {
                                const isFeatured = index % 5 === 0;
                                const spanClass = isFeatured ? 'lg:col-span-7' : 'lg:col-span-5';

                                return (
                                    <div key={court.id} className={spanClass}>
                                        <CourtCard court={court} onBook={handleBookClick} featured={isFeatured} visualIndex={index} />
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="venue-panel mx-auto max-w-2xl rounded-[2rem] p-8 text-center">
                            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-light text-primary-dark">
                                <CalendarDays size={24} aria-hidden="true" />
                            </div>
                            <h3 className="mt-5 text-2xl font-bold tracking-tight text-primary-dark">No courts are published yet</h3>
                            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-stone-600">
                                Courts will appear here as soon as active inventory is published from the admin area.
                            </p>
                        </div>
                    )}

                    {validationError && !isSlotModalOpen && (
                        <div className="mx-auto mt-8 max-w-2xl rounded-[1.5rem] border border-red-200 bg-red-50/90 px-5 py-4 text-center shadow-[0_20px_60px_-44px_rgba(185,28,28,0.65)]">
                            <p className="text-sm font-semibold text-red-700">{validationError}</p>
                        </div>
                    )}

                    {selectedCourt && !isSlotModalOpen && !isModalOpen && (
                        <div className="venue-panel mx-auto mt-8 flex max-w-3xl flex-col gap-5 rounded-[2rem] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                            <div>
                                <p className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-secondary">Last selected court</p>
                                <h3 className="mt-2 text-2xl font-bold tracking-tight text-primary-dark">{selectedCourt.name}</h3>
                                <p className="mt-1 text-sm text-stone-600">Open the booking drawer again to choose a fresh date and time.</p>
                            </div>
                            <Button
                                variant="secondary"
                                onClick={() => handleBookClick(selectedCourt)}
                                className="w-full sm:w-auto"
                            >
                                Continue booking <ArrowRight size={17} aria-hidden="true" />
                            </Button>
                        </div>
                    )}
                </section>
            </main>

            <Contact />
            <Parking />
            <Footer />

            <BookingSlotModal
                isOpen={isSlotModalOpen}
                onClose={handleSlotModalClose}
                onProceed={handleProceedToDetails}
                selectedCourt={selectedCourt}
                selectedDate={selectedDate}
                selectedTimes={selectedTimes}
                bookedTimes={bookedTimes}
                fullyBookedDates={fullyBookedDates}
                onDateSelect={handleDateSelect}
                onTimeSelect={handleTimeSelect}
                validationError={validationError}
            />

            <BookingModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setSelectedTimes([]);
                    setValidationError('');
                }}
                bookingData={{ court: selectedCourt, date: selectedDate, times: selectedTimes }}
                onConfirm={handleBookingConfirm}
            />
        </div>
    );
}
