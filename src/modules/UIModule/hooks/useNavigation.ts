export function useNavigation() {
  const toggle =
    document.querySelector<HTMLButtonElement>("[data-menu-toggle]");
  const mobileNav = document.querySelector<HTMLElement>("#mobile-navigation");
  let menuLeaveTimer: ReturnType<typeof setTimeout> | undefined;
  function cancelMenuLeave() {
    clearTimeout(menuLeaveTimer);
    menuLeaveTimer = undefined;
  }
  function closeMenu() {
    cancelMenuLeave();
    if (toggle && mobileNav) {
      toggle.setAttribute("aria-expanded", "false");
      mobileNav.hidden = true;
    }
  }
  toggle?.addEventListener("click", () => {
    if (!mobileNav) return;
    cancelMenuLeave();
    const expanded = toggle.getAttribute("aria-expanded") === "true";
    toggle.setAttribute("aria-expanded", String(!expanded));
    mobileNav.hidden = expanded;
  });
  // A short delay lets the mouse cross the gap between the button and dropdown.
  function handleMenuPointer(event: PointerEvent) {
    if (
      event.pointerType !== "mouse" ||
      toggle?.getAttribute("aria-expanded") !== "true"
    )
      return;
    const target =
      event.type === "pointerout" ? event.relatedTarget : event.target;
    if (
      target instanceof Node &&
      (toggle.contains(target) || mobileNav?.contains(target))
    ) {
      cancelMenuLeave();
      return;
    }
    if (menuLeaveTimer === undefined)
      menuLeaveTimer = setTimeout(closeMenu, 180);
  }
  document.addEventListener("pointermove", handleMenuPointer);
  document.addEventListener("pointerout", (event) => {
    if (!event.relatedTarget) handleMenuPointer(event);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      if (toggle?.getAttribute("aria-expanded") === "true") {
        closeMenu();
        toggle.focus();
      }
    }
  });
  document.addEventListener("click", (event) => {
    const target = event.target;
    if (
      target instanceof Node &&
      toggle?.getAttribute("aria-expanded") === "true" &&
      !toggle.contains(target) &&
      !mobileNav?.contains(target)
    )
      closeMenu();
  });
  matchMedia("(min-width: 1101px)").addEventListener("change", (event) => {
    if (event.matches) closeMenu();
  });
}
