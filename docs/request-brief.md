# Brief di prodotto — PWA offline-first per archivio derivato da `1001.ods`

1. Problema reale da risolvere

L'archivio attuale è gestito in un file ODS che funziona come contenitore operativo, ma non come interfaccia di lavoro adeguata, soprattutto da Android. Il problema non è avere "un foglio grande", ma non avere un modo pratico, rapido e affidabile per consultare, filtrare, aggiornare e ampliare un archivio di titoli con molte varianti e stati. Il file attuale costringe il lavoro dentro una logica da spreadsheet, poco adatta all'uso mobile e fragile come formato operativo quotidiano.

2. Utenti e processo coinvolto

L'utente primario e' il proprietario dell'archivio, che usa principalmente Android e secondariamente PC per mantenere un catalogo personale di titoli, piattaforme, supporti e stati di reperibilita' o lavorazione.

Il processo attuale, per quanto inferibile dal file, e' questo:
- consultazione del foglio `Lista` come base operativa principale;
- uso di stati sintetici come `OK`, `Da comprare`, `Da studiare estrazione e comprare`, `Non reperibile`;
- utilizzo del foglio `Risultati` come riepilogo di copertura tra elementi presenti e mancanti;
- utilizzo del foglio `Appoggio` come derivazione semplificata di titolo + stato.

Inferenza: la stessa opera logica puo' comparire su piu' righe, probabilmente per piattaforma, edizione, supporto o stato diverso, quindi il processo reale non e' una semplice lista piatta di titoli univoci.

3. Valore atteso

Il valore atteso e' ridurre il tempo e l'attrito necessari per mantenere l'archivio aggiornato, soprattutto da smartphone, e diminuire gli errori operativi causati da editing su foglio di calcolo. I segnali di valore osservabili sono:
- meno passaggi per trovare un record;
- meno tempo per aggiornare stato o note;
- maggiore frequenza di aggiornamento dell'archivio;
- minore dipendenza da app office Android;
- maggiore chiarezza nel distinguere cosa e' completo, mancante o da approfondire.

4. Urgenza e impatto se non facciamo nulla

L'urgenza e' concreta ma non legata a una scadenza esterna: il limite attuale blocca la manutenibilita' dell'archivio e rende scomodo l'uso quotidiano da Android. Se non facciamo nulla, l'archivio restera' modificabile solo con attrito elevato, con maggiore probabilita' di rinviare aggiornamenti, perdere coerenza sugli stati e continuare a dipendere da un formato che non rappresenta bene il modello dati reale.

5. Scope minimo del cambiamento

Lo scope minimo sensato non e' "modificare l'ODS in modo piu' comodo", ma introdurre una PWA offline-first che usi storage locale strutturato e tratti `1001.ods` come sorgente di migrazione iniziale. La prima versione deve consentire import iniziale dei dati, consultazione rapida, ricerca, filtri base, dettaglio record, modifica locale e backup/export in un formato piu' adatto come JSON.

6. Incluso / Escluso

Incluso:
- analisi di `1001.ods` come sorgente dati iniziale;
- definizione di un modello dati applicativo piu' adatto del foglio ODS;
- PWA installabile con uso offline-first;
- storage operativo locale nel browser;
- ricerca testuale e filtri base;
- visualizzazione elenco e dettaglio record;
- modifica e inserimento record;
- export di backup in JSON;
- schermata di stato archivio con metriche essenziali.

Escluso:
- modifica diretta del file `.ods` come formato operativo quotidiano;
- scrittura in-place del file aperto da cloud o filesystem Android;
- sincronizzazione automatica multi-dispositivo nel MVP;
- collaborazione multiutente;
- round-trip completo ODS -> app -> ODS come vincolo iniziale;
- allegati, foto, storico avanzato, undo o conflitti nel primo rilascio;
- modellazione definitiva di tutte le eccezioni prima di una profilazione piu' profonda dei dati.

7. Criteri di accettazione

- L'utente puo' importare una versione normalizzata dei dati derivati da `1001.ods` senza dipendere da una connessione attiva.
- L'utente puo' consultare localmente l'archivio da Android in una UI mobile-first senza dover usare un foglio di calcolo.
- L'utente puo' cercare per titolo e applicare almeno filtri base sugli stati principali.
- L'utente puo' aprire il dettaglio di un record e modificarne i campi previsti dal modello MVP.
- L'utente puo' creare un nuovo record localmente.
- L'app conserva i dati in storage locale persistente e continua a funzionare offline.
- L'utente puo' esportare un backup JSON aggiornato dell'archivio.
- L'app espone uno stato dati minimo con archivio attivo, numero record, ultima modifica locale e versione schema.

8. Dubbi o punti aperti

- I nomi semantici esatti delle colonne di `Lista` non sono ancora confermati: il file mostra 5 colonne effettive, ma il loro significato va validato.
- Non e' ancora chiaro se il record primario debba rappresentare un titolo, una variante per piattaforma o una copia/supporto specifico.
- Il foglio `Risultati` sembra essere un riepilogo derivato, ma va confermato se contiene logiche da preservare nell'app.
- Il foglio `Appoggio` sembra una proiezione titolo + stato, ma va chiarito se serve solo come supporto temporaneo o se riflette una vista di business stabile.
- Non e' ancora definita la strategia con cui deduplicare o collegare titoli ripetuti su piu' righe.
- Non e' ancora deciso se l'import iniziale debba passare da JSON normalizzato o da una conversione automatica piu' diretta dell'ODS.

9. Impatti da validare con il team tecnico

- Modellazione dati: definire l'entita' primaria corretta e distinguere tra titolo, piattaforma, formato, stato e note.
- Migrazione: progettare un processo affidabile di estrazione e normalizzazione da `1001.ods`.
- Qualita' dati: identificare valori incoerenti, duplicati, stati sovrapposti e campi impliciti.
- Storage locale: confermare IndexedDB come sorgente operativa e definire strategia di versionamento schema.
- Prestazioni: verificare resa su Android con archivio di dimensione simile o superiore a quello attuale.
- Backup e ripristino: definire formato, frequenza d'uso e sicurezza del flusso export/import.
- UX mobile: verificare che la navigazione e l'editing dei record siano realmente piu' rapidi del foglio.
- Evoluzione futura: valutare se lasciare spazio a CSV, ODS export secondario, SQLite o wrapper nativo in fasi successive.

10. Raccomandazione

`Ridurre`

Rationale: l'intento e' valido e il valore e' chiaro, ma la soluzione va ridotta a un MVP molto stretto. La richiesta non deve essere interpretata come "replicare il foglio in una web app", ma come costruire un primo archivio locale offline-first che copra solo il flusso essenziale: import, consultazione, ricerca, modifica base ed export JSON. Prima di qualsiasi estensione serve validare il modello dati reale che emerge da `1001.ods`.

Stato validazione interna

`Da validare internamente dal team tecnico`

Impegno verso il cliente

`Nessun impegno su tempi o costi fino al completamento della validazione tecnica interna.`
