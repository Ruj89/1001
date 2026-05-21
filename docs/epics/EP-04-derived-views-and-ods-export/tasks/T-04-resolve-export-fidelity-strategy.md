# T-04 Resolve export fidelity strategy

Status: `completed`

Objective: Chiudere la decisione tecnica residua su fedelta' dell'ODS esportato rispetto a layout, formule ricostruite e valori statici materializzati.

## Decision

Per l'MVP l'export ODS deve essere `operationally faithful`, non formula-faithful. La decisione chiusa da questo task e':

- preservare i fogli richiesti e il loro ordine operativo;
- preservare l'ordine dei record e la logica derivata documentata;
- privilegiare valori statici materializzati per `Appoggio` e `Risultati`, non formule ricostruite;
- mantenere un layout minimale leggibile e vicino al campione, senza bloccare il writer sull'obiettivo di replica cella-per-cella.

## Canonical Contract

### 1. Minimum acceptable operational fidelity

- Il workbook esportato deve contenere i fogli `Lista`, `Risultati` e `Appoggio`.
- L'ordine dei fogli deve restare `Lista`, `Risultati`, `Appoggio`.
- `Lista` deve riflettere il dataset locale attivo con ordine operativo coerente alle sotto-varianti persistite.
- `Risultati` e `Appoggio` devono riflettere le regole derivate gia' documentate e testate nel codice.
- L'output deve essere apribile e leggibile come ODS operativo senza rete o dipendenze esterne.

### 2. Formulas vs static values

- Per l'MVP `Appoggio` e `Risultati` vengono esportati come valori statici materializzati.
- Il writer non deve ricostruire formule spreadsheet per ottenere il comportamento derivato.
- La logica autorevole resta nel codice applicativo, non nel foglio esportato.

### 3. Layout constraints

- Il writer deve preservare almeno nomi foglio, ordine fogli, header essenziali e ordine righe operativo.
- Non e' richiesto replicare perfettamente stili, formule, larghezze colonna o difetti accidentali del campione.
- La vicinanza al campione e' valutata sul piano d'uso operativo, non sulla parita' binaria del file.

### 4. Writer input contract

- Il writer finale deve consumare dataset locale attivo, proiezione `Appoggio` e vista `Risultati` generate dal codice.
- Il writer deve fallire esplicitamente se uno di questi input non e' costruibile secondo i contratti upstream.

### 5. Scope rules

- Questo task non implementa ancora il writer ODS.
- Questo task non riapre le regole di classificazione di `Risultati` o la proiezione di `Appoggio`.
- Questo task non promuove replica completa di formule o layout avanzato a requisito MVP.

## Subtasks

- `ST-04.1` Define the minimum acceptable operational fidelity for MVP export. Status: `completed`
- `ST-04.2` Decide whether derived sheets require formulas or static values. Status: `completed`
- `ST-04.3` Identify any layout constraints that must be preserved in the workbook. Status: `completed`
- `ST-04.4` Publish the export decision as input for the final writer task. Status: `completed`

## Subtask Details And Dependencies

### ST-04.1 Define the minimum acceptable operational fidelity for MVP export

Definition:

- Freeze what `quasi identico` means for MVP in operational terms.
- Protect the writer task from silently expanding into full spreadsheet replication.

Depends on:

- `docs/tech-feasibility.md`
- `docs/requirements-analysis.md`

Blocks:

- `ST-04.2`
- `ST-04.3`
- `ST-04.4`
- `EP-04 / T-03`

Status:

- `completed`

### ST-04.2 Decide whether derived sheets require formulas or static values

Definition:

- Choose whether `Appoggio` and `Risultati` are emitted as formulas or already-computed values.
- Keep code-generated derivations as the source of truth for MVP.

Depends on:

- `ST-04.1`
- `EP-04 / T-01`
- `EP-04 / T-02`

Blocks:

- `ST-04.4`
- `EP-04 / T-03`

Status:

- `completed`

### ST-04.3 Identify any layout constraints that must be preserved in the workbook

Definition:

- Freeze the minimum layout obligations for names, order, and readability.
- Keep advanced visual fidelity out of MVP unless it changes operational use.

Depends on:

- `ST-04.1`

Blocks:

- `ST-04.4`
- `EP-04 / T-03`

Status:

- `completed`

### ST-04.4 Publish the export decision as input for the final writer task

Definition:

- Make the writer contract explicit for the final workbook task.
- Ensure `EP-04 / T-03` can be implemented without reopening fidelity strategy.

Depends on:

- `ST-04.1`
- `ST-04.2`
- `ST-04.3`

Blocks:

- `EP-04 / T-03`
- `EP-05 / T-03`

Status:

- `completed`

## Downstream Task Impact

- `EP-04 / T-03` must emit static materialized values for `Appoggio` and `Risultati`.
- `EP-04 / T-03` must preserve sheet order and operational row order without chasing formula parity.
- `EP-05 / T-03` must validate exported sheet presence, order, and derived values against this decision.
