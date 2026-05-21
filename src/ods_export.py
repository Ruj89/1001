from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Iterable
import zipfile
import xml.etree.ElementTree as ET

from appoggio_view import AppoggioRow, generate_appoggio_rows
from archive_model import TitoloRecord
from archive_storage import LocalArchiveStorage
from lista_normalizer import NormalizedListaDataset, NormalizedListaRow, NormalizedTitleGroup
from risultati_view import RisultatiEntry, RisultatiView, generate_risultati_view

MIMETYPE = "application/vnd.oasis.opendocument.spreadsheet"

NS = {
    "office": "urn:oasis:names:tc:opendocument:xmlns:office:1.0",
    "style": "urn:oasis:names:tc:opendocument:xmlns:style:1.0",
    "text": "urn:oasis:names:tc:opendocument:xmlns:text:1.0",
    "table": "urn:oasis:names:tc:opendocument:xmlns:table:1.0",
    "manifest": "urn:oasis:names:tc:opendocument:xmlns:manifest:1.0",
    "meta": "urn:oasis:names:tc:opendocument:xmlns:meta:1.0",
}

for prefix, uri in NS.items():
    ET.register_namespace(prefix, uri)


class ODSExportError(Exception):
    """Raised when a local archive cannot be exported as an operational ODS workbook."""


@dataclass(frozen=True, slots=True)
class ExportedWorkbookViews:
    """Materialized workbook content derived from the active local archive."""

    lista_rows: tuple[tuple[str, str, str, str, str], ...]
    appoggio_rows: tuple[AppoggioRow, ...]
    risultati_view: RisultatiView


def export_operational_ods(storage: LocalArchiveStorage) -> bytes:
    workbook_views = build_exported_workbook_views(storage)
    content_xml = _build_content_xml(workbook_views)

    destination = Path("/tmp/export-operational.ods")
    try:
        with zipfile.ZipFile(destination, "w") as archive:
            archive.writestr(
                "mimetype",
                MIMETYPE,
                compress_type=zipfile.ZIP_STORED,
            )
            archive.writestr("META-INF/manifest.xml", _build_manifest_xml())
            archive.writestr("content.xml", content_xml)
            archive.writestr("styles.xml", _build_styles_xml())
            archive.writestr("meta.xml", _build_meta_xml())
        return destination.read_bytes()
    except OSError as exc:
        raise ODSExportError("failed to write ODS workbook bytes") from exc


def build_exported_workbook_views(storage: LocalArchiveStorage) -> ExportedWorkbookViews:
    if not storage.metadata.archivio_attivo or not storage.active_titles:
        raise ODSExportError("cannot export ODS workbook without an active archive")

    lista_rows = tuple(_build_lista_rows(storage.active_titles))
    normalized_dataset = _build_normalized_dataset_from_titles(storage.active_titles)
    appoggio_rows = generate_appoggio_rows(normalized_dataset)
    risultati_view = generate_risultati_view(normalized_dataset)

    return ExportedWorkbookViews(
        lista_rows=lista_rows,
        appoggio_rows=appoggio_rows,
        risultati_view=risultati_view,
    )


def _build_lista_rows(
    active_titles: Iterable[TitoloRecord],
) -> Iterable[tuple[str, str, str, str, str]]:
    for title in active_titles:
        for variant_index, variant in enumerate(title.sotto_varianti):
            yield (
                title.titolo if variant_index == 0 else "",
                variant.piattaforma,
                variant.edizione_versione,
                variant.supporto,
                variant.stato,
            )


def _build_normalized_dataset_from_titles(
    active_titles: Iterable[TitoloRecord],
) -> NormalizedListaDataset:
    title_groups: list[NormalizedTitleGroup] = []
    source_row_index = 0

    for title in active_titles:
        normalized_rows: list[NormalizedListaRow] = []
        for variant in title.sotto_varianti:
            normalized_rows.append(
                NormalizedListaRow(
                    source_row_index=source_row_index,
                    titolo=title.titolo,
                    piattaforma=variant.piattaforma,
                    edizione_versione=variant.edizione_versione,
                    supporto=variant.supporto,
                    stato=variant.stato,
                )
            )
            source_row_index += 1
        title_groups.append(
            NormalizedTitleGroup(
                titolo=title.titolo,
                rows=tuple(normalized_rows),
            )
        )

    return NormalizedListaDataset(title_groups=tuple(title_groups))


def _build_content_xml(workbook_views: ExportedWorkbookViews) -> bytes:
    document = ET.Element(f"{{{NS['office']}}}document-content", {f"{{{NS['office']}}}version": "1.4"})
    body = ET.SubElement(document, f"{{{NS['office']}}}body")
    spreadsheet = ET.SubElement(body, f"{{{NS['office']}}}spreadsheet")

    _append_sheet(spreadsheet, "Lista", workbook_views.lista_rows)
    _append_sheet(
        spreadsheet,
        "Risultati",
        tuple(_build_risultati_rows(workbook_views.risultati_view)),
    )
    _append_sheet(
        spreadsheet,
        "Appoggio",
        tuple((row.titolo, row.stato) for row in workbook_views.appoggio_rows),
    )

    return ET.tostring(document, encoding="utf-8", xml_declaration=True)


def _append_sheet(
    spreadsheet: ET.Element,
    name: str,
    rows: Iterable[tuple[str, ...]],
) -> None:
    table = ET.SubElement(
        spreadsheet,
        f"{{{NS['table']}}}table",
        {f"{{{NS['table']}}}name": name},
    )
    for row_values in rows:
        row = ET.SubElement(table, f"{{{NS['table']}}}table-row")
        for value in row_values:
            cell = ET.SubElement(
                row,
                f"{{{NS['table']}}}table-cell",
                {f"{{{NS['office']}}}value-type": "string"},
            )
            paragraph = ET.SubElement(cell, f"{{{NS['text']}}}p")
            paragraph.text = value


def _build_risultati_rows(risultati_view: RisultatiView) -> Iterable[tuple[str, str]]:
    for entry in risultati_view.entries:
        yield (entry.titolo, entry.valore)
    yield ("Mancanti", str(risultati_view.counts.mancanti))
    yield ("Ok", str(risultati_view.counts.ok))
    yield ("Total", str(risultati_view.counts.total))


def _build_manifest_xml() -> bytes:
    manifest = ET.Element(
        f"{{{NS['manifest']}}}manifest",
        {f"{{{NS['manifest']}}}version": "1.4"},
    )
    for full_path, media_type in (
        ("/", MIMETYPE),
        ("content.xml", "text/xml"),
        ("styles.xml", "text/xml"),
        ("meta.xml", "text/xml"),
    ):
        ET.SubElement(
            manifest,
            f"{{{NS['manifest']}}}file-entry",
            {
                f"{{{NS['manifest']}}}full-path": full_path,
                f"{{{NS['manifest']}}}media-type": media_type,
            },
        )
    return ET.tostring(manifest, encoding="utf-8", xml_declaration=True)


def _build_styles_xml() -> bytes:
    document = ET.Element(f"{{{NS['office']}}}document-styles", {f"{{{NS['office']}}}version": "1.4"})
    ET.SubElement(document, f"{{{NS['office']}}}styles")
    ET.SubElement(document, f"{{{NS['office']}}}automatic-styles")
    ET.SubElement(document, f"{{{NS['office']}}}master-styles")
    return ET.tostring(document, encoding="utf-8", xml_declaration=True)


def _build_meta_xml() -> bytes:
    document = ET.Element(f"{{{NS['office']}}}document-meta", {f"{{{NS['office']}}}version": "1.4"})
    meta = ET.SubElement(document, f"{{{NS['office']}}}meta")
    generator = ET.SubElement(meta, f"{{{NS['meta']}}}generator")
    generator.text = "Codex bed-project ODS export"
    return ET.tostring(document, encoding="utf-8", xml_declaration=True)
