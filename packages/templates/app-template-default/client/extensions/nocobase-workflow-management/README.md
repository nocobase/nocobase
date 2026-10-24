# Workflow management

Install with `yes n | pnpm exec shadcn add @nocobase/workflow-management`. This block provides the workflow example's administration layout and interactions as presentational parts in `client/extensions/nocobase-workflow-management/`. Read `@nocobase/workflow-management-demo` for a standalone composition. Every label and formatted value is supplied by the caller; the block imports no example plugin, API client, authorization provider or router.

| File                   | Exports and responsibility                                                                                                                                                         |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `layout.tsx`           | `WorkflowManagementLayout`: page container, shared header and line-style tabs, hidden in detail mode. `WorkflowDefinitionDetail`: diagram and parameter form cards in two columns. |
| `definition-list.tsx`  | `WorkflowDefinitionList`: optional category rail, search slot, refresh and execution-activity sort controls, adapted definition rows and empty/status content.                     |
| `execution-list.tsx`   | `WorkflowExecutionList`: filters slot, refresh, controlled ordering, adapted execution rows, empty/status content and controlled pagination.                                       |
| `execution-detail.tsx` | `WorkflowExecutionDetail`: ordered history, step selection, diagram rendering callback, effects and optional recorded-parameter content.                                           |

## Routes and ownership

Register one clickable Workflow management entry directly under the application's System management or Settings group. Declare `navigation` only on that parent within the workflow route subtree. Use `definitions` and `executions` child routes without `navigation`, with deeper definition/execution detail routes. Set `tab` from the URL and navigate in `onTabChange`; redirect the parent to its default accessible child. Render the application's `Outlet` inside `WorkflowManagementLayout` and set `detail` while a detail route is active, so details replace the list header and tabs while the same sidebar entry stays active. Retain breadcrumb links with the list's query parameters for returning to the list.

For example, keep the tab routes out of sidebar navigation while retaining direct URLs (the application supplies these page modules and registers the matching settings permission on the server):

```tsx
import { defineAppRoutes } from '@nocobase/app-client/plugins';

const routes = defineAppRoutes([
  {
    name: 'systemManagement',
    navigation: { title: 'navigation.systemManagement' },
    children: [
      {
        name: 'workflows',
        path: '/workflows',
        auth: 'required',
        authz: {
          resource: { type: 'settings', id: 'workflow-management' },
          action: 'read',
        },
        navigation: { title: 'navigation.workflows' },
        componentLoader: () => import('./pages/workflows/index.js'),
        children: [
          {
            name: 'workflowDefinitions',
            path: 'definitions',
            componentLoader: () => import('./pages/workflows/definitions.js'),
          },
          {
            name: 'workflowExecutions',
            path: 'executions',
            componentLoader: () => import('./pages/workflows/executions.js'),
          },
        ],
      },
    ],
  },
]);
```

Add definition and execution detail routes beneath the corresponding tab route, also without `navigation`. The parent page maps the URL to `tab`, navigates in `onTabChange`, and supplies its `Outlet` as children. Reuse an existing system group instead of registering another one.

Keep requests, query parameters, IME-aware search, filtering, pagination, category CRUD and permissions in application adapters. Map rows into display values and router links before passing them to the lists. `loaded` distinguishes an empty response from data that has not arrived; `loading` disables refresh, and the caller disables pagination while pending. Supply error/loading/retry content through `status`, and separate empty-catalog and no-results wording through `empty`. The search slot is constrained beside Refresh on wider screens; the category rail stacks above the list on small screens. Omit `categories` when classification is unnecessary. The installable demo provides in-memory category filtering, named color selection and add/edit/delete dialogs as an application adapter; deleting a category preserves its workflows and clears the selected category filter. Its definition header also demonstrates a colored category dropdown with an Uncategorized option; assignment uses the same category state as list filtering. The production adapter keeps the assignment API and read/update permission checks in the application.

`WorkflowDefinitionDetail` accepts a diagram slot and a parameter form slot. Render the installed `@nocobase/lifecycle-diagram` or an existing compatible diagram in a definite-height or content-sized canvas. Keep schema validation, effective timing, complete-group saves, CAS conflicts and read-only permissions in the application's parameter editor. Show a translated empty state when a definition declares no adjustable parameters.

`WorkflowExecutionDetail` sorts transitions by version, timestamp and id without mutating the input. Selecting a step passes only that history prefix and its destination state to `renderDiagram`; no transition or server action occurs. Pass the runtime's transition records directly, retaining extra fields through its generic history type. `effects` displays persisted statuses, attempts and failures; it does not retry them. Pass recorded parameter content through `parameters` and label historical facts separately from current configuration. Remount the detail on record changes or an explicit refresh to reset historical selection, as the example application does.

The application owns authentication, initial administrator grants, navigation and direct-page guards, server read/update authorization and any recovery actions. Configuration permission does not grant business approval permission. Installing this block creates source files, not routes, permissions, runtime services or database collections.

## Standard diagram and contextual configuration

Current application templates already contain these parts and the standard React Flow/ELK components. Reuse the installed `LifecycleDiagram`; the installable demo opts into `presentation="process"` for compact boundary pills and work cards in both definitions and executions. Supply application-owned `stateKind` semantics and keep configuration and history callbacks intact. Omit `presentation` to retain the classic visuals. UI Library entries are shadcn registry source, not npm packages; use `shadcn view/add`, never an npm 404 as a fallback decision.

Connect `LifecycleDiagram.configuration` to the application's existing authorized parameter editor. Native `parameterConfiguration` bindings supply the exact state/transition fields; the component automatically renders bound state controls and sends bound transition selections to `onConfigure`. `canConfigure` is mandatory and controls the affordance only, never server security. The application editor reads current values/revision, preserves other group fields, validates and saves the complete authorized group with CAS, and refreshes the diagram summary from persisted data. Avoid replacing a group with the callback's filtered field subset. Keep historical snapshots read-only.

Omit `WorkflowDefinitionDetail.parameters` when the editor opens contextually so the diagram spans the available width; keep the slot when the same editor is visible beside the diagram. No editor, API, sample business registration or menu is installed by this block. Definition and execution lists use the same TanStack DataTable as the templates, with no second local pagination over a server page.

Ordering is optional: omit `onSort` when activity ordering is not supported so the header stays plain text. Omit a row's optional `name` when its linked `title` already supplies the complete display name. Hosts own filtering, pagination and their URL state; keep that state when opening and returning from a definition or execution.
