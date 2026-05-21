from __future__ import annotations

import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from appoggio_view import (  # noqa: E402
    AppoggioGenerationError,
    AppoggioRow,
    generate_appoggio_rows,
)
from lista_normalizer import (  # noqa: E402
    NormalizedListaDataset,
    NormalizedListaRow,
    NormalizedTitleGroup,
    normalize_lista_rows,
)
from lista_parser import load_lista_workbook  # noqa: E402


class GenerateAppoggioRowsTests(unittest.TestCase):
    def test_projects_title_and_status_from_normalized_rows(self) -> None:
        dataset = NormalizedListaDataset(
            title_groups=(
                NormalizedTitleGroup(
                    titolo="Alpha",
                    rows=(
                        NormalizedListaRow(0, "Alpha", "NES", "v1", "cart", "OK"),
                        NormalizedListaRow(2, "Alpha", "", "v2", "disk", "Wanted"),
                    ),
                ),
                NormalizedTitleGroup(
                    titolo="Beta",
                    rows=(
                        NormalizedListaRow(1, "Beta", "SNES", "", "cart", "Missing"),
                    ),
                ),
            )
        )

        self.assertEqual(
            generate_appoggio_rows(dataset),
            (
                AppoggioRow(0, "Alpha", "OK"),
                AppoggioRow(1, "Beta", "Missing"),
                AppoggioRow(2, "Alpha", "Wanted"),
            ),
        )

    def test_preserves_global_source_row_order_across_title_groups(self) -> None:
        dataset = NormalizedListaDataset(
            title_groups=(
                NormalizedTitleGroup(
                    titolo="Gamma",
                    rows=(
                        NormalizedListaRow(3, "Gamma", "PC", "", "disk", "Three"),
                        NormalizedListaRow(5, "Gamma", "PC", "", "disk", "Five"),
                    ),
                ),
                NormalizedTitleGroup(
                    titolo="Delta",
                    rows=(
                        NormalizedListaRow(1, "Delta", "DOS", "", "disk", "One"),
                    ),
                ),
            )
        )

        self.assertEqual(
            [row.source_row_index for row in generate_appoggio_rows(dataset)],
            [1, 3, 5],
        )

    def test_rejects_invalid_normalized_rows(self) -> None:
        dataset = NormalizedListaDataset(
            title_groups=(
                NormalizedTitleGroup(
                    titolo="Alpha",
                    rows=(
                        NormalizedListaRow(0, "Alpha", "NES", "v1", "cart", "OK"),
                        NormalizedListaRow(1, "Alpha", "SNES", "v2", "cart", "   "),
                    ),
                ),
            )
        )

        with self.assertRaisesRegex(AppoggioGenerationError, "missing stato"):
            generate_appoggio_rows(dataset)

    def test_sample_workbook_generates_documented_projection_not_sample_defect(self) -> None:
        sample_path = Path(__file__).resolve().parents[1] / ".local" / "1001.ods"
        parsed = load_lista_workbook(sample_path)
        normalized = normalize_lista_rows(parsed.lista_rows)

        appoggio_rows = generate_appoggio_rows(normalized)

        self.assertEqual(len(appoggio_rows), 1571)
        self.assertEqual(
            appoggio_rows[:8],
            (
                AppoggioRow(0, "The Oregon Trail", "Da studiare estrazione e comprare"),
                AppoggioRow(1, "The Oregon Trail", "Da studiare estrazione e comprare"),
                AppoggioRow(2, "The Oregon Trail", "Da studiare compilazione"),
                AppoggioRow(3, "Pong", "OK"),
                AppoggioRow(4, "Breakout", "OK"),
                AppoggioRow(5, "Boot Hill", "Non reperibile"),
                AppoggioRow(6, "Combat", "OK"),
                AppoggioRow(7, "Space Invaders", "OK"),
            ),
        )

        final_fantasy_rows = [
            row
            for row in appoggio_rows
            if row.titolo == "Final Fantasy X" and row.stato == "Da comprare"
        ]
        self.assertEqual(len(final_fantasy_rows), 2)


if __name__ == "__main__":
    unittest.main()
