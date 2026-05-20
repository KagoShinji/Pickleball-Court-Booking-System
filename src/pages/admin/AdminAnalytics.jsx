import { BarChart3, TrendingUp, Download, DollarSign, BookOpen, Calendar } from 'lucide-react';
import { useEffect, useState } from 'react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { Card, Button } from '../../components/ui';
import { getAllBookings, subscribeToBookings } from '../../services/booking';
import { listCourts } from '../../services/courts';

export function AdminAnalytics() {
    const [revenueData, setRevenueData] = useState([]);
    const [utilizationData, setUtilizationData] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [summaryStats, setSummaryStats] = useState({
        weeklyRevenue: 0,
        totalBookings: 0,
        averageBookingPrice: 0,
        monthlyRevenue: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadAnalyticsData();

        // Subscribe to real-time booking updates
        const subscription = subscribeToBookings((payload) => {
            console.log('Analytics: Booking update received', payload);
            loadAnalyticsData();
        });

        return () => {
            if (subscription) {
                subscription.unsubscribe();
            }
        };
    }, []);

    const loadAnalyticsData = async () => {
        try {
            setLoading(true);

            const bookingsData = await getAllBookings();
            const courts = await listCourts();

            setBookings(bookingsData || []);

            // Only process confirmed bookings
            const confirmedBookings = (bookingsData || []).filter(b => b.status === 'Confirmed');

            // Calculate weekly revenue (last 7 days)
            const today = new Date();
            const weekStart = startOfWeek(today);
            const weekEnd = endOfWeek(today);
            const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

            const weeklyRevenue = days.map(day => {
                const dateStr = format(day, 'yyyy-MM-dd');
                const dayBookings = confirmedBookings.filter(b => b.booking_date === dateStr) || [];
                const revenue = dayBookings.reduce((sum, b) => sum + (b.total_price || 0), 0);
                const maxValue = 6000; // Max value for scaling bars
                const height = (revenue / maxValue) * 100;

                return {
                    day: format(day, 'EEE'),
                    value: revenue,
                    height: Math.min(height, 100) + '%'
                };
            });

            setRevenueData(weeklyRevenue);

            // Calculate monthly revenue
            const monthStart = startOfMonth(today);
            const monthEnd = endOfMonth(today);
            const monthlyRevenue = confirmedBookings
                .filter(b => {
                    const bookingDate = new Date(b.booking_date);
                    return bookingDate >= monthStart && bookingDate <= monthEnd;
                })
                .reduce((sum, b) => sum + (b.total_price || 0), 0);

            // Calculate court utilization (bookings per court / max slots per week)
            const maxSlotsPerWeek = 56; // 8 time slots × 7 days
            const courtUtilization = courts?.map(court => {
                const courtBookings = confirmedBookings.filter(b => b.court_id === court.id) || [];
                // Count only confirmed bookings in the current week
                const weekBookings = courtBookings.filter(b => {
                    const bookingDate = new Date(b.booking_date);
                    return bookingDate >= weekStart && bookingDate <= weekEnd;
                }).length;
                const utilizationPercent = Math.round((weekBookings / maxSlotsPerWeek) * 100);

                return {
                    name: court.name,
                    value: Math.min(utilizationPercent, 100)
                };
            }) || [];

            setUtilizationData(courtUtilization);

            // Calculate summary stats
            const weeklyRevenueTotal = weeklyRevenue.reduce((sum, day) => sum + day.value, 0);
            const totalBookingsCount = confirmedBookings.length;
            const averagePrice = totalBookingsCount > 0 ? Math.round(confirmedBookings.reduce((sum, b) => sum + (b.total_price || 0), 0) / totalBookingsCount) : 0;

            setSummaryStats({
                weeklyRevenue: weeklyRevenueTotal,
                totalBookings: totalBookingsCount,
                averageBookingPrice: averagePrice,
                monthlyRevenue: monthlyRevenue
            });
        } catch (err) {
            console.error('Error loading analytics:', err);
        } finally {
            setLoading(false);
        }
    };

    const downloadCSV = (data, filename) => {
        if (!data || data.length === 0) {
            alert('No data to export.');
            return;
        }

        const headers = Object.keys(data[0]).join(',');
        const rows = data.map(obj => Object.values(obj).map(val => `"${val}"`).join(','));
        const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join('\n');

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const generateReport = (type) => {
        const today = new Date();
        let reportData = [];
        let filename = '';

        if (type === 'weekly_revenue') {
            const weekStart = startOfWeek(today);
            const weekEnd = endOfWeek(today);

            reportData = bookings.filter(b =>
                isWithinInterval(new Date(b.booking_date), { start: weekStart, end: weekEnd })
            ).map(b => ({
                Date: b.booking_date,
                Customer: b.customer_name,
                Court: b.courts?.name,
                Price: b.total_price,
                Status: b.status
            }));
            filename = `Weekly_Revenue_${format(today, 'yyyy-MM-dd')}.csv`;
        } else if (type === 'monthly_sales') {
            const monthStart = startOfMonth(today);
            const monthEnd = endOfMonth(today);

            reportData = bookings.filter(b =>
                isWithinInterval(new Date(b.booking_date), { start: monthStart, end: monthEnd })
            ).map(b => ({
                Date: b.booking_date,
                Customer: b.customer_name,
                Court: b.courts?.name,
                Price: b.total_price,
                Status: b.status
            }));
            filename = `Monthly_Sales_${format(today, 'yyyy-MM')}.csv`;
        } else if (type === 'all_bookings') {
            reportData = bookings.map(b => ({
                ID: b.id,
                Date: b.booking_date,
                Customer: b.customer_name,
                Email: b.customer_email,
                Phone: b.customer_phone,
                Court: b.courts?.name,
                StartTime: b.start_time,
                EndTime: b.end_time,
                Price: b.total_price,
                Status: b.status,
                Notes: b.notes
            }));
            filename = `All_Bookings_${format(today, 'yyyy-MM-dd')}.csv`;
        }

        downloadCSV(reportData, filename);
    };

    return (
        <div className="space-y-8 w-full max-w-full">
            <div>
                <h1 className="text-2xl font-bold font-display text-primary-dark">Analytics & Reports</h1>
                <p className="text-gray-500">Performance metrics and utilization reports</p>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="p-5">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Weekly Revenue</p>
                            <p className="text-3xl font-bold text-gray-900 mt-2">₱{summaryStats.weeklyRevenue.toLocaleString()}</p>
                            <p className="text-xs text-gray-400 mt-1">Last 7 days</p>
                        </div>
                        <div className="p-3 bg-green-100 rounded-lg">
                            <DollarSign size={20} className="text-green-600" />
                        </div>
                    </div>
                </Card>

                <Card className="p-5">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
                            <p className="text-3xl font-bold text-gray-900 mt-2">₱{summaryStats.monthlyRevenue.toLocaleString()}</p>
                            <p className="text-xs text-gray-400 mt-1">This month</p>
                        </div>
                        <div className="p-3 bg-blue-100 rounded-lg">
                            <Calendar size={20} className="text-blue-600" />
                        </div>
                    </div>
                </Card>

                <Card className="p-5">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                            <p className="text-3xl font-bold text-gray-900 mt-2">{summaryStats.totalBookings}</p>
                            <p className="text-xs text-gray-400 mt-1">All confirmed</p>
                        </div>
                        <div className="p-3 bg-orange-100 rounded-lg">
                            <BookOpen size={20} className="text-orange-600" />
                        </div>
                    </div>
                </Card>

                <Card className="p-5">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Avg Booking Price</p>
                            <p className="text-3xl font-bold text-gray-900 mt-2">₱{summaryStats.averageBookingPrice.toLocaleString()}</p>
                            <p className="text-xs text-gray-400 mt-1">Per booking</p>
                        </div>
                        <div className="p-3 bg-purple-100 rounded-lg">
                            <TrendingUp size={20} className="text-purple-600" />
                        </div>
                    </div>
                </Card>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
                {/* Revenue Chart */}
                <Card className="p-6">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-lg font-bold text-gray-800">Weekly Revenue</h3>
                            <p className="text-sm text-gray-500">Last 7 Days</p>
                        </div>
                        <div className="flex items-center text-green-600 bg-green-50 px-3 py-1 rounded-full text-sm font-medium">
                            <TrendingUp size={16} className="mr-1" /> {loading ? '...' : 'Live'}
                        </div>
                    </div>

                    {loading ? (
    <div className="h-64 flex items-center justify-center">
        <p className="text-gray-400">Loading analytics...</p>
    </div>
) : revenueData.some(item => item.value > 0) ? (
    <div className="h-80 flex items-end justify-between gap-3 bg-gray-50 p-4 rounded-lg">
        {revenueData.map((item) => (
            <div key={item.day} className="flex flex-col items-center gap-3 flex-1 group">
                {/* Remove h-full and fix the structure */}
                <div className="relative w-full flex flex-col justify-end" style={{ height: '280px' }}>
                    <div
                        className="w-full bg-gradient-to-t from-primary to-primary-light rounded-t-md transition-all duration-500 hover:from-primary-dark hover:to-primary shadow-sm hover:shadow-md"
                        style={{ height: item.height, minHeight: item.value > 0 ? '8px' : '0px' }}
                    ></div>
                    {/* Tooltip */}
                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-xs font-semibold py-2 px-3 rounded whitespace-nowrap pointer-events-none">
                        ₱{item.value.toLocaleString()}
                    </div>
                </div>
                <span className="text-xs font-semibold text-gray-700">{item.day}</span>
            </div>
        ))}
    </div>
                    ) : (
                        <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                            <div className="text-center">
                                <p className="text-gray-400 font-medium">No revenue data yet</p>
                                <p className="text-sm text-gray-400 mt-1">Bookings will appear here</p>
                            </div>
                        </div>
                    )}
                </Card>

                {/* Court Utilization */}
                <Card className="p-6">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-lg font-bold text-gray-800">Court Utilization</h3>
                            <p className="text-sm text-gray-500">Weekly occupancy rates</p>
                        </div>
                        <div className="p-2 bg-secondary-light text-secondary rounded-lg">
                            <BarChart3 size={20} />
                        </div>
                    </div>

                    <div className="space-y-6">
                        {loading ? (
                            <p className="text-gray-400 text-center py-4">Loading data...</p>
                        ) : utilizationData.length > 0 ? (
                            utilizationData.map((item) => (
                                <div key={item.name}>
                                    <div className="flex justify-between text-sm mb-2">
                                        <span className="font-medium text-gray-700">{item.name}</span>
                                        <span className="font-bold text-gray-900">{item.value}%</span>
                                    </div>
                                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-secondary rounded-full transition-all duration-1000"
                                            style={{ width: `${item.value}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-400 text-center py-4">No courts available</p>
                        )}
                    </div>

                    <div className="mt-8 pt-6 border-t border-gray-100">
                        <p className="text-sm text-gray-500">
                            <strong>Last Updated:</strong> {new Date().toLocaleString()}
                        </p>
                    </div>
                </Card>
            </div>

            {/* Generated Reports */}
            <Card className="p-0 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800">Generated Reports</h3>
                    <p className="text-sm text-gray-500">Export booking data and insights</p>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Report Name</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Description</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Format</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            <tr className="hover:bg-gray-50">
                                <td className="px-6 py-4 font-medium text-gray-900">Weekly Revenue</td>
                                <td className="px-6 py-4 text-gray-500">Revenue breakdown for the current week</td>
                                <td className="px-6 py-4 text-gray-500">CSV</td>
                                <td className="px-6 py-4">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-primary-dark hover:text-primary hover:bg-primary-light"
                                        onClick={() => generateReport('weekly_revenue')}
                                        disabled={loading}
                                    >
                                        <Download size={16} className="mr-2" /> Download
                                    </Button>
                                </td>
                            </tr>
                            <tr className="hover:bg-gray-50">
                                <td className="px-6 py-4 font-medium text-gray-900">Monthly Sales</td>
                                <td className="px-6 py-4 text-gray-500">Sales report for the current month</td>
                                <td className="px-6 py-4 text-gray-500">CSV</td>
                                <td className="px-6 py-4">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-primary-dark hover:text-primary hover:bg-primary-light"
                                        onClick={() => generateReport('monthly_sales')}
                                        disabled={loading}
                                    >
                                        <Download size={16} className="mr-2" /> Download
                                    </Button>
                                </td>
                            </tr>
                            <tr className="hover:bg-gray-50">
                                <td className="px-6 py-4 font-medium text-gray-900">All Bookings</td>
                                <td className="px-6 py-4 text-gray-500">Complete history of all bookings</td>
                                <td className="px-6 py-4 text-gray-500">CSV</td>
                                <td className="px-6 py-4">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-primary-dark hover:text-primary hover:bg-primary-light"
                                        onClick={() => generateReport('all_bookings')}
                                        disabled={loading}
                                    >
                                        <Download size={16} className="mr-2" /> Download
                                    </Button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}
