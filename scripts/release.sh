#!/usr/bin/env bash
# Usage: ./scripts/release.sh [--notes "Release notes"]
# Builds, zips, tags, and publishes a GitHub release for the current manifest version.
set -euo pipefail

REPO="KentaMaeda0916/obsidian-ai-cli-runner"
PLUGIN_ID="obsidian-ai-cli-runner"
MANIFEST="manifest.json"
ZIP_DIR="/tmp/${PLUGIN_ID}"
ZIP_FILE="/tmp/${PLUGIN_ID}.zip"

# ── version ──────────────────────────────────────────────────────────────────
VERSION=$(node -p "require('./${MANIFEST}').version")
TAG="v${VERSION}"

echo "→ Releasing ${TAG}"

# ── parse args ───────────────────────────────────────────────────────────────
NOTES=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --notes) NOTES="$2"; shift 2 ;;
    *) echo "Unknown arg: $1"; exit 1 ;;
  esac
done

# ── guard: tag must not already exist on remote ───────────────────────────────
if gh release view "${TAG}" --repo "${REPO}" &>/dev/null; then
  echo "✗ Release ${TAG} already exists. Bump the version in manifest.json first."
  exit 1
fi

# ── build ─────────────────────────────────────────────────────────────────────
echo "→ Building..."
npm run build

# ── zip ───────────────────────────────────────────────────────────────────────
echo "→ Creating zip..."
rm -rf "${ZIP_DIR}" "${ZIP_FILE}"
mkdir "${ZIP_DIR}"
cp dist/main.js dist/manifest.json dist/styles.css "${ZIP_DIR}/"
(cd /tmp && zip -qr "${PLUGIN_ID}.zip" "${PLUGIN_ID}/")
SIZE=$(du -sh "${ZIP_FILE}" | cut -f1)
echo "  → ${ZIP_FILE} (${SIZE})"

# ── git tag ───────────────────────────────────────────────────────────────────
echo "→ Tagging ${TAG}..."
git tag "${TAG}"
git push origin "${TAG}"

# ── github release ────────────────────────────────────────────────────────────
# Upload zip (for manual install) + individual files (for BRAT)
echo "→ Creating GitHub release..."
if [[ -n "${NOTES}" ]]; then
  URL=$(gh release create "${TAG}" \
    "${ZIP_FILE}" \
    dist/main.js \
    dist/manifest.json \
    dist/styles.css \
    --repo "${REPO}" \
    --title "${TAG}" \
    --notes "${NOTES}")
else
  URL=$(gh release create "${TAG}" \
    "${ZIP_FILE}" \
    dist/main.js \
    dist/manifest.json \
    dist/styles.css \
    --repo "${REPO}" \
    --title "${TAG}" \
    --generate-notes)
fi

echo ""
echo "✓ Released: ${URL}"
