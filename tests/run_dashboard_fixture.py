from __future__ import annotations

import argparse
import sys
from datetime import datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from archive_dashboard_app import run_dashboard_server
from archive_model import SottoVarianteRecord, TitoloRecord
from archive_storage import build_active_local_archive_storage


def _build_fixture_storage():
    return build_active_local_archive_storage(
        (
            TitoloRecord(
                titolo="Puzzle Bobble",
                sotto_varianti=(
                    SottoVarianteRecord(
                        piattaforma="Neo Geo",
                        edizione_versione="",
                        supporto="",
                        stato="",
                    ),
                ),
            ),
            TitoloRecord(
                titolo="Chrono Trigger",
                sotto_varianti=(
                    SottoVarianteRecord(
                        piattaforma="SNES",
                        edizione_versione="PAL",
                        supporto="cartuccia",
                        stato="OK",
                    ),
                ),
            ),
        ),
        activated_at=datetime(2026, 5, 22, 8, 30, 0),
    )


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8765)
    arguments = parser.parse_args()

    server = run_dashboard_server(
        host=arguments.host,
        port=arguments.port,
        storage=_build_fixture_storage(),
    )
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
