/**
 * Centrální konfigurace celého webu.
 *
 * Všechna data, která se mění (jméno, kontakty, sociální sítě, texty)
 * jsou na jednom místě, aby AI agent mohl snadno upravovat obsah
 * bez nutnosti procházet šablony.
 */

export const site = {
  /** Základní metadata */
  name: "Jan Bartošek",
  title: "Jan Bartošek — Poslanec za Jihočeský kraj",
  description:
    "Osobní web poslance Ing. Jana Bartoška, MPA. Bezpečnostní politika, Jihočeský kraj, křesťanská demokracie.",
  url: "https://www.janbartosek.cz",
  locale: "cs_CZ",
  ogImage: "/images/og-image.svg",

  /** Osobní údaje */
  person: {
    fullName: "Ing. Jan Bartošek, MPA",
    shortName: "Jan Bartošek",
    role: "Poslanec Poslanecké sněmovny PČR",
    party: "KDU-ČSL",
    coalition: "SPOLU",
    region: "Jihočeský kraj",
    city: "Dačice",
    birthYear: 1971,
  },

  /** Kontaktní údaje */
  contact: {
    email: "bartosekj@psp.cz",
    phone: "",
    office: {
      name: "Regionální kancelář",
      street: "Lannova 16/13",
      city: "České Budějovice",
      zip: "370 01",
    },
  },

  /** Sociální sítě */
  social: {
    facebook: "https://www.facebook.com/bartosekKDU",
    twitter: "https://twitter.com/honzabartosek",
    instagram: "https://www.instagram.com/bartosek_jan",
  },

  /** Hero sekce na homepage */
  hero: {
    headline: "Jsem Jan Bartošek, poslanec za Jihočeský kraj a člen KDU-ČSL.",
    subheadline:
      "Pracuji pro bezpečnost Česka a lepší život v regionech.",
    ctaText: "Více o mně",
    ctaLink: "/#o-mne",
    secondaryCtaText: "Kontakt",
    secondaryCtaLink: "/#kontakt",
  },

  /** Klíčová témata na homepage — tři pilíře identity */
  topics: [
    {
      title: "Důvěra",
      slogan: "Podaná ruka platí.",
      description: "",
      icon: "shield",
      link: "",
    },
    {
      title: "Důstojnost člověka",
      slogan: "Být blízko lidem.",
      description:
        "Práce pro region — dostupné bydlení, doprava, školy, podpora obcí. Politik, který zná problémy svého kraje.",
      icon: "leaf",
      link: "",
    },
    {
      title: "Bezpečí",
      slogan: "",
      description:
        "Odvaha chránit hodnoty, které dávají životu směr.",
      icon: "lighthouse",
      link: "",
    },
  ],

  /** O mně — krátká verze pro homepage */
  aboutShort:
    "Než jsem vstoupil do politiky, pomáhal jsem lidem na cestě ze závislosti zpět do života. Roky práce v Terapeutické komunitě Podcestný Mlýn u Dačic mě naučily, že každý člověk si zaslouží šanci. Tuto zkušenost přenáším do své práce poslance — ať už jde o bezpečnost, sociální politiku nebo budoucnost Jihočeského kraje.",

  /** Navigace */
  nav: [
    { label: "Úvod", href: "/" },
    { label: "O mně", href: "/#o-mne" },
    { label: "Kontakt", href: "/#kontakt" },
  ],

  /** Kategorie článků */
  categories: {
    bezpecnost: { label: "Bezpečnost", color: "bg-blue-100 text-blue-800" },
    snemovna: { label: "Ze Sněmovny", color: "bg-purple-100 text-purple-800" },
    "jihocesky-kraj": {
      label: "Jihočeský kraj",
      color: "bg-green-100 text-green-800",
    },
    osobni: { label: "Osobní", color: "bg-amber-100 text-amber-800" },
    media: { label: "V médiích", color: "bg-rose-100 text-rose-800" },
  },
} as const;

export type Category = keyof typeof site.categories;
