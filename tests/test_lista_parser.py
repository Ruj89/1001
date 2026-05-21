from __future__ import annotations

import sys
import tempfile
import unittest
from collections import Counter
from pathlib import Path
import zipfile

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from lista_parser import (  # noqa: E402
    ListaRowParseError,
    ListaSheetResolutionError,
    ListaWorkbookBoundary,
    ODSArchiveError,
    ODSPathError,
    ODSStructureError,
    load_lista_workbook,
)


MINIMAL_CONTENT_XML = """\
<?xml version="1.0" encoding="UTF-8"?>
<office:document-content
    xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0"
    xmlns:table="urn:oasis:names:tc:opendocument:xmlns:table:1.0"
    xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0">
  <office:body>
    <office:spreadsheet>
      {tables}
    </office:spreadsheet>
  </office:body>
</office:document-content>
"""


class LoadListaWorkbookTests(unittest.TestCase):
    def test_loads_sample_workbook_and_resolves_lista_as_first_sheet(self) -> None:
        sample_path = Path(__file__).resolve().parents[1] / ".local" / "1001.ods"

        parsed = load_lista_workbook(sample_path)

        self.assertIsInstance(parsed, ListaWorkbookBoundary)
        self.assertEqual(parsed.source_path, sample_path.resolve())
        self.assertEqual(parsed.sheet_names, ("Lista", "Risultati", "Appoggio"))
        self.assertEqual(parsed.lista_sheet_name, "Lista")
        self.assertEqual(len(parsed.lista_rows), 1571)

        row_lengths = Counter(len(row) for row in parsed.lista_rows)
        self.assertEqual(dict(sorted(row_lengths.items())), {5: 1571})

        self.assertEqual(
            parsed.lista_rows[:5],
            (
                (
                    "The Oregon Trail",
                    "DOS",
                    "the oregon trail classic edition",
                    "CD",
                    "Da studiare estrazione e comprare",
                ),
                (
                    "",
                    "",
                    "Oregon Trail II: 25th Anniversary Limited Edition",
                    "CD",
                    "Da studiare estrazione e comprare",
                ),
                (
                    "",
                    "Mainframe",
                    "Versione BASIC",
                    "Source",
                    "Da studiare compilazione",
                ),
                ("Pong", "Coin-op", "", "TTL", "OK"),
                ("Breakout", "Coin-op", "", "TTL", "OK"),
            ),
        )

    def test_rejects_unreadable_input_path(self) -> None:
        missing_path = Path(tempfile.gettempdir()) / "missing-lista-parser-test.ods"

        with self.assertRaisesRegex(ODSPathError, "not readable"):
            load_lista_workbook(missing_path)

    def test_rejects_non_zip_input(self) -> None:
        with tempfile.TemporaryDirectory() as tmpdir:
            input_path = Path(tmpdir) / "not-an-archive.ods"
            input_path.write_text("plain text", encoding="utf-8")

            with self.assertRaisesRegex(ODSArchiveError, "valid zip archive"):
                load_lista_workbook(input_path)

    def test_rejects_archive_missing_content_xml(self) -> None:
        with tempfile.TemporaryDirectory() as tmpdir:
            input_path = Path(tmpdir) / "missing-content.ods"
            with zipfile.ZipFile(input_path, "w") as archive:
                archive.writestr("mimetype", "application/vnd.oasis.opendocument.spreadsheet")

            with self.assertRaisesRegex(ODSArchiveError, "missing content.xml"):
                load_lista_workbook(input_path)

    def test_rejects_invalid_ods_structure(self) -> None:
        with tempfile.TemporaryDirectory() as tmpdir:
            input_path = Path(tmpdir) / "invalid-structure.ods"
            with zipfile.ZipFile(input_path, "w") as archive:
                archive.writestr(
                    "content.xml",
                    """\
<?xml version="1.0" encoding="UTF-8"?>
<office:document-content xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0" />
""",
                )

            with self.assertRaisesRegex(ODSStructureError, "missing office:body/office:spreadsheet"):
                load_lista_workbook(input_path)

    def test_rejects_malformed_content_xml(self) -> None:
        with tempfile.TemporaryDirectory() as tmpdir:
            input_path = Path(tmpdir) / "malformed-content.ods"
            with zipfile.ZipFile(input_path, "w") as archive:
                archive.writestr("content.xml", "<office:document-content>")

            with self.assertRaisesRegex(ODSStructureError, "well-formed XML"):
                load_lista_workbook(input_path)

    def test_rejects_workbook_without_sheets(self) -> None:
        with tempfile.TemporaryDirectory() as tmpdir:
            input_path = Path(tmpdir) / "no-sheets.ods"
            with zipfile.ZipFile(input_path, "w") as archive:
                archive.writestr("content.xml", MINIMAL_CONTENT_XML.format(tables=""))

            with self.assertRaisesRegex(ListaSheetResolutionError, "contains no sheets"):
                load_lista_workbook(input_path)

    def test_rejects_workbook_when_first_sheet_is_not_lista(self) -> None:
        with tempfile.TemporaryDirectory() as tmpdir:
            input_path = Path(tmpdir) / "wrong-first-sheet.ods"
            with zipfile.ZipFile(input_path, "w") as archive:
                archive.writestr(
                    "content.xml",
                    MINIMAL_CONTENT_XML.format(
                        tables='<table:table table:name="Archivio" />'
                    ),
                )

            with self.assertRaisesRegex(
                ListaSheetResolutionError,
                r"First sheet must be named 'Lista'; found 'Archivio'",
            ):
                load_lista_workbook(input_path)

    def test_expands_repeated_rows_and_cells_preserves_covered_cells_and_drops_empty_rows(self) -> None:
        with tempfile.TemporaryDirectory() as tmpdir:
            input_path = Path(tmpdir) / "repeated-cells.ods"
            with zipfile.ZipFile(input_path, "w") as archive:
                archive.writestr(
                    "content.xml",
                    MINIMAL_CONTENT_XML.format(
                        tables="""\
<table:table table:name="Lista">
  <table:table-row table:number-rows-repeated="2">
    <table:table-cell><text:p> Alpha </text:p></table:table-cell>
    <table:table-cell table:number-columns-repeated="2"><text:p> </text:p></table:table-cell>
    <table:table-cell><text:p> Beta </text:p></table:table-cell>
    <table:table-cell table:number-columns-repeated="3"><text:p> </text:p></table:table-cell>
  </table:table-row>
  <table:table-row>
    <table:covered-table-cell table:number-columns-repeated="2" />
    <table:table-cell><text:p> Delta </text:p></table:table-cell>
    <table:table-cell><text:p> Epsilon </text:p></table:table-cell>
  </table:table-row>
  <table:table-row table:number-rows-repeated="4">
    <table:table-cell table:number-columns-repeated="2"><text:p> </text:p></table:table-cell>
  </table:table-row>
  <table:table-row>
    <table:table-cell table:number-columns-repeated="2"><text:p>Gamma</text:p></table:table-cell>
  </table:table-row>
</table:table>""",
                    ),
                )

            parsed = load_lista_workbook(input_path)

            self.assertEqual(
                parsed.lista_rows,
                (
                    ("Alpha", "", "", "Beta"),
                    ("Alpha", "", "", "Beta"),
                    ("", "", "Delta", "Epsilon"),
                    ("Gamma", "Gamma"),
                ),
            )

    def test_rejects_invalid_repeat_counts(self) -> None:
        with tempfile.TemporaryDirectory() as tmpdir:
            input_path = Path(tmpdir) / "invalid-repeat-count.ods"
            with zipfile.ZipFile(input_path, "w") as archive:
                archive.writestr(
                    "content.xml",
                    MINIMAL_CONTENT_XML.format(
                        tables="""\
<table:table table:name="Lista">
  <table:table-row>
    <table:table-cell table:number-columns-repeated="zero"><text:p>Alpha</text:p></table:table-cell>
  </table:table-row>
</table:table>""",
                    ),
                )

            with self.assertRaisesRegex(ListaRowParseError, "number-columns-repeated"):
                load_lista_workbook(input_path)


if __name__ == "__main__":
    unittest.main()
