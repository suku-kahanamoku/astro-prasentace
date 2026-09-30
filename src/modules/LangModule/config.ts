/**
 * Konfigurace podporovaných jazyků webu – jediný zdroj pravdy pro LangModule
 * i všechny ostatní moduly, které jazyky sdílejí.
 *
 * Nový jazyk se přidává pouze zde a doplněním `locales/<jazyk>.json`;
 * odvozené typy (`Locale`) i slovníky se přizpůsobí automaticky.
 */

/** Seznam podporovaných jazyků; pořadí určuje jazykový přepínač i sitemapu. */
export const locales = ["cs", "en", "de"] as const;

/** Jazyk dané instance stránky, odvozený z `locales`. */
export type Locale = (typeof locales)[number];

/**
 * Výchozí jazyk webu.
 * Jako jediný se zobrazuje bez prefixu v URL, proto je URL vždy odvozené od něj.
 */
export const defaultLocale: Locale = "cs";
