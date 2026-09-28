import { readdirSync, readFileSync, existsSync } from "node:fs";
import assert from "node:assert/strict";
const modules = new URL("../src/modules/", import.meta.url);
export function readModule(module, locale) {
  return JSON.parse(
    readFileSync(new URL(`${module}/locales/${locale}.json`, modules), "utf8"),
  );
}
export function readTranslations(locale) {
  /** @type {Record<string, any>} */
  const output = {};
  const merge = (target, data) => {
    for (const [key, value] of Object.entries(data)) {
      if (value && typeof value === "object" && !Array.isArray(value))
        merge((target[key] ??= {}), value);
      else {
        assert.ok(!(key in target), `Duplicate translation: ${key}`);
        target[key] = value;
      }
    }
  };
  for (const module of readdirSync(modules))
    if (existsSync(new URL(`${module}/locales/`, modules)))
      merge(output, readModule(module, locale));
  const routes = new URL(
    `../src/config/locales/${locale}.json`,
    import.meta.url,
  );
  if (existsSync(routes)) {
    const config = JSON.parse(readFileSync(routes, "utf8"));
    output.routes = config.routes;
    output.solutions.items = output.solutions.items.map((item) => ({
      ...item,
      slug: config.solutions.items.find((route) => route.id === item.id)?.slug,
    }));
  }
  return output;
}
