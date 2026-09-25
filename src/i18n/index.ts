import cs from "@/locales/cs.json";
import en from "@/locales/en.json";
import de from "@/locales/de.json";

export const locales = ["cs", "en", "de"] as const;
export type Locale = (typeof locales)[number];
export type Dictionary = typeof cs;
export type PageId = keyof Dictionary["routes"];
export type Solution = Dictionary["solutions"]["items"][number];
const dictionaries: Record<Locale, Dictionary> = { cs, en, de };
export const dictionary = (locale: Locale): Dictionary => dictionaries[locale];
export const isLocale = (value: unknown): value is Locale =>
  locales.includes(value as Locale);

export function url(
  locale: Locale,
  page: PageId = "home",
  solutionId?: string,
): string {
  const t = dictionary(locale);
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
    const t = dictionary(locale);
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
