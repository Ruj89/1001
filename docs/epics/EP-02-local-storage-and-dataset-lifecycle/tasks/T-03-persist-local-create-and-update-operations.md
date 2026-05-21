# T-03 Persist local create and update operations

Status: `proposed`

Objective: Rendere persistenti in storage locale le modifiche e la creazione di record senza perdere coerenza tra dettaglio, elenco, ricerca e metadata archivio.

Subtasks:

- `ST-03.1` Persist title-level edits.
- `ST-03.2` Persist sub-variant updates with required fields enforced.
- `ST-03.3` Persist new title creation with an initial sub-variant.
- `ST-03.4` Update archive metadata after each successful write.
