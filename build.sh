#!/usr/bin/env bash
# Cloudflare Pages build: assemble only the public site files into dist/.
# Allowlist on purpose — internal folders (docs/, .claude/, etc.) must never deploy.
set -euo pipefail
rm -rf dist
mkdir dist
cp *.html _headers dist/
cp -R assets dist/
