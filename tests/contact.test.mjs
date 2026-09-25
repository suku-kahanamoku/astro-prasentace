import test from "node:test";
import assert from "node:assert/strict";
import { handleContact } from "../src/server/contact-service.mjs";
const valid = {
  name: "Test User",
  email: "test@example.com",
  company: "",
  message: "A test project enquiry.",
  interest: "web",
  locale: "en",
  token: "test-token",
  website: "",
};
function request(body = valid, headers = {}) {
  return new Request("https://prasentace.cz/api/contact/", {
    method: "POST",
    headers: {
      origin: "https://prasentace.cz",
      "content-type": "application/json",
      ...headers,
    },
    body: JSON.stringify(body),
  });
}
function deps(overrides = {}) {
  let count = 0;
  return {
    get count() {
      return count;
    },
    configured: true,
    verify: async () => true,
    send: async () => {
      count++;
    },
    ...overrides,
  };
}
test("valid enquiry is accepted only after delivery resolves", async () => {
  const d = deps();
  const r = await handleContact(request(), d);
  assert.equal(r.status, 200);
  assert.equal(d.count, 1);
});
test("invalid fields and email header injection cannot send", async () => {
  for (const body of [
    { ...valid, email: "test@example.com\r\nBcc:x@example.com" },
    { ...valid, name: "Test\r\nInjected" },
    { ...valid, message: "short" },
    { ...valid, locale: "xx" },
    { ...valid, name: {} },
    { ...valid, interest: "unknown" },
  ]) {
    const d = deps();
    assert.equal((await handleContact(request(body), d)).status, 422);
    assert.equal(d.count, 0);
  }
});
test("cross-origin requests are rejected", async () => {
  const d = deps();
  assert.equal(
    (
      await handleContact(
        request(valid, { origin: "https://other.example" }),
        d,
      )
    ).status,
    403,
  );
  assert.equal(d.count, 0);
});
test("honeypot submissions never reach mail transport", async () => {
  const d = deps();
  assert.equal(
    (await handleContact(request({ ...valid, website: "bot.example" }), d))
      .status,
    200,
  );
  assert.equal(d.count, 0);
});
test("missing configuration produces an honest unavailable response", async () => {
  const r = await handleContact(request(), deps({ configured: false }));
  assert.equal(r.status, 503);
  assert.equal((await r.json()).code, "unavailable");
});
test("failed or missing CAPTCHA blocks delivery", async () => {
  for (const token of ["", "rejected"]) {
    const d = deps({ verify: async () => false });
    assert.equal(
      (await handleContact(request({ ...valid, token }), d)).status,
      422,
    );
    assert.equal(d.count, 0);
  }
});
test("mail failure cannot report success", async () => {
  const r = await handleContact(
    request(),
    deps({
      send: async () => {
        throw new Error("SMTP unavailable");
      },
    }),
  );
  assert.equal(r.status, 502);
  assert.equal((await r.json()).code, "error");
});
test("oversized request body is rejected", async () => {
  const d = deps();
  assert.equal(
    (await handleContact(request({ ...valid, message: "x".repeat(25000) }), d))
      .status,
    400,
  );
  assert.equal(d.count, 0);
});
test("CAPTCHA provider outage cannot send", async () => {
  const d = deps({
    verify: async () => {
      throw new Error("timeout");
    },
  });
  assert.equal((await handleContact(request(), d)).status, 502);
  assert.equal(d.count, 0);
});
