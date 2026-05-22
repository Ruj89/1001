from __future__ import annotations

import sys
import unittest
from datetime import datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from archive_model import SottoVarianteRecord, TitoloRecord
from archive_storage import (
    ARCHIVE_STORAGE_SCHEMA_VERSION,
    ArchiveStorageConfirmationError,
    ArchiveStorageMutationError,
    ArchiveStorageShapeError,
    ArchiveStorageVersionError,
    build_active_local_archive_storage,
    build_empty_local_archive_storage,
    clear_pending_import,
    create_title_record,
    deserialize_local_archive_storage,
    has_active_archive,
    requires_overwrite_confirmation,
    resolve_pending_import_overwrite,
    serialize_local_archive_storage,
    stage_pending_import,
    update_sub_variant_record,
    update_title_record,
)


def _sample_title(title: str = "Chrono Trigger") -> TitoloRecord:
    return TitoloRecord(
        titolo=title,
        sotto_varianti=(
            SottoVarianteRecord(
                piattaforma="SNES",
                edizione_versione="PAL",
                supporto="cartuccia",
                stato="OK",
            ),
        ),
    )


def _sample_imported_title_with_blank_fields(title: str = "Puzzle Bobble") -> TitoloRecord:
    return TitoloRecord(
        titolo=title,
        sotto_varianti=(
            SottoVarianteRecord(
                piattaforma="Neo Geo",
                edizione_versione="",
                supporto="",
                stato="",
            ),
        ),
    )


class LocalArchiveStorageTests(unittest.TestCase):
    def test_builds_empty_storage_with_current_schema_version(self) -> None:
        storage = build_empty_local_archive_storage()

        self.assertEqual(storage.schema_version, ARCHIVE_STORAGE_SCHEMA_VERSION)
        self.assertEqual(storage.active_titles, ())
        self.assertFalse(storage.metadata.archivio_attivo)
        self.assertIsNone(storage.pending_import)

    def test_builds_active_storage_with_metadata_aligned_to_title_count(self) -> None:
        activated_at = datetime(2026, 5, 21, 14, 0, 0)
        storage = build_active_local_archive_storage(
            (_sample_title("Chrono Trigger"), _sample_title("Terranigma")),
            activated_at=activated_at,
        )

        self.assertEqual(len(storage.active_titles), 2)
        self.assertTrue(storage.metadata.archivio_attivo)
        self.assertEqual(storage.metadata.numero_record, 2)
        self.assertEqual(storage.metadata.ultima_modifica_locale, activated_at)
        self.assertIsNone(storage.pending_import)

    def test_stages_pending_import_without_overwriting_active_archive(self) -> None:
        active_storage = build_active_local_archive_storage(
            (_sample_title("Chrono Trigger"),),
            activated_at=datetime(2026, 5, 21, 14, 0, 0),
        )

        staged_storage = stage_pending_import(
            active_storage,
            source_name="incoming.ods",
            titoli=(_sample_title("Final Fantasy VI"),),
            staged_at=datetime(2026, 5, 21, 15, 0, 0),
        )

        self.assertEqual(tuple(title.titolo for title in staged_storage.active_titles), ("Chrono Trigger",))
        self.assertIsNotNone(staged_storage.pending_import)
        self.assertEqual(staged_storage.pending_import.source_name, "incoming.ods")
        self.assertEqual(
            tuple(title.titolo for title in staged_storage.pending_import.titoli),
            ("Final Fantasy VI",),
        )
        self.assertTrue(has_active_archive(staged_storage))
        self.assertTrue(requires_overwrite_confirmation(staged_storage))

    def test_serialization_round_trip_preserves_active_and_pending_state(self) -> None:
        storage = stage_pending_import(
            build_active_local_archive_storage(
                (_sample_title("Chrono Trigger"),),
                activated_at=datetime(2026, 5, 21, 14, 0, 0),
            ),
            source_name="incoming.ods",
            titoli=(_sample_title("Terranigma"),),
            staged_at=datetime(2026, 5, 21, 15, 0, 0),
        )

        restored = deserialize_local_archive_storage(serialize_local_archive_storage(storage))

        self.assertEqual(restored, storage)

    def test_serialization_round_trip_preserves_blank_imported_variant_fields(self) -> None:
        storage = stage_pending_import(
            build_active_local_archive_storage(
                (_sample_imported_title_with_blank_fields(),),
                activated_at=datetime(2026, 5, 21, 14, 0, 0),
            ),
            source_name="incoming.ods",
            titoli=(_sample_imported_title_with_blank_fields("Terranigma"),),
            staged_at=datetime(2026, 5, 21, 15, 0, 0),
        )

        restored = deserialize_local_archive_storage(serialize_local_archive_storage(storage))

        self.assertEqual(restored, storage)

    def test_rejects_unsupported_schema_versions_during_recovery(self) -> None:
        with self.assertRaisesRegex(ArchiveStorageVersionError, "unsupported schema version"):
            deserialize_local_archive_storage(
                {
                    "schemaVersion": "v0",
                    "activeArchive": None,
                    "pendingImport": None,
                }
            )

    def test_rejects_invalid_storage_shape_during_recovery(self) -> None:
        with self.assertRaisesRegex(ArchiveStorageShapeError, "activeArchive.titles must be a list"):
            deserialize_local_archive_storage(
                {
                    "schemaVersion": ARCHIVE_STORAGE_SCHEMA_VERSION,
                    "activeArchive": {
                        "titles": "not-a-list",
                        "metadata": {
                            "archivioAttivo": True,
                            "numeroRecord": 1,
                            "ultimaModificaLocale": "2026-05-21T14:00:00",
                            "versioneSchema": ARCHIVE_STORAGE_SCHEMA_VERSION,
                        },
                    },
                    "pendingImport": None,
                }
            )

    def test_can_clear_pending_import_without_touching_active_archive(self) -> None:
        storage = stage_pending_import(
            build_active_local_archive_storage(
                (_sample_title("Chrono Trigger"),),
                activated_at=datetime(2026, 5, 21, 14, 0, 0),
            ),
            source_name="incoming.ods",
            titoli=(_sample_title("Terranigma"),),
            staged_at=datetime(2026, 5, 21, 15, 0, 0),
        )

        cleared = clear_pending_import(storage)

        self.assertIsNone(cleared.pending_import)
        self.assertEqual(cleared.active_titles, storage.active_titles)
        self.assertEqual(cleared.metadata, storage.metadata)

    def test_confirmation_activates_pending_import_atomically(self) -> None:
        staged_storage = stage_pending_import(
            build_active_local_archive_storage(
                (_sample_title("Chrono Trigger"),),
                activated_at=datetime(2026, 5, 21, 14, 0, 0),
            ),
            source_name="incoming.ods",
            titoli=(_sample_title("Final Fantasy VI"), _sample_title("Terranigma")),
            staged_at=datetime(2026, 5, 21, 15, 0, 0),
        )

        activated = resolve_pending_import_overwrite(
            staged_storage,
            confirmed=True,
            resolved_at=datetime(2026, 5, 21, 16, 0, 0),
        )

        self.assertEqual(
            tuple(title.titolo for title in activated.active_titles),
            ("Final Fantasy VI", "Terranigma"),
        )
        self.assertEqual(activated.metadata.numero_record, 2)
        self.assertIsNone(activated.pending_import)

    def test_cancel_keeps_previous_active_archive_and_discards_pending_import(self) -> None:
        staged_storage = stage_pending_import(
            build_active_local_archive_storage(
                (_sample_title("Chrono Trigger"),),
                activated_at=datetime(2026, 5, 21, 14, 0, 0),
            ),
            source_name="incoming.ods",
            titoli=(_sample_title("Final Fantasy VI"),),
            staged_at=datetime(2026, 5, 21, 15, 0, 0),
        )

        cancelled = resolve_pending_import_overwrite(
            staged_storage,
            confirmed=False,
            resolved_at=datetime(2026, 5, 21, 16, 0, 0),
        )

        self.assertEqual(
            tuple(title.titolo for title in cancelled.active_titles),
            ("Chrono Trigger",),
        )
        self.assertIsNone(cancelled.pending_import)
        self.assertEqual(cancelled.metadata, staged_storage.metadata)

    def test_rejects_overwrite_resolution_without_pending_import(self) -> None:
        with self.assertRaisesRegex(ArchiveStorageConfirmationError, "staged pending import"):
            resolve_pending_import_overwrite(
                build_empty_local_archive_storage(),
                confirmed=True,
                resolved_at=datetime(2026, 5, 21, 16, 0, 0),
            )

    def test_updates_title_record_and_refreshes_metadata_timestamp(self) -> None:
        storage = build_active_local_archive_storage(
            (_sample_title("Chrono Trigger"),),
            activated_at=datetime(2026, 5, 21, 14, 0, 0),
        )

        updated = update_title_record(
            storage,
            existing_title="Chrono Trigger",
            updated_title=_sample_title("Chrono Trigger DS"),
            updated_at=datetime(2026, 5, 21, 17, 0, 0),
        )

        self.assertEqual(tuple(title.titolo for title in updated.active_titles), ("Chrono Trigger DS",))
        self.assertEqual(updated.metadata.numero_record, 1)
        self.assertEqual(updated.metadata.ultima_modifica_locale, datetime(2026, 5, 21, 17, 0, 0))

    def test_updates_sub_variant_without_breaking_required_fields_contract(self) -> None:
        storage = build_active_local_archive_storage(
            (_sample_title("Chrono Trigger"),),
            activated_at=datetime(2026, 5, 21, 14, 0, 0),
        )

        updated = update_sub_variant_record(
            storage,
            title="Chrono Trigger",
            variant_index=0,
            updated_variant=SottoVarianteRecord(
                piattaforma="Nintendo DS",
                edizione_versione="Remaster",
                supporto="cartuccia",
                stato="Da comprare",
            ),
            updated_at=datetime(2026, 5, 21, 17, 30, 0),
        )

        variant = updated.active_titles[0].sotto_varianti[0]
        self.assertEqual(variant.piattaforma, "Nintendo DS")
        self.assertEqual(variant.stato, "Da comprare")
        self.assertEqual(updated.metadata.ultima_modifica_locale, datetime(2026, 5, 21, 17, 30, 0))

    def test_rejects_incomplete_write_time_variants_for_create_and_update(self) -> None:
        storage = build_active_local_archive_storage(
            (_sample_title("Chrono Trigger"),),
            activated_at=datetime(2026, 5, 21, 14, 0, 0),
        )

        incomplete_variant = SottoVarianteRecord(
            piattaforma="Nintendo DS",
            edizione_versione="",
            supporto="cartuccia",
            stato="Da comprare",
        )

        with self.assertRaisesRegex(ValueError, "edizione_versione"):
            update_sub_variant_record(
                storage,
                title="Chrono Trigger",
                variant_index=0,
                updated_variant=incomplete_variant,
                updated_at=datetime(2026, 5, 21, 17, 30, 0),
            )

        with self.assertRaisesRegex(ValueError, "edizione_versione"):
            create_title_record(
                storage,
                new_title=TitoloRecord(
                    titolo="Terranigma",
                    sotto_varianti=(incomplete_variant,),
                ),
                created_at=datetime(2026, 5, 21, 18, 0, 0),
            )

        with self.assertRaisesRegex(ValueError, "edizione_versione"):
            update_title_record(
                storage,
                existing_title="Chrono Trigger",
                updated_title=TitoloRecord(
                    titolo="Chrono Trigger DS",
                    sotto_varianti=(incomplete_variant,),
                ),
                updated_at=datetime(2026, 5, 21, 18, 15, 0),
            )

    def test_creates_new_title_and_increments_record_count(self) -> None:
        storage = build_active_local_archive_storage(
            (_sample_title("Chrono Trigger"),),
            activated_at=datetime(2026, 5, 21, 14, 0, 0),
        )

        created = create_title_record(
            storage,
            new_title=_sample_title("Terranigma"),
            created_at=datetime(2026, 5, 21, 18, 0, 0),
        )

        self.assertEqual(
            tuple(title.titolo for title in created.active_titles),
            ("Chrono Trigger", "Terranigma"),
        )
        self.assertEqual(created.metadata.numero_record, 2)
        self.assertEqual(created.metadata.ultima_modifica_locale, datetime(2026, 5, 21, 18, 0, 0))

    def test_create_can_activate_first_title_from_empty_storage(self) -> None:
        created = create_title_record(
            build_empty_local_archive_storage(),
            new_title=_sample_title("Chrono Trigger"),
            created_at=datetime(2026, 5, 21, 18, 30, 0),
        )

        self.assertTrue(created.metadata.archivio_attivo)
        self.assertEqual(created.metadata.numero_record, 1)
        self.assertEqual(tuple(title.titolo for title in created.active_titles), ("Chrono Trigger",))

    def test_rejects_duplicate_title_creation_and_missing_update_targets(self) -> None:
        storage = build_active_local_archive_storage(
            (_sample_title("Chrono Trigger"),),
            activated_at=datetime(2026, 5, 21, 14, 0, 0),
        )

        with self.assertRaisesRegex(ArchiveStorageMutationError, "already exists"):
            create_title_record(
                storage,
                new_title=_sample_title("Chrono Trigger"),
                created_at=datetime(2026, 5, 21, 18, 0, 0),
            )

        with self.assertRaisesRegex(ArchiveStorageMutationError, "was not found"):
            update_title_record(
                storage,
                existing_title="Terranigma",
                updated_title=_sample_title("Terranigma"),
                updated_at=datetime(2026, 5, 21, 18, 15, 0),
            )


if __name__ == "__main__":
    unittest.main()
