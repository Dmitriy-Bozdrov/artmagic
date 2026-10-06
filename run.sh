#!/bin/bash
set -euo pipefail

cd "$(dirname "$0")"

if command -v docker >/dev/null 2>&1 && docker ps -a --format '{{.Names}}' | grep -qx 'artmagic-pg'; then
  docker start artmagic-pg >/dev/null
fi

if [[ ! -x venv/bin/python ]]; then
  echo "Немає venv. Створіть його: python3 -m venv venv && ./venv/bin/pip install -r requirements.txt" >&2
  exit 1
fi

if ! command -v ngrok >/dev/null 2>&1; then
  echo "ngrok не знайдено. Встановіть його і виконайте ngrok config add-authtoken <token>." >&2
  exit 1
fi

DJANGO_PID=""
NGROK_PID=""

cleanup() {
  if [[ -n "$NGROK_PID" ]]; then
    kill "$NGROK_PID" 2>/dev/null || true
  fi
  if [[ -n "$DJANGO_PID" ]]; then
    kill "$DJANGO_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT INT TERM

port_open() {
  ss -ltn | grep -q ":$1 "
}

if port_open 8000; then
  echo "Сайт уже працює на http://127.0.0.1:8000"
else
  ./venv/bin/python manage.py runserver 127.0.0.1:8000 &
  DJANGO_PID=$!
  for _ in $(seq 1 40); do
    if curl -sf -o /dev/null --max-time 1 http://127.0.0.1:8000/; then
      break
    fi
    if ! kill -0 "$DJANGO_PID" 2>/dev/null; then
      echo "Django не запустився." >&2
      exit 1
    fi
    sleep 0.5
  done
fi

if port_open 4040; then
  echo "ngrok уже запущений"
else
  GODEBUG=netdns=cgo ngrok http 8000 --log=stdout > /tmp/artmagic-ngrok.log 2>&1 &
  NGROK_PID=$!
fi

PUBLIC_URL=""
for _ in $(seq 1 45); do
  PUBLIC_URL=$(curl -sf --max-time 1 http://127.0.0.1:4040/api/tunnels | ./venv/bin/python -c 'import json,sys
try:
    data=json.load(sys.stdin)
except Exception:
    raise SystemExit(0)
for tunnel in data.get("tunnels", []):
    if str(tunnel.get("public_url", "")).startswith("https://"):
        print(tunnel["public_url"])
        break
' || true)
  if [[ -z "$PUBLIC_URL" && -f /tmp/artmagic-ngrok.log ]]; then
    PUBLIC_URL=$(grep -oE 'url=https://[^ ]+' /tmp/artmagic-ngrok.log | tail -1 | cut -d= -f2 || true)
  fi
  if [[ -n "$PUBLIC_URL" ]]; then
    break
  fi
  if [[ -n "$NGROK_PID" ]] && ! kill -0 "$NGROK_PID" 2>/dev/null; then
    break
  fi
  sleep 1
done

if [[ -z "$PUBLIC_URL" ]]; then
  echo "ngrok не зміг відкрити тунель. Сайт лишається на http://127.0.0.1:8000" >&2
  if [[ -f /tmp/artmagic-ngrok.log ]]; then
    grep -E 'lvl=eror|lvl=warn' /tmp/artmagic-ngrok.log | tail -3 >&2 || true
  fi
  if [[ -n "$NGROK_PID" ]]; then
    kill "$NGROK_PID" 2>/dev/null || true
    NGROK_PID=""
  fi
fi

if [[ -n "$PUBLIC_URL" ]]; then
  echo "Публічне посилання: $PUBLIC_URL"
fi

if [[ -n "$DJANGO_PID" ]]; then
  wait "$DJANGO_PID"
elif [[ -n "$NGROK_PID" ]]; then
  wait "$NGROK_PID"
fi
