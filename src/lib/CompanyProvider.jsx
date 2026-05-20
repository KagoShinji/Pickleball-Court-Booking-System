import React, { createContext, useContext, useEffect, useState } from 'react';
import { Config as EnvConfig } from './config';
import { getTenantSettings } from '../services/settings';

// Create context to provide company data throughout the app
const CompanyContext = createContext({
  company: EnvConfig.company,
  refresh: () => {}
});

// eslint-disable-next-line react-refresh/only-export-components
export const useCompany = () => useContext(CompanyContext);

export const CompanyProvider = ({ children }) => {
  const [company, setCompany] = useState(EnvConfig.company);

  const fetchCompany = async () => {
    try {
      // Fetch from tenant_settings table
      const data = await getTenantSettings();
      if (data) {
        // Map database fields to EnvConfig structure
        const mappedCompany = {
          ...EnvConfig.company,
          name: data.company_name || EnvConfig.company.name,
          shortName: data.company_short_name || EnvConfig.company.shortName,
          initials: data.company_initials || data.company_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || EnvConfig.company.initials,
          logoUrl: data.logo_url || EnvConfig.company.logoUrl,
          email: data.contact_info?.email || EnvConfig.company.email,
          phone: data.contact_info?.phone || EnvConfig.company.phone,
          location: data.contact_info?.address || EnvConfig.company.location,
          mapQuery: data.contact_info?.mapQuery || EnvConfig.company.mapQuery,
          socialFacebook: data.contact_info?.facebook || EnvConfig.company.socialFacebook,
          socialInstagram: data.contact_info?.instagram || EnvConfig.company.socialInstagram,
          parkingEnabled: data.parking_enabled ?? true,
          amenities: data.amenities || EnvConfig.offers.amenities,
          heroBadge: data.hero_badge || `New courts available in ${data.contact_info?.address || EnvConfig.company.location}`,
          heroTitle: data.hero_title || `Book your next ${data.company_short_name || EnvConfig.company.shortName}`,
          heroSubtitle: data.hero_subtitle || `Experience the best pickleball courts in ${data.contact_info?.address || EnvConfig.company.location}. Premium surfaces, night lighting, and a vibrant community waiting for you.`,
          heroStatPlayers: data.hero_stat_players || '50+ Active Players',
          heroStatDays: data.hero_stat_days || 'Open 7 Days a Week',
          operatingHours: data.operating_hours || { open: '08:00', close: '22:00' }
        };
        setCompany(mappedCompany);
      }
    } catch (err) {
      console.error('Error fetching company config from database, falling back to env:', err);
      // Fallback is already set in initial state
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
    <CompanyContext.Provider value={{ company, refresh }}>
      {children}
    </CompanyContext.Provider>
  );
};
