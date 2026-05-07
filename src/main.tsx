import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { registerPWA } from "./lib/pwa";
import { registerMonitoring } from "./lib/monitoring";

registerMonitoring();
createRoot(document.getElementById("root")!).render(<App />);

// Register the service worker (no-op in preview/iframe contexts).
registerPWA();
