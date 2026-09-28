import { test, expect } from "@playwright/test";
import { readTranslations } from "../../scripts/read-translations.mjs";
const dictionaries = Object.fromEntries(
  ["cs", "en", "de"].map((locale) => [locale, readTranslations(locale)]),
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
      const headingLevels = await page
        .locator("main h1, main h2, main h3, main h4")
        .evaluateAll((headings) =>
          headings.map((heading) => Number(heading.tagName.slice(1))),
        );
      for (let index = 1; index < headingLevels.length; index++) {
        expect(
          headingLevels[index],
          `${url}: heading hierarchy`,
        ).toBeLessThanOrEqual(headingLevels[index - 1] + 1);
      }
      await expect(
        page.locator(".language-picker summary"),
      ).toHaveAccessibleName(
        `${t.language}: ${locale === "cs" ? "CZ" : locale.toUpperCase()}`,
      );
      const graph = JSON.parse(
        await page.locator('script[type="application/ld+json"]').innerText(),
      );
      const organization = graph.find(
        (node: any) => node["@type"] === "Organization",
      );
      expect(organization.name).toBe("Prasentace");
      if (!path) {
        const website = graph.find((node: any) => node["@type"] === "WebSite");
        expect(website.name).toBe("Prasentace");
        expect(website.publisher["@id"]).toBe(organization["@id"]);
        await expect(page.locator(".breadcrumbs")).toHaveCount(0);
      } else {
        const breadcrumb = graph.find(
          (node: any) => node["@type"] === "BreadcrumbList",
        );
        const visibleNames = await page
          .locator(".breadcrumbs li")
          .allTextContents();
        expect(
          breadcrumb.itemListElement.map((item: any) => item.name),
        ).toEqual(visibleNames.map((name) => name.trim()));
        expect(breadcrumb.itemListElement.at(-1).item).toBe(
          `https://prasentace.cz${url}`,
        );
        expect(
          breadcrumb.itemListElement.map((item: any) => item.position),
        ).toEqual(visibleNames.map((_, index) => index + 1));
        await expect(
          page.locator('.breadcrumbs [aria-current="page"]'),
        ).toHaveCount(1);
      }
      await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
        "content",
        `https://prasentace.cz/social/og-${locale}.png`,
      );
      await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
        "content",
        "summary_large_image",
      );
      if (
        t.solutions.items.some(
          (item: { slug: string }) =>
            path === `${t.routes.solutions}/${item.slug}`,
        )
      ) {
        await expect(page.locator(".service-detail")).toHaveCount(3);
      }
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

test("menu closes outside its hover area but allows crossing to the dropdown", async ({
  page,
}) => {
  await page.setViewportSize({ width: 900, height: 900 });
  await page.goto("/");
  const toggle = page.locator("[data-menu-toggle]");
  const nav = page.locator("#mobile-navigation");
  await toggle.click();
  const buttonBox = (await toggle.boundingBox())!;
  const menuBox = (await nav.boundingBox())!;
  await page.mouse.move(
    buttonBox.x + buttonBox.width / 2,
    buttonBox.y + buttonBox.height + 2,
  );
  await page.mouse.move(buttonBox.x + buttonBox.width / 2, menuBox.y + 10);
  await page.waitForTimeout(250);
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await toggle.hover();
  await page.waitForTimeout(250);
  await expect(nav).toBeVisible();
  await page.mouse.move(10, menuBox.y + menuBox.height + 30);
  await expect(nav).toBeHidden();
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await toggle.focus();
  await page.keyboard.press("Enter");
  await page.dispatchEvent("main", "pointermove", { pointerType: "touch" });
  await page.waitForTimeout(250);
  await expect(nav).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(nav).toBeHidden();
});

test("touch tap outside closes the menu without swallowing the tap", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });
  const page = await context.newPage();
  await page.goto("/");
  const toggle = page.locator("[data-menu-toggle]");
  await toggle.tap();
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  const menuBox = (await page.locator("#mobile-navigation").boundingBox())!;
  await page.touchscreen.tap(10, menuBox.y + menuBox.height + 20);
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await expect(page.locator("#mobile-navigation")).toBeHidden();
  await context.close();
});

test("home, services and contact do not overflow on mobile, including German", async ({
  page,
}) => {
  test.setTimeout(90000);
  for (const width of [360, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const path of [
      "/",
      "/de/",
      "/de/loesungen/",
      "/de/kontakt/",
      "/reseni/",
      ...Object.entries(dictionaries).flatMap(([locale, t]) =>
        t.solutions.items.map(
          (item: { slug: string }) =>
            `/${locale === "cs" ? "" : `${locale}/`}${t.routes.solutions}/${item.slug}/`,
        ),
      ),
    ]) {
      await page.goto(path);
      await page.evaluate(() => document.fonts.ready);
      expect(
        await page.evaluate(() => getComputedStyle(document.body).fontFamily),
        `${path}: stylesheet loaded`,
      ).toContain("Manrope");
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
  await page.goto("http://127.0.0.1:4331/de/");
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
    headers: { origin: "http://127.0.0.1:4331" },
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

test("social images are real 1200 by 630 PNG files", async ({ request }) => {
  for (const locale of ["cs", "en", "de"]) {
    const response = await request.get(`/social/og-${locale}.png`);
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("image/png");
    const bytes = await response.body();
    expect(bytes.subarray(1, 4).toString()).toBe("PNG");
    expect(bytes.readUInt32BE(16)).toBe(1200);
    expect(bytes.readUInt32BE(20)).toBe(630);
  }
});

test("process step numbers have sufficient contrast", async ({ page }) => {
  await page.goto("/jak-pracujeme/");
  const contrast = await page
    .locator(".step-track span")
    .first()
    .evaluate((element) => {
      const luminance = (color: string) => {
        const channels = color
          .match(/[\d.]+/g)!
          .slice(0, 3)
          .map(Number)
          .map((value) => {
            const channel = value / 255;
            return channel <= 0.04045
              ? channel / 12.92
              : ((channel + 0.055) / 1.055) ** 2.4;
          });
        return (
          channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722
        );
      };
      const foreground = luminance(getComputedStyle(element).color);
      const background = luminance(
        getComputedStyle(element.closest(".process-section")!).backgroundColor,
      );
      return (
        (Math.max(foreground, background) + 0.05) /
        (Math.min(foreground, background) + 0.05)
      );
    });
  expect(contrast).toBeGreaterThanOrEqual(4.5);
});
