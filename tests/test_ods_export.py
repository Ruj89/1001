from __future__ import annotations

import sys
import unittest
from io import BytesIO
from pathlib import Path
import tempfile
import xml.etree.ElementTree as ET
import zipfile

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from archive_model import SottoVarianteRecord, TitoloRecord
from archive_storage import build_active_local_archive_storage, build_empty_local_archive_storage
from lista_parser import load_lista_workbook
from ods_export import ODSExportError, build_exported_workbook_views, export_operational_ods


def _title_record(
    title: str,
    variants: tuple[tuple[str, str, str, str], ...],
) -> TitoloRecord:
    return TitoloRecord(
        titolo=title,
        sotto_varianti=tuple(
            SottoVarianteRecord(
                piattaforma=platform,
                edizione_versione=edition,
                supporto=support,
                stato=status,
            )
            for platform, edition, support, status in variants
        ),
    )


class ExportOperationalODSTests(unittest.TestCase):
    def test_rejects_export_without_active_archive(self) -> None:
        with self.assertRaisesRegex(ODSExportError, "without an active archive"):
            export_operational_ods(build_empty_local_archive_storage())

    def test_builds_workbook_views_from_active_storage(self) -> None:
        storage = build_active_local_archive_storage(
            (
                _title_record(
                    "Chrono Trigger",
                    (
                        ("SNES", "PAL", "cartuccia", "OK"),
                        ("Nintendo DS", "Remaster", "cartuccia", "Da comprare"),
                    ),
                ),
                _title_record(
                    "Terranigma",
                    (("SNES", "PAL", "cartuccia", "Non reperibile"),),
                ),
            ),
            activated_at=__import__("datetime").datetime(2026, 5, 21, 20, 0, 0),
        )

        views = build_exported_workbook_views(storage)

        self.assertEqual(
            views.lista_rows,
            (
                ("Chrono Trigger", "SNES", "PAL", "cartuccia", "OK"),
                ("", "Nintendo DS", "Remaster", "cartuccia", "Da comprare"),
                ("Terranigma", "SNES", "PAL", "cartuccia", "Non reperibile"),
            ),
        )
        self.assertEqual(
            tuple((row.titolo, row.stato) for row in views.appoggio_rows),
            (
                ("Chrono Trigger", "OK"),
                ("Chrono Trigger", "Da comprare"),
                ("Terranigma", "Non reperibile"),
            ),
        )
        self.assertEqual(
            tuple((entry.titolo, entry.valore) for entry in views.risultati_view.entries),
            (
                ("Chrono Trigger", "x"),
                ("Terranigma", "x"),
            ),
        )
        self.assertEqual(
            (
                views.risultati_view.counts.mancanti,
                views.risultati_view.counts.ok,
                views.risultati_view.counts.total,
            ),
            (0, 2, 2),
        )

    def test_exports_zip_with_required_files_and_sheet_order(self) -> None:
        storage = build_active_local_archive_storage(
            (
                _title_record("Chrono Trigger", (("SNES", "PAL", "cartuccia", "OK"),)),
            ),
            activated_at=__import__("datetime").datetime(2026, 5, 21, 20, 0, 0),
        )

        archive_bytes = export_operational_ods(storage)

        with zipfile.ZipFile(BytesIO(archive_bytes)) as archive:
            self.assertEqual(archive.read("mimetype").decode("utf-8"), "application/vnd.oasis.opendocument.spreadsheet")
            self.assertIn("content.xml", archive.namelist())
            self.assertIn("META-INF/manifest.xml", archive.namelist())
            content_root = ET.fromstring(archive.read("content.xml"))

        ns = {
            "office": "urn:oasis:names:tc:opendocument:xmlns:office:1.0",
            "table": "urn:oasis:names:tc:opendocument:xmlns:table:1.0",
        }
        sheet_names = [
            table.get("{urn:oasis:names:tc:opendocument:xmlns:table:1.0}name")
            for table in content_root.findall("office:body/office:spreadsheet/table:table", ns)
        ]
        self.assertEqual(sheet_names, ["Lista", "Risultati", "Appoggio"])

    def test_exported_lista_sheet_is_parseable_and_preserves_operational_rows(self) -> None:
        storage = build_active_local_archive_storage(
            (
                _title_record(
                    "Chrono Trigger",
                    (
                        ("SNES", "PAL", "cartuccia", "OK"),
                        ("Nintendo DS", "Remaster", "cartuccia", "Da comprare"),
                    ),
                ),
                _title_record("Terranigma", (("SNES", "PAL", "cartuccia", "Non reperibile"),)),
            ),
            activated_at=__import__("datetime").datetime(2026, 5, 21, 20, 0, 0),
        )

        archive_bytes = export_operational_ods(storage)
        with tempfile.TemporaryDirectory() as tempdir:
            destination = Path(tempdir) / "export.ods"
            destination.write_bytes(archive_bytes)
            workbook = load_lista_workbook(destination)

        self.assertEqual(workbook.sheet_names[:3], ("Lista", "Risultati", "Appoggio"))
        self.assertEqual(
            workbook.lista_rows,
            (
                ("Chrono Trigger", "SNES", "PAL", "cartuccia", "OK"),
                ("", "Nintendo DS", "Remaster", "cartuccia", "Da comprare"),
                ("Terranigma", "SNES", "PAL", "cartuccia", "Non reperibile"),
            ),
        )

    def test_export_preserves_blank_imported_variant_fields(self) -> None:
        storage = build_active_local_archive_storage(
            (
                _title_record(
                    "Puzzle Bobble",
                    (("Neo Geo", "", "", ""),),
                ),
            ),
            activated_at=__import__("datetime").datetime(2026, 5, 21, 20, 0, 0),
        )

        views = build_exported_workbook_views(storage)

        self.assertEqual(
            views.lista_rows,
            (("Puzzle Bobble", "Neo Geo", "", "", ""),),
        )


if __name__ == "__main__":
    unittest.main()
