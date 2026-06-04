# Flow Surfaces Extractor

The extractor records FlowModel registration facts from plugin client-v2 code and writes an auto snapshot for
read-only discovery. Its output helps `flowSurfaces:capabilities` explain that a plugin appears to provide a block or
action, but it is not an authoring contract.

## Contract Boundary

Auto snapshots are fact discovery only.

- A snapshot can say "this plugin registered `GanttBlockModel`" or "this menu item points at a block slot".
- A snapshot cannot make `create` or `configure` supported.
- A static `createModelOptions` object only proves that the extractor saw a serializable shape. It does not prove that
  the shape is safe, stable, target-compatible, or sufficient for public writes.
- Public writes still require a manifest or provider that declares public payload fields, validation, placement, readback
  expectations, and a write recipe.

This boundary is intentional. The FlowModel tree contains internal fields such as `modelUse`, `props`,
`decoratorProps`, `stepParams`, `flowRegistry`, `createModelOptions`, and lenses. Those fields must not become UI
Builder payloads just because they were visible to the extractor.

## Snapshot Output

Generated snapshots are stored under `storage/flow-surfaces-capabilities/<plugin-package-name>.json` by default. The
storage location is a cache for discovery evidence. It is not a plugin API, and publishing a snapshot file is not enough
to make a capability writable.

## What Can Be Discovered

The first extractor layer supports deterministic evidence:

- Runtime recorder events for `registerModels`, `registerModelLoaders`, `registerFlow`, menu items, and field bindings.
- Guarded runtime inspection with browser, network, storage, scheduler, and process APIs blocked.
- AST fallback for common static `registerModels`, `registerModelLoaders`, `registerFlow`, `bindModelToInterface`, and
  `AddSubModelButton` patterns.
- Structured labels from direct text and simple translation-expression labels.
- Snapshot normalization and safe snapshot writes into an explicit output directory.

## What Requires Manifest Or Provider

These patterns are not enough for auto write support and must be represented by a manifest or provider:

- Dynamic menu factories and function-based `createModelOptions`.
- Runtime `uiSchema`, `defaultParams`, `hide`, and action handlers.
- Target-scoped placement rules, permission checks, collection requirements, and field-interface constraints.
- Public `initParams`, public `settings`, configure options, and validation errors.
- Readback parity between created FlowModel nodes and public capability types.
- Any create/configure admission decision.

## Promoting A Plugin To Writable

Third-party plugins that want UI Builder to create or configure a discovered model should add a manifest or provider.
That manifest/provider is the authoring contract; the snapshot remains supporting evidence.

Minimum manifest requirements:

- Declare a stable `id`, `kind`, `label`, `semantic`, `implementation.modelUse`, and optional `publicType`.
- Declare placement and availability conservatively.
- Expose only public `initParamsSchema`, `settingsSchema`, and `configureOptions`.
- Use a JSON `createRecipe` only when the required node shape can be expressed without internal payload fields.
- Keep internal FlowModel fields out of public schemas and examples.
- Add tests for capability projection, dry-run validation, actual create behavior when enabled, and readback parity.

Use a provider when static manifest data is not enough. Provider-specific requirements:

- Register with `flowSurfaceCapabilityProviders.registerProvider()` from the plugin server lifecycle, and unregister on
  disable/remove.
- Return `FlowSurfaceCapabilityManifestItem` entries from `getCapabilities()`.
- Compute availability from current plugin state without exposing internal implementation fields.
- Add `validateSettings()` when public settings need plugin-specific validation.
- Add `resolveCreate()` only after the created node shape is stable and guarded.

The snapshot can supplement the manifest/provider with source references, labels, aliases, confidence, and warnings. It
cannot override the contract, promote `create.supported`, or bypass validation.
