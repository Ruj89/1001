import {
  importODSFile,
  loadDashboardPayload,
  resolvePendingImport,
  updateTitleRecord,
} from "./storage.js";

const DEPLOY_BASE_PATH = "__DEPLOY_BASE_PATH__";

const state = {
  payload: null,
  currentRoute: window.location.hash || "#/dashboard",
  archiveFilterTimerId: null,
};

function parseHash(hashValue) {
  const normalized = hashValue || "#/dashboard";
  const [, fragment = "dashboard"] = normalized.split("#/");
  const [routePart, queryPart = ""] = fragment.split("?");
  return {
    routeId: routePart || "dashboard",
    params: new URLSearchParams(queryPart),
  };
}

function formatTimestamp(timestamp) {
  if (!timestamp) {
    return "Nessuna modifica registrata";
  }

  return new Intl.DateTimeFormat("it-IT", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(timestamp));
}

function normalizeStatusLabel(statusValue) {
  return statusValue || "Stato mancante";
}

function presentFieldValue(value) {
  return value || "Valore mancante";
}

function escapeHtmlAttribute(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function listStatusCounts(titles) {
  const counts = new Map();

  for (const title of titles) {
    for (const status of getTitleStatuses(title)) {
      counts.set(status, (counts.get(status) || 0) + 1);
    }
  }

  return [...counts.entries()].sort((left, right) => {
    if (right[1] !== left[1]) {
      return right[1] - left[1];
    }
    return normalizeStatusLabel(left[0]).localeCompare(normalizeStatusLabel(right[0]), "it");
  });
}

function listUniqueVariantFieldValues(titles, fieldName) {
  return [...new Set(
    titles
      .flatMap((title) => title.sottoVarianti.map((variant) => variant[fieldName] || ""))
      .filter(Boolean),
  )].sort((left, right) => left.localeCompare(right, "it"));
}

function getArchiveFilters(params) {
  return {
    titolo: (params.get("title") || params.get("query") || "").trim(),
    piattaforma: (params.get("platform") || "").trim(),
    edizioneVersione: (params.get("edition") || "").trim(),
    supporto: (params.get("support") || "").trim(),
    stato: (params.get("status") || "").trim(),
  };
}

function buildArchiveHash(filters) {
  const nextParams = new URLSearchParams();

  if (filters.titolo) {
    nextParams.set("title", filters.titolo);
  }
  if (filters.piattaforma) {
    nextParams.set("platform", filters.piattaforma);
  }
  if (filters.edizioneVersione) {
    nextParams.set("edition", filters.edizioneVersione);
  }
  if (filters.supporto) {
    nextParams.set("support", filters.supporto);
  }
  if (filters.stato) {
    nextParams.set("status", filters.stato);
  }

  const serialized = nextParams.toString();
  return serialized ? `#/archive?${serialized}` : "#/archive";
}

function normalizeFilterTerm(value) {
  return value.trim().toLowerCase();
}

function variantMatchesField(variantValue, filterValue) {
  return normalizeFilterTerm(variantValue).includes(normalizeFilterTerm(filterValue));
}

function titleMatchesFilters(title, filters) {
  const matchesTitle =
    !filters.titolo || normalizeFilterTerm(title.titolo).includes(normalizeFilterTerm(filters.titolo));

  if (!matchesTitle) {
    return false;
  }
  const titleStatuses = getTitleFilterStatuses(title, filters.stato);

  if (filters.stato) {
    if (filters.stato === "__missing__" && !titleStatuses.includes("")) {
      return false;
    }
    if (filters.stato !== "__missing__" && !titleStatuses.includes(filters.stato)) {
      return false;
    }
  }

  return title.sottoVarianti.some((variant) => {
    if (filters.piattaforma && !variantMatchesField(variant.piattaforma, filters.piattaforma)) {
      return false;
    }

    if (
      filters.edizioneVersione &&
      !variantMatchesField(variant.edizioneVersione, filters.edizioneVersione)
    ) {
      return false;
    }

    if (filters.supporto && !variantMatchesField(variant.supporto, filters.supporto)) {
      return false;
    }

    return true;
  });
}

function titlesMatchingFilters(titles, filters) {
  return titles.filter((title) => titleMatchesFilters(title, filters));
}

function getTitleStatuses(title) {
  return title.sottoVarianti.map((variant) => (variant.stato || "").trim());
}

function getTitleFilterStatuses(title, selectedStatus) {
  const statuses = getTitleStatuses(title);

  if (!selectedStatus) {
    return [...new Set(statuses)];
  }

  if (statuses.some((status) => status === "OK")) {
    return ["OK"];
  }

  if (statuses.some((status) => status === "Da studiare estrazione")) {
    return ["Da studiare estrazione"];
  }

  return [...new Set(statuses)];
}

function summarizeTitle(title) {
  const uniqueValues = (values) => [...new Set(values.filter(Boolean))];
  const platforms = uniqueValues(title.sottoVarianti.map((variant) => variant.piattaforma));
  const supports = uniqueValues(title.sottoVarianti.map((variant) => variant.supporto));

  return {
    platforms: platforms.slice(0, 2).join(", ") || "Piattaforma mancante",
    supports: supports.slice(0, 2).join(", ") || "Supporto mancante",
  };
}

function getExportIndicator(title) {
  const statuses = title.sottoVarianti.map((variant) => (variant.stato || "").trim());

  if (statuses.some((status) => status === "OK")) {
    return {
      tone: "ok",
      label: "Esportazione positiva",
    };
  }

  if (
    statuses.length > 0 &&
    statuses.every((status) => status === "Uscito fuori" || status === "Non reperibile")
  ) {
    return {
      tone: "warn",
      label: "Esportazione neutra",
    };
  }

  return {
    tone: "missing",
    label: "Esportazione mancante",
  };
}

function renderRouteGrid(routes) {
  const routeGrid = document.querySelector("#route-grid");
  routeGrid.innerHTML = "";

  for (const route of routes.filter((route) => route.id !== "create")) {
    const link = document.createElement("a");
    link.className = route.primary ? "route-link route-link-primary" : "route-link";
    link.href = route.href;
    link.dataset.route = route.id;
    link.innerHTML = `
      <strong>${route.label}</strong>
    `;
    routeGrid.appendChild(link);
  }
}

function renderTopNav(routes, routeId) {
  const routeNav = document.querySelector("#route-nav");
  routeNav.innerHTML = "";

  const dashboardLink = document.createElement("a");
  dashboardLink.className = routeId === "dashboard" ? "top-nav-link top-nav-link-active" : "top-nav-link";
  dashboardLink.href = "#/dashboard";
  dashboardLink.textContent = "Dashboard";
  routeNav.appendChild(dashboardLink);

  for (const route of routes.filter((route) => route.id !== "create")) {
    const link = document.createElement("a");
    link.className = route.id === routeId ? "top-nav-link top-nav-link-active" : "top-nav-link";
    link.href = route.href;
    link.dataset.route = route.id;
    link.textContent = route.label;
    routeNav.appendChild(link);
  }
}

function renderArchiveState(archive) {
  const archiveState = document.querySelector("#archive-state");

  if (!archive.hasActiveArchive) {
    archiveState.innerHTML = `
      <div class="empty-state">
        <h3>${archive.emptyState.title}</h3>
        <a class="ghost-link" href="${archive.emptyState.ctaHref}">${archive.emptyState.ctaLabel}</a>
      </div>
    `;
    return;
  }

  const metadata = archive.metadata;
  archiveState.innerHTML = `
    <dl class="metadata-grid">
      <div>
        <dt>Archivio attivo</dt>
        <dd>Si</dd>
      </div>
      <div>
        <dt>Numero record</dt>
        <dd>${metadata.numeroRecord}</dd>
      </div>
      <div>
        <dt>Ultima modifica</dt>
        <dd>${formatTimestamp(metadata.ultimaModificaLocale)}</dd>
      </div>
      <div>
        <dt>Versione schema</dt>
        <dd>${metadata.versioneSchema}</dd>
      </div>
    </dl>
  `;
}

function renderDashboardHome() {
  const routeContent = document.querySelector("#route-content");
  routeContent.innerHTML = "";
}

function renderArchiveRoute(archive, params) {
  const routeContent = document.querySelector("#route-content");
  const titles = archive.activeTitles || [];
  const filters = getArchiveFilters(params);
  const statusCounts = listStatusCounts(titles);
  const platformOptions = listUniqueVariantFieldValues(titles, "piattaforma");
  const quickStatuses = statusCounts.slice(0, 4);

  routeContent.innerHTML = `
    <div class="archive-layout">
      <aside class="filter-panel">
        <form id="archive-filter-form" class="filter-form">
          <div class="filter-grid">
            <label>
              <span>Titolo</span>
              <input name="title" type="search" autocomplete="off" value="${escapeHtmlAttribute(filters.titolo)}" />
            </label>
            <label>
              <span>Piattaforma</span>
              <input
                id="platform-filter"
                name="platform"
                type="search"
                autocomplete="off"
                value="${escapeHtmlAttribute(filters.piattaforma)}"
              />
              <div id="platform-suggestions" class="filter-suggestions"></div>
            </label>
            <label>
              <span>Edizione/versione</span>
              <input name="edition" type="search" autocomplete="off" value="${escapeHtmlAttribute(filters.edizioneVersione)}" />
            </label>
            <label>
              <span>Supporto</span>
              <input name="support" type="search" autocomplete="off" value="${escapeHtmlAttribute(filters.supporto)}" />
            </label>
            <label>
              <span>Stato</span>
              <select id="status-filter" name="status" class="status-filter">
                <option value="">Tutti gli stati</option>
                ${statusCounts
                  .map(
                    ([status, count]) => `
                      <option value="${status || "__missing__"}" ${
                        (status || "__missing__") === filters.stato ? "selected" : ""
                      }>
                        ${normalizeStatusLabel(status)} (${count})
                      </option>
                    `,
                  )
                  .join("")}
              </select>
            </label>
          </div>
          <div id="status-shortcuts" class="status-shortcuts">
            ${quickStatuses
              .map(([status, count]) => {
                const statusValue = status || "__missing__";
                const active = statusValue === filters.stato;
                return `
                  <button type="button" class="status-chip ${active ? "status-chip-active" : ""}" data-status-value="${statusValue}">
                    ${normalizeStatusLabel(status)}
                  </button>
                `;
              })
              .join("")}
          </div>
          <div class="filter-actions">
            <button id="clear-filters" type="button">Pulisci tutto</button>
          </div>
        </form>
      </aside>
      <div class="archive-results">
        <div id="title-list" class="title-list title-list-compact"></div>
      </div>
    </div>
  `;

  const filterForm = document.querySelector("#archive-filter-form");
  const platformInput = filterForm.elements.namedItem("platform");
  const statusFilter = filterForm.elements.namedItem("status");
  const platformSuggestions = document.querySelector("#platform-suggestions");
  const textFilterInputs = [...filterForm.querySelectorAll('input[type="search"]')];
  const titleList = document.querySelector("#title-list");
  const statusShortcuts = document.querySelector("#status-shortcuts");

  const collectFilters = () => {
    const formData = new FormData(filterForm);
    return {
      titolo: String(formData.get("title") || "").trim(),
      piattaforma: String(formData.get("platform") || "").trim(),
      edizioneVersione: String(formData.get("edition") || "").trim(),
      supporto: String(formData.get("support") || "").trim(),
      stato: String(formData.get("status") || "").trim(),
    };
  };

  const renderTitleList = (nextFilters) => {
    const filteredTitles = titlesMatchingFilters(titles, nextFilters);

    titleList.innerHTML = filteredTitles.length
      ? filteredTitles
          .map((title) => {
            const summary = summarizeTitle(title);
            const indicator = getExportIndicator(title);

            return `
              <a class="title-card title-card-compact" href="#/detail?title=${encodeURIComponent(title.titolo)}">
                <div class="title-card-main">
                  <div class="title-card-title">
                    <span class="title-indicator title-indicator-${indicator.tone}" aria-label="${indicator.label}" title="${indicator.label}"></span>
                    <strong>${title.titolo}</strong>
                  </div>
                  <span class="variant-count">${title.sottoVarianti.length} varianti</span>
                </div>
                <div class="title-card-summary">
                  <span>${summary.platforms}</span>
                  <span>${summary.supports}</span>
                </div>
              </a>
            `;
          })
          .join("")
      : `
        <div class="empty-state">
          <h3>Nessun risultato</h3>
        </div>
      `;
  };

  const updateShortcutState = (nextFilters) => {
    if (!(statusShortcuts instanceof HTMLDivElement)) {
      return;
    }

    for (const chip of statusShortcuts.querySelectorAll("[data-status-value]")) {
      chip.classList.toggle("status-chip-active", chip.getAttribute("data-status-value") === nextFilters.stato);
    }
  };

  const updateArchiveUrl = (nextFilters) => {
    const nextHash = buildArchiveHash(nextFilters);
    if (window.location.hash !== nextHash) {
      history.replaceState(null, "", nextHash);
      state.currentRoute = nextHash;
    }
  };

  const syncFilters = () => {
    const nextFilters = collectFilters();
    renderTitleList(nextFilters);
    updateShortcutState(nextFilters);
    updateArchiveUrl(nextFilters);
  };

  renderTitleList(filters);
  updateShortcutState(filters);

  filterForm.addEventListener("change", syncFilters);

  for (const input of textFilterInputs) {
    input.addEventListener("input", syncFilters);
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        syncFilters();
      }
    });
  }

  if (platformInput instanceof HTMLInputElement) {
    platformInput.addEventListener("focus", () => {
      platformInput.select();
    });
  }

  if (platformInput instanceof HTMLInputElement && platformSuggestions instanceof HTMLDivElement) {
    const renderPlatformSuggestions = () => {
      const query = normalizeFilterTerm(platformInput.value);
      const visibleOptions = platformOptions
        .filter((platform) => !query || normalizeFilterTerm(platform).includes(query))
        .slice(0, 8);

      platformSuggestions.innerHTML = visibleOptions.length
        ? visibleOptions
            .map(
              (platform) => `
                <button type="button" class="filter-suggestion" data-platform-value="${escapeHtmlAttribute(platform)}">
                  ${platform}
                </button>
              `,
            )
            .join("")
        : "";
      platformSuggestions.hidden = visibleOptions.length === 0;
    };

    renderPlatformSuggestions();

    platformInput.addEventListener("focus", renderPlatformSuggestions);
    platformInput.addEventListener("input", renderPlatformSuggestions);
    platformInput.addEventListener("blur", () => {
      window.setTimeout(() => {
        platformSuggestions.hidden = true;
        syncFilters();
      }, 120);
    });
    platformInput.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        platformSuggestions.hidden = true;
      }
    });

    platformSuggestions.addEventListener("click", (event) => {
      const button = event.target instanceof HTMLElement ? event.target.closest("[data-platform-value]") : null;
      if (!(button instanceof HTMLElement)) {
        return;
      }

      platformInput.value = button.dataset.platformValue || "";
      platformSuggestions.hidden = true;
      syncFilters();
    });
  }

  if (statusShortcuts instanceof HTMLDivElement && statusFilter instanceof HTMLSelectElement) {
    statusShortcuts.addEventListener("click", (event) => {
      const button = event.target instanceof HTMLElement ? event.target.closest("[data-status-value]") : null;
      if (!(button instanceof HTMLElement)) {
        return;
      }

      const nextValue = button.getAttribute("data-status-value") || "";
      statusFilter.value = nextValue;
      syncFilters();
    });
  }

  document.querySelector("#clear-filters").onclick = () => {
    window.clearTimeout(state.archiveFilterTimerId);
    filterForm.reset();
    if (statusFilter instanceof HTMLSelectElement) {
      statusFilter.value = "";
    }
    if (platformInput instanceof HTMLInputElement) {
      platformInput.value = "";
    }
    if (platformSuggestions instanceof HTMLDivElement) {
      platformSuggestions.hidden = true;
    }
    syncFilters();
  };
}

function renderDetailRoute(archive, params) {
  const routeContent = document.querySelector("#route-content");
  const titleName = params.get("title") || "";
  const title = (archive.activeTitles || []).find((entry) => entry.titolo === titleName);

  if (!title) {
    routeContent.innerHTML = `
      <div class="empty-state">
        <h3>Titolo non disponibile</h3>
        <a class="ghost-link" href="#/archive">Torna alla lista</a>
      </div>
    `;
    return;
  }

  routeContent.innerHTML = `
    <div class="detail-header">
      <div>
        <h2>${title.titolo}</h2>
      </div>
      <div class="detail-actions">
        <a class="ghost-link" href="#/archive">Torna alla lista</a>
        <a class="ghost-link" href="#/edit?title=${encodeURIComponent(title.titolo)}&variant=0">Modifica</a>
      </div>
    </div>
    <div class="variant-list">
      ${title.sottoVarianti
        .map(
          (variant, index) => `
            <article class="variant-card">
              <div class="variant-card-head">
                <strong>Sotto-variante ${index + 1}</strong>
                <a class="text-link" href="#/edit?title=${encodeURIComponent(title.titolo)}&variant=${index}">
                  Modifica questa variante
                </a>
              </div>
              <dl class="variant-grid">
                <div>
                  <dt>Piattaforma</dt>
                  <dd>${presentFieldValue(variant.piattaforma)}</dd>
                </div>
                <div>
                  <dt>Edizione/versione</dt>
                  <dd>${presentFieldValue(variant.edizioneVersione)}</dd>
                </div>
                <div>
                  <dt>Supporto</dt>
                  <dd>${presentFieldValue(variant.supporto)}</dd>
                </div>
                <div>
                  <dt>Stato</dt>
                  <dd>${normalizeStatusLabel(variant.stato)}</dd>
                </div>
              </dl>
            </article>
          `,
        )
        .join("")}
    </div>
  `;
}

function renderEditEntryRoute(archive, params) {
  const routeContent = document.querySelector("#route-content");
  const titleName = params.get("title") || "";
  const variantIndex = Number(params.get("variant") || "0");
  const title = (archive.activeTitles || []).find((entry) => entry.titolo === titleName);

  if (
    !title ||
    Number.isNaN(variantIndex) ||
    variantIndex < 0 ||
    variantIndex >= title.sottoVarianti.length
  ) {
    routeContent.innerHTML = `
      <div class="empty-state">
        <h3>Ingresso modifica non disponibile</h3>
        <a class="ghost-link" href="#/archive">Torna alla lista</a>
      </div>
    `;
    return;
  }

  const selectedVariant = title.sottoVarianti[variantIndex];
  routeContent.innerHTML = `
    <div class="detail-header">
      <div>
        <h2>${title.titolo}</h2>
      </div>
      <div class="detail-actions">
        <a class="ghost-link" href="#/detail?title=${encodeURIComponent(title.titolo)}">Torna al dettaglio</a>
      </div>
    </div>
    <form id="edit-form" class="create-form">
      <label>
        <span>Titolo</span>
        <input name="titolo" type="text" required value="${escapeHtmlAttribute(title.titolo)}" />
      </label>
      <div class="variant-card">
        <div class="variant-card-head">
          <strong>Sotto-variante ${variantIndex + 1}</strong>
        </div>
        <label>
          <span>Piattaforma</span>
          <input name="piattaforma" type="text" required value="${escapeHtmlAttribute(selectedVariant.piattaforma)}" />
        </label>
        <label>
          <span>Edizione/versione</span>
          <input name="edizioneVersione" type="text" required value="${escapeHtmlAttribute(selectedVariant.edizioneVersione)}" />
        </label>
        <label>
          <span>Supporto</span>
          <input name="supporto" type="text" required value="${escapeHtmlAttribute(selectedVariant.supporto)}" />
        </label>
        <label>
          <span>Stato</span>
          <input name="stato" type="text" required value="${escapeHtmlAttribute(selectedVariant.stato)}" />
        </label>
      </div>
      <div class="form-actions">
        <button type="submit">Salva modifiche</button>
      </div>
      <p id="edit-feedback" class="form-feedback" aria-live="polite"></p>
    </form>
  `;

  const form = document.querySelector("#edit-form");
  const feedback = document.querySelector("#edit-feedback");
  form.onsubmit = async (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const payload = {
      titolo: String(formData.get("titolo") || "").trim(),
      sottoVariante: {
        piattaforma: String(formData.get("piattaforma") || "").trim(),
        edizioneVersione: String(formData.get("edizioneVersione") || "").trim(),
        supporto: String(formData.get("supporto") || "").trim(),
        stato: String(formData.get("stato") || "").trim(),
      },
    };

    if (
      !payload.titolo ||
      !payload.sottoVariante.piattaforma ||
      !payload.sottoVariante.edizioneVersione ||
      !payload.sottoVariante.supporto ||
      !payload.sottoVariante.stato
    ) {
      feedback.textContent = "Compila tutti i campi richiesti prima del salvataggio.";
      return;
    }

    feedback.textContent = "Salvataggio in corso...";

    try {
      const nextPayload = await updateTitleRecord(title.titolo, variantIndex, payload);
      state.payload = nextPayload;
      feedback.textContent = "";
      window.location.hash = `#/detail?title=${encodeURIComponent(payload.titolo)}`;
    } catch (error) {
      feedback.textContent = error.message;
    }
  };
}

function renderImportRoute(archive) {
  const routeContent = document.querySelector("#route-content");
  const pendingImport = archive.pendingImport;

  if (pendingImport) {
    routeContent.innerHTML = `
      <div class="detail-header">
        <div>
          <h2>Conferma sostituzione archivio</h2>
        </div>
        <div class="detail-actions">
          <a class="ghost-link" href="#/archive">Torna alla lista</a>
        </div>
      </div>
      <div class="variant-card">
        <dl class="variant-grid">
          <div>
            <dt>File sorgente</dt>
            <dd>${pendingImport.sourceName}</dd>
          </div>
          <div>
            <dt>Titoli in attesa</dt>
            <dd>${pendingImport.titleCount}</dd>
          </div>
          <div>
            <dt>Import messo in attesa</dt>
            <dd>${formatTimestamp(pendingImport.stagedAt)}</dd>
          </div>
          <div>
            <dt>Effetto</dt>
            <dd>Sostituzione completa del dataset attivo</dd>
          </div>
        </dl>
      </div>
      <div class="form-actions dual-actions">
        <button id="confirm-import" type="button">Conferma sostituzione</button>
        <button id="cancel-import" class="secondary-action" type="button">Annulla import</button>
      </div>
      <p id="import-feedback" class="form-feedback" aria-live="polite"></p>
    `;

    const feedback = document.querySelector("#import-feedback");
    document.querySelector("#confirm-import").onclick = async () => {
      feedback.textContent = "Attivazione archivio in corso...";
      try {
        state.payload = await resolvePendingImport(true);
        feedback.textContent = "";
        window.location.hash = "#/archive";
      } catch (error) {
        feedback.textContent = error.message;
      }
    };

    document.querySelector("#cancel-import").onclick = async () => {
      feedback.textContent = "Annullamento import in corso...";
      try {
        state.payload = await resolvePendingImport(false);
        feedback.textContent = "";
        render(state.payload);
      } catch (error) {
        feedback.textContent = error.message;
      }
    };
    return;
  }

  routeContent.innerHTML = `
    <div class="detail-header">
      <div>
        <h2>Carica archivio dal foglio Lista</h2>
      </div>
      <div class="detail-actions">
        <a class="ghost-link" href="#/dashboard">Torna alla dashboard</a>
      </div>
    </div>
    <form id="import-form" class="create-form">
      <label>
        <span>File ODS</span>
        <input
          id="import-file"
          name="archiveFile"
          type="file"
          accept=".ods,application/vnd.oasis.opendocument.spreadsheet"
          required
        />
      </label>
      <div class="form-actions">
        <button type="submit">Leggi archivio</button>
      </div>
      <p id="import-feedback" class="form-feedback" aria-live="polite"></p>
    </form>
  `;

  const form = document.querySelector("#import-form");
  const fileInput = document.querySelector("#import-file");
  const feedback = document.querySelector("#import-feedback");

  form.onsubmit = async (event) => {
    event.preventDefault();
    const file = fileInput.files && fileInput.files[0];

    if (!file) {
      feedback.textContent = "Seleziona un file ODS prima di continuare.";
      return;
    }

    feedback.textContent = "Lettura archivio in corso...";

    try {
      const result = await importODSFile(file);
      state.payload = result.dashboardPayload;
      if (result.importSummary.requiresConfirmation) {
        render(state.payload);
        feedback.textContent = "";
        return;
      }
      feedback.textContent = "";
      window.location.hash = "#/archive";
    } catch (error) {
      feedback.textContent = error.message;
    }
  };
}

function renderFallbackRoute(appConfig, routeId) {
  const routeContent = document.querySelector("#route-content");
  const matchingRoute = appConfig.routes.find((route) => route.id === routeId);

  if (!matchingRoute) {
    routeContent.innerHTML = `
      <div class="empty-state">
        <h3>Vista non disponibile</h3>
        <a class="ghost-link" href="#/dashboard">Torna alla dashboard</a>
      </div>
    `;
    return;
  }

  routeContent.innerHTML = `
    <div class="empty-state">
      <h3>${matchingRoute.label}</h3>
      <a class="ghost-link" href="#/dashboard">Torna alla dashboard</a>
    </div>
  `;
}

function renderRoute(appConfig, archive) {
  const dashboardPanels = document.querySelector("#dashboard-panels");
  const routeContent = document.querySelector("#route-content");
  const { routeId, params } = parseHash(state.currentRoute);

  dashboardPanels.hidden = routeId !== "dashboard";
  routeContent.hidden = routeId === "dashboard";
  renderTopNav(appConfig.routes, routeId);

  if (routeId === "dashboard") {
    renderDashboardHome();
    return;
  }

  if (routeId === "archive" && archive.hasActiveArchive) {
    renderArchiveRoute(archive, params);
    return;
  }

  if (routeId === "detail" && archive.hasActiveArchive) {
    renderDetailRoute(archive, params);
    return;
  }

  if (routeId === "edit" && archive.hasActiveArchive) {
    renderEditEntryRoute(archive, params);
    return;
  }

  if (routeId === "import") {
    renderImportRoute(archive);
    return;
  }

  if (routeId === "archive" && !archive.hasActiveArchive) {
    document.querySelector("#route-content").innerHTML = `
      <div class="empty-state">
        <h3>Lista non disponibile</h3>
        <a class="ghost-link" href="#/import">Importa ODS</a>
      </div>
    `;
    return;
  }

  if ((routeId === "detail" || routeId === "edit") && !archive.hasActiveArchive) {
    document.querySelector("#route-content").innerHTML = `
      <div class="empty-state">
        <h3>Dettaglio non disponibile</h3>
        <a class="ghost-link" href="#/import">Importa ODS</a>
      </div>
    `;
    return;
  }

  renderFallbackRoute(appConfig, routeId);
}

function bindSearch(searchConfig) {
  const input = document.querySelector("#search-input");
  const submit = document.querySelector("#search-submit");
  const searchForm = document.querySelector("#search-form");
  const { routeId, params } = parseHash(state.currentRoute);
  const filters = getArchiveFilters(params);

  input.placeholder = searchConfig.placeholder;
  submit.textContent = searchConfig.submitLabel;
  input.value = routeId === "archive" ? filters.titolo : "";

  searchForm.onsubmit = (event) => {
    event.preventDefault();
    const title = input.value.trim();
    const nextHash = buildArchiveHash({
      titolo: title,
      piattaforma: "",
      edizioneVersione: "",
      supporto: "",
      stato: "",
    });
    window.location.hash = nextHash;
  };
}

function render(payload) {
  state.payload = payload;
  document.title = payload.app.name;
  renderRouteGrid(payload.app.routes);
  renderArchiveState(payload.archive);
  renderRoute(payload.app, payload.archive);
  bindSearch(payload.search);
}

async function bootstrap() {
  const payload = await loadDashboardPayload();
  render(payload);

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker
      .register(`${DEPLOY_BASE_PATH}service-worker.js`, { scope: DEPLOY_BASE_PATH })
      .catch(() => {});
  }
}

window.addEventListener("hashchange", () => {
  state.currentRoute = window.location.hash || "#/dashboard";
  if (state.payload) {
    render(state.payload);
  }
});

bootstrap().catch(() => {
  document.querySelector("#archive-state").innerHTML = `
    <div class="empty-state">
      <h3>Shell non disponibile</h3>
    </div>
  `;
});
