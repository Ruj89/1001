# T-03 Define the wrapper fallback decision gate if hosted PWA deployment remains blocked

Status: `proposed`

Objective: Definire quando il progetto deve smettere di inseguire il target PWA puro e aprire invece un fallback wrapper Android, senza promuoverlo prematuramente a percorso principale.

Subtasks:

- `ST-03.1` Elencare le condizioni tecniche o operative che renderebbero insufficiente il deployment PWA HTTPS per l'uso Android reale.
- `ST-03.2` Confrontare le opzioni wrapper minime rilevanti solo come fallback, non come baseline MVP.
- `ST-03.3` Definire gli impatti su packaging, distribuzione, persistenza locale e manutenzione del fallback wrapper.
- `ST-03.4` Formalizzare il gate decisionale che autorizza o scarta il passaggio a wrapper Android.
