import cs from "../locales/cs.json";
import en from "../locales/en.json";
import de from "../locales/de.json";
import {
  createDictionary,
  type Locale,
} from "../../LangModule/providers/locale";
const own = createDictionary<typeof cs>({ cs, en, de });
import { dictionary as sharedDictionary } from "../../LangModule/providers/translations";
export function dictionary(locale: Locale) {
  const shared = sharedDictionary(locale);
  const local = own(locale);
  return { ...shared, ...local, common: { ...shared.common, ...local.common } };
}
export type Dictionary = ReturnType<typeof dictionary>;
