/**
 * Integrace na vnější služby kontaktního formuláře (CAPTCHA a PHP mailer).
 *
 * Modul je zároveň testovací rozhraní: obě funkce přijímají výsledky nebo
 * závislosti zvenčí, takže jednotkové testy mohou pokrýt i selhání sítě
 * a odmítnutí zprávy.
 */

/** Turnstile testovací klíč, pro který Cloudflare vrací vždy úspěch. */
const testSecret = "1x0000000000000000000000000000000AA";
/** Všechny uznané testovací klíče; v produkci se nesmějí použít. */
const testSecrets = new Set([
  testSecret,
  "2x0000000000000000000000000000000AA",
  "3x0000000000000000000000000000000AA",
]);

/**
 * Rozhodne, zda odpověď Turnstile odpovídá očekávanému akci a hostiteli.
 *
 * Testovací klíče se přijímají jen ve vývoji a jen na lokálních hostitelích,
 * aby se přes veřejné prostředí nedala obejít captcha.
 *
 * @param {{ success?: boolean, action?: string, hostname?: string }} result - Tělo odpovědi služby `siteverify`.
 * @param {string} secret - Použitý tajný klíč služby.
 * @param {string} hostname - Hostitel, ze kterého přišel požadavek.
 * @param {boolean} development - Zda běží vývojové prostředí.
 * @returns `true`, pokud je odpověď důvěryhodná a lze zprávu přijmout.
 */
export function acceptsTurnstile(result, secret, hostname, development) {
  if (result.success !== true) return false;
  if (testSecrets.has(secret)) {
    return (
      secret === testSecret &&
      development &&
      ["localhost", "127.0.0.1", "[::1]"].includes(hostname)
    );
  }
  return result.action === "contact" && result.hostname === hostname;
}

/**
 * Předá zprávu PHP maileru na interní API.
 *
 * Požadavek se autorizuje hlavičkou `x-internal-key` a předává hostitele
 * ve `x-forwarded-host`, aby interní API sestavilo správné absolutní odkazy
 * v e-mailu. Adresa odesílatele se bere z konfigurace serveru, ne z klientských
 * dat.
 *
 * @param {{ baseUrl: string, internalKey: string, siteUrl: string, from: string, name: string, phone: string }} config - Konfigurace z prostředí.
 * @param {{ name: string, email: string, interest: string, message: string }} details - Data z formuláře s již přeloženým zájmem.
 * @param {typeof fetch} [fetcher] - Volitelná náhrada `fetch` pro testy.
 * @returns {Promise<void>} Resolve po úspěšném přijetí zprávy.
 * @throws {Error} Pokud API vrátí neúspěch nebo neplatnou odpověď.
 */
export async function sendPhpMail(config, details, fetcher = fetch) {
  const response = await fetcher(
    new URL("mailer/send", config.baseUrl.replace(/\/?$/, "/")),
    {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        "x-internal-key": config.internalKey,
        "x-forwarded-host": new URL(config.siteUrl).host,
      },
      body: JSON.stringify({
        ...details,
        template: "contact-form-admin",
        to: config.from,
        fromEmail: config.from,
        fromName: config.name,
        fromPhone: config.phone,
        subject: `${config.name} — nová poptávka`,
        logoPath: "",
      }),
      signal: AbortSignal.timeout(15000),
    },
  );
  if (!response.ok || (await response.json()).success !== true)
    throw new Error("PHP mailer rejected the message");
}
