# T-01 Generate Appoggio derived view

Status: `completed`

Objective: Definire il generatore MVP di `Appoggio` come output derivato dal dataset locale, non come sorgente di import.

## Decision

Questo task fissa il primo slice eseguibile di `Appoggio`: una proiezione riga-per-riga delle righe `Lista` normalizzate, con `titolo` effettivo e `stato` della stessa riga sorgente. Il task consuma il boundary gia' stabilito da parse e normalizzazione e non ridefinisce import, grouping dominio o logiche spreadsheet.

Il campione osservato contiene una discrepanza nota: `Lista` ha 1571 righe non vuote, mentre `Appoggio` ne mostra 1569; mancano due righe `Final Fantasy X` con stato `Da comprare`. Questa anomalia va documentata come mismatch del campione, non come regola da replicare nel primo rilascio. Il contratto MVP richiede la proiezione completa riga-per-riga.

## Canonical Contract

### 1. Input boundary

- L'input di questo task e' il dataset derivato da `Lista`, gia' parseato e normalizzato secondo `EP-01 / T-01` e `EP-01 / T-02`.
- Il generatore deve preservare l'ordine sorgente delle righe normalizzate.
- `Appoggio` e' solo output derivato; non puo' essere usato come sorgente di import, recovery o verita' applicativa.

### 2. MVP projection rule

- Ogni riga normalizzata di `Lista` produce esattamente una riga `Appoggio`.
- La colonna `titolo` di `Appoggio` e' il titolo effettivo della riga normalizzata, gia' risolto tramite fill-down a monte.
- La colonna `stato` di `Appoggio` e' il valore `stato` della stessa riga sorgente.
- Il generatore MVP non sintetizza, aggrega o deduplica per titolo.

### 3. Scope rules

- Questo task non importa `Appoggio` dal workbook sorgente.
- Questo task non replica formule spreadsheet come motore logico interno.
- Questo task non richiede di riprodurre omissioni o difetti del file campione.
- Questo task non definisce ancora il layout finale ODS del foglio esportato; definisce solo il contenuto derivato da emettere.

### 4. Compatibility note

- Nel campione `.local/1001.ods`, la proiezione attesa da `Lista` e' 1571 righe non vuote.
- Nel campione osservato, `Appoggio` contiene 1569 righe non vuote.
- Le due righe mancanti riguardano `Final Fantasy X` con stato `Da comprare`.
- Finche' non esiste una decisione esplicita diversa, l'implementazione deve seguire la regola MVP completa `1 riga Lista -> 1 riga Appoggio`.

### 5. Failure behavior

- Se una riga normalizzata non espone i campi minimi richiesti per `titolo` effettivo e `stato`, la generazione fallisce esplicitamente.
- In caso di failure, il task non deve produrre una vista `Appoggio` parziale accettata.

## Subtasks

- `ST-01.1` Freeze the normalized-row to Appoggio-row boundary. Status: `completed`
- `ST-01.2` Project effective title and source-row stato row by row. Status: `completed`
- `ST-01.3` Record the sample mismatch without adopting it as MVP behavior. Status: `completed`
- `ST-01.4` Expose failure behavior for invalid normalized input. Status: `completed`

## Subtask Details And Dependencies

### ST-01.1 Freeze the normalized-row to Appoggio-row boundary

Definition:

- Consume only normalized `Lista` rows produced by the accepted import pipeline.
- Make `Appoggio` explicitly downstream of parse and fill-down, never a parallel import source.

Depends on:

- `EP-01 / T-01`
- `EP-01 / T-02`

Blocks:

- `ST-01.2`
- `ST-01.3`
- `ST-01.4`
- `EP-04 / T-03`
- `EP-05 / T-03`

Status:

- `completed`

Evidence:

- Implemented in [src/appoggio_view.py](/root/bed-project/src/appoggio_view.py)
- Verified by [tests/test_appoggio_view.py](/root/bed-project/tests/test_appoggio_view.py)

### ST-01.2 Project effective title and source-row stato row by row

Definition:

- Emit one derived row per normalized source row, preserving source order.
- Copy only the effective title and the source-row `stato` into the MVP `Appoggio` content boundary.

Depends on:

- `ST-01.1`

Blocks:

- `EP-04 / T-03`
- `EP-05 / T-03`

Status:

- `completed`

Evidence:

- Implemented in [src/appoggio_view.py](/root/bed-project/src/appoggio_view.py)
- Verified by [tests/test_appoggio_view.py](/root/bed-project/tests/test_appoggio_view.py)

### ST-01.3 Record the sample mismatch without adopting it as MVP behavior

Definition:

- Preserve the known discrepancy between the sample workbook and the documented projection rule as a compatibility note.
- Prevent downstream work from treating the missing `Final Fantasy X / Da comprare` rows as normative export logic.

Depends on:

- `ST-01.1`

Blocks:

- `EP-04 / T-04`
- `EP-05 / T-03`

Status:

- `completed`

Evidence:

- Documented in this task contract and verified by [tests/test_appoggio_view.py](/root/bed-project/tests/test_appoggio_view.py)

### ST-01.4 Expose failure behavior for invalid normalized input

Definition:

- Fail explicitly when normalized rows do not satisfy the minimum projection contract.
- Prevent partial acceptance of a derived `Appoggio` dataset.

Depends on:

- `ST-01.1`

Blocks:

- `EP-04 / T-03`
- `EP-05 / T-03`

Status:

- `completed`

Evidence:

- Implemented in [src/appoggio_view.py](/root/bed-project/src/appoggio_view.py)
- Verified by [tests/test_appoggio_view.py](/root/bed-project/tests/test_appoggio_view.py)

## Downstream Task Impact

- `EP-04 / T-03` must consume this task as the canonical content contract for the exported `Appoggio` sheet.
- `EP-04 / T-04` must treat the 1569-vs-1571 mismatch as a fidelity decision point, not as already-approved MVP behavior.
- `EP-05 / T-03` must verify row-for-row projection from normalized `Lista` data and separately document the known sample discrepancy.
