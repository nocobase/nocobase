# FlowSurfaces Fixtures

This directory stores offline golden fixtures for `flowSurfaces`.

- `*.canonical.json`: stable structure assertions keyed by aliases
- `*.refs.json`: alias to raw `uid` / `routeId` mappings from captured samples
- `*.raw-persisted.json`: persisted-layer capture from `flowModels + desktopRoutes`
- `*.readback.json`: standard `flowSurfaces:get` readback payload
- legacy `*.raw.json`: fallback-only legacy layer kept for older samples until they are refreshed
- `manifest.ts`: the formal built-in block fixture manifest derived from the single support matrix
- `capture-live-fixture.mjs`: manual refresh helper that captures one fixture from a live system without requiring project `node_modules`

The tests default to synthetic integration data and do not fetch live data.
Use the helper functions in `flow-surfaces.fixtures.ts` to capture from a local DB
or an admin API session when refreshing fixtures manually.

Fixture truth is intentionally split into two layers:

- `rawPersisted`: what the current frontend actually saved into the persisted resources
- `readback`: what `flowSurfaces:get` reconstructs from those persisted rows

Both layers must normalize to the same `canonical` structure.

For live refresh, set these environment variables first:

- `FLOW_FIXTURE_BASE_URL`
- `FLOW_FIXTURE_EMAIL`
- `FLOW_FIXTURE_PASSWORD`
- `FLOW_FIXTURE_DB_HOST`
- `FLOW_FIXTURE_DB_PORT`
- `FLOW_FIXTURE_DB_USER`
- `FLOW_FIXTURE_DB_PASSWORD`
- `FLOW_FIXTURE_DB_NAME`

Then capture one fixture:

```bash
node packages/plugins/@nocobase/plugin-flow-engine/src/server/__tests__/flow-surfaces-fixtures/capture-live-fixture.mjs \
  --name table-block-live \
  --uid c2pkrw9t20qa
```
