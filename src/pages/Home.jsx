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
import { useCompany, isHourWithinOperatingHours } from '../lib/CompanyProvider';
import { getCompanyId } from '../lib/config';
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
    const { company } = useCompany();
    const courtsContent = company.sectionContent?.courts || {};
    const courtGallery = company.siteImages?.galleries?.courts || [];
    const flowImage = courtGallery[1] || courtGallery[0] || '/images/court2.jpg';
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
                .eq('blocked_date', dateStr)
                .eq('company_id', getCompanyId());

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
                .eq('company_id', getCompanyId())
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

        // Find the first open day starting from today
        const openDays = company?.operatingHours?.openDays || [0, 1, 2, 3, 4, 5, 6];
        let targetDate = startOfToday();
        let safetyCounter = 0;
        while (!openDays.includes(targetDate.getDay()) && safetyCounter < 7) {
            targetDate = new Date(targetDate.getTime() + 24 * 60 * 60 * 1000);
            safetyCounter++;
        }

        setSelectedDate(targetDate);
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
        
        const operatingHours = company?.operatingHours || { open: '08:00', close: '22:00' };
        const allTimeSlots = [];
        for (let i = 0; i < 24; i++) {
            if (isHourWithinOperatingHours(i, operatingHours)) {
                allTimeSlots.push(`${i.toString().padStart(2, '0')}:00`);
            }
        }
        const allTimeSlotsSet = new Set(allTimeSlots);
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
                        const t = time.substring(0, 5);
                        if (allTimeSlotsSet.has(t)) {
                            bookingsByDate[bookingDate].add(t);
                        }
                    }
                });
            } else if (booking.start_time && booking.end_time) {
                const [startHour] = booking.start_time.substring(0, 5).split(':').map(Number);
                const [endHour] = booking.end_time.substring(0, 5).split(':').map(Number);

                for (let hour = startHour; hour < endHour; hour += 1) {
                    const t = `${hour.toString().padStart(2, '0')}:00`;
                    if (allTimeSlotsSet.has(t)) {
                        bookingsByDate[bookingDate].add(t);
                    }
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
        <div className="min-h-[100dvh] overflow-hidden bg-[#fff8e7] font-sans text-primary-dark selection:bg-secondary-light selection:text-secondary">
            <a href="#courts" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[80] focus:rounded-full focus:bg-white focus:px-5 focus:py-3 focus:text-sm focus:font-semibold focus:text-primary-dark focus:shadow-xl">
                Skip to court booking
            </a>
            <Navbar />
            <Hero />
            <Offers />

            <main className="sport-section sport-section-courts flex items-center">
                <p className="pointer-events-none absolute left-4 bottom-[-1.5rem] z-[1] hidden select-none font-display text-[clamp(5rem,14vw,15rem)] font-extrabold uppercase leading-none text-primary-dark/[0.045] sm:block lg:left-12">
                    Courts
                </p>

                <section id="courts" className="mx-auto w-full max-w-[1540px] scroll-mt-28 px-5 py-16 sm:px-8 sm:py-20 lg:px-12 lg:py-24 xl:px-14">
                    <div className="mb-10 grid gap-6 lg:grid-cols-[0.78fr_1.22fr] lg:items-end">
                        <div className="order-2 lg:order-1">
                            <div className="rounded-[0.65rem] border border-primary-dark/10 bg-white/72 p-2 shadow-[0_34px_100px_-72px_rgba(9,31,26,0.5)]">
                                <div className="grid overflow-hidden rounded-[0.45rem] border border-primary-dark/10 bg-[#fffdf4]/88 text-primary-dark sm:grid-cols-[0.82fr_1.18fr]">
                                    <div className="p-5 sm:p-6">
                                        <p className="font-mono text-[0.64rem] font-semibold uppercase tracking-[0.18em] text-secondary">{courtsContent.flowKicker || 'Booking flow'}</p>
                                        <p className="mt-4 font-display text-3xl font-extrabold leading-[0.95] tracking-normal text-primary-dark sm:text-4xl">{courtsContent.flowTitle || 'Real court photos. Real slots.'}</p>
                                        <p className="mt-4 text-sm font-semibold leading-6 text-primary-dark/58">
                                            {courtsContent.flowDescription || 'Guests see the court, pick a date, select available hours, and continue to payment details.'}
                                        </p>
                                    </div>
                                    <div className="relative min-h-52 overflow-hidden sm:min-h-60">
                                        <img src={flowImage} alt="Pickleball court preview" className="h-full w-full object-cover brightness-[1.06] contrast-[1.08] saturate-[1.06]" />
                                        <div className="absolute inset-0 bg-gradient-to-l from-transparent to-[#fff8e7]/34" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="order-1 lg:order-2 lg:justify-self-end lg:text-right">
                            <span className="section-kicker">{courtsContent.kicker || 'Court selection'}</span>
                            <h2 className="mt-4 max-w-[36rem] text-balance font-display text-[clamp(3rem,5.8vw,6.9rem)] font-extrabold leading-[0.9] tracking-normal text-primary-dark">
                                {courtsContent.title || 'Choose a court. Start fast.'}
                            </h2>
                            <p className="mt-5 max-w-md text-sm font-semibold leading-7 text-primary-dark/62 lg:ml-auto">
                                {courtsContent.description || 'The booking surface stays direct: real venue imagery, active court inventory, and a clear handoff into dates and time slots.'}
                            </p>
                        </div>
                    </div>

                    {visibleCourts.length > 0 ? (
                        <div className="grid gap-4 lg:grid-cols-12">
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
                        <div className="venue-panel mx-auto max-w-2xl rounded-[0.65rem] p-8 text-center">
                            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-primary-dark/10 bg-primary-dark text-secondary">
                                <CalendarDays size={24} aria-hidden="true" />
                            </div>
                            <h3 className="mt-5 text-2xl font-bold tracking-tight text-primary-dark">No courts are published yet</h3>
                            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-primary-dark/62">
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
                        <div className="venue-panel mx-auto mt-8 flex max-w-3xl flex-col gap-5 rounded-[0.65rem] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                            <div>
                                <p className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-secondary">Last selected court</p>
                                <h3 className="mt-2 text-2xl font-bold tracking-tight text-primary-dark">{selectedCourt.name}</h3>
                                <p className="mt-1 text-sm text-primary-dark/62">Open the booking drawer again to choose a fresh date and time.</p>
                            </div>
                            <Button
                                variant="secondary"
                                onClick={() => handleBookClick(selectedCourt)}
                                className="w-full bg-white text-[#071514] hover:bg-secondary sm:w-auto"
                            >
                                Continue booking <ArrowRight size={17} aria-hidden="true" />
                            </Button>
                        </div>
                    )}
                </section>
            </main>

            <Contact />
            {company.parkingEnabled !== false && <Parking />}
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
