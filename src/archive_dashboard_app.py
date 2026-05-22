from __future__ import annotations

import argparse
import json
from dataclasses import dataclass
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Callable
from urllib.parse import urlparse

from archive_storage import (
    LocalArchiveStorage,
    build_empty_local_archive_storage,
    serialize_local_archive_storage,
)

STATIC_DIR = Path(__file__).resolve().parents[1] / "webapp"


@dataclass(frozen=True, slots=True)
class DashboardRouteEntry:
    id: str
    label: str
    href: str
    description: str
    primary: bool = False


def build_dashboard_payload(storage: LocalArchiveStorage) -> dict[str, object]:
    serialized_storage = serialize_local_archive_storage(storage)
    active_archive = serialized_storage["activeArchive"]
    metadata = None if active_archive is None else active_archive["metadata"]

    has_active_archive = metadata is not None and bool(metadata["archivioAttivo"])
    quick_actions = (
        DashboardRouteEntry(
            id="archive",
            label="Lista archivio",
            href="#/archive",
            description="Apri la superficie principale di consultazione dei titoli.",
            primary=has_active_archive,
        ),
        DashboardRouteEntry(
            id="import",
            label="Importa ODS",
            href="#/import",
            description="Carica o sostituisci il dataset locale dal foglio Lista.",
            primary=not has_active_archive,
        ),
        DashboardRouteEntry(
            id="export",
            label="Esporta ODS",
            href="#/export",
            description="Rigenera il workbook operativo dal dataset locale corrente.",
            primary=False,
        ),
        DashboardRouteEntry(
            id="create",
            label="Crea titolo",
            href="#/create",
            description="Apri il flusso per aggiungere un nuovo titolo con sotto-varianti.",
            primary=False,
        ),
    )

    return {
        "app": {
            "name": "Archivio 1001",
            "tagline": "Dashboard offline-first per consultazione e manutenzione archive-first.",
            "homeRoute": "#/dashboard",
            "routes": [
                {
                    "id": route.id,
                    "label": route.label,
                    "href": route.href,
                    "description": route.description,
                    "primary": route.primary,
                }
                for route in quick_actions
            ],
        },
        "search": {
            "placeholder": "Cerca un titolo",
            "submitLabel": "Vai alla lista",
            "destinationHref": "#/archive",
        },
        "archive": {
            "hasActiveArchive": has_active_archive,
            "metadata": metadata,
            "emptyState": {
                "title": "Nessun archivio attivo",
                "body": "Importa un file ODS per attivare il dataset locale e sbloccare consultazione, ricerca ed export.",
                "ctaHref": "#/import",
                "ctaLabel": "Importa il primo archivio",
            },
        },
    }


def make_request_handler(
    storage_supplier: Callable[[], LocalArchiveStorage] | None = None,
) -> type[SimpleHTTPRequestHandler]:
    if storage_supplier is None:
        storage_supplier = build_empty_local_archive_storage

    class ArchiveDashboardRequestHandler(SimpleHTTPRequestHandler):
        def __init__(self, *args, **kwargs) -> None:
            super().__init__(*args, directory=str(STATIC_DIR), **kwargs)

        def do_GET(self) -> None:  # noqa: N802
            request_path = urlparse(self.path).path
            if request_path == "/api/dashboard":
                self._serve_dashboard_payload()
                return
            if request_path == "/api/health":
                self._serve_json({"status": "ok"})
                return
            if request_path == "/":
                self.path = "/index.html"
            return super().do_GET()

        def end_headers(self) -> None:
            self.send_header("Cache-Control", "no-cache")
            super().end_headers()

        def guess_type(self, path: str) -> str:
            if path.endswith(".webmanifest"):
                return "application/manifest+json"
            if path.endswith(".js"):
                return "text/javascript; charset=utf-8"
            return super().guess_type(path)

        def log_message(self, format: str, *args) -> None:
            return

        def _serve_dashboard_payload(self) -> None:
            self._serve_json(build_dashboard_payload(storage_supplier()))

        def _serve_json(self, payload: dict[str, object]) -> None:
            encoded = json.dumps(payload).encode("utf-8")
            self.send_response(HTTPStatus.OK)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(encoded)))
            self.end_headers()
            self.wfile.write(encoded)

    return ArchiveDashboardRequestHandler


def run_dashboard_server(
    *,
    host: str = "127.0.0.1",
    port: int = 8000,
    storage: LocalArchiveStorage | None = None,
) -> ThreadingHTTPServer:
    resolved_storage = storage or build_empty_local_archive_storage()
    handler = make_request_handler(lambda: resolved_storage)
    return ThreadingHTTPServer((host, port), handler)


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Run the local browser/PWA shell for the archive dashboard.",
    )
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8000)
    arguments = parser.parse_args()

    server = run_dashboard_server(host=arguments.host, port=arguments.port)
    print(f"Archive dashboard available at http://{arguments.host}:{arguments.port}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
