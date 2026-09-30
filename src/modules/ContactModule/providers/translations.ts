/**
 * Slovník textů kontaktního modulu.
 *
 * ContactModule nesmí importovat ContentModule, proto si neskládá texty
 * kapacit (`solutions.items`) přímo. Místo toho přebírá sdílený slovník
 * LangModule a doplňuje ho vlastním oddílem `contact`; jazyk kontaktu
 * tak zůstává v jednom místě.
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
 * Vrátí úplný slovník modulu pro daný jazyk.
 * @param locale Jazyk stránky.
 * @returns Sloučený slovník, v němž oddíl `common` prolufuje sdílený a lokální překlad.
 */
export function dictionary(locale: Locale) {
  const shared = sharedDictionary(locale);
  const local = own(locale);
  return { ...shared, ...local, common: { ...shared.common, ...local.common } };
}

/** Odtudovaný tvar struktury slovníku modulu. */
export type Dictionary = ReturnType<typeof dictionary>;
