export type Theme = "light" | "dark" | "system";

export function normalizeTheme(value: string | null): Theme {
  return value === "light" || value === "dark" ? value : "system";
}

// Keep this function self-contained: both documents execute it before paint.
function initializeTheme() {
  let theme = "system";
  try {
    theme = window.localStorage.getItem("theme") || "system";
  } catch {}
  const dark =
    theme === "dark" ||
    (theme !== "light" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  const root = document.documentElement;
  const classes = root.classList;
  const resolved = dark ? "dark" : "light";
  classes.remove("light", "dark");
  classes.add(resolved);
  root.style.colorScheme = resolved;
}

export const THEME_INIT = { __html: `(${initializeTheme.toString()})();` };

export function createThemeStore(browser: Window) {
  let theme: Theme = "system";
  const listeners = new Set<() => void>();
  let media: MediaQueryList | undefined;
  let transitionStyle: HTMLStyleElement | undefined;
  let transitionTimer: number | undefined;

  const apply = () => {
    const root = browser.document.documentElement;
    if (!transitionStyle) {
      transitionStyle = browser.document.createElement("style");
      transitionStyle.textContent = "*,*::before,*::after{transition:none!important}";
      browser.document.head.appendChild(transitionStyle);
    }
    const resolved = theme === "system" ? (media?.matches ? "dark" : "light") : theme;
    root.classList.remove("light", "dark");
    root.classList.add(resolved);
    root.style.colorScheme = resolved;
    browser.getComputedStyle(root).getPropertyValue("color");
    browser.clearTimeout(transitionTimer);
    transitionTimer = browser.setTimeout(() => {
      transitionStyle?.remove();
      transitionStyle = undefined;
    }, 1);
  };
  const update = (next: Theme) => {
    theme = next;
    apply();
    for (const listener of listeners) listener();
  };
  const onSystemChange = () => {
    if (theme === "system") apply();
  };
  const onStorage = (event: StorageEvent) => {
    if (
      event.storageArea === browser.localStorage &&
      (event.key === "theme" || event.key === null)
    ) {
      update(normalizeTheme(event.newValue));
    }
  };

  return {
    getSnapshot: () => theme,
    setTheme(next: Theme) {
      try {
        browser.localStorage.setItem("theme", next);
      } catch {}
      update(next);
    },
    subscribe(listener: () => void) {
      listeners.add(listener);
      if (listeners.size === 1) {
        try {
          theme = normalizeTheme(browser.localStorage.getItem("theme"));
        } catch {}
        media = browser.matchMedia("(prefers-color-scheme: dark)");
        media.addEventListener("change", onSystemChange);
        browser.addEventListener("storage", onStorage);
        apply();
      }
      return () => {
        listeners.delete(listener);
        if (listeners.size === 0) {
          media?.removeEventListener("change", onSystemChange);
          browser.removeEventListener("storage", onStorage);
          browser.clearTimeout(transitionTimer);
          transitionStyle?.remove();
          transitionStyle = undefined;
        }
      };
    },
  };
}
