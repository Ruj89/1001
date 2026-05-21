# Valutazione tecnica di fattibilita - PWA offline-first per archivio derivato da `1001.ods`

## 1. Valutazione di fattibilita

`Parzialmente fattibile`

La richiesta e' tecnicamente realizzabile come MVP e il brief aggiornato chiude ormai gran parte delle ambiguita' di prodotto che bloccavano la valutazione iniziale. La parte PWA offline-first, con storage locale, ricerca, modifica record e import/export ODS, usa building block noti e coerenti con l'obiettivo. L'incertezza principale non riguarda piu' il modello di business di base, ma il livello di fedelta' richiesto nell'ODS in uscita e la precisione con cui le viste derivate debbano essere ricostruite.

L'analisi del file `1001.ods` ha chiarito alcuni fatti rilevanti:

- `Lista` e' il foglio sorgente principale, con 1571 righe non vuote e 5 colonne effettive;
- i titoli unici sono 1049, ma 316 di questi compaiono su piu' righe;
- 521 righe di `Lista` hanno il titolo vuoto e ne ereditano implicitamente il valore dalla riga precedente;
- `Appoggio` e' quasi una proiezione `titolo + stato`, ma non e' perfettamente affidabile perche' mancano 2 righe;
- `Risultati` e `Appoggio` sono tabelle di elaborazione del primo foglio e non devono essere trattati come sorgenti operative da importare;
- la PWA dovra' ricostruire programmaticamente analisi e viste derivate a partire dai dati importati dal primo foglio, senza dipendere da formule spreadsheet.

La fattibilita' migliora sensibilmente se il primo rilascio viene trattato come archivio locale con import del primo foglio ODS, modello interno `titolo + sotto-varianti`, rigenerazione in codice delle viste derivate ed export finale in ODS, senza sincronizzazione multi-dispositivo.

## 2. Livello di complessita

`High`

I driver principali della complessita' sono:

- il file ODS non rappresenta un modello dati piatto e univoco, ma una struttura con righe di continuazione;
- il modello applicativo corretto non e' la singola riga del foglio, ma un `titolo` con una o piu' `sotto-varianti`;
- l'import richiede normalizzazione, possibile deduplicazione e gestione di valori impliciti o incoerenti;
- l'app deve funzionare bene offline su Android, quindi UX, persistenza e recupero dati devono essere robusti;
- l'app deve ricostruire programmaticamente report e viste derivate senza appoggiarsi alle formule del file ODS;
- l'app deve generare un ODS in uscita molto simile al file attuale sul piano operativo.

La complessita' non e' alta per la tecnologia PWA in se', ma per l'accoppiamento tra migrazione dati, semantica del dominio e qualita' operativa su mobile.

## 3. Rischi tecnici

- `Contratto di import tra primo foglio e modello interno`  
  Il brief chiarisce che l'entita' primaria e' `titolo con sotto-varianti`, ma resta delicata la traduzione stabile dalle righe del primo foglio a questa struttura. Se il contratto di import non viene definito in modo rigido, aumentano errori di normalizzazione, perdita di informazioni e instabilita' nell'export.  
  Riduzione incertezza: formalizzare il mapping tra righe ODS e struttura `titolo + sotto-varianti`, con campi minimi, ordine e regole di fill-down esplicite.

- `Normalizzazione del primo foglio ODS`  
  L'import e' un punto critico: `Lista` usa fill-down implicito del titolo, contiene righe ripetute per la stessa opera e non esplicita sempre tutte le dimensioni del record in una singola riga autonoma. Se la pipeline di normalizzazione e' fragile, l'intero MVP perde affidabilita'.  
  Riduzione incertezza: definire una pipeline esplicita primo foglio ODS -> struttura intermedia con fill-down applicato -> modello interno normalizzato, con test su casi anomali reali.

- `Qualita' dei dati sorgente`  
  Gli stati sono numerosi e non completamente omogenei: l'analisi ha rilevato 20 valori distinti nel campo stato, inclusi casi come `Non reperibile`, `Uscito fuori`, `Remake` ed `Estratto incompleto non funzionante`. Stati sovrapposti, valori non standardizzati e campi semantici impliciti possono impedire filtri affidabili e metriche corrette.  
  Riduzione incertezza: profilazione del dataset, catalogazione delle varianti di stato e regole minime di normalizzazione prima di congelare lo schema MVP.

- `Persistenza locale e versionamento schema`  
  IndexedDB e' appropriato, ma senza strategia di versionamento, backup e recovery aumenta il rischio di perdita dati o incompatibilita' tra versioni dell'app.  
  Riduzione incertezza: definire da subito schema version, metadata del dataset, routine di export/import e comportamento su upgrade.

- `Fedelta' dell'ODS in uscita`  
  Il brief richiede ODS sia in ingresso sia in uscita, e l'output deve risultare molto simile al file attuale. Il rischio principale non e' solo scrivere un ODS valido, ma farlo con una struttura abbastanza vicina da essere accettabile sul piano operativo senza imporre una replica tecnica completa di formule o layout.  
  Riduzione incertezza: definire cosa significhi concretamente `molto simile` o `quasi identico` in termini di fogli, ordinamento, layout e formule.

- `Usabilita' reale su Android`  
  Un'app tecnicamente corretta ma lenta da consultare o scomoda da aggiornare fallirebbe l'obiettivo principale del brief.  
  Riduzione incertezza: validare presto ricerca, filtri, dettaglio e modifica su viewport mobile e tastiera software.

- `Affidabilita' delle viste derivate`  
  `Risultati` e `Appoggio` non sono sorgenti da migrare, ma output derivati del primo foglio. Il rischio non e' importarle male, ma ricostruire in modo incompleto o incoerente solo le elaborazioni minime realmente utili nella PWA.  
  Riduzione incertezza: trattare `Lista` come unica sorgente primaria e definire esplicitamente quali metriche, aggregazioni e viste derivate l'app deve rigenerare in codice.

- `Overwrite operativo del dataset locale`  
  Ogni nuovo import ODS sostituisce completamente i dati locali esistenti. Il rischio non e' architetturale in senso stretto, ma di perdita operativa o flussi poco chiari se la conferma e il comportamento di sostituzione non sono robusti.  
  Riduzione incertezza: definire il flusso minimo di conferma, fallback ed export pre-sostituzione.

## 4. Analisi dell'impatto sospetto

- `Dati`  
  Impatto alto. Serve un nuovo modello dati applicativo, una mappatura esplicita dal foglio ODS e una gestione dei metadati minimi dell'archivio come versione schema, ultima modifica e provenienza import. Il mapping deve partire da `Lista` con fill-down del titolo e sfociare in record `titolo` con relative sotto-varianti.

- `API`  
  Impatto basso o nullo nell'MVP, se l'app resta locale e senza backend. Dovrebbero esistere interfacce interne separate almeno per import ODS, storage normalizzato, generazione viste derivate ed export ODS.

- `Permessi`  
  Impatto basso. In una PWA locale i permessi sono limitati al browser e, opzionalmente, alla scelta manuale di file in import/export. Non emergono requisiti di ruoli o multiutente nel brief.

- `Report`  
  Impatto medio. `Risultati` va reinterpretato come requisito di reporting da ricostruire nella PWA, mentre `Appoggio` va reinterpretato come proiezione derivata semplificata. Serve definire quali conteggi, stati aggregati e viste sintetiche debbano essere generati dal codice applicativo.

- `Integrazioni`  
  Impatto medio nell'MVP. L'unica integrazione concreta e' il flusso ODS read/write. Non sono richieste integrazioni esterne o sync cloud, ma servono un parser affidabile del primo foglio e un writer ODS abbastanza fedele sul piano operativo.

- `Operations`  
  Impatto medio. Anche senza backend, esistono responsabilita' operative locali: versionamento schema, gestione upgrade, overwrite sicuro del dataset locale, supporto al recovery e comportamento offline prevedibile.

- `Regression surface`  
  Impatto medio-alto. Il rischio di regressione non riguarda sistemi esterni, ma la coerenza interna tra import, visualizzazione, filtri, modifica, viste derivate ed export ODS. Un errore di mapping puo' propagarsi in tutta l'app.

## 5. Alternative

- `Modello normalizzato con import/export ODS e viste derivate generate in codice`  
  E' l'opzione piu' coerente con il brief: importa solo il primo foglio, normalizza i dati in record `titolo + sotto-varianti`, rigenera le viste derivate e produce un ODS in uscita coerente con il flusso attuale.  
  Tradeoff: richiede lavoro iniziale su schema, normalizzazione, writer ODS e ricostruzione in codice delle elaborazioni minime utili.  
  Raccomandazione: opzione preferita.

- `Modello interno vicino al foglio di calcolo`  
  Riduce il lavoro iniziale di modellazione e puo' sembrare piu' rapido da avviare.  
  Tradeoff: conserva i limiti strutturali del foglio, inclusi fill-down impliciti, fragilita' dell'editing mobile e accoppiamento forte con la forma del file. Peggiora coerenza del prodotto e della UI.

- `Replica stretta del file ODS`  
  Punta a preservare quasi integralmente struttura, layout e logiche del file attuale.  
  Tradeoff: massimizza la fedelta' apparente, ma aumenta fortemente fragilita', costo e dipendenza dalla logica spreadsheet. E' l'opzione meno razionale per un MVP di prodotto.

La scelta piu' sicura e' un modello normalizzato con import/export ODS e viste derivate generate in codice, accettando il costo iniziale di chiarimento del modello dati e della fedelta' di export.

## 6. Ordine di grandezza dello sforzo

`Large`

Il range e' ora abbastanza stabile per una stima relativa: il lavoro vero e' nella normalizzazione, nella modellazione e nell'export ODS, non nel rendering della UI. I driver principali dello sforzo sono:

- parser/import del primo foglio;
- modello `titolo + sotto-varianti`;
- rigenerazione delle viste derivate;
- writer/export ODS con fedelta' operativa sufficiente.

Se il perimetro resta quello del brief ridotto, con import ODS, consultazione, ricerca, filtri base, editing locale, rigenerazione minima delle viste ed export ODS, lo sforzo resta grande ma gestibile. Se invece l'export dovesse richiedere una replica molto stretta di ordinamento, layout e formule del file attuale, il range salirebbe rapidamente verso `very large`.

## 7. Domande bloccanti

- Che cosa significa esattamente `ODS molto simile` o `quasi identico` in uscita: sola equivalenza logica dei fogli, oppure anche ordinamento, layout e formule molto vicini all'originale?
- Il significato operativo delle 5 colonne di `Lista` e' ormai abbastanza inferibile come `titolo`, `piattaforma`, `edizione/versione`, `supporto`, `stato`; va pero' confermato se esistano eccezioni da modellare in modo diverso.
- Quali elaborazioni minime di `Risultati` e `Appoggio` devono essere effettivamente preservate nella PWA come viste o metriche generate dal codice?
- Qual e' la regola minima accettabile per collegare, ordinare o consolidare le 316 opere che oggi compaiono su piu' righe all'interno del modello `titolo + sotto-varianti`?

In assenza di una definizione piu' precisa della fedelta' dell'ODS in uscita, la raccomandazione tecnica implicita resta `go after spike`: procedere con una breve validazione su modello dati, pipeline di import e writer ODS prima di impegnarsi su stime piu' forti.
