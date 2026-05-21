# Requirements Analysis - PWA offline-first per archivio derivato da `1001.ods`

## Project summary

Il progetto consiste in una PWA offline-first per gestire un archivio personale oggi mantenuto in `1001.ods`. L'obiettivo dell'MVP non e' replicare il foglio di calcolo come interfaccia, ma sostituire il flusso operativo quotidiano con un archivio locale strutturato, usabile soprattutto da Android, capace di importare il primo foglio ODS, normalizzarlo nel modello `titolo + sotto-varianti`, consentire consultazione e modifica offline, rigenerare le viste derivate essenziali ed esportare nuovamente un ODS quasi identico sul piano operativo.

## Business objective and success criteria

- Obiettivo principale: ridurre attrito, tempo e probabilita' di errore nella manutenzione dell'archivio, soprattutto da Android.
- Criterio di successo: l'utente puo' svolgere il flusso principale di lavoro senza dipendere da app office o da editing diretto del foglio.
- Criterio di successo: import, consultazione, ricerca, filtri, dettaglio, modifica, creazione ed export funzionano senza connessione attiva.
- Criterio di successo: l'app preserva la portabilita' dell'archivio esportando un ODS operativamente quasi identico al file attuale.
- Criterio di successo: `Appoggio` e `Risultati` vengono rigenerati in codice a partire dai dati dell'archivio, senza usare formule spreadsheet come motore logico interno.

## Scope

### In scope

- Import di un file ODS usando il primo foglio `Lista` come unica sorgente operativa.
- Sostituzione completa dell'archivio locale a ogni nuovo import, con conferma esplicita prima della sovrascrittura.
- Modello dati interno basato su `titolo` con una o piu' `sotto-varianti`.
- Elenco archivio, ricerca testuale, filtri base, vista dettaglio, modifica record esistenti e creazione nuovi record.
- PWA installabile, offline-first, con persistenza locale strutturata.
- Rigenerazione della vista `Appoggio` equivalente alla logica del file di esempio.
- Rigenerazione della vista `Risultati` equivalente alla logica del file di esempio.
- Export di un ODS con foglio principale e viste derivate equivalenti, mantenendo vicinanza strutturale e operativa al file attuale.
- Schermata stato archivio con metriche minime.

### Out of scope

- Editing operativo quotidiano direttamente nel file `.ods`.
- Scrittura in-place su file gia' aperti da cloud o filesystem Android.
- Sync multi-dispositivo nel MVP.
- Multiutenza o collaborazione.
- Merge incrementale tra import multipli.
- Deduplicazione fuzzy oltre al raggruppamento per titolo identico.
- Round-trip perfetto cella-per-cella o formula-per-formula come vincolo generale.
- Allegati, foto, undo, storico avanzato o gestione conflitti nel primo rilascio.

## Stakeholders and user classes

- Utente primario: proprietario dell'archivio, con uso prevalente da Android e secondario da PC.
- Sponsor e decision maker: coincidente con l'utente primario.
- Stakeholder interni successivi: UX/UI e sviluppo, che useranno questo documento come base per flussi, storie e acceptance criteria.

## User requirements

- L'utente deve poter importare localmente un ODS compatibile e sostituire l'archivio attivo solo dopo conferma esplicita.
- L'utente deve poter consultare rapidamente l'archivio da smartphone senza navigazione da spreadsheet.
- L'utente deve poter cercare per titolo e filtrare almeno per stati.
- L'utente deve poter aprire un record a livello `titolo` e gestire separatamente le sue sotto-varianti.
- L'utente deve poter modificare i dati localmente e ritrovarli persistiti offline.
- L'utente deve poter creare nuovi record senza dover ragionare in termini di righe grezze del foglio.
- L'utente deve poter esportare un ODS che resti familiare e riutilizzabile sul piano operativo.
- L'utente deve poter vedere un riepilogo minimo dello stato dell'archivio.

## Functional requirements

- Il sistema deve importare il primo foglio `Lista` di un file ODS compatibile.
- Il sistema deve interpretare le 5 colonne del foglio `Lista` come contratto stabile MVP:
  `titolo`, `piattaforma`, `edizione/versione`, `supporto`, `stato`.
- Il sistema deve applicare il fill-down del titolo quando una riga di `Lista` ha il titolo vuoto e ne eredita il valore dalla riga precedente.
- Il sistema deve raggruppare le righe con lo stesso titolo in un unico record `titolo`, mantenendo le righe come sotto-varianti distinte.
- Il sistema deve preservare l'ordine sorgente delle sotto-varianti in import, persistenza applicativa ed export.
- Il sistema deve richiedere conferma esplicita prima di sostituire integralmente il dataset locale.
- Il sistema deve persistere il dataset in storage locale e restare pienamente usabile offline.
- Il sistema deve fornire una lista archivio usabile in viewport mobile.
- Il sistema deve supportare ricerca per titolo.
- Il sistema deve supportare almeno filtri base per stato.
- Il sistema deve fornire una vista dettaglio per `titolo` e relative sotto-varianti.
- Il sistema deve permettere modifica dei campi MVP per record esistenti.
- Il sistema deve permettere creazione di nuovi record `titolo` con almeno una sotto-variante.
- Il sistema deve richiedere che ogni sotto-variante abbia sempre i campi:
  `piattaforma`, `edizione/versione`, `supporto`, `stato`.
- Il sistema deve rigenerare una vista `Appoggio` equivalente come proiezione riga-per-riga di `Lista`, con titolo fill-down e stato copiato dalla riga sorgente.
- Il sistema deve rigenerare una vista `Risultati` equivalente come riepilogo per titolo unico non vuoto.
- Il sistema deve esportare un ODS con i fogli `Lista`, `Risultati` e `Appoggio`.
- Il sistema deve esporre i metadata minimi dell'archivio: archivio attivo, numero record, ultima modifica locale, versione schema.

## Nonfunctional requirements

### Quality attributes

- Offline-first obbligatorio: i flussi core non devono richiedere rete.
- Mobile usability obbligatoria: l'ambiente primario e' Android su schermo phone-sized.
- Persistenza obbligatoria: i dati modificati localmente devono sopravvivere a chiusura e riapertura dell'app.
- Data integrity obbligatoria: import, normalizzazione ed export non devono perdere silenziosamente record o sotto-varianti.
- Performance target minimo: con un archivio almeno pari al campione analizzato, ricerca, apertura dettaglio e filtri devono risultare percepiti come immediati nell'uso normale.
  `Open question:` il fit criterion numerico preciso per tempi massimi di ricerca/salvataggio puo' essere fissato nelle acceptance criteria tecniche.

### External interfaces

- Input: file ODS scelto manualmente dall'utente, con uso esclusivo del primo foglio `Lista`.
- Output: file ODS generato dall'app con foglio principale e viste derivate equivalenti.
- Persistenza locale: storage browser strutturato.
  `Inference:` IndexedDB e' il candidato naturale per la sorgente operativa locale.

### Constraints and compliance

- L'MVP non deve dipendere da backend o servizi cloud.
- `Lista` e' la sola sorgente autorevole di import.
- `Appoggio` e `Risultati` non devono essere trattati come sorgenti operative.
- Le formule del file sorgente non devono essere il motore logico interno dell'app.
- Il sistema deve supportare versionamento schema per proteggere upgrade futuri e compatibilita' dei dati locali.

## Business rules

- L'unita' di business MVP e' `titolo`, non la riga piatta del foglio.
- Titoli identici appartengono allo stesso record logico.
- Le sotto-varianti restano distinte e non vengono consolidate automaticamente.
- Le righe con titolo vuoto ereditano il titolo dalla riga precedente.
- `Appoggio` e `Risultati` sono output derivati e non fonti da importare.
- In `Appoggio`, ogni riga deriva da una riga di `Lista`: il titolo e' il titolo esplicito o fill-down, lo stato e' il valore della colonna stato della stessa riga.
- In `Risultati`, la colonna titoli deriva dall'elenco dei titoli unici non vuoti di `Lista`.
- In `Risultati`, un titolo vale `x` se esiste almeno una occorrenza con stato `OK`, oppure se tutte le sue occorrenze hanno stato `Uscito fuori` e/o `Non reperibile`.
- In `Risultati`, un titolo vale `-` in tutti gli altri casi.
- In `Risultati`, i conteggi finali sono:
  `Mancanti = numero di titoli con valore -`,
  `Ok = numero di titoli con valore x`,
  `Total = somma dei due conteggi`.
- L'export deve essere quasi identico sul piano operativo: stessi fogli, stessa logica derivata, preservazione dell'ordine operativo e struttura molto vicina al campione.
- `Inference:` non e' richiesto replicare bug o omissioni accidentali del file campione.

## Data considerations

- Fatti confermati dal file analizzato:
  `Lista` ha 1571 righe non vuote e 5 colonne effettive.
- Fatti confermati dal file analizzato:
  i titoli unici non vuoti sono 1049.
- Fatti confermati dal file analizzato:
  316 titoli compaiono su piu' righe.
- Fatti confermati dal file analizzato:
  521 righe di `Lista` hanno titolo vuoto e richiedono fill-down.
- Fatti confermati dal file analizzato:
  `Appoggio` contiene 1569 righe non vuote, due in meno della proiezione attesa da `Lista`.
- Fatti confermati dal file analizzato:
  le righe mancanti in `Appoggio` rispetto alla proiezione attesa riguardano `Final Fantasy X` con stato `Da comprare`.
- `Inference:` la pipeline di import deve separare parse ODS, applicazione fill-down e modellazione dominio per ridurre il rischio di drift.

## Assumptions

- Il foglio `Lista` continuera' a essere la sola sorgente di import nel MVP.
- Il contratto a 5 colonne e' abbastanza stabile da congelare il modello iniziale.
- L'utente primario coincide con chi approva i tradeoff di prodotto.
- La fedelta' richiesta dell'ODS riguarda il comportamento operativo e la struttura d'uso, non la replica cieca di ogni formula o difetto del campione.

## Dependencies

- Parsing affidabile di ODS in ingresso.
- Generazione affidabile di ODS in uscita.
- Storage locale versionato.
- Definizione UI dei flussi di import, elenco, filtro, dettaglio, modifica e export coerente con il modello `titolo + sotto-varianti`.

## Risks and conflicts

- Rischio contrattuale di import: se il mapping tra `Lista` e modello interno cambia, si propagano errori su tutto il sistema.
- Rischio qualita' dati: gli stati reali non sono omogenei e possono degradare filtri e reporting.
- Rischio export: l'obiettivo `quasi identico` puo' espandere rapidamente lo scope se non viene interpretato in termini operativi.
- Rischio usabilita': una PWA tecnicamente corretta ma scomoda da Android fallisce l'obiettivo principale.
- Rischio regressione: un errore nella logica di fill-down, ordinamento o rigenerazione viste contamina import, UI ed export.

## Open questions

- `Open question:` il criterio numerico preciso di performance su Android non e' ancora formalizzato.
- `Open question:` resta da decidere se l'ODS esportato debba includere formule materializzate, formule ricostruite o soli valori statici, pur mantenendo output quasi identico sul piano operativo.

## Priorities

Scala priorita':

- `P0`: indispensabile per fiducia nei dati e usabilita' MVP.
- `P1`: importante per continuita' operativa, ma semplificabile se necessario.
- `P2`: miglioramento successivo alla validazione MVP.

Priorita' principali:

- `P0`: import ODS, fill-down, modello `titolo + sotto-varianti`, persistenza locale, offline, ricerca, filtri, dettaglio, modifica, creazione, conferma overwrite.
- `P0`: export ODS usabile e quasi identico sul piano operativo.
- `P0`: rigenerazione corretta di `Appoggio` e `Risultati` secondo la logica osservata.
- `P1`: schermata stato archivio.
- `P2`: fedelta' avanzata di layout o formule oltre il minimo necessario per equivalenza operativa.

## Traceability notes

- L'obiettivo di ridurre attrito ed errori su Android traccia a offline-first, lista mobile, dettaglio e modifica rapidi.
- L'obiettivo di mantenere portabilita' e continuita' operativa traccia a import sicuro, modello normalizzato ed export ODS quasi identico.
- Il bisogno di gestire titoli con piu' varianti traccia al modello `titolo + sotto-varianti`, alla preservazione dell'ordine sorgente e alla modifica distinta delle varianti.
- Il bisogno di capire cosa e' presente o mancante traccia alla rigenerazione di `Risultati`.
- Il bisogno di conservare una proiezione operativa semplice di titolo e stato traccia alla rigenerazione di `Appoggio`.
