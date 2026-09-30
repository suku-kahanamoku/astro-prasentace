/**
 * Transportně nezávislá logika kontaktního endpointu.
 *
 * Modul záměrně nezná Astro ani konkrétní poskytovatele služeb: ověření
 * CAPTCHA i odeslání e-mailu dostává jako vstupní funkce, takže se dají
 * v testech nahradit bez odeslání skutečné zprávy (viz `handleContact`).
 */

/** Povolené hodnoty pole `interest`; prázdná hodnota znamená „neuvedeno“. */
const allowedInterests = new Set([
  "",
  "systems",
  "web",
  "mobile",
  "automation",
  "support",
]);

/**
 * Sestaví jednotnou JSON odpověď endpointu.
 * @param {number} status - HTTP stavový kód.
 * @param {string} code - Kód, podle kterého klient vybere lokalizovanou hlášku.
 * @param {string[]} [fields] - Volitelný seznam chybných polí formuláře.
 * @returns {Response} Odpověď JSON bez ukládání do cache.
 */
const reply = (status, code, fields) =>
  Response.json(
    { code, ...(fields ? { fields } : {}) },
    { status, headers: { "Cache-Control": "no-store" } },
  );

/**
 * Ověří a normalizuje tělo požadavku.
 *
 * Kontroluje typy a délky všech polí, formát e-mailu, minimální délku zprávy,
 * přípustnost zájmu a jazyka. Chyby se sbírají, ne aby se vracely hned,
 * takže klient může označit všechna neplatná pole najednou.
 *
 * @param {object} body - Dekódované tělo požadavku.
 * @returns {{ fields: string[] } | { data: Record<string, string> }} Seznam chybných polí, nebo oříznutá data.
 */
export function validateContact(body) {
  if (!body || typeof body !== "object" || Array.isArray(body))
    return { fields: ["name", "email", "message"] };
  const limits = {
    name: 100,
    email: 254,
    company: 150,
    message: 5000,
    interest: 30,
    locale: 2,
    token: 2048,
    website: 200,
  };
  const data = {};
  const fields = [];
  for (const [key, limit] of Object.entries(limits)) {
    const value = body[key] ?? "";
    if (typeof value !== "string" || value.length > limit) {
      fields.push(key);
      continue;
    }
    data[key] = value.trim();
  }
  if (!data.name || /[\r\n]/.test(data.name)) fields.push("name");
  if (!data.email || !/^[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]+$/.test(data.email))
    fields.push("email");
  if (!data.message || data.message.length < 10) fields.push("message");
  if (!allowedInterests.has(data.interest)) fields.push("interest");
  if (!["cs", "en", "de"].includes(data.locale)) fields.push("locale");
  return fields.length ? { fields: [...new Set(fields)] } : { data };
}

/**
 * Načte tělo požadavku s pevným limitem velikosti.
 *
 * Tělo se čte po částech a průběžně kontroluje součet bajtů, takže nelze
 * zadáním obrovské hlavičky `content-length` obejít limit.
 *
 * @param {Request} request - Příchozí požadavek.
 * @returns {Promise<object>} Dekódované tělo jako objekt.
 * @throws {Error} `size` při překročení 20 kB, `body` při chybějícím těle.
 */
async function readBounded(request) {
  if (Number(request.headers.get("content-length")) > 20000)
    throw new Error("size");
  const reader = request.body?.getReader();
  if (!reader) throw new Error("body");
  const chunks = [];
  let length = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > 20000) {
        await reader.cancel();
        throw new Error("size");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return JSON.parse(new TextDecoder().decode(bytes));
}

/**
 * Zpracuje požadavek kontaktního formuláře.
 *
 * Pořadí kontrol je záměrně od nejlevnějších: metoda, původ požadavku
 * (ochrana proti cross-site požadavkům), typ obsahu, velikost a tvar těla,
 * honeypot, dostupnost konfigurace a teprve potom CAPTCHA a odeslání.
 * Honeypot vyplněný botem vrací úspěch bez odeslání, aby se neprozradilo,
 * že automatická kontrola zafungovala.
 *
 * Závislosti se injektují, aby bylo možné testovat chybové cesty bez
 * odesílání skutečného e-mailu.
 *
 * @param {Request} request - Příchozí požadavek na `/api/contact/`.
 * @param {{ configured: boolean, verify: (token: string) => Promise<boolean>, send: (data: Record<string, string>) => Promise<void> }} deps - Konfigurace a vstupní funkce pro ověření CAPTCHA a odeslání.
 * @returns {Promise<Response>} JSON odpověď s kódem `success`, `invalid`, `captcha`, `unavailable` nebo `error`.
 * @throws Nevyhazuje; všechny chyby se převádějí na stavový kód odpovědi.
 */
export async function handleContact(request, { configured, verify, send }) {
  if (request.method !== "POST") return reply(405, "error");
  if (request.headers.get("origin") !== new URL(request.url).origin)
    return reply(403, "error");
  if (
    !(
      request.headers
        .get("content-type")
        ?.split(";")[0]
        .trim()
        .toLowerCase() === "application/json"
    )
  )
    return reply(415, "invalid");
  let body;
  try {
    body = await readBounded(request);
  } catch {
    return reply(400, "invalid");
  }
  const parsed = validateContact(body);
  if (parsed.fields) return reply(422, "invalid", parsed.fields);
  const data = parsed.data;
  if (data.website) return reply(200, "success");
  if (!configured) return reply(503, "unavailable");
  if (!data.token) return reply(422, "captcha");
  try {
    if (!(await verify(data.token))) return reply(422, "captcha");
  } catch {
    return reply(502, "captcha");
  }
  try {
    await send(data);
    return reply(200, "success");
  } catch {
    return reply(502, "error");
  }
}
