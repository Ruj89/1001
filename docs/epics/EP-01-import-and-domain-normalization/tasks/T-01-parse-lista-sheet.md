# T-01 Parse Lista sheet

Status: `completed`

Objective: Definire il confine minimo di parsing ODS che legge `Lista` e produce righe grezze parseabili per la normalizzazione successiva, senza introdurre ancora fill-down o grouping dominio.

## Decision

Questo task fissa solo il boundary di parse MVP per l'import ODS. L'input e' un file ODS scelto dall'utente; l'output e' una sequenza ordinata di righe non vuote del primo foglio operativo `Lista`, con 5 posizioni colonna preservate, celle testuali trimmate e trailing blank rimossi.

Il task non normalizza titoli vuoti, non raggruppa record logici e non mappa ancora al modello `Titolo + Sotto-varianti`. Qualsiasi errore di lettura o di risoluzione del foglio deve interrompere il parse senza attivare dati parziali.

## Canonical Contract

### 1. Parse boundary

- Il parser accetta come input un file ODS locale selezionato esplicitamente.
- Il parser deve risolvere il primo foglio operativo come `Lista`.
- Il parser deve leggere `Lista` come sola sorgente di import MVP.
- Il parser deve emettere righe non vuote nell'ordine sorgente.
- Ogni riga emessa deve preservare le 5 posizioni colonna MVP anche quando il foglio usa `covered-table-cell` o celle ripetute.
- Ogni riga emessa deve contenere solo celle testuali con trim degli spazi esterni.
- Le celle vuote finali devono essere rimosse prima di determinare la lunghezza effettiva della riga.

### 2. Minimum supported shape

- Header row: non prevista
- Row count nel campione `.local/1001.ods`: 1571 righe non vuote
- Lunghezza riga effettiva attesa nel campione dopo espansione di `covered-table-cell` e trim trailing blank: `5`
- Nome del primo foglio nel campione: `Lista`

### 3. Scope rules

- Questo task non applica fill-down del titolo.
- Questo task non normalizza ancora il significato dominio delle 5 posizioni colonna MVP.
- Questo task non costruisce record `Titolo` o `Sotto-variante`.
- `Appoggio` e `Risultati` restano fuori scope come sorgenti di parse.

### 4. Failure behavior

- Se il file non e' leggibile come ODS, il parse fallisce senza dataset parziale.
- Se il primo foglio operativo non e' risolvibile come `Lista`, il parse fallisce senza dataset parziale.
- Se `content.xml` e' malformato o i metadata di ripetizione riga/cella sono invalidi, il parser deve segnalare errore esplicito e non restituire dati parziali.
- Se una riga non puo' essere rappresentata nel formato grezzo definito da questo task, il parser deve segnalarla come errore di parse e non attivare dati parziali.

## Subtasks

- `ST-01.1` Select and load the input ODS file. Status: `completed`
- `ST-01.2` Resolve the first operational sheet as `Lista`. Status: `completed`
- `ST-01.3` Extract the 5 MVP columns from each non-empty row. Status: `completed`
- `ST-01.4` Surface parsing errors without activating partial data. Status: `completed`

## Subtask Details And Dependencies

### ST-01.1 Select and load the input ODS file

Definition:

- Open the user-selected ODS file as the sole parser input artifact.
- Establish the failure boundary for unreadable or unsupported files.

Depends on:

- `none`

Blocks:

- `ST-01.2`
- `ST-01.3`
- `ST-01.4`
- `EP-01 / T-02`

Status:

- `completed`

Evidence:

- Implemented in [src/lista_parser.py](/root/bed-project/src/lista_parser.py)
- Verified by [tests/test_lista_parser.py](/root/bed-project/tests/test_lista_parser.py)

### ST-01.2 Resolve the first operational sheet as `Lista`

Definition:

- Resolve the first sheet used by MVP import and freeze `Lista` as the only parse source.
- Ignore derived sheets for import purposes.

Depends on:

- `ST-01.1`

Blocks:

- `ST-01.3`
- `ST-01.4`
- `EP-01 / T-02`

Status:

- `completed`

Evidence:

- Implemented in [src/lista_parser.py](/root/bed-project/src/lista_parser.py)
- Verified by [tests/test_lista_parser.py](/root/bed-project/tests/test_lista_parser.py)

### ST-01.3 Extract the 5 MVP columns from each non-empty row

Definition:

- Emit ordered raw rows from `Lista` after trimming cell text and removing trailing blank cells.
- Preserve the 5 MVP column positions by expanding repeated and covered cells before downstream normalization.

Depends on:

- `ST-01.2`

Blocks:

- `EP-01 / T-02`
- `EP-04 / T-03`

Status:

- `completed`

Evidence:

- Implemented in [src/lista_parser.py](/root/bed-project/src/lista_parser.py)
- Verified by [tests/test_lista_parser.py](/root/bed-project/tests/test_lista_parser.py)

### ST-01.4 Surface parsing errors without activating partial data

Definition:

- Make parse failures explicit at file, sheet, or row boundary.
- Prevent partial activation of imported data when parse preconditions fail.

Depends on:

- `ST-01.1`
- `ST-01.2`

Blocks:

- `EP-01 / T-02`
- `EP-02 / T-02`

Status:

- `completed`

Evidence:

- Implemented in [src/lista_parser.py](/root/bed-project/src/lista_parser.py)
- Verified by [tests/test_lista_parser.py](/root/bed-project/tests/test_lista_parser.py)

## Downstream Task Impact

- `EP-01 / T-02` must consume this task's raw-row boundary and must not re-decide file loading, sheet resolution, or row ordering.
- `EP-02 / T-02` must use the no-partial-activation failure rule when wiring import confirmation and dataset replacement.
- `EP-04 / T-03` must assume any later export reconstruction starts from normalized data derived from this parse contract, not from secondary sheets.
