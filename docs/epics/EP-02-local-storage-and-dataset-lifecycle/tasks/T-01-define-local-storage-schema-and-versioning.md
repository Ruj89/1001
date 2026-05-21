# T-01 Define local storage schema and versioning

Status: `proposed`

Objective: Introdurre uno schema di persistenza locale versionato che possa contenere record archivio, sotto-varianti e metadata senza dipendenza da backend.

Subtasks:

- `ST-01.1` Define the local storage containers for titles and metadata.
- `ST-01.2` Define schema version storage and upgrade expectations.
- `ST-01.3` Separate active archive data from transient import state.
- `ST-01.4` Identify minimum recovery expectations after app restart.
