from __future__ import annotations

from dataclasses import dataclass

RawListaRow = tuple[str, str, str, str, str]


class ListaNormalizationError(Exception):
    """Base exception for Lista row normalization failures."""


class ListaTitleFillDownError(ListaNormalizationError):
    """Raised when a blank title appears before any fill-down context exists."""


class ListaRowShapeError(ListaNormalizationError):
    """Raised when a raw Lista row does not match the required 5-column shape."""


@dataclass(frozen=True, slots=True)
class NormalizedListaRow:
    """One raw Lista row with an effective title resolved for later grouping."""

    source_row_index: int
    titolo: str
    piattaforma: str
    edizione_versione: str
    supporto: str
    stato: str


@dataclass(frozen=True, slots=True)
class NormalizedTitleGroup:
    """One exact-title group preserving the source row order within the title."""

    titolo: str
    rows: tuple[NormalizedListaRow, ...]


@dataclass(frozen=True, slots=True)
class NormalizedListaDataset:
    """Grouped normalized Lista rows in title first-seen order."""

    title_groups: tuple[NormalizedTitleGroup, ...]


def normalize_lista_rows(lista_rows: tuple[RawListaRow, ...]) -> NormalizedListaDataset:
    grouped_rows: dict[str, list[NormalizedListaRow]] = {}
    previous_title: str | None = None

    for source_row_index, raw_row in enumerate(lista_rows):
        if len(raw_row) != 5:
            raise ListaRowShapeError(
                f"Row {source_row_index + 1} must contain exactly 5 columns; found {len(raw_row)}"
            )
        titolo, piattaforma, edizione_versione, supporto, stato = raw_row
        normalized_title = titolo.strip()

        if normalized_title:
            effective_title = normalized_title
            previous_title = normalized_title
        else:
            if previous_title is None:
                raise ListaTitleFillDownError(
                    f"Row {source_row_index + 1} has a blank title before any title context exists"
                )
            effective_title = previous_title

        normalized_row = NormalizedListaRow(
            source_row_index=source_row_index,
            titolo=effective_title,
            piattaforma=piattaforma,
            edizione_versione=edizione_versione,
            supporto=supporto,
            stato=stato,
        )
        grouped_rows.setdefault(effective_title, []).append(normalized_row)

    return NormalizedListaDataset(
        title_groups=tuple(
            NormalizedTitleGroup(titolo=title, rows=tuple(rows))
            for title, rows in grouped_rows.items()
        )
    )
