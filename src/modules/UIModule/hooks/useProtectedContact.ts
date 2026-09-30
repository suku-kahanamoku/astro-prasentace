/**
 * Oživí kontaktní údaje zakódované v atributech `data-protected-contact`.
 *
 * Server vypíše jen znaky jednotlivě a cílovou adresu uloží v base64, aby
 * se kontaktní údaje neobjevily v surovém HTML. Tento hook je nahradí
 * funkčním odkazem v klientu. Hodnoty, které nejsou `mailto:` ani `tel:`,
 * se záměrně ignorují, aby se přes data atribut nedala vložit cizí URL.
 *
 * @returns `undefined`; běží jednou po načtení stránky.
 */
export function useProtectedContact() {
  document
    .querySelectorAll<HTMLElement>("[data-protected-contact]")
    .forEach((element) => {
      const href = atob(element.dataset.protectedContact || "");
      if (!href.startsWith("mailto:") && !href.startsWith("tel:")) return;
      const link = document.createElement("a");
      link.href = href;
      link.className = element.className;
      link.textContent = element.textContent?.trim() || "";
      element.replaceWith(link);
    });
}
