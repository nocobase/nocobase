# JS templates migration compatibility baseline

## Decision

`JS templates` is the canonical English product and UI name. `JS 模板` is the canonical Simplified Chinese name.

`light-extension` remains the legacy technical identity. Existing stored values and public contracts can be present in
databases, saved FlowModels, source repositories, CLI workspaces, deployed clients, and downstream packages. Product
copy changes must not rename or rewrite those values.

The executable baseline is declared by `LIGHT_EXTENSION_LEGACY_PERSISTENCE_CONTRACT` and
`LIGHT_EXTENSION_LEGACY_PROTOCOL_CONTRACT` in `src/constants.ts`. Contract tests intentionally compare those manifests
with literal expected values and with the current database, RunJS, CLI, SDK, runtime, resource, and ACL surfaces.

## Canonical persisted values

The following legacy values remain canonical for persistence. New JS templates UI and APIs must continue writing them:

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

The following contracts remain supported. Canonical JS templates names may be added later as aliases, but must not
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

## Scope of later migration goals

Later goals may change display names, translated copy, menus, internal TypeScript symbols, and preferred aliases. They
must preserve the persisted and protocol contracts above. If a later change needs a new serialized token, it must use
dual-read behavior, retain legacy writes for rollback, and include upgrade fixtures before changing this baseline.

This baseline itself creates no database migration and performs no data rewrite.
