# T-03 Align static assets, local persistence boot, and installability requirements for hosted release

Status: `proposed`

Objective: Preparare il runtime browser-only a un rilascio HTTPS gestito, con asset statici coerenti, boot locale persistente e requisiti minimi di installabilita' PWA.

Subtasks:

- `ST-03.1` Definire il contratto di build/output statico coerente con hosting gestito e path asset stabili.
- `ST-03.2` Allineare manifest, service worker e shell offline al target di deploy HTTPS senza rete dopo il primo caricamento valido.
- `ST-03.3` Definire il comportamento di boot quando esiste un archivio locale attivo, quando non esiste e quando i dati persistiti non sono recuperabili.
- `ST-03.4` Fissare i prerequisiti minimi di release per dichiarare la PWA pronta a essere pubblicata e installata da browser Android.
