/**
 * Postupné odhalení obsahu při scrollování.
 *
 * Prvky s `data-reveal` ležící pod hranicí viewportu dostanou třídu
 * `reveal-pending` a po vstupu do viditelné oblasti ji strhnou, což spustí
 * CSS animaci. Prvky už viditelné při načtení se neanimují vůbec.
 * Při `prefers-reduced-motion` nebo chybějící podpoře `IntersectionObserver`
 * se animace úplně přeskočí, aby obsah zůstal čitelný bez pohybu.
 *
 * @returns `undefined`; běží jednou po načtení stránky.
 */
export function useReveal() {
  if (
    !matchMedia("(prefers-reduced-motion: reduce)").matches &&
    "IntersectionObserver" in window
  ) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.remove("reveal-pending");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08 },
    );
    document
      .querySelectorAll<HTMLElement>("[data-reveal]")
      .forEach((element) => {
        if (element.getBoundingClientRect().top > innerHeight) {
          element.classList.add("reveal-pending");
          observer.observe(element);
        }
      });
  }
}
