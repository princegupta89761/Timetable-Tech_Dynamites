#!/usr/bin/env bash
# Exit immediately if a command exits with a non-zero status
set -o errexit

echo "==> Installing Python dependencies..."
pip install -r requirements.txt

if [ -f "frontend/package.json" ]; then
  echo "==> Building frontend..."
  cd frontend
  npm install
  npm run build
  cd ..
  echo "==> Frontend build completed successfully."
else
  echo "==> No frontend/package.json found. Skipping frontend build."
fi
