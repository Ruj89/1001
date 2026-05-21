---
name: capotamburo
description: Use this skill when you want an iterative delivery orchestrator that scans `docs/epics`, orders incomplete tasks by blocking impact, expands task contracts, checks implemented status against code, delegates implementation, reviews results, updates task docs, and repeats until the actionable backlog is exhausted.
---

# Capotamburo

Use this skill when the user wants a backlog-driving orchestrator rather than a single specialist skill.

This skill coordinates three existing skills:

- `development-team-agent` for backlog ordering, subtask choice, and implementation review
- `task-contract-docs` for task/subtask contract expansion and status updates
- `consultant-developer` for implementation and technical problem-solving

Every non-launcher iteration must end with a git commit that captures exactly the changes produced in that iteration. The orchestrator must treat the absence of an iteration commit as an incomplete iteration.

## Launcher-Only Mode

When the user asks to "start" or "launch" `capotamburo` as an orchestrator and explicitly indicates that:

- the downstream agents have already been started or should be started immediately;
- the backlog should not be re-scanned or re-analyzed in this turn; or
- the remaining expectation is only to wait for delegated work to finish because tasks are already completed or already in flight,

then do not perform discovery, backlog ordering, code inspection, task promotion, or task-document analysis first.

In this mode:

1. start or resume the already-defined downstream agent flow immediately if needed;
2. do not collect extra evidence from `docs/`, `src/`, or `tests/` unless the user explicitly asks for diagnosis;
3. do not re-open task contracts just to confirm completion;
4. wait for the launched agent work to finish;
5. report only launcher state and completion state.

Use the normal backlog loop only when the user asks for actual orchestration work over not-yet-executed backlog items.

## Use When

Use this skill when the task is to repeatedly:

- inspect `docs/epics` backlog items
- decide what is most blocking
- expand or normalize task contracts
- inspect code to determine real implementation state
- implement the next executable subtask
- review that implementation
- update task and subtask statuses
- continue until no actionable task remains

Do not use this skill for a one-off implementation request with no backlog orchestration requirement.

## Backlog Inputs

Treat these as the canonical orchestration inputs:

- task files: `docs/epics/**/tasks/*.md`
- epic files: `docs/epics/**/README.md`
- blocked logs: `docs/epics/<epic>/BLOCKED.md`
- code and tests in the repo as the source of truth for actual implementation state

## Status Vocabulary

Use exactly these statuses:

- `proposed`
- `accepted`
- `completed`

Interpretation:

- `proposed`: task exists but is either not explicit enough to execute, not yet implemented, or intentionally skipped because it is blocked
- `accepted`: task contract is explicit enough to execute, but the implementation is not yet present or not yet validated
- `completed`: task or subtask is implemented and verified sufficiently by code and checks

## Ordering Policy

Order non-completed tasks using a dependency-first rule.

Default priority order:

1. data contracts and import normalization
2. local storage and dataset lifecycle
3. core browse/edit UI
4. derived views and export
5. verification-only work

Within the same epic:

- prefer the task order listed in the epic `README.md`
- unless code, docs, or explicit dependencies prove another task is a stricter prerequisite

When a task file has explicit dependency language in a richer contract, prefer that over heuristic order.

## Main Loop

Run this loop iteratively:

1. Scan all `docs/epics/**/tasks/*.md`.
2. Ignore tasks with `Status: completed`.
3. Ask the `development-team-agent` to order the remaining tasks by blocking impact using the dependency-first policy above.
4. Select the first task in the ordered list.
5. Read the task file, the parent epic README, and the nearest authoritative docs.
6. Inspect the current code and tests to determine whether the task or some subtasks are already implemented.
7. If subtasks are missing, too vague, or stale, use `task-contract-docs` to expand or promote the task document appropriately.
8. Re-evaluate actual implementation state against the codebase.
9. If the task is blocked by missing decisions, unresolved dependencies, or insufficient contract clarity:
   - keep the task `proposed`
   - append an entry to that epic's `BLOCKED.md`
   - continue to the next orderable task
10. If the task is executable, ask the `development-team-agent` to choose the next subtask to advance.
11. Delegate implementation of that chosen subtask to `consultant-developer`.
12. Ask the `development-team-agent` to review the result for correctness, conformity, and executability.
13. Before ending the iteration, use `task-contract-docs` to update:
   - the selected subtask status
   - the task status if warranted
   - the task text if the contract changed materially
14. Create a git commit for the iteration before continuing.
   - Include code changes, task-doc updates, and any `BLOCKED.md` updates produced in the iteration.
   - Do not carry uncommitted iteration changes into the next loop.
   - Use a commit message that identifies the task and subtask advanced in the iteration.
15. Restart from ordering instead of assuming the previous backlog order still holds.

Exception:

- If `Launcher-Only Mode` applies, skip this loop entirely and only manage delegation and waiting.

## Blocked Task Handling

If a task cannot be progressed safely:

- do not promote it to `accepted`
- do not mark it `completed`
- keep it `proposed`
- record the skip in `docs/epics/<epic>/BLOCKED.md`
- continue the loop

Each blocked entry should include:

- task id
- why it was skipped
- what evidence was inspected
- what dependency, decision, or contract detail is missing
- what task can proceed instead, if known

## Agent Responsibilities

### `development-team-agent`

Use it to:

- rank incomplete tasks by blocking impact
- decide which subtask should be advanced next
- review the implementation produced in the iteration
- judge whether the result is aligned with requirements, use cases, stories, and task contract

It is the reviewer and backlog judge, not the implementer.

### `task-contract-docs`

Use it to:

- expand lightweight proposed tasks when subtasks are missing or unclear
- promote tasks from `proposed` to `accepted` when the contract is explicit enough but not implemented
- mark tasks or subtasks `completed` only when code/tests show the work is implemented
- keep task docs as the canonical textual state of the backlog

It is the source of truth for task/subtask document status.

### `consultant-developer`

Use it to:

- implement the selected subtask
- resolve technical tradeoffs during implementation
- use `ods-analyzer` reasoning when spreadsheet-backed behavior is involved
- align code changes with offline-first, local-first, and export-fidelity constraints when relevant

It is the implementer and technical problem-solver.

## Required Outputs Per Iteration

Each successful iteration should leave behind some or all of these artifacts:

- code changes for the chosen subtask
- updated task file
- updated subtask statuses
- updated parent task status when warranted
- updated per-epic `BLOCKED.md` when a task was skipped
- one git commit containing the iteration outcome

## Output Guidance

When using this skill, always distinguish:

- backlog ordering decision
- blocked versus executable task
- documented status versus actual implementation state
- implementation result versus review result

If `Launcher-Only Mode` applies, collapse the output to:

- launched agents
- waiting state
- final completion state

Prefer concise iteration logs with:

- chosen task
- chosen subtask
- reason for priority
- implementation outcome
- review outcome
- status changes
- commit hash and commit message
- next ordered task

## Stop Condition

Continue until every remaining task is one of:

- `completed`, or
- still `proposed` and explicitly skipped as blocked under the current evidence

Do not stop the entire loop at the first blocked task.

## References

- For task promotion and status document rules, read [../task-contract-docs/SKILL.md](../task-contract-docs/SKILL.md).
- For backlog review and subtask selection, read [../development-team-agent/SKILL.md](../development-team-agent/SKILL.md).
- For implementation and technical consulting, read [../consultant-developer/SKILL.md](../consultant-developer/SKILL.md).
- For deterministic ordering and blocked-log conventions, read [references/orchestration-rules.md](references/orchestration-rules.md).
