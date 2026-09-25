import test from "node:test";
import assert from "node:assert/strict";
import {
  acceptsTurnstile,
  sendPhpMail,
} from "../src/server/mail-integrations.mjs";
const secret = "1x0000000000000000000000000000000AA";
test("dummy Turnstile metadata accepted only in local development", () => {
  const result = { success: true, hostname: "localhost", action: "test" };
  assert.equal(acceptsTurnstile(result, secret, "127.0.0.1", true), true);
  assert.equal(acceptsTurnstile(result, secret, "127.0.0.1", false), false);
  assert.equal(acceptsTurnstile(result, secret, "prasentace.cz", true), false);
  assert.equal(
    acceptsTurnstile({ ...result, success: false }, secret, "localhost", true),
    false,
  );
});
test("real Turnstile keys require matching hostname and action", () => {
  const result = {
    success: true,
    hostname: "prasentace.cz",
    action: "contact",
  };
  assert.equal(
    acceptsTurnstile(result, "production-secret", "prasentace.cz", false),
    true,
  );
  assert.equal(
    acceptsTurnstile(
      { ...result, action: "test" },
      "production-secret",
      "prasentace.cz",
      false,
    ),
    false,
  );
  assert.equal(
    acceptsTurnstile(result, "production-secret", "other.example", true),
    false,
  );
});
const config = {
  baseUrl: "https://backend.example/api",
  internalKey: "test-internal",
  siteUrl: "https://prasentace.cz",
  from: "info@prasentace.cz",
  name: "Prasentace",
  phone: "",
};
test("PHP transport fixes recipient, template and sender independently of visitor data", async () => {
  await sendPhpMail(
    config,
    {
      name: "Visitor",
      email: "visitor@example.com",
      message: "Message",
      to: "attacker@example.com",
      template: "other",
    },
    async (url, options) => {
      assert.equal(url.href, "https://backend.example/api/mailer/send");
      assert.equal(options.headers["x-forwarded-host"], "prasentace.cz");
      assert.equal(options.headers["x-internal-key"], "test-internal");
      const body = JSON.parse(options.body);
      assert.equal(body.to, "info@prasentace.cz");
      assert.equal(body.fromName, "Prasentace");
      assert.equal(body.fromEmail, "info@prasentace.cz");
      assert.equal(body.template, "contact-form-admin");
      assert.equal(body.email, "visitor@example.com");
      return Response.json({ success: true });
    },
  );
});
test("PHP rejection and unsuccessful JSON cannot claim delivery", async () => {
  for (const response of [
    Response.json({ success: false }),
    Response.json({ success: false }, { status: 500 }),
  ])
    await assert.rejects(sendPhpMail(config, {}, async () => response));
});
