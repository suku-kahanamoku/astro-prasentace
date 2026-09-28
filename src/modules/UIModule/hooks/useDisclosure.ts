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
