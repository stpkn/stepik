#!/usr/bin/env python3
"""Minimal static file server for UI prototype."""

from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
import os


def main() -> None:
    root = Path(__file__).resolve().parent
    os.chdir(root)

    host = "127.0.0.1"
    port = 8000

    server = ThreadingHTTPServer((host, port), SimpleHTTPRequestHandler)
    print(f"Serving UI prototype at http://{host}:{port}/index.html")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
