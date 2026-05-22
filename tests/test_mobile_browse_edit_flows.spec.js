const { test, expect } = require("@playwright/test");
const { spawn } = require("node:child_process");
const path = require("node:path");
const os = require("node:os");

const HOST = "127.0.0.1";
const PORT = 8765;
const BASE_URL = `http://${HOST}:${PORT}`;
const CHROMIUM_EXECUTABLE = path.join(
  os.homedir(),
  ".cache",
  "ms-playwright",
  "chromium-1223",
  "chrome-linux",
  "chrome",
);

let serverProcess;

async function waitForServer() {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      const response = await fetch(`${BASE_URL}/api/health`);
      if (response.ok) {
        return;
      }
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  throw new Error("Dashboard fixture server did not become ready in time.");
}

test.use({
  viewport: { width: 393, height: 851 },
  launchOptions: {
    executablePath: CHROMIUM_EXECUTABLE,
  },
});

test.beforeAll(async () => {
  serverProcess = spawn(
    "python3",
    [path.join(__dirname, "run_dashboard_fixture.py"), "--host", HOST, "--port", String(PORT)],
    { stdio: "ignore" },
  );
  await waitForServer();
});

test.afterAll(async () => {
  if (!serverProcess) {
    return;
  }

  serverProcess.kill("SIGTERM");
  await new Promise((resolve) => {
    serverProcess.once("exit", resolve);
    setTimeout(resolve, 1000);
  });
});

test("dashboard-first entry exposes quick actions, metadata, and primary search", async ({ page }) => {
  await page.goto(BASE_URL);

  await expect(page.getByRole("heading", { name: "Ricerca primaria" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Lista archivio/i })).toBeVisible();
  await expect(page.getByText("Numero record")).toBeVisible();
  await expect(page.locator("#archive-state dd").nth(1)).toHaveText("2");

  await page.getByLabel("Cerca un titolo").fill("Chrono Trigger");
  await page.getByRole("button", { name: "Vai alla lista" }).click();

  await expect(page.locator("#route-preview")).toContainText("Ricerca: Chrono Trigger");
  await expect(page.getByRole("link", { name: /Chrono Trigger/i })).toBeVisible();
});

test("browse verification covers status filters and missing-status discoverability", async ({ page }) => {
  await page.goto(`${BASE_URL}/#/archive`);

  await page.locator("#status-filter").selectOption("__missing__");
  await expect(page.getByRole("link", { name: /Puzzle Bobble/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /Chrono Trigger/i })).toHaveCount(0);

  await page.locator("#status-filter").selectOption("OK");
  await expect(page.getByRole("link", { name: /Chrono Trigger/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /Puzzle Bobble/i })).toHaveCount(0);
});

test("detail verification keeps read-first behavior, explicit edit entry, and visible missing values", async ({
  page,
}) => {
  await page.goto(`${BASE_URL}/#/detail?title=Puzzle%20Bobble`);

  await expect(page.getByRole("heading", { name: "Puzzle Bobble" })).toBeVisible();
  await expect(page.getByText("Valore mancante")).toHaveCount(2);
  await expect(page.getByRole("link", { name: "Modifica questa variante" })).toBeVisible();

  await page.getByRole("link", { name: "Modifica questa variante" }).click();
  await expect(page.getByText("Modifica persistita")).toBeVisible();
  await expect(page.locator('input[name="titolo"]')).toHaveValue("Puzzle Bobble");
  await expect(page.locator('input[name="supporto"]')).toHaveValue("");
});

test("create and update flows keep detail, list, and validation feedback coherent", async ({ page }) => {
  await page.goto(`${BASE_URL}/#/edit?title=Puzzle%20Bobble&variant=0`);

  await page.locator('input[name="titolo"]').fill("Chrono Trigger");
  await page.locator('input[name="edizioneVersione"]').fill("AES");
  await page.locator('input[name="supporto"]').fill("cartuccia");
  await page.locator('input[name="stato"]').fill("Completo");
  await page.getByRole("button", { name: "Salva modifiche" }).click();
  await expect(page.getByText("already exists in active archive")).toBeVisible();

  await page.locator('input[name="titolo"]').fill("Puzzle Bobble Deluxe");
  await page.getByRole("button", { name: "Salva modifiche" }).click();

  await expect(page).toHaveURL(/#\/detail\?title=Puzzle%20Bobble%20Deluxe/);
  await expect(page.getByRole("heading", { name: "Puzzle Bobble Deluxe" })).toBeVisible();

  await page.goto(`${BASE_URL}/#/archive?query=Puzzle%20Bobble%20Deluxe`);
  await expect(page.getByRole("link", { name: /Puzzle Bobble Deluxe/i })).toBeVisible();

  await page.goto(`${BASE_URL}/#/create`);
  await page.locator('input[name="titolo"]').fill("Terranigma");
  await page.locator('input[name="piattaforma"]').fill("SNES");
  await page.locator('input[name="edizioneVersione"]').fill("PAL");
  await page.locator('input[name="supporto"]').fill("cartuccia");
  await page.locator('input[name="stato"]').fill("OK");
  await page.getByRole("button", { name: "Salva titolo" }).click();

  await expect(page).toHaveURL(/#\/detail\?title=Terranigma/);
  await expect(page.getByRole("heading", { name: "Terranigma" })).toBeVisible();

  await page.goto(`${BASE_URL}/#/archive?query=Terranigma`);
  await expect(page.getByRole("link", { name: /Terranigma/i })).toBeVisible();
});
