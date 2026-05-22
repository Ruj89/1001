from __future__ import annotations

import argparse
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


WEBAPP_DIR = Path(__file__).resolve().parents[1] / "webapp"


class StaticWebAppHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, directory=str(WEBAPP_DIR), **kwargs)

    def do_GET(self) -> None:  # noqa: N802
        if self.path == "/":
            self.path = "/index.html"
        return super().do_GET()

    def guess_type(self, path: str) -> str:
        if path.endswith(".webmanifest"):
            return "application/manifest+json"
        if path.endswith(".js"):
            return "text/javascript; charset=utf-8"
        return super().guess_type(path)

    def log_message(self, format: str, *args) -> None:
        return


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
