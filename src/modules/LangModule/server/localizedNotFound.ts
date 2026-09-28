import { defineMiddleware } from "astro:middleware";

// Static production fallbacks are mirrored in netlify.toml; this covers the
// Astro development server and server-handled requests without redirecting.
export const localizedNotFound = defineMiddleware(async (context, next) => {
  const response = await next();
  const locale = context.url.pathname.split("/")[1];
  if (
    response.status !== 404 ||
    !["en", "de"].includes(locale) ||
    context.url.pathname === `/${locale}/404/`
  )
    return response;
  const localized = await context.rewrite(`/${locale}/404/`);
  return new Response(localized.body, {
    status: 404,
    headers: localized.headers,
  });
});
