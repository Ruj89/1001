# T-01 Verify import and normalization behavior

Status: `completed`

Objective: Confermare che import, fill-down, grouping per titolo e preservazione ordine rispettino il contratto MVP documentato.

## Decision

La copertura di verifica per import e normalizzazione e' ormai presente nel repo e allineata ai contratti fissati in `EP-01`. I test eseguono sia casi sintetici sia il campione reale `.local/1001.ods`, e verificano:

- parse riuscito del workbook ODS compatibile;
- applicazione del fill-down sui titoli vuoti;
- grouping dei titoli ripetuti con preservazione dell'ordine;
- failure esplicito e non distruttivo su input invalidi.

## Canonical Verification Coverage

### 1. Compatible ODS import

- La suite deve verificare che un ODS valido con primo foglio `Lista` venga letto correttamente.
- La suite deve verificare il campione reale con risoluzione del foglio `Lista` come primo foglio operativo.

### 2. Fill-down behavior

- La suite deve verificare che una riga con titolo vuoto erediti il titolo precedente.
- La suite deve verificare che il primo titolo vuoto senza contesto fallisca esplicitamente.

### 3. Grouping and order preservation

- La suite deve verificare che piu' righe con lo stesso titolo confluiscano nello stesso gruppo normalizzato.
- La suite deve verificare che l'ordine globale delle righe e quello interno ai gruppi restino coerenti al sorgente.

### 4. Invalid import safety

- La suite deve verificare errori espliciti su file non leggibili, zip invalidi, XML malformato, workbook senza `Lista`, metadata di ripetizione invalidi e row shape non conforme.
- In tali casi il sistema non deve promuovere dataset parziali come import valido.

## Subtasks

- `ST-01.1` Validate successful import of a compatible ODS file. Status: `completed`
- `ST-01.2` Validate fill-down behavior on blank-title rows. Status: `completed`
- `ST-01.3` Validate grouping of repeated titles into ordered sub-variants. Status: `completed`
- `ST-01.4` Validate non-destructive behavior on invalid import inputs. Status: `completed`

## Subtask Details And Dependencies

### ST-01.1 Validate successful import of a compatible ODS file

Definition:

- Verify successful parse of a compatible ODS workbook and the real sample workbook.
- Confirm `Lista` remains the only import source boundary.

Depends on:

- `EP-01 / T-01`

Blocks:

- `ST-01.2`
- `ST-01.3`
- `ST-01.4`

Status:

- `completed`

Evidence:

- Verified by [tests/test_lista_parser.py](/root/bed-project/tests/test_lista_parser.py)

### ST-01.2 Validate fill-down behavior on blank-title rows

Definition:

- Verify inheritance of the previous title on blank-title rows.
- Reject blank-title rows that appear before any title context.

Depends on:

- `EP-01 / T-02`

Blocks:

- `ST-01.3`
- `ST-01.4`

Status:

- `completed`

Evidence:

- Verified by [tests/test_lista_normalizer.py](/root/bed-project/tests/test_lista_normalizer.py)

### ST-01.3 Validate grouping of repeated titles into ordered sub-variants

Definition:

- Verify exact-title grouping and preserved source order within grouped sub-variants.
- Confirm the real sample workbook keeps documented order characteristics.

Depends on:

- `EP-01 / T-02`

Blocks:

- `ST-01.4`

Status:

- `completed`

Evidence:

- Verified by [tests/test_lista_normalizer.py](/root/bed-project/tests/test_lista_normalizer.py)

### ST-01.4 Validate non-destructive behavior on invalid import inputs

Definition:

- Verify that invalid files or malformed workbook structures fail explicitly.
- Verify that invalid normalized row shapes are not accepted silently.

Depends on:

- `EP-01 / T-01`
- `EP-01 / T-02`

Blocks:

- `EP-05 / T-03`
- `EP-05 / T-04`

Status:

- `completed`

Evidence:

- Verified by [tests/test_lista_parser.py](/root/bed-project/tests/test_lista_parser.py)
- Verified by [tests/test_lista_normalizer.py](/root/bed-project/tests/test_lista_normalizer.py)

## Downstream Task Impact

- `EP-05 / T-03` can assume the export verification starts from a validated import/normalization pipeline.
- `EP-05 / T-04` can assume persistence verification starts from a valid imported dataset boundary instead of re-testing parsing semantics.
