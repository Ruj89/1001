# EP-05 Historical Blockers

## T-02 Verify mobile browse and edit flows

- Status: `resolved`
- Reason: The previous blocker was that mobile verification was planned before any runnable frontend existed.
- Resolution: [docs/blocking-analysis.md](/root/bed-project/docs/blocking-analysis.md) and the accepted task contract in [T-02](/root/bed-project/docs/epics/EP-05-mvp-verification-and-acceptance-coverage/tasks/T-02-verify-mobile-browse-and-edit-flows.md) now make the sequencing explicit: verification starts only after the executable `EP-03` flows exist.
- Remaining work: The verification task still cannot be executed until `EP-03` is implemented, but the blocker is now dependency sequencing rather than missing scope.
- Next candidate: `EP-03 / T-01` through `EP-03 / T-04`, then `EP-05 / T-02`.

## T-02 Verify mobile browse and edit flows

- Status: `proposed`
- Reason: The current UI runtime now covers dashboard, browse, detail, explicit edit entry, and create flow, but it still lacks a runnable end-to-end update save flow for existing records. The task contract explicitly requires verification of both create and update flows with coherent post-save behavior.
- Evidence: Reviewed [T-02](/root/bed-project/docs/epics/EP-05-mvp-verification-and-acceptance-coverage/tasks/T-02-verify-mobile-browse-and-edit-flows.md), [T-03](/root/bed-project/docs/epics/EP-03-mobile-archive-ui-and-editing-flows/tasks/T-03-build-title-detail-and-edit-entry-flow.md), [T-04](/root/bed-project/docs/epics/EP-03-mobile-archive-ui-and-editing-flows/tasks/T-04-build-create-title-flow.md), and the runnable shell in [webapp/app.js](/root/bed-project/webapp/app.js). The current edit route states that the persistent form is still to be completed in a later task and does not expose a save path for existing records.
- Missing: A runnable update form that persists edits for existing titles or sub-variants and returns coherently to browse/detail contexts.
- Next candidate: none under the current documented backlog; verification can resume once the missing update-flow implementation is added and documented.
