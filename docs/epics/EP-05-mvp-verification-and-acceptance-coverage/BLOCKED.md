# EP-05 Blocked Tasks

## T-02 Verify mobile browse and edit flows

- Status: `proposed`
- Reason: La verifica richiesta e' specificamente su dashboard, lista, ricerca, filtri, dettaglio e modifica su Android, ma il repo non contiene ancora il runtime/frontend su cui eseguire questa validazione.
- Evidence: Ispezionati [docs/epics/EP-05-mvp-verification-and-acceptance-coverage/tasks/T-02-verify-mobile-browse-and-edit-flows.md](/root/bed-project/docs/epics/EP-05-mvp-verification-and-acceptance-coverage/tasks/T-02-verify-mobile-browse-and-edit-flows.md), [docs/epics/EP-03-mobile-archive-ui-and-editing-flows/BLOCKED.md](/root/bed-project/docs/epics/EP-03-mobile-archive-ui-and-editing-flows/BLOCKED.md), `src/*.py`, `tests/*.py`. Nel repo esiste solo logica Python per import, storage, viste derivate ed export.
- Missing: Implementazione reale dei flussi UI mobile oppure almeno una base frontend eseguibile da verificare.
- Next candidate: nessuno in `EP-05`; le altre verifiche backend risultano gia' completate.
