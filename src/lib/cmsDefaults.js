export const DEFAULT_THEME_CONFIG = {
  primary: '#0d6b58',
  primaryLight: '#e7f3db',
  primaryDark: '#091f1a',
  secondary: '#b9ff3f',
  secondaryLight: '#f1ffd4',
  backgroundLight: '#fff8e7',
  backgroundSurface: '#fffaf0',
};

export const DEFAULT_SITE_IMAGES = {
  logoUrl: '/images/pplogo.jpg',
  faviconUrl: '/vite.svg',
  heroBackground: '/images/court1.jpg',
  galleries: {
    hero: [
      '/images/court1.jpg',
      '/images/court2.jpg',
    ],
    venue: [
      '/images/court1.jpg',
      '/images/court2.jpg',
    ],
    courts: [
      '/images/court1.jpg',
      '/images/court2.jpg',
    ],
  },
  sectionBackgrounds: {
    offers: '',
    courts: '/images/court2.jpg',
    contact: '',
    parking: '/images/court1.jpg',
    footer: '',
  },
};

export const DEFAULT_SECTION_CONTENT = {
  courts: {
    kicker: 'Court selection',
    title: 'Choose a court. Start fast.',
    description: 'The booking surface stays direct: real venue imagery, active court inventory, and a clear handoff into dates and time slots.',
    flowKicker: 'Booking flow',
    flowTitle: 'Real court photos. Real slots.',
    flowDescription: 'Guests see the court, pick a date, select available hours, and continue to payment details.',
  },
  offers: {
    kicker: 'After the rally',
    title: 'Tropical extras. Match-ready.',
    description: 'Quick comforts for players, diners, and groups without letting the amenity list dominate the scroll.',
    panelKicker: 'Venue extras',
    panelDescription: 'Compact cards keep the section balanced as the list grows.',
  },
  contact: {
    kicker: 'Visit the venue',
    title: 'Find us before the first serve.',
    description: 'Contact, hours, and directions stay venue-specific while the booking flow stays fast and familiar.',
    contactTitle: 'Contact information',
    eventKicker: 'Private events',
    eventTitle: 'Talk with the venue team',
    eventDescription: "For group play, tournaments, or event reservations, use the venue's social channels or direct contact details.",
  },
  parking: {
    title: 'Easy arrival, day or night.',
    description: 'Keep arrival details clear without forcing every venue into the same parking layout.',
  },
  footer: {
    kicker: 'Ready when you are',
    title: 'Book the next rally.',
    description: 'Court reservations, venue details, and private play scheduling.',
  },
};

function cleanText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

export function normalizeImageList(value) {
  if (Array.isArray(value)) {
    return value.map(cleanText).filter(Boolean);
  }

  if (typeof value === 'string') {
    return value
      .split(/[\n,]/)
      .map(cleanText)
      .filter(Boolean);
  }

  return [];
}

function mergeObject(defaults, saved = {}) {
  const result = { ...defaults };

  Object.keys(defaults).forEach((key) => {
    const value = saved?.[key];

    if (value && typeof value === 'object' && !Array.isArray(value) && typeof defaults[key] === 'object' && !Array.isArray(defaults[key])) {
      result[key] = mergeObject(defaults[key], value);
      return;
    }

    if (Array.isArray(defaults[key])) {
      const list = normalizeImageList(value);
      result[key] = list.length > 0 ? list : defaults[key];
      return;
    }

    if (typeof value === 'string') {
      result[key] = value.trim() || defaults[key];
      return;
    }

    if (value !== undefined && value !== null) {
      result[key] = value;
    }
  });

  return result;
}

export function mergeThemeConfig(saved = {}, fallbackTheme = {}) {
  return mergeObject(
    {
      ...DEFAULT_THEME_CONFIG,
      primary: fallbackTheme.primary || DEFAULT_THEME_CONFIG.primary,
      primaryLight: fallbackTheme.primaryLight || DEFAULT_THEME_CONFIG.primaryLight,
      primaryDark: fallbackTheme.primaryDark || DEFAULT_THEME_CONFIG.primaryDark,
      secondary: fallbackTheme.secondary || DEFAULT_THEME_CONFIG.secondary,
      secondaryLight: fallbackTheme.secondaryLight || DEFAULT_THEME_CONFIG.secondaryLight,
    },
    saved,
  );
}

export function mergeSiteImages(saved = {}) {
  return mergeObject(DEFAULT_SITE_IMAGES, saved);
}

export function mergeSectionContent(saved = {}) {
  return mergeObject(DEFAULT_SECTION_CONTENT, saved);
}

export function toCssImageUrl(src) {
  const clean = cleanText(src);
  if (!clean) return undefined;
  return `url("${clean.replace(/"/g, '%22')}")`;
}
