FROM python:3.12-slim

WORKDIR /app
COPY server.py /app/server.py

EXPOSE 9000

# За бажанням можна змінювати:
#   PORT, MAX_N, SOCKET_TIMEOUT_SEC
ENV PORT=9000
ENV MAX_N=1000000
ENV SOCKET_TIMEOUT_SEC=30

CMD ["python", "/app/server.py"]

