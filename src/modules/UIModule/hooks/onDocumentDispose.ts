/**
 * Vyvolá úklidové funkce ve chvíli, kdy je dokument skutečně zrušen.
 *
 * @param cleanup - Úklidová funkce (odpojení listenerů, zrušení časovačů).
 * @returns Funkce pro ruční úklid, která zároveň zruší i posluchač `pagehide`.
 */
export function onDocumentDispose(cleanup: () => void) {
  const dispose = (event: PageTransitionEvent) => {
    if (event.persisted) return;
    window.removeEventListener("pagehide", dispose);
    cleanup();
  };
  window.addEventListener("pagehide", dispose);
  return () => {
    window.removeEventListener("pagehide", dispose);
    cleanup();
  };
}
