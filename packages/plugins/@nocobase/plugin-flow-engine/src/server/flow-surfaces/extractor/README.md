# Flow Surfaces Extractor

The extractor records FlowModel registration facts from plugin client-v2 code and writes an auto snapshot for
capability discovery. Raw facts remain read-only, but a snapshot may also contain `inferredAuthoring`: a static,
JSON-safe authoring contract derived from the artifact and optional core templates. High-confidence inferred contracts
can make a capability writable without a plugin server provider.

## Contract Boundary

Auto snapshots have two layers:

- Raw discovery can say "this plugin registered `GanttBlockModel`" or "this menu item points at a block slot".
- Raw discovery cannot make `create` or `configure` supported.
- `inferredAuthoring` can make `create` supported only when every write confidence segment is high and the contract is
  JSON-safe.
- A static `createModelOptions` object only proves that the extractor saw a serializable shape. It does not prove that
  the shape is safe, stable, target-compatible, or sufficient for public writes.
- Public writes still require public payload schemas, validation, placement, target catalog confirmation, contract
  guards, and readback expectations. Those requirements can come from a provider or from high-confidence
  `inferredAuthoring`.

This boundary is intentional. The FlowModel tree contains internal fields such as `modelUse`, `props`,
`decoratorProps`, `stepParams`, `flowRegistry`, `createModelOptions`, and lenses. Those fields must not become UI
Builder payloads just because they were visible to the extractor.

## Snapshot Output

Generated snapshots are stored under `storage/flow-surfaces-capabilities/<plugin-package-name>.json` by default. The
storage location is a cache for discovery evidence. Publishing raw snapshot facts is not enough to make a capability
writable; write projection requires a complete `inferredAuthoring` contract or an explicit provider/manifest contract.

## CLI Output

Use `yarn nocobase flow-surfaces extract-capabilities --plugin <package>` for one plugin, or `--all-enabled` to inspect
enabled plugins. `--all-enabled` keeps processing after a plugin fails and reports a failing exit code at the end if any
plugin failed.

`--json` prints the machine-readable summary used by CI. Each result includes `ok`, `plugin`, optional `snapshotPath`,
`eventCount`, `candidateCount`, `warningCount`, and optional `errors`. `--dry-run` skips snapshot writes and prints only
the summary. `--fail-on-warning` turns extractor warnings into a failing result for CI without changing the snapshot
write contract. Model loaders are recorded by key only; the CLI does not execute loader functions.

## What Can Be Discovered

The extractor supports deterministic evidence:

- AST extraction for common static `registerModels`, `registerModelLoaders`, `registerFlow`,
  `bindModelToInterface`, and `AddSubModelButton` patterns.
- Structured labels from direct text and simple translation-expression labels.
- Snapshot normalization and safe snapshot writes into an explicit output directory.

## What Requires A Contract

These patterns are not enough for auto write support and must be represented by a provider/manifest or by
high-confidence `inferredAuthoring`:

- Dynamic menu factories and function-based `createModelOptions`.
- Runtime `uiSchema`, `defaultParams`, `hide`, and action handlers.
- Target-scoped placement rules, permission checks, collection requirements, and field-interface constraints.
- Public `initParams`, public `settings`, configure options, and validation errors.
- Readback parity between created FlowModel nodes and public capability types.
- Any create/configure admission decision.

## Promoting A Plugin To Writable

Plugins no longer have to register a Flow Surfaces provider to be writable. The preferred artifact-driven path is to
emit a snapshot with a complete `inferredAuthoring` contract:

Minimum inferred contract requirements:

- Declare a stable `kind`, `publicType`, `label`, `ownerPlugin`, placement, and confidence.
- Keep `confidence.write` high only when discovery, placement, tree, settings, catalog, contract, and readback guards
  are all satisfied.
- Expose only public `initParamsSchema`, `settingsSchema`, and `configureOptions`.
- Use a JSON `createRecipe` only when the required node shape can be expressed without public internal fields.
- Keep internal FlowModel fields out of public schemas, examples, catalog items, and public payloads.
- Add tests for capability projection, target catalog projection, dry-run validation, actual create behavior, and
  readback parity.

Provider and manifest APIs remain available as explicit extension points when static artifact inference is not enough.
Provider-specific requirements:

- Register with `flowSurfaceCapabilityProviders.registerProvider()` from the plugin server lifecycle when a plugin needs
  custom server-side contract logic, and unregister on disable/remove.
- Return `FlowSurfaceCapabilityManifestItem` entries from `getCapabilities()`.
- Compute availability from current plugin state without exposing internal implementation fields.
- Add `validateSettings()` when public settings need plugin-specific validation.
- Add `resolveCreate()` only after the created node shape is stable and guarded.

The snapshot can supplement a provider with source references, labels, aliases, confidence, and warnings. It cannot
bypass schema validation, target catalog confirmation, payload-shape guards, contract guards, or readback guards.
