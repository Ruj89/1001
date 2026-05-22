from __future__ import annotations

import argparse
import json
from dataclasses import dataclass
from datetime import datetime
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Callable
from urllib.parse import urlparse

from archive_model import SottoVarianteRecord, TitoloRecord
from archive_storage import (
    ArchiveStorageMutationError,
    LocalArchiveStorage,
    build_empty_local_archive_storage,
    create_title_record,
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


@dataclass(slots=True)
class ArchiveDashboardState:
    storage: LocalArchiveStorage

    def create_title(self, payload: dict[str, object]) -> LocalArchiveStorage:
        title = _parse_create_payload(payload)
        self.storage = create_title_record(
            self.storage,
            new_title=title,
            created_at=datetime.now(),
        )
        return self.storage


def build_dashboard_payload(storage: LocalArchiveStorage) -> dict[str, object]:
    serialized_storage = serialize_local_archive_storage(storage)
    active_archive = serialized_storage["activeArchive"]
    metadata = None if active_archive is None else active_archive["metadata"]
    active_titles = [] if active_archive is None else active_archive["titles"]

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
            "activeTitles": active_titles,
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
    storage_mutator: ArchiveDashboardState | None = None,
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

        def do_POST(self) -> None:  # noqa: N802
            request_path = urlparse(self.path).path
            if request_path == "/api/titles":
                self._create_title()
                return

            self.send_error(HTTPStatus.NOT_FOUND)

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

        def _create_title(self) -> None:
            if storage_mutator is None:
                self.send_error(HTTPStatus.NOT_IMPLEMENTED)
                return

            content_length = int(self.headers.get("Content-Length", "0"))
            body = self.rfile.read(content_length)

            try:
                payload = json.loads(body.decode("utf-8"))
                storage = storage_mutator.create_title(payload)
            except json.JSONDecodeError:
                self._serve_error(
                    HTTPStatus.BAD_REQUEST,
                    "invalid_json",
                    "Il payload di creazione deve essere JSON valido.",
                )
                return
            except (TypeError, ValueError) as exc:
                self._serve_error(HTTPStatus.BAD_REQUEST, "invalid_payload", str(exc))
                return
            except ArchiveStorageMutationError as exc:
                self._serve_error(HTTPStatus.CONFLICT, "duplicate_title", str(exc))
                return

            self._serve_json(build_dashboard_payload(storage))

        def _serve_error(self, status: HTTPStatus, code: str, message: str) -> None:
            encoded = json.dumps({"error": code, "message": message}).encode("utf-8")
            self.send_response(status)
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
    dashboard_state = ArchiveDashboardState(storage=resolved_storage)
    handler = make_request_handler(lambda: dashboard_state.storage, dashboard_state)
    return ThreadingHTTPServer((host, port), handler)


def _parse_create_payload(payload: dict[str, object]) -> TitoloRecord:
    if not isinstance(payload, dict):
        raise TypeError("create payload must be a JSON object")

    title = payload.get("titolo")
    variant = payload.get("sottoVariante")
    if not isinstance(title, str):
        raise TypeError("titolo must be a string")
    if not isinstance(variant, dict):
        raise TypeError("sottoVariante must be an object")

    piattaforma = variant.get("piattaforma")
    edizione_versione = variant.get("edizioneVersione")
    supporto = variant.get("supporto")
    stato = variant.get("stato")
    if not all(isinstance(value, str) for value in (piattaforma, edizione_versione, supporto, stato)):
        raise TypeError(
            "sottoVariante must contain string piattaforma, edizioneVersione, supporto, stato"
        )

    return TitoloRecord(
        titolo=title,
        sotto_varianti=(
            SottoVarianteRecord(
                piattaforma=piattaforma,
                edizione_versione=edizione_versione,
                supporto=supporto,
                stato=stato,
            ),
        ),
    )


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
