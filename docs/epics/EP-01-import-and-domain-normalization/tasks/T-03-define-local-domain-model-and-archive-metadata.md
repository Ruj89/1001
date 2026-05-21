# T-03 Define local domain model and archive metadata

Status: `completed`

Objective: Fissare la struttura dati locale minima per `Titolo`, `Sotto-variante` e metadata archivio coerente con gli use case e le user stories MVP.

## Decision

Questo task definisce il contratto dominio minimo su cui devono convergere import, normalizzazione, persistenza locale, UI e export. Il record primario dell'MVP non e' la riga del foglio ma un `Titolo` che contiene una collezione ordinata di `Sotto-varianti`.

Le decisioni gia' implementate in codice in questa iterazione sono:

- shape primario del record `Titolo`
- shape canonico e immutabile della `Sotto-variante`
- shape minima dei metadata dell'archivio attivo

Resta aperto solo l'allineamento esplicito del contratto completo con i vincoli downstream di import, editing ed export.

## Canonical Contract

### 1. Baseline behavior

- Il record primario dell'archivio MVP e' `Titolo`.
- Un `Titolo` deve avere un nome non vuoto dopo normalizzazione degli spazi esterni.
- Un `Titolo` deve contenere almeno una `Sotto-variante`.
- L'ordine delle `Sotto-varianti` e' significativo e va preservato.
- Tutti i campi stringa di `Titolo` e `SottoVarianteRecord` vengono normalizzati con trim degli spazi esterni prima della validazione e della persistenza.
- Il contratto non richiede ancora un id persistente del record a questo stadio.

### 2. Minimum supported set

- `Titolo.titolo`: required
- `Titolo.sotto_varianti`: required, ordered, non-empty
- `SottoVarianteRecord.piattaforma`: required
- `SottoVarianteRecord.edizione_versione`: required
- `SottoVarianteRecord.supporto`: required
- `SottoVarianteRecord.stato`: required
- `ArchiveMetadataRecord.archivio_attivo`: required
- `ArchiveMetadataRecord.numero_record`: required
- `ArchiveMetadataRecord.ultima_modifica_locale`: required for active archive, `None` for empty state
- `ArchiveMetadataRecord.versione_schema`: required

### 3. Compatibility and scope rules

- Questo task non definisce ancora il formato persistito in storage.
- Questo task non definisce ancora ids, indici o chiavi di storage.
- Questo task definisce il contratto app-level minimo, non il mapping finale export ODS.

### 4. Persistence and round-trip expectations

- Ogni pipeline successiva deve trattare `Titolo` come record logico primario.
- Import e normalizzazione devono produrre `Sotto-varianti` in ordine sorgente preservato.
- Ogni `Sotto-variante` persistita o modificata deve rispettare il set minimo di 4 campi richiesti.
- Lo stato di archivio vuoto deve essere rappresentabile senza record attivi e senza timestamp di ultima modifica.
- Edit ed export non devono violare gli invarianti minimi del record `Titolo`.

## Subtasks

- `ST-03.1` Define the primary `Titolo` record shape. Status: `completed`
- `ST-03.2` Define the required `Sotto-variante` fields. Status: `completed`
- `ST-03.3` Define archive metadata fields for active dataset state. Status: `completed`
- `ST-03.4` Align model constraints with import, editing, and export needs. Status: `completed`

## Subtask Details And Dependencies

### ST-03.1 Define the primary `Titolo` record shape

Definition:

- Define the MVP primary archive record as one title with an ordered non-empty collection of sub-variants.
- Enforce the base invariants already stabilized in the requirements and use cases.
- Provide an executable code artifact for the title-level shape.

Status:

- `completed`

Depends on:

- `none`

Blocks:

- `ST-03.2`
- `ST-03.3`
- `ST-03.4`
- `EP-01 / T-01`
- `EP-01 / T-02`
- `EP-02 / T-01`
- `EP-03 / T-03`
- `EP-04 / T-03`

Evidence:

- Implemented in [src/archive_model.py](/root/bed-project/src/archive_model.py)
- Verified by [tests/test_archive_model.py](/root/bed-project/tests/test_archive_model.py)

### ST-03.2 Define the required `Sotto-variante` fields

Definition:

- Freeze the canonical MVP field set of each sub-variant.
- Make the 4 required fields explicit for downstream import, edit, and export logic.

Status:

- `completed`

Depends on:

- `ST-03.1`

Blocks:

- `ST-03.4`
- `EP-01 / T-02`
- `EP-02 / T-03`
- `EP-03 / T-03`
- `EP-03 / T-04`
- `EP-04 / T-01`
- `EP-04 / T-03`

Evidence:

- Implemented in [src/archive_model.py](/root/bed-project/src/archive_model.py)
- Verified by [tests/test_archive_model.py](/root/bed-project/tests/test_archive_model.py)

### ST-03.3 Define archive metadata fields for active dataset state

Definition:

- Define the minimum metadata set for the active archive dataset.
- Cover the fields already stabilized by requirements and use cases.

Status:

- `completed`

Depends on:

- `ST-03.1`

Blocks:

- `ST-03.4`
- `EP-02 / T-01`
- `EP-02 / T-02`
- `EP-03 / T-01`
- `EP-05 / T-04`

Evidence:

- Implemented in [src/archive_model.py](/root/bed-project/src/archive_model.py)
- Verified by [tests/test_archive_model.py](/root/bed-project/tests/test_archive_model.py)

### ST-03.4 Align model constraints with import, editing, and export needs

Definition:

- Align the full domain contract with import normalization, local editing, and export fidelity expectations.
- Ensure no downstream task needs to guess title/sub-variant invariants.

Status:

- `completed`

Depends on:

- `ST-03.2`
- `ST-03.3`

Blocks:

- `EP-01 / T-01`
- `EP-01 / T-02`
- `EP-02 / T-01`
- `EP-02 / T-03`
- `EP-03 / T-03`
- `EP-03 / T-04`
- `EP-04 / T-01`
- `EP-04 / T-02`
- `EP-04 / T-03`

## Downstream Task Impact

- `EP-01 / T-01` must consume the `Titolo` contract when building the parse output boundary.
- `EP-01 / T-02` must emit normalized records compatible with this shape.
- `EP-02 / T-01` must define storage schema around this app-level contract rather than around spreadsheet rows.
- `EP-02 / T-02` and `EP-03 / T-01` must consume the archive metadata contract for empty-state and active-dataset behavior.
- `EP-03 / T-03` and `EP-03 / T-04` must render and edit records according to this contract.
- `EP-04 / T-03` must map this contract back to operational ODS output without breaking title/sub-variant invariants.
