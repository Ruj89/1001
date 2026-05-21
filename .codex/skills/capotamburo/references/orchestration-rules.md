# Capotamburo Orchestration Rules

This file defines the deterministic rules that the `capotamburo` skill should use while iterating on the backlog.

## 1. Task Discovery

- Read every task file under `docs/epics/**/tasks/*.md`.
- Read the matching epic README before making an ordering decision.
- Treat code and tests as the source of truth for real implementation state.

## 2. Ordering Rules

Apply this order unless explicit task dependencies in the docs override it:

1. import and domain-normalization work
2. local storage and dataset lifecycle work
3. primary mobile UI and editing work
4. derived view and export work
5. verification-only work

Tie-breakers:

- first use task order from the epic README
- then prefer lower-numbered task ids
- then prefer the task that unblocks more other tasks

## 3. Status Rules

### `proposed`

Use when:

- the task is still a lightweight placeholder
- the task is not explicit enough to execute
- the task is blocked and must be skipped
- the task is not implemented and has not yet been promoted to execution-ready

### `accepted`

Use when:

- the task contract is explicit enough to execute
- the codebase does not yet show the task as implemented

### `completed`

Use when:

- the task contract is explicit enough for downstream work
- the code or tests show the task has been implemented
- the implementation has been reviewed in the current iteration or is already verifiably present

## 4. Subtask Rules

- Subtasks may use the same `proposed | accepted | completed` status vocabulary.
- If subtasks are too vague, `task-contract-docs` should expand them before implementation continues.
- A parent task does not become `completed` until all required subtasks for the approved slice are completed.

## 5. Blocked Task Rules

When a task is blocked:

- keep the task `proposed`
- do not silently skip it
- write or update `docs/epics/<epic>/BLOCKED.md`
- continue with the next orderable task

## 6. `BLOCKED.md` Entry Shape

Each blocked entry should contain:

- task id
- current status
- reason blocked
- evidence inspected
- missing decision or dependency
- next possible task to continue with, if known

Suggested shape:

```md
## T-XX Task title

- Status: `proposed`
- Reason: ...
- Evidence: ...
- Missing: ...
- Next candidate: ...
```

## 7. Iteration Sequence

For each loop:

1. Order tasks with `development-team-agent`
2. Select first actionable candidate
3. Normalize or promote task contract with `task-contract-docs` if needed
4. Inspect code/tests to determine actual implementation state
5. If blocked, log and continue
6. Choose next subtask with `development-team-agent`
7. Implement with `consultant-developer`
8. Review with `development-team-agent`
9. Update statuses and task text with `task-contract-docs`
10. Commit the iteration changes to git with a task-specific message
11. Reorder backlog and repeat

## 9. Commit Rules

- Every non-launcher iteration must end with exactly one git commit.
- The commit must include all artifacts produced by that iteration:
  - code changes
  - task document updates
  - `BLOCKED.md` changes when present
- Do not start the next backlog iteration while iteration changes are still uncommitted.
- The commit message should name the task id and the subtask or slice completed in that iteration.

## 10. Role Separation

- `development-team-agent`: prioritization, subtask choice, review
- `task-contract-docs`: contract normalization and textual status authority
- `consultant-developer`: implementation

Do not merge these responsibilities conceptually when reporting the iteration outcome.
