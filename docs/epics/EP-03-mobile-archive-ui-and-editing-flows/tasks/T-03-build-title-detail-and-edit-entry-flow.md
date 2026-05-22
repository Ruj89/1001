# T-03 Build title detail and edit entry flow

Status: `completed`

Objective: Definire il contratto della vista dettaglio read-first e dell'ingresso esplicito in modifica, preservando l'ordine delle sotto-varianti e la leggibilita' dei valori legacy importati mancanti.

## Decision

Questo task definisce come il modello `Titolo + Sotto-varianti` diventa leggibile sul telefono prima ancora di essere modificabile. Il dettaglio deve ridurre il carico cognitivo del foglio spreadsheet rendendo esplicito il record logico, l'ordine delle sotto-varianti e lo stato di ciascun campo rilevante.

La vista e' read-first. L'editing parte solo da azione intenzionale. I campi importati legacy mancanti devono essere mostrati in modo esplicito e comprensibile, non inventati o nascosti. Il task definisce l'ingresso nel flusso di modifica, non l'intero contratto di salvataggio del form, demandato al successivo `EP-03 / T-05`.

## Canonical Contract

### 1. Detail baseline

- Il dettaglio deve essere centrato sul record `Titolo`.
- Il titolo deve essere mostrato come identita' primaria del record.
- Le sotto-varianti devono essere mostrate in ordine sorgente preservato.
- Il dettaglio non deve presentarsi come griglia spreadsheet.

### 2. Sub-variant field presentation

- Ogni sotto-variante deve esporre almeno:
  - `piattaforma`;
  - `edizione/versione`;
  - `supporto`;
  - `stato`.
- Se uno di questi valori e' vuoto per dati importati legacy, il dettaglio deve renderlo come valore mancante esplicito e non come dato implicito o inventato.
- Il layout deve restare scan-friendly su viewport phone-sized.

### 3. Edit entry behavior

- L'utente deve entrare in modifica solo tramite azione esplicita dal dettaglio.
- Finche' l'utente non entra in modifica, il dettaglio resta in modalita' read-first.
- L'ingresso in modifica deve mantenere contesto chiaro sul titolo e sulla sotto-variante interessata.

### 4. Unavailable record behavior

- Se un record non e' piu' disponibile quando l'utente prova ad aprirlo o tornarci, il sistema deve mostrare un messaggio coerente e riportare l'utente verso una vista consistente.
- Il task non richiede ancora una strategia di recovery piu' ampia oltre la coerenza di navigazione.

### 5. Scope rules

- Questo task non definisce ancora il contratto completo del form di update persistito, demandato a `EP-03 / T-05` sopra il boundary di scrittura definito in `EP-02 / T-03`.
- Questo task non impone ancora il layout finale del form di editing.
- Questo task non puo' assumere che tutti i campi importati siano sempre valorizzati.

## Subtasks

- `ST-03.1` Render title identity and ordered sub-variants in a read-first detail surface. Status: `completed`
- `ST-03.2` Show the 4 archive sub-variant fields in a scan-friendly way, including explicit missing imported values. Status: `completed`
- `ST-03.3` Gate editing behind an explicit user action from the detail view. Status: `completed`
- `ST-03.4` Keep navigation coherent when a record becomes unavailable. Status: `completed`

## Subtask Details And Dependencies

### ST-03.1 Render title identity and ordered sub-variants in a read-first detail surface

Definition:

- Render the logical title record and its ordered sub-variants on mobile.
- Preserve the normalized title-first mental model instead of falling back to row-based spreadsheet reading.

Depends on:

- `EP-03 / T-01`
- `EP-03 / T-02`
- `EP-01 / T-03`

Blocks:

- `ST-03.2`
- `ST-03.3`
- `ST-03.4`
- `EP-05 / T-02`

### ST-03.2 Show the 4 archive sub-variant fields in a scan-friendly way, including explicit missing imported values

Definition:

- Display all four archive fields for every sub-variant.
- Make blank imported legacy values visible as missing values instead of treating them as rendering errors.

Depends on:

- `ST-03.1`
- `EP-01 / T-03`

Blocks:

- `ST-03.3`
- `EP-05 / T-02`

### ST-03.3 Gate editing behind an explicit user action from the detail view

Definition:

- Keep the detail surface read-first until the user explicitly chooses to edit.
- Provide a coherent handoff into the downstream edit flow backed by local persistence.

Depends on:

- `ST-03.1`
- `ST-03.2`
- `EP-02 / T-03`

Blocks:

- `EP-05 / T-02`

### ST-03.4 Keep navigation coherent when a record becomes unavailable

Definition:

- Handle missing or invalidated detail targets without leaving the user in a broken route state.
- Return the user to a consistent browse surface when the target record cannot be shown.

Depends on:

- `ST-03.1`
- `EP-03 / T-02`

Blocks:

- `EP-05 / T-02`

## Downstream Task Impact

- `EP-03 / T-05` must turn this explicit edit entry into a runnable persisted update flow without collapsing the read-first baseline defined here.
- `EP-03 / T-04` must return newly created records into a detail surface consistent with this task.
- `EP-05 / T-02` must verify read-first behavior, explicit edit entry, and rendering of missing imported values on Android-sized devices.
