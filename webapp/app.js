import {
  createTitleRecord,
  importODSFile,
  loadDashboardPayload,
  resolvePendingImport,
  updateTitleRecord,
} from "./storage.js";

const DEPLOY_BASE_PATH = "__DEPLOY_BASE_PATH__";

const state = {
  payload: null,
  currentRoute: window.location.hash || "#/dashboard",
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
    const statuses = new Set(
      title.sottoVarianti.map((variant) => variant.stato).filter((status) => status !== ""),
    );

    for (const status of statuses) {
      counts.set(status, (counts.get(status) || 0) + 1);
    }

    if (title.sottoVarianti.some((variant) => variant.stato === "")) {
      counts.set("", (counts.get("") || 0) + 1);
    }
  }

  return [...counts.entries()].sort((left, right) => {
    if (right[1] !== left[1]) {
      return right[1] - left[1];
    }
    return normalizeStatusLabel(left[0]).localeCompare(normalizeStatusLabel(right[0]), "it");
  });
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

  return title.sottoVarianti.some((variant) => {
    if (filters.stato) {
      if (filters.stato === "__missing__" && variant.stato !== "") {
        return false;
      }
      if (filters.stato !== "__missing__" && variant.stato !== filters.stato) {
        return false;
      }
    }

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

function summarizeTitle(title) {
  const uniqueValues = (values) => [...new Set(values.filter(Boolean))];
  const platforms = uniqueValues(title.sottoVarianti.map((variant) => variant.piattaforma));
  const supports = uniqueValues(title.sottoVarianti.map((variant) => variant.supporto));
  const statuses = uniqueValues(
    title.sottoVarianti.map((variant) => normalizeStatusLabel(variant.stato)),
  );

  return {
    platforms: platforms.slice(0, 2).join(", ") || "Piattaforma mancante",
    supports: supports.slice(0, 2).join(", ") || "Supporto mancante",
    statuses,
  };
}

function renderRouteGrid(routes) {
  const routeGrid = document.querySelector("#route-grid");
  routeGrid.innerHTML = "";

  for (const route of routes) {
    const link = document.createElement("a");
    link.className = route.primary ? "route-link route-link-primary" : "route-link";
    link.href = route.href;
    link.dataset.route = route.id;
    link.innerHTML = `
      <strong>${route.label}</strong>
      <span>${route.description}</span>
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

  for (const route of routes) {
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
        <p>${archive.emptyState.body}</p>
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
  routeContent.innerHTML = `
    <div class="home-hint">
      <p class="kicker">Vista corrente</p>
      <h2>Dashboard operativa</h2>
      <p>La lista archivio apre in una vista dedicata. Qui restano ricerca rapida, azioni e stato del dataset locale.</p>
    </div>
  `;
}

function renderArchiveRoute(archive, params) {
  const routeContent = document.querySelector("#route-content");
  const titles = archive.activeTitles || [];
  const filters = getArchiveFilters(params);
  const filteredTitles = titlesMatchingFilters(titles, filters);
  const statusCounts = listStatusCounts(titles);
  const quickStatuses = statusCounts.slice(0, 4);
  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  routeContent.innerHTML = `
    <div class="route-header">
      <div>
        <p class="kicker">Lista archivio</p>
        <h2>Consultazione titoli</h2>
        <p>${filteredTitles.length} titoli visibili su ${titles.length}. Filtri attivi: ${activeFilterCount}.</p>
      </div>
      <div class="detail-actions">
        <a class="ghost-link" href="#/create">Nuovo titolo</a>
        <a class="ghost-link" href="#/dashboard">Torna alla dashboard</a>
      </div>
    </div>
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
              <input name="platform" type="search" autocomplete="off" value="${escapeHtmlAttribute(filters.piattaforma)}" />
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
          <div class="status-shortcuts">
            ${quickStatuses
              .map(([status, count]) => {
                const nextFilters = { ...filters, stato: status || "__missing__" };
                const active = nextFilters.stato === filters.stato;
                return `
                  <a class="status-chip ${active ? "status-chip-active" : ""}" href="${buildArchiveHash(nextFilters)}">
                    ${normalizeStatusLabel(status)} · ${count}
                  </a>
                `;
              })
              .join("")}
          </div>
          <div class="filter-actions">
            <button type="submit">Applica filtri</button>
            <a class="text-link" href="#/archive">Pulisci tutto</a>
          </div>
        </form>
      </aside>
      <div class="archive-results">
        <div class="archive-summary">
          <span>${activeFilterCount ? "Filtri combinati attivi" : "Nessun filtro attivo"}</span>
          <span>Le condizioni su piattaforma, edizione, supporto e stato si combinano sulla stessa sotto-variante.</span>
        </div>
        <div class="title-list title-list-compact">
          ${
            filteredTitles.length
              ? filteredTitles
                  .map((title) => {
                    const summary = summarizeTitle(title);

                    return `
                      <a class="title-card title-card-compact" href="#/detail?title=${encodeURIComponent(title.titolo)}">
                        <div class="title-card-main">
                          <strong>${title.titolo}</strong>
                          <span class="variant-count">${title.sottoVarianti.length} varianti</span>
                        </div>
                        <div class="title-card-summary">
                          <span>${summary.platforms}</span>
                          <span>${summary.supports}</span>
                        </div>
                        <div class="status-pill-row status-pill-row-compact">
                          ${summary.statuses
                            .map((statusLabel) => `<span class="status-pill">${statusLabel}</span>`)
                            .join("")}
                        </div>
                      </a>
                    `;
                  })
                  .join("")
              : `
                <div class="empty-state">
                  <h3>Nessun risultato</h3>
                  <p>I filtri combinati non hanno trovato titoli compatibili. Riduci o rimuovi i criteri per continuare.</p>
                </div>
              `
          }
        </div>
      </div>
    </div>
  `;

  document.querySelector("#archive-filter-form").onsubmit = (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const nextFilters = {
      titolo: String(formData.get("title") || "").trim(),
      piattaforma: String(formData.get("platform") || "").trim(),
      edizioneVersione: String(formData.get("edition") || "").trim(),
      supporto: String(formData.get("support") || "").trim(),
      stato: String(formData.get("status") || "").trim(),
    };
    window.location.hash = buildArchiveHash(nextFilters);
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
        <p>Il record richiesto non e' disponibile nel dataset locale corrente. Torna alla lista per continuare su una vista coerente.</p>
        <a class="ghost-link" href="#/archive">Torna alla lista</a>
      </div>
    `;
    return;
  }

  routeContent.innerHTML = `
    <div class="detail-header">
      <div>
        <p class="kicker">Dettaglio titolo</p>
        <h2>${title.titolo}</h2>
        <p>${title.sottoVarianti.length} sotto-varianti in ordine sorgente preservato.</p>
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
        <p>Il contesto di modifica non e' piu' valido. Torna al dettaglio o alla lista per ripartire da uno stato coerente.</p>
        <a class="ghost-link" href="#/archive">Torna alla lista</a>
      </div>
    `;
    return;
  }

  const selectedVariant = title.sottoVarianti[variantIndex];
  routeContent.innerHTML = `
    <div class="detail-header">
      <div>
        <p class="kicker">Modifica persistita</p>
        <h2>${title.titolo}</h2>
        <p>La modifica parte da un'azione esplicita del dettaglio e salva il titolo con la sotto-variante selezionata nel dataset locale attivo.</p>
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

function renderCreateRoute() {
  const routeContent = document.querySelector("#route-content");
  routeContent.innerHTML = `
    <div class="detail-header">
      <div>
        <p class="kicker">Create title</p>
        <h2>Nuovo titolo</h2>
        <p>Inserisci un titolo e una prima sotto-variante completa. Il salvataggio usa il boundary locale del dataset attivo.</p>
      </div>
      <div class="detail-actions">
        <a class="ghost-link" href="#/dashboard">Torna alla dashboard</a>
        <a class="ghost-link" href="#/archive">Vai alla lista</a>
      </div>
    </div>
    <form id="create-form" class="create-form">
      <label>
        <span>Titolo</span>
        <input name="titolo" type="text" required />
      </label>
      <label>
        <span>Piattaforma</span>
        <input name="piattaforma" type="text" required />
      </label>
      <label>
        <span>Edizione/versione</span>
        <input name="edizioneVersione" type="text" required />
      </label>
      <label>
        <span>Supporto</span>
        <input name="supporto" type="text" required />
      </label>
      <label>
        <span>Stato</span>
        <input name="stato" type="text" required />
      </label>
      <div class="form-actions">
        <button type="submit">Salva titolo</button>
      </div>
      <p id="create-feedback" class="form-feedback" aria-live="polite"></p>
    </form>
  `;

  const form = document.querySelector("#create-form");
  const feedback = document.querySelector("#create-feedback");
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
      const nextPayload = await createTitleRecord(payload);
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
          <p class="kicker">Import staged</p>
          <h2>Conferma sostituzione archivio</h2>
          <p>Il nuovo dataset e' stato letto dal foglio Lista ma non e' ancora attivo. Conferma la sostituzione completa dell'archivio locale corrente oppure annulla.</p>
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
        <p class="kicker">Import ODS</p>
        <h2>Carica archivio dal foglio Lista</h2>
        <p>Seleziona un file ODS locale. Il primo foglio deve chiamarsi <strong>Lista</strong> e rispettare il contratto MVP a 5 colonne.</p>
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
        <p>La route richiesta non e' implementata in questa shell.</p>
        <a class="ghost-link" href="#/dashboard">Torna alla dashboard</a>
      </div>
    `;
    return;
  }

  routeContent.innerHTML = `
    <div class="empty-state">
      <h3>${matchingRoute.label}</h3>
      <p>${matchingRoute.description}</p>
      <a class="ghost-link" href="#/dashboard">Torna alla dashboard</a>
    </div>
  `;
}

function renderRoute(appConfig, archive) {
  const dashboardPanels = document.querySelector("#dashboard-panels");
  const routeSurface = document.querySelector("#route-surface");
  const { routeId, params } = parseHash(state.currentRoute);

  dashboardPanels.hidden = routeId !== "dashboard";
  routeSurface.hidden = false;
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

  if (routeId === "create") {
    renderCreateRoute();
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
        <p>La superficie di consultazione e' pronta, ma serve prima un archivio attivo locale.</p>
        <a class="ghost-link" href="#/import">Importa ODS</a>
      </div>
    `;
    return;
  }

  if ((routeId === "detail" || routeId === "edit") && !archive.hasActiveArchive) {
    document.querySelector("#route-content").innerHTML = `
      <div class="empty-state">
        <h3>Dettaglio non disponibile</h3>
        <p>Serve prima un archivio locale attivo per aprire dettaglio o modifica.</p>
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
  document.querySelector("#app-title").textContent = payload.app.name;
  document.querySelector("#app-tagline").textContent = payload.app.tagline;
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
      <p>Il dataset locale non e' recuperabile. Ripristina la persistenza browser o riapri l'app su uno stato coerente.</p>
    </div>
  `;
});
