# T-05 Build persisted update flow for existing records

Status: `completed`

Objective: Definire il flusso di modifica persistita per record esistenti dal dettaglio mobile, con validazione minima coerente, salvataggio locale e ritorno a contesti di consultazione coerenti.

## Decision

Questo task trasforma l'attuale ingresso in modifica in un vero flusso di update eseguibile. La prima slice non deve ampliare il prodotto con editing massivo o multi-record: deve permettere di modificare in modo intenzionale un record esistente a partire dal dettaglio read-first e salvarlo tramite il boundary di scrittura gia' definito.

Il flusso deve restare coerente con il modello corrente della UI: il dettaglio apre il contesto di modifica di una sotto-variante selezionata dentro un `TitoloRecord`, il form valida i dati prima del salvataggio, persiste l'update e riporta l'utente verso un dettaglio o una vista di consultazione coerente. Il task copre il contratto UI del save flow; non ridefinisce il boundary di storage, gia' definito in `EP-02 / T-03`.

## Canonical Contract

### 1. Update entry baseline

- Il flusso di update deve partire solo dall'ingresso esplicito in modifica definito in `EP-03 / T-03`.
- L'utente deve mantenere contesto chiaro su `titolo` corrente e sotto-variante selezionata.
- Il task non richiede ancora editing batch di piu' sotto-varianti nella stessa interazione.

### 2. Minimum editable payload

- Il form deve permettere almeno l'editing di:
  - `titolo`;
  - `piattaforma`;
  - `edizione/versione`;
  - `supporto`;
  - `stato`;
- L'update deve agire sul `TitoloRecord` corrente e sulla sotto-variante identificata dall'indice selezionato.
- I campi importati legacy mancanti possono essere mostrati come punto di partenza, ma il salvataggio deve rispettare il boundary canonico di scrittura.

### 3. Validation and persistence handoff

- La validazione deve avvenire prima della persistenza locale.
- Il flusso di update deve usare il boundary di scrittura definito in `EP-02 / T-03`.
- Il salvataggio deve fallire con feedback esplicito se:
  - il titolo diventa vuoto;
  - la sotto-variante diventa incompleta rispetto ai 4 campi canonici;
  - l'update crea collisione con un altro titolo esistente;
  - l'indice della sotto-variante non e' piu' valido.

### 4. Post-save coherence

- Dopo un salvataggio riuscito, il record aggiornato deve risultare coerente in dettaglio, lista e ricerca senza passaggi manuali aggiuntivi.
- Se il titolo cambia, il ritorno deve usare l'identita' aggiornata del record.
- Se il salvataggio fallisce, il contesto di modifica deve restare comprensibile e l'errore deve essere azionabile dall'utente.

### 5. Scope rules

- Questo task non definisce ancora l'aggiunta o la rimozione di sotto-varianti.
- Questo task non richiede modifica simultanea di piu' sotto-varianti.
- Questo task non ridefinisce il comportamento read-first del dettaglio fuori dal momento esplicito di modifica.

## Subtasks

- `ST-05.1` Render a persisted edit form from the explicit edit entry path. Status: `completed`
- `ST-05.2` Validate title and selected sub-variant fields before save. Status: `completed`
- `ST-05.3` Persist valid updates through the local write boundary and surface save failures. Status: `completed`
- `ST-05.4` Return successful updates to coherent detail, list, and search contexts. Status: `completed`

## Subtask Details And Dependencies

### ST-05.1 Render a persisted edit form from the explicit edit entry path

Definition:

- Replace the current edit-entry placeholder with a runnable form for the selected record context.
- Preserve clear visibility of the current title and selected sub-variant while editing.

Depends on:

- `EP-03 / T-03`

Blocks:

- `ST-05.2`
- `ST-05.3`
- `ST-05.4`
- `EP-05 / T-02`

Status:

- `completed`

Evidence:

- Implemented in [webapp/app.js](/root/bed-project/webapp/app.js)
- Verified by [tests/test_archive_dashboard_app.py](/root/bed-project/tests/test_archive_dashboard_app.py)

### ST-05.2 Validate title and selected sub-variant fields before save

Definition:

- Enforce non-empty title and complete canonical sub-variant fields before attempting persistence.
- Keep validation feedback local to the edit flow and actionable on phone-sized viewports.

Depends on:

- `ST-05.1`
- `EP-01 / T-03`

Blocks:

- `ST-05.3`
- `ST-05.4`
- `EP-05 / T-02`

Status:

- `completed`

Evidence:

- Implemented in [webapp/app.js](/root/bed-project/webapp/app.js)
- Verified by [tests/test_archive_dashboard_app.py](/root/bed-project/tests/test_archive_dashboard_app.py)

### ST-05.3 Persist valid updates through the local write boundary and surface save failures

Definition:

- Submit valid updates through the mutation boundary defined in `EP-02 / T-03`.
- Surface duplicate-title, invalid-index, and write-failure problems without losing the edit context.

Depends on:

- `ST-05.2`
- `EP-02 / T-03`

Blocks:

- `ST-05.4`
- `EP-05 / T-02`

Status:

- `completed`

Evidence:

- Implemented in [src/archive_dashboard_app.py](/root/bed-project/src/archive_dashboard_app.py)
- Verified by [tests/test_archive_dashboard_app.py](/root/bed-project/tests/test_archive_dashboard_app.py)

### ST-05.4 Return successful updates to coherent detail, list, and search contexts

Definition:

- Keep the updated record immediately reachable after save.
- Preserve coherence between detail, browse, and search when the edited title identity changes.

Depends on:

- `ST-05.3`
- `EP-03 / T-02`

Blocks:

- `EP-05 / T-02`

Status:

- `completed`

Evidence:

- Implemented in [webapp/app.js](/root/bed-project/webapp/app.js)
- Verified by [tests/test_archive_dashboard_app.py](/root/bed-project/tests/test_archive_dashboard_app.py)

## Downstream Task Impact

- `EP-05 / T-02` must verify end-to-end update behavior on Android-sized viewports using this persisted flow, not the former edit-entry placeholder.
- Any later edit enhancements must preserve the explicit-entry, validated-save, and coherent post-save behavior defined here.
