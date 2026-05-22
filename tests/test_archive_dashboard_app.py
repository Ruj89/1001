from __future__ import annotations

import json
import sys
import threading
import unittest
from datetime import datetime
from pathlib import Path
from urllib.error import HTTPError
from urllib.request import Request, urlopen

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from archive_dashboard_app import build_dashboard_payload, run_dashboard_server
from archive_model import SottoVarianteRecord, TitoloRecord
from archive_storage import build_active_local_archive_storage, build_empty_local_archive_storage


def _sample_title(title: str = "Chrono Trigger") -> TitoloRecord:
    return TitoloRecord(
        titolo=title,
        sotto_varianti=(
            SottoVarianteRecord(
                piattaforma="SNES",
                edizione_versione="PAL",
                supporto="cartuccia",
                stato="OK",
            ),
        ),
    )


def _sample_title_with_blank_fields(title: str = "Puzzle Bobble") -> TitoloRecord:
    return TitoloRecord(
        titolo=title,
        sotto_varianti=(
            SottoVarianteRecord(
                piattaforma="Neo Geo",
                edizione_versione="",
                supporto="",
                stato="",
            ),
        ),
    )


class ArchiveDashboardPayloadTests(unittest.TestCase):
    def test_builds_empty_dashboard_payload_with_import_first_empty_state(self) -> None:
        payload = build_dashboard_payload(build_empty_local_archive_storage())

        self.assertEqual(payload["app"]["homeRoute"], "#/dashboard")
        self.assertFalse(payload["archive"]["hasActiveArchive"])
        self.assertEqual(payload["archive"]["emptyState"]["ctaHref"], "#/import")
        primary_routes = [route["id"] for route in payload["app"]["routes"] if route["primary"]]
        self.assertEqual(primary_routes, ["import"])

    def test_builds_active_dashboard_payload_with_archive_metadata(self) -> None:
        storage = build_active_local_archive_storage(
            (_sample_title("Chrono Trigger"), _sample_title("Terranigma")),
            activated_at=datetime(2026, 5, 22, 8, 30, 0),
        )

        payload = build_dashboard_payload(storage)

        self.assertTrue(payload["archive"]["hasActiveArchive"])
        self.assertEqual(payload["archive"]["metadata"]["numeroRecord"], 2)
        self.assertEqual(payload["archive"]["metadata"]["versioneSchema"], "v1")
        self.assertEqual(len(payload["archive"]["activeTitles"]), 2)
        self.assertEqual(payload["archive"]["activeTitles"][0]["titolo"], "Chrono Trigger")
        primary_routes = [route["id"] for route in payload["app"]["routes"] if route["primary"]]
        self.assertEqual(primary_routes, ["archive"])

    def test_preserves_blank_imported_fields_in_active_titles_payload(self) -> None:
        storage = build_active_local_archive_storage(
            (_sample_title_with_blank_fields(),),
            activated_at=datetime(2026, 5, 22, 8, 30, 0),
        )

        payload = build_dashboard_payload(storage)

        active_title = payload["archive"]["activeTitles"][0]
        self.assertEqual(active_title["titolo"], "Puzzle Bobble")
        self.assertEqual(active_title["sottoVarianti"][0]["edizioneVersione"], "")
        self.assertEqual(active_title["sottoVarianti"][0]["supporto"], "")
        self.assertEqual(active_title["sottoVarianti"][0]["stato"], "")


class ArchiveDashboardServerTests(unittest.TestCase):
    def test_serves_dashboard_api_and_static_shell(self) -> None:
        storage = build_active_local_archive_storage(
            (_sample_title(),),
            activated_at=datetime(2026, 5, 22, 8, 30, 0),
        )
        server = run_dashboard_server(host="127.0.0.1", port=0, storage=storage)
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()

        try:
            host, port = server.server_address
            with urlopen(f"http://{host}:{port}/api/dashboard") as response:
                self.assertEqual(response.status, 200)
                payload = json.loads(response.read().decode("utf-8"))
            with urlopen(f"http://{host}:{port}/") as response:
                self.assertEqual(response.status, 200)
                html = response.read().decode("utf-8")
        finally:
            server.shutdown()
            server.server_close()
            thread.join(timeout=2)

        self.assertTrue(payload["archive"]["hasActiveArchive"])
        self.assertIn("Archivio 1001", html)
        self.assertIn("Ricerca primaria", html)

    def test_creates_title_through_api_and_returns_updated_payload(self) -> None:
        storage = build_active_local_archive_storage(
            (_sample_title("Chrono Trigger"),),
            activated_at=datetime(2026, 5, 22, 8, 30, 0),
        )
        server = run_dashboard_server(host="127.0.0.1", port=0, storage=storage)
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()

        try:
            host, port = server.server_address
            request = Request(
                f"http://{host}:{port}/api/titles",
                data=json.dumps(
                    {
                        "titolo": "Terranigma",
                        "sottoVariante": {
                            "piattaforma": "SNES",
                            "edizioneVersione": "PAL",
                            "supporto": "cartuccia",
                            "stato": "OK",
                        },
                    }
                ).encode("utf-8"),
                headers={"Content-Type": "application/json"},
                method="POST",
            )
            with urlopen(request) as response:
                self.assertEqual(response.status, 200)
                payload = json.loads(response.read().decode("utf-8"))
        finally:
            server.shutdown()
            server.server_close()
            thread.join(timeout=2)

        self.assertEqual(payload["archive"]["metadata"]["numeroRecord"], 2)
        self.assertEqual(payload["archive"]["activeTitles"][1]["titolo"], "Terranigma")

    def test_rejects_duplicate_title_creation_through_api(self) -> None:
        storage = build_active_local_archive_storage(
            (_sample_title("Chrono Trigger"),),
            activated_at=datetime(2026, 5, 22, 8, 30, 0),
        )
        server = run_dashboard_server(host="127.0.0.1", port=0, storage=storage)
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()

        try:
            host, port = server.server_address
            request = Request(
                f"http://{host}:{port}/api/titles",
                data=json.dumps(
                    {
                        "titolo": "Chrono Trigger",
                        "sottoVariante": {
                            "piattaforma": "SNES",
                            "edizioneVersione": "PAL",
                            "supporto": "cartuccia",
                            "stato": "OK",
                        },
                    }
                ).encode("utf-8"),
                headers={"Content-Type": "application/json"},
                method="POST",
            )
            with self.assertRaises(HTTPError) as raised:
                urlopen(request)
        finally:
            server.shutdown()
            server.server_close()
            thread.join(timeout=2)

        self.assertEqual(raised.exception.code, 409)

    def test_updates_existing_title_and_variant_through_api(self) -> None:
        storage = build_active_local_archive_storage(
            (_sample_title("Chrono Trigger"),),
            activated_at=datetime(2026, 5, 22, 8, 30, 0),
        )
        server = run_dashboard_server(host="127.0.0.1", port=0, storage=storage)
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()

        try:
            host, port = server.server_address
            request = Request(
                f"http://{host}:{port}/api/titles/Chrono%20Trigger/variants/0",
                data=json.dumps(
                    {
                        "titolo": "Chrono Trigger DX",
                        "sottoVariante": {
                            "piattaforma": "SNES",
                            "edizioneVersione": "NTSC-J",
                            "supporto": "cartuccia",
                            "stato": "Completo",
                        },
                    }
                ).encode("utf-8"),
                headers={"Content-Type": "application/json"},
                method="PUT",
            )
            with urlopen(request) as response:
                self.assertEqual(response.status, 200)
                payload = json.loads(response.read().decode("utf-8"))
        finally:
            server.shutdown()
            server.server_close()
            thread.join(timeout=2)

        updated_title = payload["archive"]["activeTitles"][0]
        self.assertEqual(updated_title["titolo"], "Chrono Trigger DX")
        self.assertEqual(updated_title["sottoVarianti"][0]["edizioneVersione"], "NTSC-J")
        self.assertEqual(updated_title["sottoVarianti"][0]["stato"], "Completo")

    def test_rejects_update_with_duplicate_title_through_api(self) -> None:
        storage = build_active_local_archive_storage(
            (_sample_title("Chrono Trigger"), _sample_title("Terranigma")),
            activated_at=datetime(2026, 5, 22, 8, 30, 0),
        )
        server = run_dashboard_server(host="127.0.0.1", port=0, storage=storage)
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()

        try:
            host, port = server.server_address
            request = Request(
                f"http://{host}:{port}/api/titles/Chrono%20Trigger/variants/0",
                data=json.dumps(
                    {
                        "titolo": "Terranigma",
                        "sottoVariante": {
                            "piattaforma": "SNES",
                            "edizioneVersione": "PAL",
                            "supporto": "cartuccia",
                            "stato": "OK",
                        },
                    }
                ).encode("utf-8"),
                headers={"Content-Type": "application/json"},
                method="PUT",
            )
            with self.assertRaises(HTTPError) as raised:
                urlopen(request)
        finally:
            server.shutdown()
            server.server_close()
            thread.join(timeout=2)

        self.assertEqual(raised.exception.code, 409)

    def test_rejects_update_for_missing_variant_through_api(self) -> None:
        storage = build_active_local_archive_storage(
            (_sample_title("Chrono Trigger"),),
            activated_at=datetime(2026, 5, 22, 8, 30, 0),
        )
        server = run_dashboard_server(host="127.0.0.1", port=0, storage=storage)
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()

        try:
            host, port = server.server_address
            request = Request(
                f"http://{host}:{port}/api/titles/Chrono%20Trigger/variants/9",
                data=json.dumps(
                    {
                        "titolo": "Chrono Trigger",
                        "sottoVariante": {
                            "piattaforma": "SNES",
                            "edizioneVersione": "PAL",
                            "supporto": "cartuccia",
                            "stato": "OK",
                        },
                    }
                ).encode("utf-8"),
                headers={"Content-Type": "application/json"},
                method="PUT",
            )
            with self.assertRaises(HTTPError) as raised:
                urlopen(request)
        finally:
            server.shutdown()
            server.server_close()
            thread.join(timeout=2)

        self.assertEqual(raised.exception.code, 404)
