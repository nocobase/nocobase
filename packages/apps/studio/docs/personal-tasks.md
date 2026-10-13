# Personal task workspace

`/my-issues/owned` and `/my-issues/executing` share the personal workspace, titled **My tasks-α** (Chinese: **我的任务-α**). The two scopes retain the Projects plugin's existing fixed owner/executor filters and permissions. Tasks (`/issues`) is still an independent page. The single personal navigation entry uses the existing `pm-my-issues` page grant. `/follow-ups` is an authenticated legacy alias that replaces the URL with `/my-issues/owned`, retaining the complete query and fragment; `tab=following|mine` names a workspace partition, not an owner/executor scope.

## Following and navigation

Following remains the existing explicit star operation, persisted by the follow-ups service with its five-item limit, saved order, authorization and seen markers. Missing or malformed following preferences are an empty collection. Owned blocked/review tasks are no longer automatically followed; existing stored choices are preserved without guessing their origin. The CLI's `follow-up` commands and response contracts stay compatible.

Initial reads show loading or an error with Retry. Failed background reads keep the last valid workspace and expose the error. Follow/unfollow does not modify the overview until the server acknowledges the write. A successful first follow selects that task. An acknowledged removal of the selected followed task chooses the first remaining saved item; the last removal returns to the full task region. Task filters do not modify the following collection.

`issue=<id or identifier>` selects workspace content independently of the task list's search, filters, sorting and view. User selections and partition changes push history entries; removal/permission fallbacks replace the invalid selection. A valid non-followed task remains a temporary selection; reading it does not follow it. Explicit full-detail links use the current owned/executing child route, preserving the query and fragment and native modifier-click behavior. Full-detail routes hide the inline conversation so only one visible conversation marks updates seen.

## Layout and drafts

The workspace measures its own content width, including the effect of the sidebar. The provisional three-column budget is 69rem: a 12rem following rail, at least 30rem for reading/replying, at least 24rem for the task table and theme gaps. Below that budget, and for explicit/saved non-table views, Following and My tasks are separate reachable partitions. Selecting content presents a clear Back control. These sizes require rendered verification in Compact and Spacious, light and dark, around the threshold and at 375px; they are not certified by component tests.

The personal task outlet keeps the same container across following changes. It uses the complete existing IssuesView, rather than the legacy capped owner-card list. Each workspace content region isolates vertical overscroll; horizontal scrolling remains native. Panel scroll positions are held in this workspace session. The table retains its own scrolling and query controller.

`IssueDraftProvider` keeps session-only ComposerSession instances keyed by task ID. Lightweight hosts keep the original Projects `useAttachmentUploads` mounted across panel changes without mounting hidden detail queries or marking those tasks seen. The composer consumes that session for content, mode, pending submission, reply target and folded/open state. Draft-return buttons remain after closing content or removing the last follow. A denied/deleted task hides cached task content and offers only the user's retained draft with sending unavailable. Leaving the personal page or changing viewer releases this session; there is no persistent preference, browser storage or cross-refresh draft recovery.

## PM-336 integration boundary

This delivery is an intermediate draft. PM-336 still owns `client/components/issue-table.tsx`, `client/issues/list-view.tsx`, `issues-view.tsx`, `use-issues-page.ts`, `client/pages/my-issues/tab.tsx`, grouped/child queries, authorization and attention evaluation. No parallel copy of the table, task data or server attention logic is introduced here. PR #10830 at `6e8df0236f2775dc4b4e7d74ff1291e3b3a0735e` contains only the internal tree model; it does not supply page APIs.

The sequential handoff needs these additive presentation points (names below are proposals, not existing API exports):

| Owner file                               | Minimal extension                                                                                                                                       | Consumer                                                                                                                |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `issues-view.tsx` / `use-issues-page.ts` | Publish the actual resolved view/default and query identity through a small context or callback                                                         | Workspace chooses columns using the same explicit/saved/default priority; remove the interim local view resolution      |
| `issues-view.tsx` / `list-view.tsx`      | Forward optional `presentation: 'compact'`, `onPreview(issueId)`, `rowAction`, selected task ID                                                         | Personal workspace provides follow buttons and ordinary-click temporary viewing; standalone pages retain their defaults |
| `issue-table.tsx`                        | Compact column policy: identifier/title, status/attention, accessible disclosure and follow action; secondary fields through accessible row information | Same authorized grouped/child rows, query, pagination and expansion; never hide columns with an external CSS selector   |
| `my-issues/tab.tsx`                      | Consume workspace presentation context only after PM-336 finishes default-view/grouped changes                                                          | Both existing fixed scopes pass identical presentation slots into the same table                                        |

Right-side ordinary-click temporary preview, compact fields/follow action, grouped expansion and the first-visit table default are not wired in this intermediate PR. Existing task row links continue opening full scoped details. The workspace currently mirrors the baseline board fallback until PM-336 supplies the real default/resolved-view contract. No new server endpoint, protocol field, schema or migration is needed for these presentation points.

## Verification still required

Before acceptance, complete the shared table handoff and verify real desktop/narrow UI, keyboard focus, reduced motion, modifier links/history, Chinese IME, long titles, large feeds/task collections, empty personal results with existing follows, permissions, input/menu visibility and independent scroll in both theme presets/color schemes. Include failed first/last saves, quota, refreshed invalid selection, live updates, group/parent disclosures, draft attachments and only-current-panel seen requests. CLI-only agent runs cannot produce authenticated browser screenshots; component/model tests do not replace these checks.
