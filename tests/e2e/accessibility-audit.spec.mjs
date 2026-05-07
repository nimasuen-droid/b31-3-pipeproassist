import { expect, test } from "@playwright/test";

const MODULES = [
  { id: "home", label: "Home" },
  { id: "projects", label: "Saved Projects" },
  { id: "inputs", label: "Inputs" },
  { id: "material", label: "Material Selection" },
  { id: "thickness", label: "Thickness Calc" },
  { id: "schedule", label: "Pipe Schedule" },
  { id: "flanges", label: "Flanges & Fittings" },
  { id: "bolting", label: "Bolting & Gasket" },
  { id: "valves", label: "Valves" },
  { id: "support", label: "Support Span" },
  { id: "checks", label: "B31.3 Checks" },
  { id: "reports", label: "Reports" },
  { id: "pms", label: "Material Spec" },
  { id: "spec-library", label: "Spec Library" },
  { id: "source-library", label: "Source Library" },
  { id: "manual", label: "User Manual" },
  { id: "pricing", label: "Request Access" },
  { id: "about", label: "About & Release" },
  { id: "eula", label: "Terms (EULA)" },
  { id: "privacy", label: "Privacy" },
  { id: "refund", label: "Refund Policy" },
];

function setupAppState(page) {
  return page.addInitScript(() => {
    localStorage.setItem("eula.acceptance.v1", JSON.stringify({
      version: "1.1.0",
      acceptedAt: new Date().toISOString(),
    }));
    localStorage.setItem("entitlement:dev-paid", "true");
    localStorage.setItem("onboarding_completed_v1", "true");
    localStorage.setItem("pipepro-install-never-show", "1");
  });
}

async function openModule(page, moduleId) {
  await page.evaluate((id) => {
    localStorage.setItem("b313:v1:ui:active-tab", JSON.stringify(id));
  }, moduleId);
  await page.reload({ waitUntil: "commit" });
  await expect(page.locator("main")).toBeVisible();
  return true;
}

function auditPage() {
  const violations = [];
  const isVisible = (el) => {
    const style = window.getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    return style.visibility !== "hidden"
      && style.display !== "none"
      && Number(style.opacity || 1) > 0.01
      && rect.width > 0
      && rect.height > 0;
  };
  const textOf = (el) => (el.innerText || el.textContent || "").replace(/\s+/g, " ").trim();
  const isDisabled = (el) => el.disabled || el.getAttribute("aria-disabled") === "true";
  const nameOf = (el) => {
    if (el.getAttribute("aria-label")) return el.getAttribute("aria-label").trim();
    if (el.getAttribute("aria-labelledby")) {
      return el.getAttribute("aria-labelledby").split(/\s+/)
        .map((id) => document.getElementById(id)?.textContent?.trim() || "")
        .join(" ")
        .trim();
    }
    if (el.id) {
      const label = document.querySelector(`label[for="${CSS.escape(el.id)}"]`);
      if (label?.textContent?.trim()) return label.textContent.trim();
    }
    if (el.closest("label")?.textContent?.trim()) return el.closest("label").textContent.trim();
    const nearbyLabel = el.parentElement?.querySelector("label") || el.parentElement?.parentElement?.querySelector("label");
    if (nearbyLabel?.textContent?.trim()) return nearbyLabel.textContent.trim();
    if (el.getAttribute("title")) return el.getAttribute("title").trim();
    if (el.getAttribute("placeholder")) return el.getAttribute("placeholder").trim();
    return textOf(el);
  };
  const selectorFor = (el) => {
    if (el.id) return `#${CSS.escape(el.id)}`;
    if (el.getAttribute("data-testid")) return `[data-testid="${el.getAttribute("data-testid")}"]`;
    if (el.getAttribute("aria-label")) return `${el.tagName.toLowerCase()}[aria-label="${el.getAttribute("aria-label")}"]`;
    const text = textOf(el).slice(0, 48);
    return `${el.tagName.toLowerCase()}${text ? ` "${text}"` : ""}`;
  };
  const parseRgb = (value) => {
    const match = value.match(/rgba?\(([^)]+)\)/);
    if (!match) return null;
    const [r, g, b, a = "1"] = match[1].split(",").map((part) => Number(part.trim()));
    if ([r, g, b, a].some((n) => Number.isNaN(n))) return null;
    return { r, g, b, a };
  };
  const relLum = ({ r, g, b }) => {
    const channel = (v) => {
      const s = v / 255;
      return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
  };
  const contrastRatio = (fg, bg) => {
    const lighter = Math.max(relLum(fg), relLum(bg));
    const darker = Math.min(relLum(fg), relLum(bg));
    return (lighter + 0.05) / (darker + 0.05);
  };
  const composite = (top, bottom) => ({
    r: Math.round(top.r * top.a + bottom.r * (1 - top.a)),
    g: Math.round(top.g * top.a + bottom.g * (1 - top.a)),
    b: Math.round(top.b * top.a + bottom.b * (1 - top.a)),
    a: 1,
  });
  const effectiveBackground = (el) => {
    const layers = [];
    let cur = el;
    while (cur && cur !== document.documentElement) {
      const bg = parseRgb(window.getComputedStyle(cur).backgroundColor);
      if (bg && bg.a > 0.01) layers.push(bg);
      cur = cur.parentElement;
    }
    let color = parseRgb(window.getComputedStyle(document.body).backgroundColor) || { r: 255, g: 255, b: 255, a: 1 };
    for (const layer of layers.reverse()) {
      color = composite(layer, color);
    }
    return color;
  };

  if (!document.documentElement.lang) {
    violations.push({ rule: "html-lang", selector: "html", message: "Document is missing a lang attribute." });
  }
  if (document.querySelectorAll("main").length !== 1) {
    violations.push({ rule: "landmark-main", selector: "main", message: "Page should expose exactly one main landmark." });
  }

  for (const el of document.querySelectorAll("button, a[href], input, select, textarea, [role='button'], [role='link'], [role='tab']")) {
    if (!isVisible(el)) continue;
    if (isDisabled(el)) continue;
    const name = nameOf(el);
    if (!name) {
      violations.push({ rule: "accessible-name", selector: selectorFor(el), message: "Interactive control has no accessible name." });
    }
    const rect = el.getBoundingClientRect();
    const isInlineLink = el.tagName.toLowerCase() === "a" && rect.height < 32;
    if (window.innerWidth <= 480 && !isInlineLink && (rect.width < 40 || rect.height < 40)) {
      violations.push({
        rule: "mobile-target-size",
        selector: selectorFor(el),
        message: `Mobile target is ${Math.round(rect.width)}x${Math.round(rect.height)}; expected at least 40x40 for app controls.`,
      });
    }
  }

  for (const img of document.querySelectorAll("img")) {
    if (isVisible(img) && !img.hasAttribute("alt")) {
      violations.push({ rule: "image-alt", selector: selectorFor(img), message: "Visible image is missing alt text." });
    }
  }

  const rootOverflow = Math.max(
    document.body.scrollWidth - document.body.clientWidth,
    document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  if (rootOverflow > 2) {
    violations.push({ rule: "horizontal-overflow", selector: "body", message: `Page has ${rootOverflow}px horizontal overflow.` });
  }

  const textCandidates = [...document.querySelectorAll("body *")]
    .filter((el) => isVisible(el) && !isDisabled(el.closest("button, a, input, select, textarea") || el) && textOf(el) && el.children.length === 0);
  for (const el of textCandidates.slice(0, 350)) {
    const style = window.getComputedStyle(el);
    const fg = parseRgb(style.color);
    const bg = effectiveBackground(el);
    const fontSize = Number.parseFloat(style.fontSize || "0");
    if (!fg || !bg || fontSize < 10) continue;
    const ratio = contrastRatio(fg, bg);
    const largeText = fontSize >= 18 || (fontSize >= 14 && Number.parseFloat(style.fontWeight || "400") >= 700);
    const required = largeText ? 3 : 4.5;
    if (ratio + 0.02 < required) {
      violations.push({
        rule: "color-contrast",
        selector: selectorFor(el),
        message: `Text contrast is ${ratio.toFixed(2)}:1; expected at least ${required}:1.`,
      });
    }
  }

  return violations;
}

test.describe.configure({ timeout: 90_000 });

test("accessibility audit across modules", async ({ page }, testInfo) => {
    const allViolations = [];
    const consoleErrors = [];
    page.on("console", (msg) => {
      if (msg.type() === "error" && !msg.text().includes("ResizeObserver")) consoleErrors.push(msg.text());
    });

    const isMobileProject = testInfo.project.name.toLowerCase().includes("mobile");
    await page.setViewportSize(isMobileProject ? { width: 390, height: 844 } : { width: 1366, height: 900 });
    await setupAppState(page);
    await page.goto("/", { waitUntil: "commit" });
    await expect(page.locator("main")).toBeVisible();
    await page.evaluate(() => {
      localStorage.setItem("b313:v1:ui:active-tab", JSON.stringify("inputs"));
    });
    await page.reload({ waitUntil: "commit" });
    await expect(page.locator("main")).toBeVisible();
    const loadSample = page.getByRole("button", { name: "Load Default Dataset", exact: true });
    await expect(loadSample).toBeVisible();
    await loadSample.click();
    await page.waitForFunction(() => localStorage.getItem("b313:v2:session:inputs")?.includes("Sample"));
    await page.evaluate(() => {
      const activeInputs = localStorage.getItem("b313:v2:session:inputs");
      if (activeInputs) localStorage.setItem("b313:v1:entitlement:sample-hash", activeInputs);
    });
    for (const moduleLabel of MODULES) {
      const opened = await openModule(page, moduleLabel.id);
      if (!opened) {
        allViolations.push({ module: moduleLabel.label, rule: "navigation", selector: "nav", message: "Could not open module from navigation." });
        continue;
      }
      await expect(page.locator("main")).toBeVisible();
      const currentViolations = await page.evaluate(auditPage);
      allViolations.push(...currentViolations.map((violation) => ({ module: moduleLabel.label, ...violation })));
    }

    if (consoleErrors.length > 0) {
      allViolations.push(...consoleErrors.map((message) => ({
        module: "runtime",
        rule: "console-error",
        selector: "console",
        message,
      })));
    }

    expect(allViolations).toEqual([]);
  });
