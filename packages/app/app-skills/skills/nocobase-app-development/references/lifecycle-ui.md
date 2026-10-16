# Lifecycle UI

Use this reference for management pages built around `@nocobase/lifecycle`. Read [record lifecycles](lifecycle.md) for runtime integration, [configurable parameters](lifecycle-parameters.md) for storage and snapshot/live semantics, and the [frontend workflow](frontend/ui-workflow.md) for UI implementation. Add only the surfaces the requested feature needs; API-only work needs no management console.

## Navigation and ownership

Separate business work (submit, approve, fulfil) from administration (definitions, categories, parameters, executions). Place administration under the existing System management or Settings group, with separate read and update permissions. Configuration permission does not grant business approval permission. Use the real authenticated identity rather than demonstration identity switchers.

Use URL-backed Definitions and Executions child routes, redirecting the parent to its default accessible child. Give diagram-heavy details full child pages through Outlet; suppress the parent's list header, filters and tabs while a detail is open. Use the shell breadcrumb trail: System management → Workflow management → Definitions or Executions → current item. Preserve the list's query parameters in its breadcrumb instead of adding a competing Back link.

## Definition catalog

When classification is useful, place a category rail beside a compact table, with search and refresh above the main column. Collapse or reposition the rail on narrow screens. Lead rows with translated business titles; show technical keys below in muted text only when useful. Put execution activity in a right-aligned column: a count linking to filtered executions and a subdued latest-execution time, or an explicit never-executed state. Expose sort direction with aria-sort; sort on the client only when all results are loaded.

Keep category creation, rename, color and deletion beside the filter. Use restrained palette colors with text labels and provide keyboard reorder actions alongside dragging. Deleting the active category clears its filter and reloads affected data. Categories classify definitions without changing workflow structure.

Search business titles and supported technical names on the server. Keep a local input draft and submit on Enter outside IME composition, preserving the caret. Store applied search and category in the URL. Distinguish an empty catalog, unmatched filters, loading and errors with retry.

## Execution list

Show workflow name, business record identity, current node/status and relevant timestamps, linking to detail. Definition activity links apply an exact workflow filter; display its label and a clear action. Use server pagination with a total, search before pagination and deterministic ordering. Reset the page when filters change; deliberately clear an exact workflow filter if a new text search supersedes it.

Keep search, workflow filter, ordering and page in query parameters, preserving them through detail and return navigation. Translate business node/state names and disable refresh while loading.

## Definition detail

Use one PageHeader with the business title, compact category assignment and execution-count link, followed by a short business description. Avoid repeated titles and demonstration hints.

Place the diagram and Parameter settings in two columns on wide screens, stacking on smaller screens. Use min-w-0 children, a consistent gap and items-start so cards size independently. Give each card a heading and keep wide tables or structured values scrollable within it.

Prefer a visible parameter form beside the diagram. Group fields by business state or transition; render shared fields once in a deterministic section, with unbound fields under a workflow-level section. Visual regrouping must preserve configuration group identities, complete-group saves and revisions. Show an explicit empty state when there are no parameters.

Diagram-bound dialogs are optional contextual entries, sharing the same editor and save contract. Do not make tiny gear icons the only way to discover settings. Inspection and editing clicks never execute transitions.

## Diagram sizing and visual language

React Flow needs a definite sized ancestor; min-height alone inside unconstrained flex parents may collapse or oversize the canvas. Choose autoHeight for content-sized diagrams or a bounded canvas with pan/zoom and refitting after layout or container resizing. The examples use a 720px definition canvas and matching execution minimum; adapt this to the graph and viewport rather than prescribing it universally.

Fit the full graph, including outer edge routes and labels. Prefer top-to-bottom direction for tall details, readable spacing, subdued ordinary edges and labels on their routes. Give the current node a strong marker and actual history lighter highlights. Keep current state, visited path and available actions distinct; infer no traversed edge from reachable states or endpoints alone. Use the shared theme tokens and translated accessible labels.

## Execution detail

Identify workflow and business record in the title with a compact, labeled refresh action. Place a large diagram card beside a stack of History, Effects and recorded parameter information; stack on narrow screens. items-stretch can align the diagram with a taller history column when the canvas has a supported height.

Order transitions by authoritative sequence with stable tie-breakers. Show step, transition, source, destination, actor and time. Use step buttons with aria-pressed and visible selection. Selecting a step displays only the history prefix through that step and its resulting state. Label the historical view and provide a return to the latest state. Refresh diagram and history coherently.

Show effect status, attempts and errors separately: a completed transition and a failed effect are different facts. Distinguish historical snapshots/usage from current configuration, showing Not recorded for missing historical facts. Never fill gaps with today's settings or edit recorded snapshots. Prefer business labels and units; reserve JSON for diagnostics.

## Parameter form behavior

Use business labels, units, validation and effective timing. Distinguish drafts, saved values and effective values. Follow [parameter consistency rules](lifecycle-parameters.md#snapshot-live-and-execution-consistency) for snapshot/live timing and existing task candidates rather than inventing UI-specific semantics.

Preserve drafts on revision conflicts and incidental refreshes; require a deliberate reload/retry or confirmation before discarding them. Read-only administrators see configured values without active save controls. Use the runtime's complete-group validation and concurrency contract even when the page visually regroups fields.

## Component reuse

Check installed source first, then inspect missing items through the [UI Library catalog](frontend/references/ui-library.md) and [installation guidance](frontend/references/styling.md#3-use-shadcn).

| Need                     | Reuse                                                        |
| ------------------------ | ------------------------------------------------------------ |
| Page spacing and heading | `@nocobase/page-container`, `@nocobase/page-header`          |
| Lifecycle graph          | `@nocobase/lifecycle-diagram`                                |
| Other directed graphs    | `@nocobase/flow-diagram`                                     |
| Sections and controls    | Existing shadcn Card, Table, Tabs, Empty, Button and Tooltip |
| Parameters               | Installed runtime's editor, or an application-owned form     |

Follow [diagram integration](lifecycle.md#draw-an-interactive-lifecycle-diagram) for props and demos. Example ProcessDiagram is a wrapper, not a platform-wide API. Installing Registry source does not register a runtime or backend service.

Keep fetching, authorization, mutations, catalog aggregation and parameter storage in the application. Extract a Registry block only when independent consumers share a stable composition contract; accept data, translated labels, navigation and callbacks. A grid wrapper alone rarely warrants another component.

## Source examples and verification

In a NocoBase source checkout, inspect `packages/templates/app-template-examples/client/pages/workflows/` for page composition and `client/hooks/use-url-search.ts` in that template for Enter-submitted search with IME handling. Its `server/providers/workflow-management.ts` and `server/routes/workflows.ts` illustrate permissions and aggregation. These private paths are not package exports and may not exist in a generated application. Example plugin components are optional references, not required dependencies.

Verify direct detail URLs, filter-preserving return navigation, read-only access, empty/error/retry states and keyboard controls. Prove historical selection changes only the display. Check long labels, dense history, graph fitting after resizing and narrow screens in a browser; run checks scoped to changed packages and consumers.
