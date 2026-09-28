import type { APIRoute } from "astro";
import { TURNSTILE_SECRET_KEY } from "astro:env/server";
import { handleContact } from "./contact-service.mjs";
import { acceptsTurnstile, sendPhpMail } from "./mail-integrations.mjs";
import { dictionary } from "../providers/translations";
import { isLocale } from "../../LangModule/providers/locale";

const env = (name: string) => process.env[name] || import.meta.env[name] || "";
export function createContactHandler(
  interestTitle: (
    locale: import("../../LangModule/config").Locale,
    id: string,
  ) => string,
): APIRoute {
  return async ({ request }) => {
    const secret = TURNSTILE_SECRET_KEY || "";
    const config = {
      baseUrl: env("PHP_API_BASE_URL"),
      internalKey: env("INTERNAL_API_KEY"),
      siteUrl: env("PUBLIC_SITE_URL") || "https://prasentace.cz",
      from: env("MAILING_FROM"),
      name: env("MAILING_FROM_NAME"),
      phone: env("MAILING_FROM_PHONE"),
    };
    return handleContact(request, {
      configured: Boolean(
        secret &&
        config.baseUrl &&
        config.internalKey &&
        config.from &&
        config.name,
      ),
      verify: async (token: string) => {
        const response = await fetch(
          "https://challenges.cloudflare.com/turnstile/v0/siteverify",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ secret, response: token }),
            signal: AbortSignal.timeout(7000),
          },
        );
        if (!response.ok) return false;
        return acceptsTurnstile(
          await response.json(),
          secret,
          new URL(request.url).hostname,
          import.meta.env.DEV,
        );
      },
      send: async (data: Record<string, string>) => {
        const locale = isLocale(data.locale) ? data.locale : "cs";
        const t = dictionary(locale);
        const interest = interestTitle(locale, data.interest);
        await sendPhpMail(config, {
          name: data.name,
          email: data.email,
          interest,
          message: [
            data.company && `${t.contact.company}: ${data.company}`,
            data.message,
          ]
            .filter(Boolean)
            .join("\n\n"),
        });
      },
    });
  };
}
