# Archivio 1001 Webapp

PWA offline-first in italiano per consultazione e manutenzione locale di un archivio titoli, pensata per Android e browser moderni.

La cartella [`webapp/`](/root/bed-project/webapp) contiene la shell browser-only dell'applicazione: interfaccia, routing hash-based, persistenza locale con IndexedDB, manifest PWA, service worker e asset statici.

## Panoramica

L'app espone una dashboard iniziale con ricerca primaria, accessi rapidi e stato del dataset locale. Il runtime non dipende piu' dal server Python per i flussi core gia' implementati: legge e scrive i dati direttamente nel browser.

Flussi oggi presenti:

- dashboard con ricerca primaria
- lista archivio con filtro stato e query testuale
- dettaglio titolo con sotto-varianti
- modifica di una sotto-variante esistente
- creazione di un nuovo titolo
- shell offline dopo primo caricamento valido

Flussi gia' previsti ma non ancora implementati end-to-end:

- import ODS
- export ODS

## Contenuto di `webapp/`

### [`webapp/index.html`](/root/bed-project/webapp/index.html)

Entry point HTML della PWA.

- definisce la shell iniziale
- collega `manifest.webmanifest`
- carica `styles.css`
- avvia `app.js` come modulo ES

### [`webapp/app.js`](/root/bed-project/webapp/app.js)

Controller principale della UI.

- gestisce il routing via `window.location.hash`
- renderizza dashboard, lista, dettaglio, modifica e creazione
- collega la ricerca primaria alla route `#/archive`
- usa `storage.js` per bootstrap e mutazioni locali
- registra il service worker in bootstrap

Note operative:

- la route di default e' `#/dashboard`
- le route `#/import` e `#/export` sono ingressi gia' dichiarati, ma la vista completa non e' ancora implementata
- in caso di recovery failure dello storage locale mostra uno stato di errore coerente

### [`webapp/storage.js`](/root/bed-project/webapp/storage.js)

Boundary di persistenza browser-local.

- usa IndexedDB con database `archivio-1001`
- usa object store `runtime`
- salva il payload sotto la chiave `archive-storage`
- valida struttura, schema version e metadati
- espone:
  - `loadDashboardPayload()`
  - `createTitleRecord()`
  - `updateTitleRecord()`

Modello dati locale attuale:

- `schemaVersion`
- `activeArchive`
- `pendingImport`

Quando `activeArchive` esiste, contiene:

- `metadata`
- `titles`

### [`webapp/service-worker.js`](/root/bed-project/webapp/service-worker.js)

Gestisce il caching della shell PWA.

- cache name corrente: `archivio-1001-shell-v1`
- precache di HTML, CSS, JS, manifest e icone
- fallback a `/index.html` quando la rete non e' disponibile
- nessuna dipendenza da endpoint `/api/*`

### [`webapp/manifest.webmanifest`](/root/bed-project/webapp/manifest.webmanifest)

Manifest installabile della PWA.

- `start_url: "/"` 
- `display: "standalone"`
- colori tema e background coerenti con la UI
- icone root-based:
  - `/icon-192.svg`
  - `/icon-512.svg`

Importante: i path sono assoluti. Il deploy supportato e' da root path `/`, non da sottocartella.

### [`webapp/styles.css`](/root/bed-project/webapp/styles.css)

Foglio di stile principale.

- design mobile-first
- palette calda editoriale
- tipografia con contrasto tra display serif e body sans-serif
- componenti per dashboard, route grid, lista titoli, dettaglio, form e stati vuoti

### [`webapp/icon-192.svg`](/root/bed-project/webapp/icon-192.svg) e [`webapp/icon-512.svg`](/root/bed-project/webapp/icon-512.svg)

Icone PWA usate dal manifest e cached dal service worker.

## Architettura

### Runtime

- frontend statico servito via HTTP/HTTPS
- nessun backend richiesto per browse, detail, create e update
- persistenza locale nel browser tramite IndexedDB
- app shell cached via service worker

### Routing

Routing client-side basato su hash:

- `#/dashboard`
- `#/archive`
- `#/archive?query=...&status=...`
- `#/detail?title=...`
- `#/edit?title=...&variant=...`
- `#/create`

### Persistenza

L'app non salva su filesystem locale del telefono. Salva nel profilo del browser.

Questo implica:

- i dati sono locali al browser/dispositivo
- cancellare dati del sito puo' rimuovere l'archivio
- `file://` non e' un target supportato per la PWA

## Sviluppo

### Requisiti

- `node` e `npm` per i test Playwright
- `python3` per servire staticamente `webapp/` in locale

### Avvio locale

Per sviluppo rapido:

```bash
python3 tests/static_server.py --host 127.0.0.1 --port 8765
```

Poi aprire:

```text
http://127.0.0.1:8765
```

Nota: serve un web server reale. Aprire direttamente `webapp/index.html` via `file://` non e' supportato per il comportamento PWA atteso.

### Test

Suite mobile browser-only:

```bash
npm run test:mobile
```

La suite verifica:

- dashboard e ricerca
- browse con filtri stato
- dettaglio e ingresso modifica
- create e update persistiti
- presenza della shell in cache
- riuso offline dei dati locali

## Deployment

### Modello supportato

Il deployment supportato e' una PWA hosted via HTTPS.

Vincoli importanti:

- deploy da root path `/`
- HTTPS obbligatorio
- service worker e manifest devono essere serviti correttamente
- niente dipendenze da server Python locale

### Build dell'artefatto statico

```bash
npm run build:pwa-release
```

Output:

- `dist/pwa-release/`
- `dist/releases/<release-id>.tar.gz`
- `dist/pwa-release/release.json`

### Procedura operativa

La procedura di publish, aggiornamento e rollback e' documentata in [docs/hosted-pwa-release-procedure.md](/root/bed-project/docs/hosted-pwa-release-procedure.md:1).

## Debug

### Verifica IndexedDB

Nel browser:

1. aprire DevTools
2. andare su `Application`
3. controllare `IndexedDB > archivio-1001 > runtime`
4. verificare la chiave `archive-storage`

Problemi comuni:

- `unsupported schema version`: payload salvato con schema non compatibile
- archive vuoto: storage mai inizializzato o dati del sito cancellati

### Verifica service worker e cache

In DevTools:

1. `Application > Service Workers`
2. verificare registrazione di `/service-worker.js`
3. aprire `Cache Storage`
4. controllare `archivio-1001-shell-v1`

Se la shell offline non funziona:

- verificare che il sito sia servito via HTTP locale o HTTPS
- verificare che tutti gli asset root-based esistano
- verificare che il deploy non sia sotto sottopercorso

### Verifica routing

Se una vista non appare:

- controllare l'hash URL
- verificare la presenza di `activeArchive` nello storage
- ricordare che `import` ed `export` non hanno ancora il flusso finale implementato

## Limiti noti

- supporto ufficiale a `file://`: assente
- deploy sotto sottocartella: non supportato
- import/export completi: non ancora implementati nella shell finale
- validazione Android reale post-deploy: task ancora aperto a livello backlog

## License

Questo progetto e' documentato per distribuzione sotto licenza MIT.

Testo sintetico:

```text
MIT License

Copyright (c) Archivio 1001 contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files to deal in the Software
without restriction, including without limitation the rights to use, copy,
modify, merge, publish, distribute, sublicense, and/or sell copies.
```

Se il repository deve essere distribuito formalmente, conviene aggiungere anche un file `LICENSE` alla root.
