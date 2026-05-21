from __future__ import annotations

import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from lista_normalizer import (  # noqa: E402
    NormalizedListaDataset,
    NormalizedListaRow,
    NormalizedTitleGroup,
    normalize_lista_rows,
)
from lista_parser import load_lista_workbook  # noqa: E402
from risultati_view import (  # noqa: E402
    RisultatiEntry,
    RisultatiGenerationError,
    RisultatiCounts,
    RisultatiView,
    generate_risultati_view,
)


class GenerateRisultatiViewTests(unittest.TestCase):
    def test_builds_one_classified_entry_per_normalized_title_group_in_order(self) -> None:
        dataset = NormalizedListaDataset(
            title_groups=(
                NormalizedTitleGroup(
                    titolo="Alpha",
                    rows=(NormalizedListaRow(0, "Alpha", "NES", "", "cart", "OK"),),
                ),
                NormalizedTitleGroup(
                    titolo="Beta",
                    rows=(
                        NormalizedListaRow(1, "Beta", "SNES", "", "cart", "Wanted"),
                        NormalizedListaRow(2, "Beta", "SNES", "", "disk", "OK"),
                    ),
                ),
            )
        )

        self.assertEqual(
            generate_risultati_view(dataset),
            RisultatiView(
                entries=(
                    RisultatiEntry("Alpha", "x"),
                    RisultatiEntry("Beta", "x"),
                ),
                counts=RisultatiCounts(mancanti=0, ok=2, total=2),
            ),
        )

    def test_rejects_blank_effective_titles(self) -> None:
        dataset = NormalizedListaDataset(
            title_groups=(
                NormalizedTitleGroup(
                    titolo="   ",
                    rows=(NormalizedListaRow(0, "   ", "NES", "", "cart", "OK"),),
                ),
            )
        )

        with self.assertRaisesRegex(RisultatiGenerationError, "effective title"):
            generate_risultati_view(dataset)

    def test_rejects_missing_stato(self) -> None:
        dataset = NormalizedListaDataset(
            title_groups=(
                NormalizedTitleGroup(
                    titolo="Alpha",
                    rows=(NormalizedListaRow(0, "Alpha", "NES", "", "cart", "   "),),
                ),
            )
        )

        with self.assertRaisesRegex(RisultatiGenerationError, "missing stato"):
            generate_risultati_view(dataset)

    def test_applies_documented_x_dash_rule_and_counts(self) -> None:
        dataset = NormalizedListaDataset(
            title_groups=(
                NormalizedTitleGroup(
                    titolo="Alpha",
                    rows=(
                        NormalizedListaRow(0, "Alpha", "NES", "", "cart", "OK"),
                        NormalizedListaRow(1, "Alpha", "NES", "", "cart", "Wanted"),
                    ),
                ),
                NormalizedTitleGroup(
                    titolo="Beta",
                    rows=(
                        NormalizedListaRow(2, "Beta", "SNES", "", "cart", "Uscito fuori"),
                        NormalizedListaRow(3, "Beta", "SNES", "", "cart", "Non reperibile"),
                    ),
                ),
                NormalizedTitleGroup(
                    titolo="Gamma",
                    rows=(
                        NormalizedListaRow(4, "Gamma", "DOS", "", "disk", "Da comprare"),
                    ),
                ),
            )
        )

        result = generate_risultati_view(dataset)

        self.assertEqual(
            result.entries,
            (
                RisultatiEntry("Alpha", "x"),
                RisultatiEntry("Beta", "x"),
                RisultatiEntry("Gamma", "-"),
            ),
        )
        self.assertEqual(result.counts, RisultatiCounts(mancanti=1, ok=2, total=3))

    def test_sample_workbook_builds_1049_entries_in_operational_order(self) -> None:
        sample_path = Path(__file__).resolve().parents[1] / ".local" / "1001.ods"
        normalized = normalize_lista_rows(load_lista_workbook(sample_path).lista_rows)

        result = generate_risultati_view(normalized)
        entries = result.entries

        self.assertEqual(len(entries), 1049)
        self.assertEqual(
            entries[:12],
            (
                RisultatiEntry("The Oregon Trail", "-"),
                RisultatiEntry("Pong", "x"),
                RisultatiEntry("Breakout", "x"),
                RisultatiEntry("Boot Hill", "x"),
                RisultatiEntry("Combat", "x"),
                RisultatiEntry("Space Invaders", "x"),
                RisultatiEntry("Adventure", "x"),
                RisultatiEntry("Asteroids", "x"),
                RisultatiEntry("Galaxian", "x"),
                RisultatiEntry("Lunar Lander", "x"),
                RisultatiEntry("Battle Zone", "x"),
                RisultatiEntry("Defender", "-"),
            ),
        )
        self.assertEqual(result.counts, RisultatiCounts(mancanti=564, ok=485, total=1049))


if __name__ == "__main__":
    unittest.main()
