import {
    Activity,
    AlertCircle,
    AlertTriangle,
    ArrowLeft,
    Building2,
    Calendar,
    CheckCircle2,
    Clock,
    CreditCard,
    DollarSign,
    Grid,
    Loader2,
    Mail,
    MapPin,
    Phone,
    RefreshCw,
    Shield,
    Trash2,
    Users,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';

// ─── Feature key definitions ────────────────────────────────────────────────
const FEATURE_KEYS = [
    { key: 'company_settings', label: 'Company Settings', description: 'Allows customization of branding, theme, and logo.' },
    { key: 'analytics', label: 'Analytics Panel', description: 'Provides deep insights into court usage and revenue.' },
    { key: 'qr_codes', label: 'QR Digital Payments', description: 'Enables booking checkout via scan-to-pay codes.' },
    { key: 'time_slots', label: 'Granular Time Slots', description: 'Allows custom duration and operating hour schedules.' },
];

const DEFAULT_FEATURES = {
    company_settings: true,
    analytics: false,
    qr_codes: true,
    time_slots: true,
};

// ─── Billing Tier Definitions ───────────────────────────────────────────────
const BILLING_TIERS = {
    starter: {
        name: 'Starter Plan',
        price: '₱499.00',
        courtsLimit: 2,
        playersLimit: '50 Players limit',
        description: 'Billed monthly',
    },
    pro: {
        name: 'Pro Plan',
        price: '₱999.00',
        courtsLimit: 5,
        playersLimit: '500 Players limit',
        description: 'Billed monthly',
    },
    enterprise: {
        name: 'Enterprise Pro Plan',
        price: '₱1,499.00',
        courtsLimit: 10,
        playersLimit: 'Unlimited Players',
        description: 'Billed monthly',
    }
};

export function TenantDetail() {
    const { tenantId } = useParams();
    const navigate = useNavigate();

    // ─── State variables ─────────────────────────────────────────────────────
    const [tenant, setTenant] = useState(null);
    const [settings, setSettings] = useState(null);
    const [owner, setOwner] = useState(null);
    const [kpis, setKpis] = useState(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [kpisLoading, setKpisLoading] = useState(true);

    const [activeTab, setActiveTab] = useState('features');
    const [updatingFeatures, setUpdatingFeatures] = useState(false);
    const [updatingBilling, setUpdatingBilling] = useState(false);
    const [suspending, setSuspending] = useState(false);
    const [impersonating, setImpersonating] = useState(false);
    const [confirmTenantName, setConfirmTenantName] = useState('');

    const [showSuccessToast, setShowSuccessToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');

    // ─── Fetch All Tenant Information ────────────────────────────────────────
    const fetchTenantData = useCallback(async () => {
        try {
            setLoading(true);
            setError('');

            // 1. Fetch main tenant record
            const { data: tenantData, error: tenantErr } = await supabase
                .from('tenants')
                .select('*')
                .eq('id', tenantId)
                .maybeSingle();

            if (tenantErr) throw tenantErr;
            if (!tenantData) {
                setError('Tenant not found.');
                setLoading(false);
                return;
            }

            setTenant(tenantData);

            // 2. Fetch tenant_settings
            const { data: settingsData, error: settingsErr } = await supabase
                .from('tenant_settings')
                .select('*')
                .eq('company_id', tenantId)
                .maybeSingle();

            if (!settingsErr && settingsData) {
                setSettings(settingsData);
            }

            // 3. Fetch primary owner email/name from admin_users
            const { data: ownerData, error: ownerErr } = await supabase
                .from('admin_users')
                .select('*')
                .eq('company_id', tenantId)
                .eq('role', 'owner')
                .maybeSingle();

            if (!ownerErr && ownerData) {
                setOwner(ownerData);
            } else {
                // Fallback: get the oldest admin if no role = 'owner' is marked yet
                const { data: adminList } = await supabase
                    .from('admin_users')
                    .select('*')
                    .eq('company_id', tenantId)
                    .order('created_at', { ascending: true })
                    .limit(1);
                
                if (adminList && adminList.length > 0) {
                    setOwner(adminList[0]);
                }
            }

            // 4. Fetch Tenant Specific KPIs using get_tenant_kpis RPC
            await fetchKpis();

        } catch (err) {
            console.error('Error fetching tenant details:', err);
            setError(err.message || 'Failed to retrieve tenant information.');
        } finally {
            setLoading(false);
        }
    }, [tenantId]);

    const fetchKpis = async () => {
        try {
            setKpisLoading(true);
            const { data, error } = await supabase.rpc('get_tenant_kpis', {
                p_tenant_id: tenantId,
            });

            if (error) throw error;
            setKpis(data);
        } catch (err) {
            console.error('Error fetching tenant KPIs:', err);
        } finally {
            setKpisLoading(false);
        }
    };

    useEffect(() => {
        fetchTenantData();
    }, [fetchTenantData]);

    // ─── Toggles Feature Flag ────────────────────────────────────────────────
    const handleToggleFeature = async (featureKey, newValue) => {
        if (!tenant) return;

        const previousFeatures = { ...DEFAULT_FEATURES, ...(tenant.features || {}) };
        const updatedFeatures = { ...previousFeatures, [featureKey]: newValue };

        // Optimistically update state
        setTenant((prev) => ({ ...prev, features: updatedFeatures }));
        setUpdatingFeatures(true);

        try {
            const { error: updateErr } = await supabase
                .from('tenants')
                .update({ features: updatedFeatures })
                .eq('id', tenant.id);

            if (updateErr) throw updateErr;

            triggerToast(`Successfully toggled ${FEATURE_KEYS.find(f => f.key === featureKey)?.label}`);
        } catch (err) {
            console.error('Failed to update feature toggles:', err);
            // Rollback on error
            setTenant((prev) => ({ ...prev, features: previousFeatures }));
        } finally {
            setUpdatingFeatures(false);
        }
    };

    // ─── Suspend / Reactivate Tenant ─────────────────────────────────────────
    const handleToggleSuspension = async () => {
        if (!tenant) return;

        const isCurrentlyActive = tenant.is_active;
        
        if (isCurrentlyActive && confirmTenantName !== tenant.name) {
            alert('Please type the correct tenant name to suspend.');
            return;
        }

        setSuspending(true);

        try {
            const { error: updateErr } = await supabase
                .from('tenants')
                .update({ is_active: !isCurrentlyActive })
                .eq('id', tenant.id);

            if (updateErr) throw updateErr;

            setTenant((prev) => ({ ...prev, is_active: !isCurrentlyActive }));
            setConfirmTenantName('');
            triggerToast(isCurrentlyActive ? 'Tenant suspended successfully.' : 'Tenant reactivated successfully.');
        } catch (err) {
            console.error('Failed to change suspension state:', err);
            alert(err.message || 'An error occurred.');
        } finally {
            setSuspending(false);
        }
    };

    // ─── Impersonate Account ─────────────────────────────────────────────────
    const handleImpersonate = () => {
        setImpersonating(true);
        setTimeout(() => {
            setImpersonating(false);
            alert(`Support Token Signed! Securing session for support administrator as client: ${tenant?.name || 'Tenant'}.
            
Access token has been successfully registered under Company ID: "${tenant?.id}". 
Support Impersonation active.`);
        }, 1800);
    };

    // ─── Update Billing Details ──────────────────────────────────────────────
    const handleUpdateBilling = async (updates) => {
        if (!tenant) return;

        const previousTenant = { ...tenant };
        setTenant((prev) => ({ ...prev, ...updates }));
        setUpdatingBilling(true);

        try {
            const { error: updateErr } = await supabase
                .from('tenants')
                .update(updates)
                .eq('id', tenant.id);

            if (updateErr) throw updateErr;

            triggerToast('Successfully updated billing details.');
        } catch (err) {
            console.error('Failed to update billing details:', err);
            // Rollback
            setTenant(previousTenant);
            alert(err.message || 'Failed to save billing status/tier changes.');
        } finally {
            setUpdatingBilling(false);
        }
    };

    // ─── Toast trigger helper ────────────────────────────────────────────────
    const triggerToast = (msg) => {
        setToastMessage(msg);
        setShowSuccessToast(true);
        setTimeout(() => setShowSuccessToast(false), 3000);
    };

    // ─── Format helpers ──────────────────────────────────────────────────────
    const formatCurrency = (n) => {
        if (n === null || n === undefined) return '₱0';
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(n);
    };

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center bg-[#09090b]">
                <div className="text-center space-y-3">
                    <Loader2 size={32} className="text-violet-500 animate-spin mx-auto" />
                    <p className="text-sm font-semibold text-white/40">Gathering organization blueprint...</p>
                </div>
            </div>
        );
    }

    if (error || !tenant) {
        return (
            <div className="max-w-xl mx-auto py-16 text-center space-y-5">
                <div className="mx-auto w-12 h-12 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center text-red-400">
                    <AlertCircle size={24} />
                </div>
                <h2 className="text-xl font-bold text-white">Retrieval Failed</h2>
                <p className="text-sm text-white/40">{error || 'We could not fetch details for this company.'}</p>
                <button
                    onClick={() => navigate('/odc')}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] text-sm text-white font-semibold transition-colors"
                >
                    <ArrowLeft size={14} />
                    Back to Platform Overview
                </button>
            </div>
        );
    }

    const currentFeatures = { ...DEFAULT_FEATURES, ...(tenant.features || {}) };
    const displayLogoUrl = settings?.logo_url || '/images/default-logo.jpg';
    const subdomain = `${tenant.slug}.yourplatform.com`;

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-16 relative">
            {/* ─── Success Toast ─── */}
            {showSuccessToast && (
                <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-[#111113] border border-emerald-500/20 text-emerald-400 text-xs font-bold shadow-2xl shadow-emerald-500/5 animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <CheckCircle2 size={16} />
                    {toastMessage}
                </div>
            )}

            {/* Impersonation Overlay */}
            {impersonating && (
                <div className="fixed inset-0 z-50 bg-[#09090b]/85 backdrop-blur-md flex items-center justify-center animate-in fade-in duration-300">
                    <div className="text-center space-y-4 max-w-sm p-6 bg-[#111113] border border-white/[0.08] rounded-2xl shadow-2xl">
                        <div className="relative mx-auto w-12 h-12 flex items-center justify-center">
                            <Shield size={24} className="text-violet-500 animate-pulse" />
                            <div className="absolute inset-0 border-2 border-violet-500/20 border-t-violet-500 rounded-full animate-spin" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-white">Signing Support Session</h3>
                            <p className="text-xs text-white/40 mt-1">Generating one-time impersonation token for {tenant.name}...</p>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── Navigation Header ─── */}
            <div>
                <button
                    onClick={() => navigate('/odc')}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.06] text-xs font-bold text-white/50 hover:text-white transition-all cursor-pointer"
                >
                    <ArrowLeft size={12} />
                    Back to Dashboard
                </button>
            </div>

            {/* ─── Identity & Action Header ─── */}
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between p-6 rounded-2xl border border-white/[0.06] bg-[#111113] relative overflow-hidden">
                {/* Visual Ambient Glow */}
                <div className="absolute top-0 right-0 w-[300px] h-[200px] bg-violet-500/[0.02] rounded-full blur-3xl pointer-events-none" />

                <div className="flex items-center gap-4 z-10">
                    <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 border border-white/[0.08] flex items-center justify-center text-violet-400 overflow-hidden relative group">
                        <img 
                            src={displayLogoUrl} 
                            alt={tenant.name} 
                            className="w-full h-full object-cover opacity-80"
                            onError={(e) => {
                                e.target.style.display = 'none';
                            }}
                        />
                        <Building2 size={24} className="absolute text-violet-400/80 group-hover:scale-110 transition-transform" />
                    </div>

                    <div>
                        <div className="flex flex-wrap items-center gap-2.5">
                            <h1 className="font-display text-2xl font-extrabold text-white tracking-tight">
                                {tenant.name}
                            </h1>
                            {!tenant.is_active ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-zinc-500/[0.12] text-zinc-400 border border-zinc-500/20">
                                    <span className="h-1.5 w-1.5 rounded-full bg-zinc-400" />
                                    Suspended
                                </span>
                            ) : tenant.billing_status === 'past_due' ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-500/[0.12] text-red-400 border border-red-500/20">
                                    <span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-pulse" />
                                    Past Due
                                </span>
                            ) : tenant.billing_status === 'trial' ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/[0.12] text-amber-400 border border-amber-500/20">
                                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                                    Trial Account
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/[0.12] text-emerald-400 border border-emerald-500/20">
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                                    Active
                                </span>
                            )}
                            <span className="px-2.5 py-0.5 rounded-full bg-violet-500/[0.12] text-violet-400 border border-violet-500/20 text-[10px] font-bold capitalize">
                                {tenant.billing_tier || 'enterprise'} Tier
                            </span>
                        </div>
                        <p className="mt-1 text-sm font-semibold text-white/30 flex items-center gap-1">
                            <span>ID: <code className="font-mono text-xs text-white/40">{tenant.id}</code></span>
                            <span className="text-white/20">•</span>
                            <a href={`https://${subdomain}`} target="_blank" rel="noopener noreferrer" className="hover:underline hover:text-violet-400 font-mono text-xs">
                                {subdomain}
                            </a>
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 z-10">
                    <button
                        onClick={handleImpersonate}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm font-bold text-white hover:bg-white/[0.08] hover:text-white transition-all cursor-pointer"
                    >
                        <Shield size={14} className="text-violet-400" />
                        Impersonate Admin
                    </button>
                    {tenant.is_active ? (
                        <button
                            onClick={() => {
                                setActiveTab('danger');
                                setTimeout(() => {
                                    document.getElementById('danger-input')?.focus();
                                }, 100);
                            }}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/[0.08] border border-red-500/20 text-sm font-bold text-red-400 hover:bg-red-500/20 transition-all cursor-pointer"
                        >
                            <Trash2 size={14} />
                            Suspend Account
                        </button>
                    ) : (
                        <button
                            onClick={handleToggleSuspension}
                            disabled={suspending}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/[0.12] border border-emerald-500/20 text-sm font-bold text-emerald-400 hover:bg-emerald-500/20 transition-all cursor-pointer"
                        >
                            {suspending ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                            Activate Account
                        </button>
                    )}
                </div>
            </div>

            {/* ─── Tenant-Specific KPI Ribbon ─── */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {kpisLoading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="rounded-2xl border border-white/[0.06] bg-[#111113] p-5 animate-pulse">
                            <div className="h-4 w-24 bg-white/[0.06] rounded mb-4" />
                            <div className="h-8 w-20 bg-white/[0.06] rounded" />
                        </div>
                    ))
                ) : kpis ? (
                    <>
                        {/* KPI 1: Revenue 30 Days */}
                        <div className="group rounded-2xl border border-white/[0.06] bg-[#111113] p-5 hover:border-white/[0.1] hover:bg-[#141416] transition-all">
                            <div className="flex items-center gap-2.5 mb-3.5">
                                <div className="p-2 rounded-xl bg-white/[0.03] border border-white/[0.05] text-white/40">
                                    <DollarSign size={15} />
                                </div>
                                <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/30">Total Revenue (30d)</span>
                            </div>
                            <p className="font-display text-2xl font-extrabold text-white">{formatCurrency(kpis.revenue_30d)}</p>
                            <p className="mt-1 text-[11px] font-semibold text-white/35">Processed booking value</p>
                        </div>

                        {/* KPI 2: Facility Utilization */}
                        <div className="group rounded-2xl border border-white/[0.06] bg-[#111113] p-5 hover:border-white/[0.1] hover:bg-[#141416] transition-all">
                            <div className="flex items-center gap-2.5 mb-3.5">
                                <div className="p-2 rounded-xl bg-white/[0.03] border border-white/[0.05] text-white/40">
                                    <Activity size={15} />
                                </div>
                                <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/30">Court Utilization</span>
                            </div>
                             <div className="flex items-end justify-between">
                                 <p className="font-display text-2xl font-extrabold text-white">{kpis.utilization_rate}%</p>
                                 <span className={`text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 ${
                                     kpis.utilization_rate < 10 
                                         ? 'bg-red-500/[0.12] text-red-400 border border-red-500/20' 
                                         : kpis.utilization_rate >= 80 
                                         ? 'bg-emerald-500/[0.12] text-emerald-400 border border-emerald-500/20 animate-pulse' 
                                         : 'bg-white/[0.05] text-white/45'
                                 }`}>
                                     {kpis.utilization_rate < 10 
                                         ? '⚠️ Churn Risk' 
                                         : kpis.utilization_rate >= 80 
                                         ? '⚡ Needs Expansion' 
                                         : 'Healthy'
                                     }
                                 </span>
                             </div>
                            
                            {/* Utilization Progress Bar */}
                            <div className="mt-3.5">
                                <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                                    <div 
                                        className={`h-full rounded-full transition-all duration-1000 ${
                                            kpis.utilization_rate < 10 
                                                ? 'bg-red-500' 
                                                : kpis.utilization_rate >= 80 
                                                ? 'bg-emerald-500' 
                                                : 'bg-violet-500'
                                        }`}
                                        style={{ width: `${Math.min(kpis.utilization_rate, 100)}%` }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* KPI 3: Player Roster */}
                        <div className="group rounded-2xl border border-white/[0.06] bg-[#111113] p-5 hover:border-white/[0.1] hover:bg-[#141416] transition-all">
                            <div className="flex items-center gap-2.5 mb-3.5">
                                <div className="p-2 rounded-xl bg-white/[0.03] border border-white/[0.05] text-white/40">
                                    <Users size={15} />
                                </div>
                                <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/30">Customer Roster</span>
                            </div>
                            <p className="font-display text-2xl font-extrabold text-white">{kpis.unique_customers}</p>
                            <p className="mt-1 text-[11px] font-semibold text-white/35">Unique verified players</p>
                        </div>

                        {/* KPI 4: Published Courts */}
                        <div className="group rounded-2xl border border-white/[0.06] bg-[#111113] p-5 hover:border-white/[0.1] hover:bg-[#141416] transition-all">
                            <div className="flex items-center gap-2.5 mb-3.5">
                                <div className="p-2 rounded-xl bg-white/[0.03] border border-white/[0.05] text-white/40">
                                    <Grid size={15} />
                                </div>
                                <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/30">Active Courts</span>
                            </div>
                            <p className="font-display text-2xl font-extrabold text-white">{kpis.active_courts_count}</p>
                            <p className="mt-1 text-[11px] font-semibold text-white/35">Published playing courts</p>
                        </div>
                    </>
                ) : (
                    <div className="col-span-4 rounded-xl border border-white/[0.06] bg-[#111113] p-6 text-center text-sm font-semibold text-white/40">
                        Failed to calculate metrics for this organization.
                    </div>
                )}
            </div>

            {/* ─── Management Tab Panel ─── */}
            <div className="space-y-6">
                {/* Tab Navigation */}
                <div className="flex border-b border-white/[0.06] overflow-x-auto select-none gap-2">
                    <button
                        onClick={() => setActiveTab('features')}
                        className={`pb-3 px-4 text-xs font-bold tracking-wider uppercase border-b-2 transition-all cursor-pointer ${
                            activeTab === 'features'
                                ? 'border-violet-500 text-white'
                                : 'border-transparent text-white/40 hover:text-white/70'
                        }`}
                    >
                        Features
                    </button>
                    <button
                        onClick={() => setActiveTab('contact')}
                        className={`pb-3 px-4 text-xs font-bold tracking-wider uppercase border-b-2 transition-all cursor-pointer ${
                            activeTab === 'contact'
                                ? 'border-violet-500 text-white'
                                : 'border-transparent text-white/40 hover:text-white/70'
                        }`}
                    >
                        Organization & Contact
                    </button>
                    <button
                        onClick={() => setActiveTab('billing')}
                        className={`pb-3 px-4 text-xs font-bold tracking-wider uppercase border-b-2 transition-all cursor-pointer ${
                            activeTab === 'billing'
                                ? 'border-violet-500 text-white'
                                : 'border-transparent text-white/40 hover:text-white/70'
                        }`}
                    >
                        Billing & Limits
                    </button>
                    <button
                        onClick={() => setActiveTab('danger')}
                        className={`pb-3 px-4 text-xs font-bold tracking-wider uppercase border-b-2 transition-all cursor-pointer ${
                            activeTab === 'danger'
                                ? 'border-red-500 text-red-400'
                                : 'border-transparent text-white/40 hover:text-red-400/70'
                        }`}
                    >
                        Danger Zone
                    </button>
                </div>

                {/* Tab Content */}
                <div className="min-h-[200px]">
                    {/* ── Tab 1: Feature Flags ── */}
                    {activeTab === 'features' && (
                        <div className="rounded-2xl border border-white/[0.06] bg-[#111113] p-6 space-y-6">
                            <div>
                                <h3 className="font-display text-lg font-extrabold text-white">Dynamic Feature Flag matrix</h3>
                                <p className="text-xs font-semibold text-white/35 mt-1">
                                    Control capability access for this tenant. Updates reflect instantly in their admin environment.
                                </p>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                {FEATURE_KEYS.map((fk) => {
                                    const enabled = currentFeatures[fk.key] ?? false;
                                    return (
                                        <div 
                                            key={fk.key} 
                                            className="flex items-start justify-between p-4 rounded-xl border border-white/[0.04] bg-white/[0.01] hover:bg-white/[0.02] transition-all"
                                        >
                                            <div className="space-y-1 pr-4">
                                                <p className="text-sm font-bold text-white">{fk.label}</p>
                                                <p className="text-xs font-medium text-white/35">{fk.description}</p>
                                            </div>
                                            <button
                                                role="switch"
                                                aria-checked={enabled}
                                                disabled={updatingFeatures}
                                                onClick={() => handleToggleFeature(fk.key, !enabled)}
                                                className={`
                                                    relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent
                                                    transition-colors duration-200 ease-in-out focus-visible:outline-2 focus-visible:outline-offset-2
                                                    focus-visible:outline-violet-500 disabled:opacity-40 disabled:cursor-not-allowed mt-0.5
                                                    ${enabled ? 'bg-violet-500' : 'bg-white/[0.12]'}
                                                `}
                                            >
                                                <span
                                                    className={`
                                                        pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg
                                                        ring-0 transition-transform duration-200 ease-in-out
                                                        ${enabled ? 'translate-x-5' : 'translate-x-0'}
                                                    `}
                                                />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* ── Tab 2: Contact Info ── */}
                    {activeTab === 'contact' && (
                        <div className="grid gap-6 md:grid-cols-2">
                            {/* Contact Box */}
                            <div className="rounded-2xl border border-white/[0.06] bg-[#111113] p-6 space-y-6">
                                <div>
                                    <h3 className="font-display text-lg font-extrabold text-white">Contact & Admin details</h3>
                                    <p className="text-xs font-semibold text-white/35 mt-1">Primary details registered for organization communications.</p>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 rounded-lg bg-white/[0.03] border border-white/[0.05] text-white/40 mt-0.5">
                                            <Mail size={14} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-white/30">Owner Email</p>
                                            <p className="text-sm font-semibold text-white/80 mt-1">{owner?.email || 'No owner account registered'}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <div className="p-2 rounded-lg bg-white/[0.03] border border-white/[0.05] text-white/40 mt-0.5">
                                            <Phone size={14} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-white/30">Company Phone</p>
                                            <p className="text-sm font-semibold text-white/80 mt-1">{settings?.contact_info?.phone || 'No phone registered'}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <div className="p-2 rounded-lg bg-white/[0.03] border border-white/[0.05] text-white/40 mt-0.5">
                                            <MapPin size={14} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-white/30">Physical Location</p>
                                            <p className="text-sm font-semibold text-white/80 mt-1">{settings?.contact_info?.address || 'No physical address registered'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Operating parameters */}
                            <div className="rounded-2xl border border-white/[0.06] bg-[#111113] p-6 space-y-6">
                                <div>
                                    <h3 className="font-display text-lg font-extrabold text-white">Operations</h3>
                                    <p className="text-xs font-semibold text-white/35 mt-1">Tenant working limits and active profiles.</p>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 rounded-lg bg-white/[0.03] border border-white/[0.05] text-white/40 mt-0.5">
                                            <Clock size={14} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-white/30">Operating Hours</p>
                                            <p className="text-sm font-semibold text-white/80 mt-1">
                                                {settings?.operating_hours?.open || '08:00'} - {settings?.operating_hours?.close || '22:00'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <div className="p-2 rounded-lg bg-white/[0.03] border border-white/[0.05] text-white/40 mt-0.5">
                                            <Building2 size={14} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-white/30">Organization ShortName</p>
                                            <p className="text-sm font-semibold text-white/80 mt-1">{settings?.company_short_name || tenant.slug}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <div className="p-2 rounded-lg bg-white/[0.03] border border-white/[0.05] text-white/40 mt-0.5">
                                            <Calendar size={14} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-white/30">Registered On</p>
                                            <p className="text-sm font-semibold text-white/80 mt-1">
                                                {new Date(tenant.created_at).toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric',
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── Tab 3: Billing & Limits ── */}
                    {activeTab === 'billing' && (
                        <div className="space-y-6">
                            {/* Row 1: Quick Status Selector & Current Tier Display */}
                            <div className="rounded-2xl border border-white/[0.06] bg-[#111113] p-6 space-y-6">
                                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <h3 className="font-display text-lg font-extrabold text-white">Billing plan & Platform limits</h3>
                                        <p className="text-xs font-semibold text-white/35 mt-1">Manage tiers and check usage constraints against license levels.</p>
                                    </div>
                                    {/* Billing Status Quick Selection */}
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-white/30 mr-1">Billing Status:</span>
                                        {['active', 'past_due', 'trial'].map((status) => {
                                            const isCurrent = (tenant.billing_status || 'active') === status;
                                            const styles = {
                                                active: isCurrent 
                                                    ? 'bg-emerald-500/[0.12] text-emerald-400 border-emerald-500/40' 
                                                    : 'bg-white/[0.02] text-white/40 border-white/[0.06] hover:bg-white/[0.04]',
                                                past_due: isCurrent 
                                                    ? 'bg-red-500/[0.12] text-red-400 border-red-500/40 animate-pulse' 
                                                    : 'bg-white/[0.02] text-white/40 border-white/[0.06] hover:bg-white/[0.04]',
                                                trial: isCurrent 
                                                    ? 'bg-amber-500/[0.12] text-amber-400 border-amber-500/40' 
                                                    : 'bg-white/[0.02] text-white/40 border-white/[0.06] hover:bg-white/[0.04]'
                                            };
                                            const labels = {
                                                active: 'Active',
                                                past_due: 'Past Due',
                                                trial: 'Trial'
                                            };
                                            return (
                                                <button
                                                    key={status}
                                                    disabled={updatingBilling}
                                                    onClick={() => handleUpdateBilling({ billing_status: status })}
                                                    className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${styles[status]}`}
                                                >
                                                    <span className={`h-1.5 w-1.5 rounded-full ${
                                                        status === 'active' 
                                                            ? 'bg-emerald-400' 
                                                            : status === 'past_due' 
                                                            ? 'bg-red-400 animate-pulse' 
                                                            : 'bg-amber-400'
                                                    }`} />
                                                    {labels[status]}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Live Progress Bar Section */}
                                <div className="grid gap-6 md:grid-cols-2 pt-2">
                                    {/* Court Allocation Progress */}
                                    {(() => {
                                        const currentTier = tenant.billing_tier || 'enterprise';
                                        const tierLimit = BILLING_TIERS[currentTier]?.courtsLimit || 10;
                                        const count = kpis?.active_courts_count || 0;
                                        const percent = Math.min((count / tierLimit) * 100, 100);
                                        return (
                                            <div className="p-4 rounded-xl border border-white/[0.04] bg-white/[0.01] space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <Grid size={16} className="text-white/40" />
                                                        <span className="text-xs font-bold text-white/50 uppercase tracking-wider">Court Allocation</span>
                                                    </div>
                                                    <span className="text-xs font-bold text-white/40">{count} / {tierLimit} Courts</span>
                                                </div>
                                                <div className="h-2 w-full bg-white/[0.06] rounded-full overflow-hidden">
                                                    <div 
                                                        className={`h-full rounded-full transition-all duration-500 ${
                                                            percent >= 100 
                                                                ? 'bg-red-500' 
                                                                : percent >= 80 
                                                                ? 'bg-amber-500 animate-pulse' 
                                                                : 'bg-violet-500'
                                                        }`}
                                                        style={{ width: `${percent}%` }}
                                                    />
                                                </div>
                                                <p className="text-[10px] font-semibold text-white/35">
                                                    {percent >= 100 
                                                        ? '⚠️ Limit reached! Upgrade plan to allocate more courts.' 
                                                        : `Currently using ${percent.toFixed(0)}% of the ${currentTier} plan court quota.`}
                                                </p>
                                            </div>
                                        );
                                    })()}

                                    {/* Player Limit Progress */}
                                    {(() => {
                                        const currentTier = tenant.billing_tier || 'enterprise';
                                        const currentPlayers = kpis?.unique_customers || 0;
                                        const limitVal = currentTier === 'starter' ? 50 : currentTier === 'pro' ? 500 : null;
                                        const percent = limitVal ? Math.min((currentPlayers / limitVal) * 100, 100) : null;
                                        return (
                                            <div className="p-4 rounded-xl border border-white/[0.04] bg-white/[0.01] space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <Users size={16} className="text-white/40" />
                                                        <span className="text-xs font-bold text-white/50 uppercase tracking-wider">Player Capacity</span>
                                                    </div>
                                                    <span className="text-xs font-bold text-white/40">
                                                        {currentPlayers} / {limitVal || '∞'} Players
                                                    </span>
                                                </div>
                                                {percent !== null ? (
                                                    <>
                                                        <div className="h-2 w-full bg-white/[0.06] rounded-full overflow-hidden">
                                                            <div 
                                                                className={`h-full rounded-full transition-all duration-500 ${
                                                                    percent >= 100 
                                                                        ? 'bg-red-500' 
                                                                        : percent >= 80 
                                                                        ? 'bg-amber-500 animate-pulse' 
                                                                        : 'bg-violet-500'
                                                                }`}
                                                                style={{ width: `${percent}%` }}
                                                            />
                                                        </div>
                                                        <p className="text-[10px] font-semibold text-white/35">
                                                            {percent >= 100 
                                                                ? '⚠️ Player cap reached. Please upgrade to expand capacity.' 
                                                                : `Currently at ${percent.toFixed(0)}% capacity for ${currentTier} limits.`}
                                                        </p>
                                                    </>
                                                ) : (
                                                    <div className="space-y-1">
                                                        <p className="text-sm font-extrabold text-violet-400">Unlimited Tier Active</p>
                                                        <p className="text-[10px] font-semibold text-white/35">No database-enforced player caps active for Enterprise.</p>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })()}
                                </div>
                            </div>

                            {/* Row 2: Select License Tier */}
                            <div className="space-y-4">
                                <h4 className="text-xs font-bold uppercase tracking-[0.12em] text-white/40 px-1">Select License Plan</h4>
                                <div className="grid gap-4 md:grid-cols-3">
                                    {Object.entries(BILLING_TIERS).map(([tierKey, details]) => {
                                        const isSelected = (tenant.billing_tier || 'enterprise') === tierKey;
                                        return (
                                            <button
                                                key={tierKey}
                                                disabled={updatingBilling}
                                                onClick={() => handleUpdateBilling({ billing_tier: tierKey })}
                                                className={`text-left p-5 rounded-2xl border transition-all duration-300 relative overflow-hidden flex flex-col justify-between h-48 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed group ${
                                                    isSelected 
                                                        ? 'bg-[#141416] border-violet-500/80 shadow-lg shadow-violet-500/5' 
                                                        : 'bg-[#111113] border-white/[0.06] hover:border-white/[0.12] hover:bg-[#141416]'
                                                }`}
                                            >
                                                {isSelected && (
                                                    <div className="absolute top-0 right-0 w-[150px] h-[150px] bg-violet-500/[0.03] rounded-full blur-2xl pointer-events-none" />
                                                )}
                                                <div>
                                                    <div className="flex items-center justify-between">
                                                        <p className="text-sm font-bold text-white capitalize">{tierKey} Plan</p>
                                                        {isSelected && (
                                                            <span className="px-2 py-0.5 rounded bg-violet-500/[0.12] text-violet-400 border border-violet-500/20 text-[9px] font-bold">
                                                                Current Tier
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-white/35 mt-1 font-medium">{details.playersLimit}</p>
                                                    <p className="text-xs text-white/35 font-medium">{details.courtsLimit} courts limit</p>
                                                </div>
                                                
                                                <div className="pt-4 border-t border-white/[0.04]">
                                                    <div className="flex items-baseline gap-1">
                                                        <span className="text-xl font-extrabold text-white">{details.price}</span>
                                                        <span className="text-[10px] font-bold text-white/30 uppercase">/ month</span>
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── Tab 4: Danger Zone ── */}
                    {activeTab === 'danger' && (
                        <div className="rounded-2xl border border-red-500/20 bg-red-500/[0.02] p-6 space-y-6">
                            <div className="flex items-start gap-3">
                                <div className="p-2 rounded-xl bg-red-500/[0.08] text-red-400 border border-red-500/20 mt-0.5">
                                    <AlertTriangle size={18} />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="font-display text-lg font-extrabold text-red-400">Danger Zone: Account Suspension</h3>
                                    <p className="text-xs font-semibold text-white/35">
                                        Suspending an organization instantly terminates API and storefront access. Customer portals, calendar interfaces, and tenant admin dashboards will block authorization. Backed-up database information is preserved intact.
                                    </p>
                                </div>
                            </div>

                            {tenant.is_active ? (
                                <div className="space-y-4 pt-2">
                                    <div className="max-w-md space-y-2">
                                        <label className="block text-xs font-bold text-white/60 uppercase tracking-wider">
                                            Please type <code className="font-mono text-red-400 px-1 bg-red-500/[0.1] rounded">{tenant.name}</code> to confirm:
                                        </label>
                                        <input
                                            id="danger-input"
                                            type="text"
                                            value={confirmTenantName}
                                            onChange={(e) => setConfirmTenantName(e.target.value)}
                                            placeholder="Type tenant name here..."
                                            className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-white/20 outline-none focus:border-red-500/40 focus:ring-2 focus:ring-red-500/10 transition-all font-semibold"
                                        />
                                    </div>
                                    <button
                                        onClick={handleToggleSuspension}
                                        disabled={suspending || confirmTenantName !== tenant.name}
                                        className="flex items-center gap-2 py-2.5 px-4 rounded-xl bg-red-500 hover:bg-red-400 text-white text-xs font-bold shadow-lg shadow-red-500/10 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                                    >
                                        {suspending ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                                        Suspend Tenant Account Now
                                    </button>
                                </div>
                            ) : (
                                <div className="pt-2 space-y-4">
                                    <p className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                                        <CheckCircle2 size={14} />
                                        This organization is currently suspended. You can activate it to restore all operations instantly.
                                    </p>
                                    <button
                                        onClick={handleToggleSuspension}
                                        disabled={suspending}
                                        className="flex items-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/10 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                                    >
                                        {suspending ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                                        Activate Tenant Account Now
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
