# Blocking Analysis - Current Epic Blockers

This document consolidates the blockers currently recorded in:

- `docs/epics/EP-01-import-and-domain-normalization/BLOCKED.md`
- `docs/epics/EP-03-mobile-archive-ui-and-editing-flows/BLOCKED.md`
- `docs/epics/EP-05-mvp-verification-and-acceptance-coverage/BLOCKED.md`

It turns each blocker into a product decision memo so engineering can proceed with a stable direction instead of waiting on implicit assumptions.

## Blocker Group 1 - EP-01 / T-02 Normalize fill-down and group titles

1. Real problem to solve

The real problem is not whether the import code can reject incomplete rows. The problem is that the current MVP domain contract assumes every imported sub-variant always has four non-title fields populated, while the real workbook contains many rows where one or more of those fields are blank even after title fill-down. If this mismatch stays unresolved, the team cannot stabilize import, storage, UI, or export contracts.

2. Users and process involved

The primary user is the archive owner maintaining a personal catalog derived from the real `1001.ods` workbook. The affected process is the full archive lifecycle: import from `Lista`, normalize records, persist them locally, browse them in the UI, edit them, and export them back to ODS. Engineering is blocked because the real source data and the current domain assumptions do not describe the same archive reality.

3. Expected customer value

The value is a usable MVP that accepts the real workbook without forcing a manual data-cleanup project first. Observable value signals are: successful import of the existing archive, fewer failures caused by unrealistic validation rules, preserved fidelity of the current archive state, and lower risk of silently inventing missing data during normalization.

4. Urgency and impact if we do nothing

Urgency is high because this decision affects downstream storage, editing, derived views, and export. If we do nothing, engineering either stalls or implements against a false contract that will later require rework across multiple epics. The product would remain blocked on spreadsheet cleanup rather than moving toward a usable archive workflow.

5. Minimum scope of the change

The minimum scope is to explicitly accept blank imported non-title fields as valid incomplete legacy data for MVP import flows. The change does not require new fill-down behavior for `piattaforma`, `edizione_versione`, `supporto`, or `stato`. It requires only that the canonical import/domain contract preserve those blanks faithfully instead of rejecting the dataset.

6. Included / Excluded

Included:
- Accept blank imported values in non-title sub-variant fields.
- Preserve blank values through normalized records, storage, UI, and export.
- Distinguish imported incomplete legacy data from user-entered creation/editing requirements if needed later.

Excluded:
- Additional fill-down semantics on non-title columns.
- Automatic data inference for missing platform, edition, support, or status.
- Mandatory cleanup of the source workbook before MVP use.
- Broader status-vocabulary normalization beyond what is already defined elsewhere.

7. Acceptance criteria

- Import of the real sample workbook succeeds without failing solely because non-title fields are blank.
- Normalized records preserve blank imported values without replacing them with inferred values.
- Storage and export boundaries can round-trip blank imported values without loss.
- Downstream task contracts no longer assume that all imported sub-variants always have all four non-title fields populated.
- No extra fill-down is applied to non-title columns during normalization.

8. Doubts or open points

- It still needs technical validation whether imported incomplete records and newly created records should share the same strictness rules in the application layer.
- The UI contract should make missing imported values readable without making the archive feel corrupted.
- Export fidelity for blank values must be checked against the expected operational ODS shape.

9. Impacts to validate with the technical team

- Revise `SottoVarianteRecord` or introduce a separate imported-record boundary so blank imported fields are representable.
- Confirm schema changes for local persistence and derived views to preserve missing values.
- Confirm how create/edit validation differs, if at all, from legacy import validation.
- Confirm test coverage for import, persistence, editing, and export with blank imported fields.
- Confirm no hidden dependency still assumes non-blank `piattaforma`, `edizione_versione`, `supporto`, and `stato`.

10. Recommendation

`Do`
Rationale: the product should accept the real archive as it exists. Rejecting the workbook or inventing non-title values would optimize for contract purity rather than user value. The smallest coherent MVP path is to accept blanks as canonical imported legacy data and preserve them explicitly.

Internal validation status

`Needs internal technical validation`

Client commitment

`No commitment on timeline or cost until technical validation is complete.`

## Blocker Group 2 - EP-03 / T-01 to T-04 Mobile archive UI and editing flows

1. Real problem to solve

The real problem is not “missing screens” in the abstract. The problem is that the product backlog expects mobile browse, detail, create, and edit flows, but the repository still has no executable browser application foundation where those flows can exist. Without a runnable frontend shell, EP-03 is blocked at the application-platform level, not at the component-task level.

2. Users and process involved

The primary user is the archive owner using Android as the main operating device. Secondary stakeholders are the developers who need a stable runtime target to implement navigation, list interactions, detail views, and forms. The affected process is the daily archive workflow the MVP is supposed to replace: open app, inspect archive state, search, filter, open a title, edit data, and create new records locally.

3. Expected customer value

The value is to move from a spreadsheet-centric archive workflow to a usable mobile-first product surface. Observable value signals are: a runnable app entry point, coherent primary navigation, phone-sized browsing and editing flows, and the ability to validate real user interactions on Android instead of discussing them only as documents.

4. Urgency and impact if we do nothing

Urgency is high because EP-03 is a core MVP promise and also a prerequisite for meaningful mobile verification. If we do nothing, the project remains a backend/data prototype with no executable product experience, and downstream QA work stays blocked as well.

5. Minimum scope of the change

The minimum scope is to establish a browser-based PWA shell in the same project/repo as the implementation baseline. That shell must be sufficient to host dashboard, list, detail, create, and edit flows with mobile-first navigation and local archive access. This is the smallest change that turns EP-03 from an abstract UI epic into executable work.

6. Included / Excluded

Included:
- Explicit product decision that the frontend will be a browser-based PWA in this project/repo.
- App shell and routing/navigation foundation.
- Local archive access boundary usable by dashboard, browse, detail, create, and edit flows.
- Mobile-first viewport behavior as a baseline requirement for implementation.

Excluded:
- Treating EP-03 as documentation-only UX work.
- Moving the frontend to a separate undefined repo or future initiative.
- Native Android packaging as an MVP prerequisite.
- Broad design-system work beyond what is needed to support the MVP flows.

7. Acceptance criteria

- The product direction explicitly names a browser-based PWA shell in the same project as the frontend foundation for EP-03.
- Engineering has a runnable frontend baseline where dashboard, list, detail, create, and edit tasks can be implemented.
- Navigation, routing, and local data access are treated as prerequisites, not as incidental details hidden inside later UI tasks.
- EP-03 task assumptions no longer depend on an unspecified runtime or container.
- The chosen foundation is compatible with Android browser usage and offline-first local data behavior.

8. Doubts or open points

- The concrete frontend stack still requires technical validation and team preference alignment.
- The exact boundary between frontend state management and storage/query services needs definition.
- The UX detail level for dashboard versus list-first navigation may still be refined during implementation.

9. Impacts to validate with the technical team

- Choose the concrete frontend runtime and build toolchain for a PWA shell in this repo.
- Define the interface between local persistence/query logic and the UI layer.
- Confirm offline behavior expectations for app boot, cached shell, and local data reads/writes.
- Confirm test strategy for Android-sized UI behavior and form flows.
- Confirm whether current task wording around universally required sub-variant fields needs revision after the EP-01 blank-value decision.

10. Recommendation

`Do`
Rationale: the frontend direction should be decided now. Leaving EP-03 on an unspecified runtime would keep both delivery and verification blocked. A browser-based PWA shell in the same project is the smallest product-coherent decision that unlocks implementation.

Internal validation status

`Needs internal technical validation`

Client commitment

`No commitment on timeline or cost until technical validation is complete.`

## Blocker Group 3 - EP-05 / T-02 Verify mobile browse and edit flows

1. Real problem to solve

The real problem is not a lack of QA intent. The problem is that the planned verification work depends on mobile UI flows that do not yet exist in runnable form. Without an executable dashboard, list, search, filter, detail, create, and edit surface, the team cannot perform meaningful Android usability and behavior validation.

2. Users and process involved

The primary user is again the archive owner on Android, because the verification target is real mobile usability. The secondary users are QA and developers who need executable flows to verify behavior. The affected process is MVP acceptance: confirm that the product can actually be browsed and edited on a phone-sized device in a coherent way.

3. Expected customer value

The value is reliable acceptance evidence for the mobile-first promise of the MVP. Observable value signals are: real Android-flow validation, earlier detection of usability problems, and confidence that browse and edit behaviors work on the intended primary device instead of only in theory.

4. Urgency and impact if we do nothing

Urgency is medium-high but downstream. Verification is important, yet it cannot produce value before the frontend foundation and first runnable flows exist. If we do nothing, the project may either pretend validation happened without a product surface, or delay acceptance confidence until too late in the cycle.

5. Minimum scope of the change

The minimum scope is to sequence this work explicitly after the first executable EP-03 flows are available. Verification should cover only the actual runnable flows required by the MVP baseline: dashboard entry, search/filter list behavior, detail read-first behavior, explicit edit entry, and create/update flows on phone-sized viewports.

6. Included / Excluded

Included:
- Treat EP-05 / T-02 as a dependency-driven verification task.
- Gate execution of this task on the existence of runnable EP-03 flows.
- Focus verification on Android-usable browse and edit behavior.

Excluded:
- Attempting to verify mobile flows before the UI exists.
- Expanding this task into a broader QA strategy unrelated to the current blocker.
- Treating static mocks or documents as a substitute for executable validation.

7. Acceptance criteria

- EP-05 / T-02 is explicitly sequenced after a runnable frontend shell and first EP-03 flows exist.
- Verification covers dashboard, list/search/filter, detail/edit entry, and create/update behavior on phone-sized viewports.
- The task is not considered complete based on documentation or non-executable artifacts alone.
- Android-targeted validation produces actionable pass/fail evidence tied to real UI behavior.

8. Doubts or open points

- The exact Android device/browser matrix still needs technical definition.
- The minimum evidence format for acceptance may need alignment across product, engineering, and QA.
- Offline-state verification overlap with `EP-05 / T-04` should be coordinated to avoid redundant test effort.

9. Impacts to validate with the technical team

- Define the executable readiness bar that allows EP-05 / T-02 to start.
- Define the device/browser coverage and manual versus automated split for mobile verification.
- Confirm how to isolate UI-usage findings from storage/offline defects found during the same checks.
- Confirm dependencies on the chosen frontend test tooling and PWA runtime behavior.

10. Recommendation

`Do later`
Rationale: the work is necessary, but it is a downstream verification activity and cannot be executed meaningfully before EP-03 produces a runnable mobile UI surface. The correct unblock is sequencing clarity, not premature QA execution.

Internal validation status

`Needs internal technical validation`

Client commitment

`No commitment on timeline or cost until technical validation is complete.`
