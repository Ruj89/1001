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

function titlesMatchingFilters(titles, query, status) {
  return titles.filter((title) => {
    const matchesQuery = !query || title.titolo.toLowerCase().includes(query.toLowerCase());
    const matchesStatus =
      !status ||
      title.sottoVarianti.some((variant) => {
        if (status === "__missing__") {
          return variant.stato === "";
        }
        return variant.stato === status;
      });
    return matchesQuery && matchesStatus;
  });
}

function renderRoutes(routes) {
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

function renderArchiveRoute(archive, params) {
  const preview = document.querySelector("#route-preview");
  const titles = archive.activeTitles || [];
  const query = params.get("query") || "";
  const selectedStatus = params.get("status") || "";
  const filteredTitles = titlesMatchingFilters(titles, query, selectedStatus);
  const statusCounts = listStatusCounts(titles);
  const quickStatuses = statusCounts.slice(0, 4);
  const selectedLabel =
    selectedStatus === "__missing__" ? "Stato mancante" : normalizeStatusLabel(selectedStatus);

  preview.innerHTML = `
    <div class="archive-toolbar">
      <div>
        <strong>Vista archivio</strong>
        <p>${filteredTitles.length} titoli visibili su ${titles.length}.</p>
      </div>
      <div class="toolbar-copy">
        <span>Ricerca: ${query || "nessuna"}</span>
        <span>Filtro stato: ${selectedStatus ? selectedLabel : "tutti"}</span>
      </div>
    </div>
    <div class="status-shortcuts">
      ${quickStatuses
        .map(
          ([status, count]) => `
            <a class="status-chip" href="#/archive?status=${encodeURIComponent(status || "__missing__")}">
              ${normalizeStatusLabel(status)} · ${count}
            </a>
          `,
        )
        .join("")}
    </div>
    <label class="filter-label" for="status-filter">Tutti gli stati</label>
    <select id="status-filter" class="status-filter">
      <option value="">Tutti gli stati</option>
      ${statusCounts
        .map(
          ([status, count]) => `
            <option value="${status || "__missing__"}" ${
              (status || "__missing__") === selectedStatus ? "selected" : ""
            }>
              ${normalizeStatusLabel(status)} (${count})
            </option>
          `,
        )
        .join("")}
    </select>
    <div class="title-list">
      ${
        filteredTitles.length
          ? filteredTitles
              .map((title) => {
                const titleStatuses = [
                  ...new Set(
                    title.sottoVarianti.map((variant) => normalizeStatusLabel(variant.stato)),
                  ),
                ];

                return `
                  <a class="title-card" href="#/detail?title=${encodeURIComponent(title.titolo)}">
                    <div>
                      <strong>${title.titolo}</strong>
                      <p>${title.sottoVarianti.length} sotto-varianti</p>
                    </div>
                    <div class="status-pill-row">
                      ${titleStatuses
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
              <p>La ricerca per titolo e i filtri stato non hanno trovato titoli compatibili. Rimuovi o modifica i criteri per continuare.</p>
            </div>
          `
      }
    </div>
  `;

  document.querySelector("#status-filter").addEventListener("change", (event) => {
    const nextStatus = event.target.value;
    const nextParams = new URLSearchParams();
    if (query) {
      nextParams.set("query", query);
    }
    if (nextStatus) {
      nextParams.set("status", nextStatus);
    }
    const nextHash = nextParams.toString() ? `#/archive?${nextParams.toString()}` : "#/archive";
    window.location.hash = nextHash;
  });
}

function renderDetailRoute(archive, params) {
  const preview = document.querySelector("#route-preview");
  const titleName = params.get("title") || "";
  const title = (archive.activeTitles || []).find((entry) => entry.titolo === titleName);

  if (!title) {
    preview.innerHTML = `
      <div class="empty-state">
        <h3>Titolo non disponibile</h3>
        <p>Il record richiesto non e' disponibile nel dataset locale corrente. Torna alla lista per continuare su una vista coerente.</p>
        <a class="ghost-link" href="#/archive">Torna alla lista</a>
      </div>
    `;
    return;
  }

  preview.innerHTML = `
    <div class="detail-header">
      <div>
        <p class="kicker">Dettaglio titolo</p>
        <h3>${title.titolo}</h3>
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
  const preview = document.querySelector("#route-preview");
  const titleName = params.get("title") || "";
  const variantIndex = Number(params.get("variant") || "0");
  const title = (archive.activeTitles || []).find((entry) => entry.titolo === titleName);

  if (!title || Number.isNaN(variantIndex) || variantIndex < 0 || variantIndex >= title.sottoVarianti.length) {
    preview.innerHTML = `
      <div class="empty-state">
        <h3>Ingresso modifica non disponibile</h3>
        <p>Il contesto di modifica non e' piu' valido. Torna al dettaglio o alla lista per ripartire da uno stato coerente.</p>
        <a class="ghost-link" href="#/archive">Torna alla lista</a>
      </div>
    `;
    return;
  }

  preview.innerHTML = `
    <div class="detail-header">
      <div>
        <p class="kicker">Ingresso modifica</p>
        <h3>${title.titolo}</h3>
        <p>La modifica parte solo da un'azione esplicita del dettaglio. Il form persistente verra' completato nel task successivo.</p>
      </div>
      <div class="detail-actions">
        <a class="ghost-link" href="#/detail?title=${encodeURIComponent(title.titolo)}">Torna al dettaglio</a>
      </div>
    </div>
    <article class="variant-card">
      <div class="variant-card-head">
        <strong>Sotto-variante ${variantIndex + 1}</strong>
      </div>
      <dl class="variant-grid">
        <div>
          <dt>Piattaforma</dt>
          <dd>${presentFieldValue(title.sottoVarianti[variantIndex].piattaforma)}</dd>
        </div>
        <div>
          <dt>Edizione/versione</dt>
          <dd>${presentFieldValue(title.sottoVarianti[variantIndex].edizioneVersione)}</dd>
        </div>
        <div>
          <dt>Supporto</dt>
          <dd>${presentFieldValue(title.sottoVarianti[variantIndex].supporto)}</dd>
        </div>
        <div>
          <dt>Stato</dt>
          <dd>${normalizeStatusLabel(title.sottoVarianti[variantIndex].stato)}</dd>
        </div>
      </dl>
    </article>
  `;
}

function renderPreview(appConfig, archive) {
  const preview = document.querySelector("#route-preview");
  const { routeId, params } = parseHash(state.currentRoute);
  const matchingRoute = appConfig.routes.find((route) => route.id === routeId);

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

  if (routeId === "archive" && !archive.hasActiveArchive) {
    preview.innerHTML = `
      <div class="empty-state">
        <h3>Lista non disponibile</h3>
        <p>La superficie di browse e' pronta, ma serve prima un archivio attivo locale.</p>
        <a class="ghost-link" href="#/import">Importa ODS</a>
      </div>
    `;
    return;
  }

  if ((routeId === "detail" || routeId === "edit") && !archive.hasActiveArchive) {
    preview.innerHTML = `
      <div class="empty-state">
        <h3>Dettaglio non disponibile</h3>
        <p>Serve prima un archivio locale attivo per aprire dettaglio o modifica.</p>
        <a class="ghost-link" href="#/import">Importa ODS</a>
      </div>
    `;
    return;
  }

  if (!matchingRoute) {
    preview.innerHTML = `
      <p>Questa shell espone gia' le route future. La vista corrente non e' ancora implementata, ma l'ingresso e' stabilito.</p>
    `;
    return;
  }

  preview.innerHTML = `
    <p><strong>Route corrente:</strong> ${matchingRoute.label}</p>
    <p>${matchingRoute.description}</p>
    <p>La dashboard resta l'hub di ritorno per lista, import, export e creazione.</p>
  `;
}

function bindSearch(searchConfig) {
  const input = document.querySelector("#search-input");
  const submit = document.querySelector("#search-submit");
  const searchForm = document.querySelector("#search-form");
  const { routeId, params } = parseHash(state.currentRoute);
  input.placeholder = searchConfig.placeholder;
  submit.textContent = searchConfig.submitLabel;
  input.value = routeId === "archive" ? params.get("query") || "" : "";

  searchForm.onsubmit = (event) => {
    event.preventDefault();
    const query = input.value.trim();
    const nextParams = new URLSearchParams();
    if (query) {
      nextParams.set("query", query);
    }
    const nextHash = nextParams.toString()
      ? `${searchConfig.destinationHref}?${nextParams.toString()}`
      : searchConfig.destinationHref;
    window.location.hash = nextHash;
  };
}

function render(payload) {
  state.payload = payload;
  document.querySelector("#app-title").textContent = payload.app.name;
  document.querySelector("#app-tagline").textContent = payload.app.tagline;
  renderRoutes(payload.app.routes);
  renderArchiveState(payload.archive);
  renderPreview(payload.app, payload.archive);
  bindSearch(payload.search);
}

async function bootstrap() {
  const response = await fetch("/api/dashboard", { cache: "no-store" });
  const payload = await response.json();
  render(payload);

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/service-worker.js").catch(() => {});
  }
}

window.addEventListener("hashchange", () => {
  state.currentRoute = window.location.hash || "#/dashboard";
  if (state.payload) {
    renderPreview(state.payload.app, state.payload.archive);
    bindSearch(state.payload.search);
  }
});

bootstrap().catch(() => {
  document.querySelector("#archive-state").innerHTML = `
    <div class="empty-state">
      <h3>Shell non disponibile</h3>
      <p>Il runtime locale non ha risposto. Riavvia il server della dashboard per continuare.</p>
    </div>
  `;
});
