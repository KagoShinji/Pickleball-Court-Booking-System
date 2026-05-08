import React from 'react';
import { Config } from '../lib/config';

/**
 * FeatureGate wrapper component to conditionally render features
 * based on environment feature flags.
 * 
 * @param {Object} props
 * @param {string} props.feature - The name of the feature from Config.features (e.g. 'advancedVitals')
 * @param {React.ReactNode} props.children - Component(s) to render if feature is enabled
 * @param {React.ReactNode} [props.fallback=null] - Component(s) to render if feature is disabled
 */
export function FeatureGate({ feature, children, fallback = null }) {
    const isEnabled = Config.features[feature];
    
    if (isEnabled) {
        return <>{children}</>;
    }
    
    return fallback ? <>{fallback}</> : null;
}
