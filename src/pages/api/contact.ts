import { createContactHandler } from "../../modules/ContactModule/server/contactHandler";
import { dictionary } from "../../modules/ContentModule/providers/translations";
export const prerender = false;
export const POST = createContactHandler(
  (locale, id) =>
    dictionary(locale).solutions.items.find((item) => item.id === id)?.title ||
    "—",
);
