# T-01 Define the supported deployment contract and release acceptance outputs

Status: `completed`

Objective: Congelare il contratto di deployment supportato per Android, gli output attesi della procedura di rilascio e i limiti espliciti da non promettere nel MVP.

## Decision

Il contratto di deployment supportato per questo slice e' gia' definito in [docs/deployment-strategy.md](/root/bed-project/docs/deployment-strategy.md).

La decisione chiusa da questo task e':

- il target supportato e' una PWA browser-only servita via HTTPS;
- `file://` non e' una modalita' supportata per installazione o salvataggio PWA su Android;
- il contratto di rilascio deve dichiarare esplicitamente artefatto pubblicato, modalita' di accesso Android, disponibilita' offline attesa e limiti non supportati;
- il runtime attuale con server Python locale non puo' essere presentato come deployment finale del prodotto.

## Canonical Contract

### 1. Supported deployment target

- Il target autorevole e' una PWA servita in contesto sicuro via HTTPS.
- L'utente Android deve poter aprire l'app dal browser e, quando il browser lo consente, salvarla o installarla senza componenti aggiuntivi oltre al browser stesso.
- Il deployment supportato non richiede un backend operativo permanente per i flussi core del prodotto.

### 2. Unsupported deployment modes

- `file://` non e' una base di deployment supportata.
- La procedura di rilascio non deve promettere installazione PWA da file copiati nello storage del telefono.
- La procedura di rilascio non deve promettere comportamento offline equivalente se l'app non e' servita in contesto sicuro.

### 3. Release acceptance outputs

- Il rilascio deve produrre un artefatto chiaramente identificabile:
  - `URL HTTPS` della PWA pubblicata; oppure
  - `pacchetto wrapper Android` solo come fallback esplicito.
- Il rilascio deve dichiarare:
  - come aprire l'app da Android;
  - come salvarla o installarla dal browser se supportato;
  - quale comportamento offline e' atteso dopo il primo caricamento valido;
  - quali limiti restano fuori supporto nel MVP.

### 4. Current-state gap

- Il contratto deve distinguere il target di deployment dal prototipo corrente.
- La presenza di service worker, manifest e shell browser non basta da sola a dichiarare il deployment finale pronto.
- Le dipendenze correnti da `/api/*` e dal server Python locale restano un gap da chiudere nei task successivi di `EP-06`.

### 5. Scope rules

- Questo task definisce il contratto di deployment, non implementa ancora il runtime browser-only finale.
- Questo task non seleziona ancora un provider di hosting specifico.
- Questo task non autorizza a trattare il wrapper Android come percorso principale.

## Subtasks

- `ST-01.1` Derivare da [docs/deployment-strategy.md](/root/bed-project/docs/deployment-strategy.md) il target di deployment supportato e il perimetro Android da considerare autorevole.
- `ST-01.2` Formalizzare modalita' supportate e non supportate, incluso il rifiuto esplicito di `file://` come base installabile PWA.
- `ST-01.3` Definire gli output minimi della procedura di deployment: artefatto rilasciato, modalita' di accesso Android, aspettative offline e limiti dichiarati.
- `ST-01.4` Pubblicare il contratto come input normativo per runtime browser-only, rilascio HTTPS e verifica Android downstream.

## Subtask Details And Dependencies

### ST-01.1 Derivare il target di deployment supportato

Definition:

- Estrarre dal documento di strategia il target Android/PWA da considerare autorevole.
- Distinguere tra target di prodotto e stato corrente del prototipo.

Depends on:

- [docs/deployment-strategy.md](/root/bed-project/docs/deployment-strategy.md)

Blocks:

- `ST-01.2`
- `ST-01.3`
- `ST-01.4`
- `EP-06 / T-02`
- `EP-07 / T-01`

Status:

- `completed`

### ST-01.2 Formalizzare modalita' supportate e non supportate

Definition:

- Rendere normativo il rifiuto di `file://` come base di deployment PWA.
- Rendere esplicite le modalita' che il progetto puo' o non puo' promettere all'utente Android.

Depends on:

- `ST-01.1`

Blocks:

- `ST-01.3`
- `ST-01.4`
- `EP-06 / T-03`
- `EP-07 / T-03`

Status:

- `completed`

### ST-01.3 Definire gli output minimi della procedura di rilascio

Definition:

- Congelare gli output osservabili che il deployment deve produrre.
- Impedire che i task downstream confondano runtime locale, URL pubblicato e fallback wrapper.

Depends on:

- `ST-01.1`
- `ST-01.2`

Blocks:

- `ST-01.4`
- `EP-07 / T-01`
- `EP-07 / T-02`

Status:

- `completed`

### ST-01.4 Pubblicare il contratto come input normativo downstream

Definition:

- Rendere il contratto abbastanza esplicito da poter guidare runtime browser-only, rilascio HTTPS e validazione Android.

Depends on:

- `ST-01.1`
- `ST-01.2`
- `ST-01.3`

Blocks:

- `EP-06 / T-02`
- `EP-06 / T-03`
- `EP-07 / T-01`
- `EP-07 / T-02`
- `EP-07 / T-03`

Status:

- `completed`

## Downstream Task Impact

- `EP-06 / T-02` must remove local HTTP runtime dependencies without changing the supported deployment target fixed here.
- `EP-06 / T-03` must align manifest, service worker, and static output to the HTTPS-hosted target fixed here.
- `EP-07 / T-01` must publish a release procedure that emits the acceptance outputs fixed here.
- `EP-07 / T-02` must validate the deployed artifact against this contract rather than against the local fixture runtime.
- `EP-07 / T-03` may evaluate wrapper fallback only as an exception path to this contract, not as a redefinition of the baseline.
