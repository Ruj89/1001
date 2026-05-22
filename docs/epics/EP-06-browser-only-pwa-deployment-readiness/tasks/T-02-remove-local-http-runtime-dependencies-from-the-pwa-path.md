# T-02 Remove local HTTP runtime dependencies from the PWA path

Status: `proposed`

Objective: Spostare il percorso PWA target da runtime con server Python locale a runtime browser-only, preservando UI e flussi MVP gia' definiti.

Subtasks:

- `ST-02.1` Inventariare le dipendenze correnti da `/api/*`, bootstrap HTTP locale e server Python che impediscono il deployment statico.
- `ST-02.2` Reindirizzare bootstrap dashboard, metadata archivio e stato attivo verso il boundary di persistenza browser-local previsto dal progetto.
- `ST-02.3` Reindirizzare create e update flow verso write boundary locale browser-only senza perdere le regole di validazione e coerenza gia' fissate.
- `ST-02.4` Garantire che shell, navigazione e stato vuoto/attivo restino avviabili offline senza server locale o backend remoto.
