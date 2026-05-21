# Use Cases MVP - PWA offline-first per archivio derivato da `1001.ods`

## 1. Scopo del documento

Questo documento dettaglia gli use case MVP della PWA offline-first che sostituisce l'uso quotidiano del file ODS come interfaccia operativa. Il focus e' definire flussi implementabili e verificabili, abbastanza precisi da poter essere trasformati in user stories, acceptance criteria e task tecnici.

## 2. Attori

- `Utente proprietario archivio`
  Persona che consulta, aggiorna, amplia ed esporta l'archivio. Usa principalmente Android e secondariamente desktop.
- `Sistema PWA locale`
  Applicazione offline-first che importa, memorizza, visualizza, modifica e riesporta i dati.
- `File ODS`
  Supporto di input/output operativo. In ingresso fornisce il foglio `Lista`; in uscita riceve un archivio esportato con fogli equivalenti a `Lista`, `Appoggio` e `Risultati`.

## 3. Regole trasversali

- L'unita' primaria del modello MVP e' `Titolo`.
- Ogni `Titolo` contiene una o piu' `Sotto-varianti`.
- Ogni `Sotto-variante` gestisce almeno i campi `piattaforma`, `edizione/versione`, `supporto`, `stato`.
- L'import usa solo il primo foglio operativo `Lista`.
- Le righe con titolo vuoto ereditano il titolo dalla riga precedente secondo logica di fill-down.
- Le righe con lo stesso titolo diventano un solo record `Titolo` con piu' `Sotto-varianti`.
- Un nuovo import sostituisce completamente l'archivio locale solo dopo conferma esplicita dell'utente.
- L'app deve restare utilizzabile offline per consultazione, modifica, creazione ed export.
- `Appoggio` e `Risultati` non sono sorgenti di import: vengono rigenerati programmaticamente dall'archivio locale.
- L'ordine delle sotto-varianti deve restare visibile e preservato.

## 4. Use Cases MVP

### UC-01 - Importare un archivio ODS

**Obiettivo**  
Consentire all'utente di caricare un archivio ODS nel formato atteso e sostituire l'archivio locale corrente.

**Attore primario**  
Utente proprietario archivio

**Precondizioni**

- L'app e' installata o aperta nel browser.
- L'utente dispone di un file ODS accessibile dal dispositivo.
- Il sistema e' in grado di leggere file locali senza dipendere dalla rete.

**Trigger**

- L'utente avvia l'azione di import dall'interfaccia.

**Flusso principale**

1. L'utente seleziona il file ODS da importare.
2. Il sistema legge il foglio `Lista`.
3. Il sistema applica fill-down ai titoli mancanti.
4. Il sistema raggruppa le righe per `titolo`.
5. Il sistema costruisce i record `Titolo` con relative `Sotto-varianti`, preservando l'ordine sorgente delle righe importate.
6. Il sistema mostra che l'import sostituira' completamente l'archivio locale corrente.
7. L'utente conferma la sostituzione.
8. Il sistema salva il nuovo archivio in storage locale persistente.
9. Il sistema aggiorna i metadati minimi dell'archivio.
10. Il sistema rende disponibile il nuovo archivio per consultazione e modifica.

**Flussi alternativi / eccezioni**

- Se il file non e' leggibile, il sistema interrompe l'import e segnala errore.
- Se il foglio `Lista` non e' presente o non e' interpretabile nel formato atteso, il sistema non sostituisce i dati locali.
- Se l'utente annulla la conferma, il sistema non modifica l'archivio locale.
- Se non esiste un archivio locale precedente, la conferma puo' essere semplificata ma l'import resta esplicito.

**Postcondizioni**

- L'archivio locale attivo corrisponde all'ultimo import confermato.
- I record sono disponibili nel modello `Titolo + Sotto-varianti`.
- L'ordine sorgente delle sotto-varianti e' preservato.
- I metadati minimi risultano aggiornati.

**Dati / regole coinvolte**

- Sorgente unica: foglio `Lista`
- Contratto colonne: `titolo`, `piattaforma`, `edizione/versione`, `supporto`, `stato`
- Preservazione dell'ordine sorgente delle sotto-varianti
- Sostituzione completa dataset locale

**Sbocco backlog**

- Story candidate: import archivio, validazione input, conferma overwrite, persistenza locale
- Dipendenze: parser ODS, normalizzazione, schema storage, metadata dataset

### UC-02 - Consultare lo stato dell'archivio dalla dashboard

**Obiettivo**  
Consentire all'utente di aprire l'app e capire rapidamente lo stato dell'archivio attivo.

**Attore primario**  
Utente proprietario archivio

**Precondizioni**

- Esiste un archivio locale attivo oppure l'app segnala chiaramente che non e' ancora stato importato alcun archivio.

**Trigger**

- L'utente apre l'app.

**Flusso principale**

1. Il sistema mostra la dashboard iniziale.
2. Il sistema espone il campo di ricerca in posizione primaria.
3. Il sistema mostra quick actions verso elenco, import, export e creazione record.
4. Il sistema mostra almeno archivio attivo, numero record, ultima modifica locale e versione schema.
5. L'utente decide se cercare, consultare l'elenco o avviare un'azione secondaria.

**Flussi alternativi / eccezioni**

- Se non esiste un archivio attivo, il sistema mostra stato vuoto e guida l'utente verso l'import.
- Se i dati locali non sono disponibili temporaneamente, il sistema impedisce azioni incoerenti e segnala il problema.

**Postcondizioni**

- L'utente ha un punto di ingresso chiaro alle operazioni principali.
- Lo stato minimo dell'archivio e' visibile senza aprire viste secondarie.

**Dati / regole coinvolte**

- Metadati archivio locale
- Dashboard come schermata iniziale
- Ricerca in posizione primaria
- Priorita' mobile-first

**Sbocco backlog**

- Story candidate: dashboard iniziale, stato archivio, quick actions
- Dipendenze: metadata store, routing principale

### UC-03 - Cercare e filtrare i titoli

**Obiettivo**  
Consentire all'utente di trovare rapidamente un titolo e ridurre l'elenco tramite filtri di stato.

**Attore primario**  
Utente proprietario archivio

**Precondizioni**

- Esiste un archivio locale attivo con record importati o creati.

**Trigger**

- L'utente inserisce una ricerca oppure applica un filtro.

**Flusso principale**

1. L'utente apre l'elenco dei titoli o usa la ricerca dalla dashboard.
2. Il sistema mostra l'elenco dei record `Titolo`.
3. L'utente inserisce un testo di ricerca.
4. Il sistema aggiorna i risultati in base al titolo cercato.
5. L'utente applica uno o piu' filtri di stato.
6. Il sistema restringe l'elenco ai record compatibili.
7. L'utente seleziona un titolo dai risultati.

**Flussi alternativi / eccezioni**

- Se nessun titolo corrisponde, il sistema mostra risultato vuoto senza perdere il contesto di ricerca.
- Se i filtri producono zero risultati, il sistema consente di rimuoverli rapidamente.

**Postcondizioni**

- L'utente individua piu' velocemente il record di interesse.
- Il sistema mantiene una vista coerente tra ricerca, filtri e selezione del record.

**Dati / regole coinvolte**

- Ricerca per titolo
- Supporto all'intero vocabolario stati presente nell'archivio
- Accesso rapido agli stati piu' frequenti senza nascondere quelli meno comuni

**Sbocco backlog**

- Story candidate: archive list, search, status filters
- Dipendenze: indice ricerca locale, modellazione stati, UI mobile list

### UC-04 - Aprire e leggere il dettaglio di un titolo

**Obiettivo**  
Consentire all'utente di comprendere rapidamente un record logico e le sue sotto-varianti.

**Attore primario**  
Utente proprietario archivio

**Precondizioni**

- Il titolo esiste nell'archivio locale.

**Trigger**

- L'utente seleziona un titolo dall'elenco o dalla ricerca.

**Flusso principale**

1. Il sistema apre la vista di dettaglio del titolo.
2. Il sistema mostra l'identita' del titolo come record primario.
3. Il sistema mostra le sotto-varianti in ordine preservato.
4. Per ogni sotto-variante il sistema espone almeno `piattaforma`, `edizione/versione`, `supporto`, `stato`.
5. L'utente legge il dettaglio e decide se tornare all'elenco o entrare in modifica.

**Flussi alternativi / eccezioni**

- Se il record non e' piu' disponibile, il sistema informa l'utente e lo riporta a una vista consistente.

**Postcondizioni**

- L'utente comprende il titolo senza dover interpretare righe spreadsheet separate.
- Il record e le sue sotto-varianti restano leggibili in modalita' scan-first.

**Dati / regole coinvolte**

- Titolo come record primario
- Sotto-varianti ordinate
- Vista read-first, non spreadsheet-like
- Modifica avviata solo da azione esplicita

**Sbocco backlog**

- Story candidate: title detail, ordered variants, read-first mobile detail
- Dipendenze: detail routing, normalized model, variant rendering

### UC-05 - Modificare un titolo o una sotto-variante

**Obiettivo**  
Consentire all'utente di aggiornare localmente i dati di un record esistente.

**Attore primario**  
Utente proprietario archivio

**Precondizioni**

- Esiste un record titolo gia' presente nell'archivio locale.
- L'utente ha aperto il dettaglio del titolo.

**Trigger**

- L'utente avvia l'azione di modifica.

**Flusso principale**

1. L'utente entra esplicitamente in modalita' modifica dal dettaglio.
2. Il sistema rende modificabili i campi del titolo e delle sotto-varianti previsti dal modello MVP.
3. L'utente aggiorna i dati del titolo o di una sotto-variante.
4. L'utente salva le modifiche.
5. Il sistema valida che ogni sotto-variante mantenga i campi obbligatori `piattaforma`, `edizione/versione`, `supporto`, `stato`.
6. Il sistema persiste le modifiche nello storage locale.
7. Il sistema aggiorna la vista di dettaglio e i metadati di ultima modifica.

**Flussi alternativi / eccezioni**

- Se i dati obbligatori minimi non sono validi, il sistema blocca il salvataggio e segnala cosa correggere.
- Se l'utente annulla la modifica, il sistema non persiste cambiamenti.

**Postcondizioni**

- Il record aggiornato e' immediatamente visibile in dettaglio, elenco e ricerca.
- L'archivio locale conserva la modifica anche offline.

**Dati / regole coinvolte**

- Ogni sotto-variante deve avere `piattaforma`, `edizione/versione`, `supporto`, `stato`
- Persistenza locale
- Aggiornamento metadata archivio

**Sbocco backlog**

- Story candidate: edit title, edit variant, local validation, save workflow
- Dipendenze: form state, schema validation, persistence layer

### UC-06 - Creare un nuovo titolo

**Obiettivo**  
Consentire all'utente di aggiungere un nuovo record all'archivio senza passare da un file ODS esterno.

**Attore primario**  
Utente proprietario archivio

**Precondizioni**

- L'app e' operativa e lo storage locale e' disponibile.

**Trigger**

- L'utente avvia l'azione di creazione nuovo record.

**Flusso principale**

1. L'utente apre il flusso di creazione.
2. Il sistema mostra un form per il nuovo `Titolo`.
3. Il sistema richiede almeno i dati minimi necessari per creare il titolo e una prima sotto-variante con `piattaforma`, `edizione/versione`, `supporto`, `stato`.
4. L'utente compila i campi.
5. L'utente conferma il salvataggio.
6. Il sistema valida il contenuto.
7. Il sistema salva il nuovo record nell'archivio locale.
8. Il sistema rende il nuovo titolo disponibile in elenco, ricerca e dettaglio.

**Flussi alternativi / eccezioni**

- Se i dati minimi non sono completi, il sistema impedisce il salvataggio.
- Se l'utente annulla il flusso, nessun nuovo record viene creato.

**Postcondizioni**

- L'archivio contiene un nuovo titolo con almeno una sotto-variante.
- Il record e' esportabile nel successivo ODS.

**Dati / regole coinvolte**

- Creazione locale diretta
- Coerenza con il modello normalizzato
- Obbligatorieta' dei 4 campi minimi per ogni sotto-variante

**Sbocco backlog**

- Story candidate: create title, initial variant, local save
- Dipendenze: create form, validation rules, list refresh

### UC-07 - Esportare l'archivio in ODS

**Obiettivo**  
Consentire all'utente di ottenere un file ODS operativo derivato dall'archivio locale aggiornato.

**Attore primario**  
Utente proprietario archivio

**Precondizioni**

- Esiste un archivio locale attivo.

**Trigger**

- L'utente avvia l'azione di export.

**Flusso principale**

1. L'utente richiede l'export.
2. Il sistema legge l'archivio locale corrente.
3. Il sistema ricostruisce il foglio equivalente a `Lista` dal modello normalizzato, preservando l'ordine operativo delle sotto-varianti.
4. Il sistema rigenera programmaticamente `Appoggio` come proiezione riga-per-riga di `Lista`, con titolo esplicito o fill-down e stato copiato dalla riga sorgente.
5. Il sistema rigenera programmaticamente `Risultati` come riepilogo per titolo unico non vuoto, con valore `x` se esiste almeno una occorrenza `OK` oppure se tutte le occorrenze sono `Uscito fuori` e/o `Non reperibile`, altrimenti `-`.
6. Il sistema produce il file ODS esportabile.
7. Il sistema rende disponibile il file all'utente.

**Flussi alternativi / eccezioni**

- Se l'archivio locale non e' disponibile, il sistema blocca l'export.
- Se la generazione ODS fallisce, il sistema non produce un file parziale come risultato valido.

**Postcondizioni**

- L'utente dispone di un ODS aggiornato e operativamente vicino al file di partenza.

**Dati / regole coinvolte**

- Ricostruzione `Lista`
- `Appoggio` come proiezione riga-per-riga di `Lista`
- `Risultati` come riepilogo per titolo unico con regola `x / -`
- Fedelta' operativa, non replica obbligatoria formula-per-formula

**Sbocco backlog**

- Story candidate: export ODS, generate derived sheets, download/share result
- Dipendenze: ODS writer, export mapping, derived views logic

## 5. Regole funzionali da confermare o preservare

- Il titolo e' la chiave di raggruppamento funzionale in import.
- Le sotto-varianti non vengono consolidate automaticamente oltre il raggruppamento per titolo.
- Ogni sotto-variante deve avere sempre `piattaforma`, `edizione/versione`, `supporto`, `stato`.
- L'ordine sorgente delle sotto-varianti va preservato in import, persistenza ed export.
- Lo stato resta un attributo di sotto-variante.
- `Appoggio` e' una proiezione riga-per-riga di `Lista` con titolo fill-down e stato della stessa riga.
- `Risultati` e' un riepilogo per titolo unico non vuoto con regola esplicita di classificazione `x / -`.
- L'utente deve poter lavorare offline senza perdita del dataset locale attivo.
- La dashboard e' il punto di ingresso principale dell'app.
- Import ed export sono flussi secondari rispetto a consultazione, ricerca, dettaglio e modifica.
- L'interfaccia deve restare mobile-first e orientata alla lettura rapida.

## 6. Dipendenze tecniche trasversali

- Parser ODS per lettura del foglio `Lista`
- Normalizzazione dati con fill-down del titolo
- Storage locale persistente con versionamento schema
- Logica di ricerca e filtro locale
- Writer ODS per export del workbook finale
- Rigenerazione in codice delle viste equivalenti a `Appoggio` e `Risultati`
- Routing e UI mobile-first per dashboard, elenco, dettaglio, modifica e creazione

## 7. Prontezza per backlog engineering

Gli use case sono sufficienti per derivare nel passo successivo:

- user stories orientate a valore utente
- acceptance criteria testabili
- task tecnici per import, storage, UI, ricerca, modifica ed export

Punti ancora aperti ma non bloccanti per questo documento:

- definizione precisa della fedelta' attesa dell'ODS in uscita su layout e formule
- formalizzazione di un criterio numerico minimo di performance su Android
