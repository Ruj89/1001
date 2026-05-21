# T-02 Generate Risultati derived view

Status: `completed`

Objective: Definire il generatore MVP di `Risultati` come output derivato dal dataset locale, non come sorgente di import.

## Decision

Questo task fissa il primo slice eseguibile di `Risultati`: un riepilogo per titolo unico non vuoto derivato dalle righe `Lista` gia' parseate e normalizzate. Il task consuma il boundary gia' stabilito da `EP-01 / T-01` e `EP-01 / T-02` e non introduce dipendenze da fogli secondari, formule spreadsheet o strutture importate da `Risultati`/`Appoggio`.

Il contratto MVP resta intenzionalmente stretto: per ogni titolo conta solo l'insieme degli stati osservati nelle righe normalizzate di quel titolo. Le colonne non-title diverse da `stato` non partecipano alla classificazione `x / -`.

## Canonical Contract

### 1. Input boundary

- L'input di questo task e' il dataset derivato da `Lista`, gia' parseato e normalizzato secondo `EP-01 / T-01` e `EP-01 / T-02`.
- `Risultati` e' solo output derivato; non puo' essere usato come sorgente di import, recovery o verita' applicativa.
- Il generatore deve consumare i gruppi titolo normalizzati direttamente dal dataset locale, non dal foglio `Risultati` esistente e non da `Appoggio`.

### 2. MVP aggregation rule

- Ogni titolo unico non vuoto del dataset normalizzato produce esattamente una voce `Risultati`.
- Il titolo della voce `Risultati` e' il titolo effettivo del gruppo normalizzato dopo fill-down gia' risolto a monte.
- Una voce vale `x` se esiste almeno una riga del titolo con `stato = OK`.
- Una voce vale `x` anche se nessuna riga e' `OK` ma tutte le righe del titolo hanno `stato` appartenente all'insieme `{Uscito fuori, Non reperibile}`.
- Una voce vale `-` in tutti gli altri casi.
- I conteggi finali MVP sono:
  `Mancanti = numero di titoli con valore -`
  `Ok = numero di titoli con valore x`
  `Total = Mancanti + Ok`

### 3. Scope rules

- Questo task non importa il foglio `Risultati` dal workbook sorgente.
- Questo task non usa formule spreadsheet come motore logico interno.
- Questo task non deduce metriche aggiuntive oltre alla classificazione per titolo e ai tre conteggi finali documentati.
- Questo task non definisce ancora layout ODS, formule export o colonne ulteriori oltre al contenuto minimo necessario per `titolo` e classificazione `x / -`.

### 4. Failure behavior

- Se un gruppo normalizzato non espone un titolo effettivo non vuoto, la generazione fallisce esplicitamente.
- Se una riga usata per classificare un titolo non espone uno `stato` valorizzato, la generazione fallisce esplicitamente.
- In caso di failure, il task non deve produrre una vista `Risultati` parziale accettata.

## Subtasks

- `ST-02.1` Freeze the normalized-title-group to Risultati-entry boundary. Status: `completed`
- `ST-02.2` Classify each title with the documented `x / -` rule. Status: `completed`
- `ST-02.3` Compute the MVP final counts from classified titles. Status: `completed`
- `ST-02.4` Expose failure behavior for invalid normalized input. Status: `completed`

## Subtask Details And Dependencies

### ST-02.1 Freeze the normalized-title-group to Risultati-entry boundary

Definition:

- Consume only normalized `Lista` title groups produced by the accepted import pipeline.
- Make `Risultati` explicitly downstream of parse and fill-down, never a parallel import source and never a transformation of `Appoggio`.

Depends on:

- `EP-01 / T-01`
- `EP-01 / T-02`

Blocks:

- `ST-02.2`
- `ST-02.3`
- `ST-02.4`
- `EP-04 / T-03`

Status:

- `completed`

Evidence:

- Implemented in [src/risultati_view.py](/root/bed-project/src/risultati_view.py)
- Verified by [tests/test_risultati_view.py](/root/bed-project/tests/test_risultati_view.py)

### ST-02.2 Classify each title with the documented `x / -` rule

Definition:

- Evaluate each normalized title group only from its observed `stato` values.
- Emit `x` for any title with at least one `OK`, or with all rows limited to `Uscito fuori` and/or `Non reperibile`.
- Emit `-` for every other title.

Depends on:

- `ST-02.1`

Blocks:

- `ST-02.3`
- `EP-04 / T-03`

Status:

- `completed`

Evidence:

- Implemented in [src/risultati_view.py](/root/bed-project/src/risultati_view.py)
- Verified by [tests/test_risultati_view.py](/root/bed-project/tests/test_risultati_view.py)

### ST-02.3 Compute the MVP final counts from classified titles

Definition:

- Derive `Mancanti`, `Ok` and `Total` only from the per-title `x / -` classification.
- Keep the counting contract limited to the documented three totals.

Depends on:

- `ST-02.2`

Blocks:

- `EP-04 / T-03`
- `EP-04 / T-04`

Status:

- `completed`

Evidence:

- Implemented in [src/risultati_view.py](/root/bed-project/src/risultati_view.py)
- Verified by [tests/test_risultati_view.py](/root/bed-project/tests/test_risultati_view.py)

### ST-02.4 Expose failure behavior for invalid normalized input

Definition:

- Fail explicitly when normalized groups do not satisfy the minimum title-and-stato contract required for classification.
- Prevent partial acceptance of a derived `Risultati` dataset.

Depends on:

- `ST-02.1`

Blocks:

- `EP-04 / T-03`

Status:

- `completed`

Evidence:

- Implemented in [src/risultati_view.py](/root/bed-project/src/risultati_view.py)
- Verified by [tests/test_risultati_view.py](/root/bed-project/tests/test_risultati_view.py)

## Downstream Task Impact

- `EP-04 / T-03` must consume this task as the canonical content contract for the exported `Risultati` sheet.
- `EP-04 / T-04` must treat layout, formulas and any additional sheet fidelity as a separate decision, not as already-approved `Risultati` MVP scope.
- Any later QA or export validation must verify `Risultati` from normalized `Lista` data, not from imported secondary sheets.
