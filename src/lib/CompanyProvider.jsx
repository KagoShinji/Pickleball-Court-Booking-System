import React, { createContext, useContext, useEffect, useState } from 'react';
import { Config as EnvConfig, getCompanyId } from './config';
import { supabase } from './supabaseClient';
import { getTenantSettings } from '../services/settings';
import { mergeSectionContent, mergeSiteImages, mergeThemeConfig } from './cmsDefaults';

// Default feature flags — used as fallback when DB features are unavailable.
// Maps JSONB keys from tenants.features to boolean defaults.
const DEFAULT_FEATURES = {
  company_settings: true,
  analytics: EnvConfig.features.analytics,
  qr_codes: EnvConfig.features.qrCodes,
  time_slots: EnvConfig.features.timeSlots,
};

const defaultCompany = {
  ...EnvConfig.company,
  themeConfig: mergeThemeConfig({}, EnvConfig.theme),
  siteImages: mergeSiteImages(),
  sectionContent: mergeSectionContent(),
  features: DEFAULT_FEATURES,
};

// Create context to provide company data throughout the app
const CompanyContext = createContext({
  company: defaultCompany,
  loading: true,
  refresh: () => {}
});

// eslint-disable-next-line react-refresh/only-export-components
export const useCompany = () => useContext(CompanyContext);

export const resolveImageValue = (val) => {
  if (!val) return val;
  if (typeof val === 'string') {
    if (val.startsWith('/storage/v1/object/public/')) {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
      const base = supabaseUrl.endsWith('/') ? supabaseUrl.slice(0, -1) : supabaseUrl;
      return `${base}${val}`;
    }
    return val;
  }
  if (Array.isArray(val)) {
    return val.map(resolveImageValue);
  }
  if (typeof val === 'object') {
    const resolved = {};
    for (const key in val) {
      resolved[key] = resolveImageValue(val[key]);
    }
    return resolved;
  }
  return val;
};

export const CompanyProvider = ({ children }) => {
  const [company, setCompany] = useState(defaultCompany);
  const [loading, setLoading] = useState(true);

  const fetchCompany = async () => {
    try {
      setLoading(true);
      // Fetch from tenant_settings table — scoped to this tenant via getCompanyId()
      // (company_id filtering is handled inside getTenantSettings via settings.js)
      const data = await getTenantSettings();

      // Fetch feature flags from the tenants table (source of truth for feature gating)
      let tenantFeatures = DEFAULT_FEATURES;
      try {
        const companyId = getCompanyId();
        if (companyId) {
          const { data: tenantRow } = await supabase
            .from('tenants')
            .select('features')
            .eq('id', companyId)
            .maybeSingle();
          if (tenantRow?.features) {
            tenantFeatures = { ...DEFAULT_FEATURES, ...tenantRow.features };
          }
        }
      } catch (featErr) {
        console.warn('Could not fetch tenant features, using defaults:', featErr);
      }

      if (data) {
        const themeConfig = mergeThemeConfig(data.theme_config, EnvConfig.theme);
        const siteImages = mergeSiteImages(data.site_images);
        const sectionContent = mergeSectionContent(data.section_content);

        // Map database fields to EnvConfig structure
        const mappedCompany = {
          ...defaultCompany,
          name: data.company_name || EnvConfig.company.name,
          shortName: data.company_short_name || EnvConfig.company.shortName,
          initials: data.company_initials || data.company_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || EnvConfig.company.initials,
          logoUrl: resolveImageValue(data.logo_url || siteImages.logoUrl || EnvConfig.company.logoUrl),
          heroBgUrl: resolveImageValue(data.hero_bg_url || siteImages.heroBackground || '/images/court1.jpg'),
          paymentQrUrl: resolveImageValue(data.payment_qr_url || ''),
          email: data.contact_info?.email || EnvConfig.company.email,
          phone: data.contact_info?.phone || EnvConfig.company.phone,
          location: data.contact_info?.address || EnvConfig.company.location,
          mapQuery: data.contact_info?.mapQuery || EnvConfig.company.mapQuery,
          socialFacebook: data.contact_info?.facebook || EnvConfig.company.socialFacebook,
          socialInstagram: data.contact_info?.instagram || EnvConfig.company.socialInstagram,
          parkingEnabled: data.parking_enabled ?? true,
          parkingIsInside: data.parking_is_inside ?? false,
          parkingMapLink: data.parking_map_link || '',
          amenities: data.amenities || EnvConfig.offers.amenities,
          heroBadge: data.hero_badge || `New courts available in ${data.contact_info?.address || EnvConfig.company.location}`,
          heroTitle: data.hero_title || `Book your next ${data.company_short_name || EnvConfig.company.shortName}`,
          heroSubtitle: data.hero_subtitle || `Experience the best pickleball courts in ${data.contact_info?.address || EnvConfig.company.location}. Premium surfaces, night lighting, and a vibrant community waiting for you.`,
          heroStatPlayers: data.hero_stat_players || '50+ Active Players',
          heroStatDays: data.hero_stat_days || 'Open 7 Days a Week',
          operatingHours: data.operating_hours ? {
            open: data.operating_hours.open || '08:00',
            close: data.operating_hours.close || '22:00',
            openDays: data.operating_hours.openDays || [0, 1, 2, 3, 4, 5, 6],
          } : { open: '08:00', close: '22:00', openDays: [0, 1, 2, 3, 4, 5, 6] },
          themeConfig,
          siteImages: resolveImageValue({
            ...siteImages,
            logoUrl: data.logo_url || siteImages.logoUrl,
            heroBackground: data.hero_bg_url || siteImages.heroBackground,
          }),
          sectionContent,
          features: tenantFeatures,
        };
        setCompany(mappedCompany);
      } else {
        // No tenant_settings row yet, but still apply features
        setCompany((prev) => ({ ...prev, features: tenantFeatures }));
      }
    } catch (err) {
      console.error('Error fetching company config from database, falling back to env:', err);
      // Fallback is already set in initial state
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // In production/deployment fetch from DB; during development you can toggle this
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchCompany();
  }, []);

  const refresh = async () => {
    await fetchCompany();
  };

  return (
    <CompanyContext.Provider value={{ company, loading, refresh }}>
      {children}
    </CompanyContext.Provider>
  );
};

export function isHourWithinOperatingHours(hour, operatingHours) {
  const openTime = operatingHours?.open || '08:00';
  const closeTime = operatingHours?.close || '22:00';
  const openHour = parseInt(openTime.split(':')[0], 10);
  const closeHour = parseInt(closeTime.split(':')[0], 10);

  if (openHour === closeHour) {
    return true; // Assume all 24 hours if open and close match exactly
  }
  if (openHour < closeHour) {
    return hour >= openHour && hour < closeHour;
  } else {
    // Wrapping range (e.g. 16:00 to 02:00 next day)
    return hour >= openHour || hour < closeHour;
  }
}

