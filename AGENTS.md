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
