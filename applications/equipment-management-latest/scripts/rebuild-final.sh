#!/usr/bin/env bash
# Build the isolated preview while retaining its reviewed production resolutions.
set -euo pipefail
cd "$(dirname "$0")/.."
pnpm install --frozen-lockfile
pnpm build --target linux-x64 --node-version 24
cp docs/deployment/production-lock.yaml dist/pnpm-lock.yaml
(cd dist && pnpm install --prod --frozen-lockfile)
# clean-dist-bin accepts an optional directory; target flags belong only to retarget-native.
node node_modules/@nocobase/app-cli/dist/tools/scripts/utils/clean-dist-bin.mjs
node node_modules/@nocobase/app-cli/dist/tools/scripts/utils/retarget-native.mjs --target linux-x64 --node-version 24
node node_modules/@nocobase/app-cli/dist/tools/scripts/utils/prune-dist-artifacts.mjs
node node_modules/@nocobase/app-cli/dist/tools/scripts/utils/verify-server-deps.mjs
pnpm nocobase foundation modules build
node node_modules/@nocobase/app-cli/dist/tools/scripts/utils/pack-dist.mjs
