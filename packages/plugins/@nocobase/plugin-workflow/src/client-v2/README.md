# plugin-workflow `client-v2`

The v2 (FlowEngine / `@nocobase/client-v2`) client runtime for the workflow plugin. See `docs/adr/0003-workflow-canvas-progressive-migration.md` for the migration design.

> **Iron rule:** code under `client-v2/` must never import a **value** from `@nocobase/client` or `@formily/*`. `import type` from `@formily/*` is allowed (erased at build). The three Formily-load-bearing v1 spots (config drawer, add-node flow, test-run modal) are **rebuilt natively** here, never ported.

## Directory layout

- **`canvas/`** — everything tied to the node-graph canvas: the `Node` / `Branch` cards, drag / clipboard / add-node / remove-node contexts, the node config drawer, the in-canvas pure logic (`nodeTree`, `collectionFieldOptions`, `dropImpact`, the variable aggregator), and the shared `Instruction` base class. If it only makes sense on the canvas, it lives here.
- **`nodes/`** — one file per core node type (`condition.tsx`, `calculation.tsx`, …), each `default`-exporting its `Instruction` class, mirroring v1's `client/nodes/` layout. The plugin registers them in `plugin.tsx`.
- **`components/`** — reusable pieces that are **neither canvas-specific nor tied to a single node**: e.g. `TestRunButton`, `Calculation` (condition builder), `RadioWithTooltip`, `renderEngineReference`, the execution status tags / dropdowns. A node's config form may compose these, but they don't depend on the canvas or on one node type.
- **`triggers/`** — per-trigger create-config forms (collection / schedule).
- **`pages/`** — route-level pages (workflow list pane, canvas page, execution view, drawers).
- **`models/`** — FlowModel definitions (node details blocks, task cards).

Rule of thumb when adding a file: **canvas-related → `canvas/`; a node's own definition → `nodes/`; otherwise a reusable widget → `components/`.**
