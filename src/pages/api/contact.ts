import type { APIRoute } from "astro";
import { TURNSTILE_SECRET_KEY } from "astro:env/server";
import { handleContact } from "@/server/contact-service.mjs";
import { acceptsTurnstile, sendPhpMail } from "@/server/mail-integrations.mjs";
import { dictionary, isLocale } from "@/i18n";

export const prerender = false;
const env = (name: string) => process.env[name] || import.meta.env[name] || "";
export const POST: APIRoute = async ({ request }) => {
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
      const t = dictionary(isLocale(data.locale) ? data.locale : "cs");
      const interest =
        t.solutions.items.find((item) => item.id === data.interest)?.title ||
        "—";
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
