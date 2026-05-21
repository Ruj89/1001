from __future__ import annotations

from dataclasses import dataclass

from lista_normalizer import NormalizedListaDataset


class AppoggioGenerationError(Exception):
    """Raised when normalized input cannot be projected into Appoggio rows."""


@dataclass(frozen=True, slots=True)
class AppoggioRow:
    """Derived Appoggio row: effective title plus the source-row status."""

    source_row_index: int
    titolo: str
    stato: str


def generate_appoggio_rows(dataset: NormalizedListaDataset) -> tuple[AppoggioRow, ...]:
    projected_rows: list[AppoggioRow] = []

    for title_group in dataset.title_groups:
        for row in title_group.rows:
            if not row.titolo.strip():
                raise AppoggioGenerationError(
                    f"Normalized row {row.source_row_index} is missing an effective title"
                )
            if not row.stato.strip():
                raise AppoggioGenerationError(
                    f"Normalized row {row.source_row_index} is missing stato"
                )
            projected_rows.append(
                AppoggioRow(
                    source_row_index=row.source_row_index,
                    titolo=row.titolo,
                    stato=row.stato,
                )
            )

    projected_rows.sort(key=lambda row: row.source_row_index)
    return tuple(projected_rows)
