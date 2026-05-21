import {
    Armchair,
    ArrowRight,
    Building2,
    Calendar,
    Car,
    Check,
    Clock,
    Coffee,
    DoorOpen,
    FileText,
    Gamepad2,
    Image as ImageIcon,
    Mail,
    Music,
    Palette,
    Plus,
    Save,
    ShowerHead,
    Trash2,
    TreePine,
    UploadCloud,
    Users,
    Volleyball,
    Wifi,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button, Card, Input } from '../../components/ui';
import {
    DEFAULT_SECTION_CONTENT,
    DEFAULT_SITE_IMAGES,
    DEFAULT_THEME_CONFIG,
    mergeSectionContent,
    mergeSiteImages,
    mergeThemeConfig,
    normalizeImageList,
} from '../../lib/cmsDefaults';
import { formatImageSize } from '../../lib/imageCompression';
import { useCompany } from '../../lib/CompanyProvider';
import { uploadCmsImage } from '../../services/cmsImages';
import { uploadQrImage } from '../../services/qrCodes';
import { getTenantSettings, updateTenantSettings } from '../../services/settings';

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

const THEME_FIELDS = [
    { key: 'primary', label: 'Primary' },
    { key: 'primaryLight', label: 'Primary Light' },
    { key: 'primaryDark', label: 'Primary Dark' },
    { key: 'secondary', label: 'Accent' },
    { key: 'secondaryLight', label: 'Accent Light' },
    { key: 'backgroundLight', label: 'Page Background' },
    { key: 'backgroundSurface', label: 'Surface Background' },
];

const SECTION_BACKGROUNDS = [
    { key: 'offers', label: 'Offers Background' },
    { key: 'courts', label: 'Courts Background' },
    { key: 'contact', label: 'Visit Background' },
    { key: 'parking', label: 'Parking Background' },
    { key: 'footer', label: 'Footer Background' },
];

const GALLERY_GROUPS = [
    { key: 'hero', title: 'Hero Detail Photos', description: 'Small overlapping images shown in the hero stats card.' },
    { key: 'venue', title: 'Venue Gallery', description: 'Images used in the offers and venue extras section.' },
    { key: 'courts', title: 'Court Gallery', description: 'Fallback photos rotated across court cards.' },
];

const SECTION_COPY_GROUPS = [
    {
        key: 'courts',
        title: 'Courts Section',
        fields: [
            { key: 'kicker', label: 'Kicker' },
            { key: 'title', label: 'Title' },
            { key: 'description', label: 'Description', multiline: true },
            { key: 'flowKicker', label: 'Flow Kicker' },
            { key: 'flowTitle', label: 'Flow Title' },
            { key: 'flowDescription', label: 'Flow Description', multiline: true },
        ],
    },
    {
        key: 'offers',
        title: 'Offers Section',
        fields: [
            { key: 'kicker', label: 'Kicker' },
            { key: 'title', label: 'Title' },
            { key: 'description', label: 'Description', multiline: true },
            { key: 'panelKicker', label: 'Panel Kicker' },
            { key: 'panelDescription', label: 'Panel Description', multiline: true },
        ],
    },
    {
        key: 'contact',
        title: 'Visit Section',
        fields: [
            { key: 'kicker', label: 'Kicker' },
            { key: 'title', label: 'Title' },
            { key: 'description', label: 'Description', multiline: true },
            { key: 'contactTitle', label: 'Contact Card Title' },
            { key: 'eventKicker', label: 'Event Kicker' },
            { key: 'eventTitle', label: 'Event Title' },
            { key: 'eventDescription', label: 'Event Description', multiline: true },
        ],
    },
    {
        key: 'parking',
        title: 'Parking Section',
        fields: [
            { key: 'title', label: 'Title' },
            { key: 'description', label: 'Description', multiline: true },
        ],
    },
    {
        key: 'footer',
        title: 'Footer CTA',
        fields: [
            { key: 'kicker', label: 'Kicker' },
            { key: 'title', label: 'Title' },
            { key: 'description', label: 'Description', multiline: true },
        ],
    },
];

const CMS_TABS = [
    { key: 'brand', title: 'Brand & Hero', description: 'Logo, palette, headline, and hero visuals.', icon: Building2 },
    { key: 'images', title: 'Images', description: 'Section backgrounds and gallery pools.', icon: ImageIcon },
    { key: 'copy', title: 'Copy', description: 'Titles and descriptions for public sections.', icon: FileText },
    { key: 'venue', title: 'Venue Details', description: 'Contact, hours, parking, and amenities.', icon: DoorOpen },
];

const DEFAULT_SETTINGS = {
    company_name: '',
    company_short_name: '',
    logo_url: DEFAULT_SITE_IMAGES.logoUrl,
    hero_bg_url: '',
    payment_qr_url: '',
    contact_info: {
        email: '',
        phone: '',
        address: '',
        mapQuery: '',
        facebook: '',
        instagram: '',
    },
    operating_hours: {
        open: '08:00',
        close: '22:00',
        openDays: [0, 1, 2, 3, 4, 5, 6],
    },
    parking_enabled: true,
    parking_is_inside: false,
    parking_map_link: '',
    amenities: [],
    hero_badge: '',
    hero_title: '',
    hero_subtitle: '',
    hero_stat_players: '50+ Active Players',
    hero_stat_days: 'Open 7 Days a Week',
    theme_config: DEFAULT_THEME_CONFIG,
    site_images: DEFAULT_SITE_IMAGES,
    section_content: DEFAULT_SECTION_CONTENT,
};

function containsUnsafeScript(value) {
    if (typeof value === 'string') return /<\s*script/i.test(value);
    if (Array.isArray(value)) return value.some(containsUnsafeScript);
    if (value && typeof value === 'object') return Object.values(value).some(containsUnsafeScript);
    return false;
}

function colorInputValue(value) {
    return /^#[0-9a-f]{6}$/i.test(value || '') ? value : '#000000';
}

function mergeLoadedSettings(data) {
    const siteImages = mergeSiteImages(data.site_images);
    const logoUrl = data.logo_url || siteImages.logoUrl || DEFAULT_SITE_IMAGES.logoUrl;
    const heroBgUrl = data.hero_bg_url || siteImages.heroBackground || DEFAULT_SITE_IMAGES.heroBackground;

    return {
        ...DEFAULT_SETTINGS,
        company_name: data.company_name || '',
        company_short_name: data.company_short_name || '',
        logo_url: logoUrl,
        hero_bg_url: heroBgUrl,
        payment_qr_url: data.payment_qr_url || '',
        contact_info: {
            ...DEFAULT_SETTINGS.contact_info,
            ...(data.contact_info || {}),
        },
        operating_hours: {
            open: data.operating_hours?.open || DEFAULT_SETTINGS.operating_hours.open,
            close: data.operating_hours?.close || DEFAULT_SETTINGS.operating_hours.close,
            openDays: data.operating_hours?.openDays || DEFAULT_SETTINGS.operating_hours.openDays,
        },
        parking_enabled: data.parking_enabled ?? true,
        parking_is_inside: data.parking_is_inside ?? false,
        parking_map_link: data.parking_map_link || '',
        amenities: data.amenities || [],
        hero_badge: data.hero_badge || '',
        hero_title: data.hero_title || '',
        hero_subtitle: data.hero_subtitle || '',
        hero_stat_players: data.hero_stat_players || DEFAULT_SETTINGS.hero_stat_players,
        hero_stat_days: data.hero_stat_days || DEFAULT_SETTINGS.hero_stat_days,
        theme_config: mergeThemeConfig(data.theme_config),
        site_images: {
            ...siteImages,
            logoUrl,
            heroBackground: heroBgUrl,
        },
        section_content: mergeSectionContent(data.section_content),
    };
}

function SectionHeader({ icon, title, description }) {
    const HeaderIcon = icon;

    return (
        <div className="flex flex-col gap-3 border-b border-primary-dark/10 pb-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-light text-primary">
                    <HeaderIcon size={20} aria-hidden="true" />
                </span>
                <div>
                    <h2 className="font-display text-xl font-extrabold leading-tight text-primary-dark">{title}</h2>
                    {description && <p className="mt-1 max-w-2xl text-sm leading-6 text-primary-dark/58">{description}</p>}
                </div>
            </div>
        </div>
    );
}

function Field({ label, value, onChange, placeholder, type = 'text', required = false, className = '' }) {
    return (
        <div className={`space-y-2 ${className}`}>
            <label className="text-sm font-bold text-primary-dark/72">{label}</label>
            <Input
                type={type}
                value={value || ''}
                onChange={(event) => onChange(event.target.value)}
                placeholder={placeholder}
                required={required}
            />
        </div>
    );
}

function TextareaField({ label, value, onChange, placeholder, className = '' }) {
    return (
        <div className={`space-y-2 ${className}`}>
            <label className="text-sm font-bold text-primary-dark/72">{label}</label>
            <textarea
                className="min-h-[92px] w-full rounded-2xl border border-stone-200 bg-white/80 px-4 py-3 text-sm text-stone-900 outline-none transition-all placeholder:text-stone-400 focus:border-primary/50 focus:bg-white focus:ring-4 focus:ring-primary/10"
                value={value || ''}
                onChange={(event) => onChange(event.target.value)}
                placeholder={placeholder}
            />
        </div>
    );
}

function ColorField({ label, value, onChange }) {
    return (
        <div className="rounded-2xl border border-primary-dark/10 bg-white/72 p-3">
            <label className="text-xs font-bold uppercase tracking-[0.14em] text-primary-dark/44">{label}</label>
            <div className="mt-3 flex items-center gap-3">
                <input
                    type="color"
                    value={colorInputValue(value)}
                    onChange={(event) => onChange(event.target.value)}
                    className="h-11 w-12 shrink-0 cursor-pointer rounded-xl border border-primary-dark/10 bg-white p-1"
                    aria-label={`${label} color picker`}
                />
                <Input value={value || ''} onChange={(event) => onChange(event.target.value)} placeholder="#0d6b58" />
            </div>
        </div>
    );
}

function CmsTabs({ activeTab, onChange }) {
    return (
        <div className="rounded-[1.25rem] border border-primary-dark/10 bg-white/76 p-2 shadow-[0_28px_86px_-68px_rgba(9,31,26,0.68)] backdrop-blur-xl">
            <p className="px-3 pb-2 pt-1 text-xs font-bold uppercase tracking-[0.16em] text-primary-dark/42">CMS Areas</p>
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
                {CMS_TABS.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.key;

                    return (
                        <button
                            key={tab.key}
                            type="button"
                            onClick={() => onChange(tab.key)}
                            className={`flex items-start gap-3 rounded-2xl p-3 text-left transition-all ${
                                isActive
                                    ? 'bg-primary-dark text-white shadow-[0_18px_44px_-28px_rgba(9,31,26,0.78)]'
                                    : 'text-primary-dark/62 hover:bg-primary-light/70 hover:text-primary-dark'
                            }`}
                        >
                            <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${isActive ? 'bg-white/14 text-secondary' : 'bg-primary-light text-primary'}`}>
                                <Icon size={18} aria-hidden="true" />
                            </span>
                            <span>
                                <span className="block font-display text-base font-extrabold leading-tight">{tab.title}</span>
                                <span className={`mt-1 block text-xs font-semibold leading-5 ${isActive ? 'text-white/68' : 'text-primary-dark/44'}`}>{tab.description}</span>
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

function ImageField({ label, value, onChange, onUpload, uploading, feedback, placeholder, description, className = '' }) {
    const inputId = `image-upload-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

    const resolvedSrc = (() => {
        if (!value || typeof value !== 'string') return '';
        if (value.startsWith('/storage/v1/object/public/')) {
            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
            const base = supabaseUrl.endsWith('/') ? supabaseUrl.slice(0, -1) : supabaseUrl;
            return `${base}${value}`;
        }
        return value;
    })();

    return (
        <div className={`rounded-2xl border border-primary-dark/10 bg-white/72 p-3 ${className}`}>
            <div className="grid gap-3 sm:grid-cols-[5.5rem_1fr]">
                <div className="h-[5.5rem] overflow-hidden rounded-2xl border border-primary-dark/10 bg-primary-light">
                    {value ? (
                        <img src={resolvedSrc} alt="" className="h-full w-full object-cover" />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center text-primary-dark/34">
                            <ImageIcon size={24} aria-hidden="true" />
                        </div>
                    )}
                </div>
                <div className="min-w-0 space-y-2">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                            <label className="text-sm font-bold text-primary-dark/72">{label}</label>
                            {description && <p className="mt-0.5 text-xs font-semibold leading-5 text-primary-dark/44">{description}</p>}
                        </div>
                        <input
                            id={inputId}
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            className="sr-only"
                            disabled={uploading}
                            onChange={async (event) => {
                                const file = event.target.files?.[0];
                                if (file) await onUpload(file);
                                event.target.value = '';
                            }}
                        />
                        <label
                            htmlFor={inputId}
                            className={`inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-full border border-primary-dark/10 px-4 text-sm font-extrabold transition-all ${
                                uploading
                                    ? 'pointer-events-none bg-primary-dark/8 text-primary-dark/36'
                                    : 'bg-primary-dark text-white hover:bg-primary'
                            }`}
                        >
                            <UploadCloud size={16} aria-hidden="true" />
                            {uploading ? 'Uploading...' : 'Upload'}
                        </label>
                    </div>
                    <Input value={value || ''} onChange={(event) => onChange(event.target.value)} placeholder={placeholder || '/images/court2.jpg'} />
                    <p className="text-xs font-semibold text-primary-dark/42">
                        {feedback || 'Uploads are compressed before saving and must be 100 KB or smaller.'}
                    </p>
                </div>
            </div>
        </div>
    );
}

function GalleryEditor({ title, description, items, onAdd, onRemove, onChange, onUpload, uploadingKey, uploadFeedback, uploadKeyPrefix }) {
    return (
        <div className="rounded-2xl border border-primary-dark/10 bg-white/62 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h3 className="font-display text-lg font-extrabold text-primary-dark">{title}</h3>
                    <p className="mt-1 text-sm leading-6 text-primary-dark/56">{description}</p>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={onAdd}>
                    <Plus size={16} aria-hidden="true" />
                    Add Image
                </Button>
            </div>

            <div className="mt-4 space-y-3">
                {(items || []).map((item, index) => {
                    const itemUploadKey = `${uploadKeyPrefix}-${index}`;

                    return (
                        <div key={`${title}-${index}`} className="grid gap-3 rounded-2xl border border-primary-dark/10 bg-white/60 p-3 xl:grid-cols-[1fr_auto] xl:items-center">
                            <ImageField
                                label={`${title} ${index + 1}`}
                                value={item || ''}
                                onChange={(value) => onChange(index, value)}
                                onUpload={(file) => onUpload(index, file, itemUploadKey)}
                                uploading={uploadingKey === itemUploadKey}
                                feedback={uploadFeedback[itemUploadKey]}
                                className="border-none bg-transparent p-0"
                            />
                            <Button type="button" variant="ghost" size="sm" onClick={() => onRemove(index)} className="text-red-600 hover:bg-red-50 xl:self-end">
                                <Trash2 size={16} aria-hidden="true" />
                                Remove
                            </Button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export function AdminSettings() {
    const { refresh: refreshCompany } = useCompany();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [settings, setSettings] = useState(DEFAULT_SETTINGS);
    const [activeTab, setActiveTab] = useState('brand');
    const [uploadingKey, setUploadingKey] = useState('');
    const [uploadFeedback, setUploadFeedback] = useState({});

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            setLoading(true);
            const data = await getTenantSettings();
            if (data) {
                setSettings(mergeLoadedSettings(data));
            }
        } catch (err) {
            setError('Failed to load settings');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (event) => {
        event.preventDefault();
        try {
            setSaving(true);
            setError('');
            setSuccess('');

            const sanitizedSiteImages = {
                ...settings.site_images,
                logoUrl: settings.logo_url || settings.site_images.logoUrl,
                heroBackground: settings.hero_bg_url || settings.site_images.heroBackground,
                galleries: {
                    hero: normalizeImageList(settings.site_images.galleries?.hero),
                    venue: normalizeImageList(settings.site_images.galleries?.venue),
                    courts: normalizeImageList(settings.site_images.galleries?.courts),
                },
                sectionBackgrounds: {
                    ...settings.site_images.sectionBackgrounds,
                },
            };

            const sanitizedSettings = {
                ...settings,
                logo_url: settings.logo_url || sanitizedSiteImages.logoUrl,
                hero_bg_url: settings.hero_bg_url || sanitizedSiteImages.heroBackground,
                payment_qr_url: settings.payment_qr_url || '',
                site_images: sanitizedSiteImages,
            };

            if (containsUnsafeScript(sanitizedSettings)) {
                throw new Error('Invalid script tag detected in settings.');
            }

            await updateTenantSettings(sanitizedSettings);

            setSettings((current) => ({
                ...current,
                logo_url: sanitizedSettings.logo_url,
                hero_bg_url: sanitizedSettings.hero_bg_url,
                payment_qr_url: sanitizedSettings.payment_qr_url,
                site_images: sanitizedSiteImages,
            }));
            setSuccess('Settings updated successfully!');
            await refreshCompany();

            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.message || 'Failed to update settings');
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    const handleImageUpload = async (uploadKey, file, onUrlReady) => {
        try {
            setError('');
            setSuccess('');
            setUploadingKey(uploadKey);
            setUploadFeedback((prev) => ({
                ...prev,
                [uploadKey]: `Compressing ${formatImageSize(file.size)}...`,
            }));

            const uploaded = await uploadCmsImage(uploadKey, file);
            onUrlReady(uploaded.url);

            setUploadFeedback((prev) => ({
                ...prev,
                [uploadKey]: `Uploaded at ${formatImageSize(uploaded.size)}.`,
            }));
            setSuccess('Image uploaded. Save settings to publish the change.');
        } catch (err) {
            setUploadFeedback((prev) => ({
                ...prev,
                [uploadKey]: err.message || 'Upload failed.',
            }));
            setError(err.message || 'Image upload failed');
        } finally {
            setUploadingKey('');
        }
    };

    const updateContact = (field, value) => {
        setSettings((prev) => ({
            ...prev,
            contact_info: {
                ...prev.contact_info,
                [field]: value,
            },
        }));
    };

    const updateHours = (field, value) => {
        setSettings((prev) => ({
            ...prev,
            operating_hours: {
                ...prev.operating_hours,
                [field]: value,
            },
        }));
    };

    const updateTheme = (field, value) => {
        setSettings((prev) => ({
            ...prev,
            theme_config: {
                ...prev.theme_config,
                [field]: value,
            },
        }));
    };

    const updateLogo = (value) => {
        setSettings((prev) => ({
            ...prev,
            logo_url: value,
            site_images: {
                ...prev.site_images,
                logoUrl: value,
            },
        }));
    };

    const updateHeroBg = (value) => {
        setSettings((prev) => ({
            ...prev,
            hero_bg_url: value,
            site_images: {
                ...prev.site_images,
                heroBackground: value,
            },
        }));
    };

    const updatePaymentQr = (value) => {
        setSettings((prev) => ({
            ...prev,
            payment_qr_url: value,
        }));
    };

    const handleQrUpload = async (uploadKey, file, onUrlReady) => {
        try {
            setError('');
            setSuccess('');
            setUploadingKey(uploadKey);
            setUploadFeedback((prev) => ({
                ...prev,
                [uploadKey]: `Compressing ${formatImageSize(file.size)}...`,
            }));

            const uploadedUrl = await uploadQrImage(uploadKey, file);
            onUrlReady(uploadedUrl);

            setUploadFeedback((prev) => ({
                ...prev,
                [uploadKey]: `Uploaded successfully.`,
            }));
            setSuccess('QR Code uploaded. Save settings to publish the change.');
        } catch (err) {
            setUploadFeedback((prev) => ({
                ...prev,
                [uploadKey]: err.message || 'Upload failed.',
            }));
            setError(err.message || 'QR Code upload failed');
        } finally {
            setUploadingKey('');
        }
    };

    const updateSiteImage = (field, value) => {
        setSettings((prev) => ({
            ...prev,
            site_images: {
                ...prev.site_images,
                [field]: value,
            },
        }));
    };

    const updateSectionBackground = (section, value) => {
        setSettings((prev) => ({
            ...prev,
            site_images: {
                ...prev.site_images,
                sectionBackgrounds: {
                    ...prev.site_images.sectionBackgrounds,
                    [section]: value,
                },
            },
        }));
    };

    const updateGallery = (gallery, index, value) => {
        setSettings((prev) => {
            const nextGallery = [...(prev.site_images.galleries?.[gallery] || [])];
            nextGallery[index] = value;

            return {
                ...prev,
                site_images: {
                    ...prev.site_images,
                    galleries: {
                        ...prev.site_images.galleries,
                        [gallery]: nextGallery,
                    },
                },
            };
        });
    };

    const addGalleryImage = (gallery) => {
        setSettings((prev) => ({
            ...prev,
            site_images: {
                ...prev.site_images,
                galleries: {
                    ...prev.site_images.galleries,
                    [gallery]: [...(prev.site_images.galleries?.[gallery] || []), ''],
                },
            },
        }));
    };

    const removeGalleryImage = (gallery, index) => {
        setSettings((prev) => ({
            ...prev,
            site_images: {
                ...prev.site_images,
                galleries: {
                    ...prev.site_images.galleries,
                    [gallery]: (prev.site_images.galleries?.[gallery] || []).filter((_, itemIndex) => itemIndex !== index),
                },
            },
        }));
    };

    const updateSectionContent = (section, field, value) => {
        setSettings((prev) => ({
            ...prev,
            section_content: {
                ...prev.section_content,
                [section]: {
                    ...prev.section_content[section],
                    [field]: value,
                },
            },
        }));
    };

    const toggleAmenity = (key) => {
        setSettings((prev) => {
            const current = prev.amenities || [];
            if (current.includes(key)) {
                return { ...prev, amenities: current.filter((item) => item !== key) };
            }
            return { ...prev, amenities: [...current, key] };
        });
    };

    if (loading) {
        return (
            <div className="flex min-h-[400px] items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
            </div>
        );
    }

    return (
        <div className="max-w-7xl space-y-8">
            <div className="rounded-[1.5rem] border border-primary-dark/10 bg-white/72 p-5 shadow-[0_30px_96px_-72px_rgba(9,31,26,0.7)] sm:p-6">
                <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
                    <div>
                        <p className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-primary-dark/42">Admin CMS</p>
                        <h1 className="mt-2 font-display text-4xl font-extrabold leading-[0.95] text-primary-dark">Site Settings Studio</h1>
                        <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-primary-dark/58">
                            Manage brand, page copy, galleries, contact details, and compressed image uploads for every owner-facing landing page.
                        </p>
                    </div>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                        <div className="rounded-2xl border border-primary-dark/10 bg-primary-light/64 p-3">
                            <p className="font-display text-2xl font-extrabold text-primary-dark">{Object.keys(settings.theme_config || {}).length}</p>
                            <p className="mt-1 text-xs font-bold uppercase tracking-[0.12em] text-primary-dark/42">Colors</p>
                        </div>
                        <div className="rounded-2xl border border-primary-dark/10 bg-white/72 p-3">
                            <p className="font-display text-2xl font-extrabold text-primary-dark">
                                {Object.values(settings.site_images.galleries || {}).reduce((total, list) => total + normalizeImageList(list).length, 0)}
                            </p>
                            <p className="mt-1 text-xs font-bold uppercase tracking-[0.12em] text-primary-dark/42">Gallery Images</p>
                        </div>
                        <div className="rounded-2xl border border-primary-dark/10 bg-secondary-light/80 p-3">
                            <p className="font-display text-2xl font-extrabold text-primary-dark">100KB</p>
                            <p className="mt-1 text-xs font-bold uppercase tracking-[0.12em] text-primary-dark/42">Upload Cap</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-[18rem_1fr] xl:items-start">
                <div className="xl:sticky xl:top-24">
                    <CmsTabs activeTab={activeTab} onChange={setActiveTab} />
                </div>

                <form onSubmit={handleSave} className="space-y-6 pb-24">
                <Card className={`rounded-[1.25rem] border-none p-6 shadow-md ${activeTab === 'brand' ? '' : 'hidden'}`}>
                    <div className="space-y-6">
                        <SectionHeader icon={Building2} title="General Branding" description="Core company details shown in the navigation, footer, and contact areas." />

                        <div className="grid gap-5 sm:grid-cols-2">
                            <Field
                                label="Company Full Name"
                                value={settings.company_name}
                                onChange={(value) => setSettings((prev) => ({ ...prev, company_name: value }))}
                                placeholder="e.g. Pickle Point Cebu"
                                required
                            />
                            <Field
                                label="Short Name / Display Name"
                                value={settings.company_short_name}
                                onChange={(value) => setSettings((prev) => ({ ...prev, company_short_name: value }))}
                                placeholder="e.g. Pickle Point"
                            />
                            <ImageField
                                className="sm:col-span-2"
                                label="Navigation Logo"
                                value={settings.logo_url}
                                onChange={updateLogo}
                                onUpload={(file) => handleImageUpload('logo', file, updateLogo)}
                                uploading={uploadingKey === 'logo'}
                                feedback={uploadFeedback.logo}
                                placeholder="/images/pplogo.jpg"
                                description="Used in the admin preview, nav bar, and hero logo badge."
                            />
                            <ImageField
                                className="sm:col-span-2"
                                label="Payment QR Fallback (GCash/GoTyme)"
                                value={settings.payment_qr_url}
                                onChange={updatePaymentQr}
                                onUpload={(file) => handleQrUpload('fallback', file, updatePaymentQr)}
                                uploading={uploadingKey === 'fallback'}
                                feedback={uploadFeedback.fallback}
                                placeholder="/images/gcash.jpg"
                                description="Global fallback QR payment option if no active tenant QR options exist."
                            />
                        </div>
                    </div>
                </Card>

                <Card className={`rounded-[1.25rem] border-none p-6 shadow-md ${activeTab === 'brand' ? '' : 'hidden'}`}>
                    <div className="space-y-6">
                        <SectionHeader icon={Palette} title="Theme Colors" description="These colors drive the public landing page theme and keep every owner on-brand." />
                        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                            {THEME_FIELDS.map((field) => (
                                <ColorField
                                    key={field.key}
                                    label={field.label}
                                    value={settings.theme_config[field.key]}
                                    onChange={(value) => updateTheme(field.key, value)}
                                />
                            ))}
                        </div>
                    </div>
                </Card>

                <Card className={`rounded-[1.25rem] border-none p-6 shadow-md ${activeTab === 'brand' ? '' : 'hidden'}`}>
                    <div className="space-y-6">
                        <SectionHeader icon={ImageIcon} title="Hero CMS" description="Main landing page headline, stats, background, and small venue photos." />

                        <div className="grid gap-5">
                            <ImageField
                                label="Hero Background Image"
                                value={settings.hero_bg_url}
                                onChange={updateHeroBg}
                                onUpload={(file) => handleImageUpload('hero-background', file, updateHeroBg)}
                                uploading={uploadingKey === 'hero-background'}
                                feedback={uploadFeedback['hero-background']}
                                placeholder="/images/court1.jpg"
                                description="Large first-screen background image."
                            />
                            <Field
                                label="Badge Text"
                                value={settings.hero_badge}
                                onChange={(value) => setSettings((prev) => ({ ...prev, hero_badge: value }))}
                                placeholder={`e.g. New courts available in ${settings.contact_info.address || 'Moalboal'}`}
                            />
                            <Field
                                label="Hero Main Title"
                                value={settings.hero_title}
                                onChange={(value) => setSettings((prev) => ({ ...prev, hero_title: value }))}
                                placeholder={`e.g. Book your next ${settings.company_short_name || 'Game'}`}
                            />
                            <TextareaField
                                label="Hero Subtitle / Description"
                                value={settings.hero_subtitle}
                                onChange={(value) => setSettings((prev) => ({ ...prev, hero_subtitle: value }))}
                                placeholder="Enter a compelling description for your venue..."
                            />
                            <div className="grid gap-5 sm:grid-cols-2">
                                <Field
                                    label="Players Count Stat"
                                    value={settings.hero_stat_players}
                                    onChange={(value) => setSettings((prev) => ({ ...prev, hero_stat_players: value }))}
                                />
                                <Field
                                    label="Operating Days Stat"
                                    value={settings.hero_stat_days}
                                    onChange={(value) => setSettings((prev) => ({ ...prev, hero_stat_days: value }))}
                                />
                            </div>

                            <GalleryEditor
                                title="Hero Gallery"
                                description="Shown beside the hero stats card as venue image bubbles."
                                items={settings.site_images.galleries?.hero}
                                onAdd={() => addGalleryImage('hero')}
                                onRemove={(index) => removeGalleryImage('hero', index)}
                                onChange={(index, value) => updateGallery('hero', index, value)}
                                onUpload={(index, file, uploadKey) => handleImageUpload(uploadKey, file, (url) => updateGallery('hero', index, url))}
                                uploadKeyPrefix="hero-gallery"
                                uploadingKey={uploadingKey}
                                uploadFeedback={uploadFeedback}
                            />
                        </div>

                        <div className="border-t border-primary-dark/10 pt-6">
                            <p className="mb-4 text-xs font-bold uppercase tracking-[0.14em] text-primary-dark/42">Live Preview</p>
                            <div className="mx-auto max-w-md rounded-3xl border border-primary-dark/10 bg-white/80 p-4 shadow-inner">
                                <div className="space-y-4">
                                    <div className="inline-flex max-w-full items-center gap-2 rounded-full bg-primary-light px-3 py-1 text-xs font-bold text-primary-dark/70">
                                        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                                        <span className="truncate">{settings.hero_badge || `New courts available in ${settings.contact_info.address || 'location'}`}</span>
                                    </div>
                                    <h3 className="font-display text-4xl font-extrabold leading-[0.9] text-primary-dark">
                                        {settings.hero_title || 'Book your next Game'}
                                    </h3>
                                    <p className="line-clamp-3 text-sm font-semibold leading-6 text-primary-dark/58">
                                        {settings.hero_subtitle || 'Experience the best pickleball courts in your area.'}
                                    </p>
                                    <div className="inline-flex items-center gap-2 rounded-full bg-primary-dark px-4 py-2 text-sm font-bold text-white">
                                        Book a Court <ArrowRight size={14} aria-hidden="true" />
                                    </div>
                                    <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-primary-dark/50">
                                        <span className="flex items-center gap-1"><Users size={14} className="text-secondary" /> {settings.hero_stat_players}</span>
                                        <span className="flex items-center gap-1"><Calendar size={14} className="text-secondary" /> {settings.hero_stat_days}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>

                <Card className={`rounded-[1.25rem] border-none p-6 shadow-md ${activeTab === 'images' ? '' : 'hidden'}`}>
                    <div className="space-y-6">
                        <SectionHeader icon={ImageIcon} title="Section Images & Galleries" description="Control section background images and reusable gallery pools." />

                        <div className="grid gap-5 sm:grid-cols-2">
                            {SECTION_BACKGROUNDS.map((section) => (
                                <ImageField
                                    key={section.key}
                                    label={section.label}
                                    value={settings.site_images.sectionBackgrounds?.[section.key]}
                                    onChange={(value) => updateSectionBackground(section.key, value)}
                                    onUpload={(file) => handleImageUpload(`section-${section.key}`, file, (url) => updateSectionBackground(section.key, url))}
                                    uploading={uploadingKey === `section-${section.key}`}
                                    feedback={uploadFeedback[`section-${section.key}`]}
                                    placeholder="/images/section-bg.jpg"
                                    description="Optional background image for this public section."
                                />
                            ))}
                        </div>

                        <div className="grid gap-4">
                            {GALLERY_GROUPS.filter((group) => group.key !== 'hero').map((group) => (
                                <GalleryEditor
                                    key={group.key}
                                    title={group.title}
                                    description={group.description}
                                    items={settings.site_images.galleries?.[group.key]}
                                    onAdd={() => addGalleryImage(group.key)}
                                    onRemove={(index) => removeGalleryImage(group.key, index)}
                                    onChange={(index, value) => updateGallery(group.key, index, value)}
                                    onUpload={(index, file, uploadKey) => handleImageUpload(uploadKey, file, (url) => updateGallery(group.key, index, url))}
                                    uploadKeyPrefix={`${group.key}-gallery`}
                                    uploadingKey={uploadingKey}
                                    uploadFeedback={uploadFeedback}
                                />
                            ))}
                        </div>
                    </div>
                </Card>

                <Card className={`rounded-[1.25rem] border-none p-6 shadow-md ${activeTab === 'copy' ? '' : 'hidden'}`}>
                    <div className="space-y-6">
                        <SectionHeader icon={FileText} title="Section Titles & Descriptions" description="Edit public-facing copy for each landing page section." />

                        <div className="grid gap-5">
                            {SECTION_COPY_GROUPS.map((group) => (
                                <div key={group.key} className="rounded-2xl border border-primary-dark/10 bg-white/62 p-4">
                                    <h3 className="font-display text-xl font-extrabold text-primary-dark">{group.title}</h3>
                                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                                        {group.fields.map((field) => {
                                            const value = settings.section_content[group.key]?.[field.key] || '';
                                            const onChange = (nextValue) => updateSectionContent(group.key, field.key, nextValue);

                                            return field.multiline ? (
                                                <TextareaField
                                                    key={field.key}
                                                    className="sm:col-span-2"
                                                    label={field.label}
                                                    value={value}
                                                    onChange={onChange}
                                                />
                                            ) : (
                                                <Field key={field.key} label={field.label} value={value} onChange={onChange} />
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </Card>

                <Card className={`rounded-[1.25rem] border-none p-6 shadow-md ${activeTab === 'venue' ? '' : 'hidden'}`}>
                    <div className="space-y-6">
                        <SectionHeader icon={Mail} title="Contact & Location" description="Shown in the visit section and map embed." />

                        <div className="grid gap-5 sm:grid-cols-2">
                            <Field label="Email Address" type="email" value={settings.contact_info.email} onChange={(value) => updateContact('email', value)} placeholder="hello@example.com" />
                            <Field label="Phone Number" value={settings.contact_info.phone} onChange={(value) => updateContact('phone', value)} placeholder="+63 9xx xxx xxxx" />
                            <TextareaField className="sm:col-span-2" label="Physical Address" value={settings.contact_info.address} onChange={(value) => updateContact('address', value)} placeholder="Complete street address, city, province" />
                            <Field className="sm:col-span-2" label="Google Maps Embed Link / Search Query" value={settings.contact_info.mapQuery} onChange={(value) => updateContact('mapQuery', value)} placeholder="https://maps.app.goo.gl/... or specific venue name" />
                            <Field label="Facebook URL" value={settings.contact_info.facebook} onChange={(value) => updateContact('facebook', value)} placeholder="https://facebook.com/yourpage" />
                            <Field label="Instagram URL" value={settings.contact_info.instagram} onChange={(value) => updateContact('instagram', value)} placeholder="https://instagram.com/yourhandle" />
                        </div>
                    </div>
                </Card>

                <Card className={`rounded-[1.25rem] border-none p-6 shadow-md ${activeTab === 'venue' ? '' : 'hidden'}`}>
                    <div className="space-y-6">
                        <SectionHeader icon={Clock} title="Operational Hours" description="Used in the contact section and booking context." />

                        <div className="grid gap-5 sm:grid-cols-2">
                            <Field label="Opening Time" type="time" value={settings.operating_hours.open} onChange={(value) => updateHours('open', value)} />
                            <Field label="Closing Time" type="time" value={settings.operating_hours.close} onChange={(value) => updateHours('close', value)} />
                        </div>

                        <div className="space-y-3 pt-4 border-t border-primary-dark/10">
                            <label className="text-sm font-bold text-primary-dark/72">Open Days of the Week</label>
                            <div className="flex flex-wrap gap-2 pt-1">
                                {[
                                    { value: 1, label: 'Mon' },
                                    { value: 2, label: 'Tue' },
                                    { value: 3, label: 'Wed' },
                                    { value: 4, label: 'Thu' },
                                    { value: 5, label: 'Fri' },
                                    { value: 6, label: 'Sat' },
                                    { value: 0, label: 'Sun' },
                                ].map((day) => {
                                    const isOpen = (settings.operating_hours?.openDays || [0, 1, 2, 3, 4, 5, 6]).includes(day.value);
                                    return (
                                        <button
                                            key={day.value}
                                            type="button"
                                            onClick={() => {
                                                const currentDays = settings.operating_hours?.openDays || [0, 1, 2, 3, 4, 5, 6];
                                                let nextDays;
                                                if (currentDays.includes(day.value)) {
                                                    // Ensure at least one day remains open
                                                    if (currentDays.length <= 1) {
                                                        alert('At least one operational day must be selected.');
                                                        return;
                                                    }
                                                    nextDays = currentDays.filter(d => d !== day.value);
                                                } else {
                                                    nextDays = [...currentDays, day.value];
                                                }
                                                updateHours('openDays', nextDays);
                                            }}
                                            className={`flex h-12 w-12 items-center justify-center rounded-xl border-2 text-sm font-bold transition-all duration-200 ${
                                                isOpen
                                                    ? 'border-primary bg-primary text-white shadow-md shadow-primary/20 hover:bg-primary-dark'
                                                    : 'border-primary-dark/8 bg-white text-primary-dark/58 hover:border-primary-dark/16 hover:bg-primary-light/30'
                                            }`}
                                        >
                                            {day.label}
                                        </button>
                                    );
                                })}
                            </div>
                            <p className="text-xs font-semibold text-primary-dark/42">
                                Select the days of the week your venue is open. Deselected days will be disabled for booking and slot management.
                            </p>
                        </div>
                    </div>
                </Card>

                <Card className={`rounded-[1.25rem] border-none p-6 shadow-md ${activeTab === 'venue' ? '' : 'hidden'}`}>
                    <div className="space-y-6">
                        <SectionHeader icon={DoorOpen} title="Facilities & Amenities" description="Choose which perks appear on the offers section." />

                        <div className="flex items-center justify-between gap-4 rounded-2xl border border-primary-dark/10 bg-white/70 p-4">
                            <div>
                                <p className="font-display text-lg font-extrabold text-primary-dark">Show Map / Parking Availability</p>
                                <p className="mt-1 text-sm text-primary-dark/54">If disabled, the parking section on the homepage will be hidden.</p>
                            </div>
                            <label className="relative inline-flex cursor-pointer items-center">
                                <input
                                    type="checkbox"
                                    className="peer sr-only"
                                    checked={settings.parking_enabled}
                                    onChange={(event) => setSettings((prev) => ({ ...prev, parking_enabled: event.target.checked }))}
                                />
                                <div className="h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white" />
                            </label>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                            {AVAILABLE_AMENITIES.map((amenity) => {
                                const Icon = amenity.icon;
                                const isSelected = settings.amenities?.includes(amenity.key);

                                return (
                                    <button
                                        key={amenity.key}
                                        type="button"
                                        onClick={() => toggleAmenity(amenity.key)}
                                        className={`flex items-center gap-3 rounded-2xl border-2 p-3 text-left transition-all ${
                                            isSelected
                                                ? 'border-primary bg-primary-light text-primary-dark shadow-sm'
                                                : 'border-primary-dark/8 bg-white text-primary-dark/58 hover:border-primary-dark/16'
                                        }`}
                                    >
                                        <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${isSelected ? 'bg-white' : 'bg-primary-light/50'}`}>
                                            <Icon size={18} aria-hidden="true" />
                                        </span>
                                        <span className="flex-1 text-sm font-bold">{amenity.title}</span>
                                        {isSelected && <Check size={16} className="text-primary" aria-hidden="true" />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </Card>

                {settings.parking_enabled && (
                    <Card className={`rounded-[1.25rem] border-none p-6 shadow-md ${activeTab === 'venue' ? '' : 'hidden'}`}>
                        <div className="space-y-6">
                            <SectionHeader icon={Car} title="Parking Details" description="Configure where guests can park when they arrive at the venue." />
                            
                            <div className="flex items-center justify-between gap-4 rounded-2xl border border-primary-dark/10 bg-white/70 p-4">
                                <div>
                                    <p className="font-display text-lg font-extrabold text-primary-dark">Parking is inside the court/building</p>
                                    <p className="mt-1 text-sm text-primary-dark/54">Enable if parking is on-site inside the venue facility. Disable to specify an external parking lot pin.</p>
                                </div>
                                <label className="relative inline-flex cursor-pointer items-center">
                                    <input
                                        type="checkbox"
                                        className="peer sr-only"
                                        checked={settings.parking_is_inside}
                                        onChange={(event) => setSettings((prev) => ({ ...prev, parking_is_inside: event.target.checked }))}
                                    />
                                    <div className="h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white" />
                                </label>
                            </div>

                            {!settings.parking_is_inside && (
                                <div className="space-y-4 rounded-2xl border border-primary-dark/10 bg-white/40 p-4">
                                    <Field
                                        label="Google Maps Pin / Query for Parking Lot"
                                        value={settings.parking_map_link}
                                        onChange={(value) => setSettings((prev) => ({ ...prev, parking_map_link: value }))}
                                        placeholder="https://maps.app.goo.gl/... or latitude,longitude coordinates"
                                    />
                                    <p className="text-xs font-semibold text-primary-dark/42">
                                        Type or paste the Google Maps link, raw coordinates (e.g. 10.3157,123.8854), or address for the parking lot. We will pin it on the landing page map automatically.
                                    </p>
                                </div>
                            )}
                        </div>
                    </Card>
                )}


                <div className="sticky bottom-0 z-20 mt-8 flex items-center justify-between gap-4 border-t border-primary-dark/10 bg-bg-light/86 py-4 backdrop-blur-md">
                    <div className="text-sm">
                        {error && <p className="font-bold text-red-600">{error}</p>}
                        {success && <p className="font-bold text-green-600">{success}</p>}
                    </div>
                    <Button type="submit" disabled={saving} className="min-w-[150px] shadow-lg shadow-primary/20">
                        {saving ? (
                            <span className="flex items-center gap-2">
                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                Saving...
                            </span>
                        ) : (
                            <span className="flex items-center gap-2">
                                <Save size={18} aria-hidden="true" />
                                Save Settings
                            </span>
                        )}
                    </Button>
                </div>
                </form>
            </div>
        </div>
    );
}
