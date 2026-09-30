/**
 * Napojení chování hlavního menu po celé stránce.
 *
 * Každému nalezenému menu s `data-main-menu` přidá měření výšky hlavičky
 * a ovládání mobilního panelu. Hook je určen ke spuštění na každém načtení
 * stránky včetně přechodů přes Astro View Transitions.
 */
import { useNavigation } from "./useNavigation";
import { useHeaderOffset } from "./useHeaderOffset";
import { onDocumentDispose } from "./onDocumentDispose";

/** Úklid předchozího spuštění, aby se listenery neshromažďovaly. */
let dispose: (() => void) | undefined;

/**
 * Vybuduje chování pro všechna hlavní menu na stránce.
 *
 * Předchozí instance se nejprve ukončí a nové listenery se opět připojí při
 * každém načtení stránky, takže se po přechodech mezi stránkami neshromažďují.
 *
 * @returns `undefined`; životnost spravuje `onDocumentDispose` a `dispose`.
 */
export function useMainMenu() {
  dispose?.();
  const cleanups: (() => void)[] = [];
  document
    .querySelectorAll<HTMLElement>("[data-main-menu]")
    .forEach((header) => {
      const toggle =
        header.querySelector<HTMLButtonElement>("[data-menu-toggle]");
      const menu = header.querySelector<HTMLElement>(".mobile-nav");
      cleanups.push(useHeaderOffset(header));
      if (toggle && menu) cleanups.push(useNavigation(toggle, menu));
    });
  const cleanup = () => cleanups.forEach((fn) => fn());
  const removeDisposeListener = onDocumentDispose(cleanup);
  dispose = () => {
    removeDisposeListener();
  };
}
