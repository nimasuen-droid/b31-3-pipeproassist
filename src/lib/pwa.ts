// PWA registration helper.
// Service worker is intentionally NOT registered when:
//  - the app is running inside an iframe (Lovable preview, embeds)
//  - the host looks like a Lovable preview URL
//  - the browser does not support service workers
// This prevents stale-cache and navigation issues during development.

const isInIframe = (() => {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
})();

const host = typeof window !== "undefined" ? window.location.hostname : "";
const protocol = typeof window !== "undefined" ? window.location.protocol : "";
const isPreviewHost =
  host.includes("id-preview--") ||
  host.includes("lovable") ||
  host === "localhost" ||
  host === "127.0.0.1";

// Electron loads the bundle via file:// — service workers must not register there.
const isFileProtocol = protocol === "file:";

export const PWA_DISABLED = isInIframe || isPreviewHost || isFileProtocol;
const PWA_ENABLED = import.meta.env.VITE_ENABLE_PWA === "true";

export async function registerPWA(): Promise<void> {
  if (PWA_DISABLED || !PWA_ENABLED) {
    // Defensive cleanup: remove any previously registered SWs in preview/iframe contexts.
    if ("serviceWorker" in navigator) {
      try {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.unregister()));
      } catch {
        /* ignore */
      }
    }
    return;
  }

  if (!("serviceWorker" in navigator)) return;

  try {
    const pwaRegisterModule = "virtual:" + "pwa-register";
    const { registerSW } = await import(/* @vite-ignore */ pwaRegisterModule);
    registerSW({
      immediate: true,
      onRegisteredSW(_swUrl, registration) {
        // Periodically check for updates (every hour).
        if (registration) {
          setInterval(() => {
            registration.update().catch(() => undefined);
          }, 60 * 60 * 1000);
        }
      },
    });
  } catch {
    /* virtual import unavailable in dev — safe to ignore */
  }
}
