# Light Extension

`@nocobase/plugin-light-extension` is the domain layer for NocoBase light extensions.

Light extensions organize multi-file RunJS entries on top of `@nocobase/plugin-vsc-file`. They let existing RunJS surfaces, starting with client-v2 JS Block, choose a published entry instead of copying code into each FlowModel.

## Boundaries

- A light extension repository is not a NocoBase plugin package and does not have plugin lifecycle hooks.
- This package must not introduce a second RunJS compiler, artifact store, or runtime.
- Light extension entries cannot define collections, migrations, resources, ACL rules, app providers, server middleware, or package dependencies.
- Runtime code is resolved by existing RunJS surfaces through publication bindings. The initial plugin shell only owns the light-extension settings entry, repository organization boundary, entry metadata boundary, and selection UI boundary; publication indexes and references are added in later tasks.
- Core MVP targets client-v2 first. During the current admin-shell transition, the legacy client bundle also registers the same minimal settings page so `/admin/settings/light-extension` can load without a remote-plugin 404. That bridge must stay thin: no `@nocobase/client` imports, no SchemaComponent runtime, and no ordinary plugin-management concepts.

## SDK Shape

The local SDK boundary is limited to TypeScript types and zero-runtime helpers such as `defineSettings()`. It does not export extension registration APIs such as `defineClientExtension`, `registerBlock`, `registerAction`, or `registerResource`.

CLI templates should generate local `.d.ts` shims and TypeScript path mappings for entry typechecking. Published entry code should import SDK types with `import type` and receive runtime objects from the injected context.

The package root remains the server plugin entry. The source workspace seeds local `.d.ts` shims for `@nocobase/light-extension-sdk/client` and `@nocobase/light-extension-sdk/shared` so browser authoring can typecheck before a standalone SDK package exists.
