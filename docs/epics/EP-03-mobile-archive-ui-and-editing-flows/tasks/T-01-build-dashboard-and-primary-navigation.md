# T-01 Build dashboard and primary navigation

Status: `accepted`

Objective: Stabilire la shell browser/PWA eseguibile dell'MVP e definire la dashboard come home screen mobile-first con ricerca primaria, quick actions e stato minimo archivio.

## Decision

Questo task non definisce solo una schermata iniziale. Definisce il baseline runtime di `EP-03`: una shell browser-based PWA nello stesso progetto/repo, abbastanza completa da ospitare dashboard, elenco, dettaglio, creazione e accessi ai flussi operativi secondari.

La dashboard e' la home dell'app. Deve essere il primo punto di ingresso del prodotto, esporre subito la ricerca, dare accesso diretto alle azioni chiave e mostrare lo stato minimo dell'archivio locale senza costringere l'utente ad aprire viste secondarie.

## Canonical Contract

### 1. Runtime and home entry

- Il task deve produrre una shell browser/PWA eseguibile nello stesso repo del resto del prodotto.
- La dashboard deve essere la route o vista iniziale dell'app.
- La shell deve avviarsi anche in assenza di archivio attivo, mostrando uno stato vuoto coerente.
- La shell deve esporre almeno i punti di ingresso verso lista archivio, import, export e creazione record.

### 2. Dashboard behavior

- La ricerca per titolo deve occupare la posizione visiva e interattiva primaria.
- La dashboard deve mostrare quick actions chiare per:
  - lista archivio;
  - import;
  - export;
  - create title.
- La dashboard deve mostrare almeno:
  - archivio attivo o stato vuoto;
  - numero record;
  - ultima modifica locale;
  - versione schema.
- Se non esiste un archivio attivo, la dashboard deve guidare l'utente verso l'import senza rendere incoerenti le altre azioni.

### 3. Navigation baseline

- La dashboard deve essere l'hub di navigazione primario per `EP-03`.
- La navigazione deve essere compatibile con l'apertura del dettaglio titolo, il ritorno alla dashboard e l'ingresso nel flusso di creazione.
- Import ed export devono restare accessibili ma secondari rispetto alla consultazione.
- Questo task non richiede ancora la definizione completa dei singoli schermi downstream, ma ne deve fissare i punti di ingresso.

### 4. Mobile and offline rules

- Il viewport phone-sized e l'uso Android devono essere la baseline di layout e interazione.
- Il rendering della dashboard non puo' dipendere da backend o rete.
- I metadata mostrati devono provenire dal boundary locale di persistenza/metadata gia' definito.

### 5. Scope rules

- Questo task non definisce ancora il comportamento completo di lista, filtri, dettaglio o form.
- Questo task non richiede ancora packaging nativo Android.
- Questo task non trasforma l'app in un clone spreadsheet.

## Subtasks

- `ST-01.1` Establish the browser/PWA shell and dashboard home entry. Status: `accepted`
- `ST-01.2` Place title search in primary visual and interaction position. Status: `accepted`
- `ST-01.3` Expose primary quick actions and route-level navigation entry points. Status: `accepted`
- `ST-01.4` Show archive metadata and coherent empty-state behavior on the dashboard. Status: `accepted`

## Subtask Details And Dependencies

### ST-01.1 Establish the browser/PWA shell and dashboard home entry

Definition:

- Create the executable browser application baseline for `EP-03`.
- Make the dashboard the initial app entry surface.
- Ensure the app can boot into a coherent empty or active archive state.

Depends on:

- `EP-01 / T-03`
- `EP-02 / T-01`

Blocks:

- `ST-01.2`
- `ST-01.3`
- `ST-01.4`
- `EP-03 / T-02`
- `EP-03 / T-03`
- `EP-03 / T-04`
- `EP-05 / T-02`

### ST-01.2 Place title search in primary visual and interaction position

Definition:

- Make search the dominant dashboard action.
- Ensure the home screen guides the user first toward browse/find behavior rather than secondary operations.

Depends on:

- `ST-01.1`

Blocks:

- `EP-03 / T-02`
- `EP-05 / T-02`

### ST-01.3 Expose primary quick actions and route-level navigation entry points

Definition:

- Provide visible entry points for list, import, export, and create flows.
- Freeze the minimum navigation structure other `EP-03` tasks will consume.

Depends on:

- `ST-01.1`

Blocks:

- `EP-03 / T-02`
- `EP-03 / T-03`
- `EP-03 / T-04`
- `EP-05 / T-02`

### ST-01.4 Show archive metadata and coherent empty-state behavior on the dashboard

Definition:

- Render minimum archive metadata when a dataset is active.
- Render a clear empty state and import-first guidance when no dataset is active.

Depends on:

- `ST-01.1`
- `EP-02 / T-01`
- `EP-02 / T-03`

Blocks:

- `EP-03 / T-02`
- `EP-05 / T-02`

## Downstream Task Impact

- `EP-03 / T-02` must consume the app shell, dashboard entry, and navigation baseline defined here.
- `EP-03 / T-03` must open detail and edit-entry flows inside the same route/container model fixed here.
- `EP-03 / T-04` must attach create-title entry to the primary UI defined here.
- `EP-05 / T-02` must verify Android behavior against this dashboard-first runtime, not against a documentation-only flow.
