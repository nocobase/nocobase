# Plugin Registry

Read this reference when a plugin must ship editable Client source that an application will own after installation. A Registry item is a source recipe, not a Client Runtime contribution, and materializing an item neither registers nor enables the plugin.

## Choose the delivery model first

| Desired ownership                                                        | Use                                                                   |
| ------------------------------------------------------------------------ | --------------------------------------------------------------------- |
| The plugin must keep behavior consistent across upgrades                 | A plugin Runtime Component, Route, ServiceProvider, or React Provider |
| Consumers need a stable import while the plugin keeps the implementation | A public package export                                               |
| The App must edit the implementation after installation                  | A Registry item                                                       |

The current Registry tool delivers source from a package-owned `registry/` directory into an App-owned `client/extensions/` directory. Do not use it for Server Routes, Services, Jobs, Migrations, ACL rules, or database configuration.

## Ownership and runtime boundaries

```text
plugin/client/**                  plugin-owned Runtime source
plugin/registry/<item>/**         plugin-owned canonical recipe
app/client/extensions/<name>/**   App-owned installed source
```

The plugin must provide any required runtime protocol and a usable default or fallback independently of the Registry item. A Registry page may replace presentation through a stable public Route ID, but it must not copy authentication, authorization, persistence, or other plugin internals. Import plugin capabilities only through documented package exports.

An installed item participates in the App's TypeScript, Vite, Tailwind, and test pipelines. It no longer executes from the plugin package, and upgrading the plugin does not overwrite it.

## Scaffold Registry support

Select Registry support explicitly when creating a plugin:

```bash
pnpm plugin:create feature-card --with registry
```

This capability creates the Registry configuration, a minimal component item, package scripts, publishing metadata, and the plugin-local shadcn setup needed for runtime UI. Remove placeholder content and model each real item around the API it delivers.

Do not add Registry support when consumers should not own editable source.

## Use shadcn for UI items

Use shadcn components for Registry UI. Prefer an existing shadcn primitive over hand-built buttons, inputs, dialogs, forms, menus, and other standard controls.

Plugin Runtime UI and App-owned Registry UI have separate source ownership:

- Run `pnpm exec shadcn add <component>` in the plugin package for Runtime UI. Inspect its `components.json` and `package.json` to learn the package-local import prefixes and targets. Keep compiled imports bound to the plugin's own files; stable relative `.js` paths work in older plugins too.
- In a Registry item, use the consumer's package-local imports for UI and declare each primitive, such as `button`, in `registryDependencies`. Keep the consumer's `components.json` prefixes and `package.json#imports` aligned. Do not rely on a host-global build-tool alias.
- Repository-local `registry materialize` copies files only, so prepare the App's declared shadcn primitives before materializing. Remote `shadcn add` resolves `registryDependencies` itself.

Keeping the two shadcn copies separate lets the plugin upgrade its Runtime UI while the App customizes installed UI. Do not copy the plugin's entire `client/components/ui/` into an item merely to share primitives.

## Author an item

A typical package organizes recipes by the public shape they deliver:

```text
app-plugin-feature-card/
├── client/                         plugin Runtime and fallback
├── registry/
│   ├── page-ui/                    optional page override
│   ├── component-ui/               optional importable component
│   └── provider-ui/                optional Provider, Context, and hook
├── registry.config.json
└── public/r/                       generated Registry JSON
```

Keep relative imports inside the item root and include their `.js` extension. Use stable package exports for plugin APIs and package-local imports for consumer-owned services or UI. Give directly imported items an `index.ts` and map directory imports explicitly to that entry point. Add `extension.ts` only when the installed source must contribute automatically to the App.

The Default Template discovers the exact path `client/extensions/*/extension.ts`. A page item can use `defineClientSourceExtension()` there to override an existing Route component by stable Route ID; it should not redeclare the Route. A component item normally exports an App-imported component and has no extension. A Provider item exports the Provider, Context, and hook while the App chooses the wrapping scope.

Each item should include a short README that identifies its entry point, prerequisites, App-owned customization surface, and upgrade policy.

## Configure items

Declare canonical item roots in the plugin manifest:

```json
{
  "files": ["dist", "registry", "registry.config.json", "public/r"],
  "nocobase": {
    "registry": {
      "items": {
        "component-ui": "./registry/component-ui"
      }
    }
  }
}
```

Define the item and its install mapping in `registry.config.json`:

```json
{
  "name": "nocobase-feature-card",
  "items": [
    {
      "name": "component-ui",
      "type": "registry:component",
      "title": "Feature card component",
      "dependencies": [],
      "registryDependencies": ["button"],
      "docs": "Install this App-owned component and import it from its index.ts.",
      "meta": {
        "ownership": "application",
        "upgradePolicy": "three-way-merge"
      },
      "source": {
        "root": "registry/component-ui",
        "target": "client/extensions/nocobase-feature-card-component-ui",
        "include": ["."]
      }
    }
  ]
}
```

| Field                  | Contract                                                                                |
| ---------------------- | --------------------------------------------------------------------------------------- |
| `name`                 | Non-empty unique item name and generated `<name>.json` filename                         |
| `type`                 | A shadcn Registry item type such as `registry:component` or `registry:block`            |
| `dependencies`         | Versioned npm dependencies that remote `shadcn add` installs in the App                 |
| `registryDependencies` | shadcn primitives or named Registry items that remote installation resolves recursively |
| `docs`                 | Installation and use guidance embedded in the item                                      |
| `meta`                 | Descriptive NocoBase metadata; current tools do not execute it                          |
| `source.root`          | Canonical source under `registry/`                                                      |
| `source.target`        | Installation target under `client/extensions/`                                          |
| `source.include`       | Files or directories selected from the source root; `.` selects everything              |

Declare dependencies and compatibility ranges explicitly. The build does not derive a complete dependency list from the plugin manifest.

The optional `source.package` field may source a recipe from another workspace package, but a plugin publishing its own recipe should omit it so source, configuration, and output stay together.

`meta.ownership`, `meta.upgradePolicy`, and `meta.nocobase.requiresPlugins` communicate intent to people and future tooling. Current build, materialize, and shadcn flows do not enforce required plugin versions or perform merges.

## Build and publish

Build one package from the repository root:

```bash
pnpm registry build --package @nocobase/app-plugin-feature-card
```

Build one item during development:

```bash
pnpm registry build --package @nocobase/app-plugin-feature-card --item component-ui
```

Build every workspace package containing `registry.config.json`:

```bash
pnpm registry build --all
```

A full build clears the package's `public/r/` and writes `registry.json` plus one self-contained `<item>.json` per item. A selected `--item` build retains other item files but rewrites `registry.json` to contain only the selection, so run a full build before publishing a multi-item package.

Keep `public/r/` generated and never hand-edit it. Ensure the package publishes Runtime output, canonical recipes, `registry.config.json`, and Registry JSON. Integrate `pnpm registry:build` into the package's existing `prepack` flow so the tarball cannot contain missing or stale JSON.

An npm tarball containing `public/r/*.json` is not an HTTP Registry. Remote installation still needs release infrastructure to expose those files through an HTTP(S) URL or CDN.

## Materialize in a workspace

Materialize a selected item directly from canonical source:

```bash
pnpm registry materialize \
  --package @nocobase/app-plugin-feature-card \
  --item component-ui \
  --output-root packages/templates/app-template-default
```

Omitting `--item` materializes every configured item. Before copying any files, the tool checks every destination and refuses the operation if a target already exists. It has no overwrite mode.

Materialize does not read `public/r`, install npm dependencies, install shadcn primitives, register a plugin, enforce `requiresPlugins`, record a version or hash, or update an existing copy. Prepare those prerequisites explicitly, then run the target App's checks.

## Install remotely

After publishing Registry JSON through HTTP(S), run shadcn from the consuming App:

```bash
pnpm exec shadcn add https://registry.example.com/feature-card/r/component-ui.json
```

The App may instead configure a named Registry in `components.json` and install `@registry-name/component-ui`. Remote shadcn installation processes `dependencies`, `registryDependencies`, and each file target. It still does not register or enable a NocoBase plugin merely because item metadata says the plugin is required.

## Upgrade or remove an installed item

Installed source belongs to the App, so update it with an explicit three-way merge:

```text
old canonical source     merge base
current App copy         App customizations
new canonical source     upstream changes
```

Review public API, dependency, and source changes between the two canonical versions; merge the upstream changes into the App copy; preserve App branding and business customization; add new npm and shadcn dependencies; then verify the App. Do not use overwrite installation unless the user explicitly accepts losing App changes.

There is no automatic Registry update, remove, merge, lockfile, installed-version record, or dependency reference counter. To remove an item, delete only its App-owned extension directory, remove dependencies only after checking other consumers, and verify that any plugin fallback resumes. Unregister the plugin separately only when the App no longer needs its Runtime contribution.

## Verification

- Contract-test `registry.config.json`, source roots, public imports, targets, and manifest item declarations.
- Run the plugin's Registry build and confirm the expected index and item JSON are produced.
- Materialize into a temporary or real App and confirm the exact target files and imports.
- Run the consuming App's focused lint, typecheck, behavior tests, and build; plugin-only typechecking cannot resolve App aliases or prove installed source works.
- For an automatic extension, verify the real Route override or Provider composition in the App.

Current implementation and maintained examples:

- Registry build and materialize script (`scripts/registry.mjs`)
- Registry example package (`packages/examples/app-plugin-registry-example/package.json`)
- Registry example configuration (`packages/examples/app-plugin-registry-example/registry.config.json`)
- Page source extension example (`packages/examples/app-plugin-registry-example/registry/page-ui/extension.ts`)
- Default Template source-extension loader (`packages/templates/app-template-default/client/source-extensions.ts`)
