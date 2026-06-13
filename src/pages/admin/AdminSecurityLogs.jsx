import { useState, useEffect, useCallback } from 'react';
import { Shield, AlertTriangle, Eye, X, Trash2, RefreshCw, ChevronDown, ChevronUp, Monitor, Hash, FileText, Image as ImageIcon, Clock, CheckCircle, ThumbsUp } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { format, formatDistanceToNow } from 'date-fns';
import { AdminActionModal } from '../../components/admin/AdminActionModal';
import { FalsePositiveBookingModal } from '../../components/admin/FalsePositiveBookingModal';
import { getCompanyId } from '../../lib/config';

function shortenUA(ua = '') {
    const mobile = ua.match(/\(([^)]+)\)/)?.[1] || '';
    const browser = ua.match(/(Chrome|Firefox|Safari|Edge|OPR)\/[\d.]+/)?.[0] || '';
    return [mobile.split(';')[0], browser].filter(Boolean).join(' · ') || ua.slice(0, 60);
}

function ImageLightbox({ url, onClose }) {
    useEffect(() => {
        const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [onClose]);

    return (
        <div
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={onClose}
        >
            <div className="relative max-w-3xl w-full max-h-[90vh] flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
                <button onClick={onClose} className="absolute -top-10 right-0 text-white/70 hover:text-white transition-colors">
                    <X size={28} />
                </button>
                <img src={url} alt="Spoof receipt evidence" className="max-h-[85vh] w-auto rounded-xl shadow-2xl border border-white/10 object-contain" />
                <p className="mt-3 text-xs text-white/40 font-mono break-all text-center">{url}</p>
            </div>
        </div>
    );
}

function OcrTextBlock({ text }) {
    const [expanded, setExpanded] = useState(false);
    const preview = text?.slice(0, 120) || '';
    const hasMore = (text?.length || 0) > 120;
    return (
        <div className="mt-1 font-mono text-[11px] text-gray-500 bg-gray-50 rounded-lg p-2 border border-gray-200">
            <p className="whitespace-pre-wrap break-all leading-relaxed">{expanded ? text : preview}{hasMore && !expanded ? '…' : ''}</p>
            {hasMore && (
                <button onClick={() => setExpanded(!expanded)} className="mt-1 flex items-center gap-1 text-gray-400 hover:text-gray-600 transition-colors text-[10px]">
                    {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    {expanded ? 'Collapse' : 'Expand full OCR output'}
                </button>
            )}
        </div>
    );
}

function IncidentCard({ incident, onDismiss, onFalsePositive, onViewImage }) {
    const ts = incident.created_at ? new Date(incident.created_at) : null;
    const isFP = incident.is_false_positive;

    return (
        <div className={`bg-white border rounded-2xl overflow-hidden shadow-sm transition-colors group ${isFP ? 'border-green-200 bg-green-50/30' : 'border-gray-100 hover:border-gray-200'}`}>
            {/* Card Header */}
            <div className={`flex items-center justify-between px-5 py-3 border-b ${isFP ? 'bg-green-50 border-green-100' : 'bg-gray-50 border-gray-100'}`}>
                <div className="flex items-center gap-2 flex-wrap">
                    {isFP ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-100 border border-green-300 text-green-700 text-[11px] font-bold uppercase tracking-wider">
                            <CheckCircle size={11} /> False Positive
                        </span>
                    ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 border border-red-200 text-red-600 text-[11px] font-bold uppercase tracking-wider">
                            <AlertTriangle size={11} /> Fraud Intercepted
                        </span>
                    )}
                    {ts && (
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                            <Clock size={11} /> {formatDistanceToNow(ts, { addSuffix: true })}
                            <span className="hidden sm:inline text-gray-300 ml-1">— {format(ts, 'MMM d, yyyy · HH:mm')}</span>
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2 shrink-0">
                    {!isFP && (
                        <button
                            onClick={() => onFalsePositive(incident)}
                            title="Mark as False Positive"
                            className="flex items-center gap-1 text-xs font-medium text-gray-400 hover:text-green-600 transition-colors px-2 py-1 rounded-lg hover:bg-green-50"
                        >
                            <ThumbsUp size={13} /> False Positive
                        </button>
                    )}
                    <button onClick={() => onDismiss(incident.id)} title="Delete / Archive" className="text-gray-300 hover:text-red-500 transition-colors p-1 rounded-lg hover:bg-red-50">
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>

            {/* Card Body */}
            <div className="p-5 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                <div className="space-y-3">
                    <div>
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 flex items-center gap-1 mb-1"><Hash size={10} /> Attempted Reference</p>
                        <p className="font-mono text-sm text-amber-600 font-bold">{incident.attempted_reference_no || '—'}</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 flex items-center gap-1 mb-1"><FileText size={10} /> Raw OCR Output</p>
                        {incident.raw_ocr_output
                            ? <OcrTextBlock text={incident.raw_ocr_output} />
                            : <p className="text-xs text-gray-400 italic">No text extracted</p>
                        }
                    </div>
                </div>
                <div className="space-y-3">
                    <div>
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 flex items-center gap-1 mb-1"><Monitor size={10} /> Device Fingerprint</p>
                        <p className="text-xs text-gray-700 leading-relaxed break-all">{shortenUA(incident.device_fingerprint)}</p>
                        <p className="mt-1 text-[10px] text-gray-400 font-mono break-all">{incident.device_fingerprint?.slice(0, 80)}{(incident.device_fingerprint?.length || 0) > 80 ? '…' : ''}</p>
                    </div>
                    {incident.is_false_positive && incident.reviewed_at && (
                        <div>
                            <p className="text-[10px] font-semibold uppercase tracking-widest text-green-500 flex items-center gap-1 mb-1"><CheckCircle size={10} /> Reviewed</p>
                            <p className="text-xs text-green-600">{format(new Date(incident.reviewed_at), 'MMM d, yyyy · HH:mm')}</p>
                        </div>
                    )}
                </div>
                <div className="space-y-2">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 flex items-center gap-1"><ImageIcon size={10} /> Evidence Image</p>
                    {incident.spoof_image_url ? (
                        <button onClick={() => onViewImage(incident.signed_image_url || incident.spoof_image_url)} className="relative w-full h-32 rounded-xl overflow-hidden border border-gray-200 hover:border-brand-green transition-colors group/img bg-gray-50" title="Click to enlarge">
                            <img src={incident.signed_image_url || incident.spoof_image_url} alt="Spoof receipt thumbnail" className="w-full h-full object-cover opacity-80 group-hover/img:opacity-100 transition-opacity" />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover/img:opacity-100 transition-opacity">
                                <Eye size={22} className="text-white drop-shadow" />
                            </div>
                        </button>
                    ) : (
                        <div className="w-full h-32 rounded-xl border border-dashed border-gray-200 flex flex-col items-center justify-center gap-2 bg-gray-50">
                            <ImageIcon size={20} className="text-gray-300" />
                            <p className="text-[11px] text-gray-400">No image captured</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export function AdminSecurityLogs() {
    const [incidents, setIncidents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [lightboxUrl, setLightboxUrl] = useState(null);
    const [filter, setFilter] = useState('all'); // 'all' | 'threats' | 'false_positives'
    const [selectedIncidentForBooking, setSelectedIncidentForBooking] = useState(null);

    const [actionModal, setActionModal] = useState({
        isOpen: false,
        title: '',
        description: '',
        action: null,
        variant: 'primary',
        confirmLabel: 'Confirm',
        successTitle: 'Done',
        successDescription: 'Action completed.'
    });

    const fetchIncidents = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('security_incident_logs')
            .select('*')
            .eq('tenant_id', getCompanyId())
            .order('created_at', { ascending: false })
            .limit(100);
        if (!error && data) {
            const withSigned = await Promise.all(data.map(async (incident) => {
                if (incident.spoof_image_url) {
                    try {
                        const pathMarker = '/security_intercepts/';
                        const idx = incident.spoof_image_url.indexOf(pathMarker);
                        if (idx !== -1) {
                            const rawPath = incident.spoof_image_url.substring(idx + pathMarker.length);
                            const path = decodeURIComponent(rawPath.split('?')[0]);
                            const { data: signedData, error: signedError } = await supabase.storage
                                .from('security_intercepts')
                                .createSignedUrl(path, 3600);
                            if (!signedError && signedData?.signedUrl) {
                                return { ...incident, signed_image_url: signedData.signedUrl };
                            }
                        }
                    } catch (e) {
                        console.error('Failed to create signed URL:', e);
                    }
                }
                return incident;
            }));
            setIncidents(withSigned);
        } else {
            setIncidents([]);
        }
        setLoading(false);
    }, []);

    useEffect(() => { fetchIncidents(); }, [fetchIncidents]);

    const handleDismiss = (id) => {
        setActionModal({
            isOpen: true,
            title: 'Delete Incident Log',
            description: 'Are you sure you want to permanently delete this security log entry? This cannot be undone.',
            variant: 'danger',
            confirmLabel: 'Delete',
            successTitle: 'Log Deleted',
            successDescription: 'The security incident log has been removed.',
            action: async () => {
                const { error } = await supabase
                    .from('security_incident_logs')
                    .delete()
                    .eq('id', id)
                    .eq('tenant_id', getCompanyId());
                if (error) throw new Error(error.message);
                setIncidents((prev) => prev.filter((i) => i.id !== id));
            }
        });
    };

    const handleFalsePositive = (incident) => {
        setSelectedIncidentForBooking(incident);
    };

    const displayed = incidents.filter((i) => {
        if (filter === 'threats') return !i.is_false_positive;
        if (filter === 'false_positives') return i.is_false_positive;
        return true;
    });

    const totalThreats = incidents.filter(i => !i.is_false_positive).length;
    const totalFP = incidents.filter(i => i.is_false_positive).length;
    const withImage = incidents.filter(i => i.spoof_image_url).length;

    return (
        <div className="space-y-6 w-full max-w-full overflow-x-hidden">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold font-display text-brand-green-dark">Security & Fraud Logs</h1>
                    <p className="text-gray-500">Review intercepted booking fraud attempts and tag false positives.</p>
                </div>
                <button
                    onClick={fetchIncidents}
                    disabled={loading}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-brand-green-dark bg-brand-green/10 hover:bg-brand-green/20 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                    <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
                    Refresh
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                    { label: 'Total Incidents', value: incidents.length, color: 'text-gray-800' },
                    { label: 'Active Threats', value: totalThreats, color: 'text-red-600' },
                    { label: 'False Positives', value: totalFP, color: 'text-green-600' },
                    { label: 'With Image Evidence', value: withImage, color: 'text-amber-600' },
                ].map(({ label, value, color }) => (
                    <div key={label} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                        <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold">{label}</p>
                        <p className={`text-3xl font-bold mt-1 ${color}`}>{loading ? '…' : value}</p>
                    </div>
                ))}
            </div>

            {/* Filter tabs */}
            <div className="flex bg-gray-100 p-1 rounded-xl w-fit">
                {[
                    { label: 'All Logs', value: 'all' },
                    { label: 'Threats Only', value: 'threats' },
                    { label: 'False Positives', value: 'false_positives' },
                ].map(({ label, value }) => (
                    <button
                        key={value}
                        onClick={() => setFilter(value)}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                            filter === value
                                ? value === 'threats'
                                    ? 'bg-red-50 text-red-700 shadow-sm'
                                    : value === 'false_positives'
                                    ? 'bg-green-50 text-green-700 shadow-sm'
                                    : 'bg-white text-brand-green-dark shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {/* Incident list */}
            {loading ? (
                <div className="flex items-center justify-center py-24 gap-3 text-gray-400">
                    <RefreshCw size={20} className="animate-spin" /><span className="text-sm">Loading incidents…</span>
                </div>
            ) : displayed.length === 0 ? (
                <div className="bg-white border border-gray-100 rounded-2xl shadow-sm flex flex-col items-center justify-center py-24 gap-3 text-gray-400">
                    <Shield size={40} className="text-gray-200" />
                    <p className="text-lg font-semibold text-gray-500">
                        {filter === 'all' ? 'No incidents recorded' : 'No matching incidents'}
                    </p>
                    <p className="text-sm">
                        {filter === 'all' ? 'The system is clean — no fraud attempts detected yet.' : 'Try changing your filter.'}
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {displayed.map((incident) => (
                        <IncidentCard
                            key={incident.id}
                            incident={incident}
                            onDismiss={handleDismiss}
                            onFalsePositive={handleFalsePositive}
                            onViewImage={setLightboxUrl}
                        />
                    ))}
                </div>
            )}

            {lightboxUrl && <ImageLightbox url={lightboxUrl} onClose={() => setLightboxUrl(null)} />}

            <AdminActionModal
                isOpen={actionModal.isOpen}
                onClose={() => setActionModal(prev => ({ ...prev, isOpen: false }))}
                title={actionModal.title}
                description={actionModal.description}
                action={actionModal.action}
                variant={actionModal.variant}
                confirmLabel={actionModal.confirmLabel}
                successTitle={actionModal.successTitle}
                successDescription={actionModal.successDescription}
            />

            <FalsePositiveBookingModal
                isOpen={!!selectedIncidentForBooking}
                onClose={() => setSelectedIncidentForBooking(null)}
                incident={selectedIncidentForBooking}
                onSuccess={fetchIncidents}
            />
        </div>
    );
}
