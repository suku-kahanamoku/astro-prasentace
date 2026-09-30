/**
 * Dynamicky generovaný soubor `robots.txt`.
 *
 * Vyjadřuje zásady indexování (blokuje pouze API) a odkazuje na sitemap
 * vytvořenou integrací `@astrojs/sitemap`, aby vyhledávače nemusely
 * sitemapu hledat.
 */
import type { APIRoute } from "astro";

/**
 * `GET /robots.txt` – vrátí text pravidel pro všechny crawlery.
 * @param context Kontext routy; používá se `site` jako základ URL.
 * @returns Odpověď `text/plain` s direktivami a URL sitemapy.
 */
export const GET: APIRoute = ({ site }) =>
  new Response(
    `User-agent: *\nAllow: /\nDisallow: /api/\nSitemap: ${new URL("sitemap-index.xml", site).href}\n`,
    { headers: { "Content-Type": "text/plain; charset=utf-8" } },
  );
