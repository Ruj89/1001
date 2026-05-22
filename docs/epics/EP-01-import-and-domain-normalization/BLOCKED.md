## T-02 Normalize fill-down and group titles

- Status: `resolved`
- Reason: The previous blocker was a contract mismatch between normalized import output and the domain assumption that every imported sub-variant always had all four non-title fields populated.
- Resolution: [docs/blocking-analysis.md](/root/bed-project/docs/blocking-analysis.md) now fixes the product decision: blank non-title fields from the real workbook remain valid imported legacy data. The task contracts in [T-02](/root/bed-project/docs/epics/EP-01-import-and-domain-normalization/tasks/T-02-normalize-fill-down-and-group-titles.md) and [T-03](/root/bed-project/docs/epics/EP-01-import-and-domain-normalization/tasks/T-03-define-local-domain-model-and-archive-metadata.md) were updated accordingly.
- Remaining work: Engineering still needs to align code and tests with the updated domain contract, but the blocker is no longer a missing product decision.
- Next candidate: `EP-02 / T-01` and `EP-02 / T-03`, which now have enough contract clarity to proceed against the updated blank-value policy.
