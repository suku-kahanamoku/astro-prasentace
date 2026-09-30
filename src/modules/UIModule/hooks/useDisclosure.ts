/**
 * Doplní nativní `<details>` o ovládání klávesnicí a kliknutím mimo prvek.
 *
 * Registruje globální listenery, které zavírají všechny otevřené rozbalovací
 * prvky odpovídající `selector`: klávesou Escape (a vrátí fokus na `<summary>`)
 * nebo kliknutím mimo prvek. Používá se například u přepínače jazyka.
 *
 * @param selector - CSS selektor rozbalovacích prvků, např. `".language-picker"`.
 * @returns `undefined`; odpojení listenerů zajišťuje celoživotnost stránky.
 */
export function useDisclosure(selector: string) {
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    document
      .querySelectorAll<HTMLDetailsElement>(`${selector}[open]`)
      .forEach((picker) => {
        picker.open = false;
        picker.querySelector("summary")?.focus();
      });
  });
  document.addEventListener("click", (event) => {
    document
      .querySelectorAll<HTMLDetailsElement>(`${selector}[open]`)
      .forEach((picker) => {
        if (event.target instanceof Node && !picker.contains(event.target))
          picker.open = false;
      });
  });
}
