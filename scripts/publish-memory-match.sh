#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
GAMES_APP_DIR="$(cd "${ROOT_DIR}/../Games/memory-match" && pwd)"
DEST_DIR="${ROOT_DIR}/games/memory-match/dist"

if [[ ! -f "${ROOT_DIR}/netlify.toml" ]]; then
  echo "Error: expected website root at: ${ROOT_DIR}"
  echo "       (missing netlify.toml)"
  exit 1
fi

if [[ ! -f "${GAMES_APP_DIR}/package.json" ]]; then
  echo "Error: expected Memory Match app at: ${GAMES_APP_DIR}"
  echo "       (missing package.json)"
  exit 1
fi

echo "Building Memory Match..."
(cd "${GAMES_APP_DIR}" && npm run build)

if [[ ! -f "${GAMES_APP_DIR}/dist/index.html" ]]; then
  echo "Error: build did not produce dist/index.html at: ${GAMES_APP_DIR}/dist/index.html"
  exit 1
fi

echo "Publishing build to website..."
mkdir -p "${DEST_DIR}"

# Delete old published build (keep the folder)
rm -rf "${DEST_DIR:?}/"*

# Copy new build
cp -R "${GAMES_APP_DIR}/dist/." "${DEST_DIR}/"

echo
echo "Done. Next steps:"
echo "  cd \"${ROOT_DIR}\""
echo "  git status"
echo "  git add -A"
echo "  git commit -m \"update memory-match game build\""
echo "  git push"

