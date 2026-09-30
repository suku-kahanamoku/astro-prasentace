/**
 * Klientské chování kontaktního formuláře: validace, CAPTCHA a odeslání.
 *
 * Formulář je záměrně odesílán přes `fetch` s JSONem, protože nativní
 * odeslání bez JavaScriptu nelze použít v kombinaci s tokenem z Turnstile.
 * Skript:
 * - vypíná nativní validaci (`noValidate`) a nahrazuje ji vlastními hláškami
 *   z lokalizovaného slovníku uloženého v `data-messages`,
 * - validuje pole již při rozbíhnutí (`blur`) a při opravě (`input`),
 *   chyby zobrazuje vázané na pole pomocí `aria-invalid` a `aria-describedby`,
 * - lazy načítá Cloudflare Turnstile a vykreslí widget do `[data-captcha]`,
 * - odesílá data spolu s tokenem, zpracovává odpověď serveru včetně seznamu
 *   chybných polí a vždy uvádí stav formuláře v `[data-form-status]`.
 */

/** Rozhraní veřejného API služby Cloudflare Turnstile používané widgetem. */
type Turnstile = {
  /** Vykreslí widget v zadaném elementu a vrátí jeho ID. */
  render: (element: HTMLElement, options: Record<string, unknown>) => string;
  /** Resetuje widget (např. po neúspěšném odeslání). */
  reset: (id: string) => void;
};

declare global {
  interface Window {
    /** Turnstile se načítá asynchronně, proto je volitelné. */
    turnstile?: Turnstile;
    /** Callback, který služba zavolá po načtení skriptu Turnstile. */
    prasentaceCaptchaReady?: () => void;
  }
}

/**
 * Napojí validaci, CAPTCHA a odeslání na formulář `[data-contact-form]`.
 * @returns `undefined`; formulář má přesně jeden výskyt na stránce.
 */
export function useContactForm() {
  const form = document.querySelector<HTMLFormElement>("[data-contact-form]");
  if (form) {
    form.noValidate = true;
    const messages = JSON.parse(form.dataset.messages || "{}") as Record<
      string,
      string
    >;
    const status = form.querySelector<HTMLElement>("[data-form-status]")!;
    const button = form.querySelector<HTMLButtonElement>(
      "button[type=submit]",
    )!;
    const buttonLabel = form.querySelector<HTMLElement>("[data-submit-label]")!;
    let token = "";
    let widgetId: string | undefined;
    let submitting = false;
    const controls = [
      ...form.querySelectorAll<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >(".field input, .field textarea, .field select"),
    ];
    /**
     * Zapíše stavovou zprávu formuláře a nastaví její sémantiku.
     * @param text - Text zprávy; prázdný řetězec vymaže hlášku.
     * @param state - `"error"`, `"success"` nebo `""` pro neutrální stav.
     * @returns `undefined`.
     */
    function setStatus(text: string, state: "error" | "success" | "" = "") {
      status.textContent = text;
      status.dataset.state = state;
      status.setAttribute("role", state === "error" ? "alert" : "status");
    }
    /**
     * Vrátí lokalizovanou hlášku prvního chybného pravidla daného pole.
     * @param control - Ověřované pole formuláře.
     * @returns Text chyby, nebo prázdný řetězec, je-li hodnota v pořádku.
     */
    function errorFor(control: (typeof controls)[number]) {
      const value = control.value.trim();
      if (control.required && !value) return messages.required;
      if (control.name === "email" && control.validity.typeMismatch)
        return messages.invalidEmail;
      if (control.name === "message" && value.length < 10)
        return messages.messageLength;
      if (!control.validity.valid) return messages.invalid;
      return "";
    }
    /**
     * Zobrazí nebo vymaže chybu u pole a označí pole jako neplatné.
     * @param control - Pole, kterého se týká chyba.
     * @param message - Volitelná hláška; bez zadání se dopočítá z `errorFor`.
     * @returns `true`, pokud je pole po této kontrole v pořádku.
     */
    function showError(
      control: (typeof controls)[number],
      message = errorFor(control),
    ) {
      control.setAttribute("aria-invalid", String(!!message));
      const hint = form!.querySelector<HTMLElement>(`#${control.id}-error`);
      if (hint) hint.textContent = message;
      return !message;
    }
    controls.forEach((control) => {
      control.addEventListener("blur", () => showError(control));
      control.addEventListener("input", () => {
        if (control.getAttribute("aria-invalid") === "true") showError(control);
      });
    });
    const siteKey = form.dataset.sitekey;
    if (siteKey) {
      window.prasentaceCaptchaReady = () => {
        const container = form.querySelector<HTMLElement>("[data-captcha]")!;
        widgetId = window.turnstile?.render(container, {
          sitekey: siteKey,
          action: "contact",
          language: form.dataset.locale,
          theme: "light",
          size: "flexible",
          appearance: "interaction-only",
          callback: (value: string) => {
            token = value;
            if (status.textContent === messages.captcha) setStatus("");
          },
          "expired-callback": () => {
            token = "";
          },
          "error-callback": () => {
            token = "";
            setStatus(messages.captcha, "error");
          },
        });
      };
      const script = document.createElement("script");
      script.src =
        "https://challenges.cloudflare.com/turnstile/v0/api.js?onload=prasentaceCaptchaReady&render=explicit";
      script.async = true;
      script.defer = true;
      script.onerror = () => setStatus(messages.captcha, "error");
      document.head.append(script);
    }
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (submitting) return;
      const valid = controls
        .map((control) => showError(control))
        .every(Boolean);
      if (!valid) {
        setStatus(messages.invalid, "error");
        controls
          .find((control) => control.getAttribute("aria-invalid") === "true")
          ?.focus();
        return;
      }
      if (!siteKey) {
        setStatus(messages.unavailable, "error");
        return;
      }
      if (!token) {
        setStatus(messages.captcha, "error");
        return;
      }
      submitting = true;
      button.disabled = true;
      buttonLabel.textContent = messages.sending;
      form.setAttribute("aria-busy", "true");
      setStatus("");
      try {
        const data = Object.fromEntries(new FormData(form));
        const response = await fetch(form.action, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...data, token }),
          signal: AbortSignal.timeout(25000),
        });
        const result = await response.json();
        if (!response.ok) {
          if (result.fields)
            for (const control of controls)
              if (result.fields.includes(control.name))
                showError(control, messages.invalid);
          setStatus(messages[result.code] || messages.error, "error");
          controls
            .find((control) => control.getAttribute("aria-invalid") === "true")
            ?.focus();
        } else {
          form.reset();
          controls.forEach((control) => {
            control.removeAttribute("aria-invalid");
            const hint = form.querySelector(`#${control.id}-error`);
            if (hint) hint.textContent = "";
          });
          setStatus(messages.success, "success");
        }
      } catch {
        setStatus(messages.error, "error");
      } finally {
        submitting = false;
        button.disabled = false;
        buttonLabel.textContent = messages.submit;
        form.removeAttribute("aria-busy");
        token = "";
        if (widgetId !== undefined) window.turnstile?.reset(widgetId);
      }
    });
  }
}
