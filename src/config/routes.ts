import cs from "./locales/cs.json";
import en from "./locales/en.json";
import de from "./locales/de.json";
import {
  createDictionary,
  locales,
  type Locale,
} from "../modules/LangModule/providers/locale";
export type PageId = keyof typeof cs.routes;
export const routeDictionary = createDictionary<typeof cs>({ cs, en, de });
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
