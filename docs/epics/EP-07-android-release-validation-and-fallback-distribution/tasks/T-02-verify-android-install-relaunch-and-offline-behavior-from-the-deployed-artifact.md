# T-02 Verify Android install, relaunch, and offline behavior from the deployed artifact

Status: `proposed`

Objective: Verificare il comportamento Android sul deployment reale, distinguendo chiaramente questa copertura dalla verifica eseguita su fixture locale o runtime di sviluppo.

## Decision

La baseline di validazione MVP per questo task e' `Chrome Android`.

La verifica deve partire solo da un artefatto HTTPS reale e non puo' essere sostituita da:

- fixture locale;
- server Python di sviluppo;
- semplice verifica di viewport phone-sized;
- ipotesi su browser Android multipli.

Stato operativo corrente:

- il contratto del task e' definito;
- l'esecuzione resta bloccata finche' non esistono un URL HTTPS realmente pubblicato e un ambiente Chrome Android reale per la validazione.

## Canonical Contract

### 1. Validation target

- Il task valida il comportamento del deployment reale servito via HTTPS.
- Il browser baseline da validare e' Chrome Android.
- L'artefatto da validare deve provenire dal percorso browser-only definito in `EP-06` e pubblicato tramite `EP-07 / T-01`.

### 2. Required validation areas

- Il task deve verificare apertura dell'URL finale da browser Android.
- Il task deve verificare save/install quando supportato dal browser baseline.
- Il task deve verificare riapertura dell'app o shortcut senza dipendere dal runtime di sviluppo.
- Il task deve verificare shell offline, persistenza locale e flussi core dopo primo caricamento valido.

### 3. Scope rules

- Questo task non richiede ancora copertura multi-browser Android.
- Questo task non valida `file://`.
- Questo task non valida wrapper Android.

## Subtasks:

- `ST-02.1` Verificare apertura da browser Android del release URL e disponibilita' del flusso save/install quando supportato dal browser.
- `ST-02.2` Verificare riapertura della PWA o shortcut salvata senza dipendere dal server locale di sviluppo.
- `ST-02.3` Verificare disponibilita' offline di shell, archivio locale e flussi core dopo il primo caricamento riuscito.
- `ST-02.4` Verificare import/export e segnalare in modo esplicito eventuali limiti residui del deployment Android reale.

## Subtask Details And Dependencies

### ST-02.1 Verificare apertura URL e disponibilita' del flusso save/install

Definition:

- Verificare che l'artefatto pubblicato sia raggiungibile da Chrome Android e offra il comportamento atteso di save/install quando supportato.

Depends on:

- `EP-07 / T-01`

Blocks:

- `ST-02.2`
- `ST-02.3`
- `ST-02.4`

Status:

- `proposed`

### ST-02.2 Verificare riapertura senza runtime di sviluppo

Definition:

- Verificare che l'app o shortcut salvato possa essere riaperto senza server Python locale o fixture di sviluppo.

Depends on:

- `ST-02.1`

Blocks:

- `ST-02.3`
- `ST-02.4`

Status:

- `proposed`

### ST-02.3 Verificare disponibilita' offline di shell, archivio locale e flussi core

Definition:

- Verificare che shell, dati locali e flussi core restino utilizzabili offline dopo il primo caricamento valido.

Depends on:

- `ST-02.1`
- `ST-02.2`
- `EP-06 / T-03`

Blocks:

- `ST-02.4`

Status:

- `proposed`

### ST-02.4 Verificare import/export e segnalare limiti residui

Definition:

- Verificare i flussi import/export sul deployment reale e rendere espliciti eventuali limiti residui senza confonderli con la fixture locale.

Depends on:

- `ST-02.2`
- `ST-02.3`

Blocks:

- `none`

Status:

- `proposed`

## Downstream Task Impact

- MVP Android acceptance must use the deployment-real coverage fixed here instead of relying only on local fixture validation.
