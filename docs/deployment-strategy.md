# Strategia di deployment Android - PWA offline-first per archivio derivato da `1001.ods`

## Obiettivo del deployment

Il deployment deve produrre un'esperienza Android in cui l'utente:

- apre l'app una prima volta da browser;
- la salva o installa come PWA quando il browser lo consente;
- continua poi a usarla offline con dati persistiti localmente nel browser;
- importa ed esporta file ODS senza dipendere da un backend remoto.

Questo documento descrive l'output atteso della procedura di deployment e chiarisce quali opzioni sono tecnicamente adatte o inadatte rispetto al target del progetto.

## Raccomandazione tecnica

La soluzione migliore per il target prodotto e' una `PWA servita via HTTPS` da hosting statico gestito.

Motivi principali:

- la PWA richiede un contesto sicuro per service worker e installabilita';
- Android supporta meglio il flusso "apri URL, salva/installa nel browser, poi usa offline" rispetto al flusso `file://`;
- il progetto vuole evitare installazioni aggiuntive sul telefono oltre al browser;
- il modello finale previsto dai documenti di prodotto e' browser-local, offline-first e senza backend operativo permanente.

In questo scenario la procedura di deployment deve produrre:

- un URL HTTPS raggiungibile dal telefono;
- una shell applicativa installabile o salvabile dal browser Android;
- persistenza locale dei dati nel browser;
- disponibilita' offline dei flussi core dopo il primo caricamento riuscito.

## Opzione non supportata: apertura da file locale

Aprire un file locale dal telefono con `file://` e poi salvarlo come PWA non e' un target di deployment supportato.

Questa opzione e' inadatta per tre ragioni:

- i browser non trattano `file://` come base affidabile per installabilita' PWA;
- service worker e ciclo offline non sono pensati per funzionare in quel contesto;
- l'implementazione attuale non e' una semplice app statica apribile da file, perche' usa anche endpoint HTTP locali.

Quindi il deployment non deve promettere:

- installazione PWA da file copiati nello storage Android;
- supporto ufficiale al lancio diretto di `index.html` dal filesystem del telefono;
- comportamento offline equivalente a quello di una PWA servita via HTTPS.

## Gap tra target e implementazione attuale

Il target di prodotto resta una PWA offline-first con storage browser locale. Tuttavia il codice attuale non e' ancora deployabile in quel modo senza ulteriore lavoro tecnico.

Fatti osservabili nel repository:

- la UI registra un service worker e carica manifest e asset come web app servita: [webapp/index.html](/root/bed-project/webapp/index.html:8), [webapp/app.js](/root/bed-project/webapp/app.js:616);
- la UI chiama endpoint HTTP locali come `/api/dashboard` e `/api/titles`: [webapp/app.js](/root/bed-project/webapp/app.js:44), [webapp/app.js](/root/bed-project/webapp/app.js:612);
- il runtime disponibile oggi e' un server Python locale: [src/archive_dashboard_app.py](/root/bed-project/src/archive_dashboard_app.py:392).

Conseguenza pratica:

- copiare i file statici sul telefono non basta;
- l'attuale build non e' ancora una PWA browser-only realmente distribuibile come asset statico puro;
- la procedura di deployment finale deve basarsi sul target architetturale desiderato, non sul prototipo corrente.

## Output atteso della procedura di deployment

Una procedura di deployment corretta deve dichiarare e produrre in modo esplicito questi output.

### 1. Artefatto rilasciato

Uno dei seguenti:

- `URL HTTPS` della PWA pubblicata, se si segue il percorso raccomandato;
- `pacchetto Android wrapper`, solo se il vincolo "nessun host esterno" resta assoluto e si abbandona il target PWA puro.

### 2. Modalita' di accesso Android

La procedura deve spiegare:

- come aprire l'app dal browser Android;
- come salvarla o installarla dalla UI del browser, se disponibile;
- come riaprirla successivamente senza passare da file locali.

### 3. Garanzia di disponibilita' offline

La procedura deve indicare che, dopo il primo caricamento valido:

- la shell applicativa resta apribile offline;
- i flussi core restano utilizzabili offline;
- i dati dell'archivio restano persistiti localmente nel browser secondo il modello previsto dal progetto.

### 4. Limiti dichiarati

La procedura deve esplicitare i limiti non supportati:

- nessun supporto ufficiale a `file://`;
- nessuna scrittura in-place su file gia' aperti dal filesystem Android;
- nessuna promessa di installabilita' se l'app non e' servita in contesto sicuro.

## Alternative e tradeoff

### Hosting statico gestito con HTTPS

E' l'opzione preferita.

Vantaggi:

- nessuna gestione manuale del certificato;
- flusso naturale per Android browser + PWA;
- allineamento diretto con il target offline-first del progetto.

Svantaggi:

- richiede accettare un host esterno;
- richiede che l'app evolva verso un runtime browser-only coerente con il target finale.

### File locale su smartphone

Non raccomandato.

Vantaggi apparenti:

- nessun host;
- nessuna installazione aggiuntiva oltre al browser.

Svantaggi reali:

- non e' un deployment PWA affidabile;
- non rispetta i vincoli di sicurezza del browser;
- non e' compatibile con il runtime attuale.

### Wrapper Android

Fallback accettabile solo se il vincolo "nessun host esterno" resta non negoziabile.

Vantaggi:

- evita la dipendenza dal comportamento installabile della PWA nel browser;
- consente un'esperienza piu' controllata su Android.

Svantaggi:

- introduce packaging, distribuzione e manutenzione app;
- allontana il progetto dalla soluzione piu' semplice e coerente con il brief MVP.

## Decisione consigliata per il progetto

La decisione tecnica consigliata e':

- `prima scelta`: deployment come PWA via hosting statico HTTPS gestito;
- `opzione esplicitamente scartata`: apertura di file locali dal telefono come base di installazione PWA;
- `ultima spiaggia`: wrapper Android se resta vietato ogni host esterno.

In sintesi, se l'obiettivo prioritario e' "non installare nulla sullo smartphone oltre al browser", il modo piu' razionale di arrivarci non e' `file://`, ma una PWA servita via HTTPS e poi salvata dal browser Android.
