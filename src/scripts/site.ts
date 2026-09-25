export {};
const toggle = document.querySelector<HTMLButtonElement>("[data-menu-toggle]");
const mobileNav = document.querySelector<HTMLElement>("#mobile-navigation");
function closeMenu() {
  if (toggle && mobileNav) {
    toggle.setAttribute("aria-expanded", "false");
    mobileNav.hidden = true;
  }
}
toggle?.addEventListener("click", () => {
  if (!mobileNav) return;
  const expanded = toggle.getAttribute("aria-expanded") === "true";
  toggle.setAttribute("aria-expanded", String(!expanded));
  mobileNav.hidden = expanded;
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    if (toggle?.getAttribute("aria-expanded") === "true") {
      closeMenu();
      toggle.focus();
    }
    document
      .querySelectorAll<HTMLDetailsElement>(".language-picker[open]")
      .forEach((el) => {
        el.open = false;
        el.querySelector("summary")?.focus();
      });
  }
});
document.addEventListener("click", (event) => {
  document
    .querySelectorAll<HTMLDetailsElement>(".language-picker[open]")
    .forEach((el) => {
      if (!el.contains(event.target as Node)) el.open = false;
    });
});
matchMedia("(min-width: 1101px)").addEventListener("change", (event) => {
  if (event.matches) closeMenu();
});
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
  document.querySelectorAll<HTMLElement>("[data-reveal]").forEach((element) => {
    if (element.getBoundingClientRect().top > innerHeight) {
      element.classList.add("reveal-pending");
      observer.observe(element);
    }
  });
}
