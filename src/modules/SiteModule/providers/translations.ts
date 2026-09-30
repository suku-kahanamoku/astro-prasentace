/**
 * Slovník textů obecných částí webu (SiteModule).
 *
 * SiteModule sdíží UIModule a LangModule, ale nesmí se importovat s
 * ContentModule ani ContactModule. Proto si skládá jen sdílený slovník
 * LangModule se svými texty a překlady přebírá přes props či callbacky.
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
 * Vrátí úplný slovník SiteModule pro daný jazyk.
 * @param locale Jazyk stránky.
 * @returns Sloučený slovník, v němž oddíl `common` prolufuje sdílený a lokální překlad.
 */
export function dictionary(locale: Locale) {
  const shared = sharedDictionary(locale);
  const local = own(locale);
  return { ...shared, ...local, common: { ...shared.common, ...local.common } };
}

/** Odtudovaný tvar struktury slovníku SiteModule. */
export type Dictionary = ReturnType<typeof dictionary>;
