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

**Site root**:
The domain root path `/`, which may redirect into the **App public path** when the app is mounted under a sub-path.
_Avoid_: app root, public path

**Modern client prefix**:
The single URL path segment, directly under the app public path, where the modern client is served — set by `APP_MODERN_CLIENT_PREFIX` (default `v`, historically the hardcoded `v2`). A segment, not a full path; accepted in any of `v` / `/v` / `/v/` and normalized to a bare segment.
_Avoid_: v2 prefix, route prefix, base url

**Modern client public path**:
The full URL prefix the modern client actually runs under = app public path + modern client prefix (e.g. `/nocobase/` + `v` → `/nocobase/v/`). Used as the React Router basename (minus trailing slash) and injected to the browser as `window.__nocobase_public_path__`.
_Avoid_: v2 public path

**Modern client build directory**:
The fixed on-disk location of the modern client's built assets (`dist/client/v/`), named from `DEFAULT_MODERN_CLIENT_PREFIX`. Internal and never user-facing; intentionally does NOT track the runtime **Modern client prefix**, so the prefix can change at runtime without a rebuild.
_Avoid_: v2 dist, asset directory (without "build")

**App client entry mode**:
The runtime policy that decides whether the legacy client shell keeps an entry on a given URL, or hands that entry off to the modern client; in production this is primarily enforced by the legacy browser shell, while dev may add targeted shortcuts.
_Avoid_: route mode, bootstrap mode

**Legacy-default**:
An **App client entry mode** where the app root opens the **Legacy client**, while the **Modern client** remains available at its own public path.
_Avoid_: legacy mode, old default

**Modern-default**:
An **App client entry mode** where the app root itself hands off to the **Modern client public path**, while legacy deep links such as `/admin` or `/signin` remain valid.
_Avoid_: hybrid modern-only, redirect-all

**Modern-only**:
An **App client entry mode** where legacy client document entries hand off to the **Modern client public path**; in production this is mainly a browser-side handoff, while dev additionally avoids running the legacy client dev server and redirects non-`/v/` entries into `/v/`.
_Avoid_: compatible modern-only, route-mapped modern-only

**Client document entry request**:
An HTTP request whose job is to load a client HTML entry, not an API, websocket, upload, dist, or plugin-static resource.
_Avoid_: all frontend request, browser request

## Relationships

- The **Modern client public path** = **App public path** + **Modern client prefix** + `/`
- The **Legacy client** is served at the **App public path**; the **Modern client** is served at the **Modern client public path** nested inside it
- **App public path** and **Modern client prefix** vary independently; both default such that the modern client lands at `/v/`
- The **Site root** is not always the **App public path**
- The **App client entry mode** chooses the default entry behavior independently from the concrete route trees owned by the **Legacy client** and the **Modern client**
- A **Legacy client** deep link is not assumed to have a one-to-one **Modern client** deep link
- In production, the **Legacy client** shell is the main place where **App client entry mode** hands off document entries to the **Modern client**
- In dev, only **Modern-only** adds extra runtime handling so the legacy dev server is not started and non-`/v/` entries are redirected into the modern dev entry

## Example dialogue

> **Dev:** "If I deploy under `APP_PUBLIC_PATH=/nocobase/` and set `APP_MODERN_CLIENT_PREFIX=admin`, where does the modern client live?"
> **Maintainer:** "At `/nocobase/admin/`. The prefix is a single segment composed under the app public path — it does not replace it."
> **Dev:** "And the static build output folder?"
> **Maintainer:** "That is a separate concept from the URL prefix — the folder name stays fixed regardless of what the prefix is set to."

## Flagged ambiguities

- **"v2"** was overloaded to mean three different things: (a) the **Modern client** runtime, (b) its URL **Modern client prefix**, and (c) the physical build-output directory name. Resolved: the runtime is the *modern client*; the URL segment is the *modern client prefix* (runtime-configurable, default `v`); the *modern client build directory* is a fixed internal constant (`v`), decoupled from the prefix so the prefix can change at runtime without rebuilding (see ADR-0001).
- **"modern default" vs "modern only"** are not route-equivalent terms. Resolved so far: **Modern-default** only changes the app root entry; because legacy and modern deep links are not one-to-one, it does not imply automatic translation of legacy deep links into modern ones.
- **"/* -> /v/*"** was overloaded between a browser-visible outcome and a service-layer implementation. Resolved: in the current implementation, production primarily relies on the legacy browser shell to hand off document entries into the modern prefix, while dev keeps an additional `modern-only` shortcut.
- **"all / requests"** was ambiguous between every HTTP request and every client entry navigation. Resolved: **App client entry mode** only applies to **Client document entry requests**; API, websocket, upload, dist, and plugin-static requests keep their existing handling.
- **"root"** was ambiguous between the **Site root** `/` and the **App public path**. Resolved: entry-mode decisions apply to the **App public path**; the **Site root** may first redirect into it when the app is mounted under a sub-path.

---

# Workflow Node Extension

How workflow node plugins contribute their config UI and output variables, and how the same node definition serves both the legacy and modern canvases during the migration. Seeded while planning the modern-client canvas migration.

## Language

**Instruction**:
A workflow node type's client-side definition (e.g. `query`, `condition`, `delay`). A class that downstream plugins extend to register a node: it carries the node's static metadata (type, title, group, icon), its config UI, and its variable contributions. One `Instruction` instance per node type, held in the plugin's instruction registry.
_Avoid_: node class, node handler (that's the server concern)

**Config UI**:
The form shown in a node's configuration drawer. Has two forms during migration: the **legacy fieldset** (a Formily schema, rendered by the legacy canvas) and the **modern FieldsetLoader** (a lazy loader of a plain React + antd component, rendered by the modern canvas).
_Avoid_: node form, settings form

**Legacy fieldset** (`fieldset`, lowercase):
The Formily `Record<string, ISchema>` config form an Instruction has always carried. Pure data from the modern client's point of view — the modern canvas never interprets it; only the legacy canvas renders it through `SchemaComponent`.
_Avoid_: schema fieldset

**Modern FieldsetLoader** (`FieldsetLoader`):
A lazy loader — `() => Promise<{ default: ComponentType }>` — an Instruction optionally carries for the modern canvas (same `LoaderOf` shape as workflow trigger loaders). The loaded component is a plain React + antd form (no Formily) that reads/writes `config.*`. Its presence is the per-node migration switch: a node has migrated when it has a `FieldsetLoader`. (Distinguished from the legacy `fieldset` by **field name**, not letter case — see ADR-0003.)
_Avoid_: React fieldset, config component, `Fieldset` (the contract is now a loader)

**Output variables** (`useVariables`):
A hook each Instruction contributes describing the variables that node emits to downstream nodes (e.g. a query node emits the queried record's field tree). The core walks the current node's upstream chain, calls each upstream node's `useVariables`, and assembles the "Node result" branch of the variable tree. The contract keeps returning the legacy `VariableOption` shape during migration; the modern canvas adapts it to `MetaTreeNode` at the aggregation boundary.
_Avoid_: node variables (ambiguous with config-time vs run-time)

**Workflow variable input**:
The shared variable-picker embedded in node config forms, aggregating upstream-node outputs + trigger variables + scope variables + system variables + `$env`. The modern one reuses flow-engine's low-level `VariableHybridInput` (fed a workflow-constructed `MetaTreeNode` tree), not the top-level global `VariableInput` (whose tree is the global `getPropertyMetaTree()`). A downstream node author imports it from the workflow modern client and drops it in like any antd input — it reads the current node from **NodeContext** and the node list / workflow from **FlowContext** itself, so the author never wires context.
_Avoid_: variable selector, variable picker (use consistently if at all)

**FlowContext** (canvas-level):
The React context the modern canvas provides at its root, carrying `{ workflow, nodes, refresh }` — the whole node list, the workflow record, and a refetch callback. Every canvas concern (branch traversal, add/drag/remove, variable aggregation) reads it. Mirrors the legacy canvas's `FlowContext` of the same shape.
_Avoid_: workflow context (collides with flow-engine's own FlowContext — this one is workflow-plugin-local)

**NodeContext** (node-level):
The React context the modern canvas wraps around a single node (card + config drawer), carrying the node object itself (with live `upstream`/`downstream` linked-list refs) — `useNodeContext()` returns that node. Owned/provided by the workflow core; a downstream node author neither imports nor provides it. The **modern FieldsetLoader**'s loaded form renders inside it, and the shared **workflow variable input** consumes it (deriving `upstreams` via `useAvailableUpstreams(node)`). Mirrors the legacy `NodeContext.Provider value={data}` around the legacy `Node`.
_Avoid_: workflow context

## Relationships

- An **Instruction** carries both **Config UI** (legacy fieldset and/or modern FieldsetLoader) and **Output variables**; these are independent extension points, not one schema.
- A node has **migrated to the modern canvas** when it gains a **modern FieldsetLoader**; the **legacy fieldset** may remain so the legacy canvas keeps working until the node is fully cut over.
- The **Instruction** class definition lives in the modern client (`src/client-v2/`); the legacy canvas reaches it via the allowed `v1 → v2` import direction. The legacy Formily *rendering* (SchemaComponent, `Node`, etc.) stays in `src/client/`.
- **FlowContext** (canvas-level) and **NodeContext** (node-level) are two separate contexts mirroring v1, each with its own job; the **modern FieldsetLoader**'s form and the **workflow variable input** derive everything else (`upstreams`, etc.) from these two via hooks rather than receiving a merged context value.

## Flagged ambiguities

- **`fieldset` vs `FieldsetLoader`** — distinguished by **field name**, not letter case (an earlier draft used case-sensitive `fieldset`/`Fieldset`; superseded by ADR-0003). `fieldset` = legacy Formily schema (data, pass-through); `FieldsetLoader` = modern lazy loader of a React form. The `FieldsetLoader`'s presence is the per-node migration switch. (See ADR-0002 as amended by ADR-0003.)
- **Node context shape** — an earlier config-UI draft modeled the per-node context as a single `WorkflowNodeContext` carrying `{ node, workflow, upstreams }`. Resolved during canvas planning: align with v1's two-context split instead — **FlowContext** `{ workflow, nodes, refresh }` at the canvas root + **NodeContext** = the node object at each node. `workflow`/`upstreams` are derived via hooks, not bundled into a node-context value.

---

# Workflow Trigger Extension

How workflow trigger plugins contribute trigger metadata, configuration forms, manual-execution inputs, and trigger variables during the migration.

## Language

**Trigger**:
A workflow trigger type's client-side definition (e.g. `collection`, `schedule`). A class registered by type that carries trigger metadata (title, description, sync mode), configuration UI, manual-execution UI, validation, trigger variables, and block-creation hooks.
_Avoid_: trigger option (too narrow), trigger handler (that's the server concern)

**Trigger config UI**:
The form shown when configuring a workflow's trigger. Has two forms during migration: the **legacy trigger fieldset** (a Formily schema, rendered by legacy surfaces) and the **modern trigger FieldsetLoader** (a lazy loader of a plain React + antd component, rendered by modern surfaces).
_Avoid_: workflow form, trigger settings (ambiguous with workflow metadata)

**Legacy trigger fieldset** (`fieldset`, `presetFieldset`, `triggerFieldset`):
The Formily schema maps a Trigger may carry for its three legacy surfaces: create-time preset config, trigger configuration, and manual execution variables. The modern client never interprets these schemas.
_Avoid_: trigger schema (too broad)

**Modern trigger loaders** (`PresetFieldsetLoader`, `FieldsetLoader`, `TriggerFieldsetLoader`):
Lazy loaders a Trigger may carry for the same three surfaces: create-time preset config, trigger configuration, and manual execution variables. The loaded components are plain React + antd forms and use the same loader naming convention as **Instruction**.
_Avoid_: createConfigFormLoader (retired name)

**Trigger variables**:
Variables contributed by the workflow's trigger under `$context` (for example schedule trigger time or trigger data). During migration the hook remains named `useVariables` and returns `VariableOption`; the modern variable aggregator adapts it to `MetaTreeNode`.
_Avoid_: context variables (too broad)

## Relationships

- A **Trigger** carries both legacy fieldsets and modern trigger loaders; each surface can migrate independently.
- The Trigger contract lives in the modern client, and the legacy client may import or extend it through the allowed `v1 -> v2` direction.
- On legacy surfaces, a non-empty legacy trigger fieldset wins. When that fieldset is absent and the matching modern trigger loader exists, the legacy surface opens the modern implementation.
- The modern client never imports legacy trigger files or legacy Formily rendering.

## Flagged ambiguities

- **`createConfigFormLoader` vs `PresetFieldsetLoader`** — `createConfigFormLoader` was an early v2 registry option name. The trigger API now aligns with Instruction naming: `PresetFieldsetLoader` is the create-time trigger preset loader.

---

# Workflow Canvas

The node-graph editor where a workflow's nodes are laid out, connected, added, removed, dragged, and configured. There are two parallel implementations during migration; this section names them and their shared substrate. Seeded while planning the canvas migration to client-v2.

## Language

**Legacy canvas**:
The v1 node-graph editor (`src/client/`: `WorkflowCanvas`, `CanvasContent`, `Branch`, `Node`), reached at `/admin/settings/workflow/workflows/:id` from the legacy settings list. Hand-rolled DOM + flexbox recursive render (no graph library); its config drawer / add-node menu / remove-branch modal are Formily.
_Avoid_: v1 canvas (in prose), old editor

**Modern canvas**:
The client-v2 node-graph editor (`src/client-v2/`), reached at `/admin/workflow/workflows/:id` from the **WorkflowPane** list. Renders the same node tree without Formily.
_Avoid_: v2 canvas (in prose), new editor

**Parallel-worlds coexistence**:
The two canvases are independent destinations over the *same* `workflows` + `flow_nodes` data, distinguished only by URL/entry list — not by any per-workflow flag. A workflow opens in whichever canvas its URL belongs to. The legacy canvas retires by deleting the legacy settings list + route once the modern canvas reaches parity.
_Avoid_: canvas toggle, canvas feature flag (there is none)

**Runtime separation**:
The legacy client runs at `/` and loads only each plugin's `client` entry; the modern client runs at `/v/` and loads only each plugin's `client-v2` entry. They never coexist in one browser runtime, so each has its own `app`/PluginManager and its own `'workflow'` plugin instance. Relocating code to client-v2 is *build-time* source sharing (bundled into v1's own output); it is orthogonal to this *runtime* separation.
_Avoid_: shared runtime, single app instance (there are two, one per client)

**Instruction registry (per-runtime)**:
Each runtime's `'workflow'` plugin holds its own instruction registry, self-populated by node plugins' entries for that runtime (`registerInstruction` from `client` fills v1's; from `client-v2` fills v2's) — mirroring the existing v2 trigger registry. The modern canvas reads only its own v2 registry (`plugin.getInstruction(type)`); a type registered only in v1 is omitted from the v2 add-node menu and renders a placeholder card if already present in a workflow.
_Avoid_: shared registry, cross-runtime instruction read (there is none)

**Node tree**:
The in-memory doubly-linked structure the canvas renders, built from the flat `flow_nodes` list by `linkNodes()` (sets live `upstream`/`downstream` refs). A branch is a node with `branchIndex != null` under a branching node (its `upstreamId`). Pure data — no Formily — so it ports verbatim to the modern canvas.
_Avoid_: node graph (reserve for the rendered view), node list (that's the flat form)

**Block-creation menu item** (`getCreateModelMenuItem`):
The Instruction method that lets a node's output be added as a *data block* inside a config drawer ("create block → node data → query data"). The v2-native counterpart of v1's `useInitializers`: same intent, but it returns a FlowModel `SubModelItem` (fed to the v2 sub-model menu, e.g. `NodeDetailsModel`) instead of a Formily `SchemaInitializerItemType`. It already exists in v2 — node authors do not migrate it, they keep both during transition.
_Avoid_: initializer (that's the v1 term `useInitializers`)

## Relationships

- The **Legacy canvas** and **Modern canvas** are **Parallel-worlds coexistence** over one dataset; neither is the other's parent, and there is no runtime flip between them.
- A **Modern canvas** renders the same **Node tree** as the legacy one; when it opens a node, that node's **Config UI** is chosen by the per-node `fieldset`/`FieldsetLoader` switch (see Workflow Node Extension) — so the *page-level* canvas choice and the *per-node* config-UI choice are independent axes.
- **Two nested layers, two paradigms**: the **Modern canvas** shell (cards, lines, branches, drag) is React context (FlowContext/NodeContext), *not* FlowModel; but a *data block created inside a node's config drawer* is a genuine FlowModel sub-model. The **Block-creation menu item** is the bridge — it runs on the (shared) Instruction, reads the canvas-layer `{ node, workflow }`, and emits a FlowModel-layer `SubModelItem`. The two layers stay decoupled: canvas context reaches the block model only via its `inputArgs`.

## Flagged ambiguities

- **"canvas switch" is two different axes** — (1) *which canvas* (page-level, = URL/entry list, no flag) and (2) *which config UI a node uses inside the modern canvas* (per-node, = `FieldsetLoader` presence). They compose; they are not the same switch.

**Unmigrated-node placeholder**:
In the modern canvas, a node whose Instruction still has only `fieldset` (no `FieldsetLoader`) renders its card normally (topology is intact) but its config drawer shows a placeholder ("config UI not yet migrated"), not a Formily form. This keeps the modern canvas shippable before any config UI migrates — the two axes stay orthogonal. Rendering Formily as a fallback is forbidden (would drag the Formily runtime into client-v2).
_Avoid_: fallback form, legacy drawer (the modern canvas never renders `fieldset`)
