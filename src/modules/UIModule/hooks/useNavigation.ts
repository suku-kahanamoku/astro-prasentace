/**
 * Ovládání jednoho hlavního menu (tlačítko + panel s mobilní navigací).
 *
 * Drží stav otevření v atributech `aria-expanded` a `hidden` panelu, přepíná
 * přístupnostní popisky tlačítka, zavírá menu při odchodu kurzoru (s krátkým
 * zpožděním, aby se nestihlo zavřít při přesunu na panel), při Escape, kliknutí
 * mimo menu, přechodu na širší breakpoint i po výběru odkazu. Každé menu
 * vlastní své listenery a časovač.
 *
 * @param toggle - Tlačítko hamburgeru ovládající panel.
 * @param mobileNav - Panel s mobilní navigací.
 * @returns Úklidová funkce, která zruší časovač a odpojí všechny listenery.
 */
export function useNavigation(
  toggle: HTMLButtonElement,
  mobileNav: HTMLElement,
) {
  const controller = new AbortController();
  const options = { signal: controller.signal };
  let timer: ReturnType<typeof setTimeout> | undefined;
  const cancelLeave = () => {
    clearTimeout(timer);
    timer = undefined;
  };
  const close = () => {
    cancelLeave();
    toggle.setAttribute("aria-expanded", "false");
    mobileNav.hidden = true;
    toggle.setAttribute("aria-label", toggle.dataset.openLabel ?? "");
  };
  toggle.addEventListener(
    "click",
    () => {
      cancelLeave();
      const expanded = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!expanded));
      mobileNav.hidden = expanded;
      toggle.setAttribute(
        "aria-label",
        (expanded ? toggle.dataset.openLabel : toggle.dataset.closeLabel) ?? "",
      );
    },
    options,
  );
  const pointer = (event: PointerEvent) => {
    if (
      event.pointerType !== "mouse" ||
      toggle.getAttribute("aria-expanded") !== "true"
    )
      return;
    const target =
      event.type === "pointerout" ? event.relatedTarget : event.target;
    if (
      target instanceof Node &&
      (toggle.contains(target) || mobileNav.contains(target))
    ) {
      cancelLeave();
      return;
    }
    if (timer === undefined) timer = setTimeout(close, 180);
  };
  document.addEventListener("pointermove", pointer, options);
  document.addEventListener(
    "pointerout",
    (event) => {
      if (!event.relatedTarget) pointer(event);
    },
    options,
  );
  document.addEventListener(
    "keydown",
    (event) => {
      if (
        event.key === "Escape" &&
        toggle.getAttribute("aria-expanded") === "true"
      ) {
        close();
        toggle.focus();
      }
    },
    options,
  );
  document.addEventListener(
    "click",
    (event) => {
      const target = event.target;
      if (
        target instanceof Node &&
        !toggle.contains(target) &&
        !mobileNav.contains(target)
      )
        close();
    },
    options,
  );
  matchMedia("(min-width: 1280px)").addEventListener(
    "change",
    (event) => {
      if (event.matches) close();
    },
    options,
  );
  mobileNav.addEventListener(
    "click",
    (event) => {
      if (event.target instanceof Element && event.target.closest("a")) close();
    },
    options,
  );
  return () => {
    cancelLeave();
    controller.abort();
  };
}
