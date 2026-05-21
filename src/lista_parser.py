from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
import zipfile
import xml.etree.ElementTree as ET

NS = {
    "office": "urn:oasis:names:tc:opendocument:xmlns:office:1.0",
    "table": "urn:oasis:names:tc:opendocument:xmlns:table:1.0",
    "text": "urn:oasis:names:tc:opendocument:xmlns:text:1.0",
}

TABLE_CELL = f"{{{NS['table']}}}table-cell"
TEXT_P = f"{{{NS['text']}}}p"


class ListaParserError(Exception):
    """Base exception for Lista workbook loading failures."""


class ODSPathError(ListaParserError):
    """Raised when the input path cannot be opened as a readable file."""


class ODSArchiveError(ListaParserError):
    """Raised when the ODS zip container is invalid or incomplete."""


class ODSStructureError(ListaParserError):
    """Raised when content.xml does not contain the expected workbook structure."""


class ListaSheetResolutionError(ListaParserError):
    """Raised when the workbook does not expose Lista as the first sheet."""


class ListaRowParseError(ListaParserError):
    """Raised when Lista rows cannot be expanded into the accepted raw-row shape."""


@dataclass(frozen=True, slots=True)
class ListaWorkbookBoundary:
    """Minimal parsed boundary for the first operational Lista sheet."""

    source_path: Path
    sheet_names: tuple[str, ...]
    lista_sheet_name: str
    lista_rows: tuple[tuple[str, ...], ...]


def load_lista_workbook(ods_path: str | Path) -> ListaWorkbookBoundary:
    source_path = Path(ods_path)
    _ensure_readable_file(source_path)

    try:
        with zipfile.ZipFile(source_path) as archive:
            if "content.xml" not in archive.namelist():
                raise ODSArchiveError(f"ODS archive is missing content.xml: {source_path}")
            try:
                content_xml = archive.read("content.xml")
            except KeyError as exc:
                raise ODSArchiveError(
                    f"ODS archive is missing content.xml: {source_path}"
                ) from exc
    except ODSArchiveError:
        raise
    except zipfile.BadZipFile as exc:
        raise ODSArchiveError(f"ODS file is not a valid zip archive: {source_path}") from exc
    except OSError as exc:
        raise ODSPathError(f"ODS file path is not readable: {source_path}") from exc

    try:
        root = ET.fromstring(content_xml)
    except ET.ParseError as exc:
        raise ODSStructureError(f"ODS content.xml is not well-formed XML: {source_path}") from exc

    spreadsheet = root.find("office:body/office:spreadsheet", NS)
    if spreadsheet is None:
        raise ODSStructureError(
            "ODS content.xml is missing office:body/office:spreadsheet"
        )

    sheet_tables = tuple(spreadsheet.findall("table:table", NS))
    sheet_names = tuple(
        table.get(f"{{{NS['table']}}}name", "")
        for table in sheet_tables
    )
    if not sheet_names:
        raise ListaSheetResolutionError(f"ODS workbook contains no sheets: {source_path}")

    first_sheet = sheet_tables[0]
    first_sheet_name = sheet_names[0]
    if first_sheet_name != "Lista":
        raise ListaSheetResolutionError(
            f"First sheet must be named 'Lista'; found {first_sheet_name!r}"
        )

    return ListaWorkbookBoundary(
        source_path=source_path.resolve(),
        sheet_names=sheet_names,
        lista_sheet_name=first_sheet_name,
        lista_rows=_extract_non_empty_rows(first_sheet),
    )


def _ensure_readable_file(source_path: Path) -> None:
    try:
        with source_path.open("rb"):
            return
    except OSError as exc:
        raise ODSPathError(f"ODS file path is not readable: {source_path}") from exc


def _extract_non_empty_rows(sheet: ET.Element) -> tuple[tuple[str, ...], ...]:
    rows: list[tuple[str, ...]] = []

    for row_index, row in enumerate(sheet.findall("table:table-row", NS), start=1):
        repeated_rows = _parse_repeat_count(
            row.get(f"{{{NS['table']}}}number-rows-repeated"),
            context=f"row {row_index} number-rows-repeated",
        )
        parsed_row = _parse_row_cells(row)
        if not parsed_row:
            continue

        rows.extend([parsed_row] * repeated_rows)

    return tuple(rows)


def _parse_row_cells(row: ET.Element) -> tuple[str, ...]:
    values: list[str] = []

    for cell_index, cell in enumerate(row, start=1):
        if cell.tag not in {TABLE_CELL, f"{{{NS['table']}}}covered-table-cell"}:
            continue

        repeated_cells = _parse_repeat_count(
            cell.get(f"{{{NS['table']}}}number-columns-repeated"),
            context=f"cell {cell_index} number-columns-repeated",
        )
        cell_text = _extract_cell_text(cell)
        values.extend([cell_text] * repeated_cells)

    while values and values[-1] == "":
        values.pop()

    if not any(value != "" for value in values):
        return ()

    return tuple(values)


def _extract_cell_text(cell: ET.Element) -> str:
    paragraphs: list[str] = []

    for element in cell.iter():
        if element.tag != TEXT_P:
            continue
        text = "".join(element.itertext()).strip()
        if text:
            paragraphs.append(text)

    if paragraphs:
        return "\n".join(paragraphs)

    return (cell.get(f"{{{NS['office']}}}value") or "").strip()


def _parse_repeat_count(raw_value: str | None, *, context: str) -> int:
    if raw_value is None:
        return 1

    try:
        repeat_count = int(raw_value)
    except ValueError as exc:
        raise ListaRowParseError(f"Invalid {context}: {raw_value!r}") from exc

    if repeat_count < 1:
        raise ListaRowParseError(f"Invalid {context}: {raw_value!r}")

    return repeat_count
