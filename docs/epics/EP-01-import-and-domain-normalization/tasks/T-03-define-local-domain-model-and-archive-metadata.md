# T-03 Define local domain model and archive metadata

Status: `accepted`

Objective: Fissare il contratto dominio minimo per `Titolo`, `Sotto-variante` e metadata archivio coerente sia con i dati legacy importati dal workbook reale sia con i flussi di scrittura MVP.

## Decision

Questo task definisce il contratto dominio minimo su cui devono convergere import, normalizzazione, persistenza locale, UI e export. Il record primario dell'MVP non e' la riga del foglio ma un `Titolo` che contiene una collezione ordinata di `Sotto-varianti`.

La decisione aggiornata e' che i dati legacy importati possono contenere valori vuoti nei quattro campi non-title di una sotto-variante. Il dominio applicativo deve poterli preservare. Allo stesso tempo, i flussi di creazione e modifica MVP possono continuare a richiedere quattro campi valorizzati prima di salvare dati user-authored. Questo task definisce quindi un contratto dominio che separa chiaramente la rappresentazione dell'archivio importato dalle regole di validazione write-time.

## Canonical Contract

### 1. Baseline behavior

- Il record primario dell'archivio MVP e' `Titolo`.
- Un `Titolo` deve avere un nome non vuoto dopo normalizzazione degli spazi esterni.
- Un `Titolo` deve contenere almeno una `Sotto-variante`.
- L'ordine delle `Sotto-varianti` e' significativo e va preservato.
- Tutti i campi stringa vengono normalizzati con trim degli spazi esterni prima della validazione o persistenza.
- Il contratto non richiede ancora un id persistente del record a questo stadio.

### 2. Minimum supported set

- `Titolo.titolo`: required
- `Titolo.sotto_varianti`: required, ordered, non-empty
- `SottoVarianteRecord.piattaforma`: required key, string value may be blank for imported legacy data, non-blank required for create/update writes
- `SottoVarianteRecord.edizione_versione`: required key, string value may be blank for imported legacy data, non-blank required for create/update writes
- `SottoVarianteRecord.supporto`: required key, string value may be blank for imported legacy data, non-blank required for create/update writes
- `SottoVarianteRecord.stato`: required key, string value may be blank for imported legacy data, non-blank required for create/update writes
- `ArchiveMetadataRecord.archivio_attivo`: required
- `ArchiveMetadataRecord.numero_record`: required
- `ArchiveMetadataRecord.ultima_modifica_locale`: required for active archive, `None` for empty state
- `ArchiveMetadataRecord.versione_schema`: required

### 3. Compatibility and scope rules

- Import deve poter preservare valori legacy vuoti nelle sotto-varianti senza sintetizzare dati mancanti.
- UI, storage ed export devono poter leggere e mantenere questi valori legacy vuoti.
- I flussi di creazione e modifica MVP possono richiedere il set completo dei 4 campi non-title prima del salvataggio.
- Questo task non definisce ancora il formato persistito in storage.
- Questo task non definisce ancora ids, indici o chiavi di storage.
- Questo task definisce il contratto app-level minimo, non il mapping finale export ODS.

### 4. Persistence and round-trip expectations

- Ogni pipeline successiva deve trattare `Titolo` come record logico primario.
- Import e normalizzazione devono produrre `Sotto-varianti` in ordine sorgente preservato.
- I valori legacy vuoti importati nelle sotto-varianti devono essere round-trippabili attraverso storage, UI ed export.
- Le mutazioni create/update non devono introdurre nuovi record salvati con campi obbligatori mancanti.
- Lo stato di archivio vuoto deve essere rappresentabile senza record attivi e senza timestamp di ultima modifica.

## Subtasks

- `ST-03.1` Define the primary `Titolo` record shape. Status: `accepted`
- `ST-03.2` Define imported-versus-write-time field rules for `Sotto-variante`. Status: `accepted`
- `ST-03.3` Define archive metadata fields for active dataset state. Status: `completed`
- `ST-03.4` Align model constraints with import, editing, storage, and export needs. Status: `accepted`

## Subtask Details And Dependencies

### ST-03.1 Define the primary `Titolo` record shape

Definition:

- Define the MVP primary archive record as one title with an ordered non-empty collection of sub-variants.
- Preserve the title-first shape already stabilized by requirements and use cases.

Depends on:

- `none`

Blocks:

- `ST-03.2`
- `ST-03.3`
- `ST-03.4`
- `EP-02 / T-01`
- `EP-03 / T-03`
- `EP-04 / T-03`

### ST-03.2 Define imported-versus-write-time field rules for `Sotto-variante`

Definition:

- Freeze the canonical four-field set of each sub-variant.
- Allow blank values for imported legacy records.
- Keep create/update save rules stricter than import preservation rules.

Depends on:

- `ST-03.1`
- `EP-01 / T-02`

Blocks:

- `ST-03.4`
- `EP-02 / T-01`
- `EP-02 / T-03`
- `EP-03 / T-02`
- `EP-03 / T-03`
- `EP-03 / T-04`
- `EP-04 / T-01`
- `EP-04 / T-03`

### ST-03.3 Define archive metadata fields for active dataset state

Definition:

- Define the minimum metadata set for the active archive dataset.
- Keep the metadata contract already stabilized by prior implementation and tests.

Depends on:

- `ST-03.1`

Blocks:

- `ST-03.4`
- `EP-02 / T-01`
- `EP-02 / T-02`
- `EP-03 / T-01`
- `EP-05 / T-04`

Status:

- `completed`

Evidence:

- Implemented in [src/archive_model.py](/root/bed-project/src/archive_model.py)
- Verified by [tests/test_archive_model.py](/root/bed-project/tests/test_archive_model.py)

### ST-03.4 Align model constraints with import, editing, storage, and export needs

Definition:

- Ensure downstream tasks do not need to guess whether blanks are valid imported values, invalid write payloads, or both.
- Align title/sub-variant invariants with import preservation, UI rendering, local storage, and ODS export.

Depends on:

- `ST-03.2`
- `ST-03.3`

Blocks:

- `EP-02 / T-01`
- `EP-02 / T-03`
- `EP-03 / T-02`
- `EP-03 / T-03`
- `EP-03 / T-04`
- `EP-04 / T-01`
- `EP-04 / T-02`
- `EP-04 / T-03`

## Downstream Task Impact

- `EP-02 / T-01` must define storage around a contract that preserves legacy imported blanks.
- `EP-02 / T-03` must distinguish imported archive representation from write-time validation rules.
- `EP-03 / T-02` and `EP-03 / T-03` must keep blank imported values discoverable and visible in browse/detail UX.
- `EP-03 / T-04` must keep create validation stricter than import preservation.
- `EP-04 / T-01`, `EP-04 / T-02`, and `EP-04 / T-03` must preserve round-trip behavior for imported blank values.
