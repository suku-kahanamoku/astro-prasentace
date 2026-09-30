/**
 * Slovník obsahových textů ContentModule.
 *
 * Modul skládá sdílený slovník LangModule s vlastními texty sekcí, takže
 * ostatní moduly mohou přebírat `Dictionary` bez znalosti struktury obsahu.
 */
import cs from "../locales/cs.json";
import en from "../locales/en.json";
import de from "../locales/de.json";
import {
  createDictionary,
  type Locale,
} from "../../LangModule/providers/locale";
/** Mapování jazyků na lokální slovník modulu, odvozené z české verze. */
const own = createDictionary<typeof cs>({ cs, en, de });
import { dictionary as sharedDictionary } from "../../LangModule/providers/translations";

/**
 * Vrátí úplný slovník obsahového modulu pro daný jazyk.
 * @param locale Jazyk stránky.
 * @returns Sloučený slovník, v němž oddíl `common` prolufuje sdílený a lokální překlad.
 */
export function dictionary(locale: Locale) {
  const shared = sharedDictionary(locale);
  const local = own(locale);
  return { ...shared, ...local, common: { ...shared.common, ...local.common } };
}

/** Odtudovaný tvar struktury obsahového slovníku. */
export type Dictionary = ReturnType<typeof dictionary>;

/** Jedna nabízená kapacita včetně jejích SEO a obsahových částí. */
export type Solution = Dictionary["solutions"]["items"][number];
