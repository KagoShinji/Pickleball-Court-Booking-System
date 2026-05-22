import {
    Activity,
    ArrowDownRight,
    ArrowUpRight,
    Building2,
    Calendar,
    DollarSign,
    Loader2,
    RefreshCw,
    Search,
    TrendingUp,
    Users,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';

// ─── Feature key definitions ────────────────────────────────────────────────
const FEATURE_KEYS = [
    { key: 'company_settings', label: 'Company Settings' },
    { key: 'analytics', label: 'Analytics' },
    { key: 'qr_codes', label: 'QR Codes' },
    { key: 'time_slots', label: 'Time Slots' },
];

const DEFAULT_FEATURES = {
    company_settings: true,
    analytics: false,
    qr_codes: true,
    time_slots: true,
};

// ─── KPI Card Component ─────────────────────────────────────────────────────
function KpiCard({ title, value, subtitle, trend, icon: Icon, accentClass }) {
    const trendIsPositive = trend > 0;
    const trendIsZero = trend === 0 || trend === null || trend === undefined;
    const TrendIcon = trendIsPositive ? ArrowUpRight : ArrowDownRight;

    return (
        <div className="group relative rounded-2xl border border-white/[0.06] bg-[#111113] p-5 transition-all duration-300 hover:border-white/[0.1] hover:bg-[#141416]">
            {/* Subtle gradient glow on hover */}
            <div className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${accentClass}`} />

            <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-white/[0.04] border border-white/[0.06]">
                            <Icon size={16} className="text-white/50" />
                        </div>
                        <span className="text-xs font-bold uppercase tracking-[0.14em] text-white/40">{title}</span>
                    </div>

                    {!trendIsZero && (
                        <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold ${
                            trendIsPositive
                                ? 'bg-emerald-500/[0.12] text-emerald-400'
                                : 'bg-red-500/[0.12] text-red-400'
                        }`}>
                            <TrendIcon size={12} />
                            {trendIsPositive ? '+' : ''}{trend}%
                        </div>
                    )}
                </div>

                <p className="font-display text-3xl font-extrabold text-white tracking-tight">{value}</p>
                {subtitle && (
                    <p className="mt-1.5 text-xs font-semibold text-white/35">{subtitle}</p>
                )}
            </div>
        </div>
    );
}

// ─── Toggle Switch Component ─────────────────────────────────────────────────
function ToggleSwitch({ enabled, onChange, disabled }) {
    return (
        <button
            role="switch"
            aria-checked={enabled}
            disabled={disabled}
            onClick={() => onChange(!enabled)}
            className={`
                relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent
                transition-colors duration-200 ease-in-out focus-visible:outline-2 focus-visible:outline-offset-2
                focus-visible:outline-violet-500 disabled:opacity-40 disabled:cursor-not-allowed
                ${enabled ? 'bg-violet-500' : 'bg-white/[0.12]'}
            `}
        >
            <span
                aria-hidden="true"
                className={`
                    pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg
                    ring-0 transition-transform duration-200 ease-in-out
                    ${enabled ? 'translate-x-5' : 'translate-x-0'}
                `}
            />
        </button>
    );
}

// ─── Tenant Row Component ────────────────────────────────────────────────────
function TenantRow({ tenant, onToggleFeature, updatingTenantId }) {
    const features = { ...DEFAULT_FEATURES, ...(tenant.features || {}) };
    const isUpdating = updatingTenantId === tenant.id;

    return (
        <tr className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors duration-150">
            <td className="py-4 px-5">
                <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 border border-white/[0.06] flex items-center justify-center">
                        <Building2 size={14} className="text-violet-400" />
                    </div>
                    <div>
                        <Link to={`/odc/tenant/${tenant.id}`} className="text-sm font-bold text-white hover:text-violet-400 transition-colors">
                            {tenant.name}
                        </Link>
                        <p className="text-xs font-medium text-white/35 mt-0.5 flex items-center gap-1.5">
                            <span>ID: {tenant.id}</span>
                            <span className="text-white/20">•</span>
                            <span className="capitalize text-violet-400 font-semibold">{tenant.billing_tier || 'enterprise'}</span>
                        </p>
                    </div>
                </div>
            </td>
            <td className="py-4 px-5">
                <span className="px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.06] text-xs font-mono font-semibold text-white/50">
                    {tenant.slug}
                </span>
            </td>
            <td className="py-4 px-5">
                {!tenant.is_active ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-zinc-500/[0.12] text-zinc-400 border border-zinc-500/20">
                        <span className="h-1.5 w-1.5 rounded-full bg-zinc-400" />
                        Suspended
                    </span>
                ) : tenant.billing_status === 'past_due' ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-red-500/[0.12] text-red-400 border border-red-500/20">
                        <span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-pulse" />
                        Past Due
                    </span>
                ) : tenant.billing_status === 'trial' ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500/[0.12] text-amber-400 border border-amber-500/20">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                        Trial
                    </span>
                ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/[0.12] text-emerald-400 border border-emerald-500/20">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        Active
                    </span>
                )}
            </td>
            {FEATURE_KEYS.map((fk) => (
                <td key={fk.key} className="py-4 px-5 text-center">
                    <ToggleSwitch
                        enabled={features[fk.key]}
                        disabled={isUpdating}
                        onChange={(newVal) => onToggleFeature(tenant, fk.key, newVal)}
                    />
                </td>
            ))}
        </tr>
    );
}

// ─── Main Dashboard ──────────────────────────────────────────────────────────
export function SuperAdminDashboard() {
    const [kpis, setKpis] = useState(null);
    const [kpiLoading, setKpiLoading] = useState(true);
    const [kpiError, setKpiError] = useState('');

    const [tenants, setTenants] = useState([]);
    const [tenantsLoading, setTenantsLoading] = useState(true);
    const [updatingTenantId, setUpdatingTenantId] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    // ── Fetch KPIs ──
    const fetchKpis = useCallback(async () => {
        try {
            setKpiLoading(true);
            setKpiError('');
            const { data, error } = await supabase.rpc('get_platform_kpis');
            if (error) throw error;
            if (data?.error) throw new Error(data.error);
            setKpis(data);
        } catch (err) {
            console.error('KPI fetch failed:', err);
            setKpiError(err.message || 'Failed to load KPIs');
        } finally {
            setKpiLoading(false);
        }
    }, []);

    // ── Fetch Tenants ──
    const fetchTenants = useCallback(async () => {
        try {
            setTenantsLoading(true);
            const { data, error } = await supabase
                .from('tenants')
                .select('*')
                .order('created_at', { ascending: true });
            if (error) throw error;
            setTenants(data || []);
        } catch (err) {
            console.error('Tenants fetch failed:', err);
        } finally {
            setTenantsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchKpis();
        fetchTenants();
    }, [fetchKpis, fetchTenants]);

    // ── Toggle Feature ──
    const handleToggleFeature = async (tenant, featureKey, newValue) => {
        const previousFeatures = { ...DEFAULT_FEATURES, ...(tenant.features || {}) };
        const updatedFeatures = { ...previousFeatures, [featureKey]: newValue };

        // Optimistic update
        setTenants((prev) =>
            prev.map((t) =>
                t.id === tenant.id ? { ...t, features: updatedFeatures } : t
            )
        );
        setUpdatingTenantId(tenant.id);

        try {
            const { error } = await supabase
                .from('tenants')
                .update({ features: updatedFeatures })
                .eq('id', tenant.id);

            if (error) throw error;
        } catch (err) {
            console.error('Feature toggle failed:', err);
            // Rollback on error
            setTenants((prev) =>
                prev.map((t) =>
                    t.id === tenant.id ? { ...t, features: previousFeatures } : t
                )
            );
        } finally {
            setUpdatingTenantId(null);
        }
    };

    // ── Filter tenants by search ──
    const filteredTenants = tenants.filter((t) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
            t.name.toLowerCase().includes(q) ||
            t.slug.toLowerCase().includes(q) ||
            t.id.toLowerCase().includes(q)
        );
    });

    // ── Format helpers ──
    const formatNumber = (n) => {
        if (n === null || n === undefined) return '—';
        if (typeof n === 'number' && n >= 1000) {
            return n.toLocaleString('en-US');
        }
        return String(n);
    };

    const formatCurrency = (n) => {
        if (n === null || n === undefined) return '—';
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(n);
    };

    const formatPercent = (n) => {
        if (n === null || n === undefined) return '—';
        return `${n}%`;
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            {/* ── Page Header ── */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-violet-400/70 mb-2">
                        Platform Overview
                    </p>
                    <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                        Super Admin Dashboard
                    </h1>
                    <p className="mt-2 text-sm font-medium text-white/40 max-w-xl">
                        Cross-tenant KPIs and feature management for the entire platform.
                    </p>
                </div>
                <button
                    onClick={() => { fetchKpis(); fetchTenants(); }}
                    className="self-start sm:self-auto flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.06] border border-white/[0.08] text-sm font-semibold text-white/60 hover:text-white hover:bg-white/[0.1] transition-all duration-200 cursor-pointer"
                >
                    <RefreshCw size={14} />
                    Refresh
                </button>
            </div>

            {/* ── KPI Ribbon ── */}
            {kpiError && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/[0.08] px-4 py-3 text-sm font-semibold text-red-400">
                    {kpiError}
                </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {kpiLoading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="rounded-2xl border border-white/[0.06] bg-[#111113] p-5 animate-pulse">
                            <div className="h-4 w-24 bg-white/[0.06] rounded mb-4" />
                            <div className="h-8 w-20 bg-white/[0.06] rounded" />
                        </div>
                    ))
                ) : kpis ? (
                    <>
                        <KpiCard
                            title="Active Tenants"
                            value={formatNumber(kpis.total_active_tenants?.value)}
                            subtitle="Registered organizations"
                            trend={kpis.total_active_tenants?.trend}
                            icon={Users}
                            accentClass="bg-gradient-to-br from-violet-500/[0.04] to-transparent"
                        />
                        <KpiCard
                            title="Utilization Rate"
                            value={formatPercent(kpis.platform_utilization_rate?.value)}
                            subtitle={`${formatNumber(kpis.platform_utilization_rate?.booked_hours)} / ${formatNumber(kpis.platform_utilization_rate?.available_hours)} hrs`}
                            trend={null}
                            icon={Activity}
                            accentClass="bg-gradient-to-br from-cyan-500/[0.04] to-transparent"
                        />
                        <KpiCard
                            title="Monthly Bookings"
                            value={formatNumber(kpis.monthly_booking_volume?.value)}
                            subtitle={`vs ${formatNumber(kpis.monthly_booking_volume?.previous)} last month`}
                            trend={kpis.monthly_booking_volume?.trend}
                            icon={Calendar}
                            accentClass="bg-gradient-to-br from-emerald-500/[0.04] to-transparent"
                        />
                        <KpiCard
                            title="Monthly Revenue"
                            value={formatCurrency(kpis.monthly_revenue?.value)}
                            subtitle={`vs ${formatCurrency(kpis.monthly_revenue?.previous)} last month`}
                            trend={kpis.monthly_revenue?.trend}
                            icon={DollarSign}
                            accentClass="bg-gradient-to-br from-amber-500/[0.04] to-transparent"
                        />
                    </>
                ) : null}
            </div>

            {/* ── Tenant Matrix ── */}
            <div className="rounded-2xl border border-white/[0.06] bg-[#111113] overflow-hidden">
                {/* Header */}
                <div className="px-5 py-4 border-b border-white/[0.06] flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="font-display text-lg font-extrabold text-white">Tenant Management</h2>
                        <p className="text-xs font-semibold text-white/35 mt-0.5">
                            {tenants.length} tenant{tenants.length !== 1 ? 's' : ''} registered
                        </p>
                    </div>
                    <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                        <input
                            type="text"
                            placeholder="Search tenants..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full sm:w-64 pl-9 pr-4 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-white/25 outline-none focus:border-violet-500/40 focus:ring-2 focus:ring-violet-500/10 transition-all"
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    {tenantsLoading ? (
                        <div className="flex items-center justify-center py-16">
                            <Loader2 size={24} className="text-white/30 animate-spin" />
                        </div>
                    ) : (
                        <table className="w-full min-w-[800px]">
                            <thead>
                                <tr className="border-b border-white/[0.06]">
                                    <th className="text-left py-3 px-5 text-[10px] font-bold uppercase tracking-[0.16em] text-white/30">
                                        Tenant
                                    </th>
                                    <th className="text-left py-3 px-5 text-[10px] font-bold uppercase tracking-[0.16em] text-white/30">
                                        Slug
                                    </th>
                                    <th className="text-left py-3 px-5 text-[10px] font-bold uppercase tracking-[0.16em] text-white/30">
                                        Status
                                    </th>
                                    {FEATURE_KEYS.map((fk) => (
                                        <th key={fk.key} className="text-center py-3 px-5 text-[10px] font-bold uppercase tracking-[0.16em] text-white/30">
                                            {fk.label}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredTenants.length === 0 ? (
                                    <tr>
                                        <td colSpan={3 + FEATURE_KEYS.length} className="py-16 text-center text-sm text-white/30">
                                            {searchQuery ? 'No tenants match your search.' : 'No tenants found.'}
                                        </td>
                                    </tr>
                                ) : (
                                    filteredTenants.map((tenant) => (
                                        <TenantRow
                                            key={tenant.id}
                                            tenant={tenant}
                                            onToggleFeature={handleToggleFeature}
                                            updatingTenantId={updatingTenantId}
                                        />
                                    ))
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}
