import { test, expect } from "@playwright/test";

test("regular dev keeps live styles and scripts after changing language", async ({
  page,
}) => {
  const assetFailures: string[] = [];
  page.on("response", (response) => {
    if (
      ["stylesheet", "script", "font"].includes(
        response.request().resourceType(),
      ) &&
      response.status() >= 400
    )
      assetFailures.push(`${response.status()} ${response.url()}`);
  });
  page.on("requestfailed", (request) => {
    if (["stylesheet", "script", "font"].includes(request.resourceType()))
      assetFailures.push(`${request.failure()?.errorText} ${request.url()}`);
  });
  await page.goto("/");
  for (const locale of ["en", "de", "cs"]) {
    await page.locator(".language-picker summary").click();
    await page.locator(`.language-options [lang="${locale}"]`).click();
    await expect(page.locator("html")).toHaveAttribute("lang", locale);
    await expect(page.locator(".main-menu")).toHaveCSS("position", "sticky");
    await expect(page.locator(".header-inner")).toHaveCSS("display", "grid");
    // A dev page uses Vite's source styles, never a stale production CSS hash.
    await expect(
      page.locator('link[rel="stylesheet"][href^="/_astro/"]'),
    ).toHaveCount(0);
    const theme = page.locator(".theme-toggle");
    const previous = await page.locator("html").getAttribute("data-theme");
    await theme.click();
    await expect(page.locator("html")).not.toHaveAttribute(
      "data-theme",
      previous!,
    );
  }
  expect(assetFailures).toEqual([]);
});
