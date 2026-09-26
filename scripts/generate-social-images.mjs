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
const mark = (await readFile(resolve(root, "public/brand/mark.svg"))).toString(
  "base64",
);
const ink = (await readFile(resolve(root, "public/brand/ink.svg"))).toString(
  "base64",
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
*{box-sizing:border-box}body{margin:0;width:1200px;height:630px;overflow:hidden;font-family:'Manrope Variable',sans-serif;color:#202b49;background:#faf7ef}
.card{position:relative;margin:28px;padding:44px 58px;height:574px;border:1px solid #dedbce;border-radius:4px 18px 8px 5px;background-color:#fffdf6;background-image:repeating-linear-gradient(transparent 0 31px,#253da410 31px 32px);box-shadow:5px 6px 0 #dedbce;overflow:hidden}
.brand{position:relative;display:flex;align-items:center;gap:12px;font-size:42px;font-weight:800;letter-spacing:-2px;z-index:1}.brand img{width:68px;height:68px}.dot{color:#ba503d}
h1{position:relative;margin:26px 0 26px;font-size:59px;line-height:1.16;font-weight:750;letter-spacing:-2.5px;max-width:910px;z-index:1}
.services{position:relative;display:flex;gap:12px;z-index:1;flex-wrap:wrap}.services span{font-size:17px;font-weight:550;padding:10px 16px;background:#fffdf6;border:1px solid #d7d2c2;border-radius:5px;box-shadow:2px 3px 0 #202b4908}
.promise{position:absolute;left:58px;bottom:38px;font-family:Georgia,serif;font-style:italic;font-size:25px;color:#253da4}
.ink{position:absolute;width:230px;height:auto;right:-30px;bottom:-50px;transform:rotate(-22deg)}
.tape{position:absolute;right:70px;top:10px;width:145px;height:26px;background:#e8d5bf88;transform:rotate(9deg)}
</style></head><body><main class="card"><span class="tape"></span><div class="brand"><img src="data:image/svg+xml;base64,${mark}" alt=""/>Prasentace<span class="dot">.</span></div><h1>${escapeHtml(t.seo.home.title)}</h1><div class="services">${t.solutions.items
      .slice(0, 3)
      .map((item) => `<span>${escapeHtml(item.title)}</span>`)
      .join(
        "",
      )}</div><div class="promise">${escapeHtml(t.brand.promise)}</div><img class="ink" src="data:image/svg+xml;base64,${ink}" alt=""/></main></body></html>`);
    await page.evaluate(() => document.fonts.ready);
    const fits = await page.evaluate(
      () =>
        document.querySelector(".services").getBoundingClientRect().bottom <
        490,
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
