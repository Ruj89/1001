# EP-07 Blocked Log

## T-01 Publish the hosted HTTPS PWA release procedure

- Status: `proposed`
- Reason: The release procedure cannot be finalized while the supported browser-only hosted artifact does not yet exist and no hosting model has been selected.
- Evidence: [docs/deployment-strategy.md](/root/bed-project/docs/deployment-strategy.md), [docs/epics/EP-06-browser-only-pwa-deployment-readiness/BLOCKED.md](/root/bed-project/docs/epics/EP-06-browser-only-pwa-deployment-readiness/BLOCKED.md), [docs/epics/EP-07-android-release-validation-and-fallback-distribution/tasks/T-01-publish-the-hosted-https-pwa-release-procedure.md](/root/bed-project/docs/epics/EP-07-android-release-validation-and-fallback-distribution/tasks/T-01-publish-the-hosted-https-pwa-release-procedure.md)
- Missing: Completed browser-only hosted release path and a concrete hosting model to document operationally.
- Next candidate: `EP-07 / T-03`

## T-02 Verify Android install, relaunch, and offline behavior from the deployed artifact

- Status: `proposed`
- Reason: There is no deployed artifact yet to validate from Android, and current verification only covers the local fixture/runtime path.
- Evidence: [docs/epics/EP-05-mvp-verification-and-acceptance-coverage/tasks/T-02-verify-mobile-browse-and-edit-flows.md](/root/bed-project/docs/epics/EP-05-mvp-verification-and-acceptance-coverage/tasks/T-02-verify-mobile-browse-and-edit-flows.md), [docs/epics/EP-07-android-release-validation-and-fallback-distribution/tasks/T-02-verify-android-install-relaunch-and-offline-behavior-from-the-deployed-artifact.md](/root/bed-project/docs/epics/EP-07-android-release-validation-and-fallback-distribution/tasks/T-02-verify-android-install-relaunch-and-offline-behavior-from-the-deployed-artifact.md), [tests/test_mobile_browse_edit_flows.spec.js](/root/bed-project/tests/test_mobile_browse_edit_flows.spec.js)
- Missing: Published Android-facing artifact reachable by browser and a runtime no longer tied to the local Python server.
- Next candidate: `EP-07 / T-03`
