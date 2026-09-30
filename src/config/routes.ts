/**
 * Centrální definice URL rout a jejich překladů.
 *
 * Slugy jednotlivých sekcí a řešení žijí v `src/config/locales/*.json`,
 * aby bylo možné lokalizovat i URL. Tento soubor je jediné místo, kde se ze
 * slugů skládají odkazy – komponenty i `getStaticPaths` volají `url()`/`allRoutes()`.
 */
import cs from "./locales/cs.json";
import en from "./locales/en.json";
import de from "./locales/de.json";
import {
  createDictionary,
  locales,
  type Locale,
} from "../modules/LangModule/providers/locale";

/**
 * Identifikátor jedné statické stránky; odvozen z klíčů českého překladu rout,
 * takže přidání sekce do `cs.json` automaticky rozšíří i tento typ.
 */
export type PageId = keyof typeof cs.routes;

/**
 * Překladový slovník rout pro všechny jazyky.
 * @param locale Jazyk, pro který chceme slugy.
 * @returns Objekt s `routes` a `solutions.items` v požadovaném jazyce.
 */
export const routeDictionary = createDictionary<typeof cs>({ cs, en, de });

/**
 * Sestaví lokalizovanou URL stránky.
 * @param locale - Jazyk verze stránky; `cs` jako výchozí jazyk nemá prefix.
 * @param page - Identifikátor stránky, výchozí `home` (kořen webu).
 * @param solutionId - Volitelné ID řešení pro detailní stránku řešení.
 * @returns Absolutní cesta se lomítkem na začátku i na konci (`"/kontakt/"`).
 * @throws Error Pokud je zadáno `solutionId`, které v překladu neexistuje.
 */
export function url(
  locale: Locale,
  page: PageId = "home",
  solutionId?: string,
): string {
  const t = routeDictionary(locale);
  const slug = solutionId
    ? t.solutions.items.find((item) => item.id === solutionId)?.slug
    : undefined;
  if (solutionId && !slug) throw new Error(`Unknown solution: ${solutionId}`);
  const segments = [locale === "cs" ? "" : locale, t.routes[page], slug].filter(
    Boolean,
  );
  return segments.length ? `/${segments.join("/")}/` : "/";
}

/**
 * Vytvoří kompletní sadu statických cest pro stránku `[...path]`.
 *
 * Každá routa existuje ve všech jazycích; pro každou sekci navíc vzniká
 * detailní stránka pro každé řešení. Prázdné path (`home` v češtině) se
 * předává jako `undefined`, aby Astro vygenerovalo kořenovou stránku.
 *
 * @returns Pole objektů `{ params, props }` pro `export const getStaticPaths`.
 * @throws Error Nepoužívá se – neplatné ID řešení se zde nevyskytuje.
 */
export function allRoutes() {
  return locales.flatMap((locale) => {
    const t = routeDictionary(locale);
    const pages = (Object.keys(t.routes) as PageId[]).map((page) => ({
      locale,
      page,
      solutionId: undefined as string | undefined,
    }));
    const details = t.solutions.items.map((item) => ({
      locale,
      page: "solutions" as const,
      solutionId: item.id,
    }));
    return [...pages, ...details].map((route) => ({
      params: {
        path:
          url(route.locale, route.page, route.solutionId).replace(
            /^\/|\/$/g,
            "",
          ) || undefined,
      },
      props: route,
    }));
  });
}
