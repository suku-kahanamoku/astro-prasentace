import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
const read = (locale) =>
  JSON.parse(
    readFileSync(
      new URL(`../src/locales/${locale}.json`, import.meta.url),
      "utf8",
    ),
  );
function shape(value, path = "") {
  if (Array.isArray(value))
    return value.map((item, index) => shape(item, `${path}.${index}`));
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, shape(value[key], path ? `${path}.${key}` : key)]),
    );
  assert.equal(typeof value, "string");
  assert.ok(
    value.trim() || path === "routes.home",
    `Empty translation: ${path}`,
  );
  return "string";
}
const base = read("cs");
for (const locale of ["cs", "en", "de"]) {
  const data = read(locale);
  assert.deepEqual(
    shape(data),
    shape(base),
    `${locale}: missing or incompatible translation`,
  );
  assert.deepEqual(
    data.solutions.items.map((s) => s.id),
    base.solutions.items.map((s) => s.id),
  );
  const paths = [
    ...Object.values(data.routes),
    ...data.solutions.items.map((s) => `${data.routes.solutions}/${s.slug}`),
  ];
  assert.equal(new Set(paths).size, paths.length, `${locale}: duplicate URL`);
  paths.forEach((path) => assert.match(path, /^[a-z0-9/-]*$/));
}
console.log(
  "CZ / EN / DE: translation structure, solution IDs and unique routes verified.",
);
