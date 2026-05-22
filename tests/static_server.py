from __future__ import annotations

import argparse
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


WEBAPP_DIR = Path(__file__).resolve().parents[1] / "webapp"
REWRITTEN_FILES = {
    "/index.html",
    "/manifest.webmanifest",
    "/service-worker.js",
    "/app.js",
}


class StaticWebAppHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, directory=str(WEBAPP_DIR), **kwargs)

    def do_GET(self) -> None:  # noqa: N802
        if self.path == "/":
            self.path = "/index.html"
        if self.path in REWRITTEN_FILES:
            self._serve_rewritten_asset(self.path)
            return
        return super().do_GET()

    def guess_type(self, path: str) -> str:
        if path.endswith(".webmanifest"):
            return "application/manifest+json"
        if path.endswith(".js"):
            return "text/javascript; charset=utf-8"
        return super().guess_type(path)

    def log_message(self, format: str, *args) -> None:
        return

    def _serve_rewritten_asset(self, request_path: str) -> None:
        asset_path = WEBAPP_DIR / request_path.lstrip("/")
        if not asset_path.is_file():
            self.send_error(404)
            return

        content = asset_path.read_text(encoding="utf-8").replace("__DEPLOY_BASE_PATH__", "/")
        encoded = content.encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", self.guess_type(str(asset_path)))
        self.send_header("Content-Length", str(len(encoded)))
        self.end_headers()
        self.wfile.write(encoded)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8765)
    arguments = parser.parse_args()

    server = ThreadingHTTPServer((arguments.host, arguments.port), StaticWebAppHandler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
