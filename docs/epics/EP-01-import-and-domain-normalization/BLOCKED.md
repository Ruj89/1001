## T-02 Normalize fill-down and group titles

- Status: `accepted`
- Reason: `ST-02.4` is blocked by an unresolved contract mismatch between the real sample workbook and the current domain-model requirements.
- Evidence: Inspected [src/lista_normalizer.py](/root/bed-project/src/lista_normalizer.py), [tests/test_lista_normalizer.py](/root/bed-project/tests/test_lista_normalizer.py), [src/archive_model.py](/root/bed-project/src/archive_model.py), [tests/test_archive_model.py](/root/bed-project/tests/test_archive_model.py), and the parsed `.local/1001.ods` sample. After title-only fill-down, the sample still contains 244 rows with at least one blank non-title field, while `SottoVarianteRecord` currently requires non-blank `piattaforma`, `edizione_versione`, `supporto`, and `stato`.
- Missing: A decision on whether blank non-title fields in the sample must remain allowed in the normalized/domain contract, receive additional fill-down semantics, or fail the import as unsupported input.
- Next candidate: `EP-02 / T-01` is the likely next candidate only after this normalization/domain decision is closed; until then, storage schema would be defined against an unstable normalized-record contract.
