# T-01 Define local storage schema and versioning

Status: `completed`

Objective: Introdurre uno schema di persistenza locale versionato che possa contenere record archivio, sotto-varianti e metadata senza dipendenza da backend.

## Decision

Questo task fissa il boundary persistito dell'MVP prima dell'adapter browser reale. Lo storage locale viene definito come payload versionato che separa chiaramente:

- archivio attivo persistito;
- metadata archivio persistiti;
- import pendente/transitorio non ancora attivato.

Il task non implementa ancora IndexedDB o il flusso UI di overwrite confermato. Definisce pero' il contratto serializzabile che i task successivi devono usare per evitare che un import transitorio sovrascriva implicitamente il dataset attivo.

## Canonical Contract

### 1. Storage containers

- Lo storage locale MVP contiene una `schemaVersion` di primo livello.
- Lo storage locale contiene `activeArchive` come contenitore dell'archivio attivo persistito.
- `activeArchive` contiene:
  - la sequenza ordinata dei `TitoloRecord` persistiti;
  - i metadata archivio persistiti coerenti con il dataset attivo.
- Lo storage locale contiene `pendingImport` separato da `activeArchive`.
- `pendingImport` rappresenta solo un dataset candidato non ancora attivato.

### 2. Versioning and compatibility

- La versione schema MVP iniziale e' `v1`.
- Ogni payload persistito deve dichiarare esplicitamente `schemaVersion`.
- Un payload con versione schema non supportata deve fallire in recovery con errore esplicito.
- La versione schema nei metadata archivio attivi deve restare allineata alla `schemaVersion` del payload.

### 3. Active vs transient state separation

- `activeArchive` e' l'unica sorgente persistita da cui l'app puo' considerare attivo un dataset dopo restart.
- `pendingImport` non puo' attivare da solo un nuovo archivio.
- La presenza di `pendingImport` non deve alterare i record o i metadata dell'archivio attivo.
- La cancellazione di `pendingImport` non deve modificare l'archivio attivo.

### 4. Minimum recovery behavior

- In assenza di payload persistito, il sistema deve ricostruire uno stato vuoto valido con `schemaVersion` corrente.
- Dopo restart, un archivio attivo valido deve essere recuperabile con record, numero record, timestamp di ultima modifica e versione schema coerenti.
- Dopo restart, un eventuale `pendingImport` puo' essere ripristinato solo come stato non attivo.
- Se il payload persistito e' malformato rispetto al contratto, la recovery deve fallire con errore esplicito invece di inventare dati parziali.

### 5. Scope rules

- Questo task non decide ancora la struttura fisica IndexedDB definitiva.
- Questo task non attiva ancora overwrite confermato dell'archivio.
- Questo task non implementa ancora modifica/creazione record attraverso uno store mutabile.

## Subtasks

- `ST-01.1` Define the local storage containers for titles and metadata. Status: `completed`
- `ST-01.2` Define schema version storage and upgrade expectations. Status: `completed`
- `ST-01.3` Separate active archive data from transient import state. Status: `completed`
- `ST-01.4` Identify minimum recovery expectations after app restart. Status: `completed`

## Subtask Details And Dependencies

### ST-01.1 Define the local storage containers for titles and metadata

Definition:

- Freeze the serializable boundary for active archive titles and archive metadata.
- Keep the persisted payload aligned with the `TitoloRecord` and `ArchiveMetadataRecord` app-level contracts.

Depends on:

- `EP-01 / T-03`

Blocks:

- `ST-01.2`
- `ST-01.3`
- `ST-01.4`
- `EP-02 / T-02`
- `EP-02 / T-03`
- `EP-03 / T-01`

Status:

- `completed`

Evidence:

- Implemented in [src/archive_storage.py](/root/bed-project/src/archive_storage.py)
- Verified by [tests/test_archive_storage.py](/root/bed-project/tests/test_archive_storage.py)

### ST-01.2 Define schema version storage and upgrade expectations

Definition:

- Make schema version explicit in the persisted payload.
- Reject unsupported versions before treating the payload as recoverable app state.

Depends on:

- `ST-01.1`

Blocks:

- `ST-01.4`
- `EP-02 / T-02`
- `EP-05 / T-04`

Status:

- `completed`

Evidence:

- Implemented in [src/archive_storage.py](/root/bed-project/src/archive_storage.py)
- Verified by [tests/test_archive_storage.py](/root/bed-project/tests/test_archive_storage.py)

### ST-01.3 Separate active archive data from transient import state

Definition:

- Persist the active dataset independently from any import candidate pending confirmation.
- Prevent a pending import from overwriting the active archive implicitly.

Depends on:

- `ST-01.1`
- `ST-01.2`

Blocks:

- `EP-02 / T-02`
- `EP-03 / T-01`

Status:

- `completed`

Evidence:

- Implemented in [src/archive_storage.py](/root/bed-project/src/archive_storage.py)
- Verified by [tests/test_archive_storage.py](/root/bed-project/tests/test_archive_storage.py)

### ST-01.4 Identify minimum recovery expectations after app restart

Definition:

- Define the minimum recoverable empty state, active archive state, and pending import state.
- Fail explicitly on unsupported versions or malformed persisted payloads.

Depends on:

- `ST-01.1`
- `ST-01.2`
- `ST-01.3`

Blocks:

- `EP-02 / T-02`
- `EP-02 / T-03`
- `EP-05 / T-04`

Status:

- `completed`

Evidence:

- Implemented in [src/archive_storage.py](/root/bed-project/src/archive_storage.py)
- Verified by [tests/test_archive_storage.py](/root/bed-project/tests/test_archive_storage.py)

## Downstream Task Impact

- `EP-02 / T-02` must stage import candidates in `pendingImport` and move them into `activeArchive` only after explicit confirmation.
- `EP-02 / T-03` must preserve the same schema version and metadata update semantics when mutating active records.
- `EP-03 / T-01` can treat archive status as recoverable from persisted metadata instead of recomputing ad hoc.
- `EP-05 / T-04` must verify restart behavior against the empty, active, pending, and unsupported-version cases defined here.
