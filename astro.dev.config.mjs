import { defineConfig } from "astro/config";
import siteConfig from "./astro.config.mjs";

// Netlify's local redirect proxy can serve built HTML from dist while Vite
// serves source assets. Use Astro directly in development, including API routes.
// Production builds retain the Netlify adapter from astro.config.mjs.
export default defineConfig({
  ...siteConfig,
  adapter: undefined,
});
