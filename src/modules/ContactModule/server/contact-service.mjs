const allowedInterests = new Set([
  "",
  "systems",
  "web",
  "mobile",
  "automation",
  "support",
]);
const reply = (status, code, fields) =>
  Response.json(
    { code, ...(fields ? { fields } : {}) },
    { status, headers: { "Cache-Control": "no-store" } },
  );

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

/** Dependencies are injected to test failure paths without sending real email. */
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
