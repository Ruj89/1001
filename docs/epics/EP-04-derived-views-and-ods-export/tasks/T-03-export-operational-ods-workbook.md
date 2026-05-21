# T-03 Export operational ODS workbook

Status: `completed`

Objective: Generare un file ODS in uscita con fogli `Lista`, `Appoggio` e `Risultati` operativamente coerenti con il perimetro MVP definito nei documenti.

## Decision

Questo task implementa il writer ODS MVP come workbook statico materializzato, coerente con la strategia di fedelta' gia' approvata. L'export non tenta replica completa di formule o stili del campione; produce invece un ODS valido con:

- fogli `Lista`, `Risultati`, `Appoggio` nell'ordine richiesto;
- righe `Lista` ricostruite dal dataset locale attivo con ordine operativo preservato;
- contenuti `Appoggio` e `Risultati` derivati dal codice applicativo come valori statici;
- failure esplicito quando non esiste archivio attivo o il workbook non puo' essere scritto.

## Canonical Contract

### 1. Workbook output

- Il writer deve produrre un archivio ODS zip valido.
- Il workbook deve contenere i file minimi necessari per l'apertura operativa:
  - `mimetype`
  - `META-INF/manifest.xml`
  - `content.xml`
  - `styles.xml`
  - `meta.xml`
- `content.xml` deve esporre i fogli nell'ordine `Lista`, `Risultati`, `Appoggio`.

### 2. `Lista` reconstruction

- Il writer deve ricostruire `Lista` a partire dai `TitoloRecord` attivi.
- Per ogni titolo, la prima sotto-variante deve emettere il titolo esplicito in colonna 1.
- Le sotto-varianti successive dello stesso titolo devono emettere colonna titolo vuota, preservando il comportamento operativo di fill-down.
- Le altre quattro colonne devono riflettere `piattaforma`, `edizione/versione`, `supporto`, `stato` nell'ordine canonico.

### 3. Derived sheet insertion

- `Appoggio` deve essere esportato come proiezione statica `titolo`, `stato` riga-per-riga.
- `Risultati` deve essere esportato come coppie `titolo`, `x/-` seguite dai conteggi finali `Mancanti`, `Ok`, `Total`.
- I contenuti derivati devono essere costruiti dal codice applicativo, non copiati dal workbook campione.

### 4. Failure behavior

- Se non esiste archivio attivo, l'export deve fallire esplicitamente.
- Se la scrittura del workbook non riesce, il task deve fallire esplicitamente senza presentare output parziale come successo.

### 5. Scope rules

- Questo task non replica formule spreadsheet.
- Questo task non replica stili avanzati, larghezze colonna o layout binario del campione.
- Questo task non implementa ancora il trigger UI di download/share.

## Subtasks

- `ST-03.1` Build workbook output containing the required sheets. Status: `completed`
- `ST-03.2` Map local archive data back into `Lista` with preserved order. Status: `completed`
- `ST-03.3` Insert generated `Appoggio` and `Risultati` into the workbook. Status: `completed`
- `ST-03.4` Surface export failures without presenting invalid output as success. Status: `completed`

## Subtask Details And Dependencies

### ST-03.1 Build workbook output containing the required sheets

Definition:

- Produce a valid ODS zip with the minimum operational files and three required sheets.
- Keep sheet order aligned with the approved export strategy.

Depends on:

- `EP-04 / T-04`

Blocks:

- `ST-03.2`
- `ST-03.3`
- `ST-03.4`
- `EP-05 / T-03`

Status:

- `completed`

Evidence:

- Implemented in [src/ods_export.py](/root/bed-project/src/ods_export.py)
- Verified by [tests/test_ods_export.py](/root/bed-project/tests/test_ods_export.py)

### ST-03.2 Map local archive data back into `Lista` with preserved order

Definition:

- Rebuild operational `Lista` rows from active local archive records.
- Preserve title order, sub-variant order, and blank-title continuation rows.

Depends on:

- `EP-02 / T-03`
- `EP-04 / T-04`

Blocks:

- `ST-03.3`
- `EP-05 / T-03`

Status:

- `completed`

Evidence:

- Implemented in [src/ods_export.py](/root/bed-project/src/ods_export.py)
- Verified by [tests/test_ods_export.py](/root/bed-project/tests/test_ods_export.py)

### ST-03.3 Insert generated `Appoggio` and `Risultati` into the workbook

Definition:

- Materialize derived `Appoggio` and `Risultati` rows in the workbook as static values.
- Consume only the app-level derivation logic already implemented upstream.

Depends on:

- `EP-04 / T-01`
- `EP-04 / T-02`
- `EP-04 / T-04`

Blocks:

- `ST-03.4`
- `EP-05 / T-03`

Status:

- `completed`

Evidence:

- Implemented in [src/ods_export.py](/root/bed-project/src/ods_export.py)
- Verified by [tests/test_ods_export.py](/root/bed-project/tests/test_ods_export.py)

### ST-03.4 Surface export failures without presenting invalid output as success

Definition:

- Reject export when no active archive exists.
- Reject export when workbook bytes cannot be written safely.

Depends on:

- `ST-03.1`
- `ST-03.2`
- `ST-03.3`

Blocks:

- `EP-05 / T-03`

Status:

- `completed`

Evidence:

- Implemented in [src/ods_export.py](/root/bed-project/src/ods_export.py)
- Verified by [tests/test_ods_export.py](/root/bed-project/tests/test_ods_export.py)

## Downstream Task Impact

- `EP-05 / T-03` must validate workbook structure, sheet order, reconstructed `Lista`, and static derived values against this writer contract.
