const { test, expect } = require("@playwright/test");
const { execFileSync, spawn } = require("node:child_process");
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
  await page.goto(`${BASE_URL}/#/dashboard`);

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

test("existing active archive opens archive route by default", async ({ page }) => {
  await seedArchiveStorage(page);
  await page.goto(BASE_URL);

  await expect(page).toHaveURL(/#\/archive$/);
  await expect(page.getByLabel("Cerca un titolo")).toBeVisible();
  await expect(page.locator("#dashboard-panels")).toBeHidden();
  await expect(page.getByRole("heading", { name: "Consultazione titoli" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Chrono Trigger/i })).toBeVisible();
});

test("empty archive state hides primary search", async ({ page }) => {
  await seedArchiveStorage(page, EMPTY_STORAGE);
  await page.goto(BASE_URL);

  await expect(page.getByLabel("Cerca un titolo")).toBeHidden();
  await expect(page.getByText("Nessun archivio attivo")).toBeVisible();
  await expect(page.getByRole("link", { name: /Esporta/i })).toHaveCount(0);

  await page.goto(`${BASE_URL}/#/export`);
  await expect(page.getByRole("heading", { name: "Nessun archivio da esportare" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Scarica ODS" })).toHaveCount(0);
});

test("browse verification covers combined filters, status filters, and missing-status discoverability", async ({
  page,
}) => {
  await seedArchiveStorage(page);
  await page.goto(`${BASE_URL}/#/archive`);

  await expect(page.locator('select[name="platform"]')).toHaveCount(1);
  await expect(page.locator('input[name="platform"]')).toHaveCount(0);
  await expect(page.locator('select[name="platform"] option')).toHaveText([
    "Piattaforma",
    "Neo Geo",
    "SNES",
  ]);

  const editionFilter = page.getByRole("searchbox", { name: "Edition/version" });
  await editionFilter.fill("PAL");
  await expect(page).toHaveURL(/edition=PAL/);
  await expect(page.getByRole("link", { name: /Chrono Trigger/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /Puzzle Bobble/i })).toHaveCount(0);
  await editionFilter.fill("");

  await page.locator("#status-filter").selectOption("__missing__");
  await expect(page).toHaveURL(/status=__missing__/);
  await expect(page.getByRole("link", { name: /Puzzle Bobble/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /Chrono Trigger/i })).toHaveCount(0);

  await page.locator("#status-filter").selectOption("OK");
  await page.locator('select[name="platform"]').selectOption("SNES");
  await expect(page).toHaveURL(/platform=SNES/);
  await expect(page.getByRole("link", { name: /Chrono Trigger/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /Puzzle Bobble/i })).toHaveCount(0);

  await page.getByRole("button", { name: "OK" }).click();
  await expect(page.locator("#status-filter")).toHaveValue("");
});

test("clear filters empties the title search instead of restoring the previous value", async ({ page }) => {
  await seedArchiveStorage(page);
  await page.goto(`${BASE_URL}/#/archive?title=Chrono%20Trigger&platform=SNES&status=OK`);

  await expect(page.locator('input[name="title"]')).toHaveValue("Chrono Trigger");
  await expect(page.locator('select[name="platform"]')).toHaveValue("SNES");

  await page.getByRole("button", { name: "Pulisci tutto" }).click();

  await expect(page).toHaveURL(/#\/archive$/);
  await expect(page.locator('input[name="title"]')).toHaveValue("");
  await expect(page.locator('select[name="platform"]')).toHaveValue("");
  await expect(page.locator("#status-filter")).toHaveValue("");
  await expect(page.getByRole("link", { name: /Puzzle Bobble/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /Chrono Trigger/i })).toBeVisible();
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
  await expect(page.locator('select[name="piattaforma"]')).toHaveValue("Neo Geo");
  await expect(page.locator('input[name="piattaforma"]')).toHaveCount(0);
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
    await navigator.serviceWorker.ready;
    const cache = await caches.open("archivio-1001-shell-v4");
    const requiredAssets = [
      "/index.html",
      "/styles.css",
      "/app.js",
      "/storage.js",
      "/ods-export.js",
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

test("export downloads a valid, reimportable ODS from the active archive after an offline reload", async ({
  page,
}) => {
  const storage = structuredClone(FIXTURE_STORAGE);
  const { titles, metadata } = storage.activeArchive;
  titles[1].sottoVarianti[0].statusColor = "#63a4ce";
  titles[1].sottoVarianti.push({
    piattaforma: "Nintendo DS",
    edizioneVersione: "Édition  & <DS>",
    supporto: "cartuccia",
    stato: "Da comprare",
    statusColor: "#ff8000",
  });
  titles.push({
    titolo: "Terranigma",
    sottoVarianti: [
      { piattaforma: "SNES", edizioneVersione: "PAL", supporto: "cartuccia", stato: "Uscito fuori" },
      { piattaforma: "SNES", edizioneVersione: "JPN", supporto: "cartuccia", stato: "Non reperibile" },
    ],
  });
  metadata.numeroRecord = titles.length;
  storage.pendingImport = {
    sourceName: "sostituzione.ods",
    stagedAt: metadata.ultimaModificaLocale,
    titles: [titles[2]],
  };

  await seedArchiveStorage(page, storage);
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => undefined));
  await page.locator('#route-nav [data-route="export"]').click();
  await page.waitForURL("**/#/export");
  await page.reload(); // Ensure the active service worker controls this page.
  await page.context().setOffline(true);
  await page.reload();

  await expect(page.getByRole("heading", { name: "archivio-1001.ods" })).toBeVisible();
  await expect(page.locator(".export-summary dd")).toHaveText(["3", "5"]);

  const downloadEvent = page.waitForEvent("download");
  await page.getByRole("button", { name: "Scarica ODS" }).click();
  const download = await downloadEvent;
  expect(download.suggestedFilename()).toBe("archivio-1001.ods");
  await expect(page.getByRole("status")).toHaveText("Download avviato.");

  const filePath = await download.path();
  const workbook = JSON.parse(execFileSync("python3", ["-c", `
import json, sys, zipfile, xml.etree.ElementTree as ET
with zipfile.ZipFile(sys.argv[1]) as ods:
    assert ods.testzip() is None
    assert ods.namelist() == ["mimetype", "META-INF/manifest.xml", "content.xml", "styles.xml", "meta.xml"]
    mime = ods.infolist()[0]
    assert mime.header_offset == 0 and not mime.extra and mime.compress_type == zipfile.ZIP_STORED
    assert ods.read(mime) == b"application/vnd.oasis.opendocument.spreadsheet"
    ns = {
        "office": "urn:oasis:names:tc:opendocument:xmlns:office:1.0",
        "table": "urn:oasis:names:tc:opendocument:xmlns:table:1.0",
        "text": "urn:oasis:names:tc:opendocument:xmlns:text:1.0",
        "style": "urn:oasis:names:tc:opendocument:xmlns:style:1.0",
    }
    def cell_text(cell):
        paragraph = cell.find("text:p", ns)
        if paragraph is None:
            return ""
        return (paragraph.text or "") + "".join(
            " " * int(space.get(ET.QName(ns["text"], "c"), "1")) + (space.tail or "")
            for space in paragraph.findall("text:s", ns)
        )
    xml = ET.fromstring(ods.read("content.xml"))
    tables = xml.findall("office:body/office:spreadsheet/table:table", ns)
    assert [len(table.findall("table:table-column", ns)) for table in tables] == [5, 9, 2]
    lista, risultati, appoggio = [table.findall("table:table-row", ns) for table in tables]
    attr = lambda cell, name: cell.get(ET.QName(ns["table"], name))
    assert attr(lista[3][0], "number-rows-spanned") == "2"
    assert attr(lista[3][1], "number-rows-spanned") == "2"
    assert all(cell.tag == ET.QName(ns["table"], "covered-table-cell") for cell in lista[4][:2])
    assert attr(lista[1][4], "style-name") == "Status_63a4ce"
    assert attr(lista[2][4], "style-name") == "StatusOrange"
    assert attr(lista[3][4], "style-name") == "StatusRed"
    assert len(xml.findall("office:automatic-styles/style:style/style:map", ns)) == 4
    assert attr(risultati[0][0], "number-matrix-rows-spanned") == "3"
    assert "UNIQUE" in attr(risultati[0][0], "formula")
    assert "COUNTIFS" in attr(risultati[1][1], "formula")
    assert attr(risultati[1][5], "formula") == "of:=SUM([.D2:.E2])"
    assert "UNIQUE" in attr(risultati[1][7], "formula")
    assert "COUNTIF" in attr(risultati[1][8], "formula")
    assert "IF" in attr(appoggio[2][0], "formula") and "$Lista.E3" in attr(appoggio[2][1], "formula")
    print(json.dumps([
        [table.get(ET.QName(ns["table"], "name")), [
            [cell_text(cell) for cell in row]
            for row in table.findall("table:table-row", ns)
        ]]
        for table in tables
    ]))
`, filePath], { encoding: "utf8" }));
  expect(workbook).toEqual([
    ["Lista", [
      ["Puzzle Bobble", "Neo Geo", "", "", ""],
      ["Chrono Trigger", "SNES", "PAL", "cartuccia", "OK"],
      ["", "Nintendo DS", "Édition  & <DS>", "cartuccia", "Da comprare"],
      ["Terranigma", "SNES", "PAL", "cartuccia", "Uscito fuori"],
      ["", "", "JPN", "cartuccia", "Non reperibile"],
    ]],
    ["Risultati", [
      ["Puzzle Bobble", "-", "", "Mancanti", "Ok", "Total", "", "", "Total"],
      ["Chrono Trigger", "x", "", "1", "2", "3", "", "OK", "1"],
      ["Terranigma", "x", "", "", "", "", "", "Da comprare", "1"],
      ["", "", "", "", "", "", "", "Uscito fuori", "1"],
      ["", "", "", "", "", "", "", "Non reperibile", "1"],
    ]],
    ["Appoggio", [
      ["Puzzle Bobble", ""], ["Chrono Trigger", "OK"], ["Chrono Trigger", "Da comprare"],
      ["Terranigma", "Uscito fuori"], ["Terranigma", "Non reperibile"],
    ]],
  ]);

  const reimported = await page.evaluate(async (bytes) => {
    const { importODSFile, resolvePendingImport } = await import("/storage.js");
    await importODSFile(new File([new Uint8Array(bytes)], "archivio-1001.ods"));
    return (await resolvePendingImport(true)).archive.activeTitles;
  }, [...fs.readFileSync(filePath)]);
  const expected = structuredClone(titles);
  for (const variant of expected[2].sottoVarianti) variant.statusColor = "#ff0000";
  expect(reimported).toEqual(expected);

  await page.goto(`${BASE_URL}/#/archive`);
  await page.reload();
  const chrono = page.getByRole("link", { name: /Chrono Trigger/ });
  await expect(chrono.locator(".collection-pill .status-swatch")).toHaveCSS("background-color", "rgb(99, 164, 206)");
  await chrono.click();
  const colors = page.locator(".variant-status .status-swatch");
  await expect(colors.nth(0)).toHaveCSS("background-color", "rgb(99, 164, 206)");
  await expect(colors.nth(1)).toHaveCSS("background-color", "rgb(255, 128, 0)");

  await page.getByRole("link", { name: "Modifica questa variante" }).nth(0).click();
  await page.locator('input[name="stato"]').fill("Non reperibile");
  await page.getByRole("button", { name: "Salva modifiche" }).click();
  await expect(colors.nth(0)).toHaveCSS("background-color", "rgb(255, 0, 0)");
  await expect(colors.nth(1)).toHaveCSS("background-color", "rgb(255, 128, 0)");

  await page.locator('#route-nav [data-route="export"]').click();
  const updatedDownloadEvent = page.waitForEvent("download");
  await page.getByRole("button", { name: "Scarica ODS" }).click();
  const updatedFilePath = await (await updatedDownloadEvent).path();
  const updatedArchive = await page.evaluate(async (bytes) => {
    const { importODSFile, resolvePendingImport } = await import("/storage.js");
    await importODSFile(new File([new Uint8Array(bytes)], "archivio-1001.ods"));
    return (await resolvePendingImport(true)).archive.activeTitles;
  }, [...fs.readFileSync(updatedFilePath)]);
  expect(updatedArchive[1].sottoVarianti[0]).toMatchObject({
    stato: "Non reperibile",
    statusColor: "#ff0000",
  });
});

test("export reports generation failures without starting a download", async ({ page }) => {
  const storage = structuredClone(FIXTURE_STORAGE);
  storage.activeArchive.titles[0].sottoVarianti[0].supporto = "non valido\u0000";
  await seedArchiveStorage(page, storage);
  await page.goto(`${BASE_URL}/#/export`);

  let downloads = 0;
  page.on("download", () => { downloads += 1; });
  const button = page.getByRole("button", { name: "Scarica ODS" });
  await button.click();
  await expect(page.getByRole("status")).toHaveText(/Non è stato possibile esportare/);
  await expect(button).toBeEnabled();
  expect(downloads).toBe(0);
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

test("export of the reference workbook preserves Lista colors and vertical merges", async ({ page }) => {
  test.skip(!fs.existsSync(SAMPLE_ODS_PATH), "Reference workbook is available only in .local");
  await seedArchiveStorage(page, EMPTY_STORAGE);
  await page.goto(`${BASE_URL}/#/import`);
  await page.locator("#import-file").setInputFiles(SAMPLE_ODS_PATH);
  await page.getByRole("button", { name: "Leggi archivio" }).click();
  await page.locator('#route-nav [data-route="export"]').click();

  const downloadEvent = page.waitForEvent("download");
  await page.getByRole("button", { name: "Scarica ODS" }).click();
  const exportPath = await (await downloadEvent).path();
  execFileSync("python3", ["-c", `
import sys, zipfile, xml.etree.ElementTree as ET

T = "{urn:oasis:names:tc:opendocument:xmlns:table:1.0}"
S = "{urn:oasis:names:tc:opendocument:xmlns:style:1.0}"
FO = "{urn:oasis:names:tc:opendocument:xmlns:xsl-fo-compatible:1.0}"

def lista_features(path):
    with zipfile.ZipFile(path) as ods:
        xml = ET.fromstring(ods.read("content.xml"))
    colors = {}
    for style in xml.iter(S + "style"):
        props = style.find(S + "table-cell-properties")
        if props is not None:
            colors[style.get(S + "name")] = props.get(FO + "background-color")
    lista = next(xml.iter(T + "table"))
    features = []
    for row in lista.findall(T + "table-row"):
        cells = []
        for cell in row:
            cells.extend([cell] * min(5 - len(cells), int(cell.get(T + "number-columns-repeated", 1))))
        if len(cells) != 5 or not any("".join(cell.itertext()).strip() for cell in cells):
            continue
        features.append((
            colors.get(cells[4].get(T + "style-name")),
            tuple((cell.tag.endswith("covered-table-cell"), cell.get(T + "number-rows-spanned")) for cell in cells[:2]),
        ))
    return features

source, result = map(lista_features, sys.argv[1:])
assert len(source) == 1573 == len(result), (len(source), len(result))
assert [color for color, _ in source] == [color for color, _ in result]
differences = [(i, a, b) for i, ((_, a), (_, b)) in enumerate(zip(source, result), 1) if a != b]
assert not differences, differences[:20]
`, SAMPLE_ODS_PATH, exportPath]);
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
