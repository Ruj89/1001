# Brief di prodotto — PWA offline-first per archivio derivato da `1001.ods`

1. Problema reale da risolvere

L'archivio attuale è gestito in un file ODS che funziona come contenitore operativo, ma non come interfaccia di lavoro adeguata, soprattutto da Android. Il problema non è avere "un foglio grande", ma non avere un modo pratico, rapido e affidabile per consultare, filtrare, aggiornare e ampliare un archivio di titoli con molte varianti e stati. Il file attuale costringe il lavoro dentro una logica da spreadsheet, poco adatta all'uso mobile e fragile come formato operativo quotidiano.

2. Utenti e processo coinvolto

L'utente primario e' il proprietario dell'archivio, che usa principalmente Android e secondariamente PC per mantenere un catalogo personale di titoli, piattaforme, supporti e stati di reperibilita' o lavorazione.

Il processo attuale, per quanto inferibile dal file, e' questo:
- consultazione del foglio `Lista` come base operativa principale;
- uso di stati sintetici come `OK`, `Da comprare`, `Da studiare estrazione e comprare`, `Non reperibile`;
- utilizzo del foglio `Risultati` come riepilogo di copertura tra elementi presenti e mancanti, derivato dal primo foglio;
- utilizzo del foglio `Appoggio` come derivazione semplificata di titolo + stato, anch'essa derivata dal primo foglio.

Inferenza confermata dal file: la stessa opera logica puo' comparire su piu' righe per piattaforma, edizione, supporto o stato diverso. Per il brief aggiornato, l'unita' di business da trattare nell'MVP non e' una riga piatta autonoma, ma un `titolo` che puo' contenere una o piu' `sotto-varianti`.

Per il perimetro MVP, il primo foglio viene interpretato con questo contratto stabile di colonne:
- `titolo`
- `piattaforma`
- `edizione/versione`
- `supporto`
- `stato`

Le righe che condividono lo stesso titolo appartengono allo stesso record logico e restano separate come sotto-varianti distinte, senza consolidamento automatico aggressivo.

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

Lo scope minimo sensato non e' "modificare l'ODS in modo piu' comodo", ma introdurre una PWA offline-first che usi storage locale strutturato e tratti un file ODS del formato atteso come input e output operativo. La prima versione deve consentire import del primo foglio ODS, trasformazione nel modello `titolo + sotto-varianti`, sostituzione completa dell'archivio locale previa conferma utente, consultazione rapida, ricerca, filtri base, dettaglio record, modifica locale, rigenerazione programmatica delle viste derivate minime ed export finale in ODS ad alta fedelta' operativa rispetto al file attuale.

6. Incluso / Escluso

Incluso:
- analisi di `1001.ods` come sorgente dati iniziale;
- definizione di un modello dati applicativo piu' adatto del foglio ODS;
- PWA installabile con uso offline-first;
- storage operativo locale nel browser;
- import di un file ODS con dati variabili nel primo foglio;
- sostituzione completa del dataset locale a ogni nuovo import, con conferma esplicita prima della sovrascrittura;
- modello dati applicativo basato su `titolo` con una o piu' `sotto-varianti`;
- ricerca testuale e filtri base;
- visualizzazione elenco e dettaglio record;
- modifica e inserimento record;
- rigenerazione programmatica di una vista equivalente a `Appoggio` come proiezione semplificata `titolo + stato`;
- rigenerazione programmatica di una vista equivalente a `Risultati` come riepilogo essenziale presente/mancante;
- export in ODS di un file quasi identico a `1001.ods` sul piano operativo, con foglio principale e viste derivate equivalenti;
- schermata di stato archivio con metriche essenziali.

Escluso:
- modifica diretta del file `.ods` come formato operativo quotidiano;
- scrittura in-place del file aperto da cloud o filesystem Android;
- sincronizzazione automatica multi-dispositivo nel MVP;
- collaborazione multiutente;
- merge tra import multipli o aggiornamento incrementale del dataset locale;
- deduplicazione fuzzy o consolidamento automatico di righe simili oltre al raggruppamento per titolo;
- round-trip perfetto cella-per-cella o formula-per-formula come vincolo iniziale;
- allegati, foto, storico avanzato, undo o conflitti nel primo rilascio;
- modellazione definitiva di tutte le eccezioni prima di una profilazione piu' profonda dei dati.

7. Criteri di accettazione

- L'utente puo' importare un file ODS del formato atteso senza dipendere da una connessione attiva.
- Prima della sostituzione dell'archivio locale con un nuovo import ODS, l'app richiede una conferma esplicita.
- Le righe con lo stesso titolo nel primo foglio vengono importate come un singolo record `titolo` con sotto-varianti distinte.
- L'utente puo' consultare localmente l'archivio da Android in una UI mobile-first senza dover usare un foglio di calcolo.
- L'utente puo' cercare per titolo e applicare almeno filtri base sugli stati principali.
- L'utente puo' aprire il dettaglio di un record e modificarne i campi previsti dal modello MVP.
- L'utente puo' creare un nuovo record localmente.
- L'app conserva i dati in storage locale persistente e continua a funzionare offline.
- L'app rigenera programmaticamente una vista equivalente a `Appoggio` come proiezione `titolo + stato sintetico`, senza usare le formule del file sorgente come motore logico interno.
- L'app rigenera programmaticamente una vista equivalente a `Risultati` come riepilogo essenziale presente/mancante a livello titolo.
- L'utente puo' esportare un ODS aggiornato dell'archivio, con struttura, organizzazione e usabilita' operativa molto vicine al file attuale.
- L'app espone uno stato dati minimo con archivio attivo, numero record, ultima modifica locale e versione schema.

8. Dubbi o punti aperti

- Le 5 colonne del foglio `Lista` vengono trattate come contratto stabile `titolo`, `piattaforma`, `edizione/versione`, `supporto`, `stato`; resta da verificare solo se emergano anomalie dati future che richiedano eccezioni.
- Il record primario dell'MVP e' `titolo con sotto-varianti`; resta da definire con precisione quali campi siano sempre obbligatori in ciascuna sotto-variante.
- `Risultati` e `Appoggio` non sono sorgenti da importare: resta da chiarire il criterio esatto con cui sintetizzare lo stato di `Appoggio` e la copertura presente/mancante di `Risultati`.
- I titoli ripetuti vengono collegati allo stesso record titolo e mantenuti come sotto-varianti distinte; resta da definire l'ordinamento minimo da preservare tra sotto-varianti.
- L'ODS in uscita deve risultare quasi identico sul piano operativo; resta da chiarire fino a che punto la fedelta' debba includere ordinamento, layout e formule oltre alla sola struttura logica.

9. Impatti da validare con il team tecnico

- Modellazione dati: definire l'entita' primaria corretta e distinguere tra titolo, piattaforma, formato, stato e note.
- Contratto di import: fissare il mapping stabile tra le 5 colonne del primo foglio e il modello `titolo + sotto-varianti`.
- Migrazione: progettare un processo affidabile di estrazione e normalizzazione dal primo foglio di un ODS del formato atteso.
- Qualita' dati: identificare valori incoerenti, duplicati, stati sovrapposti e campi impliciti.
- Storage locale: confermare IndexedDB come sorgente operativa e definire strategia di versionamento schema.
- Import/export ODS: verificare la fattibilita' di parsing del primo foglio e di generazione di un ODS in uscita molto simile al file attuale.
- Overwrite operativo: definire il comportamento sicuro di sostituzione completa dell'archivio locale a ogni import.
- Elaborazioni derivate: definire il criterio minimo di stato sintetico per `Appoggio` e di copertura presente/mancante per `Risultati`.
- Prestazioni: verificare resa su Android con archivio di dimensione simile o superiore a quello attuale.
- UX mobile: verificare che la navigazione e l'editing dei record siano realmente piu' rapidi del foglio.
- Evoluzione futura: valutare se lasciare spazio a formati secondari, sync o wrapper nativo in fasi successive.

10. Raccomandazione

`Ridurre`

Rationale: l'intento e' valido e il valore e' chiaro, ma la soluzione va ridotta a un MVP molto stretto. La richiesta non deve essere interpretata come "replicare il foglio in una web app", ma come costruire un primo archivio locale offline-first che copra solo il flusso essenziale: import ODS con sostituzione completa, modello `titolo + sotto-varianti`, consultazione, ricerca, modifica base, rigenerazione programmatica delle elaborazioni minime utili ed export finale in ODS ad alta fedelta' operativa. Prima di qualsiasi estensione serve validare il modello dati reale che emerge dal primo foglio del file.

Stato validazione interna

`Da validare internamente dal team tecnico`

Impegno verso il cliente

`Nessun impegno su tempi o costi fino al completamento della validazione tecnica interna.`
