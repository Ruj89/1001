# T-03 Align static assets, local persistence boot, and installability requirements for hosted release

Status: `accepted`

Objective: Preparare il runtime browser-only a un rilascio HTTPS gestito, con asset statici coerenti, boot locale persistente e requisiti minimi di installabilita' PWA.

## Decision

Questo task non sceglie ancora un provider di hosting. Fissa pero' i prerequisiti tecnici del release target supportato:

- output statico browser-only servibile via HTTPS;
- boot locale persistente coerente con l'adapter IndexedDB definito in `EP-06 / T-02`;
- baseline di validazione Android su `Chrome Android`;
- readiness limitata ai prerequisiti tecnici di rilascio, non ancora alla procedura completa di publish/rollback.

## Canonical Contract

### 1. Static output target

- La PWA deve produrre un output statico servibile via HTTPS.
- I path degli asset devono essere coerenti con un deploy statico senza dipendere dal server Python locale.
- Il task non richiede ancora di scegliere tra hosting gestito e self-hosting.

### 2. Installability and shell target

- Manifest, service worker e shell offline devono essere allineati a un contesto HTTPS.
- Dopo il primo caricamento valido, la shell deve poter essere riaperta offline.
- La baseline Android da considerare per il comportamento save/install e rilancio e' Chrome Android.

### 3. Local persistence boot target

- Il boot deve leggere archivio attivo, stato vuoto e failure di recovery dal boundary browser-local.
- Il task deve partire solo dopo che `EP-06 / T-02` ha reso concreto il bootstrap browser-only e il write boundary locale.

### 4. Scope rules

- Questo task non definisce ancora la procedura di publish operativa.
- Questo task non estende la baseline a browser Android multipli.
- Questo task non riapre `file://`, che resta fuori scope MVP.

## Subtasks:

- `ST-03.1` Definire il contratto di build/output statico coerente con hosting gestito e path asset stabili.
- `ST-03.2` Allineare manifest, service worker e shell offline al target di deploy HTTPS senza rete dopo il primo caricamento valido.
- `ST-03.3` Definire il comportamento di boot quando esiste un archivio locale attivo, quando non esiste e quando i dati persistiti non sono recuperabili.
- `ST-03.4` Fissare i prerequisiti minimi di release per dichiarare la PWA pronta a essere pubblicata e installata da browser Android.

## Subtask Details And Dependencies

### ST-03.1 Definire il contratto di build/output statico

Definition:

- Congelare il formato di output statico necessario al deploy HTTPS.
- Garantire path asset stabili e compatibili con serving statico.

Depends on:

- `EP-06 / T-02`

Blocks:

- `ST-03.2`
- `ST-03.3`
- `ST-03.4`
- `EP-07 / T-01`

Status:

- `accepted`

### ST-03.2 Allineare manifest, service worker e shell offline

Definition:

- Allineare il comportamento install/save e riapertura offline al target PWA HTTPS.
- Rimuovere assunzioni residue legate al runtime Python locale.

Depends on:

- `ST-03.1`
- `EP-06 / T-02`

Blocks:

- `ST-03.4`
- `EP-07 / T-01`
- `EP-07 / T-02`

Status:

- `accepted`

### ST-03.3 Definire il comportamento di boot persistente locale

Definition:

- Congelare il comportamento di boot su archivio attivo, stato vuoto e recovery failure usando il boundary browser-local.

Depends on:

- `ST-03.1`
- `EP-06 / T-02`

Blocks:

- `ST-03.4`
- `EP-07 / T-01`
- `EP-07 / T-02`

Status:

- `accepted`

### ST-03.4 Fissare i prerequisiti minimi di release

Definition:

- Definire quando la PWA puo' essere considerata pronta per un rilascio HTTPS e per la validazione su Chrome Android.

Depends on:

- `ST-03.1`
- `ST-03.2`
- `ST-03.3`

Blocks:

- `EP-07 / T-01`
- `EP-07 / T-02`

Status:

- `accepted`

## Downstream Task Impact

- `EP-07 / T-01` must consume the provider-neutral HTTPS readiness contract fixed here.
- `EP-07 / T-02` must validate install/save, relaunch, and offline behavior against Chrome Android and the readiness rules fixed here.
