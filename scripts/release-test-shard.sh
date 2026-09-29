#!/usr/bin/env bash
# Run one shard of the release test suite from the root of a release checkout.
#
# Usage: release-test-shard.sh <plugins|others> <include-templates: true|false>
#
# The plugin suites are the slowest by a wide margin (about two thirds of the total), so they get a runner of their
# own and everything else shares the other. Together the two shards cover what `pnpm test` covers. The template
# suites run only when include-templates is true: otherwise the create-app smoke test runs them against the packed
# packages, which is the stronger check.
set -euo pipefail

SHARD="${1:?usage: release-test-shard.sh <plugins|others> <include-templates>}"
INCLUDE_TEMPLATES="${2:?usage: release-test-shard.sh <plugins|others> <include-templates>}"

# --no-sort starts each package as soon as a slot is free instead of waiting for a whole dependency level.
RECURSIVE=(-r --no-sort --if-present)

case "$SHARD" in
  plugins)
    pnpm "${RECURSIVE[@]}" --filter './packages/plugins/**' test
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
