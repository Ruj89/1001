# EP-06 Blocked Log

## T-02 Remove local HTTP runtime dependencies from the PWA path

- Status: `proposed`
- Reason: I subtasks implementativi `ST-02.2` to `ST-02.4` require a concrete browser persistence/runtime adapter to replace the Python HTTP boundary, but that adapter contract is not yet frozen.
- Evidence: [docs/epics/EP-02-local-storage-and-dataset-lifecycle/tasks/T-01-define-local-storage-schema-and-versioning.md](/root/bed-project/docs/epics/EP-02-local-storage-and-dataset-lifecycle/tasks/T-01-define-local-storage-schema-and-versioning.md), [docs/epics/EP-06-browser-only-pwa-deployment-readiness/tasks/T-02-remove-local-http-runtime-dependencies-from-the-pwa-path.md](/root/bed-project/docs/epics/EP-06-browser-only-pwa-deployment-readiness/tasks/T-02-remove-local-http-runtime-dependencies-from-the-pwa-path.md), [webapp/app.js](/root/bed-project/webapp/app.js), [src/archive_dashboard_app.py](/root/bed-project/src/archive_dashboard_app.py)
- Missing: Canonical decision on the concrete browser runtime boundary that replaces `/api/dashboard` and local mutation endpoints without reopening storage semantics or test strategy.
- Next candidate: `EP-06 / T-03`

## T-03 Align static assets, local persistence boot, and installability requirements for hosted release

- Status: `proposed`
- Reason: Hosted-release alignment cannot be closed safely while the shell still depends on the local HTTP runtime and the browser-only bootstrap path remains undefined.
- Evidence: [docs/deployment-strategy.md](/root/bed-project/docs/deployment-strategy.md), [docs/epics/EP-06-browser-only-pwa-deployment-readiness/tasks/T-02-remove-local-http-runtime-dependencies-from-the-pwa-path.md](/root/bed-project/docs/epics/EP-06-browser-only-pwa-deployment-readiness/tasks/T-02-remove-local-http-runtime-dependencies-from-the-pwa-path.md), [webapp/service-worker.js](/root/bed-project/webapp/service-worker.js)
- Missing: Completed browser-only bootstrap/write path and the resulting static asset contract.
- Next candidate: `EP-07 / T-03`
