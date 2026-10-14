#!/usr/bin/env bash
# Run one shard of the release test suite from the root of a release checkout.
#
# Usage: release-test-shard.sh <plugins|studio 1/2|studio 2/2|others> <include-templates: true|false>
#
# The plugin suites and Studio are the two slowest parts by a wide margin: on one runner Studio alone took about 17
# of the 19 minutes the rest of the suite took. Plugins get a runner of their own, Studio is split in two with vitest's
# `--shard`, which divides its test files evenly by count, and everything else shares the last runner. Together the
# shards cover what `pnpm test` covers. The template suites run only when include-templates is true: otherwise the
# create-app smoke test runs them against the packed packages, which is the stronger check.
set -euo pipefail

USAGE='usage: release-test-shard.sh <plugins|studio 1/2|studio 2/2|others> <include-templates>'
SHARD="${1:?$USAGE}"
INCLUDE_TEMPLATES="${2:?$USAGE}"

# --no-sort starts each package as soon as a slot is free instead of waiting for a whole dependency level.
RECURSIVE=(-r --no-sort --if-present)

# The Studio shards call vitest directly rather than Studio's test script, so a change to that script fails here
# instead of silently leaving part of Studio's suite unrun.
check_studio_test_script() {
  local actual
  actual="$(node -p "require('./packages/apps/studio/package.json').scripts.test")"
  if [ "$actual" != "vitest run" ]; then
    echo "::error::The test script of @nocobase/studio is now '$actual'; update scripts/release-test-shard.sh to match it." >&2
    exit 1
  fi
}

case "$SHARD" in
  plugins)
    pnpm "${RECURSIVE[@]}" --filter './packages/plugins/**' test
    ;;
  'studio 1/2' | 'studio 2/2')
    check_studio_test_script
    pnpm --filter @nocobase/studio exec vitest run --shard="${SHARD#studio }"
    ;;
  others)
    FILTERS=(--filter '!./packages/plugins/**' --filter '!@nocobase/studio')
    if [ "$INCLUDE_TEMPLATES" != "true" ]; then
      FILTERS+=(--filter '!./packages/templates/**')
    fi
    pnpm scripts:test
    pnpm "${RECURSIVE[@]}" "${FILTERS[@]}" test
    pnpm db:test
    ;;
  *)
    echo "::error::Unknown test shard: $SHARD" >&2
    exit 1
    ;;
esac
