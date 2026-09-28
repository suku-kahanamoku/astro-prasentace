const testSecret = "1x0000000000000000000000000000000AA";
const testSecrets = new Set([
  testSecret,
  "2x0000000000000000000000000000000AA",
  "3x0000000000000000000000000000000AA",
]);
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
