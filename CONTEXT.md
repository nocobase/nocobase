# NocoBase Client Routing

How the two client runtimes (legacy and modern) are mounted under the app's URL space, and the terms used to describe their path prefixes. Seeded while making the modern client's URL prefix runtime-configurable.

## Language

**Legacy client**:
The v1 client runtime (`@nocobase/client`, `SchemaComponent`), served at the app root.
_Avoid_: v1 (in user-facing terms), old client

**Modern client**:
The v2 client runtime (`@nocobase/client-v2`, FlowEngine / FlowModel), served under a dedicated URL prefix.
_Avoid_: v2 (in user-facing terms), new client

**App public path**:
The base URL path the whole NocoBase app is mounted under, set by `APP_PUBLIC_PATH` (default `/`).
_Avoid_: base path, root path

**Modern client prefix**:
The single URL path segment, directly under the app public path, where the modern client is served — set by `APP_MODERN_CLIENT_PREFIX` (default `v`, historically the hardcoded `v2`). A segment, not a full path; accepted in any of `v` / `/v` / `/v/` and normalized to a bare segment.
_Avoid_: v2 prefix, route prefix, base url

**Modern client public path**:
The full URL prefix the modern client actually runs under = app public path + modern client prefix (e.g. `/nocobase/` + `v` → `/nocobase/v/`). Used as the React Router basename (minus trailing slash) and injected to the browser as `window.__nocobase_public_path__`.
_Avoid_: v2 public path

**Modern client build directory**:
The fixed on-disk location of the modern client's built assets (`dist/client/v/`), named from `DEFAULT_MODERN_CLIENT_PREFIX`. Internal and never user-facing; intentionally does NOT track the runtime **Modern client prefix**, so the prefix can change at runtime without a rebuild.
_Avoid_: v2 dist, asset directory (without "build")

**CLI app path**:
The root directory of a local app managed by `nb init`, containing the app's CLI metadata, source tree, runtime storage, and related top-level folders.
_Avoid_: project root, source root

**CLI-managed source app**:
A local app created or managed by `nb init` whose source workspace lives under `<app-path>/source/`.
_Avoid_: generic source repo, main monorepo checkout

**User plugin workspace**:
The top-level convenience directory for app-specific plugins in a CLI-managed source-based app, located at `<app-path>/plugins/`.
_Avoid_: packages/plugins, plugins/dev, canonical plugin root

**Source plugin root**:
The plugin directory under `<app-path>/source/packages/plugins/` that existing dev, build, and start flows actually read from.
_Avoid_: mirror only, user-facing plugin folder

**Plugin workspace symlink**:
The symlinked plugin entry created in the **Source plugin root** so a plugin stored in the **User plugin workspace** is visible to the existing source workspace logic.
_Avoid_: canonical plugin source, manual plugin directory

## Relationships

- The **Modern client public path** = **App public path** + **Modern client prefix** + `/`
- The **Legacy client** is served at the **App public path**; the **Modern client** is served at the **Modern client public path** nested inside it
- **App public path** and **Modern client prefix** vary independently; both default such that the modern client lands at `/v/`
- The **User plugin workspace** lives directly under the **CLI app path**
- A **CLI-managed source app** uses the **CLI app path** as its outer directory and the source workspace under `<app-path>/source/`
- The **Source plugin root** belongs to the source workspace and is the directory existing source-based commands consume
- The **Plugin workspace symlink** connects a plugin in the **User plugin workspace** into the **Source plugin root**

## Example dialogue

> **Dev:** "If I deploy under `APP_PUBLIC_PATH=/nocobase/` and set `APP_MODERN_CLIENT_PREFIX=admin`, where does the modern client live?"
> **Maintainer:** "At `/nocobase/admin/`. The prefix is a single segment composed under the app public path — it does not replace it."
> **Dev:** "And the static build output folder?"
> **Maintainer:** "That is a separate concept from the URL prefix — the folder name stays fixed regardless of what the prefix is set to."
>
> **Dev:** "For an app created by `nb init`, where do I create a new plugin?"
> **Maintainer:** "Create it in the **User plugin workspace** at `<app-path>/plugins/`. The existing source-based commands still consume the **Source plugin root** under `source/packages/plugins/`, so the CLI adds a **Plugin workspace symlink** there."
>
> **Dev:** "Should this plugin workspace logic also change the main NocoBase source repository?"
> **Maintainer:** "No. It only applies to a **CLI-managed source app**. A generic source repo keeps the existing `packages/plugins/` model."
>
> **Dev:** "What should I pass to `nb scaffold plugin --cwd`?"
> **Maintainer:** "Prefer the **CLI app path**. Internally the command still resolves the source workspace using the same upward-search behavior as other `nb source` commands."

## Flagged ambiguities

- **"v2"** was overloaded to mean three different things: (a) the **Modern client** runtime, (b) its URL **Modern client prefix**, and (c) the physical build-output directory name. Resolved: the runtime is the *modern client*; the URL segment is the *modern client prefix* (runtime-configurable, default `v`); the *modern client build directory* is a fixed internal constant (`v`), decoupled from the prefix so the prefix can change at runtime without rebuilding (see ADR-0001).
- **"plugins/dev"** was used once to mean the plugin development directory for CLI-managed apps. Resolved: the user-facing term is **User plugin workspace** at `<app-path>/plugins/`; the existing source-consumed directory is the **Source plugin root** at `source/packages/plugins/`.
