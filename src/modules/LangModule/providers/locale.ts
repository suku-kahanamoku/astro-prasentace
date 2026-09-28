import { locales, type Locale } from "../config";
export { locales, defaultLocale, type Locale } from "../config";
export const isLocale = (value: unknown): value is Locale =>
  locales.includes(value as Locale);
export function createDictionary<T>(dictionaries: Record<Locale, T>) {
  return (locale: Locale): T => dictionaries[locale];
}
