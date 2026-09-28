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
