# T-03 Verify derived views and export behavior

Status: `completed`

Objective: Confermare che `Appoggio`, `Risultati` ed export ODS rispettino le regole documentate senza dipendere da formule importate.

## Decision

La copertura di verifica per viste derivate ed export ODS e' presente nel repo e conferma che:

- `Appoggio` viene proiettato riga-per-riga dal dataset normalizzato;
- `Risultati` applica la regola documentata `x / -` e i conteggi finali;
- il writer ODS produce un workbook con i fogli richiesti nell'ordine richiesto;
- l'export fallisce esplicitamente quando manca un archivio attivo.

## Canonical Verification Coverage

### 1. Appoggio projection

- La suite deve verificare la proiezione `titolo`, `stato` riga-per-riga.
- La suite deve verificare la preservazione dell'ordine globale delle righe.
- La suite deve documentare la discrepanza del campione senza replicarla come regola.

### 2. Risultati classification

- La suite deve verificare una voce per ogni titolo unico non vuoto.
- La suite deve verificare la regola `x` se esiste almeno un `OK` oppure se tutte le occorrenze sono `Uscito fuori` e/o `Non reperibile`.
- La suite deve verificare i conteggi `Mancanti`, `Ok`, `Total`.

### 3. Workbook export structure

- La suite deve verificare che il writer produca un ODS zip valido.
- La suite deve verificare la presenza dei file minimi e l'ordine fogli `Lista`, `Risultati`, `Appoggio`.
- La suite deve verificare che `Lista` esportato resti parseabile e coerente con l'ordine operativo.

### 4. Export failure safety

- La suite deve verificare il failure esplicito quando non esiste un archivio attivo.
- La suite non deve accettare output parziali come export riuscito.

## Subtasks

- `ST-03.1` Verify Appoggio row-by-row projection behavior. Status: `completed`
- `ST-03.2` Verify Risultati classification and count logic. Status: `completed`
- `ST-03.3` Verify workbook export contains the required sheets. Status: `completed`
- `ST-03.4` Verify export failure handling does not report invalid files as success. Status: `completed`

## Subtask Details And Dependencies

### ST-03.1 Verify Appoggio row-by-row projection behavior

Definition:

- Verify one output row per normalized source row.
- Verify global row ordering and the known sample discrepancy treatment.

Depends on:

- `EP-04 / T-01`

Blocks:

- `ST-03.2`
- `ST-03.3`
- `ST-03.4`

Status:

- `completed`

Evidence:

- Verified by [tests/test_appoggio_view.py](/root/bed-project/tests/test_appoggio_view.py)

### ST-03.2 Verify Risultati classification and count logic

Definition:

- Verify the documented title-level `x / -` rule and final counts.
- Verify ordering and sample workbook expectations.

Depends on:

- `EP-04 / T-02`

Blocks:

- `ST-03.3`
- `ST-03.4`

Status:

- `completed`

Evidence:

- Verified by [tests/test_risultati_view.py](/root/bed-project/tests/test_risultati_view.py)

### ST-03.3 Verify workbook export contains the required sheets

Definition:

- Verify required ODS files, sheet order, and parseable reconstructed `Lista`.
- Verify static derived content is embedded through the export writer.

Depends on:

- `EP-04 / T-03`

Blocks:

- `ST-03.4`

Status:

- `completed`

Evidence:

- Verified by [tests/test_ods_export.py](/root/bed-project/tests/test_ods_export.py)

### ST-03.4 Verify export failure handling does not report invalid files as success

Definition:

- Verify explicit export rejection when no active archive exists.
- Keep failure handling aligned with the writer contract.

Depends on:

- `EP-04 / T-03`

Blocks:

- `none`

Status:

- `completed`

Evidence:

- Verified by [tests/test_ods_export.py](/root/bed-project/tests/test_ods_export.py)

## Downstream Task Impact

- `EP-05 / T-04` can assume restart/persistence verification starts from already-verified export and derived-view behavior.
