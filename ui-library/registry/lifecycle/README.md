# Lifecycle diagram

Install `@nocobase/lifecycle-diagram` with `yes n | pnpm exec shadcn add @nocobase/lifecycle-diagram`. It installs `client/components/lifecycle-diagram.tsx` and its `@nocobase/flow-diagram` dependency. The lifecycle import is type-only; the diagram calls no runtime or HTTP APIs. Read `@nocobase/lifecycle-diagram-demo` for a complete example.

Pass `LifecycleDescription` from `runtime.describe()` or the hook's `description.description`, the current record state and the names of allowed `view.available` entries. Each declared source/destination pair becomes an edge, including self-transitions, multiple destinations and parallel transitions. Current state and available outgoing transitions are highlighted, initial states have pill borders, terminal states have double borders and all transitions use solid edges. The diagram displays possible destinations; availability does not identify which destination a dynamic route will actually choose.

Use `stateLabel` and `transitionLabel` to translate titles by stable names. `renderState` can display initial markers (from `description.initialStates`), state metadata and effect badges. `onStateClick` and `onTransitionClick` receive the full description entries, so the caller can display accepted fields, effects, triggers and success/failure continuations in its details panel. Clicking never fires a transition. Pass `history={view.history.transitions}` for executed paths: edges match the exact transition, source and destination, including retries and parallel paths. `visitedStates` can supplement node highlights but never implies an executed edge. A record's current state does not identify its history. Keep `toMermaid()` for Markdown documentation and export.

States use 160×48 canvas units. For a detailed diagram on a page, pass `direction="DOWN" autoHeight` so the canvas follows the graph instead of shrinking it into a fixed-height panel.

Canvas dimensions, direction, layout errors and translation keys follow [Flow diagram](../components/README.md#flow-diagram). This component adds no locale keys of its own.

Pass a translated `endLabel` (for example, `endLabel={t('diagram.end')}`) to show a separate compact end marker after each explicitly final state. These markers are decorative and never invoke state/transition handlers. A non-final state without outgoing transitions is not treated as an ending.

Highlights use the application `--primary` token: current nodes have a stronger fill and ring, visited nodes a light fill, and executed/available edges an accent stroke. Ordinary edges remain subdued; labels sit directly on their routes. No “visited” text is added to nodes. The same theme tokens adapt to light/dark mode and application theme changes; do not replace them with a diagram-specific palette. Use `transitionLabel` to append `⚙` to automatic transitions when needed, rather than using dashed lines to distinguish them.

## Workflow management

`@nocobase/workflow-management` installs the workflow administration block: one page with Definitions and Executions tabs, definition and execution lists, diagram/parameter cards, and historical execution inspection. It takes application-owned data, labels and callbacks. See [the block contract](workflow-management/README.md) and `@nocobase/workflow-management-demo`; it imports no example plugins and installs no backend.
