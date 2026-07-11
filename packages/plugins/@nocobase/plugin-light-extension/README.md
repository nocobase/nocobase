# Light Extension

`@nocobase/plugin-light-extension` is the domain layer for NocoBase light extensions.

Light extensions organize multi-file RunJS entries on top of `@nocobase/plugin-vsc-file`. Existing RunJS surfaces reference an entry by repository, entry, and kind instead of copying code into each FlowModel.

## Boundaries

- A light extension repository is not a NocoBase plugin package and does not have plugin lifecycle hooks.
- This package must reuse the shared RunJS compiler, artifact contract, and runtime. Repository creation and source saves are compile-gated and atomic: validation or compilation errors leave repository metadata, Head, runtime artifacts, and existing references unchanged.
- Light extension entries cannot define collections, migrations, resources, ACL rules, app providers, server middleware, or package dependencies.
- Runtime code is resolved by existing RunJS surfaces through entry bindings. The plugin owns repository organization, entry metadata, compiled runtime artifacts, settings validation, reference indexes, and selection UI; it does not add a separate publication/version-policy layer.
- Runtime resolution is available to logged-in page users, matching the existing RunJS source runtime. Repository authoring and management remain behind `pm.light-extension`, so page users do not receive create, save, archive, or delete permissions merely to execute an existing binding.
- Core MVP targets client-v2 first. During the current admin-shell transition, the legacy client bundle also registers the same minimal settings page so `/admin/settings/light-extension` can load without a remote-plugin 404. That bridge must stay thin: no `@nocobase/client` imports, no SchemaComponent runtime, and no ordinary plugin-management concepts.

## SDK Shape

The local SDK boundary is limited to TypeScript types and zero-runtime helpers such as `defineSettings()`. It does not export extension registration APIs such as `defineClientExtension`, `registerBlock`, `registerAction`, or `registerResource`.

CLI templates should generate local `.d.ts` shims and TypeScript path mappings for entry typechecking. Entry source code should import SDK types with `import type` and receive runtime objects from the injected context.

The package root remains the server plugin entry. The source workspace seeds local `.d.ts` shims for `@nocobase/light-extension-sdk/client` and `@nocobase/light-extension-sdk/shared` so browser authoring can typecheck before a standalone SDK package exists.

## Source Save Contract

`lightExtensionFiles:saveSource` accepts `repoId`, `message`, and `files`. It performs the VSC commit, workspace validation, entry reconciliation, and runtime compilation in one database transaction. There is no separate scan action or scan state.

| Case | Result | Persistent state |
| --- | --- | --- |
| Valid changed source | Returns the commit, tree, entry compile results, and diagnostics | Repository Head and current runtime artifacts advance together |
| Validation or compilation error | Returns `LIGHT_EXTENSION_VALIDATION_FAILED` with HTTP 422 diagnostics | The transaction rolls back; Head, source, entries, runtime artifacts, and references remain unchanged |
| Empty/no-change save | Returns the VSC `NO_CHANGES` source error | Nothing changes |
| Archived repository | Returns `LIGHT_EXTENSION_REPO_ARCHIVED` | Nothing changes |

The primary assertion coverage lives in `src/server/__tests__/save-source-runtime.test.ts`. Run it with:

```bash
yarn test packages/plugins/@nocobase/plugin-light-extension/src/server/__tests__/save-source-runtime.test.ts --run
```

## UI Integration Contract

Light extensions are selected from the code-source settings of existing JS Block, JS Item, JS Field, and JS Action surfaces. The plugin must not inject light-extension entries into Add Block, Add Field, or Add Action menus. When an existing surface opens **Write JavaScript** with a light-extension binding, the editor opens that repository workspace at the bound `entryPath`.

An entry-bound workspace can edit the selected entry directory and files outside all managed entry roots, such as shared helpers and repository metadata. Other entries under `js-blocks`, `js-actions`, `js-items`, `js-fields`, and `runjs` remain viewable but read-only. Repository management opens the same workspace without this entry scope and retains full authoring access.
