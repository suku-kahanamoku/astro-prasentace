/**
 * Sdílené jazykové nástroje LangModule.
 *
 * Moduly si přes tento provider vyměňují jazykový kontext a slovníky,
 * aniž by se navzájem importovaly. Jazyky i jejich výchozí hodnota
 * se reexportují z `config.ts`, aby moduly nemusely znát cestu ke konfiguraci.
 */
import { locales, type Locale } from "../config";

/** Reexport podporovaných jazyků a výchozího jazyka pro ostatní moduly. */
export { locales, defaultLocale, type Locale } from "../config";

/**
 * Ověří, zda hodnota odpovídá podporovanému jazyku.
 * @param value Libovolná hodnota, zpravidla z URL nebo `localStorage`.
 * @returns `true`, pokud je hodnota jedním z podporovaných jazyků.
 */
export const isLocale = (value: unknown): value is Locale =>
  locales.includes(value as Locale);

/**
 * Vytvoří funkci pro výběr překladu podle jazyka.
 *
 * Typová parametr `T` se odvozuje z českého slovníku, takže ostatní
 * jazyky musí mít stejnou strukturu – kontrolu zajišťuje
 * `scripts/check-locales.mjs` během buildu.
 *
 * @param dictionaries Mapování jazyků na slovníky.
 * @returns Funkci `(locale) => slovník`, kterou lze volat bez dalších kontrol.
 */
export function createDictionary<T>(dictionaries: Record<Locale, T>) {
  return (locale: Locale): T => dictionaries[locale];
}
