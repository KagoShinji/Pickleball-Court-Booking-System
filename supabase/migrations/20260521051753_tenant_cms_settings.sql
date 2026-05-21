-- Add lightweight CMS fields to the existing single-row tenant settings table.
ALTER TABLE public.tenant_settings
  ADD COLUMN IF NOT EXISTS theme_config jsonb NOT NULL DEFAULT $$
    {
      "primary": "#0d6b58",
      "primaryLight": "#e7f3db",
      "primaryDark": "#091f1a",
      "secondary": "#b9ff3f",
      "secondaryLight": "#f1ffd4",
      "backgroundLight": "#fff8e7",
      "backgroundSurface": "#fffaf0"
    }
  $$::jsonb,
  ADD COLUMN IF NOT EXISTS site_images jsonb NOT NULL DEFAULT $$
    {
      "logoUrl": "/kennydink/kennydinklogo.jpg",
      "heroBackground": "/kennydink/court%203.jpg",
      "galleries": {
        "hero": [
          "/kennydink/kennydinkhero.jpg",
          "/kennydink/paddle.jpg",
          "/kennydink/net.jpg"
        ],
        "venue": [
          "/kennydink/paddle.jpg",
          "/kennydink/court%201.jpg",
          "/kennydink/kennydinktarp.jpg"
        ],
        "courts": [
          "/kennydink/court%203.jpg",
          "/kennydink/net.jpg",
          "/kennydink/paddle.jpg",
          "/kennydink/kennydinkhero.jpg",
          "/kennydink/court%201.jpg"
        ]
      },
      "sectionBackgrounds": {
        "offers": "",
        "courts": "/kennydink/kennydinkhero.jpg",
        "contact": "",
        "parking": "/kennydink/kennydinktarp.jpg",
        "footer": ""
      }
    }
  $$::jsonb,
  ADD COLUMN IF NOT EXISTS section_content jsonb NOT NULL DEFAULT $$
    {
      "courts": {
        "kicker": "Court selection",
        "title": "Choose a court. Start fast.",
        "description": "The booking surface stays direct: real venue imagery, active court inventory, and a clear handoff into dates and time slots.",
        "flowKicker": "Booking flow",
        "flowTitle": "Real court photos. Real slots.",
        "flowDescription": "Guests see the court, pick a date, select available hours, and continue to payment details."
      },
      "offers": {
        "kicker": "After the rally",
        "title": "Tropical extras. Match-ready.",
        "description": "Quick comforts for players, diners, and groups without letting the amenity list dominate the scroll.",
        "panelKicker": "Venue extras",
        "panelDescription": "Compact cards keep the section balanced as the list grows."
      },
      "contact": {
        "kicker": "Visit the venue",
        "title": "Find us before the first serve.",
        "description": "Contact, hours, and directions stay venue-specific while the booking flow stays fast and familiar.",
        "contactTitle": "Contact information",
        "eventKicker": "Private events",
        "eventTitle": "Talk with the venue team",
        "eventDescription": "For group play, tournaments, or event reservations, use the venue's social channels or direct contact details."
      },
      "parking": {
        "title": "Easy arrival, day or night.",
        "description": "Keep arrival details clear without forcing every venue into the same parking layout."
      },
      "footer": {
        "kicker": "Ready when you are",
        "title": "Book the next rally.",
        "description": "Court reservations, venue details, and private play scheduling."
      }
    }
  $$::jsonb;
