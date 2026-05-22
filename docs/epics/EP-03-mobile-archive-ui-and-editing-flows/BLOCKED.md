# EP-03 Historical Blockers

## T-01 Build dashboard and primary navigation

- Status: `resolved`
- Reason: The previous blocker was the absence of an explicit frontend runtime decision and executable UI foundation.
- Resolution: [docs/blocking-analysis.md](/root/bed-project/docs/blocking-analysis.md) now fixes the direction to a browser-based PWA shell in the same repo. The task contract in [T-01](/root/bed-project/docs/epics/EP-03-mobile-archive-ui-and-editing-flows/tasks/T-01-build-dashboard-and-primary-navigation.md) now defines that shell and the dashboard-first navigation baseline.
- Remaining work: Implementation is still missing, but the work is no longer blocked by unspecified product direction.
- Next candidate: `EP-03 / T-01` implementation.

## T-02 Build archive list, search, and status filters

- Status: `resolved`
- Reason: The previous blocker was the absence of a concrete UI runtime and a defined query/filter contract.
- Resolution: The accepted contracts in [T-01](/root/bed-project/docs/epics/EP-03-mobile-archive-ui-and-editing-flows/tasks/T-01-build-dashboard-and-primary-navigation.md) and [T-02](/root/bed-project/docs/epics/EP-03-mobile-archive-ui-and-editing-flows/tasks/T-02-build-archive-list-search-and-status-filters.md) now define the required app shell, title-based browse surface, full-status filtering behavior, and handling of missing imported status values.
- Remaining work: Implementation is still missing, but the task no longer depends on an unresolved product decision.
- Next candidate: `EP-03 / T-02` implementation after `EP-03 / T-01`.

## T-03 Build title detail and edit entry flow

- Status: `resolved`
- Reason: The previous blocker was the absence of an executable frontend foundation plus uncertainty about how to render imported incomplete data.
- Resolution: [docs/blocking-analysis.md](/root/bed-project/docs/blocking-analysis.md) fixes both issues. The accepted contract in [T-03](/root/bed-project/docs/epics/EP-03-mobile-archive-ui-and-editing-flows/tasks/T-03-build-title-detail-and-edit-entry-flow.md) now defines read-first detail behavior, explicit edit entry, and visible rendering of missing imported values.
- Remaining work: Implementation is still missing, but the task no longer needs further product clarification before execution.
- Next candidate: `EP-03 / T-03` implementation after `EP-03 / T-01` and `EP-03 / T-02`.

## T-04 Build create title flow

- Status: `resolved`
- Reason: The previous blocker was the absence of a frontend base plus ambiguity about whether create should inherit the looser import contract.
- Resolution: The accepted contract in [T-04](/root/bed-project/docs/epics/EP-03-mobile-archive-ui-and-editing-flows/tasks/T-04-build-create-title-flow.md) now fixes create as a stricter user-authored flow that still requires a complete initial sub-variant, while remaining inside the same PWA shell defined by `T-01`.
- Remaining work: Implementation is still missing, but no additional blocker remains at the task-contract level.
- Next candidate: `EP-03 / T-04` implementation after `EP-03 / T-01`, `EP-03 / T-02`, and `EP-03 / T-03`.
