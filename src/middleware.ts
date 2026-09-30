/**
 * Vstupní middleware celého webu.
 *
 * Astro vyžaduje export `onRequest`; re-exportuje se tu chování
 * LangModule, které lokalizovaným cestám `/en/…` a `/de/…` podává
 * stránku 404 ve správném jazyce. Implementace zůstává v modulu,
 * aby middleware nezavádělo závislost mimo LangModule.
 */
export { localizedNotFound as onRequest } from "./modules/LangModule/server/localizedNotFound";
