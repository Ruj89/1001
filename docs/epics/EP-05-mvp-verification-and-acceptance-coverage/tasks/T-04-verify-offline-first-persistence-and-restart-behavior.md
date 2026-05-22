# T-04 Verify offline-first persistence and restart behavior

Status: `completed`

Objective: Confermare che il dataset locale resti disponibile e coerente offline dopo chiusura, riapertura, modifica e nuovo import.

## Decision

La copertura di verifica per persistenza e restart e' presente nel boundary storage versionato. La suite conferma che:

- lo stato vuoto e quello attivo sono serializzabili e recuperabili;
- le modifiche locali e le creazioni aggiornano il dataset attivo e i metadata coerentemente;
- l'overwrite confermato protegge il dataset attivo finche' l'utente non conferma;
- la recovery fallisce esplicitamente su schema version non supportata o shape persistita invalida.

## Canonical Verification Coverage

### 1. Active archive restart recovery

- La suite deve verificare round-trip serialize/deserialize dello stato attivo.
- La suite deve verificare che record, numero record, timestamp e versione schema restino coerenti dopo recovery.

### 2. Local writes remain available offline

- La suite deve verificare che update di titolo, update di sotto-variante e creazione di un nuovo titolo modifichino il dataset attivo persistito.
- La suite deve verificare che i metadata si aggiornino dopo ogni scrittura riuscita.

### 3. Overwrite confirmation protection

- La suite deve verificare che un import staged non sovrascriva l'archivio attivo senza conferma.
- La suite deve verificare che la cancellazione preservi il dataset precedente.
- La suite deve verificare che la conferma promuova atomicamente il pending import.

### 4. Invalid recovery safety

- La suite deve verificare errore esplicito su schema version non supportata.
- La suite deve verificare errore esplicito su payload persistiti malformati.

### 5. Scope boundary

- Questa copertura verifica persistenza e recovery del boundary dati locale.
- Questa copertura non verifica ancora deployment HTTPS, service worker installato, prompt di installazione PWA o comportamento post-installazione su Android.

## Subtasks

- `ST-04.1` Verify active archive persistence after app restart. Status: `completed`
- `ST-04.2` Verify local edits remain available without network access. Status: `completed`
- `ST-04.3` Verify overwrite confirmation protects the active dataset. Status: `completed`
- `ST-04.4` Verify archive metadata remains coherent after lifecycle transitions. Status: `completed`

## Subtask Details And Dependencies

### ST-04.1 Verify active archive persistence after app restart

Definition:

- Verify storage payload round-trip for active archive state.
- Verify empty-state recovery remains valid when no payload is present.

Depends on:

- `EP-02 / T-01`

Blocks:

- `ST-04.2`
- `ST-04.3`
- `ST-04.4`

Status:

- `completed`

Evidence:

- Verified by [tests/test_archive_storage.py](/root/bed-project/tests/test_archive_storage.py)

### ST-04.2 Verify local edits remain available without network access

Definition:

- Verify create and update writes persist in the active storage boundary.
- Verify mutation results remain reflected in the active archive snapshot and metadata.

Depends on:

- `EP-02 / T-03`

Blocks:

- `ST-04.4`

Status:

- `completed`

Evidence:

- Verified by [tests/test_archive_storage.py](/root/bed-project/tests/test_archive_storage.py)

### ST-04.3 Verify overwrite confirmation protects the active dataset

Definition:

- Verify staged imports do not activate implicitly.
- Verify cancel preserves the previous dataset and confirm swaps atomically.

Depends on:

- `EP-02 / T-02`

Blocks:

- `ST-04.4`

Status:

- `completed`

Evidence:

- Verified by [tests/test_archive_storage.py](/root/bed-project/tests/test_archive_storage.py)

### ST-04.4 Verify archive metadata remains coherent after lifecycle transitions

Definition:

- Verify `numero_record`, `ultima_modifica_locale`, and `versione_schema` remain aligned after activation, mutation, and recovery.
- Verify invalid schema or malformed payloads fail explicitly instead of yielding incoherent metadata.

Depends on:

- `EP-02 / T-01`
- `EP-02 / T-02`
- `EP-02 / T-03`

Blocks:

- `none`

Status:

- `completed`

Evidence:

- Verified by [tests/test_archive_storage.py](/root/bed-project/tests/test_archive_storage.py)

## Downstream Task Impact

- `EP-06 / T-03` must rely on this persistence boundary but aggiungere copertura per runtime browser-only e shell offline reale.
- `EP-07 / T-02` must validare che la persistenza gia' verificata qui resti disponibile anche dal deployment Android effettivo.
