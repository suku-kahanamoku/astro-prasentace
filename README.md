# Prasentace

Vícejazyčný firemní web v Astro. Vlastní světlý i tmavý design, lokální variabilní font Manrope,
typografické logo a animace v CSS/SVG. Web nepoužívá fotografie, klientské reference
ani ukázky interních projektů. Obsah prezentuje dodávku kompletních řešení firmám.

## Spuštění

Vyžaduje Node.js >= 22.12 a Corepack. Autoritativní lockfile je `pnpm-lock.yaml`.

```bash
corepack pnpm install --frozen-lockfile
corepack pnpm dev --port 4321
```

Pro server na pozadí:

```bash
corepack pnpm dev --port 4321 --background
corepack pnpm exec astro dev status
corepack pnpm exec astro dev logs
corepack pnpm exec astro dev stop
```

Lokální adresa: http://127.0.0.1:4321/. Bez nastavení e-mailu a CAPTCHA lze celý web
prohlížet; formulář s chybějícím veřejným klíčem je vypnutý a nabízí přímý e-mail.

Patička má jemné šedomodré pozadí přes celou šířku a dvouvrstvý horní stín bez
oddělovací linky. Její obsah zůstává zarovnaný se společným kontejnerem stránek.
Hlavní hlavička má bílé pozadí se 75% neprůhledností, rozostření pozadí 8 px
a jemný spodní stín místo spodní linky.

## Čitelnost a typografie

Velikosti běžných textů jsou řízené tokeny v `src/modules/UIModule/styles/theme.css`: obsah
16–18 px, ovládací prvky 14–15 px a drobné popisky nejméně 12 px. Sekundární
text používá tmavší šedomodrou; základní řez má váhu 450. Kompaktní popisky
uvnitř animované ilustrace mají vlastní velikost. Navigace přechází do
mobilního menu při šířce 1100 px, aby se větší text vešel i v němčině.

## Architektura

```text
src/
  config/site.ts             značka, kontakt, sídlo, IČO, technologie
  config/routes.ts           URL helper a generátor všech 33 obsahových rout
  config/locales/            přeložené slugy a stabilní ID služeb
  modules/
    UIModule/                tlačítka, ikony, breadcrumb UI, kontaktní odkazy, DOM hooks, theme
    LangModule/              locale helpery, společné texty, vlajky, přepínač, 404 middleware
    SiteModule/              hlavička, patička, značka, slogan, SEO, privacy a 404 obsah
    ContentModule/           hero, důkazy, služby/detail, proces, přístup, hodnoty, technologie, CTA
    ContactModule/           kontaktní sekce/formulář, klientská validace, server a PHP mailer
  layouts/BaseLayout.astro   kompozice dokumentu, společné navigace a obsahu
  pages/                     jediná vrstva rout a skládání sekcí
  pages/api/contact.ts       kompozice kontakt handleru a lokalizovaných názvů služeb
  middleware.ts              zapojení jazykového fallbacku
  styles/                    vstupy původní CSS kaskády
```

Každý modul vlastní potřebné `components`, `hooks`, `providers`, `locales`, `assets`, `styles`, případně `server` a `config`. Prázdné složky se nevytvářejí. Moduly nemají `pages`; všechny stránky skládá hlavní `src/pages`. Závislosti směřují do UIModule a LangModule, nikoli mezi funkčními moduly. UI neimportuje projektové překlady ani konfiguraci. Jazykový přepínač dostává tvorbu odkazu přes prop `href`.

Texty patří do `modules/<Name>Module/locales/{cs,en,de}.json`; společný slovník LangModule obsahuje jen sdílené názvy a ovládací texty. Modulový `providers/translations.ts` doplní vlastní texty o tuto společnou slovní zásobu. Žádný produkční modul nenačítá slovník jiného funkčního modulu. `scripts/read-translations.mjs` skládá slovníky pouze pro kontrolní nástroje a testy. `scripts/check-locales.mjs` kontroluje každý modul i původní obsahové invarianty.

Světlé i tmavé theme a společné styly jsou v `UIModule/styles`; styly sekcí patří do jejich modulů. Soubory v `src/styles` skládají CSS ve správném pořadí. Světlá paleta zůstává zachovaná, tmavé téma používá vlastní barevné proměnné. Nepřidává se daisyUI ani reklamní rám. Projekty nemají AdsModule ani reklamní integrace. Fonty, favicon a publikované obrázky se nadále vydávají na původních veřejných URL.

`tests/architecture.test.mjs` kontroluje povolené závislosti, cykly včetně cest přes konfiguraci, zákaz modulových `pages`, tranzitivní oddělení serverového kódu od browser hooků/providerů a nepřítomnost reklamních integrací. Nový modul přidejte do povoleného grafu v tomto testu. Hooky se spouštějí explicitně z komponent, které příslušnou interakci vlastní.

ContactModule dostává možnosti formuláře přes `interests` a překlad vybrané služby na serveru přes callback `createContactHandler()`. Proto nezávisí na ContentModule. API klíč, Turnstile tajemství, validace a odesílání zůstávají v `ContactModule/server`. Viditelné breadcrumbs a JSON-LD používají stejný helper v SiteModule; konkrétní název služby dodá hlavní stránka.

Astro předgeneruje obsah do HTML. Jen kontaktní endpoint běží na serveru přes
Netlify Functions. Tailwind 4 je zapojený přes Vite; design je definovaný vlastními
CSS tokeny a sdílenými komponentami. Veřejné stránky nepotřebují React/Vue runtime.
Fonty z `@fontsource-variable/manrope` se hostují lokálně; licence je součástí balíčku.

### Jazyky bez duplicitních šablon

Čeština je na `/`, angličtina na `/en/`, němčina na `/de/`. Obsah i přeložené slugy
jsou výhradně v JSON. Identifikátory služeb (`systems`, `web`, `mobile`, `automation`,
`support`) jsou stabilní napříč jazyky. Přepnutí jazyka zachová otevřenou službu.

```text
/reseni/firemni-systemy/
/en/solutions/business-systems/
/de/loesungen/unternehmenssysteme/
```

Odkazy sestavujte funkcí `url(locale, page, solutionId)`, nikoli ručně. Nové texty
doplňte do všech tří JSON souborů. `scripts/check-locales.mjs` ověřuje shodnou
strukturu, neprázdné texty, ID služeb a jedinečné URL. Samostatné HTML ve výstupu
pro každý jazyk není duplikací zdrojových komponent.

Navigace, názvy polí, validační hlášky, SEO, stránky o soukromí a 404 jsou přeložené.
Každá obsahová stránka má canonical, alternativy `cs/en/de` a `x-default`.
Sitemap a robots vznikají při buildu. Produkční doménu určuje `PUBLIC_SITE_URL`.

## Kontaktní formulář

Lokální `.env.development` vychází z Collegas: stejný PHP backend, interní klíč
na serveru a testovací Turnstile klíče. Identita webu je `https://prasentace.cz`,
odesílatel a příjemce `info@prasentace.cz`, název `Prasentace`.

| Proměnná               | Účel                                                |
| ---------------------- | --------------------------------------------------- |
| `PUBLIC_SITE_URL`      | Kanonická doména a identifikace tenantu PHP maileru |
| `PHP_API_BASE_URL`     | Stejný PHP backend jako Collegas                    |
| `INTERNAL_API_KEY`     | Serverový klíč pro `POST /mailer/send`              |
| `MAILING_FROM`         | Odesílatel i příjemce poptávky                      |
| `MAILING_FROM_NAME`    | Název odesílatele                                   |
| `MAILING_FROM_PHONE`   | Metadata odesílatele předávaná PHP maileru          |
| `TURNSTILE_SITE_KEY`   | Veřejný klíč widgetu přes Astro env schema          |
| `TURNSTILE_SECRET_KEY` | Serverový klíč pro Siteverify                       |

Astro ověří CAPTCHA a odešle poptávku do PHP s `X-Internal-Key` a
`X-Forwarded-Host` podle domény webu. PHP má vlastní mapování
`prasentace.cz:prasentace` a šablonu `emails/prasentace/contact-form-admin.php`.
SMTP zajišťuje existující PHP mailer; transport se nastavuje v PHP prostředí
pomocí `PRASENTACE_MAILER_*`. Astro už nemá vlastní SMTP klient.

Produkční Turnstile kontroluje úspěch, hostname a akci `contact`. Výchozí
[testovací klíče Cloudflare](https://developers.cloudflare.com/turnstile/troubleshooting/testing/)
vracejí testovací metadata, proto je výjimka pro tato metadata povolena pouze
s konkrétním testovacím klíčem, v režimu DEV a na loopback hostu. Testovací klíče
jsou v produkci odmítnuté. Kontrola Origin, honeypot, limit velikosti požadavku
a validace polí zůstávají aktivní. Příjemce i šablona jsou řízené serverem.

Úspěch se zobrazí až po úspěšné odpovědi PHP maileru. Chybné odeslání zachová
rozepsaný text a obnoví jednorázový CAPTCHA token. API bez konfigurace vrací 503.
Automatické testy neposílají skutečné zprávy. Doručení do schránky je třeba
ověřit odděleně od testů a ověření dostupnosti backendu.

## Kontroly

```bash
corepack pnpm check
corepack pnpm test
corepack pnpm test:browser
corepack pnpm build
corepack pnpm format:check
```

Testy v Node ověřují kritické chybové větve formuláře, včetně neplatných dat,
pokusů o vložení e-mailových hlaviček, CAPTCHA a SMTP výpadků, cizího Origin,
honeypotu a příliš velkého těla požadavku.

Playwright používá lokálně instalovaný Google Chrome (`channel: chrome`) a spustí
server na portu 4321, pokud již neběží. Kontroluje obsahové routy, SEO, jazykové
přepnutí, mobilní menu, horizontální přetékání při 360/390/768/1440 px, omezený
pohyb, obsah bez JavaScriptu a formulář s testovacími odpověďmi. Obrázky z kontroly
se ukládají do ignorovaného adresáře `test-results/`.

## Nasazení

Projekt je připravený pro Netlify konfigurací `netlify.toml`. Base directory nastavte
na tento projekt, pokud je v nadřazeném repozitáři. Build je `corepack pnpm build`,
výstup `dist`. PHP mailer a Turnstile proměnné nastavte pro Functions; veřejný Turnstile
klíč a doménu také pro build. Změna veřejného klíče vyžaduje nový build.

Před zveřejněním doplňte skutečné jméno provozovatele podnikající fyzické osoby do
identifikačních údajů; uživatel zatím dodal značku, IČO, sídlo a e-mail. Text
o soukromí je výchozí obsah a musí odpovídat finálnímu provozovateli, hostingu,
e-mailové službě a pravidlům uchovávání údajů. Žádná analytika není zapojená.

Pro lokální prohlížení používejte vývojový server. Netlify adapter nepodporuje
`astro preview`; produkční náhled patří do Netlify deploy preview.

Nasazení do produkce není součástí vytvoření lokálního projektu. Po připojení
domény ověřte reálné přijetí poptávky, 404 v každém jazyce, canonical a sitemap.

## Závislosti

Při aktualizaci používejte `corepack pnpm audit --prod` a opakujte build i relevantní
kontroly. `extract-zip` je tranzitivní závislost vývojového emulátoru Netlify
(`@netlify/functions-dev`); neslouží ke zpracování souborů návštěvníků. Registr
k 25. 9. 2026 uvádí dvě dosud neopravená bezpečnostní upozornění na zpracování
symlinků v archivech. Sledujte aktualizace Netlify adapteru. Aplikace žádné archivy
nepřijímá ani nerozbaluje.

Veřejný seznam technologií je společný pro všechny jazyky a stránky a spravuje se
v `src/config/site.ts`: Astro, Vue.js, Nuxt, React Native, Angular a PHP.

Telefon Prasentace `+420 722 767 646` je uložený v `src/config/site.ts`. Kontaktní
stránka jej ve všech jazycích zobrazuje s odkazem `tel:+420722767646`; stejný údaj
používají strukturovaná data webu.

Popisky e-mailu, telefonu a sídla používají existující společnou komponentu
`Icon.astro` s ikonami `mail`, `mobile` a `globe`.

Popisky e-mailu, telefonu a sídla sdílejí styl `eyebrow contact-label`, včetně barvy a typografie.

E-mail a telefon mají stejnou velikost písma a barvu jako adresa, včetně mobilního zobrazení; odkazy `mailto:` a `tel:` zůstávají aktivní a zobrazují se bez šipek napravo.

## SEO a přístupnost (opravy auditu 25. 9. 2026)

Detaily všech pěti služeb obsahují tři další tematické sekce ve všech jazycích.
Texty jsou v `solutions.items[].sections` v locale JSON; sdílená šablona je vykresluje
bez duplikace stránek. Nadpisy karet řešení a kroků mění úroveň podle kontextu.
Nadpisy detailů dovolují dělení dlouhých slov, čísla kroků mají vyšší kontrast a
přístupný název přepínače jazyků obsahuje viditelný kód jazyka. Formulář dovoluje
zmenšení v gridu, takže ani delší německé volby neroztahují mobilní stránku.

`src/modules/SiteModule/providers/breadcrumbs.ts` je společný zdroj viditelné drobečkové navigace a
`BreadcrumbList` JSON-LD. Navigace se nezobrazuje na homepage ani chybových stránkách.
Homepage přidává `WebSite` propojený s `Organization`. Všechny absolutní SEO URL
nadále vycházejí z `PUBLIC_SITE_URL`; před produkčním přechodem je třeba tuto
proměnnou a domény hostingu správně nastavit.

Open Graph a Twitter používají lokalizované PNG karty 1200 × 630 z `public/social`.
Karty jsou typografické, bez fotografií. Po změně textu homepage nebo designu je lze
znovu vytvořit příkazem `corepack pnpm generate:social` (vyžaduje lokální Chrome).
Generátor používá lokální font Manrope a překlady; žádné externí obrázky ani síťové
požadavky. PNG jsou součástí repozitáře, běžný build prohlížeč nepotřebuje.

### Produkční doména a titulky služeb

`netlify.toml` trvale přesměrovává HTTP i HTTPS adresy na přesném hostu
`prasentace.netlify.app` na `https://prasentace.cz` pomocí 301. Pravidla zachovávají
cestu i parametry dotazu a mají přednost před existujícími soubory a jazykovými
404 fallbacky. Deploy preview adres se netýkají. Změna se projeví až po nasazení.

Každá služba má v `src/modules/ContentModule/locales/{cs,en,de}.json` vlastní `seoTitle`. Společná
stránková šablona jej předává do layoutu pro HTML title a sociální metadata.
Krátký `title` se nadále používá pro viditelné nadpisy, navigaci a formulář.

### Ověření v Google Search Console

Pro kontrolu je nutný přístup k ověřené službě `prasentace.cz` v Search Console.
Pokud služba ještě není založená, na https://search.google.com/search-console/
zvolte **Přidat službu → Doména**, zadejte `prasentace.cz` bez protokolu a ověřte
vlastnictví. Pokud Google nabídne TXT záznam, přidejte jeho přesnou hodnotu do DNS
u FORPSI pro kořen domény. Existující Google ověřovací záznamy ponechte; starší
záznam může patřit jinému účtu. Nameservery se nemění. Po propsání TXT klikněte
na **Ověřit**. [Postup Google](https://support.google.com/webmasters/answer/9008080?hl=cs).

Veřejně dostupná sitemap ani DNS ověřovací TXT nepotvrzují přijetí sitemapy
nebo skutečnou indexaci v účtu Google.

1. V **Soubory Sitemap** ověřte nebo odešlete
   `https://prasentace.cz/sitemap-index.xml`. Zaznamenejte stav, poslední načtení
   a počet objevených stránek (aktuální web má 33 obsahových URL).
2. V **Indexování stránek** ověřte počty indexovaných a neindexovaných URL
   a konkrétní důvody vyloučení. Počet indexovaných stránek se může lišit
   od počtu URL v sitemapě a ne každé vyloučení je chyba.
3. V **Kontrola adresy URL** prověřte homepage a stránky služeb v CS/EN/DE:
   indexaci, poslední procházení, uživatelem deklarovanou kanonickou adresu
   a kanonickou adresu vybranou Googlem. Očekávaná canonical je vlastní
   adresa dané stránky na `https://prasentace.cz/`.
4. Živý test potvrzuje aktuální dostupnost pro Google, nikoli zařazení do indexu
   ani canonical vybranou Googlem. Ty kontrolujte v datech indexované verze.

Výsledky z účtu Search Console zatím nejsou ověřené. Změny v projektu samy
neodešlou sitemapu do Search Console ani nevyvolají indexaci.

## Vizuální identita Prasentace

Značka propojuje prezentaci a prase: znak v `public/brand/mark.svg` kombinuje
prezentační snímek s předsazenou dlaždicí P. Lososový detail uvnitř snímku
připomíná rypáček, dvě modré tečky o poloměru 3,4 těsně nad ním tvoří oči; prasátko je až druhou, nenápadnou vrstvou znaku. `BrandLogo.astro` je společné logo hlavičky a patičky.
Favicon používá pouze světlé písmeno P na modré zaoblené dlaždici převzaté z loga. Vektorové soubory jsou vlastní kresba bez
externích obrázků a lze je škálovat i upravovat.

Vstup `src/styles/brand.css` skládá modulové styly definující teplý papír, modrý inkoust, lososový akcent,
linkovaný sešit a drobné kreslené nedokonalosti. Kaňky jsou dekorativní, obsah
zůstává čitelný a animace respektují omezený pohyb. Texty příběhu značky jsou
ve všech třech locale souborech v sekci `brand`. Nabídka služeb, routing a kontakty
zůstávají řízené stávajícími daty.

Slogan v pruhu pod úvodem (`brand.formula`) používá školní humor: „Paní učitelko,
to není kaňka. To je design.“ Má odpovídající anglickou a německou verzi.

Červená tečka před úvodním sloganem jemně pulzuje v intervalu 2,8 s.
Při `prefers-reduced-motion: reduce` zůstává statická.

Úvodní ilustrace ekosystému nezobrazuje stavový popisek „Všechno spolu funguje.“

Sešit s údajem 10+ má jemně potrhaný horní okraj vytvořený pomocí CSS `clip-path`.

Přepínač jazyků zobrazuje lokální SVG vlajky z `src/modules/LangModule/assets/flags` (veřejné `/flags/` URL zůstávají dostupné) (CZ, GB pro angličtinu,
DE), bez knihovny a externích požadavků. Odkazy mají přístupné názvy jazyků a tooltipy.

Vybraná vlajka vyplňuje celý kruhový odznak o velikosti 24 × 24 px pomocí `object-fit: cover` a ořezu
přes `overflow: hidden`; SVG šipka je s ní svisle vycentrovaná.

Pořadí akcí hlavičky: Probrat projekt → přepínač jazyků → mobilní menu.

Kontaktní formulář připomíná linkovaný sešit s červeným okrajem, perforací a vrstvami
papíru. Pole mají psací linky, zpráva více řádků; zachovány jsou popisky, focus
i chybové stavy. Na mobilu se okraj a odsazení zmenšují.

Hamburger má dvě shodné čárky a přes `aria-expanded` se plynule mění na křížek;
respektuje omezený pohyb. Šikmé šipky jsou vyhrazené odkazům na cizí weby,
proto nejsou v interní navigaci, kartách služeb ani dekorativních popiscích.

Přepínač jazyků i selecty sdílejí `DisclosureChevron.astro`: zavřené míří doprava,
otevřené dolů s přechodem 280 ms. Select používá skutečný stav CSS `:open`,
nikoliv pouhý focus. `prefers-reduced-motion` přechod vypíná.

Focus formulářových polí zvýrazňuje pouze spodní linku bez obdélníkového rámečku.
Chybová pole zachovávají červené zvýraznění i při focusu.

Kontaktní formulář je do šířky 767 px (včetně sm) pod kontaktními údaji a sídlem.
Od 768 px zůstává rozložení ve dvou sloupcích.

Turnstile používá `appearance: "interaction-only"`: ověřování běží na pozadí
a widget se zobrazí jen při potřebě interakce. Pro produkční widget používejte režim
Managed v Cloudflare. Ověření tokenu na serveru zůstává povinné.
Viz [konfigurace Turnstile](https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/widget-configurations/).

Odznak vlajky má jemný vypouklý vzhled pomocí odlesku a vnitřního stínu.
Mezera mezi odznakem a šipkou je 4 px.

Kontakty používají `ProtectedContact.astro`: HTML rozděluje text po znacích a cíl
odkazu kóduje, JavaScript obnoví běžné `mailto:`/`tel:` odkazy. Bez JavaScriptu
jsou údaje stále čitelné a kopírovatelné. Přímé kopie nejsou v JSON-LD, SEO
popisech ani formulářových hláškách. Jde o omezení jednoduchého sběru kontaktů,
nikoliv utajení: roboti schopní parsovat DOM nebo spouštět JavaScript je získat mohou.

Čumáček z loga je samostatně v `public/brand/snout.svg` a nahrazuje hvězdičku
v pruhu se sloganem na homepage. Zachovává původní tvar i barvy loga.

Rozbalené mobilní menu se zavře po odjetí myši mimo tlačítko i nabídku.
Prodleva 180 ms umožní překonat mezeru mezi nimi; dotykové pohyby menu nezavírají.

Menu se zavírá také kliknutím nebo klepnutím mimo nabídku a hamburger, bez blokování cílového odkazu.

### Produkční Turnstile pro Prasentace

Widget `Prasentace` je spravovaný v Cloudflare účtu profilu Wrangler
`prasentace` (účet `7c9935c0654d95b8ffc10467d3b0d75f`). Používá režim
`managed` a povolené domény `prasentace.cz`, `www.prasentace.cz` a
`prasentace.netlify.app`. Formulář jej vykresluje s `appearance: interaction-only`.

Produkční konfigurace je lokálně uložená v ignorovaném `.env.production`.
Stejné proměnné jsou nastavené také v Netlify projektu `prasentace`
(`7f6216a5-a79e-4f06-82f9-90f4cd56b1f6`):
`TURNSTILE_SITE_KEY` pro build, `TURNSTILE_SECRET_KEY` a nastavení PHP maileru
pro serverové funkce. Samotný lokální soubor prostředí do Netlify přes Git
neputuje. Po změně veřejného klíče je nutné nové sestavení webu.
Lokální `.env.development` nadále používá testovací CAPTCHA klíče a lokální PHP.
Tajné klíče nikdy nekopírovat do repozitáře nebo veřejného klientského kódu.

## Ověření modulového refaktoringu

Před a po rozdělení byly porovnány všechny 33 obsahové URL ve třech jazycích při šířkách 390 a 1440 px: 66 celostránkových snímků se shoduje pixel po pixelu, stejně jako texty, odkazy a metadata. Vývojářský toolbar je při porovnání odstraněn. Reklamy se nepřidávají.

```sh
corepack pnpm test
corepack pnpm build
corepack pnpm test:browser
corepack pnpm format:check
```

Běžný `npm run dev` (nebo `corepack pnpm dev`) používá `astro.dev.config.mjs`: sdílí konfiguraci webu, ale nezapojuje lokální Netlify proxy. Ta může přes produkční pravidla `/en/*` a `/de/*` vracet HTML z `dist` odkazující na nedostupné hashované CSS. Astro při vývoji obsluhuje stránky i API přímo. Browser testy spouštějí tentýž příkaz na odděleném portu 4331 a ověřují načtení stylů i funkčnost skriptů po přepnutí jazyka. Při přímém spuštění Astro CLI použijte `astro dev --config astro.dev.config.mjs`. Produkční `astro.config.mjs`, Netlify adaptér a přesměrování zůstávají zachované a ověřuje je produkční build. Testy formuláře používají mock CAPTCHA a mock odpovědi API; nepotvrzují doručení skutečného e-mailu.

## Světlé a tmavé téma

- `UIModule/config/theme.ts` definuje názvy obou témat, barvu prohlížeče a vlastní klíč úložiště projektu.
- `UIModule/components/ThemeInit.astro` nastavuje téma v hlavičce před vykreslením obsahu. `ThemeToggle.astro` je přístupné tlačítko se sluncem/měsícem bez rámečku, pozadí nebo stínu; při ovládání klávesnicí má viditelný focus.
- `UIModule/hooks/useTheme.ts` ukládá ruční volbu a synchronizuje záložky. Bez platné uložené volby sleduje `prefers-color-scheme` včetně změn za běhu. Chyba úložiště přepnutí nezablokuje; bez JavaScriptu zůstává výchozí světlá stránka a tlačítko je skryté.
- Každý modul vlastní styly svých komponent. Sdílené proměnné `--theme-*` a případné daisyUI tokeny dodává UIModule; modul si může přidat vlastní proměnné a tmavé varianty pod `[data-theme-mode="dark"]`. Původní světlé barvy zůstávají ve fallback hodnotách. Nepoužívejte plošné invertování obrázků ani barev.
- Automatický režim se obnoví smazáním projektového klíče z `localStorage`; přepínač v menu nabízí ruční světlou/tmavou volbu.
- `tests/browser/theme.spec.ts` ověřuje systémovou i uloženou volbu, synchronizaci záložek, zakázané úložiště, klávesnici, jazyky, responzivitu a podobu tlačítka. Backendové scénáře browser testů používají mock, nikoli produkční služby.

Přepínač tématu a jazyků tvoří v hlavičce společnou skupinu s mezerou 8 px; téma je bezprostředně nalevo od vlajky.

## Společné hlavní menu

Rozložení hlavičky vlastní `src/modules/UIModule/components/MainMenu.astro`, styly `UIModule/styles/main-menu.css` a chování `useMainMenu`, `useNavigation` a `useHeaderOffset`. Tato komponenta a její rozložení jsou shodné v projektech astro-scaffold, astro-etymolog, astro-prasentace a astro-sorry-jako. Repozitáře zůstávají samostatné a neimportují soubory sousedních projektů.

`SiteModule/components/Header.astro` je pouze projektová kompozice:

- `items` definuje hlavní odkazy (`href`, `label`, volitelně `current`); `mobileItems` navíc obsahuje přihlášení nebo hlavní akci.
- Slot `brand` obsahuje logo, slot `language` jazykový přepínač a slot `action` přihlášení nebo výrazné CTA. `locale` předává jazyk přepínači tématu z UIModule, `label` pojmenovává navigaci. Volitelné `openLabel`/`closeLabel` pojmenovávají hamburger.
- Desktop od 1280 px používá tři sloupce: logo vlevo, navigace přesně uprostřed, akce vpravo v pořadí téma → jazyk → hlavní akce. Mezi tématem a jazykem je 8 px.
- Pod 1280 px přechází navigace do hamburgeru. Pod 768 px se hlavní akce přesune do mobilních odkazů. Funguje Escape, kliknutí mimo, zavření po výběru odkazu, změna šířky i navigace bez JavaScriptu.
- `framed` zapojuje hlavičku do existujícího subgridu stránky (Scaffold/Etymolog); nezapíná reklamy. `showAction={false}` skryje volitelnou akci i její prostor.
- Projektové barvy se upravují pomocí `--menu-background`, `--menu-panel`, `--menu-link`, `--menu-accent` a `--menu-border` ve stylech SiteModule. Logo si zachovává vlastní brand styly. Rozložení se v SiteModule znovu nedefinuje.

Při založení dalšího projektu použijte Scaffold jako šablonu a zachovejte MainMenu i jeho UI závislosti. Měňte pouze značku, data odkazů, překlady a slot hlavní akce v projektové hlavičce. Při změně společného rozložení přeneste stejné soubory UIModule do ostatních samostatných projektů. `tests/browser/main-menu.spec.ts` hlídá centrování, pořadí, rozestupy, překryvy a přechod mezi desktopem a hamburgerem.

## Lokalizované URL

URL slugy jsou v `src/config/locales/{cs,en,de}.json`; stabilní ID a tvorbu odkazů spravuje `src/config/routes.ts`. Nové odkazy skládejte helpery, nikoli ručně. Překlady textů zůstávají v jednotlivých modulech.

Existující překlady stránek i detailů řešení zůstávají zachované. `url(locale, page, solutionId)` vytváří odkazy, `allRoutes()` z téže mapy generuje stránky. Například `/kontakt/`, `/en/contact/`, `/de/kontakt/`. Stejný vzor používají i ostatní Astro projekty.
