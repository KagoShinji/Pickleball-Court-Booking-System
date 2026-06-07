import { format } from 'date-fns';
import { Calendar, Clock, AlertCircle, Loader, User, Mail, Phone, FileText } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '../ui';
import { BookingCalendar } from '../BookingCalendar';
import { calculatePriceForSlots, getDailyBookings } from '../../services/booking';
import { listCourts } from '../../services/courts';

export function CreateBookingModal({ isOpen, onClose, onConfirm }) {
    const [formData, setFormData] = useState({
        customerName: '',
        customerEmail: '',
        customerPhone: '',
        reference: '',
        notes: ''
    });
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedTimes, setSelectedTimes] = useState([]);
    const [courts, setCourts] = useState([]);
    const [selectedCourtId, setSelectedCourtId] = useState('');
    const [courtBookings, setCourtBookings] = useState([]);
    const [loadingBookings, setLoadingBookings] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState(null);

    // Load courts when modal opens
    useEffect(() => {
        if (isOpen) {
            setFormData({
                customerName: '',
                customerEmail: '',
                customerPhone: '',
                reference: '',
                notes: ''
            });
            setSelectedDate(null);
            setSelectedTimes([]);
            setCourtBookings([]);
            setError(null);
            setIsSaving(false);
            loadCourts();
        }
    }, [isOpen]);

    const loadCourts = async () => {
        try {
            const data = await listCourts();
            setCourts(data || []);
            if (data && data.length > 0) {
                setSelectedCourtId(data[0].id);
            }
        } catch (err) {
            console.error('Error loading courts:', err);
        }
    };

    // Load existing bookings for conflict checking when date or court changes
    useEffect(() => {
        if (selectedDate && selectedCourtId) {
            loadBookings();
        }
    }, [selectedDate, selectedCourtId]);

    const loadBookings = async () => {
        try {
            setLoadingBookings(true);
            const dateStr = format(selectedDate, 'yyyy-MM-dd');
            const bookings = await getDailyBookings(dateStr);
            setCourtBookings(bookings || []);
        } catch (err) {
            console.error('Error loading bookings:', err);
            setCourtBookings([]);
        } finally {
            setLoadingBookings(false);
        }
    };

    // Helper to get booked slots for conflict checking
    const getBookedTimes = () => {
        const bookedSlots = new Set();
        if (!courtBookings || courtBookings.length === 0 || !courts.length) {
            return [];
        }

        const targetCourt = courts.find(c => c.id === selectedCourtId);
        const isExclusiveSelected = targetCourt?.type?.includes('Exclusive') || targetCourt?.type?.includes('Whole');

        courtBookings.forEach(courtBooking => {
            let isConflict = false;

            if (courtBooking.court_id === selectedCourtId) {
                isConflict = true;
            } else if (isExclusiveSelected) {
                isConflict = true;
            } else if (courtBooking.courts?.type?.includes('Exclusive') || courtBooking.courts?.type?.includes('Whole')) {
                isConflict = true;
            }

            if (isConflict && courtBooking.start_time && courtBooking.end_time) {
                if (courtBooking.booked_times && Array.isArray(courtBooking.booked_times) && courtBooking.booked_times.length > 0) {
                    courtBooking.booked_times.forEach(time => {
                        if (time && typeof time === 'string') {
                            bookedSlots.add(time.substring(0, 5));
                        }
                    });
                } else {
                    const startTime = courtBooking.start_time.substring(0, 5);
                    const endTime = courtBooking.end_time.substring(0, 5);
                    const [startHour] = startTime.split(':').map(Number);
                    const [endHour] = endTime.split(':').map(Number);

                    for (let hour = startHour; hour < endHour; hour++) {
                        bookedSlots.add(`${hour.toString().padStart(2, '0')}:00`);
                    }
                }
            }
        });

        return Array.from(bookedSlots);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleConfirm = async () => {
        if (!formData.customerName.trim()) {
            setError('Customer Name is required.');
            return;
        }
        if (!formData.customerEmail.trim()) {
            setError('Customer Email is required.');
            return;
        }
        if (!formData.customerPhone.trim()) {
            setError('Customer Phone is required.');
            return;
        }
        if (!selectedDate) {
            setError('Please select a date.');
            return;
        }
        if (selectedTimes.length === 0) {
            setError('Please select at least one time slot.');
            return;
        }

        setIsSaving(true);
        setError(null);

        try {
            // Sort time slots
            const sortedSlots = [...selectedTimes].sort();
            const firstSlot = sortedSlots[0];
            const lastSlot = sortedSlots[sortedSlots.length - 1];

            // Calculate start and end times
            const startTime = `${firstSlot}:00`;
            const [hours] = lastSlot.split(':').map(Number);
            const endTime = `${(hours + 1).toString().padStart(2, '0')}:00:00`;

            const targetCourt = courts.find(c => c.id === selectedCourtId);
            const courtData = {
                price: targetCourt?.price || 0,
                pricing_rules: targetCourt?.pricing_rules || []
            };
            const totalPrice = calculatePriceForSlots(selectedTimes, courtData);

            await onConfirm({
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
                proofOfPaymentUrl: formData.reference ? `manual-admin-${formData.reference}` : 'manual-admin',
                courtType: targetCourt?.type || '',
                ocrData: {
                    bypass_ocr: true,
                    source: 'admin_panel',
                    created_by: 'admin'
                }
            });
            onClose();
        } catch (err) {
            setError(err.message || 'Failed to create booking. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    const bookedTimes = getBookedTimes();
    const selectedCourt = courts.find(c => c.id === selectedCourtId);
    const totalPrice = selectedCourt ? calculatePriceForSlots(selectedTimes, {
        price: selectedCourt.price || 0,
        pricing_rules: selectedCourt.pricing_rules || []
    }) : 0;

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-teal-50/50 shrink-0">
                    <div>
                        <h2 className="text-xl font-bold text-teal-950">Create Admin Booking</h2>
                        <p className="text-sm text-gray-500">Create a direct booking bypassing receipt OCR check</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500"
                    >
                        ✕
                    </button>
                </div>

                <div className="p-6 overflow-y-auto custom-scrollbar flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left Column: Customer Details */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Customer Information</h3>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5">
                                <User size={16} className="text-gray-400" />
                                Customer Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="customerName"
                                value={formData.customerName}
                                onChange={handleInputChange}
                                placeholder="e.g. John Doe"
                                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5">
                                <Mail size={16} className="text-gray-400" />
                                Customer Email <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="email"
                                name="customerEmail"
                                value={formData.customerEmail}
                                onChange={handleInputChange}
                                placeholder="e.g. john@example.com"
                                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5">
                                <Phone size={16} className="text-gray-400" />
                                Customer Phone <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="customerPhone"
                                value={formData.customerPhone}
                                onChange={handleInputChange}
                                placeholder="e.g. 09171234567"
                                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5">
                                <FileText size={16} className="text-gray-400" />
                                Reference / Payment Note
                            </label>
                            <input
                                type="text"
                                name="reference"
                                value={formData.reference}
                                onChange={handleInputChange}
                                placeholder="e.g. Paid via Cash / GCash Reference"
                                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Notes
                            </label>
                            <textarea
                                name="notes"
                                value={formData.notes}
                                onChange={handleInputChange}
                                placeholder="Any additional details or special requests..."
                                rows={3}
                                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green outline-none resize-none"
                            />
                        </div>

                        {error && (
                            <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2.5 rounded-lg">
                                <AlertCircle size={15} className="mt-0.5 shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}
                    </div>

                    {/* Right Column: Court & Date/Time */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Court & Schedule</h3>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Select Court
                            </label>
                            <select
                                value={selectedCourtId}
                                onChange={(e) => {
                                    setSelectedCourtId(e.target.value);
                                    setSelectedTimes([]);
                                }}
                                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green outline-none bg-white"
                            >
                                {courts.map(court => (
                                    <option key={court.id} value={court.id}>
                                        {court.name} - ₱{court.price}/hr {court.type ? `(${court.type})` : ''}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <BookingCalendar
                            selectedDate={selectedDate}
                            onDateSelect={setSelectedDate}
                            selectedTimes={selectedTimes}
                            bookedTimes={bookedTimes}
                            onTimeSelect={(time) => {
                                const newTimes = selectedTimes.includes(time)
                                    ? selectedTimes.filter(t => t !== time)
                                    : [...selectedTimes, time];
                                setSelectedTimes(newTimes);
                            }}
                            fullyBookedDates={[]}
                        />

                        {selectedTimes.length > 0 && (
                            <div className="bg-teal-50 border border-teal-200 rounded-xl p-3 flex justify-between items-center text-sm text-teal-900 font-medium">
                                <span>Total Price ({selectedTimes.length} slot{selectedTimes.length !== 1 ? 's' : ''}):</span>
                                <span className="text-base font-bold">₱{totalPrice}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-100 flex gap-3 bg-gray-50 shrink-0">
                    <Button variant="ghost" onClick={onClose} className="flex-1" disabled={isSaving}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={isSaving}
                        className="flex-1 bg-brand-green hover:bg-brand-green/90 text-white flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isSaving ? (
                            <>
                                <Loader size={14} className="animate-spin" />
                                Saving Booking…
                            </>
                        ) : (
                            'Create Booking'
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}
