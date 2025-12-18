import os
import socket
import sys
from typing import Dict


HOST = "0.0.0.0"
PORT = int(os.getenv("PORT", "9000"))
SOCKET_TIMEOUT_SEC = float(os.getenv("SOCKET_TIMEOUT_SEC", "30"))
MAX_N = int(os.getenv("MAX_N", "1000000"))

def collatz_steps(n: int, cache: Dict[int, int]) -> int:
    """
    Повертає кількість кроків до 1 у послідовності Колатца.
    Використовує кеш (динамічне програмування) для прискорення.
    """
    if n in cache:
        return cache[n]

    original = n
    path = []
    steps = 0

    while n != 1 and n not in cache:
        path.append(n)
        if n % 2 == 0:
            n //= 2
        else:
            n = 3 * n + 1
        steps += 1

    known = 0 if n == 1 else cache[n]
    total = steps + known

    for i, val in enumerate(path):
        cache[val] = total - i

    return cache[original]


def average_collatz_steps(N: int) -> float:
    cache: Dict[int, int] = {1: 0}
    total_steps = 0
    for x in range(1, N + 1):
        total_steps += collatz_steps(x, cache)
    return total_steps / N


def recv_text_number(conn: socket.socket, max_bytes: int = 128) -> str:
    """
    Зчитує текст з сокета (очікуємо рядок з числом, бажано з \\n).
    """
    buf = b""
    while len(buf) < max_bytes:
        chunk = conn.recv(4096)
        if not chunk:
            break
        buf += chunk
        if b"\n" in chunk or b"\r" in chunk:
            break
    return buf.decode("utf-8", errors="replace").strip()


def main() -> int:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as server:
        server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        server.bind((HOST, PORT))
        server.listen(1)

        print(f"[server] Listening on {HOST}:{PORT}", flush=True)

        conn, addr = server.accept()
        with conn:
            conn.settimeout(SOCKET_TIMEOUT_SEC)
            print(f"[server] Client connected: {addr}", flush=True)

            try:
                text = recv_text_number(conn)
                if not text:
                    raise ValueError("Empty input")

                N = int(text)
                if N <= 0:
                    raise ValueError("N must be a positive integer")
                if N > MAX_N:
                    raise ValueError(f"N is too large (max allowed: {MAX_N})")

                avg = average_collatz_steps(N)
                response = f"{avg}\n"
                conn.sendall(response.encode("utf-8"))

                print(f"[server] N={N}, avg_steps={avg}", flush=True)

            except Exception as e:
                err = f"ERROR: {e}\n"
                try:
                    conn.sendall(err.encode("utf-8"))
                except Exception:
                    pass
                print(f"[server] Error: {e}", file=sys.stderr, flush=True)

        print("[server] Done. Connection closed.", flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
