import { dictionary, url, type Locale, type PageId } from "@/i18n";

export interface Breadcrumb {
  name: string;
  href: string;
}

export function breadcrumbs(
  locale: Locale,
  page: PageId,
  solutionId?: string,
): Breadcrumb[] {
  if (page === "home") return [];
  const t = dictionary(locale);
  const label = page === "privacy" ? t.common.privacy : t.nav[page];
  const items = [
    { name: t.common.home, href: url(locale) },
    { name: label, href: url(locale, page) },
  ];
  if (solutionId) {
    const solution = t.solutions.items.find((item) => item.id === solutionId);
    if (!solution) throw new Error(`Unknown solution: ${solutionId}`);
    items.push({ name: solution.title, href: url(locale, page, solutionId) });
  }
  return items;
}
