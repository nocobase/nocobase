# Lifecycle UI

Use this reference for management pages built around `@nocobase/lifecycle`. Read [record lifecycles](lifecycle.md) for runtime integration, [configurable parameters](lifecycle-parameters.md) for storage and snapshot/live semantics, and the [frontend workflow](frontend/ui-workflow.md) for UI implementation. Whenever application requirements include a process to develop, deliver its workflow management pages by default, even if the user mentions only business operations. Extend existing management pages when present. Follow the scope exceptions in [system administration](system-administration.md#default-delivery); these defaults do not add a console to API-only work or explicitly excluded UI.

## Default management structure

Use the UI Library `workflow-management` block as the default starting point; it extracts the existing workflow example's layout and interactions. Adapt its business labels, data sources and supported operations to the application; do not require its example plugins as production dependencies. The sidebar has one clickable entry, System management → Workflow management. Its landing page has one Workflow management header and in-page Definitions and Executions tabs; these are two views of the same management page, not separate sidebar entries or a sidebar submenu. Definitions lead to full detail pages with a process diagram and visible parameter settings beside it; executions lead to full detail pages with a diagram, transition history, effect status and recorded parameter information. Include implemented workflows even when there is only one. Show an explicit empty state for definitions without adjustable parameters and for workflows without executions; add category management when classification is useful.

Create the System management group if it is missing, or reuse the application's existing Settings group. Place Workflow management directly under that group, alongside User management, Roles and permissions, Background tasks and other applicable administration entries. Keep workflow execution inspection inside Workflow management; do not add an intermediate Operational monitoring group. Deliver real catalog and execution data, initial administrator grants and working page/API authorization alongside the process. Follow [system administration](system-administration.md) for the complete application's administration baseline and authenticated acceptance checks. Workflow configuration stays separate from business submit, approve and fulfil pages, and does not imply a visual workflow designer.

## Install and connect the block

Check `client/extensions/nocobase-workflow-management/` for an installed copy first. If missing, read `@nocobase/workflow-management-demo` with `pnpm exec shadcn view @nocobase/workflow-management-demo`, then install with `yes n | pnpm exec shadcn add @nocobase/workflow-management`. Follow the [UI Library installation guidance](frontend/references/styling.md#3-use-shadcn) for dependency placement. Read the installed README for component props and route integration. The block supplies source files; it registers no route, server service, database or permission.

Use `WorkflowManagementLayout` for the shared header and URL-controlled tabs, `WorkflowDefinitionList` and `WorkflowExecutionList` for lists, `WorkflowDefinitionDetail` for diagram/parameter cards, and `WorkflowExecutionDetail` for the diagram/history/effects composition. Pass translated labels, adapted display rows with application router links, category/search controls, loading/error/empty content and controlled callbacks. The application owns API requests, URL query state, IME-aware search, server pagination, category CRUD, breadcrumbs and authorization. Keep parameter schemas, complete-group persistence, CAS conflict handling and effective timing in the application's editor, inserted into the definition detail's parameter slot.

Render the preinstalled `LifecycleDiagram` through the diagram slot/callback by default. Preserve its standard React Flow + ELK visual language unless the user explicitly requests a different diagram style; an existing Mermaid renderer is not a compatible default. If neither is installed, add the diagram with `yes n | pnpm exec shadcn add @nocobase/lifecycle-diagram`; the block accepts a caller-supplied diagram. `WorkflowExecutionDetail` supplies the selected history prefix and resulting state to `renderDiagram`; selection is display-only. Keep recorded parameters separate from current settings and pass their display through the parameter slot. Do not add business actions or recovery requests to history selection. Remount the detail on record changes or explicit refresh to clear historical selection, following the example adapter.

## Navigation and ownership

Separate business work (submit, approve, fulfil) from administration (definitions, categories, parameters, executions). Place the single Workflow management entry under the existing System management or Settings group; definitions, categories, parameters and executions are views or controls within it. Use separate read and update permissions. Configuration permission does not grant business approval permission. Use the real authenticated identity rather than demonstration identity switchers.

Within the workflow route subtree, declare `navigation` only on the Workflow management route. Implement Definitions and Executions as URL-backed child routes without `navigation`; their breadcrumb declarations do not make them sidebar entries. Render the child list through `Outlet` beneath the shared page header and line-style Tabs, using the URL to select the active tab and navigating on tab changes. Redirect the parent to its default accessible child. The example uses `/workflows`, `/workflows/definitions` and `/workflows/executions`; adapt the route prefix to the application. Preserve direct links, reloads and browser back/forward behavior. Keep the single Workflow management sidebar item active across both tabs and their detail pages. Give diagram-heavy details full child pages through Outlet; suppress the parent's list header, filters and tabs while a detail is open. Use the shell breadcrumb trail: System management → Workflow management → Definitions or Executions → current item. Preserve the list's query parameters in its breadcrumb instead of adding a competing Back link.

## Definition catalog

When classification is useful, place a category rail beside a compact table, with search and refresh above the main column. Collapse or reposition the rail on narrow screens. Lead rows with translated business titles; show technical keys below in muted text only when useful. Put execution activity in a right-aligned column: a count linking to filtered executions and a subdued latest-execution time, or an explicit never-executed state. Expose sort direction with aria-sort; sort on the client only when all results are loaded.

Keep category creation, rename, color and deletion beside the filter. Use restrained palette colors with text labels and provide keyboard reorder actions alongside dragging. Deleting the active category clears its filter and reloads affected data. Categories classify definitions without changing workflow structure.

Search business titles and supported technical names on the server. Keep a local input draft and submit on Enter outside IME composition, preserving the caret. Store applied search and category in the URL. Distinguish an empty catalog, unmatched filters, loading and errors with retry.

## Execution list

Show workflow name, business record identity, current node/status and relevant timestamps, linking to detail. Definition activity links apply an exact workflow filter; display its label and a clear action. Use server pagination with a total, search before pagination and deterministic ordering. Reset the page when filters change; deliberately clear an exact workflow filter if a new text search supersedes it.

Keep search, workflow filter, ordering and page in query parameters, preserving them through detail and return navigation. Translate business node/state names and disable refresh while loading.

## Definition detail

Use one PageHeader with the business title, compact category assignment and execution-count link, followed by a short business description. When categories are enabled, let administrators with update permission change or clear the assignment from the colored tag beside the title; read-only administrators see the tag without an edit control. Keep assignment and category CRUD in application adapters, following the installable demo. Category action menus use concise Edit and Delete labels. Avoid repeated titles and demonstration hints.

Place the diagram and Parameter settings in two columns on wide screens, stacking on smaller screens. Use min-w-0 children, a consistent gap and items-start so cards size independently. Give each card a heading and keep wide tables or structured values scrollable within it.

Prefer a visible parameter form beside the diagram. Group fields by business state or transition; render shared fields once in a deterministic section, with unbound fields under a workflow-level section. Visual regrouping must preserve configuration group identities, complete-group saves and revisions. Show an explicit empty state when there are no parameters.

Provide contextual controls for declared, authorized bindings by default, sharing the same editor and save contract. Do not make tiny gear icons the only way to discover settings. Inspection and editing clicks never execute transitions.

## Diagram sizing and visual language

React Flow needs a definite sized ancestor; min-height alone inside unconstrained flex parents may collapse or oversize the canvas. Choose autoHeight for content-sized diagrams or a bounded canvas with pan/zoom and refitting after layout or container resizing. The examples use a 720px definition canvas and matching execution minimum; adapt this to the graph and viewport rather than prescribing it universally.

Fit the full graph, including outer edge routes and labels. Prefer top-to-bottom direction for tall details, readable spacing, subdued ordinary edges and labels on their routes. Give the current node a strong marker and actual history lighter highlights, retaining the diagram's textual status and icons. Keep current state, visited path and available actions distinct; infer no traversed edge from reachable states or endpoints alone. Use the shared theme tokens and translated accessible labels.

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

Follow [diagram integration](lifecycle.md#draw-an-interactive-lifecycle-diagram) for props and demos. Example ProcessDiagram remains an application adapter, not a dependency or platform-wide API of the block. Installing Registry source does not register a runtime or backend service.

Keep fetching, authorization, mutations, catalog aggregation and parameter storage in the application. Use the workflow-management block's existing props and composition slots before creating another abstraction. Keep additional business-specific rendering in the application.

## Source examples and verification

In a NocoBase source checkout, inspect `packages/templates/app-template-examples/client/routes.ts` for the management hierarchy, `packages/templates/app-template-examples/client/pages/workflows/index.tsx` for the shared header, URL-backed tabs and detail-mode Outlet, and the other files in that directory for list/detail page composition. Inspect `client/hooks/use-url-search.ts` in that template for Enter-submitted search with IME handling. Its `server/providers/workflow-management.ts` and `server/routes/workflows.ts` illustrate permissions and aggregation. These private paths are not package exports and may not exist in a generated application. Example plugin components are optional references, not required dependencies.

Verify that an authenticated administrator can discover Workflow management and inspect the implemented definitions and executions, and that ordinary users cannot access restricted pages or APIs. Verify that the sidebar contains exactly one Workflow management entry and no Definitions or Executions entries, that both in-page tabs select the correct URL and content, and that reloads and browser back/forward preserve the selected view. Verify direct detail URLs, filter-preserving return navigation, read-only access, empty/error/retry states and keyboard controls. Prove historical selection changes only the display. Check long labels, dense history, graph fitting after resizing and narrow screens in a browser; run checks scoped to changed packages and consumers.

## Default diagram and configuration contract

Current Default and Examples templates preinstall `#components/lifecycle-diagram`, `#components/flow-diagram` and the workflow-management block source. Check those local files first; bind real data rather than selecting a new graph library. A bare template still has no workflow menu or business registration. A requested visual customization normally adjusts the same React Flow component; it does not imply permission to replace the renderer or remove configuration/history behavior. When upgrading an existing application, reconcile the template source through the upgrade Skill; do not overwrite a customized graph or editor wholesale. An explicit user request to retain or customize a visual takes precedence; otherwise bring a legacy Mermaid management view onto the standard component while preserving its business data and routes.

For older templates missing a component, use `pnpm exec shadcn view @nocobase/lifecycle-diagram-demo` and `yes n | pnpm exec shadcn add @nocobase/lifecycle-diagram`. These names identify **shadcn UI Registry items**, not npm packages: `npm view` or `pnpm view` returning 404 says nothing about their availability. Check `components.json` and the configured registry URL. Report an actual shadcn/registry failure with the command and error; do not silently substitute Mermaid, an image, a raw SVG or a custom canvas. Keep Mermaid for documentation/export only.

Use `LifecycleDiagram.configuration` to derive contextual controls from `description.parameterConfiguration.groups[*].fields[*].bindings`. Supply translated `label(target)`, an explicit `canConfigure(group, fieldKey, field)` based on real read/update permissions, and `onConfigure(selection)` opening the authoritative parameter editor. The callback receives the exact state/transition and permitted bound fields grouped by native key; it never executes a transition. A state gets a button for its own bindings and declared policies on its outgoing transitions. A single outgoing policy opens that transition's editor directly; several targets use a compact chooser. Existing state controls stay direct, with additional transition choices beside them. The selection retains the exact native target and fields; no binding or parameter is invented. Bound edges still open the same editor on selection. Unbound/denied elements retain inspection, and record-history diagrams normally omit this adapter. Keep `stateActions` for additional business-specific controls. If the editor is contextual only, omit `WorkflowDefinitionDetail.parameters` for a full-width diagram; the existing parameter slot remains available for the same editor beside the canvas.

```tsx
<LifecycleDiagram
  description={definition.description}
  ariaLabel={t('processes.definition')}
  stateLabel={(state) => t(`expenses.states.${state.name}`)}
  transitionLabel={(transition) => t(`expenses.transitions.${transition.name}`)}
  configuration={{
    label: () => t('processes.configure'),
    canConfigure: (group, key) =>
      permissions.canUpdateParameter(group.key, key),
    onConfigure: (selection) => openParameterEditor(selection),
  }}
/>
```

`permissions` and `openParameterEditor` above are application-owned adapters, not framework exports. Implement them against the installed authenticated parameter service/editor. Preserve fields outside the selected binding when saving a complete group; fetch the authorized save context and revision rather than sending the filtered selection as a replacement. If partial group editing cannot preserve restricted fields safely, require group update permission and expose no edit control until the server supports it. Handle validation errors and revision conflicts without discarding drafts; read the saved version back and refresh the current policy summary. Use the field's native `number`, `boolean`, `string`, `reviewers` or declared object schema with appropriate business controls, not a JSON textarea for approver identities. Configuration updates require independent server authorization and audit.

On every process-building iteration, identify administrator-owned business policy: approval thresholds and reviewer selection are typical defaults, even if the request never says configurable. Declare their native parameter metadata, meaningful state/transition bindings, validation, permissions, storage and actual runtime consumers together. Use existing organization relationships for direct supervisors. When reviewer resolution is owned by member profiles or role membership rather than workflow parameters, expose an authorized, translated `stateActions` link/button on the corresponding approval node to open those authoritative settings. Check the destination's read/update permissions; hide mutation entries from read-only and history views. Reuse that editor and service, explain when changes affect new versus existing records/tasks, and preserve return navigation. Do not invent a duplicate workflow parameter merely to get a configuration button. Do not add fake editable fields for secrets, topology, unsupported timing or code-only constants. Preserve snapshot/live timing and historical task candidates as [parameter configuration](lifecycle-parameters.md) defines.

## Acceptance against the original requirement

A design approval does not prove component availability or authorize a fallback based on an npm 404. Reviewers must compare the implementation to this default contract and the user's original requirements, not just the amended design. Inspect actual rendered component imports, the canvas and the bound editor. Business tests alone do not establish standard component reuse.

For release acceptance, start a clean published-template app and use only business prompts (no hints to use React Flow, system settings or configurable nodes). Verify Home-only before business work; then the single management entry, definition directory even for one process, standard graph, authorized bound controls and execution history. Save a threshold/reviewer through a node's editor (or its authoritative organization-settings entry), reload it, submit a new record and verify the actual branch/candidate change. Verify organization-derived reviewer nodes link to the real profile/role editor, not just a descriptive label or a second identity store. Check an earlier submitted record retains its snapshot, a read-only user has no mutation controls, and direct unauthorized API writes fail. Check light/dark, narrow layouts and long labels. Record any untested browser or Agent-generation behavior explicitly; never call it passed on static imports alone.
