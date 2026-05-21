import React from 'react';
import { Config } from '../lib/config';
import { useCompany } from '../lib/CompanyProvider';
import { ShieldOff } from 'lucide-react';

/**
 * Mapping from legacy camelCase feature names (used in route definitions)
 * to the snake_case JSONB keys stored in tenants.features.
 */
const FEATURE_KEY_MAP = {
    analytics: 'analytics',
    qrCodes: 'qr_codes',
    timeSlots: 'time_slots',
    companySettings: 'company_settings',
    // Direct JSONB keys also work as-is
    qr_codes: 'qr_codes',
    time_slots: 'time_slots',
    company_settings: 'company_settings',
};

/**
 * FeatureGate wrapper component to conditionally render features
 * based on database-driven feature flags (tenants.features JSONB).
 * Falls back to environment variable flags if DB data is unavailable.
 *
 * @param {Object} props
 * @param {string} props.feature - The feature key (e.g. 'analytics', 'qrCodes', 'companySettings')
 * @param {React.ReactNode} props.children - Component(s) to render if feature is enabled
 * @param {React.ReactNode} [props.fallback] - Optional custom fallback. If not provided, shows a default "Feature Not Enabled" UI.
 * @param {boolean} [props.silent=false] - If true, renders nothing when disabled (no fallback UI). Useful for sidebar items.
 */
export function FeatureGate({ feature, children, fallback, silent = false }) {
    const { company } = useCompany();

    // Resolve the JSONB key from the feature name
    const dbKey = FEATURE_KEY_MAP[feature] || feature;

    // Primary source: database-driven features from tenants table
    // Fallback: environment variable flags from Config.features
    const isEnabled = company.features?.[dbKey] ?? Config.features[feature] ?? false;

    if (isEnabled) {
        return <>{children}</>;
    }

    // If silent mode, render nothing (used for sidebar nav items)
    if (silent) return null;

    // If a custom fallback is provided, use it
    if (fallback) return <>{fallback}</>;

    // Default "Feature Not Enabled" UI for route-level gating
    return (
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center px-4">
            <div className="p-4 rounded-2xl bg-gray-100 mb-4">
                <ShieldOff size={32} className="text-gray-400" />
            </div>
            <h2 className="text-xl font-display font-bold text-gray-800">Feature Not Available</h2>
            <p className="mt-2 text-sm text-gray-500 max-w-md">
                This feature is not enabled for your organization.
                Contact your platform administrator to request access.
            </p>
        </div>
    );
}
