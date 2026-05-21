# EP-03 Blocked Tasks

## T-01 Build dashboard and primary navigation

- Status: `proposed`
- Reason: Il repo non contiene ancora un runtime applicativo browser, una shell UI, un router o file frontend su cui implementare dashboard e navigazione primaria.
- Evidence: Ispezionati `src/*.py`, `tests/*.py`, [docs/epics/EP-03-mobile-archive-ui-and-editing-flows/README.md](/root/bed-project/docs/epics/EP-03-mobile-archive-ui-and-editing-flows/README.md), [docs/epics/EP-03-mobile-archive-ui-and-editing-flows/tasks/T-01-build-dashboard-and-primary-navigation.md](/root/bed-project/docs/epics/EP-03-mobile-archive-ui-and-editing-flows/tasks/T-01-build-dashboard-and-primary-navigation.md). Nel repo esistono solo moduli Python di import, normalizzazione, viste derivate e storage locale.
- Missing: Base applicativa frontend eseguibile o decisione esplicita sul contenitore UI da usare per dashboard, lista, dettaglio e form.
- Next candidate: `EP-04 / T-04` Resolve export fidelity strategy, che e' documentale e sblocca `EP-04 / T-03`.

## T-02 Build archive list, search, and status filters

- Status: `proposed`
- Reason: Mancano runtime frontend, routing UI e query layer lato interfaccia per esporre lista archivio, ricerca e filtri da viewport mobile.
- Evidence: Ispezionati `src/*.py`, `tests/*.py`, [docs/epics/EP-03-mobile-archive-ui-and-editing-flows/tasks/T-02-build-archive-list-search-and-status-filters.md](/root/bed-project/docs/epics/EP-03-mobile-archive-ui-and-editing-flows/tasks/T-02-build-archive-list-search-and-status-filters.md). Il repo contiene solo logica Python backend-like, senza componenti browser o rendering.
- Missing: Base UI implementabile e decisione sul framework/contenitore applicativo per lista, stato query e filtri.
- Next candidate: `EP-05 / T-01` o `EP-04` verification/export work, che possono avanzare senza runtime UI.

## T-03 Build title detail and edit entry flow

- Status: `proposed`
- Reason: Il contratto di storage e dominio e' pronto, ma manca il livello applicativo/frontend in cui renderizzare il dettaglio read-first e l'ingresso esplicito in modifica.
- Evidence: Ispezionati [src/archive_storage.py](/root/bed-project/src/archive_storage.py), [src/archive_model.py](/root/bed-project/src/archive_model.py), [docs/epics/EP-03-mobile-archive-ui-and-editing-flows/tasks/T-03-build-title-detail-and-edit-entry-flow.md](/root/bed-project/docs/epics/EP-03-mobile-archive-ui-and-editing-flows/tasks/T-03-build-title-detail-and-edit-entry-flow.md). Esistono solo mutazioni e contratti dati, non viste UI.
- Missing: Schermate, stato form e navigazione browser per dettaglio/edit.
- Next candidate: `EP-05 / T-04` verification work sulla persistenza locale, che usa il boundary storage gia' implementato.

## T-04 Build create title flow

- Status: `proposed`
- Reason: La creazione persistita del titolo esiste nel boundary storage, ma manca l'interfaccia phone-sized per raccogliere e validare i campi dal lato utente.
- Evidence: Ispezionati [src/archive_storage.py](/root/bed-project/src/archive_storage.py), [tests/test_archive_storage.py](/root/bed-project/tests/test_archive_storage.py), [docs/epics/EP-03-mobile-archive-ui-and-editing-flows/tasks/T-04-build-create-title-flow.md](/root/bed-project/docs/epics/EP-03-mobile-archive-ui-and-editing-flows/tasks/T-04-build-create-title-flow.md). Nessun file frontend o runtime browser presente nel repo.
- Missing: Base UI/browser e form create flow implementabile.
- Next candidate: `EP-04 / T-03` export ODS o task di verifica backend, che non richiedono UI.
