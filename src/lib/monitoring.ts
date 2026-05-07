import { APP_VERSION, DATASET_VERSION } from "@/lib/appVersion";
import { appEnv } from "@/lib/env";

type MonitoringEvent = {
  type: "error" | "unhandledrejection" | "release-healthcheck";
  message: string;
  stack?: string;
  href: string;
  appVersion: string;
  datasetVersion: string;
  buildMode: string;
  occurredAt: string;
};

let installed = false;
const MAX_FIELD_LENGTH = 2000;

function toError(value: unknown): { message: string; stack?: string } {
  if (value instanceof Error) return { message: value.message, stack: value.stack };
  if (typeof value === "string") return { message: value };
  return { message: JSON.stringify(value) };
}

function trimField(value: string | undefined): string | undefined {
  if (!value) return value;
  return value.length > MAX_FIELD_LENGTH ? `${value.slice(0, MAX_FIELD_LENGTH)}...` : value;
}

function buildEvent(type: MonitoringEvent["type"], message: string, stack?: string): MonitoringEvent {
  return {
    type,
    message: trimField(message) || "Unknown error",
    stack: trimField(stack),
    href: window.location.origin + window.location.pathname,
    appVersion: APP_VERSION,
    datasetVersion: DATASET_VERSION,
    buildMode: appEnv.mode,
    occurredAt: new Date().toISOString(),
  };
}

export function sendMonitoringEvent(event: MonitoringEvent) {
  if (!appEnv.monitoringEndpoint) return;
  const payload = JSON.stringify(event);
  const blob = new Blob([payload], { type: "application/json" });
  const sent = navigator.sendBeacon?.(appEnv.monitoringEndpoint, blob);
  if (sent) return;

  void fetch(appEnv.monitoringEndpoint, {
    method: "POST",
    body: payload,
    headers: { "Content-Type": "application/json" },
    keepalive: true,
  }).catch(() => {
    // Monitoring must never break the engineering workflow.
  });
}

export function sendReleaseHealthcheck() {
  if (typeof window === "undefined") return;
  sendMonitoringEvent(buildEvent("release-healthcheck", "Release healthcheck event"));
}

export function registerMonitoring() {
  if (installed || typeof window === "undefined") return;
  installed = true;

  window.addEventListener("error", (event) => {
    const err = toError(event.error ?? event.message);
    sendMonitoringEvent(buildEvent("error", err.message, err.stack));
  });

  window.addEventListener("unhandledrejection", (event) => {
    const err = toError(event.reason);
    sendMonitoringEvent(buildEvent("unhandledrejection", err.message, err.stack));
  });
}
