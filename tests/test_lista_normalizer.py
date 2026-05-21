from __future__ import annotations

import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from lista_normalizer import (  # noqa: E402
    ListaRowShapeError,
    ListaTitleFillDownError,
    NormalizedListaDataset,
    NormalizedListaRow,
    NormalizedTitleGroup,
    normalize_lista_rows,
)
from lista_parser import load_lista_workbook  # noqa: E402


class NormalizeListaRowsTests(unittest.TestCase):
    def test_blank_title_inherits_previous_title_only(self) -> None:
        normalized = normalize_lista_rows(
            (
                ("  The Oregon Trail  ", "DOS", "Classic", "CD", "OK"),
                ("   ", "", "Limited Edition", "", "Da studiare"),
            )
        )

        self.assertEqual(
            normalized.title_groups,
            (
                NormalizedTitleGroup(
                    titolo="The Oregon Trail",
                    rows=normalized.title_groups[0].rows,
                ),
            ),
        )
        self.assertEqual(
            normalized.title_groups[0].rows,
            (
                NormalizedListaRow(
                    source_row_index=0,
                    titolo="The Oregon Trail",
                    piattaforma="DOS",
                    edizione_versione="Classic",
                    supporto="CD",
                    stato="OK",
                ),
                NormalizedListaRow(
                    source_row_index=1,
                    titolo="The Oregon Trail",
                    piattaforma="",
                    edizione_versione="Limited Edition",
                    supporto="",
                    stato="Da studiare",
                ),
            ),
        )

    def test_groups_rows_by_exact_effective_title(self) -> None:
        normalized = normalize_lista_rows(
            (
                ("  Alpha  ", "NES", "v1", "cart", "OK"),
                ("Beta", "SNES", "v1", "cart", "OK"),
                ("Alpha", "Game Boy", "v2", "cart", "OK"),
                ("alpha", "PC", "v1", "disk", "OK"),
            )
        )

        self.assertEqual(
            tuple(group.titolo for group in normalized.title_groups),
            ("Alpha", "Beta", "alpha"),
        )
        self.assertEqual(
            tuple(row.piattaforma for row in normalized.title_groups[0].rows),
            ("NES", "Game Boy"),
        )

    def test_preserves_row_order_within_title_group(self) -> None:
        normalized = normalize_lista_rows(
            (
                ("Alpha", "NES", "v1", "cart", "OK"),
                ("Beta", "SNES", "v1", "cart", "OK"),
                ("", "Game Boy", "v2", "cart", "OK"),
                ("Alpha", "PC", "v3", "disk", "OK"),
            )
        )

        self.assertEqual(
            tuple(row.source_row_index for row in normalized.title_groups[0].rows),
            (0, 3),
        )
        self.assertEqual(
            tuple(row.source_row_index for row in normalized.title_groups[1].rows),
            (1, 2),
        )

    def test_rejects_initial_blank_title(self) -> None:
        with self.assertRaisesRegex(ListaTitleFillDownError, "blank title"):
            normalize_lista_rows(
                (
                    ("", "DOS", "Classic", "CD", "OK"),
                )
            )

    def test_rejects_rows_that_do_not_match_the_five_column_contract(self) -> None:
        with self.assertRaisesRegex(ListaRowShapeError, "exactly 5 columns"):
            normalize_lista_rows(
                (
                    ("Alpha", "DOS", "Classic", "CD"),
                )
            )

    def test_sample_workbook_handles_blank_titles_and_preserves_group_order(self) -> None:
        sample_path = Path(__file__).resolve().parents[1] / ".local" / "1001.ods"
        parsed = load_lista_workbook(sample_path)

        blank_title_rows = tuple(
            index
            for index, row in enumerate(parsed.lista_rows)
            if row[0].strip() == ""
        )
        normalized = normalize_lista_rows(parsed.lista_rows)

        self.assertIsInstance(normalized, NormalizedListaDataset)
        self.assertEqual(len(blank_title_rows), 521)
        self.assertEqual(len(normalized.title_groups), 1049)
        self.assertEqual(
            tuple(group.titolo for group in normalized.title_groups[:10]),
            (
                "The Oregon Trail",
                "Pong",
                "Breakout",
                "Boot Hill",
                "Combat",
                "Space Invaders",
                "Adventure",
                "Asteroids",
                "Galaxian",
                "Lunar Lander",
            ),
        )
        self.assertEqual(
            tuple(group.titolo for group in normalized.title_groups[-5:]),
            (
                "Turrican",
                "Castle of Illusion Starring Mickey Mouse",
                "Zelda II: The Adventure of Link",
                "King’s Quest I",
                "King’s Quest IV",
            ),
        )
        self.assertEqual(
            tuple(row.source_row_index for row in normalized.title_groups[0].rows),
            (0, 1, 2),
        )

        handled_blank_title_rows = sum(
            1
            for group in normalized.title_groups
            for row in group.rows
            if row.source_row_index in blank_title_rows
        )
        self.assertEqual(handled_blank_title_rows, 521)


if __name__ == "__main__":
    unittest.main()
