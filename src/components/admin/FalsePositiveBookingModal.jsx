/**
 * FalsePositiveBookingModal
 * Opens when an admin tags an intercepted incident as a "False Positive".
 * Lets the admin confirm the booking details (pre-filled from incident data)
 * and create the actual booking — with real conflict checking.
 */
import { useState, useEffect } from 'react';
import { X, AlertCircle, Loader, Calendar, Hash, User, Phone, Mail, FileText, CheckCircle } from 'lucide-react';
import { Button } from '../ui';
import { BookingCalendar } from '../BookingCalendar';
import { createBooking, calculatePriceForSlots, getDailyBookings } from '../../services/booking';
import { listCourts } from '../../services/courts';
import { format } from 'date-fns';
import { supabase } from '../../lib/supabaseClient';

export function FalsePositiveBookingModal({ isOpen, onClose, incident, onSuccess }) {
    const [formData, setFormData] = useState({
        customerName: '',
        customerEmail: '',
        customerPhone: '',
        reference: '',
        notes: 'False positive — booking approved by admin after receipt review.',
    });
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedTimes, setSelectedTimes] = useState([]);
    const [courts, setCourts] = useState([]);
    const [selectedCourtId, setSelectedCourtId] = useState('');
    const [courtBookings, setCourtBookings] = useState([]);
    const [loadingBookings, setLoadingBookings] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!isOpen) return;
        const details = incident?.booking_details || {};
        setFormData({
            customerName: details.customerName || '',
            customerEmail: details.customerEmail || '',
            customerPhone: details.customerPhone || '',
            reference: details.reference || incident?.attempted_reference_no || '',
            notes: details.notes || 'False positive — booking approved by admin after receipt review.',
        });
        if (details.bookingDate) {
            setSelectedDate(new Date(details.bookingDate));
        } else {
            setSelectedDate(null);
        }
        setSelectedTimes(details.bookedTimes || []);
        if (details.courtId) {
            setSelectedCourtId(details.courtId);
        }
        setCourtBookings([]);
        setError(null);
        setIsSaving(false);
        loadCourts(details.courtId);
    }, [isOpen, incident]);

    const loadCourts = async (defaultCourtId) => {
        try {
            const data = await listCourts();
            setCourts(data || []);
            if (defaultCourtId) {
                setSelectedCourtId(defaultCourtId);
            } else if (data && data.length > 0) {
                setSelectedCourtId(data[0].id);
            }
        } catch (err) {
            console.error('Error loading courts:', err);
        }
    };

    useEffect(() => {
        if (selectedDate && selectedCourtId) loadBookings();
    }, [selectedDate, selectedCourtId]);

    const loadBookings = async () => {
        try {
            setLoadingBookings(true);
            const bookings = await getDailyBookings(format(selectedDate, 'yyyy-MM-dd'));
            setCourtBookings(bookings || []);
        } catch {
            setCourtBookings([]);
        } finally {
            setLoadingBookings(false);
        }
    };

    const getBookedTimes = () => {
        const bookedSlots = new Set();
        if (!courtBookings.length || !courts.length) return [];
        const targetCourt = courts.find(c => c.id === selectedCourtId);
        const isExclusive = targetCourt?.type?.includes('Exclusive') || targetCourt?.type?.includes('Whole');
        courtBookings.forEach(b => {
            let isConflict = b.court_id === selectedCourtId
                || isExclusive
                || b.courts?.type?.includes('Exclusive')
                || b.courts?.type?.includes('Whole');
            if (isConflict) {
                if (b.booked_times?.length) b.booked_times.forEach(t => bookedSlots.add(t.substring(0, 5)));
                else {
                    const sh = parseInt(b.start_time, 10), eh = parseInt(b.end_time, 10);
                    for (let h = sh; h < eh; h++) bookedSlots.add(`${String(h).padStart(2, '0')}:00`);
                }
            }
        });
        return Array.from(bookedSlots);
    };

    const handleConfirm = async () => {
        if (!formData.customerName.trim()) return setError('Customer Name is required.');
        if (!formData.customerEmail.trim()) return setError('Customer Email is required.');
        if (!formData.customerPhone.trim()) return setError('Customer Phone is required.');
        if (!selectedDate) return setError('Please select a date.');
        if (!selectedTimes.length) return setError('Please select at least one time slot.');

        setIsSaving(true);
        setError(null);

        try {
            const sortedSlots = [...selectedTimes].sort();
            const firstSlot = sortedSlots[0];
            const lastSlot = sortedSlots[sortedSlots.length - 1];
            const startTime = `${firstSlot}:00`;
            const [endH] = lastSlot.split(':').map(Number);
            const endTime = `${String(endH + 1).padStart(2, '0')}:00:00`;
            const targetCourt = courts.find(c => c.id === selectedCourtId);
            const totalPrice = calculatePriceForSlots(sortedSlots, { price: targetCourt?.price || 0, pricing_rules: targetCourt?.pricing_rules || [] });

            const newBooking = await createBooking({
                courtId: selectedCourtId,
                customerName: formData.customerName,
                customerEmail: formData.customerEmail,
                customerPhone: formData.customerPhone,
                bookingDate: format(selectedDate, 'yyyy-MM-dd'),
                startTime,
                endTime,
                bookedTimes: sortedSlots,
                totalPrice,
                notes: formData.notes,
                proofOfPaymentUrl: incident?.spoof_image_url || `false-positive-approved-ref-${formData.reference || 'admin'}`,
                courtType: targetCourt?.type || '',
                ocrData: {
                    bypass_ocr: true,
                    source: 'false_positive_approval',
                    security_incident_id: incident?.id,
                    approved_by: 'admin',
                },
            });

            if (newBooking?.id && incident?.id) {
                // Update the incident log to link it
                const { error: updateErr } = await supabase
                    .from('security_incident_logs')
                    .update({
                        is_false_positive: true,
                        reviewed_at: new Date().toISOString(),
                        linked_booking_id: newBooking.id
                    })
                    .eq('id', incident.id);
                if (updateErr) {
                    console.error('Error updating security log:', updateErr);
                }
            }

            onSuccess?.();
            onClose();
        } catch (err) {
            setError(err.message || 'Failed to create booking.');
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    const bookedTimes = getBookedTimes();
    const selectedCourt = courts.find(c => c.id === selectedCourtId);
    const totalPrice = selectedCourt ? calculatePriceForSlots(selectedTimes, { price: selectedCourt.price || 0, pricing_rules: selectedCourt.pricing_rules || [] }) : 0;

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
                {/* Header */}
                <div className="px-6 py-4 border-b border-green-100 flex items-center justify-between bg-green-50 shrink-0">
                    <div>
                        <div className="flex items-center gap-2">
                            <CheckCircle size={18} className="text-green-600" />
                            <h2 className="text-xl font-bold text-green-900">Approve False Positive — Create Booking</h2>
                        </div>
                        <p className="text-sm text-green-700 mt-0.5">
                            Fill in the customer details to confirm the legitimate booking.
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-green-100 rounded-full transition-colors text-green-700">
                        <X size={18} />
                    </button>
                </div>

                {/* Incident context banner */}
                {incident?.attempted_reference_no && (
                    <div className="px-6 py-2 bg-amber-50 border-b border-amber-100 flex items-center gap-2 text-sm text-amber-800 shrink-0">
                        <Hash size={14} />
                        <span>Intercepted reference: <span className="font-mono font-bold">{incident.attempted_reference_no}</span></span>
                    </div>
                )}

                <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left: Customer Details */}
                    <div className="space-y-4">
                        <h3 className="text-base font-semibold text-gray-900 border-b pb-2">Customer Information</h3>
                        {[
                            { label: 'Customer Name', key: 'customerName', icon: User, type: 'text', placeholder: 'e.g. Juan dela Cruz', required: true },
                            { label: 'Email', key: 'customerEmail', icon: Mail, type: 'email', placeholder: 'e.g. juan@email.com', required: true },
                            { label: 'Phone', key: 'customerPhone', icon: Phone, type: 'text', placeholder: 'e.g. 09171234567', required: true },
                            { label: 'Reference / Payment Note', key: 'reference', icon: Hash, type: 'text', placeholder: 'GCash ref or receipt note' },
                        ].map(({ label, key, icon: Icon, type, placeholder, required }) => (
                            <div key={key}>
                                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5">
                                    <Icon size={14} className="text-gray-400" />
                                    {label} {required && <span className="text-red-500">*</span>}
                                </label>
                                <input
                                    type={type}
                                    value={formData[key]}
                                    onChange={e => setFormData(p => ({ ...p, [key]: e.target.value }))}
                                    placeholder={placeholder}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none text-sm"
                                />
                            </div>
                        ))}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5">
                                <FileText size={14} className="text-gray-400" /> Notes
                            </label>
                            <textarea
                                value={formData.notes}
                                onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))}
                                rows={2}
                                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none text-sm resize-none"
                            />
                        </div>
                        {error && (
                            <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2.5 rounded-xl">
                                <AlertCircle size={15} className="mt-0.5 shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}
                    </div>

                    {/* Right: Court & Schedule */}
                    <div className="space-y-4">
                        <h3 className="text-base font-semibold text-gray-900 border-b pb-2">Court & Schedule</h3>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Select Court</label>
                            <select
                                value={selectedCourtId}
                                onChange={e => { setSelectedCourtId(e.target.value); setSelectedTimes([]); }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none bg-white text-sm"
                            >
                                {courts.map(c => (
                                    <option key={c.id} value={c.id}>{c.name} — ₱{c.price}/hr {c.type ? `(${c.type})` : ''}</option>
                                ))}
                            </select>
                        </div>
                        <BookingCalendar
                            selectedDate={selectedDate}
                            onDateSelect={setSelectedDate}
                            selectedTimes={selectedTimes}
                            bookedTimes={bookedTimes}
                            onTimeSelect={time => {
                                setSelectedTimes(prev =>
                                    prev.includes(time) ? prev.filter(t => t !== time) : [...prev, time]
                                );
                            }}
                            fullyBookedDates={[]}
                        />
                        {selectedTimes.length > 0 && (
                            <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex justify-between items-center text-sm text-green-900 font-medium">
                                <span>Total ({selectedTimes.length} slot{selectedTimes.length !== 1 ? 's' : ''}):</span>
                                <span className="text-base font-bold">₱{totalPrice}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-100 flex gap-3 bg-gray-50 shrink-0">
                    <Button variant="ghost" onClick={onClose} className="flex-1" disabled={isSaving}>Cancel</Button>
                    <button
                        onClick={handleConfirm}
                        disabled={isSaving}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold py-2 flex items-center justify-center gap-2 transition-colors disabled:opacity-60 disabled:cursor-not-allowed text-sm"
                    >
                        {isSaving ? <><Loader size={14} className="animate-spin" /> Creating Booking…</> : '✓ Confirm & Create Booking'}
                    </button>
                </div>
            </div>
        </div>
    );
}
