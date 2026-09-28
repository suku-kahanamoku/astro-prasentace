import cs from "../locales/cs.json";
import en from "../locales/en.json";
import de from "../locales/de.json";
import { createDictionary } from "./locale";
const own = createDictionary<typeof cs>({ cs, en, de });
export const dictionary = own;
export type Dictionary = ReturnType<typeof dictionary>;
