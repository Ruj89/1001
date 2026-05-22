# T-01 Publish the hosted HTTPS PWA release procedure

Status: `completed`

Objective: Definire la procedura operativa di rilascio per pubblicare la PWA via HTTPS e renderla raggiungibile da Android come artefatto installabile o salvabile dal browser.

## Decision

Questo task resta downstream rispetto alla browser-only readiness, ma il suo contratto e' ormai chiaro:

- HTTPS e' obbligatorio;
- il provider specifico non deve essere scelto in questo task contract;
- la procedura deve restare compatibile sia con hosting gestito sia con self-hosting successivo;
- la procedura va documentata solo dopo esistenza di un artefatto browser-only coerente con `EP-06`.

## Canonical Contract

### 1. Release procedure target

- La procedura deve pubblicare un artefatto statico browser-only servito via HTTPS.
- Il risultato atteso e' un URL finale raggiungibile da Chrome Android.
- Il task non richiede ancora una preferenza definitiva tra hosting gestito e self-hosting.

### 2. Procedure scope

- La procedura deve coprire publish, aggiornamento e rollback dell'artefatto statico.
- La procedura deve dichiarare i prerequisiti tecnici minimi di reachability Android.
- La procedura non deve riaprire la strategia di prodotto su `file://` o wrapper Android.

### 3. Scope rules

- Questo task puo' iniziare solo dopo la browser-only readiness definita in `EP-06`.
- Questo task non richiede ancora copertura multi-browser Android.
- Questo task non sceglie il provider, ma deve restare provider-neutral.

## Subtasks:

- `ST-01.1` Selezionare il modello di hosting statico gestito coerente con il contratto di deployment supportato.
- `ST-01.2` Definire i passi di publish, aggiornamento e rollback dell'artefatto statico.
- `ST-01.3` Definire i prerequisiti di reachability Android: URL finale, contesto sicuro, asset essenziali e manifest servito correttamente.
- `ST-01.4` Documentare la procedura finale di rilascio come riferimento operativo per pubblicazione e manutenzione.

## Subtask Details And Dependencies

### ST-01.1 Selezionare il modello operativo di hosting HTTPS

Definition:

- Definire il modello operativo compatibile con il contratto di release senza imporre gia' un vendor specifico.

Depends on:

- `EP-06 / T-03`

Blocks:

- `ST-01.2`
- `ST-01.3`
- `ST-01.4`

Status:

- `completed`

Evidence:

- `docs/hosted-pwa-release-procedure.md` definisce un modello operativo provider-neutral compatibile con hosting gestito o self-hosting successivo.
- `scripts/build_pwa_release.sh` produce un artefatto statico browser-only e uno snapshot riusabile senza imporre un vendor specifico.

### ST-01.2 Definire i passi di publish, aggiornamento e rollback

Definition:

- Formalizzare il flusso operativo per pubblicare e mantenere l'artefatto statico.

Depends on:

- `ST-01.1`

Blocks:

- `ST-01.4`

Status:

- `completed`

Evidence:

- `docs/hosted-pwa-release-procedure.md` copre build, publish, aggiornamento e rollback dell'artefatto statico.
- `package.json` espone `npm run build:pwa-release` come entrypoint operativo minimo per generare l'artefatto di release.

### ST-01.3 Definire i prerequisiti di reachability Android

Definition:

- Congelare URL finale, contesto sicuro e asset minimi necessari per Chrome Android.

Depends on:

- `ST-01.1`
- `EP-06 / T-03`

Blocks:

- `ST-01.4`
- `EP-07 / T-02`

Status:

- `completed`

Evidence:

- `docs/hosted-pwa-release-procedure.md` congela reachability HTTPS, URL finale, root path richiesto e asset essenziali necessari a Chrome Android.
- `webapp/manifest.webmanifest` e `webapp/service-worker.js` sono richiamati dalla procedura come prerequisiti pubblicati del target Android.

### ST-01.4 Documentare la procedura finale di rilascio

Definition:

- Pubblicare la procedura operativa completa come riferimento per pubblicazione e manutenzione.

Depends on:

- `ST-01.1`
- `ST-01.2`
- `ST-01.3`

Blocks:

- `EP-07 / T-02`

Status:

- `completed`

Evidence:

- `docs/hosted-pwa-release-procedure.md` pubblica la procedura finale come riferimento operativo unico per publish, update e rollback.
- `scripts/build_pwa_release.sh` e `dist/pwa-release/release.json` rendono tracciabile l'artefatto descritto nella procedura.

## Downstream Task Impact

- `EP-07 / T-02` must validate the deployed artifact produced by the HTTPS release procedure fixed here.
