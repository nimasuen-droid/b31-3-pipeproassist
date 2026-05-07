function readRequiredEnv(name: string): string {
  const value = import.meta.env[name];
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value.trim();
}

function readOptionalEnv(name: string): string {
  const value = import.meta.env[name];
  return typeof value === "string" ? value.trim() : "";
}

function readBooleanEnv(name: string): boolean {
  return ["1", "true", "yes"].includes(readOptionalEnv(name).toLowerCase());
}

function readUrlEnv(name: string): string {
  const value = readRequiredEnv(name);
  try {
    new URL(value);
  } catch {
    throw new Error(`Invalid URL in environment variable: ${name}`);
  }
  return value;
}

function readOptionalHttpsUrlEnv(name: string): string {
  const value = readOptionalEnv(name);
  if (!value) return "";
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error(`Invalid URL in environment variable: ${name}`);
  }
  if (import.meta.env.PROD && parsed.protocol !== "https:") {
    throw new Error(`Production environment variable ${name} must use HTTPS`);
  }
  return value;
}

export const appEnv = {
  mode: import.meta.env.MODE,
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
  supabaseUrl: readUrlEnv("VITE_SUPABASE_URL"),
  supabasePublishableKey: readRequiredEnv("VITE_SUPABASE_PUBLISHABLE_KEY"),
  monitoringEndpoint: readOptionalHttpsUrlEnv("VITE_MONITORING_ENDPOINT"),
  allowDevEntitlementOverride:
    import.meta.env.DEV && readBooleanEnv("VITE_ALLOW_DEV_ENTITLEMENT_OVERRIDE"),
};
