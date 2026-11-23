import { buildOperationalODS, normalizeStatusColor, ODS_MIME_TYPE } from "./ods-export.js";

const DB_NAME = "archivio-1001";
const STORE_NAME = "runtime";
const STORAGE_KEY = "archive-storage";
const SCHEMA_VERSION = "v1";

const APP_CONFIG = {
  name: "Archivio 1001",
  tagline: "Dashboard offline-first per consultazione e manutenzione archive-first.",
  homeRoute: "#/dashboard",
  routes: [
    {
      id: "archive",
      label: "Lista archivio",
      href: "#/archive",
      description: "Apri la superficie principale di consultazione dei titoli.",
      primaryWhenActive: true,
      primaryWhenEmpty: false,
    },
    {
      id: "import",
      label: "Importa ODS",
      href: "#/import",
      description: "Carica o sostituisci il dataset locale dal foglio Lista.",
      primaryWhenActive: false,
      primaryWhenEmpty: true,
    },
    {
      id: "export",
      label: "Esporta ODS",
      href: "#/export",
      description: "Rigenera il workbook operativo dal dataset locale corrente.",
      primaryWhenActive: false,
      primaryWhenEmpty: false,
    },
  ],
};

const XML_NAMESPACES = {
  office: "urn:oasis:names:tc:opendocument:xmlns:office:1.0",
  table: "urn:oasis:names:tc:opendocument:xmlns:table:1.0",
  text: "urn:oasis:names:tc:opendocument:xmlns:text:1.0",
  style: "urn:oasis:names:tc:opendocument:xmlns:style:1.0",
  fo: "urn:oasis:names:tc:opendocument:xmlns:xsl-fo-compatible:1.0",
};

function requestToPromise(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("IndexedDB request failed."));
  });
}

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("IndexedDB open failed."));
  });
}

async function readStoredPayload() {
  const database = await openDatabase();
  try {
    const transaction = database.transaction(STORE_NAME, "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const payload = await requestToPromise(store.get(STORAGE_KEY));
    return payload === undefined ? null : payload;
  } finally {
    database.close();
  }
}

async function writeStoredPayload(payload) {
  const database = await openDatabase();
  try {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    await requestToPromise(store.put(payload, STORAGE_KEY));
    await new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () =>
        reject(transaction.error || new Error("IndexedDB write transaction failed."));
      transaction.onabort = () =>
        reject(transaction.error || new Error("IndexedDB write transaction aborted."));
    });
  } finally {
    database.close();
  }
}

function buildEmptyStoragePayload() {
  return {
    schemaVersion: SCHEMA_VERSION,
    activeArchive: null,
    pendingImport: null,
  };
}

function ensureString(value, context) {
  if (typeof value !== "string") {
    throw new Error(`${context} must be a string.`);
  }
  return value;
}

function ensureVariant(variant, context) {
  if (!variant || typeof variant !== "object") {
    throw new Error(`${context} must be an object.`);
  }

  const statusColor = normalizeStatusColor(variant.statusColor);
  return {
    piattaforma: ensureString(variant.piattaforma, `${context}.piattaforma`).trim(),
    edizioneVersione: ensureString(variant.edizioneVersione, `${context}.edizioneVersione`).trim(),
    supporto: ensureString(variant.supporto, `${context}.supporto`).trim(),
    stato: ensureString(variant.stato, `${context}.stato`).trim(),
    ...(Number.isSafeInteger(variant.sourceRow) && variant.sourceRow >= 0 && { sourceRow: variant.sourceRow }),
    ...(variant.separatePlatform === true && { separatePlatform: true }),
    ...(statusColor && { statusColor }),
  };
}

function ensureTitle(title, context) {
  if (!title || typeof title !== "object") {
    throw new Error(`${context} must be an object.`);
  }
  const titolo = ensureString(title.titolo, `${context}.titolo`).trim();
  if (!titolo) {
    throw new Error(`${context}.titolo must be a non-blank string.`);
  }
  if (!Array.isArray(title.sottoVarianti)) {
    throw new Error(`${context}.sottoVarianti must be a list.`);
  }

  const sottoVarianti = title.sottoVarianti.map((variant, index) =>
    ensureVariant(variant, `${context}.sottoVarianti[${index}]`),
  );

  if (!sottoVarianti.length) {
    throw new Error(`${context}.sottoVarianti must contain at least one item.`);
  }

  return {
    titolo,
    sottoVarianti,
  };
}

function ensureMetadata(metadata) {
  if (!metadata || typeof metadata !== "object") {
    throw new Error("activeArchive.metadata must be an object.");
  }
  if (typeof metadata.archivioAttivo !== "boolean") {
    throw new Error("activeArchive.metadata.archivioAttivo must be a bool.");
  }
  if (typeof metadata.numeroRecord !== "number") {
    throw new Error("activeArchive.metadata.numeroRecord must be an int.");
  }
  if (metadata.ultimaModificaLocale !== null && typeof metadata.ultimaModificaLocale !== "string") {
    throw new Error("activeArchive.metadata.ultimaModificaLocale must be null or ISO string.");
  }
  if (typeof metadata.versioneSchema !== "string" || !metadata.versioneSchema.trim()) {
    throw new Error("activeArchive.metadata.versioneSchema must be a non-blank string.");
  }

  return {
    archivioAttivo: metadata.archivioAttivo,
    numeroRecord: metadata.numeroRecord,
    ultimaModificaLocale: metadata.ultimaModificaLocale,
    versioneSchema: metadata.versioneSchema,
  };
}

function ensurePendingImport(pendingImport) {
  if (pendingImport == null) {
    return null;
  }
  if (!pendingImport || typeof pendingImport !== "object") {
    throw new Error("pendingImport must be an object or null.");
  }
  const sourceName = ensureString(pendingImport.sourceName, "pendingImport.sourceName").trim();
  const stagedAt = ensureString(pendingImport.stagedAt, "pendingImport.stagedAt").trim();
  if (!sourceName) {
    throw new Error("pendingImport.sourceName must be a non-blank string.");
  }
  if (!stagedAt) {
    throw new Error("pendingImport.stagedAt must be a non-blank string.");
  }
  if (!Array.isArray(pendingImport.titles)) {
    throw new Error("pendingImport.titles must be a list.");
  }

  return {
    sourceName,
    stagedAt,
    titles: pendingImport.titles.map((title, index) =>
      ensureTitle(title, `pendingImport.titles[${index}]`),
    ),
  };
}

function ensureStoragePayload(payload) {
  if (payload == null) {
    return buildEmptyStoragePayload();
  }
  if (typeof payload !== "object") {
    throw new Error("storage payload must be an object.");
  }

  if (typeof payload.schemaVersion !== "string" || !payload.schemaVersion.trim()) {
    throw new Error("storage payload must include a non-blank schemaVersion.");
  }
  if (payload.schemaVersion !== SCHEMA_VERSION) {
    throw new Error(`unsupported schema version ${payload.schemaVersion}.`);
  }

  let activeArchive = null;
  if (payload.activeArchive !== null) {
    if (!payload.activeArchive || typeof payload.activeArchive !== "object") {
      throw new Error("activeArchive must be an object or null.");
    }
    if (!Array.isArray(payload.activeArchive.titles)) {
      throw new Error("activeArchive.titles must be a list.");
    }
    activeArchive = {
      titles: payload.activeArchive.titles.map((title, index) =>
        ensureTitle(title, `activeArchive.titles[${index}]`),
      ),
      metadata: ensureMetadata(payload.activeArchive.metadata),
    };
  }

  return {
    schemaVersion: payload.schemaVersion,
    activeArchive,
    pendingImport: ensurePendingImport(payload.pendingImport),
  };
}

function buildRoutes(hasActiveArchive) {
  return APP_CONFIG.routes
    .filter((route) => hasActiveArchive || route.id !== "export")
    .map((route) => ({
      id: route.id,
      label: route.label,
      href: route.href,
      description: route.description,
      primary: hasActiveArchive ? route.primaryWhenActive : route.primaryWhenEmpty,
    }));
}

export function buildDashboardPayload(storagePayload) {
  const normalized = ensureStoragePayload(storagePayload);
  const activeArchive = normalized.activeArchive;
  const metadata = activeArchive ? activeArchive.metadata : null;
  const activeTitles = activeArchive ? activeArchive.titles : [];
  const hasActiveArchive = Boolean(metadata && metadata.archivioAttivo);
  const pendingImport = normalized.pendingImport;

  return {
    app: {
      name: APP_CONFIG.name,
      tagline: APP_CONFIG.tagline,
      homeRoute: APP_CONFIG.homeRoute,
      routes: buildRoutes(hasActiveArchive),
    },
    search: {
      placeholder: "Cerca un titolo",
      submitLabel: "Vai alla lista",
      destinationHref: "#/archive",
    },
    archive: {
      hasActiveArchive,
      metadata,
      activeTitles,
      pendingImport: pendingImport
        ? {
            sourceName: pendingImport.sourceName,
            stagedAt: pendingImport.stagedAt,
            titleCount: pendingImport.titles.length,
          }
        : null,
      requiresOverwriteConfirmation: hasActiveArchive && Boolean(pendingImport),
      emptyState: {
        title: "Nessun archivio attivo",
        body: "Importa un file ODS per attivare il dataset locale e sbloccare consultazione, ricerca ed export.",
        ctaHref: "#/import",
        ctaLabel: "Importa il primo archivio",
      },
    },
  };
}

export async function loadDashboardPayload() {
  const payload = await readStoredPayload();
  return buildDashboardPayload(payload);
}

export async function exportActiveArchiveODS() {
  const { activeArchive } = ensureStoragePayload(await readStoredPayload());
  if (!activeArchive?.metadata.archivioAttivo) {
    throw new Error("Nessun archivio attivo da esportare.");
  }
  return buildOperationalODS(activeArchive.titles);
}

function buildNextMetadata(titleCount) {
  return {
    archivioAttivo: true,
    numeroRecord: titleCount,
    ultimaModificaLocale: new Date().toISOString(),
    versioneSchema: SCHEMA_VERSION,
  };
}

function buildTitleFromCreatePayload(payload) {
  if (!payload || typeof payload !== "object") {
    throw new Error("create payload must be a JSON object");
  }

  const titolo = ensureString(payload.titolo, "titolo").trim();
  if (!titolo) {
    throw new Error("titolo must be a non-blank string");
  }

  const variant = ensureVariant(payload.sottoVariante, "sottoVariante");
  if (!variant.piattaforma || !variant.edizioneVersione || !variant.supporto || !variant.stato) {
    throw new Error(
      "sottoVariante must contain string piattaforma, edizioneVersione, supporto, stato",
    );
  }

  return {
    titolo,
    sottoVarianti: [variant],
  };
}

function rebuildStorageWithTitles(storagePayload, titles) {
  return {
    schemaVersion: storagePayload.schemaVersion,
    activeArchive: {
      titles,
      metadata: buildNextMetadata(titles.length),
    },
    pendingImport: storagePayload.pendingImport,
  };
}

export async function createTitleRecord(payload) {
  const currentStorage = ensureStoragePayload(await readStoredPayload());
  const newTitle = buildTitleFromCreatePayload(payload);
  const currentTitles = currentStorage.activeArchive ? [...currentStorage.activeArchive.titles] : [];

  if (currentTitles.some((title) => title.titolo === newTitle.titolo)) {
    throw new Error(`title ${JSON.stringify(newTitle.titolo)} already exists in active archive`);
  }

  currentTitles.push(newTitle);
  const nextStorage = rebuildStorageWithTitles(currentStorage, currentTitles);
  await writeStoredPayload(nextStorage);
  return buildDashboardPayload(nextStorage);
}

export async function updateTitleRecord(existingTitle, variantIndex, payload) {
  const currentStorage = ensureStoragePayload(await readStoredPayload());
  const activeArchive = currentStorage.activeArchive;

  if (!activeArchive) {
    throw new Error("cannot mutate titles when no active archive exists");
  }

  const normalizedTitle = ensureString(existingTitle, "existingTitle").trim();
  if (!normalizedTitle) {
    throw new Error("existing_title must be a non-blank string");
  }

  if (!Number.isInteger(variantIndex) || variantIndex < 0) {
    throw new Error("variant_index must be zero or greater");
  }

  const nextTitle = buildTitleFromCreatePayload(payload);
  const titles = [...activeArchive.titles];
  const targetIndex = titles.findIndex((title) => title.titolo === normalizedTitle);

  if (targetIndex === -1) {
    throw new Error(`title ${JSON.stringify(normalizedTitle)} was not found in active archive`);
  }

  if (
    titles.some((title, index) => index !== targetIndex && title.titolo === nextTitle.titolo)
  ) {
    throw new Error(`title ${JSON.stringify(nextTitle.titolo)} already exists in active archive`);
  }

  const currentTitle = titles[targetIndex];
  if (variantIndex >= currentTitle.sottoVarianti.length) {
    throw new Error(
      `variant_index ${variantIndex} is out of range for title ${JSON.stringify(normalizedTitle)}`,
    );
  }

  const updatedVariants = [...currentTitle.sottoVarianti];
  const previousVariant = updatedVariants[variantIndex];
  const nextVariant = nextTitle.sottoVarianti[0];
  if (previousVariant.sourceRow !== undefined) nextVariant.sourceRow = previousVariant.sourceRow;
  if (nextVariant.stato === previousVariant.stato && previousVariant.statusColor) {
    nextVariant.statusColor = previousVariant.statusColor;
  }
  if (nextVariant.piattaforma === previousVariant.piattaforma && previousVariant.separatePlatform) {
    nextVariant.separatePlatform = true;
  }
  updatedVariants[variantIndex] = nextVariant;
  titles[targetIndex] = {
    titolo: nextTitle.titolo,
    sottoVarianti: updatedVariants,
  };

  const nextStorage = rebuildStorageWithTitles(currentStorage, titles);
  await writeStoredPayload(nextStorage);
  return buildDashboardPayload(nextStorage);
}

function findEndOfCentralDirectory(bytes) {
  for (let index = bytes.length - 22; index >= 0; index -= 1) {
    if (
      bytes[index] === 0x50 &&
      bytes[index + 1] === 0x4b &&
      bytes[index + 2] === 0x05 &&
      bytes[index + 3] === 0x06
    ) {
      return index;
    }
  }
  throw new Error("ODS file is missing ZIP central directory.");
}

function parseZipEntries(arrayBuffer) {
  const bytes = new Uint8Array(arrayBuffer);
  const view = new DataView(arrayBuffer);
  const eocdOffset = findEndOfCentralDirectory(bytes);
  const centralDirectorySize = view.getUint32(eocdOffset + 12, true);
  const centralDirectoryOffset = view.getUint32(eocdOffset + 16, true);
  const entries = [];
  let cursor = centralDirectoryOffset;
  const centralDirectoryEnd = centralDirectoryOffset + centralDirectorySize;
  const decoder = new TextDecoder("utf-8");

  while (cursor < centralDirectoryEnd) {
    if (view.getUint32(cursor, true) !== 0x02014b50) {
      throw new Error("ODS ZIP central directory is malformed.");
    }

    const compressionMethod = view.getUint16(cursor + 10, true);
    const compressedSize = view.getUint32(cursor + 20, true);
    const fileNameLength = view.getUint16(cursor + 28, true);
    const extraFieldLength = view.getUint16(cursor + 30, true);
    const fileCommentLength = view.getUint16(cursor + 32, true);
    const localHeaderOffset = view.getUint32(cursor + 42, true);
    const fileNameBytes = bytes.slice(cursor + 46, cursor + 46 + fileNameLength);
    const fileName = decoder.decode(fileNameBytes);

    entries.push({
      compressionMethod,
      compressedSize,
      fileName,
      localHeaderOffset,
    });

    cursor += 46 + fileNameLength + extraFieldLength + fileCommentLength;
  }

  return entries;
}

async function inflateRaw(bytes) {
  if (typeof DecompressionStream !== "function") {
    throw new Error("Il browser non supporta DecompressionStream; import ODS non disponibile.");
  }

  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
  const inflatedBuffer = await new Response(stream).arrayBuffer();
  return new Uint8Array(inflatedBuffer);
}

async function readZipEntryText(file, entryName, required = true) {
  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  const view = new DataView(arrayBuffer);
  const entry = parseZipEntries(arrayBuffer).find((candidate) => candidate.fileName === entryName);

  if (!entry) {
    if (!required) return null;
    throw new Error(`ODS archive is missing ${entryName}.`);
  }

  const localHeaderOffset = entry.localHeaderOffset;
  if (view.getUint32(localHeaderOffset, true) !== 0x04034b50) {
    throw new Error(`ODS archive entry ${entryName} has an invalid local header.`);
  }

  const fileNameLength = view.getUint16(localHeaderOffset + 26, true);
  const extraFieldLength = view.getUint16(localHeaderOffset + 28, true);
  const dataOffset = localHeaderOffset + 30 + fileNameLength + extraFieldLength;
  const compressedBytes = bytes.slice(dataOffset, dataOffset + entry.compressedSize);

  let outputBytes;
  if (entry.compressionMethod === 0) {
    outputBytes = compressedBytes;
  } else if (entry.compressionMethod === 8) {
    outputBytes = await inflateRaw(compressedBytes);
  } else {
    throw new Error(`Unsupported ODS compression method ${entry.compressionMethod}.`);
  }

  return new TextDecoder("utf-8").decode(outputBytes);
}

function firstElementByTagNameNS(parent, namespace, localName) {
  const matches = parent.getElementsByTagNameNS(namespace, localName);
  return matches.length ? matches[0] : null;
}

function parseRepeatCount(rawValue, context) {
  if (rawValue == null || rawValue === "") {
    return 1;
  }

  const parsedValue = Number.parseInt(rawValue, 10);
  if (!Number.isInteger(parsedValue) || parsedValue < 1) {
    throw new Error(`Invalid ${context}: ${JSON.stringify(rawValue)}`);
  }
  return parsedValue;
}

function readParagraphText(node) {
  if (node.nodeType === Node.TEXT_NODE || node.nodeType === Node.CDATA_SECTION_NODE) {
    return node.textContent;
  }
  if (node.namespaceURI === XML_NAMESPACES.text) {
    if (node.localName === "s") {
      return " ".repeat(parseRepeatCount(node.getAttributeNS(XML_NAMESPACES.text, "c"), "text:c"));
    }
    if (node.localName === "tab") return "\t";
    if (node.localName === "line-break") return "\n";
  }
  return [...node.childNodes].map(readParagraphText).join("");
}

function extractCellText(cell) {
  const paragraphs = [...cell.getElementsByTagNameNS(XML_NAMESPACES.text, "p")]
    .map((paragraph) => readParagraphText(paragraph).trim())
    .filter((value) => value !== "");

  if (paragraphs.length) {
    return paragraphs.join("\n");
  }

  return (cell.getAttributeNS(XML_NAMESPACES.office, "value") || "").trim();
}

function parseRowCells(row, rowIndex, statusColors) {
  const values = [];
  let cellIndex = 0;
  let explicitStringWidth = 0;
  let platformIsCovered = false;
  let statusColor;

  for (const cell of row.children) {
    if (
      cell.namespaceURI !== XML_NAMESPACES.table ||
      (cell.localName !== "table-cell" && cell.localName !== "covered-table-cell")
    ) {
      continue;
    }

    cellIndex += 1;
    const repeatedCells = parseRepeatCount(
      cell.getAttributeNS(XML_NAMESPACES.table, "number-columns-repeated"),
      `cell ${cellIndex} number-columns-repeated`,
    );
    const cellText = extractCellText(cell);
    if (values.length < 2 && values.length + repeatedCells >= 2) {
      platformIsCovered = cell.localName === "covered-table-cell";
    }
    if (values.length < 5 && values.length + repeatedCells >= 5) {
      statusColor = statusColors.get(cell.getAttributeNS(XML_NAMESPACES.table, "style-name"));
    }
    for (let repeatIndex = 0; repeatIndex < repeatedCells; repeatIndex += 1) {
      values.push(cellText);
    }
    if (
      values.length <= 5 &&
      cell.getAttributeNS(XML_NAMESPACES.office, "value-type") === "string" &&
      firstElementByTagNameNS(cell, XML_NAMESPACES.text, "p")
    ) {
      explicitStringWidth = values.length;
    }
  }

  // Keep explicitly serialized blank fields in the five Lista columns, but
  // ignore trailing spreadsheet padding.
  while (values.length > explicitStringWidth && values[values.length - 1] === "") {
    values.pop();
  }

  if (!values.some((value) => value !== "")) {
    return null;
  }

  return { values, platformIsCovered, statusColor };
}

function extractNonEmptyRows(sheet, statusColors) {
  const rows = [];
  const tableRows = [...sheet.children].filter(
    (node) => node.namespaceURI === XML_NAMESPACES.table && node.localName === "table-row",
  );

  tableRows.forEach((row, index) => {
    const repeatedRows = parseRepeatCount(
      row.getAttributeNS(XML_NAMESPACES.table, "number-rows-repeated"),
      `row ${index + 1} number-rows-repeated`,
    );
    const parsedRow = parseRowCells(row, index + 1, statusColors);
    if (!parsedRow) {
      return;
    }
    for (let repeatIndex = 0; repeatIndex < repeatedRows; repeatIndex += 1) {
      rows.push(parsedRow);
    }
  });

  return rows;
}

function readCellStyleColors(...documents) {
  const styles = new Map();
  for (const document of documents) {
    if (!document) continue;
    for (const style of document.getElementsByTagNameNS(XML_NAMESPACES.style, "style")) {
      if (style.getAttributeNS(XML_NAMESPACES.style, "family") !== "table-cell") continue;
      const properties = firstElementByTagNameNS(style, XML_NAMESPACES.style, "table-cell-properties");
      styles.set(style.getAttributeNS(XML_NAMESPACES.style, "name"), {
        background: properties?.getAttributeNS(XML_NAMESPACES.fo, "background-color"),
        parent: style.getAttributeNS(XML_NAMESPACES.style, "parent-style-name"),
      });
    }
  }
  const colors = new Map();
  for (const name of styles.keys()) {
    const visited = new Set();
    for (let current = name; current && !visited.has(current);) {
      visited.add(current);
      const style = styles.get(current);
      if (!style) break;
      if (style.background) {
        const color = normalizeStatusColor(style.background);
        if (color) colors.set(name, color);
        break;
      }
      current = style.parent;
    }
  }
  return colors;
}

async function parseListaWorkbookFile(file) {
  if (!(file instanceof File)) {
    throw new Error("Seleziona un file ODS valido prima di continuare.");
  }
  const fileName = file.name || "archivio.ods";
  const isOdsLike =
    fileName.toLowerCase().endsWith(".ods") || file.type === "" || file.type === ODS_MIME_TYPE;
  if (!isOdsLike) {
    throw new Error("Il file selezionato non sembra un archivio ODS.");
  }

  const contentXml = await readZipEntryText(file, "content.xml");
  const xml = new DOMParser().parseFromString(contentXml, "application/xml");
  if (xml.querySelector("parsererror")) {
    throw new Error("ODS content.xml non e' XML valido.");
  }

  const body = firstElementByTagNameNS(xml, XML_NAMESPACES.office, "body");
  const spreadsheet = body && firstElementByTagNameNS(body, XML_NAMESPACES.office, "spreadsheet");
  if (!spreadsheet) {
    throw new Error("ODS content.xml non contiene office:spreadsheet.");
  }

  const sheets = [...spreadsheet.children].filter(
    (node) => node.namespaceURI === XML_NAMESPACES.table && node.localName === "table",
  );
  if (!sheets.length) {
    throw new Error("ODS workbook contains no sheets.");
  }

  const firstSheet = sheets[0];
  const firstSheetName = firstSheet.getAttributeNS(XML_NAMESPACES.table, "name") || "";
  if (firstSheetName !== "Lista") {
    throw new Error(`First sheet must be named 'Lista'; found ${JSON.stringify(firstSheetName)}`);
  }

  const stylesXml = await readZipEntryText(file, "styles.xml", false);
  const namedStyles = stylesXml ? new DOMParser().parseFromString(stylesXml, "application/xml") : null;
  const statusColors = readCellStyleColors(namedStyles, xml);
  const listaRows = extractNonEmptyRows(firstSheet, statusColors);
  return {
    sourceName: fileName,
    listaRows,
  };
}

function normalizeListaRows(listaRows) {
  const groupedRows = new Map();
  let previousTitle = null;
  let previousPlatform = null;

  listaRows.forEach(({ values: rawRow, platformIsCovered, statusColor }, sourceRowIndex) => {
    if (!Array.isArray(rawRow) || rawRow.length !== 5) {
      throw new Error(
        `Row ${sourceRowIndex + 1} must contain exactly 5 columns; found ${rawRow.length}`,
      );
    }

    const [titolo, piattaforma, edizioneVersione, supporto, stato] = rawRow;
    const normalizedTitle = titolo.trim();
    const normalizedPlatform = piattaforma.trim();

    let effectiveTitle = normalizedTitle;
    if (normalizedTitle) {
      previousTitle = normalizedTitle;
    } else if (previousTitle == null) {
      throw new Error(
        `Row ${sourceRowIndex + 1} has a blank title before any title context exists`,
      );
    } else {
      effectiveTitle = previousTitle;
    }

    let effectivePlatform = normalizedPlatform;
    if (normalizedPlatform) {
      previousPlatform = normalizedPlatform;
    } else {
      effectivePlatform = previousPlatform || "";
    }

    if (!groupedRows.has(effectiveTitle)) {
      groupedRows.set(effectiveTitle, []);
    }
    const variants = groupedRows.get(effectiveTitle);
    const previousVariant = variants.at(-1);
    variants.push({
      piattaforma: effectivePlatform,
      edizioneVersione: edizioneVersione.trim(),
      supporto: supporto.trim(),
      stato: stato.trim(),
      sourceRow: sourceRowIndex,
      ...(normalizedPlatform && !platformIsCovered && previousVariant?.piattaforma === effectivePlatform &&
        { separatePlatform: true }),
      ...(statusColor && { statusColor }),
    });
  });

  const titles = [...groupedRows.entries()].map(([titolo, sottoVarianti]) => ({ titolo, sottoVarianti }));
  let groupedIndex = 0;
  const sourceOrderChanged = titles.flatMap(({ sottoVarianti }) => sottoVarianti)
    .some((variant) => variant.sourceRow !== groupedIndex++);
  if (!sourceOrderChanged) {
    for (const { sottoVarianti } of titles) {
      for (const variant of sottoVarianti) delete variant.sourceRow;
    }
  }
  return titles;
}

function buildStorageFromImportedTitles(storagePayload, titles, sourceName) {
  const hasActiveArchive = Boolean(
    storagePayload.activeArchive && storagePayload.activeArchive.metadata.archivioAttivo,
  );

  if (!hasActiveArchive) {
    return {
      schemaVersion: storagePayload.schemaVersion,
      activeArchive: {
        titles,
        metadata: buildNextMetadata(titles.length),
      },
      pendingImport: null,
    };
  }

  return {
    schemaVersion: storagePayload.schemaVersion,
    activeArchive: storagePayload.activeArchive,
    pendingImport: {
      sourceName,
      stagedAt: new Date().toISOString(),
      titles,
    },
  };
}

export async function importODSFile(file) {
  const currentStorage = ensureStoragePayload(await readStoredPayload());
  const parsedWorkbook = await parseListaWorkbookFile(file);
  const importedTitles = normalizeListaRows(parsedWorkbook.listaRows);

  if (!importedTitles.length) {
    throw new Error("Il foglio Lista non contiene righe importabili.");
  }

  const nextStorage = buildStorageFromImportedTitles(
    currentStorage,
    importedTitles,
    parsedWorkbook.sourceName,
  );
  await writeStoredPayload(nextStorage);

  return {
    dashboardPayload: buildDashboardPayload(nextStorage),
    importSummary: {
      sourceName: parsedWorkbook.sourceName,
      rowCount: parsedWorkbook.listaRows.length,
      titleCount: importedTitles.length,
      requiresConfirmation: Boolean(nextStorage.pendingImport),
    },
  };
}

export async function resolvePendingImport(confirmed) {
  if (typeof confirmed !== "boolean") {
    throw new Error("confirmed must be a boolean");
  }

  const currentStorage = ensureStoragePayload(await readStoredPayload());
  const pendingImport = currentStorage.pendingImport;

  if (!pendingImport) {
    throw new Error("Non esiste alcun import in attesa di conferma.");
  }

  const nextStorage = confirmed
    ? {
        schemaVersion: currentStorage.schemaVersion,
        activeArchive: {
          titles: pendingImport.titles,
          metadata: buildNextMetadata(pendingImport.titles.length),
        },
        pendingImport: null,
      }
    : {
        schemaVersion: currentStorage.schemaVersion,
        activeArchive: currentStorage.activeArchive,
        pendingImport: null,
      };

  await writeStoredPayload(nextStorage);
  return buildDashboardPayload(nextStorage);
}
