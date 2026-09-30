/**
 * Serverový endpoint formuláře kontaktu.
 *
 * Zpracování zůstává v ContactModule; tento soubor pouze složí handler
 * s překladem názvů řešení, aby modul ContactModule neznal obsah
 * ContentModule. Tajemství (CAPTCHA, SMTP konfigurace) se načítá uvnitř modulu.
 */
import { createContactHandler } from "../../modules/ContactModule/server/contactHandler";
import { dictionary } from "../../modules/ContentModule/providers/translations";

/** Endpoint se zpracovává na serveru (Netlify), nikoli při buildu. */
export const prerender = false;

/**
 * `POST /api/contact/` – přijme JSON s poli formuláře, ověří CAPTCHA
 * a předá zprávu PHP maileru.
 * @param request Příchozí POST s hlavičkou `Content-Type: application/json`.
 * @returns JSON `{ code }` s kódem `success`, `invalid`, `captcha`, `unavailable` nebo `error`.
 */
export const POST = createContactHandler(
  (locale, id) =>
    dictionary(locale).solutions.items.find((item) => item.id === id)?.title ||
    "—",
);
