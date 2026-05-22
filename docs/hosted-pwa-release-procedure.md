# Procedura di rilascio PWA hosted via HTTPS

## Scopo

Questa procedura definisce come produrre, pubblicare, aggiornare e rollbackare l'artefatto statico browser-only della PWA Android.

Il target operativo resta:

- PWA servita via HTTPS;
- URL finale raggiungibile da Chrome Android;
- shell offline e persistenza browser-local disponibili dopo il primo caricamento valido;
- nessun supporto a `file://`.

## Output della procedura

La procedura deve produrre sempre questi output osservabili:

1. directory artefatto pronta al deploy: `dist/pwa-release/`
2. snapshot archiviabile per rollback: `dist/releases/<release-id>.tar.gz`
3. metadata di release: `dist/pwa-release/release.json`
4. URL HTTPS finale del sito pubblicato

## Prerequisiti

- Il contenuto di `webapp/` deve restare browser-only e statico.
- Il deploy puo' servire l'app da root path `/` oppure da un sottopercorso come `/<repo>/`.
- HTTPS e' obbligatorio.
- Il server statico deve servire almeno:
  - `index.html`
  - `app.js`
  - `storage.js`
  - `styles.css`
  - `manifest.webmanifest`
  - `service-worker.js`
  - `icon-192.svg`
  - `icon-512.svg`
- Il deploy non deve reintrodurre dipendenze dal server Python locale.

Nota importante: il build statico parametrizza i path pubblici tramite `DEPLOY_BASE_PATH`. Il default resta `/`; per GitHub Pages project site il valore atteso e' `/<repo>/`.

## 1. Preparazione artefatto

Eseguire:

```bash
npm run build:pwa-release
```

Il comando:

- copia `webapp/` in `dist/pwa-release/`;
- riscrive l'artefatto statico con il prefisso pubblico definito da `DEPLOY_BASE_PATH` se presente;
- genera `release.json` con `releaseId`, revisione git e timestamp UTC;
- crea uno snapshot compresso in `dist/releases/` per il rollback.

Input opzionale:

```bash
DEPLOY_BASE_PATH=/1001/ npm run build:pwa-release
```

Regole del parametro:

- default: `/`
- valore normalizzato sempre con slash iniziale e finale
- per GitHub Pages project site usare `/<repo>/`

Controlli minimi prima del publish:

- `dist/pwa-release/index.html` esiste;
- `dist/pwa-release/manifest.webmanifest` esiste;
- `dist/pwa-release/service-worker.js` esiste;
- `dist/pwa-release/release.json` esiste;
- lo snapshot `dist/releases/<release-id>.tar.gz` esiste.

## 2. Publish HTTPS provider-neutral

Pubblicare il contenuto di `dist/pwa-release/` su un hosting statico HTTPS con queste regole:

- l'URL finale deve essere pubblico e raggiungibile da Chrome Android;
- il contenuto deve essere servito dal path coerente con `DEPLOY_BASE_PATH`;
- `manifest.webmanifest` deve essere servito con MIME type coerente;
- `service-worker.js` deve essere raggiungibile dal browser senza redirect anomali;
- gli aggiornamenti devono sostituire il contenuto statico in modo atomico o quasi-atomico.

Passi operativi minimi:

1. caricare l'intero contenuto di `dist/pwa-release/` sul target statico HTTPS;
2. verificare che l'URL finale apra la dashboard;
3. verificare che `release.json` sia leggibile dal browser all'URL finale;
4. verificare che `manifest.webmanifest` e `service-worker.js` siano serviti dal target pubblicato.

## 3. Aggiornamento release

Per aggiornare una release:

1. generare un nuovo artefatto con `npm run build:pwa-release`;
2. conservare lo snapshot precedente in `dist/releases/` o nel sistema di release del provider;
3. pubblicare il nuovo contenuto statico;
4. verificare che il nuovo `release.json` corrisponda alla revisione attesa;
5. rieseguire la suite minima browser-only prima della validazione Android reale:

```bash
npm run test:mobile
```

## 4. Rollback

Il rollback deve ripubblicare uno snapshot precedente noto buono.

Procedura minima:

1. identificare il file `dist/releases/<release-id>.tar.gz` della release da ripristinare;
2. estrarre lo snapshot in una directory temporanea;
3. ripubblicare quel contenuto sullo stesso target HTTPS;
4. verificare che il `release.json` pubblicato corrisponda al `releaseId` atteso;
5. verificare apertura URL e caricamento shell.

Il rollback non deve richiedere modifiche al codice. Deve solo ripristinare un artefatto statico precedente.

## 5. Prerequisiti di reachability Android

Prima di dichiarare una release pronta per `EP-07 / T-02`, devono essere veri questi punti:

- esiste un URL HTTPS finale unico e comunicabile;
- l'URL si apre da Chrome Android;
- il manifest e' servito correttamente dal deployment;
- il service worker puo' registrarsi nel contesto pubblicato;
- la shell iniziale si apre senza dipendere da server Python locale;
- il deploy espone gli asset essenziali richiesti dal service worker;
- se il deploy usa un sottopercorso, il build deve essere stato generato con `DEPLOY_BASE_PATH` coerente;
- il deploy resta esplicitamente fuori supporto per `file://`.

## Limiti espliciti

- Questa procedura non seleziona un vendor specifico.
- Questa procedura non copre ancora la validazione Android reale post-publish.
- Questa procedura non autorizza wrapper Android come percorso principale.
