# T-02 Verify Android install, relaunch, and offline behavior from the deployed artifact

Status: `proposed`

Objective: Verificare il comportamento Android sul deployment reale, distinguendo chiaramente questa copertura dalla verifica eseguita su fixture locale o runtime di sviluppo.

Subtasks:

- `ST-02.1` Verificare apertura da browser Android del release URL e disponibilita' del flusso save/install quando supportato dal browser.
- `ST-02.2` Verificare riapertura della PWA o shortcut salvata senza dipendere dal server locale di sviluppo.
- `ST-02.3` Verificare disponibilita' offline di shell, archivio locale e flussi core dopo il primo caricamento riuscito.
- `ST-02.4` Verificare import/export e segnalare in modo esplicito eventuali limiti residui del deployment Android reale.
