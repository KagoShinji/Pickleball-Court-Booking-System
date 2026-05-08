export const Config = {
  company: {
    id: import.meta.env.VITE_COMPANY_ID,
    name: import.meta.env.VITE_COMPANY_NAME || 'Default Company',
    shortName: import.meta.env.VITE_COMPANY_SHORT_NAME || 'Company',
    initials: import.meta.env.VITE_COMPANY_INITIALS || 'CO',
    logoUrl: import.meta.env.VITE_COMPANY_LOGO_URL || '/images/default-logo.jpg',
    location: import.meta.env.VITE_COMPANY_LOCATION || 'Main Location',
    email: import.meta.env.VITE_COMPANY_EMAIL || 'hello@company.com',
    phone: import.meta.env.VITE_COMPANY_PHONE || '(000) 000 0000',
    phoneAlt: import.meta.env.VITE_COMPANY_PHONE_ALT || '(000) 000 0000',
    mapQuery: import.meta.env.VITE_COMPANY_MAP_QUERY || '',
    socialFacebook: import.meta.env.VITE_SOCIAL_FACEBOOK || '',
    socialInstagram: import.meta.env.VITE_SOCIAL_INSTAGRAM || '',
  },
  assets: {
    heroImages: [
      import.meta.env.VITE_HERO_1,
      import.meta.env.VITE_HERO_2,
      import.meta.env.VITE_HERO_3
    ].filter(Boolean).map(hero => {
      const parts = hero.split('|');
      return {
        src: parts[0] || '',
        title: parts[1] || '',
        subtitle: parts[2] || ''
      };
    })
  },
  offers: {
    amenities: import.meta.env.VITE_AMENITIES 
      ? import.meta.env.VITE_AMENITIES.split(',').map(s => s.trim()).filter(Boolean)
      : []
  },
  features: {
    qrCodes: import.meta.env.VITE_FEAT_QR_CODES === 'true',
    timeSlots: import.meta.env.VITE_FEAT_TIME_SLOTS === 'true',
    analytics: import.meta.env.VITE_FEAT_ANALYTICS === 'true',
  },
  theme: {
    primary: import.meta.env.VITE_THEME_PRIMARY || '#14B8A6',
    primaryLight: import.meta.env.VITE_THEME_PRIMARY_LIGHT || '#F0FDFA',
    primaryDark: import.meta.env.VITE_THEME_PRIMARY_DARK || '#0F766E',
    secondary: import.meta.env.VITE_THEME_SECONDARY || '#F97316',
    secondaryLight: import.meta.env.VITE_THEME_SECONDARY_LIGHT || '#FFF7ED',
  },
};

// Strict Validation for essential variables
if (!Config.company.id && import.meta.env.MODE !== 'development') {
  throw new Error('CRITICAL: VITE_COMPANY_ID is missing. This is required for tenant database isolation.');
}

export default Config;
