# Prasentace

Vícejazyčný firemní web v Astro. Světlý vlastní design, lokální variabilní font Manrope,
typografické logo a animace v CSS/SVG. Web nepoužívá fotografie, klientské reference
ani ukázky interních projektů. Obsah prezentuje dodávku kompletních řešení firmám.

## Spuštění

Vyžaduje Node.js >= 22.12 a Corepack. Autoritativní lockfile je `pnpm-lock.yaml`.

```bash
corepack pnpm install --frozen-lockfile
corepack pnpm dev --port 4322
```

Pro server na pozadí:

```bash
corepack pnpm exec astro dev --host 127.0.0.1 --port 4322 --background
corepack pnpm exec astro dev status
corepack pnpm exec astro dev logs
corepack pnpm exec astro dev stop
```

Lokální adresa: http://127.0.0.1:4322/. Bez nastavení e-mailu a CAPTCHA lze celý web
prohlížet; formulář s chybějícím veřejným klíčem je vypnutý a nabízí přímý e-mail.

Patička má jemné šedomodré pozadí přes celou šířku a dvouvrstvý horní stín bez
oddělovací linky. Její obsah zůstává zarovnaný se společným kontejnerem stránek.
Hlavní hlavička má bílé pozadí se 75% neprůhledností, rozostření pozadí 8 px
a jemný spodní stín místo spodní linky.

## Čitelnost a typografie

Velikosti běžných textů jsou řízené tokeny v `src/styles/global.css`: obsah
16–18 px, ovládací prvky 14–15 px a drobné popisky nejméně 12 px. Sekundární
text používá tmavší šedomodrou; základní řez má váhu 450. Kompaktní popisky
uvnitř animované ilustrace mají vlastní velikost. Navigace přechází do
mobilního menu při šířce 1100 px, aby se větší text vešel i v němčině.

## Architektura

```text
src/
  config/site.ts          značka, kontakt, sídlo, IČO, technologie
  locales/{cs,en,de}.json všechny jazykové texty včetně SEO a URL slugů
  i18n/index.ts          typování, URL helper, generátor cest
  components/
    ui/                  společné malé komponenty
    layout/              hlavička, patička, přepínač jazyků
    sections/            vizuál, služby, proces, výzva ke kontaktu
    forms/               kontaktní formulář
  views/                 společné šablony stránek
  layouts/BaseLayout     dokument, metadata, canonical, hreflang, JSON-LD
  pages/[...path].astro  jedna routa generující všech 33 obsahových URL
  pages/[locale]/404     společná jazyková šablona chyby
  pages/api/contact.ts   serverová PHP mailer a Turnstile integrace
  server/                validace a zpracování poptávky
  scripts/               menu, animace, klientský formulář
  styles/global.css     designové tokeny, komponenty, responzivita, pohyb
```

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
server na portu 4322, pokud již neběží. Kontroluje obsahové routy, SEO, jazykové
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

`src/utils/breadcrumbs.ts` je společný zdroj viditelné drobečkové navigace a
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

Každá služba má v `src/locales/{cs,en,de}.json` vlastní `seoTitle`. Společná
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
Favicon vychází ze stejného znaku. Vektorové soubory jsou vlastní kresba bez
externích obrázků a lze je škálovat i upravovat.

`src/styles/brand.css` definuje teplý papír, modrý inkoust, lososový akcent,
linkovaný sešit a drobné kreslené nedokonalosti. Kaňky jsou dekorativní, obsah
zůstává čitelný a animace respektují omezený pohyb. Texty příběhu značky jsou
ve všech třech locale souborech v sekci `brand`. Nabídka služeb, routing a kontakty
zůstávají řízené stávajícími daty.

Slogan v pruhu pod úvodem (`brand.formula`) používá školní humor: „Paní učitelko,
to není kaňka. To je design.“ Má odpovídající anglickou a německou verzi.

Červená tečka před úvodním sloganem jemně pulzuje v intervalu 2,8 s.
Při `prefers-reduced-motion: reduce` zůstává statická.

Úvodní ilustrace ekosystému nezobrazuje stavový popisek „Všechno spolu funguje.“
