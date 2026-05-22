# T-02 Verify mobile browse and edit flows

Status: `completed`

Objective: Definire il contratto di verifica Android per dashboard, lista, ricerca, filtri, dettaglio, creazione e modifica persistita, con avvio esplicito solo dopo l'esistenza di tutti i flussi UI runnable richiesti.

## Decision

Questo task non puo' partire da mock, wireframe o documenti statici. La verifica mobile MVP e' valida solo su una superficie browser/PWA realmente eseguibile che includa i flussi core di consultazione ed editing.

La verifica e' downstream rispetto a `EP-03`. Deve partire solo quando dashboard, lista/search/filter, dettaglio con ingresso in modifica, create flow e update flow persistito esistono in forma runnable su viewport phone-sized. Il focus resta l'usabilita' Android e la coerenza del prodotto, non la semplice presenza tecnica degli schermi.

## Canonical Contract

### 1. Readiness gate

- Il task puo' iniziare solo dopo l'esistenza di una shell browser/PWA eseguibile.
- Il task puo' iniziare solo dopo che siano implementati in forma runnable:
  - dashboard e navigazione primaria;
  - lista con ricerca e filtri;
  - dettaglio read-first con ingresso esplicito in modifica;
  - create flow.
  - update flow persistito per record esistenti.
- Documenti, mock o wireframe non sono evidenza sufficiente per eseguire questo task.

### 2. Dashboard and browse verification

- La verifica deve coprire l'ingresso dashboard-first.
- La verifica deve coprire la presenza e la priorita' della ricerca.
- La verifica deve coprire quick actions e metadata archivio o stato vuoto coerente.
- La verifica deve coprire lista titoli, ricerca locale e filtri di stato su Android-sized viewport.

### 3. Detail and edit-entry verification

- La verifica deve coprire il dettaglio read-first.
- La verifica deve coprire l'ingresso in modifica solo tramite azione esplicita.
- La verifica deve coprire la leggibilita' delle sotto-varianti ordinate.
- La verifica deve coprire la gestione visibile dei valori importati mancanti nel dettaglio.

### 4. Create and update verification

- La verifica deve coprire il create flow con campi minimi richiesti.
- La verifica deve coprire l'update flow su record esistenti.
- La verifica deve confermare che, dopo il salvataggio, lista, ricerca e dettaglio restino coerenti.

### 5. Scope rules

- Questo task non sostituisce la verifica specifica di import/export o restart behavior.
- Questo task puo' osservare problemi di persistenza locale emersi durante i flussi mobile, ma il focus resta la verifica browse/edit/create su Android.
- Il contratto non impone ancora un mix specifico tra test manuali e automatici, ma richiede evidenza reale su UI eseguibile.
- Questo task non copre ancora il deployment HTTPS reale, l'installazione/salvataggio PWA da browser Android o il rilancio da artefatto pubblicato.

## Subtasks

- `ST-02.1` Verify dashboard-first entry, quick actions, and archive status behavior on Android-sized viewports. Status: `completed`
- `ST-02.2` Verify local title search and full-status filtering, including missing-status discoverability. Status: `completed`
- `ST-02.3` Verify read-first detail, ordered sub-variants, explicit edit entry, and visible missing imported values. Status: `completed`
- `ST-02.4` Verify create and update flows on phone-sized viewports with coherent post-save behavior. Status: `completed`

## Subtask Details And Dependencies

### ST-02.1 Verify dashboard-first entry, quick actions, and archive status behavior on Android-sized viewports

Definition:

- Validate that the app opens into the dashboard-first experience defined in `EP-03 / T-01`.
- Validate metadata or empty-state behavior and primary quick actions on a phone-sized viewport.

Depends on:

- `EP-03 / T-01`

Blocks:

- `ST-02.2`
- `ST-02.3`
- `ST-02.4`

Status:

- `completed`

Evidence:

- Verified by [tests/test_mobile_browse_edit_flows.spec.js](/root/bed-project/tests/test_mobile_browse_edit_flows.spec.js)
- Fixture server provided by [tests/run_dashboard_fixture.py](/root/bed-project/tests/run_dashboard_fixture.py)

### ST-02.2 Verify local title search and full-status filtering, including missing-status discoverability

Definition:

- Validate browse behavior from list, search, and filters on Android.
- Confirm that rare statuses and missing imported status values remain reachable through the filter model.

Depends on:

- `ST-02.1`
- `EP-03 / T-02`

Blocks:

- `ST-02.3`
- `ST-02.4`

Status:

- `completed`

Evidence:

- Verified by [tests/test_mobile_browse_edit_flows.spec.js](/root/bed-project/tests/test_mobile_browse_edit_flows.spec.js)
- Fixture server provided by [tests/run_dashboard_fixture.py](/root/bed-project/tests/run_dashboard_fixture.py)

### ST-02.3 Verify read-first detail, ordered sub-variants, explicit edit entry, and visible missing imported values

Definition:

- Validate the detail behavior defined in `EP-03 / T-03`.
- Confirm that imported blanks are visible and comprehensible in read mode.

Depends on:

- `ST-02.2`
- `EP-03 / T-03`

Blocks:

- `ST-02.4`

Status:

- `completed`

Evidence:

- Verified by [tests/test_mobile_browse_edit_flows.spec.js](/root/bed-project/tests/test_mobile_browse_edit_flows.spec.js)
- Fixture server provided by [tests/run_dashboard_fixture.py](/root/bed-project/tests/run_dashboard_fixture.py)

### ST-02.4 Verify create and update flows on phone-sized viewports with coherent post-save behavior

Definition:

- Validate create and edit persistence flows end to end on mobile.
- Confirm that successful saves keep browse contexts coherent and failed saves surface actionable validation feedback.

Depends on:

- `ST-02.3`
- `EP-03 / T-04`
- `EP-03 / T-05`
- `EP-02 / T-03`

Blocks:

- `none`

Status:

- `completed`

Evidence:

- Verified by [tests/test_mobile_browse_edit_flows.spec.js](/root/bed-project/tests/test_mobile_browse_edit_flows.spec.js)
- Supporting mutation boundary checks in [tests/test_archive_dashboard_app.py](/root/bed-project/tests/test_archive_dashboard_app.py)

## Downstream Task Impact

- MVP acceptance for Android browse/edit usability must rely on the evidence defined here.
- Any later QA pass on UI regressions should reuse the readiness gate and coverage boundaries fixed in this task instead of inventing a broader mobile scope ad hoc.
- `EP-07 / T-02` must extend this coverage to the deployed Android artifact instead of riusare soltanto la fixture locale.
