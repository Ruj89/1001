# T-02 Implement confirmed dataset overwrite flow

Status: `proposed`

Objective: Garantire che un nuovo import sostituisca completamente il dataset locale solo dopo conferma esplicita dell'utente.

Subtasks:

- `ST-02.1` Detect whether an active dataset already exists.
- `ST-02.2` Present explicit overwrite confirmation before activation.
- `ST-02.3` Replace the active dataset atomically after confirmation.
- `ST-02.4` Preserve the previous dataset when the user cancels or import fails.
