#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SOURCE_DIR="$ROOT_DIR/webapp"
DIST_DIR="$ROOT_DIR/dist"
ARTIFACT_DIR="$DIST_DIR/pwa-release"
SNAPSHOT_DIR="$DIST_DIR/releases"
BUILD_TIME_UTC="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
GIT_REVISION="$(git -C "$ROOT_DIR" rev-parse --short HEAD)"
RELEASE_ID="$(date -u +"%Y%m%dT%H%M%SZ")-$GIT_REVISION"
DEPLOY_BASE_PATH_INPUT="${DEPLOY_BASE_PATH:-/}"

normalize_base_path() {
  local raw_path="$1"
  local trimmed_path="${raw_path#/}"
  trimmed_path="${trimmed_path%/}"

  if [[ -z "$trimmed_path" ]]; then
    printf '/\n'
    return
  fi

  printf '/%s/\n' "$trimmed_path"
}

escape_sed_replacement() {
  printf '%s' "$1" | sed -e 's/[\\/&]/\\&/g'
}

DEPLOY_BASE_PATH_NORMALIZED="$(normalize_base_path "$DEPLOY_BASE_PATH_INPUT")"
DEPLOY_BASE_PATH_ESCAPED="$(escape_sed_replacement "$DEPLOY_BASE_PATH_NORMALIZED")"

rm -rf "$ARTIFACT_DIR"
mkdir -p "$ARTIFACT_DIR" "$SNAPSHOT_DIR"
cp -R "$SOURCE_DIR"/. "$ARTIFACT_DIR"/

find "$ARTIFACT_DIR" -type f \
  \( -name 'index.html' -o -name 'manifest.webmanifest' -o -name 'service-worker.js' -o -name 'app.js' \) \
  -exec sed -i "s|__DEPLOY_BASE_PATH__|$DEPLOY_BASE_PATH_ESCAPED|g" {} +

cat >"$ARTIFACT_DIR/release.json" <<EOF
{
  "releaseId": "$RELEASE_ID",
  "gitRevision": "$GIT_REVISION",
  "builtAtUtc": "$BUILD_TIME_UTC",
  "artifactType": "static-browser-only-pwa",
  "deploymentBasePath": "$DEPLOY_BASE_PATH_NORMALIZED",
  "requiresHttps": true
}
EOF

tar -czf "$SNAPSHOT_DIR/$RELEASE_ID.tar.gz" -C "$ARTIFACT_DIR" .

printf 'Prepared artifact: %s\n' "$ARTIFACT_DIR"
printf 'Prepared snapshot: %s\n' "$SNAPSHOT_DIR/$RELEASE_ID.tar.gz"
