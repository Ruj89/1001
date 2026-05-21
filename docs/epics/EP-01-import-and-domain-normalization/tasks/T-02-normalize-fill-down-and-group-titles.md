# T-02 Normalize fill-down and group titles

Status: `completed`

Objective: Definire la normalizzazione minima che trasforma le raw rows ordinate di `Lista` in gruppi normalizzati per `Titolo`, pronti per la successiva costruzione dei record dominio MVP.

## Decision

Questo task consuma solo il boundary gia' fissato da `T-01`: una sequenza ordinata di raw rows di `Lista`, ognuna rappresentata da 5 posizioni colonna MVP preservate. La normalizzazione non ridefinisce parse ODS o shape dominio; applica solo fill-down del titolo e grouping per titolo normalizzato, producendo un boundary intermedio ordinato per la successiva costruzione dei record.

Il grouping MVP e' strettamente per match esatto del titolo dopo fill-down e trim esterno. Non sono ammessi consolidamento fuzzy, riordinamenti o deduplicazioni aggiuntive.

## Canonical Contract

### 1. Input boundary

- L'input di questo task e' esclusivamente `lista_rows` prodotto da `T-01`.
- Ogni raw row valida deve essere interpretabile come 5 posizioni colonna MVP:
  `titolo`, `piattaforma`, `edizione/versione`, `supporto`, `stato`.
- Questo task non puo' inferire colonne extra, recuperare dati da altri fogli o cambiare l'ordine sorgente delle righe.

### 2. Fill-down behavior

- Il fill-down si applica solo alla posizione `titolo` quando la prima colonna della raw row e' vuota.
- Le altre 4 posizioni non ricevono fill-down e restano i valori espliciti della stessa riga.
- Il titolo fill-down di una riga e' il titolo normalizzato non vuoto della riga precedente gia' accettata.
- Se la posizione `titolo` e' non vuota, il suo valore trimmato diventa il titolo effettivo della riga e resetta il contesto per le righe successive.

### 3. Grouping and normalized output boundary

- Ogni riga normalizzata produce una riga normalizzata con titolo effettivo esplicito e le stesse 4 posizioni non-title della riga sorgente.
- Le righe vengono raggruppate per match esatto del titolo effettivo dopo trim esterno.
- Ogni gruppo produce un solo gruppo normalizzato di titolo.
- L'ordine dei gruppi segue la prima occorrenza del titolo effettivo nell'input.
- L'ordine delle righe dentro ciascun gruppo segue rigorosamente l'ordine sorgente delle righe appartenenti al gruppo.
- La costruzione finale di `TitoloRecord` e `SottoVarianteRecord` resta esplicitamente separata finche' non e' chiusa la decisione sui campi non-title vuoti del campione reale.

### 4. Minimum failure behavior

- Se una raw row non ha esattamente 5 posizioni colonna, la normalizzazione fallisce.
- Se una riga ha `titolo` vuoto e non esiste un titolo precedente da propagare, la normalizzazione fallisce.
- La decisione finale su come trattare righe che, dopo fill-down del titolo, restano con uno tra `piattaforma`, `edizione/versione`, `supporto`, `stato` vuoto resta aperta in `ST-02.4`.
- In caso di failure, il task non deve produrre un dataset parziale accettato.

### 5. Scope rules

- Questo task non normalizza il vocabolario degli stati.
- Questo task non deduplica righe simili oltre al grouping per titolo esatto.
- Questo task non definisce ancora il formato di persistenza o la ricostruzione export di `Lista`.

## Subtasks

- `ST-02.1` Freeze the raw-row to normalized-row boundary. Status: `completed`
- `ST-02.2` Apply title fill-down only on blank title positions. Status: `completed`
- `ST-02.3` Group normalized rows by exact filled-down title and preserve source order. Status: `completed`
- `ST-02.4` Fail explicitly on rows that violate the minimum normalization contract. Status: `completed`

## Subtask Details And Dependencies

### ST-02.1 Freeze the raw-row to normalized-row boundary

Definition:

- Consume only ordered raw rows from `T-01`.
- Make the fixed 5-column boundary explicit for downstream normalization and tests.

Depends on:

- `EP-01 / T-01`

Blocks:

- `ST-02.2`
- `ST-02.3`
- `ST-02.4`

Status:

- `completed`

Evidence:

- Implemented in [src/lista_normalizer.py](/root/bed-project/src/lista_normalizer.py)
- Verified by [tests/test_lista_normalizer.py](/root/bed-project/tests/test_lista_normalizer.py)

### ST-02.2 Apply title fill-down only on blank title positions

Definition:

- Propagate the last accepted non-blank title only when the current title position is blank.
- Keep the other 4 positions row-local and explicit.

Depends on:

- `ST-02.1`

Blocks:

- `ST-02.3`
- `ST-02.4`
- `EP-04 / T-01`

Status:

- `completed`

Evidence:

- Implemented in [src/lista_normalizer.py](/root/bed-project/src/lista_normalizer.py)
- Verified by [tests/test_lista_normalizer.py](/root/bed-project/tests/test_lista_normalizer.py)

### ST-02.3 Group normalized rows by exact filled-down title and preserve source order

Definition:

- Build one ordered normalized title group per exact normalized effective title.
- Preserve title first-occurrence order and row source order within each group.

Depends on:

- `ST-02.2`
- `EP-01 / T-03`

Blocks:

- `EP-02 / T-01`
- `EP-02 / T-02`
- `EP-03 / T-02`
- `EP-04 / T-01`
- `EP-04 / T-03`

Status:

- `completed`

Evidence:

- Implemented in [src/lista_normalizer.py](/root/bed-project/src/lista_normalizer.py)
- Verified by [tests/test_lista_normalizer.py](/root/bed-project/tests/test_lista_normalizer.py)

### ST-02.4 Fail explicitly on rows that violate the minimum normalization contract

Definition:

- Reject rows with invalid 5-column shape, missing initial title context, or any other row condition that the final normalization contract declares unsupported.
- Prevent partial activation of a normalized dataset when normalization fails.

Depends on:

- `ST-02.1`
- `ST-02.2`
- `EP-01 / T-03`

Blocks:

- `EP-02 / T-02`
- `EP-03 / T-01`

Status:

- `completed`

Evidence:

- Implemented in [src/lista_normalizer.py](/root/bed-project/src/lista_normalizer.py)
- Verified by [tests/test_lista_normalizer.py](/root/bed-project/tests/test_lista_normalizer.py)

## Downstream Task Impact

- `EP-02 / T-01` must persist normalized `TitoloRecord` data, not spreadsheet rows.
- `EP-02 / T-02` must preserve the no-partial-activation rule when an import normalization error occurs.
- `EP-03 / T-02` and `EP-03 / T-03` must treat grouped titles as the primary browse/detail unit and rely on preserved sub-variant order.
- `EP-04 / T-01` and `EP-04 / T-03` must reconstruct `Lista`/`Appoggio` from this normalized ordering and fill-down contract.
