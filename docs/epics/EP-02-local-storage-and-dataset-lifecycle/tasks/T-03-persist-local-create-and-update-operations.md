# T-03 Persist local create and update operations

Status: `completed`

Objective: Rendere persistenti in storage locale le modifiche e la creazione di record senza perdere coerenza tra dettaglio, elenco, ricerca e metadata archivio.

## Decision

Questo task chiude il boundary di scrittura persistita sul dataset attivo dell'MVP. Le operazioni di create/update non devono conoscere l'implementazione fisica dello storage browser: devono solo applicare mutazioni coerenti sul dataset attivo, preservare l'ordine dei record salvo edit espliciti e riallineare i metadata dell'archivio dopo ogni scrittura riuscita.

## Canonical Contract

### 1. Title-level edits

- Il sistema deve poter aggiornare un `TitoloRecord` esistente individuandolo per titolo corrente.
- Un update di titolo non deve creare collisioni con un altro titolo gia' presente.
- L'ordine dei record attivi deve restare invariato quando si sostituisce un record esistente.

### 2. Sub-variant updates

- Il sistema deve poter aggiornare una `SottoVarianteRecord` esistente tramite indice stabile all'interno del `TitoloRecord`.
- L'update di una sotto-variante deve continuare a richiedere i 4 campi obbligatori del modello canonico.
- Un indice sotto-variante fuori range deve fallire con errore esplicito.

### 3. New title creation

- Il sistema deve poter aggiungere un nuovo `TitoloRecord` con almeno una sotto-variante iniziale valida.
- La creazione deve fallire se esiste gia' un record con lo stesso titolo canonico.
- La creazione da stato vuoto puo' attivare il primo archivio locale valido.

### 4. Metadata coherence after writes

- Ogni scrittura riuscita deve aggiornare `ultima_modifica_locale`.
- Ogni scrittura riuscita deve mantenere `versione_schema` coerente con il payload storage.
- `numero_record` deve riflettere il numero reale di `TitoloRecord` attivi dopo la scrittura.

### 5. Scope rules

- Questo task non introduce ancora query di ricerca o filtri.
- Questo task non definisce ancora la UI dei form di modifica/creazione.
- Questo task non cambia il contratto di overwrite confermato gia' definito in `EP-02 / T-02`.

## Subtasks

- `ST-03.1` Persist title-level edits. Status: `completed`
- `ST-03.2` Persist sub-variant updates with required fields enforced. Status: `completed`
- `ST-03.3` Persist new title creation with an initial sub-variant. Status: `completed`
- `ST-03.4` Update archive metadata after each successful write. Status: `completed`

## Subtask Details And Dependencies

### ST-03.1 Persist title-level edits

Definition:

- Replace an existing active `TitoloRecord` without disturbing the rest of the active archive ordering.
- Reject updates targeting missing titles or producing duplicate title identities.

Depends on:

- `EP-02 / T-01`
- `EP-02 / T-02`

Blocks:

- `ST-03.2`
- `ST-03.4`
- `EP-03 / T-03`

Status:

- `completed`

Evidence:

- Implemented in [src/archive_storage.py](/root/bed-project/src/archive_storage.py)
- Verified by [tests/test_archive_storage.py](/root/bed-project/tests/test_archive_storage.py)

### ST-03.2 Persist sub-variant updates with required fields enforced

Definition:

- Replace one active sub-variant by stable index inside its parent title.
- Keep canonical required-field validation delegated to `SottoVarianteRecord`.

Depends on:

- `ST-03.1`
- `EP-01 / T-03`

Blocks:

- `ST-03.4`
- `EP-03 / T-03`

Status:

- `completed`

Evidence:

- Implemented in [src/archive_storage.py](/root/bed-project/src/archive_storage.py)
- Verified by [tests/test_archive_storage.py](/root/bed-project/tests/test_archive_storage.py)

### ST-03.3 Persist new title creation with an initial sub-variant

Definition:

- Append a new `TitoloRecord` to the active archive or activate the first valid archive from empty state.
- Reject duplicate title creation.

Depends on:

- `EP-02 / T-01`
- `EP-01 / T-03`

Blocks:

- `ST-03.4`
- `EP-03 / T-04`

Status:

- `completed`

Evidence:

- Implemented in [src/archive_storage.py](/root/bed-project/src/archive_storage.py)
- Verified by [tests/test_archive_storage.py](/root/bed-project/tests/test_archive_storage.py)

### ST-03.4 Update archive metadata after each successful write

Definition:

- Refresh `numero_record`, `ultima_modifica_locale`, and `versione_schema` after every successful create/update.
- Keep the metadata synchronized with the mutated active archive.

Depends on:

- `ST-03.1`
- `ST-03.2`
- `ST-03.3`

Blocks:

- `EP-03 / T-01`
- `EP-03 / T-03`
- `EP-03 / T-04`
- `EP-05 / T-04`

Status:

- `completed`

Evidence:

- Implemented in [src/archive_storage.py](/root/bed-project/src/archive_storage.py)
- Verified by [tests/test_archive_storage.py](/root/bed-project/tests/test_archive_storage.py)

## Downstream Task Impact

- `EP-03 / T-01` can expose archive counts and timestamps from persisted metadata after writes.
- `EP-03 / T-03` must drive title/detail edits through the title and sub-variant mutation boundaries defined here.
- `EP-03 / T-04` must create new titles through the canonical creation boundary instead of inventing ad hoc archive activation rules.
- `EP-05 / T-04` must verify that writes survive restart with metadata coherence preserved.
