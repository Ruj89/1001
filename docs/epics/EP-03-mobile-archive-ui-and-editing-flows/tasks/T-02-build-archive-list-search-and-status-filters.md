# T-02 Build archive list search and status filters

Status: `completed`

Objective: Definire il contratto eseguibile per elenco titoli, ricerca locale e filtri stato mobile-first, compatibili sia con il vocabolario reale degli stati sia con eventuali valori importati mancanti.

## Decision

Questo task definisce la superficie primaria di consultazione dell'archivio dopo la dashboard. L'unita' di browse resta `Titolo`, non la riga spreadsheet, e la lista deve funzionare su dati locali preservando il modello normalizzato e la realta' dei valori importati.

La ricerca deve essere solo per titolo. Il filtro stato deve coprire tutti i valori espliciti presenti nell'archivio e non deve rendere invisibili i record con stato importato mancante. Gli stati frequenti devono essere piu' veloci da selezionare, ma quelli rari non possono essere nascosti dal contratto MVP.

## Canonical Contract

### 1. List rendering boundary

- La lista deve renderizzare record `Titolo`, non sotto-varianti sciolte.
- La lista deve essere fruibile su viewport phone-sized come superficie primaria di browse.
- L'accesso al dettaglio titolo deve partire da un elemento di lista coerente con la navigazione definita in `EP-03 / T-01`.
- La lista non deve richiedere rete o backend.

### 2. Title search behavior

- La ricerca deve interrogare solo i titoli locali.
- Il comportamento deve essere coerente tra ricerca avviata dalla dashboard e ricerca eseguita nella vista lista.
- Nessun risultato deve produrre uno stato vuoto chiaro e facilmente reversibile.

### 3. Status filtering behavior

- Il sistema deve supportare tutti i valori di stato espliciti presenti nell'archivio locale.
- Il sistema deve trattare i valori di stato importati vuoti come caso distinto e non come record invisibili.
- Il contratto di filtro puo' esporre il caso di stato mancante come opzione esplicita oppure includerlo in una modalita' equivalente chiaramente nominata.
- L'applicazione dei filtri deve restringere la lista ai titoli che contengono almeno una sotto-variante compatibile con i criteri selezionati.

### 4. Fast access to common statuses

- Gli stati piu' frequenti devono essere piu' rapidi da attivare rispetto agli stati rari.
- L'ottimizzazione per gli stati frequenti non puo' rimuovere, nascondere o impedire la selezione del set completo.
- Il contratto non impone ancora una UI specifica, ma impone il comportamento.

### 5. Scope rules

- Questo task non ridefinisce il vocabolario degli stati.
- Questo task non richiede deduplicazione o consolidamento automatico delle sotto-varianti.
- Questo task non definisce ancora il layout completo del dettaglio titolo.

## Subtasks

- `ST-02.1` Render the title list for phone-sized viewports. Status: `completed`
- `ST-02.2` Implement local title-based search across the archive. Status: `completed`
- `ST-02.3` Implement status filtering for the full explicit status set and missing imported status values. Status: `completed`
- `ST-02.4` Provide faster access to the most common statuses without hiding rare ones. Status: `completed`

## Subtask Details And Dependencies

### ST-02.1 Render the title list for phone-sized viewports

Definition:

- Create the browse surface that renders `Titolo` records for mobile use.
- Keep list-to-detail navigation coherent with the app shell and dashboard routes.

Depends on:

- `EP-03 / T-01`
- `EP-02 / T-01`

Blocks:

- `ST-02.2`
- `ST-02.3`
- `ST-02.4`
- `EP-03 / T-03`
- `EP-05 / T-02`

### ST-02.2 Implement local title-based search across the archive

Definition:

- Support search by title against the locally active archive.
- Keep search entry coherent whether started on dashboard or inside the list view.

Depends on:

- `ST-02.1`

Blocks:

- `EP-05 / T-02`

### ST-02.3 Implement status filtering for the full explicit status set and missing imported status values

Definition:

- Support the real archive status vocabulary without trimming it down to a curated subset.
- Keep imported records with blank status discoverable through explicit filter behavior.

Depends on:

- `ST-02.1`
- `EP-01 / T-03`

Blocks:

- `ST-02.4`
- `EP-05 / T-02`

### ST-02.4 Provide faster access to the most common statuses without hiding rare ones

Definition:

- Make common statuses faster to reach than long-tail statuses.
- Preserve access to the complete set of explicit and missing-status filter options.

Depends on:

- `ST-02.3`

Blocks:

- `EP-05 / T-02`

## Downstream Task Impact

- `EP-03 / T-03` must open detail from a title-level browse surface defined here.
- `EP-03 / T-04` must return newly created records into the list/search/filter contexts defined here.
- `EP-05 / T-02` must verify both full-status filtering and missing-status discoverability on Android-sized viewports.
