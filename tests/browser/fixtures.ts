import { test as base, expect } from "@playwright/test";

// Keep local layout tests independent of the live map provider. The real
// Mapy.com embed is checked separately in a browser during integration work.
export const test = base.extend({
  context: async ({ context }, use) => {
    await context.route("https://mapy.com/s/**", (route) =>
      route.fulfill({
        contentType: "text/html",
        body: "<!doctype html><html><body>Mapy.com test frame</body></html>",
      }),
    );
    await use(context);
  },
});
export { expect };
