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

rm -rf "$ARTIFACT_DIR"
mkdir -p "$ARTIFACT_DIR" "$SNAPSHOT_DIR"
cp -R "$SOURCE_DIR"/. "$ARTIFACT_DIR"/

cat >"$ARTIFACT_DIR/release.json" <<EOF
{
  "releaseId": "$RELEASE_ID",
  "gitRevision": "$GIT_REVISION",
  "builtAtUtc": "$BUILD_TIME_UTC",
  "artifactType": "static-browser-only-pwa",
  "assetPathMode": "relative-to-index",
  "requiresHttps": true
}
EOF

tar -czf "$SNAPSHOT_DIR/$RELEASE_ID.tar.gz" -C "$ARTIFACT_DIR" .

printf 'Prepared artifact: %s\n' "$ARTIFACT_DIR"
printf 'Prepared snapshot: %s\n' "$SNAPSHOT_DIR/$RELEASE_ID.tar.gz"
