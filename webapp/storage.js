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
    {
      id: "create",
      label: "Crea titolo",
      href: "#/create",
      description: "Apri il flusso per aggiungere un nuovo titolo con sotto-varianti.",
      primaryWhenActive: false,
      primaryWhenEmpty: false,
    },
  ],
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

  return {
    piattaforma: ensureString(variant.piattaforma, `${context}.piattaforma`),
    edizioneVersione: ensureString(variant.edizioneVersione, `${context}.edizioneVersione`),
    supporto: ensureString(variant.supporto, `${context}.supporto`),
    stato: ensureString(variant.stato, `${context}.stato`),
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

  return {
    titolo,
    sottoVarianti: title.sottoVarianti.map((variant, index) =>
      ensureVariant(variant, `${context}.sottoVarianti[${index}]`),
    ),
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
    pendingImport: payload.pendingImport || null,
  };
}

function buildRoutes(hasActiveArchive) {
  return APP_CONFIG.routes.map((route) => ({
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
  updatedVariants[variantIndex] = nextTitle.sottoVarianti[0];
  titles[targetIndex] = {
    titolo: nextTitle.titolo,
    sottoVarianti: updatedVariants,
  };

  const nextStorage = rebuildStorageWithTitles(currentStorage, titles);
  await writeStoredPayload(nextStorage);
  return buildDashboardPayload(nextStorage);
}
