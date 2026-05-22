const { test, expect } = require("@playwright/test");
const { spawn } = require("node:child_process");
const fs = require("node:fs");
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
const SAMPLE_ODS_PATH = path.join(__dirname, "..", ".local", "1001.ods");
const HAS_PINNED_CHROMIUM = fs.existsSync(CHROMIUM_EXECUTABLE);

let serverProcess;

async function waitForServer() {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      const response = await fetch(`${BASE_URL}/index.html`);
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
  launchOptions: HAS_PINNED_CHROMIUM ? { executablePath: CHROMIUM_EXECUTABLE } : {},
});

test.beforeAll(async () => {
  serverProcess = spawn(
    "python3",
    [path.join(__dirname, "static_server.py"), "--host", HOST, "--port", String(PORT)],
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

const FIXTURE_STORAGE = {
  schemaVersion: "v1",
  activeArchive: {
    metadata: {
      archivioAttivo: true,
      numeroRecord: 2,
      ultimaModificaLocale: "2026-05-22T08:30:00",
      versioneSchema: "v1",
    },
    titles: [
      {
        titolo: "Puzzle Bobble",
        sottoVarianti: [
          {
            piattaforma: "Neo Geo",
            edizioneVersione: "",
            supporto: "",
            stato: "",
          },
        ],
      },
      {
        titolo: "Chrono Trigger",
        sottoVarianti: [
          {
            piattaforma: "SNES",
            edizioneVersione: "PAL",
            supporto: "cartuccia",
            stato: "OK",
          },
        ],
      },
    ],
  },
  pendingImport: null,
};

const EMPTY_STORAGE = {
  schemaVersion: "v1",
  activeArchive: null,
  pendingImport: null,
};

async function seedArchiveStorage(page, storagePayload = FIXTURE_STORAGE) {
  await page.goto(BASE_URL);
  await page.evaluate(async (payload) => {
    const request = indexedDB.open("archivio-1001", 1);
    const db = await new Promise((resolve, reject) => {
      request.onupgradeneeded = () => {
        const database = request.result;
        if (!database.objectStoreNames.contains("runtime")) {
          database.createObjectStore("runtime");
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    await new Promise((resolve, reject) => {
      const transaction = db.transaction("runtime", "readwrite");
      transaction.objectStore("runtime").put(payload, "archive-storage");
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });

    db.close();
  }, storagePayload);
  await page.reload();
}

test("dashboard-first entry exposes quick actions, metadata, and primary search", async ({ page }) => {
  await seedArchiveStorage(page);
  await page.goto(BASE_URL);

  await expect(page.getByRole("heading", { name: "Ricerca primaria" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Lista archivio/i })).toBeVisible();
  await expect(page.getByText("Numero record")).toBeVisible();
  await expect(page.locator("#archive-state dd").nth(1)).toHaveText("2");

  await page.getByLabel("Cerca un titolo").fill("Chrono Trigger");
  await page.getByRole("button", { name: "Vai alla lista" }).click();

  await expect(page).toHaveURL(/#\/archive\?title=Chrono\+Trigger/);
  await expect(page.locator("#dashboard-panels")).toBeHidden();
  await expect(page.getByRole("heading", { name: "Consultazione titoli" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Chrono Trigger/i })).toBeVisible();
});

test("browse verification covers combined filters, status filters, and missing-status discoverability", async ({
  page,
}) => {
  await seedArchiveStorage(page);
  await page.goto(`${BASE_URL}/#/archive`);

  await page.locator("#status-filter").selectOption("__missing__");
  await expect(page).toHaveURL(/status=__missing__/);
  await expect(page.getByRole("link", { name: /Puzzle Bobble/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /Chrono Trigger/i })).toHaveCount(0);

  await page.locator("#status-filter").selectOption("OK");
  await page.locator('input[name="platform"]').fill("SNES");
  await expect(page).toHaveURL(/platform=SNES/);
  await expect(page.getByRole("link", { name: /Chrono Trigger/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /Puzzle Bobble/i })).toHaveCount(0);
});

test("detail verification keeps read-first behavior, explicit edit entry, and visible missing values", async ({
  page,
}) => {
  await seedArchiveStorage(page);
  await page.goto(`${BASE_URL}/#/detail?title=Puzzle%20Bobble`);

  await expect(page.getByRole("heading", { name: "Puzzle Bobble" })).toBeVisible();
  await expect(page.getByText("Valore mancante")).toHaveCount(2);
  await expect(page.getByRole("link", { name: "Modifica questa variante" })).toBeVisible();

  await page.getByRole("link", { name: "Modifica questa variante" }).click();
  await expect(page.getByText("Modifica persistita")).toBeVisible();
  await expect(page.locator('input[name="titolo"]')).toHaveValue("Puzzle Bobble");
  await expect(page.locator('input[name="supporto"]')).toHaveValue("");
});

test("update flows keep detail, list, and validation feedback coherent", async ({ page }) => {
  await seedArchiveStorage(page);
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

  await page.goto(`${BASE_URL}/#/archive?title=Puzzle%20Bobble%20Deluxe`);
  await expect(page.getByRole("link", { name: /Puzzle Bobble Deluxe/i })).toBeVisible();
});

test("browser-only shell caches required assets and persisted archive remains usable offline", async ({
  page,
}) => {
  await seedArchiveStorage(page);
  await page.goto(`${BASE_URL}/#/archive?title=Chrono%20Trigger`);

  await expect(page.getByRole("link", { name: /Chrono Trigger/i })).toBeVisible();

  await page.evaluate(async () => {
    const cache = await caches.open("archivio-1001-shell-v1");
    const requiredAssets = [
      "/index.html",
      "/styles.css",
      "/app.js",
      "/storage.js",
      "/manifest.webmanifest",
      "/icon-192.svg",
      "/icon-512.svg",
    ];

    for (const asset of requiredAssets) {
      const match = await cache.match(asset);
      if (!match) {
        throw new Error(`Missing cached asset: ${asset}`);
      }
    }
  });

  await page.context().setOffline(true);
  await page.goto(`${BASE_URL}/#/detail?title=Chrono%20Trigger`);

  await expect(page.getByRole("heading", { name: "Chrono Trigger" })).toBeVisible();
  await expect(page.getByText("1 sotto-varianti in ordine sorgente preservato.")).toBeVisible();

  await page.context().setOffline(false);
});

test("import route accepts an ODS file and activates the archive when no dataset exists", async ({
  page,
}) => {
  await seedArchiveStorage(page, EMPTY_STORAGE);
  await page.goto(`${BASE_URL}/#/import`);

  await page.locator("#import-file").setInputFiles(SAMPLE_ODS_PATH);
  await page.getByRole("button", { name: "Leggi archivio" }).click();

  await expect(page).toHaveURL(/#\/archive/);
  await expect(page.locator("#archive-state")).toContainText("Archivio attivo");
  await expect(page.locator("#archive-state")).toContainText("1049");
  await expect(page.getByRole("link", { name: /Chrono Trigger/i })).toBeVisible();
});

test("import route stages overwrite confirmation before replacing an active archive", async ({
  page,
}) => {
  await seedArchiveStorage(page);
  await page.goto(`${BASE_URL}/#/import`);

  await page.locator("#import-file").setInputFiles(SAMPLE_ODS_PATH);
  await page.getByRole("button", { name: "Leggi archivio" }).click();

  await expect(page.getByRole("heading", { name: "Conferma sostituzione archivio" })).toBeVisible();
  await expect(page.locator("#route-content")).toContainText("1001.ods");
  await expect(page.locator("#route-content")).toContainText("1049");

  await page.getByRole("button", { name: "Annulla import" }).click();
  await expect(page.getByRole("heading", { name: "Carica archivio dal foglio Lista" })).toBeVisible();

  await page.locator("#import-file").setInputFiles(SAMPLE_ODS_PATH);
  await page.getByRole("button", { name: "Leggi archivio" }).click();
  await page.getByRole("button", { name: "Conferma sostituzione" }).click();

  await expect(page).toHaveURL(/#\/archive/);
  await expect(page.locator("#archive-state")).toContainText("1049");
  await expect(page.getByRole("link", { name: /Chrono Trigger/i })).toBeVisible();
});
