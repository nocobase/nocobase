# Flow Surfaces Auto Snapshots

`@nocobase/build` analyzes plugin client-v2 source while building and writes an auto snapshot for capability discovery.
Every discovered block also receives a namespaced, create-only `inferredAuthoring` contract. A serializable static
`createModelOptions` object becomes its node template; otherwise the template is the minimal `{ use }` node. Plugins
therefore get basic block creation without a server provider, while plugins such as Gantt can own richer defaults and
settings through a server provider.

## Contract Boundary

Auto snapshots have two layers:

- Raw discovery can say "this plugin registered `GanttBlockModel`" or "this menu item points at a block slot".
- Discovered blocks get a JSON-safe create-only contract with page, tab, and popup block placement. This does not make
  configure supported.
- Static `createModelOptions` is accepted only when it is a serializable literal. Dynamic functions are not executed;
  their discovered block falls back to `{ use }`.
- Collection and data block evidence adds public `dataSourceKey` and `collectionName` resource parameters and requires
  `collectionName` where appropriate.
- Public writes still require public payload schemas, validation, placement, target catalog confirmation, contract
  guards, and readback expectations. Those requirements can come from a provider or from high-confidence
  `inferredAuthoring`.

This boundary is intentional. The FlowModel tree contains internal fields such as `modelUse`, `props`,
`decoratorProps`, `stepParams`, `flowRegistry`, `createModelOptions`, and lenses. Those fields must not become UI
Builder payloads just because they were visible to the extractor.

## Snapshot Output

Plugin snapshots are packaged under `dist/flow-surfaces-capabilities/`; the core client-v2 snapshot is packaged under
`es/flow-surfaces-capabilities/`. Configured storage snapshots remain supported with the existing packaged-versus-storage
precedence rules. The server loads both sources once during application startup, so changing snapshot files requires an
application restart. Loading preserves the generated `inferredAuthoring` contract; older snapshots without one remain
raw, read-only discovery evidence.

## What Can Be Discovered

The extractor supports deterministic evidence:

- Build-time AST extraction for common static `registerModels`, `registerModelLoaders`, `registerFlow`,
  `bindModelToInterface`, and `AddSubModelButton` patterns.
- Structured labels from direct text and simple translation-expression labels.
- Snapshot normalization and safe snapshot writes into an explicit output directory.

## What Requires A Contract

These patterns are not inferred beyond the generic create-only contract and require a provider/manifest or a
specialized high-confidence `inferredAuthoring` contract:

- Dynamic menu factories and function-based `createModelOptions`.
- Runtime `uiSchema`, `defaultParams`, `hide`, and action handlers.
- Target-scoped placement rules, permission checks, collection requirements, and field-interface constraints.
- Public settings, configure options, and plugin-specific validation errors.
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
