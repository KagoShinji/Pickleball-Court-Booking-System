import { Building2, Facebook, Instagram, Mail, MapPin, Phone, Save, Clock, Image as ImageIcon, Armchair, Car, DoorOpen, Volleyball, Gamepad2, ShowerHead, Wifi, Coffee, Music, TreePine, Check, ArrowRight, Users, Calendar } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button, Card, Input } from '../../components/ui';
import { getTenantSettings, updateTenantSettings } from '../../services/settings';
import { useCompany } from '../../lib/CompanyProvider';

const AVAILABLE_AMENITIES = [
    { key: 'shower', title: 'Toilet & Changing Room', icon: ShowerHead },
    { key: 'toilet', title: 'Restroom', icon: ShowerHead },
    { key: 'lounge', title: 'Lounge Area', icon: Armchair },
    { key: 'parking', title: 'Parking', icon: Car },
    { key: 'pingpong', title: 'Ping Pong', icon: Volleyball },
    { key: 'billiards', title: 'Billiards', icon: Gamepad2 },
    { key: 'door', title: 'Indoor Court', icon: DoorOpen },
    { key: 'wifi', title: 'Free Wi-Fi', icon: Wifi },
    { key: 'coffee', title: 'Coffee Shop', icon: Coffee },
    { key: 'music', title: 'Music System', icon: Music },
    { key: 'outdoor', title: 'Outdoor Court', icon: TreePine },
];

export function AdminSettings() {
    const { company: currentCompany, refresh: refreshCompany } = useCompany();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    
    const [settings, setSettings] = useState({
        company_name: '',
        company_short_name: '',
        contact_info: {
            email: '',
            phone: '',
            address: '',
            mapQuery: '',
            facebook: '',
            instagram: ''
        },
        operating_hours: {
            open: '08:00',
            close: '22:00'
        },
        parking_enabled: true,
        amenities: [],
        hero_badge: '',
        hero_title: '',
        hero_subtitle: '',
        hero_stat_players: '50+ Active Players',
        hero_stat_days: 'Open 7 Days a Week'
    });

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            setLoading(true);
            const data = await getTenantSettings();
            if (data) {
                setSettings({
                    company_name: data.company_name || '',
                    company_short_name: data.company_short_name || '',
                    contact_info: data.contact_info || {
                        email: '',
                        phone: '',
                        address: '',
                        mapQuery: '',
                        facebook: '',
                        instagram: ''
                    },
                    operating_hours: data.operating_hours || {
                        open: '08:00',
                        close: '22:00'
                    },
                    parking_enabled: data.parking_enabled ?? true,
                    amenities: data.amenities || [],
                    hero_badge: data.hero_badge || '',
                    hero_title: data.hero_title || '',
                    hero_subtitle: data.hero_subtitle || '',
                    hero_stat_players: data.hero_stat_players || '50+ Active Players',
                    hero_stat_days: data.hero_stat_days || 'Open 7 Days a Week'
                });
            }
        } catch (err) {
            setError('Failed to load settings');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);
            setError('');
            setSuccess('');
            
            // Security Check: Sanitize map query/link
            const sanitizedSettings = { ...settings };
            if (sanitizedSettings.contact_info.mapQuery.includes('<script')) {
                throw new Error('Invalid Map Link format detected.');
            }

            await updateTenantSettings(sanitizedSettings);
            
            setSuccess('Settings updated successfully!');
            await refreshCompany(); // Refresh global context
            
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.message || 'Failed to update settings');
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    const updateContact = (field, value) => {
        setSettings(prev => ({
            ...prev,
            contact_info: {
                ...prev.contact_info,
                [field]: value
            }
        }));
    };

    const updateHours = (field, value) => {
        setSettings(prev => ({
            ...prev,
            operating_hours: {
                ...prev.operating_hours,
                [field]: value
            }
        }));
    };

    const toggleAmenity = (key) => {
        setSettings(prev => {
            const current = prev.amenities || [];
            if (current.includes(key)) {
                return { ...prev, amenities: current.filter(k => k !== key) };
            } else {
                return { ...prev, amenities: [...current, key] };
            }
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl space-y-8">
            <div>
                <h1 className="text-2xl font-bold font-display text-primary-dark">Company Settings</h1>
                <p className="text-gray-500">Manage your venue's branding, contact information, and operational details.</p>
            </div>

            <form onSubmit={handleSave} className="space-y-6 pb-20">
                {/* Branding Section */}
                <Card className="p-6 space-y-6 border-none shadow-md">
                    <div className="flex items-center gap-2 text-lg font-bold text-gray-800 border-b border-gray-100 pb-4">
                        <Building2 size={20} className="text-primary" />
                        <h2>General Branding</h2>
                    </div>
                    
                    <div className="grid sm:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Company Full Name</label>
                            <Input 
                                value={settings.company_name}
                                onChange={(e) => setSettings(prev => ({ ...prev, company_name: e.target.value }))}
                                placeholder="e.g. Pickle Point Cebu"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Short Name / Display Name</label>
                            <Input 
                                value={settings.company_short_name}
                                onChange={(e) => setSettings(prev => ({ ...prev, company_short_name: e.target.value }))}
                                placeholder="e.g. Pickle Point"
                            />
                        </div>
                    </div>
                </Card>

                {/* Hero Section Customization */}
                <Card className="p-6 space-y-6 border-none shadow-md">
                    <div className="flex items-center gap-2 text-lg font-bold text-gray-800 border-b border-gray-100 pb-4">
                        <ImageIcon size={20} className="text-primary" />
                        <h2>Hero Section Content</h2>
                    </div>

                    <div className="grid gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Badge Text (Top Label)</label>
                            <Input 
                                value={settings.hero_badge}
                                onChange={(e) => setSettings(prev => ({ ...prev, hero_badge: e.target.value }))}
                                placeholder={`e.g. New courts available in ${settings.contact_info.address || 'Moalboal'}`}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Hero Main Title</label>
                            <Input 
                                value={settings.hero_title}
                                onChange={(e) => setSettings(prev => ({ ...prev, hero_title: e.target.value }))}
                                placeholder={`e.g. Book your next ${settings.company_short_name || 'Game'}`}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Hero Subtitle / Description</label>
                            <textarea 
                                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all min-h-[80px] text-sm"
                                value={settings.hero_subtitle}
                                onChange={(e) => setSettings(prev => ({ ...prev, hero_subtitle: e.target.value }))}
                                placeholder="Enter a compelling description for your venue..."
                            />
                        </div>
                        <div className="grid sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Players Count Stat</label>
                                <Input 
                                    value={settings.hero_stat_players}
                                    onChange={(e) => setSettings(prev => ({ ...prev, hero_stat_players: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Operating Days Stat</label>
                                <Input 
                                    value={settings.hero_stat_days}
                                    onChange={(e) => setSettings(prev => ({ ...prev, hero_stat_days: e.target.value }))}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Live Preview Section */}
                    <div className="mt-8 border-t border-gray-100 pt-6">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Live Preview (Mobile View)</p>
                        <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-inner p-4 max-w-sm mx-auto">
                            <div className="space-y-4">
                                <div className="inline-flex items-center gap-2 px-2 py-0.5 rounded-full bg-primary-light border border-primary/20">
                                    <span className="flex h-1.5 w-1.5 rounded-full bg-primary"></span>
                                    <span className="text-[10px] font-medium text-gray-600">{settings.hero_badge || `New courts available in ${settings.contact_info.address || 'location'}`}</span>
                                </div>
                                <h3 className="text-2xl font-display font-bold leading-tight text-primary-dark">
                                    {settings.hero_title || 'Book your next Game'}
                                </h3>
                                <p className="text-xs text-gray-500 leading-relaxed line-clamp-3">
                                    {settings.hero_subtitle || 'Experience the best pickleball courts in your area...'}
                                </p>
                                <div className="flex gap-2">
                                    <div className="bg-primary text-white text-[10px] px-4 py-2 rounded-full font-bold flex items-center gap-1">
                                        Book a Court <ArrowRight size={10} />
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 text-[10px] text-gray-400">
                                    <div className="flex items-center gap-1">
                                        <Users size={12} className="text-secondary" />
                                        <span>{settings.hero_stat_players}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Calendar size={12} className="text-secondary" />
                                        <span>{settings.hero_stat_days}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Contact Information */}
                <Card className="p-6 space-y-6 border-none shadow-md">
                    <div className="flex items-center gap-2 text-lg font-bold text-gray-800 border-b border-gray-100 pb-4">
                        <Mail size={20} className="text-primary" />
                        <h2>Contact & Location</h2>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Email Address</label>
                            <div className="relative">
                                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <Input 
                                    className="pl-10"
                                    type="email"
                                    value={settings.contact_info.email}
                                    onChange={(e) => updateContact('email', e.target.value)}
                                    placeholder="hello@example.com"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Phone Number</label>
                            <div className="relative">
                                <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <Input 
                                    className="pl-10"
                                    value={settings.contact_info.phone}
                                    onChange={(e) => updateContact('phone', e.target.value)}
                                    placeholder="+63 9xx xxx xxxx"
                                />
                            </div>
                        </div>
                        <div className="sm:col-span-2 space-y-2">
                            <label className="text-sm font-medium text-gray-700">Physical Address</label>
                            <div className="relative">
                                <MapPin size={16} className="absolute left-3 top-3 text-gray-400" />
                                <textarea 
                                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all min-h-[80px]"
                                    value={settings.contact_info.address}
                                    onChange={(e) => updateContact('address', e.target.value)}
                                    placeholder="Complete street address, city, province"
                                />
                            </div>
                        </div>
                        <div className="sm:col-span-2 space-y-2">
                            <label className="text-sm font-medium text-gray-700 italic">Google Maps Embed Link / Search Query</label>
                            <p className="text-xs text-gray-500">Paste your Google Maps Share Link or specific Search Query for high accuracy.</p>
                            <Input 
                                value={settings.contact_info.mapQuery}
                                onChange={(e) => updateContact('mapQuery', e.target.value)}
                                placeholder="e.g. https://maps.app.goo.gl/... or Specific Venue Name"
                            />
                        </div>
                    </div>
                </Card>

                {/* Operations */}
                <Card className="p-6 space-y-6 border-none shadow-md">
                    <div className="flex items-center gap-2 text-lg font-bold text-gray-800 border-b border-gray-100 pb-4">
                        <Clock size={20} className="text-primary" />
                        <h2>Operational Hours</h2>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Opening Time</label>
                            <Input 
                                type="time"
                                value={settings.operating_hours.open}
                                onChange={(e) => updateHours('open', e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Closing Time</label>
                            <Input 
                                type="time"
                                value={settings.operating_hours.close}
                                onChange={(e) => updateHours('close', e.target.value)}
                            />
                        </div>
                    </div>
                </Card>

                {/* Facilities & Amenities */}
                <Card className="p-6 space-y-6 border-none shadow-md">
                    <div className="flex items-center gap-2 text-lg font-bold text-gray-800 border-b border-gray-100 pb-4">
                        <DoorOpen size={20} className="text-primary" />
                        <h2>Facilities & Amenities</h2>
                    </div>

                    <div className="space-y-6">
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                            <div>
                                <p className="font-bold text-gray-800">Show Map / Parking Availability</p>
                                <p className="text-sm text-gray-500">If disabled, the map section on the homepage will be hidden.</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    className="sr-only peer"
                                    checked={settings.parking_enabled}
                                    onChange={(e) => setSettings(prev => ({ ...prev, parking_enabled: e.target.checked }))}
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                            </label>
                        </div>

                        <div>
                            <p className="text-sm font-medium text-gray-700 mb-4">Available Amenities</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                {AVAILABLE_AMENITIES.map((amenity) => {
                                    const Icon = amenity.icon;
                                    const isSelected = settings.amenities?.includes(amenity.key);
                                    return (
                                        <button
                                            key={amenity.key}
                                            type="button"
                                            onClick={() => toggleAmenity(amenity.key)}
                                            className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                                                isSelected 
                                                    ? 'border-primary bg-primary-light text-primary-dark shadow-sm' 
                                                    : 'border-gray-100 bg-white text-gray-500 hover:border-gray-200'
                                            }`}
                                        >
                                            <div className={`p-2 rounded-lg ${isSelected ? 'bg-white' : 'bg-gray-50'}`}>
                                                <Icon size={18} />
                                            </div>
                                            <span className="font-medium text-sm flex-1">{amenity.title}</span>
                                            {isSelected && <Check size={16} className="text-primary" />}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Social Media */}
                <Card className="p-6 space-y-6 border-none shadow-md">
                    <div className="flex items-center gap-2 text-lg font-bold text-gray-800 border-b border-gray-100 pb-4">
                        <ImageIcon size={20} className="text-primary" />
                        <h2>Social Media Presence</h2>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Facebook URL</label>
                            <div className="relative">
                                <Facebook size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <Input 
                                    className="pl-10"
                                    value={settings.contact_info.facebook}
                                    onChange={(e) => updateContact('facebook', e.target.value)}
                                    placeholder="https://facebook.com/yourpage"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Instagram URL</label>
                            <div className="relative">
                                <Instagram size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <Input 
                                    className="pl-10"
                                    value={settings.contact_info.instagram}
                                    onChange={(e) => updateContact('instagram', e.target.value)}
                                    placeholder="https://instagram.com/yourhandle"
                                />
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Action Bar */}
                <div className="flex items-center justify-between sticky bottom-0 bg-bg-light/80 backdrop-blur-md py-4 border-t border-gray-100 mt-8 z-20">
                    <div className="text-sm">
                        {error && <p className="text-red-500 font-medium">{error}</p>}
                        {success && <p className="text-green-600 font-medium animate-pulse">{success}</p>}
                    </div>
                    <Button 
                        type="submit" 
                        disabled={saving}
                        className="min-w-[140px] shadow-lg shadow-primary/20"
                    >
                        {saving ? (
                            <span className="flex items-center gap-2">
                                <span className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full"></span>
                                Saving...
                            </span>
                        ) : (
                            <span className="flex items-center gap-2">
                                <Save size={18} />
                                Save Settings
                            </span>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
}
