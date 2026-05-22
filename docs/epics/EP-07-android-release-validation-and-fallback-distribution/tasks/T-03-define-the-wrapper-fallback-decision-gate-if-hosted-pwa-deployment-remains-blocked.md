# T-03 Define the wrapper fallback decision gate if hosted PWA deployment remains blocked

Status: `completed`

Objective: Definire quando il progetto deve smettere di inseguire il target PWA puro e aprire invece un fallback wrapper Android, senza promuoverlo prematuramente a percorso principale.

## Decision

Il fallback wrapper Android non e' un'alternativa equivalente da tenere aperta in parallelo al target principale. E' un percorso di eccezione che puo' essere autorizzato solo dopo evidenza sufficiente che il deployment PWA hosted non riesce a soddisfare il target Android in modo operativo.

La decisione chiusa da questo task e':

- il baseline resta `PWA hosted via HTTPS`;
- il wrapper non puo' essere promosso solo per evitare il lavoro di migrazione verso runtime browser-only;
- il gate di fallback si apre solo in presenza di blocchi tecnici o operativi persistenti sul percorso PWA supportato;
- il passaggio a wrapper deve essere trattato come cambio di costo operativo, packaging e manutenzione, non come dettaglio di deploy.

## Canonical Contract

### 1. Baseline and exception rule

- Il percorso di default del progetto resta la PWA hosted via HTTPS.
- Il wrapper Android puo' essere valutato solo come eccezione al baseline.
- L'assenza di preferenza per host esterni, da sola, non basta a promuovere il wrapper.

### 2. Conditions that can open the fallback gate

- Il gate puo' aprirsi se il percorso PWA hosted resta bloccato anche dopo aver chiarito contratto di deployment, runtime browser-only e prerequisiti di release.
- Il gate puo' aprirsi se la PWA hosted non riesce a garantire in modo affidabile apertura, salvataggio/installazione, rilancio o uso offline su Android reale.
- Il gate puo' aprirsi se emergono limiti di browser o distribuzione tali da rendere il target supportato non raggiungibile con sforzo ragionevole per l'MVP.

### 3. Conditions that do not justify the fallback alone

- Non basta il desiderio di aprire file locali con `file://`.
- Non basta l'esistenza del server Python locale attuale.
- Non basta la mancanza di un provider di hosting gia' scelto.
- Non basta voler evitare la migrazione del boundary dati verso il browser.

### 4. Wrapper impact categories

- Il fallback wrapper introduce almeno questi impatti:
  - packaging app Android;
  - distribuzione artefatto diversa da URL HTTPS;
  - nuovo perimetro di test su installazione e update app;
  - possibili differenze sul boundary di persistenza locale;
  - manutenzione aggiuntiva del contenitore nativo.

### 5. Decision gate output

- Se il gate non si apre, il team continua sul percorso PWA hosted.
- Se il gate si apre, il team deve produrre una nuova decisione tecnica che:
  - nomina il wrapper scelto;
  - spiega quale limite del percorso PWA non e' stato risolvibile;
  - definisce il nuovo output di release e il perimetro di test Android.

## Subtasks

- `ST-03.1` Elencare le condizioni tecniche o operative che renderebbero insufficiente il deployment PWA HTTPS per l'uso Android reale.
- `ST-03.2` Confrontare le opzioni wrapper minime rilevanti solo come fallback, non come baseline MVP.
- `ST-03.3` Definire gli impatti su packaging, distribuzione, persistenza locale e manutenzione del fallback wrapper.
- `ST-03.4` Formalizzare il gate decisionale che autorizza o scarta il passaggio a wrapper Android.

## Subtask Details And Dependencies

### ST-03.1 Elencare le condizioni che renderebbero insufficiente il deployment PWA HTTPS

Definition:

- Rendere espliciti i casi in cui il target supportato puo' fallire in modo sostanziale per Android.

Depends on:

- `EP-06 / T-01`
- [docs/deployment-strategy.md](/root/bed-project/docs/deployment-strategy.md)

Blocks:

- `ST-03.2`
- `ST-03.3`
- `ST-03.4`

Status:

- `completed`

### ST-03.2 Confrontare le opzioni wrapper solo come fallback

Definition:

- Trattare le opzioni wrapper come percorso di eccezione.
- Evitare che il backlog reinterpreti il wrapper come baseline MVP.

Depends on:

- `ST-03.1`

Blocks:

- `ST-03.3`
- `ST-03.4`

Status:

- `completed`

### ST-03.3 Definire gli impatti del fallback wrapper

Definition:

- Rendere visibili gli impatti su packaging, distribuzione, persistenza e manutenzione.

Depends on:

- `ST-03.1`
- `ST-03.2`

Blocks:

- `ST-03.4`

Status:

- `completed`

### ST-03.4 Formalizzare il gate decisionale

Definition:

- Congelare il criterio con cui il team puo' aprire o respingere il fallback wrapper senza ambiguita' future.

Depends on:

- `ST-03.1`
- `ST-03.2`
- `ST-03.3`

Blocks:

- `none`

Status:

- `completed`

## Downstream Task Impact

- `EP-07 / T-01` must keep the hosted PWA as the primary release path until this gate is explicitly opened.
- `EP-07 / T-02` must validate the hosted artifact first, not skip directly to wrapper testing.
- Any future wrapper epic must cite the failure condition that opened this gate instead of rearguing the baseline deployment strategy.
