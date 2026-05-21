# User Stories MVP - PWA offline-first per archivio derivato da `1001.ods`

## 1. User Story or Stories

### ST-01 - Importare e attivare un archivio ODS

- `ID`: ST-01
- `Title`: Import and activate archive
- `Priority`: P0
- `Role`: Proprietario archivio
- `Story`: Come proprietario dell'archivio, voglio importare un file ODS compatibile e attivarlo come dataset locale corrente, cosi' da poter lavorare offline su una base dati strutturata invece che sul foglio di calcolo.
- `Value`: Sblocca tutto il flusso MVP e riduce la dipendenza dall'ODS come interfaccia operativa.
- `Dependencies`: Parser ODS, mapping del foglio `Lista`, normalizzazione con fill-down, storage locale, conferma overwrite.
- `Assumptions`: Il primo foglio `Lista` resta l'unica sorgente di import MVP.
- `Technical notes`: Il sistema deve preservare l'ordine sorgente delle righe e trasformarle in `Titolo + Sotto-varianti`.
- `Edge cases`: File illeggibile, foglio `Lista` mancante, utente che annulla la sostituzione, archivio locale assente.

### ST-02 - Consultare dashboard, elenco, ricerca e filtri

- `ID`: ST-02
- `Title`: Browse archive from dashboard
- `Priority`: P0
- `Role`: Proprietario archivio
- `Story`: Come proprietario dell'archivio, voglio aprire l'app su una dashboard mobile-first e trovare rapidamente un titolo tramite elenco, ricerca e filtri, cosi' da consultare l'archivio senza frizione da smartphone.
- `Value`: Copre il bisogno principale di consultazione rapida da Android.
- `Dependencies`: Routing UI, metadata archivio, query locale, modellazione stati, lista mobile.
- `Assumptions`: La dashboard e' la home dell'app e la ricerca e' l'azione primaria.
- `Technical notes`: I filtri devono supportare tutto il vocabolario stati, con accesso rapido agli stati piu' frequenti.
- `Edge cases`: Archivio vuoto, nessun risultato di ricerca, filtri che producono zero risultati.

### ST-03 - Aprire e comprendere il dettaglio di un titolo

- `ID`: ST-03
- `Title`: Read title detail
- `Priority`: P0
- `Role`: Proprietario archivio
- `Story`: Come proprietario dell'archivio, voglio aprire un titolo e vedere chiaramente le sue sotto-varianti ordinate, cosi' da capire il record logico senza dover interpretare righe spreadsheet separate.
- `Value`: Riduce il carico cognitivo e rende leggibile il modello `Titolo + Sotto-varianti`.
- `Dependencies`: Vista dettaglio, modello normalizzato, rendering ordinato delle sotto-varianti.
- `Assumptions`: Il dettaglio e' read-first e l'editing parte solo da un'azione esplicita.
- `Technical notes`: Ogni sotto-variante deve mostrare almeno `piattaforma`, `edizione/versione`, `supporto`, `stato`.
- `Edge cases`: Record non piu' disponibile, titolo con molte sotto-varianti.

### ST-04 - Modificare un titolo o una sotto-variante

- `ID`: ST-04
- `Title`: Edit existing archive data
- `Priority`: P0
- `Role`: Proprietario archivio
- `Story`: Come proprietario dell'archivio, voglio modificare localmente un titolo o una sua sotto-variante, cosi' da mantenere aggiornato l'archivio senza tornare al file ODS.
- `Value`: Copre il flusso operativo quotidiano di aggiornamento dati.
- `Dependencies`: Stato form, validazione, persistenza locale, refresh lista/dettaglio.
- `Assumptions`: Ogni sotto-variante deve mantenere sempre i 4 campi obbligatori del modello MVP.
- `Technical notes`: Il salvataggio deve aggiornare anche i metadata minimi dell'archivio.
- `Edge cases`: Dati obbligatori mancanti, annullamento modifica, modifica offline dopo import precedente.

### ST-05 - Creare un nuovo titolo

- `ID`: ST-05
- `Title`: Create new title
- `Priority`: P0
- `Role`: Proprietario archivio
- `Story`: Come proprietario dell'archivio, voglio creare un nuovo titolo con almeno una sotto-variante, cosi' da ampliare l'archivio direttamente nell'app.
- `Value`: Evita che l'utente debba ricorrere al file esterno per inserire nuovi record.
- `Dependencies`: Form creazione, validazione, persistenza locale, aggiornamento elenco e ricerca.
- `Assumptions`: La creazione minima richiede titolo e una prima sotto-variante completa.
- `Technical notes`: Ogni nuova sotto-variante deve includere `piattaforma`, `edizione/versione`, `supporto`, `stato`.
- `Edge cases`: Salvataggio con campi incompleti, annullamento creazione.

### ST-06 - Esportare l'archivio in ODS operativo

- `ID`: ST-06
- `Title`: Export operational ODS
- `Priority`: P0
- `Role`: Proprietario archivio
- `Story`: Come proprietario dell'archivio, voglio esportare un ODS aggiornato dell'archivio locale, cosi' da mantenere portabilita' e continuita' operativa rispetto al file attuale.
- `Value`: Chiude il ciclo operativo dell'MVP e mantiene il formato esterno riutilizzabile.
- `Dependencies`: Writer ODS, mapping export di `Lista`, rigenerazione di `Appoggio`, rigenerazione di `Risultati`.
- `Assumptions`: L'equivalenza operativa e' obbligatoria; la strategia finale su formule ricostruite vs valori statici e' ancora una decisione tecnica aperta.
- `Technical notes`: `Appoggio` e `Risultati` devono essere derivati dal dataset locale e non da formule importate.
- `Edge cases`: Export con archivio non disponibile, fallimento generazione file, differenze tra output logico e layout finale.

## 2. Acceptance Criteria

### ST-01 - Importare e attivare un archivio ODS

- Given un file ODS compatibile, when l'utente avvia l'import, then il sistema legge il foglio `Lista` senza richiedere rete.
- Given righe con titolo vuoto in `Lista`, when il sistema normalizza l'import, then applica fill-down dal titolo precedente.
- Given piu' righe con lo stesso titolo, when l'import e' completato, then il sistema crea un solo record `Titolo` con sotto-varianti distinte e in ordine sorgente preservato.
- Given un archivio locale gia' esistente, when l'utente conferma l'import, then il sistema sostituisce completamente il dataset locale.
- Given un archivio locale gia' esistente, when l'utente annulla la conferma, then il sistema non modifica i dati locali.
- Given un file non valido o illeggibile, when l'import fallisce, then il sistema segnala l'errore e non attiva un dataset parziale.

### ST-02 - Consultare dashboard, elenco, ricerca e filtri

- Given un archivio locale attivo, when l'utente apre l'app, then la dashboard mostra ricerca in posizione primaria e quick actions principali.
- Given un archivio locale attivo, when l'utente apre la dashboard, then il sistema mostra almeno archivio attivo, numero record, ultima modifica locale e versione schema.
- Given un testo di ricerca, when l'utente lo inserisce, then il sistema aggiorna i risultati in base al titolo.
- Given uno o piu' filtri di stato, when l'utente li applica, then il sistema restringe l'elenco ai record compatibili.
- Given stati meno frequenti presenti nell'archivio, when l'utente apre i filtri, then puo' comunque selezionarli senza che siano nascosti dal sistema.
- Given nessun risultato, when ricerca o filtri non trovano record, then il sistema mostra uno stato vuoto chiaro e consente di rimuovere rapidamente i filtri.

### ST-03 - Aprire e comprendere il dettaglio di un titolo

- Given un titolo presente in archivio, when l'utente lo apre, then il sistema mostra il record primario e le sue sotto-varianti ordinate.
- Given una sotto-variante visualizzata, when l'utente consulta il dettaglio, then vede almeno `piattaforma`, `edizione/versione`, `supporto`, `stato`.
- Given la vista dettaglio aperta, when l'utente non entra in modifica, then il contenuto resta in modalita' read-first.
- Given un record non piu' disponibile, when l'utente prova ad aprirlo, then il sistema mostra un messaggio coerente e riporta l'utente a una vista consistente.

### ST-04 - Modificare un titolo o una sotto-variante

- Given un record esistente, when l'utente entra in modifica, then il sistema abilita l'editing solo tramite azione esplicita.
- Given una sotto-variante, when l'utente salva una modifica, then il sistema richiede che `piattaforma`, `edizione/versione`, `supporto`, `stato` siano valorizzati.
- Given modifiche valide, when l'utente salva, then il sistema persiste i dati localmente e aggiorna dettaglio, elenco e ricerca.
- Given modifiche non valide, when l'utente prova a salvare, then il sistema blocca il salvataggio e indica i campi da correggere.
- Given modifica annullata, when l'utente esce senza salvare, then il sistema non persiste cambiamenti.

### ST-05 - Creare un nuovo titolo

- Given il flusso di creazione aperto, when l'utente inserisce titolo e una prima sotto-variante completa, then il sistema consente il salvataggio.
- Given un nuovo record valido, when l'utente salva, then il sistema lo persiste localmente e lo rende disponibile in elenco, ricerca e dettaglio.
- Given dati incompleti nella prima sotto-variante, when l'utente prova a salvare, then il sistema blocca il salvataggio.
- Given creazione annullata, when l'utente esce dal flusso, then nessun nuovo record viene creato.

### ST-06 - Esportare l'archivio in ODS operativo

- Given un archivio locale attivo, when l'utente avvia l'export, then il sistema genera un file ODS senza richiedere rete.
- Given il dataset locale corrente, when il sistema esporta `Lista`, then ricostruisce le righe in ordine operativo coerente con il modello locale.
- Given il dataset locale corrente, when il sistema esporta `Appoggio`, then genera una proiezione riga-per-riga di `Lista` con titolo fill-down e stato della stessa riga.
- Given il dataset locale corrente, when il sistema esporta `Risultati`, then genera il riepilogo per titolo unico non vuoto con regola `x / -` definita dai documenti.
- Given un errore di generazione, when l'export fallisce, then il sistema non presenta il file come risultato valido.

## 3. Functional Flow

1. L'utente apre l'app e arriva sulla dashboard.
2. Se non esiste un archivio attivo, l'utente importa un file ODS e conferma la sostituzione del dataset locale.
3. Il sistema normalizza `Lista` nel modello `Titolo + Sotto-varianti` e attiva il dataset locale.
4. L'utente consulta dashboard, elenco, ricerca e filtri per individuare un titolo.
5. L'utente apre il dettaglio del titolo e legge le sotto-varianti in ordine.
6. L'utente decide se modificare un record esistente o crearne uno nuovo.
7. Il sistema valida i dati obbligatori e salva localmente le modifiche.
8. Quando serve portabilita' esterna, l'utente esporta un nuovo ODS con `Lista`, `Appoggio` e `Risultati`.

## 4. Functional Rules

- Il primo foglio `Lista` e' l'unica sorgente di import nel MVP.
- Il modello di business primario e' `Titolo`, non la singola riga del foglio.
- Le righe con titolo vuoto ereditano il titolo dalla riga precedente.
- Le righe con lo stesso titolo diventano un solo record con sotto-varianti distinte.
- L'ordine sorgente delle sotto-varianti va preservato in import, persistenza ed export.
- Ogni sotto-variante deve avere sempre `piattaforma`, `edizione/versione`, `supporto`, `stato`.
- La dashboard e' la schermata iniziale dell'app.
- Il dettaglio titolo e' read-first; l'editing parte solo da azione esplicita.
- I filtri devono supportare l'intero vocabolario stati presente nei dati reali.
- `Appoggio` e' una proiezione riga-per-riga di `Lista`, non una sorgente dati autonoma.
- `Risultati` e' un riepilogo per titolo unico non vuoto con classificazione `x / -`.
- L'app deve restare pienamente usabile offline per i flussi core.

## 5. Technical Dependencies

- Lettura ODS affidabile del foglio `Lista`.
- Pipeline di normalizzazione con fill-down, grouping per titolo e preservazione ordine.
- Storage locale persistente e versionato.
- Query locale per ricerca e filtri.
- UI mobile-first per dashboard, elenco, dettaglio, modifica e creazione.
- Logica derivata per `Appoggio` e `Risultati`.
- Generazione ODS in uscita con fogli `Lista`, `Appoggio` e `Risultati`.
- Decisione tecnica ancora aperta ma bloccante per chiudere l'export: formule ricostruite vs valori statici materializzati.

## 6. Ready Tasks

- Definire la struttura dati locale per `Titolo`, `Sotto-variante` e metadata archivio.
- Implementare parser import ODS del foglio `Lista`.
- Implementare normalizzazione con fill-down e grouping per titolo.
- Implementare persistenza locale e flusso di overwrite confermato.
- Implementare dashboard con ricerca primaria, quick actions e metadata archivio.
- Implementare lista archivio con ricerca e filtri stato.
- Implementare vista dettaglio titolo con sotto-varianti ordinate.
- Implementare form di modifica record e validazione dei 4 campi obbligatori.
- Implementare form di creazione nuovo titolo con prima sotto-variante obbligatoria.
- Implementare generatori derivati per `Appoggio` e `Risultati`.
- Chiudere la decisione tecnica su formule export vs valori statici prima della finalizzazione del writer ODS.
- Implementare writer ODS finale e validazione del workbook esportato.
- Verificare i flussi core su viewport Android e in modalita' offline.

## 7. Definition of Done

- Le user stories P0 risultano implementate senza dipendenza da rete per i flussi core.
- Import, consultazione, ricerca, filtro, dettaglio, modifica, creazione ed export sono tutti verificabili localmente.
- Il dataset locale mantiene integrita' dopo import, modifica, creazione ed export.
- Le sotto-varianti preservano l'ordine sorgente lungo tutto il ciclo operativo.
- Ogni sotto-variante salvata rispetta i 4 campi obbligatori del modello MVP.
- `Appoggio` e `Risultati` vengono rigenerati dal codice secondo le regole documentate.
- L'ODS esportato e' operativo e coerente con il perimetro MVP concordato.
- I flussi principali risultano usabili su Android in una UI mobile-first.
- Restano esplicitate eventuali limitazioni residue dell'export su formule/layout se non ancora chiuse tecnicamente.
