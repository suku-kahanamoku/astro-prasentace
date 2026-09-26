# Prasentace

- Udržujte veškerý jazykový obsah v `src/locales/{cs,en,de}.json`.
- Nedělejte kopie komponent nebo šablon pro jednotlivé jazyky. Používejte společná ID a helper `url()`.
- Kontaktní údaje a značku udržujte v `src/config/site.ts`.
- Design je světlý, typografický, bez fotografií a klientských referencí. Animace musí respektovat `prefers-reduced-motion`.
- Zachovejte přístupnost, použitelnost bez animací a jasné chybové stavy formuláře.
- Produkční SMTP ani CAPTCHA tajemství nevkládejte do klientských proměnných nebo repozitáře.
- Změny dokumentujte v README. Před dokončením spusťte `corepack pnpm build`, relevantní testy a formátování.
- Vývojový server spouštějte pomocí `corepack pnpm exec astro dev --host 127.0.0.1 --port 4321 --background` a spravujte přes `astro dev status/logs/stop`.
