#!/usr/bin/env bash
# Run one shard of the release test suite from the root of a release checkout.
#
# Usage: release-test-shard.sh <agents|plugins|others> <include-templates: true|false>
#
# The plugin suites are the slowest part by a wide margin, so they get runners of their own and everything else shares the third one. app-plugin-agents alone took 19 of the plugin shard's 20 minutes, and next to the other plugins on one runner its database-backed tests ran into their 30-second timeouts, so it has a shard to itself, as in Quality. Together the shards cover what `pnpm test` covers. The template suites run only when include-templates is true: otherwise the create-app smoke test runs them against the packed packages, which is the stronger check.
set -euo pipefail

USAGE='usage: release-test-shard.sh <agents|plugins|others> <include-templates>'
SHARD="${1:?$USAGE}"
INCLUDE_TEMPLATES="${2:?$USAGE}"

# --no-sort starts each package as soon as a slot is free instead of waiting for a whole dependency level.
RECURSIVE=(-r --no-sort --if-present)

AGENTS='@nocobase/app-plugin-agents'

case "$SHARD" in
  agents)
    pnpm "${RECURSIVE[@]}" --filter "$AGENTS" test
    ;;
  plugins)
    pnpm "${RECURSIVE[@]}" --filter './packages/plugins/**' --filter "!$AGENTS" test
    ;;
  others)
    FILTERS=(--filter '!./packages/plugins/**')
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
