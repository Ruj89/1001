# T-02 Implement confirmed dataset overwrite flow

Status: `completed`

Objective: Garantire che un nuovo import sostituisca completamente il dataset locale solo dopo conferma esplicita dell'utente.

## Decision

Questo task chiude il boundary di overwrite al livello di lifecycle storage. L'interfaccia utente concreta potra' poi visualizzare il prompt di conferma come preferisce, ma il contratto applicativo e' gia' fissato:

- il sistema sa rilevare se esiste un archivio attivo;
- un import candidato resta in `pendingImport` finche' non arriva una decisione esplicita;
- la conferma sostituisce l'archivio attivo in un singolo passaggio logico;
- l'annullamento o il mancato completamento dell'import preservano il dataset precedente.

## Canonical Contract

### 1. Active dataset detection

- Il sistema deve poter distinguere lo stato con archivio attivo da quello vuoto.
- La presenza di un archivio attivo determina se l'overwrite richiede conferma esplicita.

### 2. Confirmation gate

- Un dataset candidato importato ma non ancora confermato deve restare in `pendingImport`.
- `pendingImport` non deve diventare archivio attivo senza una decisione booleana esplicita di conferma.
- Se non esiste alcun `pendingImport`, la risoluzione dell'overwrite deve fallire con errore esplicito.

### 3. Atomic replacement

- In caso di conferma positiva, il sistema deve sostituire `activeArchive` con i titoli di `pendingImport` in un singolo passaggio logico.
- In caso di conferma positiva, i metadata dell'archivio devono essere ricostruiti sul nuovo dataset attivo.
- Dopo attivazione riuscita, `pendingImport` deve essere svuotato.

### 4. Cancel and failure preservation

- In caso di annullamento, l'archivio attivo precedente deve restare invariato.
- In caso di annullamento, `pendingImport` deve essere eliminato.
- In caso di import non completato o non confermato, il dataset attivo precedente non deve essere sostituito.

### 5. Scope rules

- Questo task non definisce ancora il componente UI del prompt di conferma.
- Questo task non ridefinisce parser, normalizzazione o schema storage di base.
- Questo task non copre ancora mutazioni record-by-record successive all'attivazione.

## Subtasks

- `ST-02.1` Detect whether an active dataset already exists. Status: `completed`
- `ST-02.2` Present explicit overwrite confirmation before activation. Status: `completed`
- `ST-02.3` Replace the active dataset atomically after confirmation. Status: `completed`
- `ST-02.4` Preserve the previous dataset when the user cancels or import fails. Status: `completed`

## Subtask Details And Dependencies

### ST-02.1 Detect whether an active dataset already exists

Definition:

- Expose an application-level predicate for empty-state versus active-archive state.
- Use that predicate as the boundary for later confirmation UX.

Depends on:

- `EP-02 / T-01`

Blocks:

- `ST-02.2`
- `ST-02.3`
- `ST-02.4`
- `EP-03 / T-01`

Status:

- `completed`

Evidence:

- Implemented in [src/archive_storage.py](/root/bed-project/src/archive_storage.py)
- Verified by [tests/test_archive_storage.py](/root/bed-project/tests/test_archive_storage.py)

### ST-02.2 Present explicit overwrite confirmation before activation

Definition:

- Make overwrite confirmation an explicit decision point rather than an implicit side effect of import.
- Keep the imported candidate separate from the active archive until that decision is resolved.

Depends on:

- `ST-02.1`
- `EP-02 / T-01`

Blocks:

- `ST-02.3`
- `ST-02.4`
- `EP-05 / T-04`

Status:

- `completed`

Evidence:

- Implemented in [src/archive_storage.py](/root/bed-project/src/archive_storage.py)
- Verified by [tests/test_archive_storage.py](/root/bed-project/tests/test_archive_storage.py)

### ST-02.3 Replace the active dataset atomically after confirmation

Definition:

- Promote `pendingImport` to `activeArchive` in one logical overwrite step.
- Rebuild archive metadata from the newly activated dataset.

Depends on:

- `ST-02.2`
- `EP-02 / T-01`

Blocks:

- `EP-02 / T-03`
- `EP-03 / T-01`
- `EP-05 / T-04`

Status:

- `completed`

Evidence:

- Implemented in [src/archive_storage.py](/root/bed-project/src/archive_storage.py)
- Verified by [tests/test_archive_storage.py](/root/bed-project/tests/test_archive_storage.py)

### ST-02.4 Preserve the previous dataset when the user cancels or import fails

Definition:

- Keep the old active dataset unchanged on cancel.
- Ensure unresolved or discarded imports do not leak into active archive state.

Depends on:

- `ST-02.2`
- `ST-02.3`

Blocks:

- `EP-03 / T-01`
- `EP-05 / T-04`

Status:

- `completed`

Evidence:

- Implemented in [src/archive_storage.py](/root/bed-project/src/archive_storage.py)
- Verified by [tests/test_archive_storage.py](/root/bed-project/tests/test_archive_storage.py)

## Downstream Task Impact

- `EP-02 / T-03` must mutate only the active archive and must continue to preserve metadata coherence after writes.
- `EP-03 / T-01` can drive dashboard/archive-status states from `has_active_archive` and overwrite confirmation needs.
- `EP-05 / T-04` must verify both positive confirmation and cancellation against this overwrite boundary.
