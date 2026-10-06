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

exec ./venv/bin/python manage.py runserver 127.0.0.1:8000
