from __future__ import annotations

from dataclasses import dataclass

from lista_normalizer import NormalizedListaDataset


class RisultatiGenerationError(Exception):
    """Raised when normalized input cannot be projected into Risultati entries."""


@dataclass(frozen=True, slots=True)
class RisultatiEntry:
    """Base Risultati entry boundary keyed by effective title."""

    titolo: str
    valore: str


@dataclass(frozen=True, slots=True)
class RisultatiCounts:
    """Documented MVP final counts for the Risultati summary."""

    mancanti: int
    ok: int
    total: int


@dataclass(frozen=True, slots=True)
class RisultatiView:
    """Classified Risultati entries plus the documented final counts."""

    entries: tuple[RisultatiEntry, ...]
    counts: RisultatiCounts


def generate_risultati_view(dataset: NormalizedListaDataset) -> RisultatiView:
    entries: list[RisultatiEntry] = []
    ok_count = 0
    missing_count = 0

    for group in dataset.title_groups:
        titolo = group.titolo.strip()
        if not titolo:
            raise RisultatiGenerationError("Normalized title group is missing an effective title")
        statuses = tuple(row.stato.strip() for row in group.rows)
        if any(not status for status in statuses):
            raise RisultatiGenerationError(f"Normalized title group {titolo!r} has a missing stato")

        if any(status == "OK" for status in statuses) or all(
            status in {"Uscito fuori", "Non reperibile"} for status in statuses
        ):
            valore = "x"
            ok_count += 1
        else:
            valore = "-"
            missing_count += 1

        entries.append(RisultatiEntry(titolo=titolo, valore=valore))

    return RisultatiView(
        entries=tuple(entries),
        counts=RisultatiCounts(
            mancanti=missing_count,
            ok=ok_count,
            total=missing_count + ok_count,
        ),
    )
