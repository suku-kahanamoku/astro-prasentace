/**
 * Centrální konfigurace identita webu: název značky, kontaktní údaje,
 * sídlo a seznam technologií, které se propisují do UI.
 *
 * Zdroj pravdy pro AGENTS.md pravidlo „kontaktní údaje a značku drž v
 * `src/config/site.ts`“. Hodnoty jsou `as const`, takže všechny odvozené
 * typy (např. `typeof site.technologies[number]`) zůstávají literálními.
 */
export const site = {
  /** Obchodní název značky zobrazovaný v logu, patičce a hlavičce. */
  name: "Prasentace",
  /** Hlavní e-mail pro odběratele; současně adresa příjemce poptávek. */
  email: "info@prasentace.cz",
  /** Telefon ve zobrazeném formátu; pro `tel:` odkaz se normalizuje na číslice. */
  phone: "+420 722 767 646",
  /** IČO zobrazované v patičce a v právních textech. */
  registrationId: "04473442",
  /** Adresa sídla používaná v kontaktu, patičce a structured data. */
  address: {
    /** Ulice a číslo popisné. */
    street: "Eleonory Voračické 2167/29",
    /** Město a městská část. */
    city: "Brno – Žabovřesky",
    /** PSČ včetně mezery před třemi číslicemi. */
    postalCode: "616 00",
    /** Kód země ISO 3166-1 alpha-2 pro schema.org `PostalAddress`. */
    country: "CZ",
  },
  /** Přehled technologií, které se vypisují v technologických sekcích. */
  technologies: ["Astro", "Vue.js", "Nuxt", "React Native", "Angular", "PHP"],
} as const;
