# Pending feedback

Use the installed `#components/loading` for a page or panel and `#components/pending-button` for native submit actions. Both share `usePendingFeedback` from `@nocobase/app-client`; do not rebuild display timers, branded spinners or button sizing in business pages. See the UI Library `loading` and `pending-button` examples for interactive controls and the templates' `client/pages/settings/user-form.tsx` for a real shared submission.

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

Render within the slot that actually loads; only application startup uses `fullscreen`. The normal indicator reserves its own footprint; a page owns any larger content reservation. Keep existing content only when the query and permission identity still match. Use [list states](frontend/references/table.md) through `resolveListState` for tables; this display component never decides empty, forbidden or failed states. An unmet dependency or disabled query is idle, not loading. Route dialogs and drawers still follow the existing container contract; adding Loading does not move an overlay shell before lazy module loading.

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

Both templates preinstall the Registry recipes and translated keys. New generated applications receive them by default. Existing applications reconcile the selected template version and their copied source through the [upgrade Skill](../../nocobase-app-upgrade/SKILL.md); do not overwrite business customizations or assume a package update replaces copied files. Independently installed Registry copies merge the current `loading`, `pending-button` and branded mark sources, install the declared compatible runtime, and add `status.loading`, `pendingFeedback.working` and `pendingFeedback.longWait` translations. Publish the runtime before the Registry recipes. A customized Button or legacy spinner needs inspection rather than a blind replacement.

Review checklist: real busy starts before the display delay; click and Enter use one submission controller; fast work has no indicator; completion/error clears at once; operation replacement resets age; no nested status/spinner; button dimensions and focus remain stable; source and both templates match; English/Chinese, narrow width, light/dark themes and reduced motion are checked. Verify timeout and unknown-outcome recovery through the existing submission suite. Route shell ownership remains a separate integration; lists, cards, pickers and long operations follow the sections above.
