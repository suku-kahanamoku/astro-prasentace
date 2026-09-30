import { dictionary } from "./translations";
import { type Locale } from "../../LangModule/providers/locale";
import { url, type PageId } from "../../../config/routes";

import type { Breadcrumb } from "../../UIModule/types";

/**
 * Sestavení „drobečkové cesty“ pro aktuální stránku.
 *
 * Cesta se skládá vždy z domovské stránky a aktuální sekce; u detailu
 * kapacity se přidá třetí úroveň. Domovská stránka cestu nemá, proto vrací
 * prázdné pole a šablona breadcrumbs vůbec nevypisuje.
 *
 * Názvy sekcí se přebírají ze slovníku; výjimkou je sekce `privacy`, která
 * používá společný překlad stejně jako odkaz v patičce.
 *
 * @param locale - Jazyk stránky.
 * @param page - Sekce, pro kterou se cesta skládá.
 * @param solutionId - Volitelné ID kapacity pro třetí úroveň.
 * @param solutionTitle - Název kapacity, musí být předán spolu s `solutionId`.
 * @returns Položky cesty od kořene k aktuální stránce; prázdné pole pro domovskou stránku.
 * @throws Error Pokud je zadáno `solutionId` bez `solutionTitle`.
 */
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
