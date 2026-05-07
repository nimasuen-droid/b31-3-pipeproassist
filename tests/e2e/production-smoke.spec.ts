import { expect, test } from "@playwright/test";

async function acceptEulaIfPresent(page: import("@playwright/test").Page) {
  const accept = page.getByRole("button", { name: /accept|agree/i }).first();
  if (await accept.isVisible().catch(() => false)) {
    await page.locator(".overflow-y-auto").first().evaluate((el) => {
      el.scrollTop = el.scrollHeight;
      el.dispatchEvent(new Event("scroll", { bubbles: true }));
    });
    await page.getByText(/I understand this app does not replace professional engineering judgment/i).click();
    await expect(accept).toBeEnabled();
    await accept.click();
  }
}

async function setupAppState(page: import("@playwright/test").Page) {
  await page.addInitScript(() => {
    localStorage.setItem("eula.acceptance.v1", JSON.stringify({
      version: "1.1.0",
      acceptedAt: new Date().toISOString(),
    }));
    localStorage.setItem("onboarding_completed_v1", "true");
    localStorage.setItem("pipepro-install-never-show", "1");
  });
}

async function expectNoHorizontalOverflow(page: import("@playwright/test").Page) {
  const overflow = await page.evaluate(() => {
    const root = document.documentElement;
    return Math.ceil(root.scrollWidth - root.clientWidth);
  });
  expect(overflow).toBeLessThanOrEqual(2);
}

test.describe("production smoke", () => {
  test.describe.configure({ timeout: 60_000 });

  test("loads the assistant and exposes the primary workflow", async ({ page }) => {
    await setupAppState(page);
    await page.goto("/", { waitUntil: "commit" });
    await acceptEulaIfPresent(page);

    await expect(page.locator("body")).toContainText(/PipePro B31\.3|PipePro B31\.3 Design Assistant/i);
    await expect(page.locator("body")).toContainText(/Inputs/i);
    await expect(page.locator("body")).toContainText(/Thickness/i);
    await expect(page.locator("body")).toContainText(/Material Spec/i);
    await expectNoHorizontalOverflow(page);
  });

  test("mobile viewport has usable navigation without horizontal overflow", async ({ page, isMobile }) => {
    test.skip(!isMobile, "mobile-only check");
    await setupAppState(page);
    await page.goto("/", { waitUntil: "commit" });
    await acceptEulaIfPresent(page);

    await expect(page.locator("body")).toContainText(/PipePro B31\.3|PipePro B31\.3 Design Assistant/i);
    await expectNoHorizontalOverflow(page);

    const inputsNav = page.getByRole("button", { name: /inputs/i }).first();
    if (await inputsNav.isVisible().catch(() => false)) {
      await inputsNav.click();
      await expect(page.locator("body")).toContainText(/Design Inputs|Project Information|Design Pressure/i);
      await expectNoHorizontalOverflow(page);
    }
  });
});
