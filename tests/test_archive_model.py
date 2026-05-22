from __future__ import annotations

import sys
import unittest
from dataclasses import FrozenInstanceError
from datetime import datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from archive_model import ArchiveMetadataRecord, SottoVarianteRecord, TitoloRecord


class SottoVarianteRecordTests(unittest.TestCase):
    def test_requires_all_four_documented_fields(self) -> None:
        with self.assertRaises(TypeError):
            SottoVarianteRecord(
                piattaforma="NES",
                edizione_versione="PAL",
                supporto="cartuccia",
            )

    def test_normalizes_all_fields(self) -> None:
        record = SottoVarianteRecord(
            piattaforma="  NES  ",
            edizione_versione="  PAL  ",
            supporto="  cartuccia  ",
            stato="  completo  ",
        )

        self.assertEqual(
            record,
            SottoVarianteRecord(
                piattaforma="NES",
                edizione_versione="PAL",
                supporto="cartuccia",
                stato="completo",
            ),
        )

    def test_preserves_blank_fields_for_imported_legacy_data(self) -> None:
        record = SottoVarianteRecord(
            piattaforma=" ",
            edizione_versione="PAL",
            supporto=" ",
            stato="ok",
        )

        self.assertEqual(record.piattaforma, "")
        self.assertEqual(record.edizione_versione, "PAL")
        self.assertEqual(record.supporto, "")
        self.assertEqual(record.stato, "ok")

    def test_require_complete_rejects_blank_write_time_fields(self) -> None:
        invalid_cases = (
            ("piattaforma", dict(piattaforma=" ", edizione_versione="PAL", supporto="cartuccia", stato="ok")),
            ("edizione_versione", dict(piattaforma="NES", edizione_versione=" ", supporto="cartuccia", stato="ok")),
            ("supporto", dict(piattaforma="NES", edizione_versione="PAL", supporto=" ", stato="ok")),
            ("stato", dict(piattaforma="NES", edizione_versione="PAL", supporto="cartuccia", stato=" ")),
        )

        for expected_field, payload in invalid_cases:
            with self.subTest(field=expected_field):
                with self.assertRaisesRegex(ValueError, expected_field):
                    SottoVarianteRecord(**payload).require_complete()

    def test_is_deeply_immutable(self) -> None:
        record = SottoVarianteRecord(
            piattaforma="NES",
            edizione_versione="PAL",
            supporto="cartuccia",
            stato="completo",
        )

        with self.assertRaises(FrozenInstanceError):
            record.stato = "mancante"


class TitoloRecordTests(unittest.TestCase):
    def test_normalizes_title_and_freezes_variant_order(self) -> None:
        first_variant = SottoVarianteRecord(
            piattaforma="NES",
            edizione_versione="PAL",
            supporto="cartuccia",
            stato="completo",
        )
        second_variant = SottoVarianteRecord(
            piattaforma="Game Boy Advance",
            edizione_versione="Player's Choice",
            supporto="cartuccia",
            stato="loose",
        )

        record = TitoloRecord(
            titolo="  Super Mario Bros  ",
            sotto_varianti=[first_variant, second_variant],
        )

        self.assertEqual(record.titolo, "Super Mario Bros")
        self.assertEqual(record.sotto_varianti, (first_variant, second_variant))

    def test_rejects_blank_titles(self) -> None:
        for titolo in ("", "   "):
            with self.subTest(titolo=titolo):
                with self.assertRaisesRegex(ValueError, "non-blank"):
                    TitoloRecord(
                        titolo=titolo,
                        sotto_varianti=[
                            SottoVarianteRecord(
                                piattaforma="NES",
                                edizione_versione="PAL",
                                supporto="cartuccia",
                                stato="ok",
                            )
                        ],
                    )

    def test_requires_at_least_one_sotto_variante(self) -> None:
        with self.assertRaisesRegex(ValueError, "at least one sotto-variante"):
            TitoloRecord(titolo="Metroid Prime", sotto_varianti=[])

    def test_rejects_non_canonical_variant_items(self) -> None:
        with self.assertRaisesRegex(TypeError, "SottoVarianteRecord"):
            TitoloRecord(
                titolo="Metroid Prime",
                sotto_varianti=[{"piattaforma": "GameCube"}],
            )

    def test_is_immutable_after_creation(self) -> None:
        record = TitoloRecord(
            titolo="Tetris",
            sotto_varianti=[
                SottoVarianteRecord(
                    piattaforma="Game Boy",
                    edizione_versione="PAL",
                    supporto="cartuccia",
                    stato="completo",
                )
            ],
        )

        with self.assertRaises(FrozenInstanceError):
            record.titolo = "Dr. Mario"


class ArchiveMetadataRecordTests(unittest.TestCase):
    def test_accepts_active_archive_metadata(self) -> None:
        updated_at = datetime(2026, 5, 21, 12, 0, 0)

        record = ArchiveMetadataRecord(
            archivio_attivo=True,
            numero_record=42,
            ultima_modifica_locale=updated_at,
            versione_schema="  v1  ",
        )

        self.assertTrue(record.archivio_attivo)
        self.assertEqual(record.numero_record, 42)
        self.assertEqual(record.ultima_modifica_locale, updated_at)
        self.assertEqual(record.versione_schema, "v1")

    def test_accepts_empty_state_metadata(self) -> None:
        record = ArchiveMetadataRecord(
            archivio_attivo=False,
            numero_record=0,
            ultima_modifica_locale=None,
            versione_schema="v1",
        )

        self.assertFalse(record.archivio_attivo)
        self.assertEqual(record.numero_record, 0)
        self.assertIsNone(record.ultima_modifica_locale)
        self.assertEqual(record.versione_schema, "v1")

    def test_rejects_negative_record_count(self) -> None:
        with self.assertRaisesRegex(ValueError, "zero or greater"):
            ArchiveMetadataRecord(
                archivio_attivo=True,
                numero_record=-1,
                ultima_modifica_locale=datetime(2026, 5, 21, 12, 0, 0),
                versione_schema="v1",
            )

    def test_rejects_invalid_empty_state_combinations(self) -> None:
        with self.assertRaisesRegex(ValueError, "numero_record must be zero"):
            ArchiveMetadataRecord(
                archivio_attivo=False,
                numero_record=1,
                ultima_modifica_locale=None,
                versione_schema="v1",
            )

        with self.assertRaisesRegex(ValueError, "must be None"):
            ArchiveMetadataRecord(
                archivio_attivo=False,
                numero_record=0,
                ultima_modifica_locale=datetime(2026, 5, 21, 12, 0, 0),
                versione_schema="v1",
            )

    def test_rejects_missing_modification_for_active_archive(self) -> None:
        with self.assertRaisesRegex(ValueError, "must be provided"):
            ArchiveMetadataRecord(
                archivio_attivo=True,
                numero_record=0,
                ultima_modifica_locale=None,
                versione_schema="v1",
            )

    def test_rejects_blank_schema_version(self) -> None:
        with self.assertRaisesRegex(ValueError, "non-blank"):
            ArchiveMetadataRecord(
                archivio_attivo=False,
                numero_record=0,
                ultima_modifica_locale=None,
                versione_schema="   ",
            )

    def test_is_immutable_after_creation(self) -> None:
        record = ArchiveMetadataRecord(
            archivio_attivo=False,
            numero_record=0,
            ultima_modifica_locale=None,
            versione_schema="v1",
        )

        with self.assertRaises(FrozenInstanceError):
            record.numero_record = 3


if __name__ == "__main__":
    unittest.main()
