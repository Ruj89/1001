# T-04 Build create title flow

Status: `accepted`

Objective: Definire il flusso di creazione di un nuovo titolo dal prodotto, con validazione minima coerente con il boundary di scrittura locale e ritorno immediato ai contesti di consultazione.

## Decision

Questo task copre la creazione di nuovi record dall'app, non il recupero di dati legacy incompleti dal file importato. Per questo motivo la creazione resta piu' stretta del contratto di import: un nuovo titolo richiede almeno una sotto-variante iniziale completa.

Il flusso deve partire dalla UI primaria, validare i campi necessari prima della persistenza e rendere subito il nuovo record disponibile in lista, ricerca e dettaglio. La creazione non deve richiedere passaggi su ODS o su una vista spreadsheet-like.

## Canonical Contract

### 1. Entry point and flow start

- Il flusso di creazione deve essere raggiungibile dalla UI primaria definita in `EP-03 / T-01`.
- L'utente deve poter avviare la creazione senza passare dal file ODS.
- Il task non richiede ancora una strategia di bulk-create o creazione multi-record.

### 2. Minimum create payload

- La creazione minima richiede:
  - `titolo` non vuoto;
  - una prima sotto-variante con `piattaforma`, `edizione/versione`, `supporto`, `stato` non vuoti.
- I valori importati legacy mancanti non abbassano i requisiti del create flow.
- La creazione non deve produrre un record parzialmente salvato.

### 3. Validation and persistence handoff

- La validazione deve avvenire prima della persistenza locale.
- Il flusso di creazione deve usare il boundary di scrittura definito in `EP-02 / T-03`.
- Gli errori di validazione devono bloccare il salvataggio e lasciare il record non creato.

### 4. Return to browse contexts

- Dopo un salvataggio riuscito, il nuovo record deve risultare disponibile in lista, ricerca e dettaglio senza ulteriori passaggi manuali.
- Il ritorno puo' essere verso dettaglio o altro contesto coerente, ma il record deve risultare immediatamente raggiungibile.

### 5. Scope rules

- Questo task non definisce ancora la creazione di sotto-varianti aggiuntive su un titolo gia' esistente.
- Questo task non riduce i requisiti minimi della prima sotto-variante per allinearsi ai casi legacy importati.
- Questo task non ridefinisce la navigazione primaria oltre ai punti di ingresso/uscita del create flow.

## Subtasks

- `ST-04.1` Provide a create-title entry point from the primary UI. Status: `accepted`
- `ST-04.2` Capture the minimum required fields for the initial sub-variant. Status: `accepted`
- `ST-04.3` Validate the create flow before local persistence. Status: `accepted`
- `ST-04.4` Return the new record to list, search, and detail contexts. Status: `accepted`

## Subtask Details And Dependencies

### ST-04.1 Provide a create-title entry point from the primary UI

Definition:

- Make create-title reachable from the dashboard or equivalent primary navigation surface.
- Keep the flow coherent with the app shell baseline.

Depends on:

- `EP-03 / T-01`

Blocks:

- `ST-04.2`
- `ST-04.3`
- `ST-04.4`
- `EP-05 / T-02`

### ST-04.2 Capture the minimum required fields for the initial sub-variant

Definition:

- Collect title plus one complete initial sub-variant.
- Keep the create contract stricter than the imported-legacy contract when fields are user-authored.

Depends on:

- `ST-04.1`
- `EP-01 / T-03`

Blocks:

- `ST-04.3`
- `EP-05 / T-02`

### ST-04.3 Validate the create flow before local persistence

Definition:

- Prevent create from committing incomplete or duplicate records.
- Hand off only valid create payloads to the local persistence boundary.

Depends on:

- `ST-04.2`
- `EP-02 / T-03`

Blocks:

- `ST-04.4`
- `EP-05 / T-02`

### ST-04.4 Return the new record to list, search, and detail contexts

Definition:

- Ensure the new record is immediately discoverable after save.
- Keep create completion coherent with the list/search/detail flows defined in `EP-03`.

Depends on:

- `ST-04.3`
- `EP-03 / T-02`
- `EP-03 / T-03`

Blocks:

- `EP-05 / T-02`

## Downstream Task Impact

- `EP-05 / T-02` must verify that creation works on Android-sized viewports and that the new record becomes reachable from list, search, and detail without spreadsheet fallback.
