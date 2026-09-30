/**
 * Přepínání světlého a tmavého vzhledu.
 *
 * Do výslovné volby návštěvníka se řídí systémovým nastavením a po jejím
 * uložení ji přebírá – změna v jiném panelu se propaguje událostí `storage`.
 * Volba i systémové nastavení zapisují atributy `data-theme` a `data-theme-mode`
 * na kořenový element, mění `meta[name="theme-color"]` a odhalují tlačítka
 * přepínače. Funguje i s navigací přes Astro View Transitions.
 *
 * @returns Úklidová funkce, která odpojí všechny listenery této instance.
 */
import { themeConfig } from "../config/theme";

/** Úklid předchozí instance hooku při opakovaném spuštění v jedné session. */
let dispose: (() => void) | undefined;

/** Sleduje systémové nastavení, dokud návštěvník sám neurčí vzhled. */
export function useTheme() {
  dispose?.();
  const abort = new AbortController();
  const { signal } = abort;
  const system = matchMedia("(prefers-color-scheme: dark)");
  const buttons = document.querySelectorAll<HTMLButtonElement>(".theme-toggle");
  let preference: string | null = null;
  const validPreference = (value: string | null) =>
    value === themeConfig.light.name || value === themeConfig.dark.name
      ? value
      : null;
  try {
    preference = validPreference(localStorage.getItem(themeConfig.storageKey));
  } catch {
    /* Storage is optional. */
  }
  const apply = () => {
    const dark = preference
      ? preference === themeConfig.dark.name
      : system.matches;
    const theme = dark ? themeConfig.dark : themeConfig.light;
    document.documentElement.dataset.theme = theme.name;
    document.documentElement.dataset.themeMode = dark ? "dark" : "light";
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", theme.color);
    buttons.forEach((button) => {
      button.hidden = false;
      button.setAttribute("aria-pressed", String(dark));
    });
  };
  buttons.forEach((button) =>
    button.addEventListener(
      "click",
      () => {
        preference =
          document.documentElement.dataset.themeMode === "dark"
            ? themeConfig.light.name
            : themeConfig.dark.name;
        try {
          localStorage.setItem(themeConfig.storageKey, preference);
        } catch {
          /* Keep the choice for this page. */
        }
        apply();
      },
      { signal },
    ),
  );
  system.addEventListener("change", apply, { signal });
  window.addEventListener(
    "storage",
    (event) => {
      if (event.key !== null && event.key !== themeConfig.storageKey) return;
      preference = validPreference(event.newValue);
      apply();
    },
    { signal },
  );
  document.addEventListener("astro:before-swap", () => abort.abort(), {
    once: true,
    signal,
  });
  window.addEventListener(
    "pageshow",
    (event) => {
      if (!event.persisted) return;
      try {
        preference = validPreference(
          localStorage.getItem(themeConfig.storageKey),
        );
      } catch {
        /* Storage is optional. */
      }
      apply();
    },
    { signal },
  );
  dispose = () => abort.abort();
  apply();
  return dispose;
}
