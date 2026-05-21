# EP-03 Blocked Tasks

## T-01 Build dashboard and primary navigation

- Status: `proposed`
- Reason: Il repo non contiene ancora un runtime applicativo browser, una shell UI, un router o file frontend su cui implementare dashboard e navigazione primaria.
- Evidence: Ispezionati `src/*.py`, `tests/*.py`, [docs/epics/EP-03-mobile-archive-ui-and-editing-flows/README.md](/root/bed-project/docs/epics/EP-03-mobile-archive-ui-and-editing-flows/README.md), [docs/epics/EP-03-mobile-archive-ui-and-editing-flows/tasks/T-01-build-dashboard-and-primary-navigation.md](/root/bed-project/docs/epics/EP-03-mobile-archive-ui-and-editing-flows/tasks/T-01-build-dashboard-and-primary-navigation.md). Nel repo esistono solo moduli Python di import, normalizzazione, viste derivate e storage locale.
- Missing: Base applicativa frontend eseguibile o decisione esplicita sul contenitore UI da usare per dashboard, lista, dettaglio e form.
- Next candidate: `EP-04 / T-04` Resolve export fidelity strategy, che e' documentale e sblocca `EP-04 / T-03`.
