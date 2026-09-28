import { dictionary } from "./translations";
import { type Locale } from "../../LangModule/providers/locale";
import { url, type PageId } from "../../../config/routes";

import type { Breadcrumb } from "../../UIModule/types";

export function breadcrumbs(
  locale: Locale,
  page: PageId,
  solutionId?: string,
  solutionTitle?: string,
): Breadcrumb[] {
  if (page === "home") return [];
  const t = dictionary(locale);
  const label = page === "privacy" ? t.common.privacy : t.nav[page];
  const items = [
    { name: t.common.home, href: url(locale) },
    { name: label, href: url(locale, page) },
  ];
  if (solutionId) {
    if (!solutionTitle)
      throw new Error(`Missing solution title: ${solutionId}`);
    items.push({ name: solutionTitle, href: url(locale, page, solutionId) });
  }
  return items;
}
