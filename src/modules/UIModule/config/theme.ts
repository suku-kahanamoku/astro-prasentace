/**
 * Konfigurace světlého a tmavého vzhledu.
 *
 * Jde o jediný zdroj pravdy pro klíč v `localStorage`, hodnoty atributu
 * `data-theme` na `<html>` i barvu prohlížeče (`meta[name="theme-color"]`).
 * Konfigurace se používá na serveru (výchozí hodnoty do `<meta>`) i v klientu
 * (`ThemeInit`, `useTheme`), proto je exportována jako `as const`.
 */

/** Klíč, názvy a barvy obou vzhledů. */
export const themeConfig = {
  /** Klíč v `localStorage`, pod kterým se ukládá výslovná volba návštěvníka. */
  storageKey: "prasentace-theme",
  /** Světlý vzhled – výchozí pro první návštěvu bez uložené volby. */
  light: {
    /** Hodnota atributu `data-theme` na kořenovém elementu. */
    name: "prasentace",
    /** Barva prohlížeče (adresový řádek) pro světlý vzhled. */
    color: "#faf7ef",
  },
  /** Tmavý vzhled – aktivuje se systémovým nastavením nebo přepínačem. */
  dark: {
    /** Hodnota atributu `data-theme` na kořenovém elementu. */
    name: "prasentace-dark",
    /** Barva prohlížeče (adresový řádek) pro tmavý vzhled. */
    color: "#191d29",
  },
} as const;

/**
 * Výchozí hodnoty pro vykreslení na serveru.
 * Klient následně vzhled přepočítá podle uložené volby nebo systému.
 */
export const theme = {
  /** Výchozí barva prohlížeče; odpovídá světlému vzhledu. */
  color: themeConfig.light.color,
  /** Výchozí barevný režim dokumentu pro zákazníky bez podpory `color-scheme`. */
  colorScheme: "light",
} as const;
