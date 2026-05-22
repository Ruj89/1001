# EP-07 Blocked Log

## 2026-05-22 - T-02 remains blocked pending real HTTPS deploy and Android validation environment

Task:

- `EP-07 / T-02` Verify Android install, relaunch, and offline behavior from the deployed artifact

Why it was skipped:

- il task richiede esplicitamente un artefatto HTTPS reale raggiungibile da Chrome Android;
- il repository contiene ora la procedura di release e il builder dell'artefatto, ma non un URL finale gia' pubblicato;
- nel workspace non esiste un dispositivo Android reale o una sessione di validazione Android reale sostitutiva accettabile secondo il contratto del task.

Evidence inspected:

- `docs/epics/EP-07-android-release-validation-and-fallback-distribution/tasks/T-02-verify-android-install-relaunch-and-offline-behavior-from-the-deployed-artifact.md`
- `docs/hosted-pwa-release-procedure.md`
- `scripts/build_pwa_release.sh`
- `webapp/manifest.webmanifest`
- `webapp/service-worker.js`

Missing dependency or decision:

- pubblicazione effettiva dell'artefatto statico su un URL HTTPS finale;
- disponibilita' di Chrome Android reale per verificare save/install, rilancio e offline sul deployment pubblicato.

What can proceed instead:

- nessun altro task non completato resta eseguibile nel backlog corrente senza uscire dal perimetro documentato del repository.
