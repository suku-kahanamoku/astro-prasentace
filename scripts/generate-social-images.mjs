import { chromium } from "@playwright/test";
import { readFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const fontRoot = resolve(root, "node_modules/@fontsource-variable/manrope");
let fontCss = await readFile(resolve(fontRoot, "index.css"), "utf8");
for (const match of [...fontCss.matchAll(/url\(([^)]+)\)/g)]) {
  const file = match[1].replace(/["']/g, "");
  const bytes = await readFile(resolve(fontRoot, file));
  fontCss = fontCss.replace(
    match[0],
    `url(data:font/woff2;base64,${bytes.toString("base64")})`,
  );
}
const escapeHtml = (value) =>
  value.replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ],
  );
const browser = await chromium.launch({ channel: "chrome" });
try {
  const page = await browser.newPage({
    viewport: { width: 1200, height: 630 },
    deviceScaleFactor: 1,
  });
  await page.route("**/*", (route) => route.abort());
  await mkdir(resolve(root, "public/social"), { recursive: true });
  for (const locale of ["cs", "en", "de"]) {
    const t = JSON.parse(
      await readFile(resolve(root, `src/locales/${locale}.json`), "utf8"),
    );
    await page.setContent(`<!doctype html><html lang="${locale}"><head><meta charset="utf-8"><style>
${fontCss}
*{box-sizing:border-box}body{margin:0;width:1200px;height:630px;overflow:hidden;font-family:'Manrope Variable',sans-serif;color:#182239;background:#f8faff}
.card{position:relative;margin:30px;padding:52px 58px;height:570px;border-radius:30px;background:linear-gradient(125deg,#fff 52%,#edf3ff);box-shadow:0 12px 40px #1822390c;overflow:hidden}
.brand{position:relative;font-size:42px;font-weight:750;letter-spacing:-2px;z-index:1}.dot{color:#3267df}
h1{position:relative;margin:38px 0 30px;font-size:61px;line-height:1.14;font-weight:650;letter-spacing:-2.5px;max-width:865px;z-index:1}
.services{position:relative;display:flex;gap:12px;z-index:1;flex-wrap:wrap}.services span{font-size:18px;font-weight:550;padding:12px 18px;background:#fff;border:1px solid #dfe7f4;border-radius:12px}
.line{position:absolute;bottom:44px;left:58px;width:68px;height:5px;background:#3267df;border-radius:4px}
.orbit{position:absolute;border:1px solid #3267df18;border-radius:50%;width:430px;height:430px;right:-190px;bottom:-210px}.orbit.second{width:570px;height:570px;right:-260px;bottom:-280px}.orbit.third{width:710px;height:710px;right:-330px;bottom:-350px}
</style></head><body><main class="card"><div class="brand">Prasentace<span class="dot">.</span></div><h1>${escapeHtml(t.seo.home.title)}</h1><div class="services">${t.solutions.items
      .slice(0, 3)
      .map((item) => `<span>${escapeHtml(item.title)}</span>`)
      .join(
        "",
      )}</div><div class="line"></div><div class="orbit"></div><div class="orbit second"></div><div class="orbit third"></div></main></body></html>`);
    await page.evaluate(() => document.fonts.ready);
    const fits = await page.evaluate(
      () =>
        document.querySelector(".services").getBoundingClientRect().bottom <
        515,
    );
    if (!fits) throw new Error(`Social image content overflows: ${locale}`);
    await page.screenshot({
      path: resolve(root, `public/social/og-${locale}.png`),
    });
    console.log(`Generated public/social/og-${locale}.png (1200 × 630)`);
  }
} finally {
  await browser.close();
}
