import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
const dictionaries = Object.fromEntries(
  ["cs", "en", "de"].map((locale) => [
    locale,
    JSON.parse(
      readFileSync(
        new URL(`../../src/locales/${locale}.json`, import.meta.url),
        "utf8",
      ),
    ),
  ]),
);

test("all 33 localized pages have a unique title, canonical and matching language links", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const titles = new Set<string>();
  for (const [locale, t] of Object.entries(dictionaries)) {
    const prefix = locale === "cs" ? "" : `${locale}/`;
    const paths = [
      ...Object.values(t.routes),
      ...t.solutions.items.map(
        (item: { slug: string }) => `${t.routes.solutions}/${item.slug}`,
      ),
    ];
    for (const path of paths) {
      const url = `/${prefix}${path ? `${path}/` : ""}`;
      const response = await page.goto(url);
      expect(response?.status(), url).toBe(200);
      await expect(page.locator("html")).toHaveAttribute("lang", locale);
      await expect(page.locator("main h1")).toHaveCount(1);
      await expect(page.locator("link[rel=canonical]")).toHaveAttribute(
        "href",
        `https://prasentace.cz${url}`,
      );
      await expect(page.locator("link[rel=alternate]")).toHaveCount(4);
      titles.add(await page.title());
    }
  }
  expect(titles.size).toBe(33);
  expect(errors).toEqual([]);
});

test("language switch preserves solution identity", async ({ page }) => {
  await page.goto("/reseni/firemni-systemy/");
  await page.locator(".language-picker summary").click();
  await page.getByRole("link", { name: "Deutsch", exact: true }).click();
  await expect(page).toHaveURL(/\/de\/loesungen\/unternehmenssysteme\/$/);
  await expect(page.locator("main h1")).toHaveText("Unternehmenssysteme");
  await page.locator(".language-picker summary").click();
  await page.getByRole("link", { name: "English", exact: true }).click();
  await expect(page).toHaveURL(/\/en\/solutions\/business-systems\/$/);
});

test("mobile menu opens, closes with Escape and follows navigation", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const toggle = page.locator("[data-menu-toggle]");
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator("#mobile-navigation")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await expect(toggle).toBeFocused();
  await toggle.click();
  await page
    .locator("#mobile-navigation")
    .getByRole("link", { name: "Kontakt" })
    .click();
  await expect(page).toHaveURL(/\/kontakt\/$/);
});

test("home, services and contact do not overflow on mobile, including German", async ({
  page,
}) => {
  for (const width of [360, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const path of [
      "/",
      "/de/",
      "/de/loesungen/",
      "/de/kontakt/",
      "/reseni/",
    ]) {
      await page.goto(path);
      await page.evaluate(() => document.fonts.ready);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
        `${path} at ${width}px`,
      ).toBe(true);
    }
  }
});

test("reduced motion and no-JavaScript content remain usable", async ({
  browser,
}) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:4322/de/");
  await expect(page.locator("main h1")).toContainText("Ihre Vision.");
  await expect(page.locator(".solution-card")).toHaveCount(5);
  expect(
    await page
      .locator(".floating-card")
      .first()
      .evaluate((el) => getComputedStyle(el).animationName),
  ).toBe("none");
  await context.close();
});

test("invalid contact submissions are rejected before sending", async ({
  page,
  request,
}) => {
  await page.goto("/kontakt/");
  await expect(
    page.getByRole("link", { name: /info@prasentace.cz/ }).first(),
  ).toHaveAttribute("href", "mailto:info@prasentace.cz");
  const key = await page
    .locator("[data-contact-form]")
    .getAttribute("data-sitekey");
  if (key) await expect(page.locator("button[type=submit]")).toBeEnabled();
  else await expect(page.locator("button[type=submit]")).toBeDisabled();
  const response = await request.post("/api/contact/", {
    headers: { origin: "http://127.0.0.1:4322" },
    data: { name: "", email: "invalid", message: "short", locale: "cs" },
  });
  expect(response.status()).toBe(422);
  expect((await response.json()).code).toBe("invalid");
});

test("form validates, preserves content on failure and resets after acknowledged success", async ({
  page,
}) => {
  await page.route("**/kontakt/", async (route) => {
    const response = await route.fetch();
    const body = (await response.text())
      .replace(
        /data-sitekey(?:="[^"]*")?(?=\s|>)/,
        'data-sitekey="browser-test"',
      )
      .replace('type="submit" disabled', 'type="submit"');
    await route.fulfill({ response, body });
  });
  await page.route("https://challenges.cloudflare.com/**", (route) =>
    route.fulfill({
      contentType: "application/javascript",
      body: 'window.turnstile={render:(el,options)=>{window.testCaptcha=options;options.callback("mock-token");return "test";},reset:()=>{window.testCaptcha.callback("mock-token");}};window.prasentaceCaptchaReady();',
    }),
  );
  await page.goto("/kontakt/");
  const submit = page.locator("button[type=submit]");
  await expect(submit).toBeEnabled();
  await submit.click();
  await expect(page.locator("#name")).toHaveAttribute("aria-invalid", "true");
  await page.locator("#name").fill("Test User");
  await page.locator("#email").fill("test@example.com");
  await page.locator("#message").fill("We need a business application.");
  await page.route("**/api/contact/", (route) =>
    route.fulfill({ status: 502, json: { code: "error" } }),
  );
  await submit.click();
  await expect(page.locator("[data-form-status]")).toContainText("nepodařilo");
  await expect(page.locator("#message")).toHaveValue(
    "We need a business application.",
  );
  await page.unroute("**/api/contact/");
  await page.route("**/api/contact/", (route) =>
    route.fulfill({ status: 200, json: { code: "success" } }),
  );
  await submit.click();
  await expect(page.locator("[data-form-status]")).toContainText("Děkujeme");
  await expect(page.locator("#message")).toHaveValue("");
});

test("desktop and mobile visual captures", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({
    path: "test-results/home-desktop.png",
    fullPage: true,
    animations: "disabled",
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({
    path: "test-results/home-mobile.png",
    fullPage: true,
    animations: "disabled",
  });
});

test("missing pages preserve HTTP 404 and the requested language", async ({
  page,
}) => {
  for (const [locale, path] of [
    ["cs", "/neexistuje/"],
    ["en", "/en/missing-page/"],
    ["de", "/de/fehlt/"],
  ]) {
    const response = await page.goto(path);
    expect(response?.status()).toBe(404);
    await expect(page.locator("html")).toHaveAttribute("lang", locale);
    await expect(page.locator("main h1")).toHaveText(
      dictionaries[locale].notFound.title,
    );
    await expect(page.locator("meta[name=robots]")).toHaveAttribute(
      "content",
      "noindex, follow",
    );
  }
});
