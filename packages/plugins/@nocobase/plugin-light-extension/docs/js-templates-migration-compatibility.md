# JS Templates migration, upgrade, and rollback guide

## Decision

`JS Templates` is the canonical English product and UI name. `JS 模板` is the canonical Simplified Chinese name.

`light-extension` remains the legacy technical identity. Existing stored values and public contracts can be present in
databases, saved FlowModels, source repositories, CLI workspaces, deployed clients, and downstream packages. Product
copy changes must not rename or rewrite those values.

The executable baseline is declared by `LIGHT_EXTENSION_LEGACY_PERSISTENCE_CONTRACT` and
`LIGHT_EXTENSION_LEGACY_PROTOCOL_CONTRACT` in `src/constants.ts`. Contract tests intentionally compare those manifests
with literal expected values and with the current database, RunJS, CLI, SDK, runtime, resource, and ACL surfaces.

## Supported deployment paths

Use `@nocobase/plugin-js-template` for new installations and upgrades. It is the canonical package and is included by
`@nocobase/preset-nocobase`. Keep `@nocobase/plugin-light-extension` installed at the same version because it remains
the runtime implementation and the rollback package.

| Operation | Recommended package or entry | Retained fallback | Persisted runtime identity |
| --- | --- | --- | --- |
| Install or upgrade | `@nocobase/plugin-js-template` through `@nocobase/preset-nocobase` | `@nocobase/plugin-light-extension` | `light-extension` |
| Plugin enable or disable | `@nocobase/plugin-js-template` | `@nocobase/plugin-light-extension` | One `applicationPlugins` row named `light-extension` |
| SDK imports | `@nocobase/js-template-sdk` | `@nocobase/light-extension-sdk` | Legacy schema and virtual-import tokens |
| HTTP resources | `jsTemplate*` and `jsTemplates` aliases | `lightExtension*` and `lightExtensions` | Legacy resource and ACL identity |
| Local workspace CLI | `nb js-template ...` | `nb light ...` | Existing `.light-extension` workspace files |
| Settings route | `/admin/settings/js-templates` | `/admin/settings/light-extension` | `pm.light-extension` |

The canonical package is a facade, not a second runtime plugin. A healthy installation has one matching
`applicationPlugins` row. Its `name` is `light-extension`, its runtime `packageName` is
`@nocobase/plugin-light-extension`, and its primary key and lifecycle state survive upgrades and rollbacks.

## Before changing packages

Back up the application database and persistent storage before an install, upgrade, or rollback. Record the existing
JS Templates plugin row, including its primary key, `enabled`, `installed`, `builtIn`, `packageName`, and `version`.
Also record representative repository, Entry, reference, runtime artifact, and VSC repository identifiers.

Do not prepare the upgrade by renaming rows, tables, FlowModel values, VSC owners, routes, or ACL resources. The upgrade
logic matches both package names and reuses the existing record. A pre-upgrade rewrite removes the identity that the
compatibility layer expects to find.

All packages in the JS Templates publication chain must use the same NocoBase release version. This includes both
plugin packages, both SDK packages, `@nocobase/runjs`, `@nocobase/runjs-workspace`, and the preset.

## Fresh installation

The normal application or Docker installation path installs `@nocobase/app`, which installs
`@nocobase/preset-nocobase`. The preset includes both JS Templates package names and advertises only the canonical
package as built in.

1. Install the application dependencies from the canonical preset or image
2. Run `yarn nocobase install` for a new application
3. If the plugin was explicitly disabled, run `yarn nocobase pm enable @nocobase/plugin-js-template --yes`
4. Open `/admin/settings/js-templates` and create or open a JS Template
5. Check, save, and execute one representative RunJS surface

After installation, verify that there is one `applicationPlugins` row named `light-extension`. Creating a separate
`js-template` row is a compatibility failure. The first JS Template repository is created only by an explicit
authoring action; installation itself must not create business repositories.

## Upgrade an existing Light Extension installation

Upgrade the complete application dependency set so the canonical facade and legacy implementation have the same
version, then run:

```bash
yarn nocobase upgrade
```

The upgrade must update the existing plugin row in place. Verify the following before enabling new authoring work:

- The `applicationPlugins` primary key is unchanged
- The `enabled` and `installed` values are unchanged
- There is no additional `js-template` row
- All `lightExtension*` collection counts are unchanged
- The existing VSC repository keeps `ownerType: "light-extension"` and the same repository, commit, ref, and blob identities
- Existing FlowModels still contain `sourceMode: "light-extension"` and `sourceBinding.type: "light-extension-entry"`
- Existing runtime artifacts retain their hashes and `light-extension.runtime-artifact.v1` contract
- Both `/admin/settings/js-templates` and the old `/admin/settings/light-extension` deep link load the same page

An upgrade does not need a database rename migration. If a deployment tool proposes table renames or bulk FlowModel
updates, stop the rollout and restore the pre-upgrade backup before continuing.

## Disable and re-enable

Use the canonical package name for normal administration:

```bash
yarn nocobase pm disable @nocobase/plugin-js-template --yes
yarn nocobase pm enable @nocobase/plugin-js-template --yes
```

While disabled, repository-backed JS Templates APIs return HTTP 503 with
`LIGHT_EXTENSION_RUNTIME_UNAVAILABLE`. Inline RunJS workspaces remain available because they are owned by the RunJS
Workspace provider. Disabling the plugin must not delete its business collections, VSC history, bindings, references,
or artifacts.

After re-enabling, verify the canonical and legacy settings routes, list an existing repository, read its history,
resolve a bound runtime artifact, and save a new source commit. The repository ID, VSC owner, historical commits,
references, artifact hashes, and saved FlowModel binding must remain in place.

## Roll back to the legacy package or preset

The rollback path uses `@nocobase/plugin-light-extension` directly. Keep the database and persistent storage from the
current deployment; do not restore an older database merely to change the package name.

1. Stop application processes and back up the current database and storage
2. Restore the earlier application image, package manifest, and lockfile that contain `@nocobase/plugin-light-extension`
3. Install that dependency set and run `yarn nocobase upgrade`
4. If needed, run `yarn nocobase pm enable @nocobase/plugin-light-extension --yes`
5. Verify the old settings deep link, `lightExtension*` APIs, `nb light ...` commands, and a bound runtime surface

The legacy-only preset discovers and loads the existing `light-extension` runtime without the canonical facade. It
reuses the same `applicationPlugins` primary key and lifecycle state. If the rollback dependency set does not include
`@nocobase/plugin-js-template`, use the legacy package name in plugin-manager commands; a missing canonical package is
not synthesized.

Rollback keeps current JS Template data. Do not delete canonical-looking records automatically if an earlier failed
deployment created duplicates. Back up the database, identify which row owns the established `light-extension`
runtime and data, and resolve the duplicate separately.

## Canonical persisted values

The following legacy values remain canonical for persistence. New JS Templates UI and APIs must continue writing them:

| Boundary | Canonical persisted value | Compatibility reason |
| --- | --- | --- |
| RunJS source mode | `light-extension` | Stored in FlowModel step parameters and used to select the runtime resolver |
| RunJS source binding type | `light-extension-entry` | Stored with repository and Entry identity in FlowModels |
| VSC repository owner type | `light-extension` | Stored in `vscFileRepositories` and enforced as a protected permission boundary |
| Business collections/tables | `lightExtensionRepos`, `lightExtensionEntries`, `lightExtensionReferences`, `lightExtensionRuntimeArtifacts`, `lightExtensionLogs`, `lightExtensionMoveOperations`, `lightExtensionCreateJobs` | Existing foreign keys, repository history, artifacts, references, and jobs depend on these identities |

Do not create renamed tables, bulk-update saved FlowModels, or change VSC owner types as part of the product rename. New
logical names must resolve to the existing records.

The collection definitions and all production database lookups resolve through the frozen
`LIGHT_EXTENSION_COLLECTIONS` constants. VSC access continues to use `LIGHT_EXTENSION_OWNER_TYPE`, which is asserted
against the RunJS Workspace `LIGHT_EXTENSION_PERSISTED_VSC_OWNER_TYPE`. Contract tests pin the physical fields,
indexes, associations, lifecycle reuse behavior, and absence of table-rename migrations.

## Stable legacy protocol values

The following contracts remain supported. Canonical JS Templates names may be added later as aliases, but must not
replace these values without a separate compatibility review and an upgrade-and-rollback plan:

- Runtime contracts: `light-extension.runtime-artifact.v1` and `light-extension.runtime-surface.v1`
- Public error codes: the complete `LIGHT_EXTENSION_ERROR_CODES` set and its `LIGHT_EXTENSION_` prefix
- ACL and settings identities: `pm.light-extension` and `light-extension`
- HTTP resources: all `lightExtensions` and `lightExtension*` resources listed in the protocol manifest
- Documented HTTP paths under `/light-extensions` and `/light-extension-runtime`
- CLI topic and module: `nb light ...` and `light-extension`
- SDK package and subpaths: `@nocobase/light-extension-sdk`, including `/client`, `/shared`, `/schema`, `/schema/server`,
  `/schema/entry-v1.schema.json`, and `/typegen`
- Source-workspace contracts: the legacy schema URI, `light-extension:settings/`, `.light-extension/types`, and
  `light-extension.json`
- Plugin package identity: `@nocobase/plugin-light-extension`

Unknown private registries, deployed artifacts, and downstream consumers are treated as compatibility requirements.
A public-registry or repository search that finds no consumer is not sufficient evidence to remove a legacy contract.

## CLI and generated API command aliases

`nb js-template pull|check|save` is the canonical local-workspace command tree. The historical
`nb light pull|check|save` tree remains a thin facade over the same command classes and keeps calling the legacy HTTP
resources so it also works with servers that predate the canonical aliases. Both trees retain the existing flags,
environment lookup, `.nocobase/light-extension-*` workspace state, `.light-extension/types`, output formats, and exit
codes.

Generated API commands expose canonical `js-template-repos`, `js-template-entries`, `js-template-references`,
`js-template-files`, and `js-templates` topics. Every canonical operation is documented from the same Swagger request
and response contract as its retained `light-extension-*` or `light-extensions` alias, and calls the `jsTemplate*`
HTTP facade that resolves to the existing legacy handler and ACL identity. The `light-extension` API command module,
all legacy paths, and their output and error contracts remain available.

## Canonical server API aliases

New server consumers use the `JsTemplate*` facade exports and the `jsTemplate*` HTTP resource aliases. The centralized
`JS_TEMPLATE_SERVER_API_ALIASES` contract rewrites every canonical resource/action to its existing `lightExtension*`
resource before resource parsing and ACL evaluation. Both names therefore use the same handler, legacy grant identity,
transaction, audit, throttling, raw-resource guard, and VSC owner protection. Existing ACL rows require no rewrite.

`lightExtensionLogs` and `lightExtensionMoveOperations` remain protected physical collections, not public custom HTTP
resources. The rename does not create `jsTemplateLogs` or `jsTemplateMoveOperations` APIs that could expose them.

## RunJS persistence and runtime aliases

`JS_TEMPLATE_RUNJS_PERSISTENCE_RUNTIME_CONTRACT` is the canonical TypeScript contract for new server code. Its values
remain the legacy wire identities: `light-extension`, `light-extension-entry`, the existing `lightExtension*`
collections, VSC owner type `light-extension`, the established runtime artifact/surface contracts, legacy schema URI,
and `LIGHT_EXTENSION_*` error prefix. Canonical helpers serialize those values and reject invented `js-template`
persisted tokens.

Move, reference indexing, runtime resolution, compile keys, artifact hashing, ZIP/Git import, and creation jobs continue
through the existing implementation. Reading and saving a historical FlowModel or entry descriptor must not rewrite
its source mode, binding type, schema URI, entry key, locator, or settings structure.

## RunJS and Flow Surfaces integration aliases

New integration code uses the `JsTemplate*` facade and the canonical `jsTemplate*` HTTP aliases, while
`JS_TEMPLATE_RUNJS_FLOW_SURFACES_INTEGRATION_CONTRACT` maps them to the existing persisted integration keys. The
following values remain protocol identities rather than product copy:

- FlowModel locator/step/value paths: `flowModel.step`, `runJs`, `code`, and `version`
- Source metadata key: `lightExtensionKind`
- Editor provider key: `light-extension-runjs-value`
- Workspace toolbar key: `@nocobase/plugin-light-extension/move-source`
- Surface menu provider key: `@nocobase/plugin-light-extension/model-menus`
- Existing `JS*LightExtension*` Flow Settings component registry values

The contract enumerates every supported JS Block, Page, Field, Item, and Action model use and its established
`jsSettings` or `clickSettings` flow key. The Flow Engine server adapter contract separately pins render, value, and
action source mappings, including chart value/action sources, without depending on the optional plugin package.

Both v1 and v2 client entry points install the same resolver, editor provider, source-move contribution, model menus,
and Flow Settings components. Canonical constructors prefer the `jsTemplate*` API aliases, but source serialization
still goes through `JS_TEMPLATE_RUNJS_PERSISTENCE_RUNTIME_CONTRACT` and writes only the legacy wire identities.
Reference synchronization exposes canonical provider methods and retains the old method names and plugin-manager
aliases as facades. Disabling or temporarily removing the plugin therefore leaves historical FlowModels loadable and
does not create a second registry or reference identity.

## Client v2 UI and route aliases

Client v2 presents `JS Templates` (`JS 模板`) as the product name. Its visible settings route is
`/admin/settings/js-templates`; `/admin/settings/light-extension` remains a hidden, routable compatibility entry for
bookmarks and deployed links. Both routes use the same page loader and the existing `pm.light-extension` ACL snippet.
Canonical `JsTemplate*` component, hook, provider, registry, and plugin exports are aliases of the existing
implementation, while legacy exports and registry keys remain available.

User-visible product copy may use the canonical name, but route compatibility does not authorize any persisted token
rewrite. Saved FlowModels continue to use the source, binding, provider, registry, and flow keys frozen above.

## Client v1 admin-shell bridge

The legacy client bundle exports `PluginJsTemplateClient` as its canonical bridge and retains
`PluginLightExtensionClient` as the same constructor. It installs the shared v2 RunJS integrations and renders the
same `JsTemplateListPage` used by client v2; it does not implement a second settings UI or runtime pipeline.

The v1 settings shell exposes `/admin/settings/js-templates` as the visible `JS Templates` entry and keeps
`/admin/settings/light-extension` registered as a hidden deep-link alias. Both registrations share the same page
component and `pm.light-extension` ACL snippet. The legacy settings key remains registered so plugin-manager links,
bookmarks, ACL configuration, and older callers continue to resolve without changing any persisted FlowModel token.

## Canonical SDK and compatibility facade

New internal consumers and generated examples use `@nocobase/js-template-sdk`. This package owns the SDK source,
schema, type generation, and public implementation. `@nocobase/light-extension-sdk` is a long-term compatibility
facade that re-exports the canonical implementation through every historical subpath.

The package rename does not rename the schema URI, `light-extension:settings/*` virtual imports,
`.light-extension/types`, or any saved source contract. The compatibility facade depends on the canonical package;
the canonical package must never depend on the facade.

## Plugin package and preset identity

`@nocobase/plugin-js-template` is the canonical package and the preset's built-in identity. The preset retains the
legacy package as a compatibility dependency, and the canonical package installs it as its runtime implementation.
The canonical package is a thin facade over `@nocobase/plugin-light-extension`, so the complete legacy server, client,
client-v2, Swagger, and programmatic exports remain installed and resolvable during the package transition.

Package resolution normalizes `js-template`, `@nocobase/plugin-js-template`, `light-extension`, and
`@nocobase/plugin-light-extension` to one runtime identity: name `light-extension` and runtime package
`@nocobase/plugin-light-extension`. The runtime identity remains legacy because plugin collection loading, the
existing plugin-manager enable state, ACL snippet, settings keys, and plugin lifecycle already depend on it. The
canonical package and preset identity are therefore discoverable without creating a second runtime plugin. When the
canonical package is not installed, the legacy package continues to resolve on its own for rollback and older presets.

Fresh preset installs create one `applicationPlugins` record with the established `light-extension` name and package.
Preset upgrades reuse that record in place, retaining its primary key, `enabled`, and `installed` values; they never
create a second `js-template` record. Both client package maps keep canonical and legacy module aliases, so
pre-upgrade records and cached clients load the same implementation.

This package-level normalization is not a persisted RunJS migration. It does not rename collections, VSC owners,
FlowModel keys, source bindings, artifacts, routes, HTTP/ACL/CLI/SDK tokens, or any other frozen wire identity.

## Build, version, Docker, and release boundary

The canonical plugin, legacy implementation, canonical SDK, legacy SDK facade, RunJS packages, and preset use the same
repository release version. Exact internal dependencies use that version as well, so Lerna version updates keep the
publication chain synchronized without creating a second plugin runtime.

The canonical package explicitly includes its root facade entries in npm and NocoBase tar artifacts. The SDK packages
explicitly include their compiled `lib` output. Canonical artifacts use the `@nocobase/plugin-js-template` package name;
legacy artifacts keep the `@nocobase/plugin-light-extension` name for older installers, caches, and rollback.

All release packages remain public Lerna workspaces. The normal unfiltered `lerna publish` and forced `from-package`
paths therefore publish both plugin names and both SDK names. There is no JS Templates-only release allowlist that can
drop a compatibility package.

Docker images install `@nocobase/app`, which installs `@nocobase/preset-nocobase`. The preset installs both plugin
packages, advertises only `@nocobase/plugin-js-template` as built in, and keeps `@nocobase/plugin-light-extension` in
the deprecated compatibility list. Both packages normalize to the existing `light-extension` runtime record, so image
upgrades and rollbacks reuse the same enable state and persisted data.

## Troubleshooting

### A second plugin record appears

Stop the rollout before enabling either record. A compatible installation has one `applicationPlugins` row with the
runtime name `light-extension`. Preserve the database, compare both rows with the pre-upgrade snapshot, and do not
guess which row can be deleted.

### Repository APIs return HTTP 503 after enable

Check the plugin list and server logs first. Confirm that `@nocobase/plugin-light-extension` is installed at the same
version as `@nocobase/plugin-js-template`, then enable either recognized package name. The error code must remain
`LIGHT_EXTENSION_RUNTIME_UNAVAILABLE`; a new `JS_TEMPLATE_*` error code indicates protocol drift.

### Canonical CLI commands fail against an older server

Use `nb light pull`, `nb light check`, or `nb light save`. The legacy commands call the historical HTTP resources and
work with servers that predate the `jsTemplate*` aliases. They use the same local workspace metadata and do not need a
source conversion.

### Existing templates or history appear missing

Do not create replacement repositories. Check the `lightExtension*` collections and the associated
`vscFileRepositories` row with `ownerType: "light-extension"`. Confirm that the FlowModel still points to the original
repository and Entry IDs. Renamed tables, a `js-template` VSC owner, or rewritten binding tokens are unsupported states.

### A package builds but its facade cannot be imported

Build the canonical SDK before the legacy SDK facade, then build the legacy plugin implementation before the canonical
plugin facade. Verify the published package with `npm pack --dry-run --json`; source-checkout links and generated local
manifests are not publication evidence.

## Final acceptance matrix

Run server test files one at a time. Set `DB_DIALECT=sqlite` for the focused server suite. If the SQLite driver is
installed outside the workspace, also set `NODE_PATH` to the directory that contains it.

| Boundary | Required acceptance | Automated evidence |
| --- | --- | --- |
| Fresh install | Canonical preset installs one enabled legacy runtime record and creates no JS Template repository implicitly | `packages/presets/nocobase/src/server/__tests__/lightExtensionPreset.runtime.test.ts` |
| Legacy upgrade | Primary key, `enabled`, `installed`, data, VSC history, references, and artifacts remain in place | `packages/presets/nocobase/src/server/__tests__/lightExtensionPreset.runtime.test.ts` |
| Disable and re-enable | Disabled APIs return the legacy 503 error; re-enable restores read, write, resolve, and history access | `packages/presets/nocobase/src/server/__tests__/lightExtensionPreset.runtime.test.ts` and `js-template-api-aliases.integration.test.ts` |
| Legacy rollback | A legacy-only preset discovers the old package; rollback reuses the row and stored workspace | `packages/core/server/src/__tests__/plugin-package-compatibility.test.ts` and the preset runtime test |
| Database and VSC | Physical collections, fields, indexes, relations, owner type, versions, refs, and history remain unchanged | `collections.test.ts` and `js-templates-migration-contract.test.ts` |
| RunJS persistence | Historical source modes, bindings, descriptors, locators, hashes, artifacts, references, ZIP/Git/jobs, and errors round-trip unchanged | `js-template-runjs-compatibility.test.ts` |
| HTTP and ACL | Every canonical resource maps to one legacy handler and grant identity with happy/error/denied parity | `js-template-server-contract.test.ts` and `js-template-api-aliases.integration.test.ts` |
| SDK | Canonical SDK owns the implementation; every legacy root and subpath remains importable with legacy schema tokens | `packages/core/js-template-sdk/src/__tests__` and `packages/core/light-extension-sdk/src/__tests__/facade-contract.test.ts` |
| CLI and generated API | Canonical and legacy commands share handlers, flags, output, exit codes, HTTP compatibility, and help discovery | `packages/core/cli/src/__tests__/command-discovery.test.ts`, `light-extension-commands.test.ts`, and `light-extension-runtime-commands.test.ts` |
| v2 UI and Flow Surfaces | Canonical copy/routes/exports work while historical FlowModels, registry keys, settings, surfaces, and disabled paths remain readable | `js-template-v2-ui-contract.test.ts` and `js-template-runjs-flow-surfaces-integration.test.ts` |
| v1 bridge | The v1 shell points to the v2 page and integration while retaining old routes, exports, ACL, and registry entries | `legacy-client-boundary.test.ts` and `legacy-light-extension-runtime.integration.test.tsx` |
| Build and release | Both plugins and SDKs share one version, build, pack, and remain discoverable and publishable; Docker installs the canonical preset chain | `packages/core/build/src/__tests__/js-template-release-boundary.test.ts` and both package facade tests |

The final local verification runs the matrix above, focused builds for both plugins and SDKs, NocoBase plugin tar
generation, `npm pack --dry-run --json`, and Lerna workspace discovery. It verifies package contents and names without
claiming that a registry publish, Docker daemon build, browser session, or production database upgrade occurred.

## Change control after migration

Future changes may update display copy or preferred TypeScript aliases. They must preserve the persisted and protocol
contracts above. A new serialized token requires a separate migration design with dual-read behavior, retained legacy
writes for rollback, historical fixtures, and explicit upgrade and rollback acceptance before this baseline changes.

This baseline itself creates no database migration and performs no data rewrite.
