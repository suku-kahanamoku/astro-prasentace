/**
 * Sdílený offset pro lepivé prvky a nativní přeskakování na kotvy.
 *
 * Aktuální výšku hlavičky průběžně zapisuje do CSS proměnné
 * `--site-header-height`, takže styly mohou odsazovat obsah pod hlavičkou
 * a prohlížeč při přechodu na `#kotva` neskáče pod ni.
 *
 * @param header - Element hlavičky, jehož výška se sleduje.
 * @param root - Kořenový element, na němž se nastavuje proměnná; výchozí `<html>`.
 * @returns Úklidová funkce odpojující `ResizeObserver` a listener `pageshow`.
 */
export function useHeaderOffset(
  header: HTMLElement,
  root = document.documentElement,
) {
  const update = () =>
    root.style.setProperty(
      "--site-header-height",
      `${header.getBoundingClientRect().height}px`,
    );
  const observer = new ResizeObserver(update);
  observer.observe(header);
  update();
  window.addEventListener("pageshow", update);
  return () => {
    observer.disconnect();
    window.removeEventListener("pageshow", update);
  };
}
