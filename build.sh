#!/usr/bin/env bash
# Exit immediately if a command exits with a non-zero status
set -o errexit

echo "=== Step 1: Building Frontend Assets ==="
cd frontend
npm install
npm run build
cd ..

echo "=== Step 2: Installing Backend Dependencies ==="
python -m pip install --upgrade pip
pip install -r backend/requirements.txt

echo "=== Build Completed Successfully ==="
