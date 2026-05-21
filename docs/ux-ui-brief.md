# UX/UI Brief - Offline-first PWA archive derived from `1001.ods`

## Purpose

This document prepares the `UX/UI Designer Agent` handoff for the MVP. Its goal is to clarify the current user flow, the desired target flow, and the design constraints before engineering story decomposition. The UX priority for this phase is `Browsing first`: archive consultation, search, filtering, record comprehension, and fast mobile editing come before deeper treatment of import/export flows.

## Source inputs

- `docs/request-brief.md`
- `docs/tech-feasibility.md`
- `docs/requirements-analysis.md`
- Example source workbook: `.local/1001.ods`

## Product context

The product is an offline-first PWA for a personal archive currently managed through an ODS spreadsheet. The current spreadsheet acts as an operational container, but it is inefficient and fragile for daily use, especially on Android. The MVP should replace spreadsheet-centric day-to-day work with a structured local archive that is quick to browse and maintain from a mobile device.

The app is not meant to become a spreadsheet clone. It must instead provide a mobile-first interface around a normalized archive model while still preserving import/export compatibility with the current ODS-based operating format.

## Primary user

- Archive owner and sole operator.
- Primary device: Android phone.
- Secondary device: PC for occasional broader review.

## UX priority for this phase

`Browsing first`

The UX work should prioritize:

- fast archive browsing on mobile;
- search by title;
- filtering by status;
- clear understanding of a title and its sub-variants;
- quick edit access from a phone.

The following flows remain in scope, but are secondary in this UX pass:

- import with overwrite confirmation;
- create new record;
- export ODS;
- archive status screen.

## Confirmed domain and data rules

- The only import source for MVP is the first ODS sheet: `Lista`.
- The stable MVP source contract is five columns:
  `title`, `platform`, `edition/version`, `support`, `status`.
- Blank title rows in `Lista` inherit the title from the previous row.
- The primary business entity is `title`, not a flat spreadsheet row.
- A title can contain one or more `sub-variants`.
- Sub-variants remain distinct and are not automatically consolidated.
- Sub-variant source order must be preserved across import, app persistence, and export.
- Every sub-variant must always include:
  `platform`, `edition/version`, `support`, `status`.

## Confirmed derived behavior

- `Appoggio` is not an import source; it is a derived output.
- `Appoggio` behavior must be treated as a row-by-row projection of `Lista`:
  filled-down title plus the row's status value.
- `Risultati` is not an import source; it is a derived output.
- `Risultati` behavior must be treated as a title-level summary over unique non-empty titles from `Lista`.
- In `Risultati`, a title is marked `x` if:
  at least one occurrence has status `OK`, or
  all occurrences are only `Uscito fuori` and/or `Non reperibile`.
- Otherwise the title is marked `-`.

## Current flow summary

Today the user works directly in the spreadsheet:

- opens `Lista` as the main operational sheet;
- scans titles and repeated rows manually;
- interprets blank-title continuation rows implicitly;
- uses status values directly inside spreadsheet rows;
- relies on `Appoggio` and `Risultati` as operationally useful derived views;
- edits the archive through a spreadsheet interface that is especially inconvenient on Android.

Current friction points:

- browsing is slowed by spreadsheet navigation and dense row structure;
- repeated titles across many rows are hard to parse quickly on mobile;
- blank-title continuation rows increase cognitive load;
- search, filtering, and state comprehension are weaker than they should be for day-to-day use;
- editing on Android is error-prone and cumbersome;
- import/export safety and local persistence are not surfaced through product UX, only through file handling.

## Target flow intent

The target UX should make the normalized archive feel simpler than the spreadsheet while preserving the user’s trust in the underlying operational format.

The target experience should make it easy to:

- open the archive and immediately browse titles;
- search and filter without spreadsheet-like friction;
- understand a title as one logical record with multiple sub-variants;
- inspect and edit sub-variants quickly from mobile;
- remain aware that data is local, persistent, and offline-capable;
- safely import a new source file when needed;
- export back to an ODS that remains operationally familiar.

## UX constraints

- Android-first usability is mandatory.
- Offline-first behavior is mandatory for core flows.
- No backend, no cloud dependency, no multi-user behavior in MVP.
- The product should not mimic spreadsheet mechanics unless necessary for continuity.
- Import replaces the whole local archive only after explicit confirmation.
- Export must remain operationally close to the current ODS file.
- UX should respect the normalized model `title + sub-variants`.
- Scope should stay tightly MVP-bound and avoid sync, collaboration, advanced history, or spreadsheet-clone behavior.

## Specific requests to the UX/UI Designer Agent

Produce exactly the following sections:

1. `User Problem Frame`
2. `Current Flow Summary`
3. `Target Flow Summary`
4. `UX Constraints`
5. `Assumptions and Unknowns`
6. `Recommended Design Artifact`
7. `Handoff Notes`

Additional direction:

- Keep the UX work tightly scoped to MVP.
- Treat this as a flow and usability problem before a visual design problem.
- Do not jump to polished UI if a user flow or wireframe is the more appropriate artifact.
- The expected likely recommendation is `user flow` or `wireframe`, unless there is a strong reason to recommend otherwise.
- Make uncertainty explicit rather than smoothing it over.
- Keep `current flow` and `target flow` clearly separated.

## Key questions the UX output should help answer

- What is the best mobile-first navigation model for browsing titles and opening details quickly?
- How should search and filtering be surfaced so they are faster than spreadsheet use on Android?
- How should the detail view present title-level information versus sub-variant-level information?
- What is the minimum-friction edit flow for sub-variants on a phone?
- How should secondary flows such as import overwrite confirmation, export, and archive status be positioned without overwhelming the main browsing experience?

## Handoff expectation for downstream engineering

The UX/UI output should be concrete enough for the `Development Team Agent` to turn it into:

- user stories;
- testable acceptance criteria;
- functional flow descriptions;
- implementation-ready tasks.
