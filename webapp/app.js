const state = {
  payload: null,
  currentRoute: window.location.hash || "#/dashboard",
};

function routeIdFromHash(hashValue) {
  const route = (hashValue || "#/dashboard").replace(/^#\//, "").split("?")[0];
  return route || "dashboard";
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

function renderPreview(appConfig) {
  const preview = document.querySelector("#route-preview");
  const routeId = routeIdFromHash(state.currentRoute);
  const matchingRoute = appConfig.routes.find((route) => route.id === routeId);

  if (!matchingRoute) {
    preview.innerHTML = `
      <p>Questa shell espone già le route future. La vista corrente non è ancora implementata, ma l'ingresso è stabilito.</p>
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
  input.placeholder = searchConfig.placeholder;
  submit.textContent = searchConfig.submitLabel;

  document.querySelector("#search-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const query = input.value.trim();
    const url = new URL(window.location.href);
    url.hash = query
      ? `${searchConfig.destinationHref}?query=${encodeURIComponent(query)}`
      : searchConfig.destinationHref;
    window.location.hash = url.hash;
  });
}

function render(payload) {
  state.payload = payload;
  document.querySelector("#app-title").textContent = payload.app.name;
  document.querySelector("#app-tagline").textContent = payload.app.tagline;
  renderRoutes(payload.app.routes);
  renderArchiveState(payload.archive);
  renderPreview(payload.app);
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
    renderPreview(state.payload.app);
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
