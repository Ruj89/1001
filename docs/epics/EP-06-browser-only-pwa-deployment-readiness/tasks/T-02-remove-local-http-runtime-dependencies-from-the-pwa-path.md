# T-02 Remove local HTTP runtime dependencies from the PWA path

Status: `proposed`

Objective: Spostare il percorso PWA target da runtime con server Python locale a runtime browser-only, preservando UI e flussi MVP gia' definiti.

## Decision

Il task e' abbastanza definito per l'esecuzione e l'inventario minimo delle dipendenze bloccanti e' gia' verificabile nel codice attuale. Il percorso PWA target non puo' essere reso deployabile via hosting statico finche' la shell web continua a dipendere da:

- bootstrap `GET /api/dashboard`;
- mutazioni `POST /api/titles` e `PUT /api/titles/...`;
- service worker che intercetta ancora risposte HTTP del runtime locale;
- server Python locale che funge da boundary dati, bootstrap view-model e hosting statico nello stesso tempo.

Questo task non ridefinisce UI o requisiti di prodotto. Definisce come migrare il boundary runtime dal server locale al browser-local persistence boundary gia' previsto dal progetto.

L'esecuzione dei subtasks implementativi resta pero' bloccata finche' non viene congelato il boundary browser concreto che sostituisce il runtime Python locale. Il contratto `EP-02 / T-01` definisce il payload logico e il versionamento, ma dichiara esplicitamente di non decidere ancora la struttura fisica IndexedDB definitiva.

## Canonical Contract

### 1. Blocking dependency inventory

- Il bootstrap iniziale della shell non deve piu' richiedere `fetch("/api/dashboard")`.
- Le operazioni di create e update non devono piu' richiedere endpoint HTTP locali.
- Il service worker non deve piu' dipendere da caching opportunistico di `/api/dashboard`.
- Il server Python locale puo' restare come harness di sviluppo o compatibilita' temporanea, ma non come prerequisito del percorso PWA supportato.

### 2. Browser-only bootstrap target

- Dashboard, metadata archivio, stato vuoto e titoli attivi devono essere derivati da persistenza browser-local.
- Il bootstrap deve poter aprire la shell anche senza rete e senza server locale.
- Gli errori di recovery devono essere trattati come problemi del boundary dati locale, non come assenza di risposta HTTP.

### 3. Browser-local write target

- Create e update devono passare da un write boundary locale coerente con le regole di `EP-02`.
- La UI non deve perdere le regole di validazione, duplicate-title protection, metadata update e coerenza post-save gia' fissate nei task upstream.

### 4. Compatibility and scope rules

- Questo task non richiede di eliminare immediatamente il server Python dal repository.
- Questo task non richiede ancora la procedura di publish su hosting specifico.
- Questo task deve preservare shell, route, comportamento dashboard-first e flussi MVP gia' verificati, salvo i cambi minimi necessari al cambio di runtime boundary.

## Subtasks

- `ST-02.1` Inventariare le dipendenze correnti da `/api/*`, bootstrap HTTP locale e server Python che impediscono il deployment statico.
- `ST-02.2` Reindirizzare bootstrap dashboard, metadata archivio e stato attivo verso il boundary di persistenza browser-local previsto dal progetto.
- `ST-02.3` Reindirizzare create e update flow verso write boundary locale browser-only senza perdere le regole di validazione e coerenza gia' fissate.
- `ST-02.4` Garantire che shell, navigazione e stato vuoto/attivo restino avviabili offline senza server locale o backend remoto.

## Subtask Details And Dependencies

### ST-02.1 Inventariare le dipendenze correnti da `/api/*`, bootstrap HTTP locale e server Python

Definition:

- Enumerare tutti i punti del codice che rendono la shell non pubblicabile come asset statico browser-only.
- Congelare l'inventario minimo che i subtasks successivi devono rimuovere o sostituire.

Depends on:

- `EP-06 / T-01`
- [webapp/app.js](/root/bed-project/webapp/app.js)
- [webapp/service-worker.js](/root/bed-project/webapp/service-worker.js)
- [src/archive_dashboard_app.py](/root/bed-project/src/archive_dashboard_app.py)

Blocks:

- `ST-02.2`
- `ST-02.3`
- `ST-02.4`

Status:

- `completed`

Evidence:

- `webapp/app.js` calls `GET /api/dashboard`, `POST /api/titles`, and `PUT /api/titles/...`.
- `webapp/service-worker.js` caches runtime responses tied to `/api/dashboard`.
- `src/archive_dashboard_app.py` couples static hosting and archive mutation endpoints into a local Python server.

### ST-02.2 Reindirizzare bootstrap dashboard, metadata archivio e stato attivo verso il boundary browser-local

Definition:

- Sostituire il bootstrap HTTP con bootstrap da storage browser-local.
- Definire il comportamento coerente su archive attivo, stato vuoto e recovery failure.

Depends on:

- `ST-02.1`
- `EP-02 / T-01`
- `EP-02 / T-03`

Blocks:

- `ST-02.3`
- `ST-02.4`
- `EP-06 / T-03`

Status:

- `accepted`

### ST-02.3 Reindirizzare create e update flow verso write boundary locale browser-only

Definition:

- Rimuovere la dipendenza della UI dalle mutation API locali.
- Preservare duplicate protection, field validation e metadata coherence gia' definite.

Depends on:

- `ST-02.1`
- `ST-02.2`
- `EP-02 / T-03`
- `EP-03 / T-05`

Blocks:

- `ST-02.4`
- `EP-07 / T-02`

Status:

- `accepted`

### ST-02.4 Garantire che shell, navigazione e stato vuoto/attivo restino avviabili offline senza server locale

Definition:

- Verificare che la shell browser-only resti avviabile senza runtime locale.
- Riallineare eventuali messaggi o fallback UI che oggi presuppongono il riavvio del server Python.

Depends on:

- `ST-02.2`
- `ST-02.3`
- `EP-03 / T-01`

Blocks:

- `EP-06 / T-03`
- `EP-07 / T-01`
- `EP-07 / T-02`

Status:

- `accepted`

## Downstream Task Impact

- `EP-06 / T-03` must consume the browser-only bootstrap and write boundary assumptions fixed here.
- `EP-07 / T-01` cannot publish a supported hosted release until `ST-02.4` is completed.
- `EP-07 / T-02` cannot validate Android deployed behavior until create, update, and bootstrap no longer rely on the local Python runtime.
