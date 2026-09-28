import { defineConfig } from "astro/config";
import siteConfig from "./astro.config.mjs";

// Exercise Astro routes/handlers directly. Netlify's dev proxy can serve dist
// fallbacks and stale hashed CSS instead of the current source during tests.
export default defineConfig({
  ...siteConfig,
  adapter: undefined,
  devToolbar: { enabled: false },
  server: { host: "127.0.0.1", port: 4331 },
});
