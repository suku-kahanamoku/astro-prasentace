# Prasentace

- Udržujte veškerý jazykový obsah v `src/modules/<Name>Module/locales/{cs,en,de}.json`; URL slugy patří do `src/config/locales`.
- Nedělejte kopie komponent nebo šablon pro jednotlivé jazyky. Používejte společná ID a helper `url()`.
- Kontaktní údaje a značku udržujte v `src/config/site.ts`.
- Design je světlý, typografický, bez fotografií a klientských referencí. Animace musí respektovat `prefers-reduced-motion`.
- Zachovejte přístupnost, použitelnost bez animací a jasné chybové stavy formuláře.
- Produkční SMTP ani CAPTCHA tajemství nevkládejte do klientských proměnných nebo repozitáře.
- Změny dokumentujte v README. Před dokončením spusťte `corepack pnpm build`, relevantní testy a formátování.
- Vývojový server spouštějte pomocí `corepack pnpm dev --port 4321 --background` a spravujte přes `astro dev status/logs/stop`.

- Zachovejte současnou grafiku a nepřidávejte reklamy ani AdsModule.
- Moduly vlastní potřebné assets/locales/hooks/components/providers/server/styles/config; nikdy nemají pages. Sekce skládá hlavní `src/pages`.
- UIModule je nezávislý základ, LangModule může používat UI. SiteModule, ContentModule a ContactModule sdílejí UI/Lang a potřebnou projektovou konfiguraci, ale neimportují se navzájem.
- Formulář dostává nabídku služeb přes props, serverový handler přes callback. Serverová tajemství nikdy nepatří do společného klientského barrel exportu.
- Běžný vývoj i browser testy používají `npm run dev` s `astro.dev.config.mjs` bez Netlify proxy; testy běží na odděleném portu 4331. Při přímém použití Astro CLI vždy předejte `--config astro.dev.config.mjs`. Produkční build používá `astro.config.mjs` s Netlify adaptérem.

## graphify

The project code graph is at `graphify-out/graph.json`. It is a navigation aid; verify findings in the source files. Graphify may parse `.astro` components only partially, so inspect the relevant `.astro` templates directly after locating them through the graph.

- When the user types `$graphify`, use the installed Graphify skill.
- For every codebase task, start from this project's root and use a targeted `graphify query "<question>"`. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. Inspect only relevant source files identified by the graph. Do not scan, list, or read all project files to discover the structure. If the query misses, refine it with code symbols or use a narrowly scoped search.
- If code may have changed since the graph was built, run `graphify update .` before relying on graph results. After every completed code change, including additions, deletions, and renames, run `graphify update .` before another graph query or the final response. Do not leave changed code with a stale graph.
- Generated files in `graphify-out/` may change after updates; this is expected. If `graphify-out/wiki/index.md` exists, use it for broad navigation. Read `graphify-out/GRAPH_REPORT.md` for broad architecture review or when targeted queries are insufficient.
- If the task concerns a wrong or stale graph, diagnose the graph against source files. If the user explicitly asks not to use Graphify, follow that request.
