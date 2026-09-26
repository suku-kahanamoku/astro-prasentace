export {};
type Turnstile = {
  render: (element: HTMLElement, options: Record<string, unknown>) => string;
  reset: (id: string) => void;
};
declare global {
  interface Window {
    turnstile?: Turnstile;
    prasentaceCaptchaReady?: () => void;
  }
}
const form = document.querySelector<HTMLFormElement>("[data-contact-form]");
if (form) {
  form.noValidate = true;
  const messages = JSON.parse(form.dataset.messages || "{}") as Record<
    string,
    string
  >;
  const status = form.querySelector<HTMLElement>("[data-form-status]")!;
  const button = form.querySelector<HTMLButtonElement>("button[type=submit]")!;
  const buttonLabel = form.querySelector<HTMLElement>("[data-submit-label]")!;
  let token = "";
  let widgetId: string | undefined;
  let submitting = false;
  const controls = [
    ...form.querySelectorAll<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >(".field input, .field textarea, .field select"),
  ];
  function setStatus(text: string, state: "error" | "success" | "" = "") {
    status.textContent = text;
    status.dataset.state = state;
    status.setAttribute("role", state === "error" ? "alert" : "status");
  }
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
    const valid = controls.map((control) => showError(control)).every(Boolean);
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
