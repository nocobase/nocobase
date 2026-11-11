# Pending feedback

Use the installed `#components/loading` for a page or panel and `#components/pending-button` for native submit actions. Both share `usePendingFeedback` from `@nocobase/app-client`; do not rebuild display timers, branded spinners or button sizing in business pages. These components own feedback presentation, accessibility, styling and display timing; business code still supplies the real request, submission or task state, active route state, stable query identity, permission-safe data and recovery actions. Presentation never starts, locks, completes or cancels the underlying work. See the UI Library `loading` and `pending-button` examples for interactive controls and the templates' `client/pages/settings/user-form.tsx` for a real shared submission.

## Integration

```tsx
import type { Submission } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import type { ReactElement } from 'react';
import { PendingButton } from '#components/pending-button';

function SaveEquipmentButton({
  submission,
}: {
  readonly submission: Submission;
}): ReactElement {
  const { t } = useTranslation();
  return (
    <PendingButton
      type='submit'
      form='equipment-editor'
      busy={submission.submitting}
      pendingLabel={t('equipment.saving')}
    >
      {t('equipment.save')}
    </PendingButton>
  );
}
```

The form's submit handler calls `submission.run(input, execute)` before asynchronous validation or effects, following [submission protection](submission.md). Preserve the controller, server operation key, failure recovery and input. The button is presentation, not duplicate-write protection. Never use `submission.pending` as busy: an unknown outcome can remain recoverable after active work stops. Existing application guards may also contribute real request busy state. The standard Users editor retains its existing guard while consuming `submission.submitting`.

Pass the real request's `pending` to Loading, a stable query key as `identity`, and a translated `label`.

Render within the slot that actually loads; only application startup uses `fullscreen`. The normal indicator reserves its own footprint; a page owns any larger content reservation. Keep existing content only when the query and permission identity still match. Use [list states](frontend/references/table.md) through `resolveListState` for tables; this display component never decides empty, forbidden or failed states. An unmet dependency or disabled query is idle, not loading. Route waits belong to the route's container: declare `presentation` on a child page, dialog or drawer route ([overlays](frontend/references/overlay.md#declare-the-presentation)) and the application opens it before the module, its authorization check and its data, with the wait, denial and a module-only Retry inside; a failed retry adds Reload page. A route without one keeps the page-sized placeholder at its parent's outlet.

## A new list page

A new business list needs no feedback code of its own. Read through `useListData`, derive the state with `resolveListState`, and hand `active && request.loading`, its path as `loadingIdentity`, and its retry to the preinstalled `DataTable`. This feedback-focused excerpt requests only page 1 and leaves pagination to the table, so it is not a complete server-paginated list; for URL-backed page state, `manualPagination`, and the server's total, follow the [complete server-paginated table example](frontend/references/example/server-table.md).

```tsx
const path = `equipment?page=1&pageSize=20${query ? `&q=${encodeURIComponent(query)}` : ''}`;
const { active } = useListLocation();
const request = useListData<{ data: readonly Equipment[] }>(path, {
  active,
  keepPreviousData: true,
});
const current = request.path === path ? request.data : undefined;
const rows = current?.data ?? [];
const listState = resolveListState(
  {
    data: current,
    error: request.error,
    isPending: request.loading && !current,
  },
  rows.length,
  Boolean(query),
);

<DataTable
  columns={columns}
  data={rows}
  getRowId={(row) => row.id}
  loading={active && request.loading}
  loadingIdentity={path}
  listState={listState}
  onRetry={request.reload}
  onClearFilters={clearFilters}
/>;
```

The first load, search changes, refreshes, failure with Retry, empty and no-results states then follow this document. `useListData.loading` also tracks unresolved readiness while inactive; `active && request.loading` prevents a cold background list from announcing work that has not started. Keep this gate when adapting copied tables; card-style `ListFeedback` uses `active || listState !== 'loading'` to omit a paused loading boundary. Page actions use `PendingButton` with their real busy state, a retained summary card adds `RefreshIndicator` inside its positioned container, and a long server task renders `TaskProgress` from its task record.

## Lists, cards and pickers

Tables and card lists take their state from `resolveListState` (see [list states](frontend/references/table.md)) and their feedback from the installed components; do not add a page-level spinner, a hand-written 300ms timer or a reserved toolbar slot for refreshes.

| Situation                                         | Standard behavior                                                                                                                                                   | Owner                                  |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| First load, or a new query, page or sort          | Header, toolbar and filters stay; previous rows, totals and counts are hidden at once; `ListFeedback` loading appears after 300ms                                   | `DataTable listState` + request owner  |
| New query after rows were shown                   | The body and pagination keep their previous height; pagination stays disabled without the previous page count                                                       | `DataTable` (default)                  |
| Same query refreshes (refresh button, after save) | Rows stay; `aria-busy` on the table; a thin `RefreshIndicator` bar and one status after 300ms, a visible note at 10s                                                | `DataTable loading` (default)          |
| Refresh fails                                     | Rows of the same query stay with one stale-data line; retry is a `PendingButton` in the toolbar                                                                     | `ListFeedback` / `ListFeedbackActions` |
| 401/403, or permission revision changes           | No previous rows; `forbidden`/`unauthenticated` state; remount the view on authorization revision                                                                   | Request owner + `resolveListState`     |
| List covered by a route overlay                   | No refresh feedback; pass `active && loading`                                                                                                                       | Page                                   |
| Retained card or summary refreshes                | Content stays; `RefreshIndicator` inside its positioned container, independent of other regions                                                                     | Page, explicit                         |
| Picker search or filter changes                   | `Loading` in the option list instead of the previous query's options (check `isPlaceholderData`); next-page loading appends a delayed small mark below kept options | Picker, explicit                       |

Pass the current query's stable identity — `loadingIdentity` on `DataTable`, `identity` on `ListFeedback` and `Loading`, or a search/filter key in a picker — so a query that replaces a still-pending one restarts its own 300ms delay and 10-second note instead of inheriting the old wait; changing the identity resets presentation only and never remounts the table. Exactly one control announces each wait: after a refresh failure the toolbar's retry button owns it, so a composed inner table receives `loading` only in the `ready` state. Keep each polite status outside its `aria-busy` element and mounted while the region can load, so the change is announced rather than dropped. Plugin pages that cannot import the application's components install their own copies of the Registry `loading` and `pending-button` sources, as the Repository example does, rather than writing another spinner.

Each region owns its own request and feedback: a slow contacts table does not hold a summary card busy, and one region finishing never clears another's indicator. A disabled or not-yet-enabled query is idle, not loading. The request owner still discards stale responses (abort signal or generation check) and clears data on 401/403; display components never decide authorization.

## Uploads, downloads, imports and exports

A long operation shows only what really exists. Reuse the task, job and realtime mechanisms the application already has (the Jobs and Realtime plugins, the File Repository); do not add a client-side task, a timer that advances a bar, or a second cancellation channel.

| Situation                                                                  | Standard behavior                                                                                                                                             | Owner                         |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| Request with no progress events (File Repository upload, a short download) | Per item: state text at once, an indeterminate mark after 300ms, a long-wait note at 10s; never a percentage                                                  | File upload field (default)   |
| Cancel                                                                     | Offer it only when it really stops the work: an upload aborts its request through the signal; a server task offers cancel only if the server supports it      | Request owner                 |
| Leaving the page                                                           | An upload in flight is aborted on unmount; a server task keeps running, and its record says so (`continuesInBackground`)                                      | Upload field / `TaskProgress` |
| Server task with a known total or percentage                               | `TaskProgress` with real `processed`/`total` or `percent`: determinate bar, count and percentage                                                              | Page, from the task record    |
| Server task queued or with an unknown total                                | `TaskProgress` without a total: indeterminate bar, no number, never a placeholder 0%                                                                          | Page                          |
| Failure                                                                    | Keep what is known (processed count, the file), say why in the application's words, and offer a real recovery: Retry for the same file, or run the task again | Upload field / page           |
| Result                                                                     | Say where it is: a download action on the completed record, or where imported records now appear                                                              | Page (`message`, `actions`)   |
| Several tasks or files                                                     | Each item or record owns its own state; one finishing never clears another                                                                                    | Component per item            |

Status changes are announced once per change; percentage updates are not announced. Use the application's own status words through `statusLabel` when it has them. An import is an upload followed by a server task: show the upload wait first, then the task record once the server accepts it. See the UI Library `task-progress` and `file-upload-field` examples and the Jobs and Realtime example plugins.

## Timing and state ownership

| Real operation                            | Immediate behavior                                                       | Delayed feedback                                                 |
| ----------------------------------------- | ------------------------------------------------------------------------ | ---------------------------------------------------------------- |
| Idle, prerequisite missing, cache hit     | Enabled if otherwise allowed                                             | None                                                             |
| Pending or submitting                     | Set aria-busy; lock the native action immediately                        | At 300ms show indicator and one polite status                    |
| Still pending at 10 seconds               | Keep actual operation state                                              | Explain the long wait; no fake progress, timeout or cancellation |
| Success, failure, timeout or cancellation | Clear busy on actual lifecycle completion; show the owner's result/error | Remove feedback immediately, with no minimum wait                |
| Replacement operation                     | Change stable identity and reset display age                             | New 300ms/10s interval                                           |
| Unmount                                   | Request owner cancels/ignores obsolete work                              | Clear both timers                                                |

The hook creates at most two one-shot timers per active feedback instance. It adds no requests, polls, queries, writes or locks. Identity only resets presentation; request owners must reject stale responses after query changes, session changes, permission revocation or unmount. Permission-unknown content stays hidden. Never retain protected content merely because Loading can cover it. A 10-second hint is not a request deadline; real timeouts and recovery come from the request/submission owner.

Keep one status per operation; the branded graphic is decorative. The waiting label reserves the same button geometry throughout; the long-wait explanation is announced and displayed in an anchored, non-interactive hint without widening the button. Retain form focus, native keyboard submission and the existing disabled scope. Use semantic theme tokens and motion-safe animation; do not add a global mask for local work.

## Upgrade and review

Both template sources preinstall the Registry `loading`, `pending-button`, `list-feedback`, `data-table` and `task-progress` recipes with their translated keys. Applications generated from a template version that contains these files receive copied components that a new business page can import as `#components/loading`, `#components/pending-button`, `#components/data-table` or `#components/task-progress`. Checking the template source and checking a newly generated application with `create-app` are separate validations; neither proves that a published package installation works. Existing applications reconcile the selected template version and their copied source through the [upgrade Skill](../../nocobase-app-upgrade/SKILL.md); do not overwrite business customizations or assume a package update replaces copied files. Independently installed Registry copies merge the current `loading`, `pending-button` and branded mark sources, install the declared compatible runtime, and add `status.loading`, `pendingFeedback.working` and `pendingFeedback.longWait` translations. Validate a published install after releasing the compatible runtime and Registry recipes, in that order. A customized Button or legacy spinner needs inspection rather than a blind replacement. Route presentations need the copied `client/routing/client-route.tsx`, `client/components/route-overlay.tsx` and `client/components/route-child-page.tsx` of the same template version together with the compatible `@nocobase/app-client`; merge them, then declare `presentation` route by route on the routes whose page renders that container as its root. Undeclared routes and route component overrides keep working unchanged, and an override declares its own `presentation` only when its replacement renders that root. The host contexts come from `@nocobase/app-client/route-containers`, so a plugin's own copy of `RouteDialog`, `RouteDrawer`, `RouteChildPage` and `useRouteOverlay` joins the container the application opened once that copy reads them; a copy that still defines its own contexts must not be given a `presentation`, or it opens a second panel. The Projects, Releases and Agents plugin copies read the shared contexts.

Projects, Releases and Agents declare `@nocobase/app-client` as `workspace:^`; after `changeset version`, packing rewrites each peer to the actual runtime version in that release. Do not predict the next beta version or add workspace overrides to force an unreleased floor. The Registry feedback/container recipes currently name the candidate `^4.0.0-beta.9`: verify that literal against the first published runtime containing the shared exports before publishing the recipes, and update it if necessary. The previously published beta.8 lacks those exports. Release the compatible runtime before these consumers; inspect the versioned tarballs and ensure every plugin resolves the host's single runtime.

Review checklist: real busy starts before the display delay; click and Enter use one submission controller; fast work has no indicator; completion/error clears at once; operation replacement resets age; no nested status/spinner; button dimensions and focus remain stable; source and both templates match; English/Chinese, narrow width, light/dark themes and reduced motion are checked. Verify timeout and unknown-outcome recovery through the existing submission suite. Every child page, dialog and drawer route declares `presentation` matching the component it renders, and a slow module or authorization check shows its wait inside that container rather than under the parent; lists, cards, pickers and long operations follow the sections above.
