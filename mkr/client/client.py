import os
import socket
import sys


def getenv_required(name: str) -> str:
    val = os.getenv(name)
    if val is None or val.strip() == "":
        raise ValueError(f"Missing required environment variable: {name}")
    return val.strip()


def main() -> int:
    try:
        n_text = getenv_required("COLLATZ_COUNT")
        host = getenv_required("SERVER_HOST")
        port_text = getenv_required("SERVER_PORT")

        try:
            n = int(n_text)
        except ValueError:
            raise ValueError("COLLATZ_COUNT must be an integer")

        if n <= 0:
            raise ValueError("COLLATZ_COUNT must be a positive integer")

        try:
            port = int(port_text)
        except ValueError:
            raise ValueError("SERVER_PORT must be an integer")

        if not (1 <= port <= 65535):
            raise ValueError("SERVER_PORT must be in range 1..65535")

        timeout_sec = float(os.getenv("SOCKET_TIMEOUT_SEC", "30"))

        with socket.create_connection((host, port), timeout=timeout_sec) as sock:
            sock.settimeout(timeout_sec)

            payload = f"{n}\n".encode("utf-8")
            sock.sendall(payload)

            data = b""
            while True:
                chunk = sock.recv(4096)
                if not chunk:
                    break
                data += chunk
                if b"\n" in chunk or len(data) > 1024 * 1024:
                    break

            response = data.decode("utf-8", errors="replace").strip()

            print(response)

        return 0

    except Exception as e:
        print(f"ERROR: {e}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())

