/**
 * Slovník sdílených jazykových textů LangModule.
 *
 * Obsahuje jen texty potřebné více modulům (názvy jazyků, hlavní navigace,
 * společné značky). Moduly si jej skládají se svým vlastním slovníkem
 * přes `createDictionary`, aby se závisející moduly navzájem neimportovaly.
 */
import cs from "../locales/cs.json";
import en from "../locales/en.json";
import de from "../locales/de.json";
import { createDictionary } from "./locale";

/** Mapování jazyků na sdílený slovník, odvozené z české verze. */
const own = createDictionary<typeof cs>({ cs, en, de });

/**
 * Výběr sdíleného překladu podle jazyka stránky.
 * @param locale Jazyk stránky.
 * @returns Objekt sdílených překladů pro daný jazyk.
 */
export const dictionary = own;

/** Odtudovaný tvar struktury sdíleného slovníku pro použití v typech propů. */
export type Dictionary = ReturnType<typeof dictionary>;
