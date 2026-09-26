import { defineConfig, envField } from "astro/config";
import netlify from "@astrojs/netlify";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  server: { port: 4321 },
  site: process.env.PUBLIC_SITE_URL || "https://prasentace.cz",
  output: "static",
  adapter: netlify({ devFeatures: { edgeFunctions: false } }),
  trailingSlash: "always",
  env: {
    schema: {
      TURNSTILE_SITE_KEY: envField.string({
        access: "public",
        context: "client",
        optional: true,
      }),
      TURNSTILE_SECRET_KEY: envField.string({
        access: "secret",
        context: "server",
        optional: true,
      }),
    },
  },
  i18n: {
    defaultLocale: "cs",
    locales: ["cs", "en", "de"],
    routing: { prefixDefaultLocale: false },
  },
  integrations: [sitemap({ filter: (url) => !url.includes("/404/") })],
  vite: { plugins: [tailwindcss()] },
});
