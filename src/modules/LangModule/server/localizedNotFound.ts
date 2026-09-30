/**
 * Middleware, které lokalizovaným cestám podává 404 ve stejném jazyce.
 *
 * Bez zásahu by `/en/nExistujici-stranka` skončilo výchozí (českou) 404
 * stránkou, protože catch-all routa `[...path]` generuje jen existující cesty.
 * Přepis na `/<locale>/404/` udrží jazyk, stav 404 i hlavičky originální
 * odpovědi, takže klient stále vidí kód 404.
 */
import { defineMiddleware } from "astro:middleware";

// Statické produkční fallbacky se zrcadlí v netlify.toml; middleware pokrývá
// vývojový server Astro a požadavky zpracovávané na serveru bez přesměrování.
export const localizedNotFound = defineMiddleware(async (context, next) => {
  const response = await next();
  const locale = context.url.pathname.split("/")[1];
  if (
    response.status !== 404 ||
    !["en", "de"].includes(locale) ||
    context.url.pathname === `/${locale}/404/`
  )
    return response;
  const localized = await context.rewrite(`/${locale}/404/`);
  return new Response(localized.body, {
    status: 404,
    headers: localized.headers,
  });
});
