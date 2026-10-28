# Executable list and edit example

This example is the first runnable contract for the application-development Skill. It uses the Examples application's existing design tokens, DataTable, PageContainer, PageHeader, RouteDialog, FeedbackForm, Button and Input. The reference is the existing Examples application and the Skill's list/form/overlay guidance; preserve those component defaults. No visual exceptions are requested. The user authorized implementing this core example and its regression tests.

## Scope and routes

`/skill-projects` lists up to 100 persisted projects with client pagination and a clear cap notice. It has a page header, Create action, a permanently reserved refresh-feedback row, and name/action columns. `/skill-projects/new` opens a create dialog and `/:projectId/edit` opens an edit dialog over the preserved list. The single required name field is limited to 100 characters. All visible text is localized in English and Chinese. Narrow layouts reuse the table overflow and dialog sizing already provided by the template. No detail drawer, deletion, filters, workflows or additional business modules are part of this first contract.

The database collection is `skillProjects`. Native authentication and an explicit `skill-projects` page access permission gate every endpoint. That permission grants management of this shared learning dataset; it is never automatically assigned. Writes require the standard transaction receipt adapter and server input validation. The page and its overlays appear in the normal permission directory. Demonstration data is created by the user or tests, not seeded into unrelated applications.

## Acceptance

- D1: Empty, initial loading, loaded and request-error list states render in both languages; access denial gives guidance without a futile retry.
- D2: Opening an edit dialog preserves loaded rows and does not show list refresh feedback, even after 300 ms.
- D3: Cancel and browser return trigger fresh list reads; a fast response produces no feedback, a slow response shows feedback after 300 ms. The reserved row prevents table movement.
- D4: A failed validation sends no write; correcting the name clears its error on change. Enter and an external submit button share one submission lock acquired before async validation.
- D5: Save failures retain the draft; retry uses the same operation key when the outcome is uncertain. Pending writes block accidental closing. A successful save closes and refreshes the list.
- D6: A missing record cannot be edited; the parent is invalidated. Late responses and unmounted refresh timers cannot update a different page.
- D7: Actual database tests cover persisted creation/editing, invalid inputs, missing records, authentication, denied access and receipt replay.
- D8: Skills ship a generated copy of the tested source. CI rejects stale copies, runs the behavior tests, and includes the source in type checking and the application build.

## Verification scope

Component tests control request timing and failures through the real client API transport. Server tests use the actual application and disposable test databases (SQLite by default). Browser verification covers the integrated route and real create/edit flow at desktop and narrow widths. These layers are reported separately; a component test is not evidence of browser geometry or a real database write.

## Refined interaction contract after design review

V1 (style reference) is the Examples page shell and PageHeader at 1280×800; V2 (structure reference) is RouteDialog's fixed header/footer and scrolling body, narrowed to `sm:max-w-md` for this one-field form; V3 (structure reference) is the existing DataTable and its non-selectable pagination. Keep all host tokens in both presets and light/dark themes. The sidebar title is Projects / 项目 with FilePenLine; the edit URL is `/skill-projects/:projectId/edit`. Direct links load a fresh record; normal close, browser Back/Forward and return retain the mounted parent's pagination and query. The first field receives focus when ready; FeedbackForm owns first-invalid focus, and RouteDialog restores the opener (or its existing fallback on a direct link).

Initial list/edit reads show named skeletons and no writable form until their own request completes. Empty lists use Empty with one Create action; loaded lists put that action in the header. No Create action appears during initial loading or denial. Recoverable list-refresh errors retain rows, show an immediate error and Retry, and end refresh feedback. Edit reads always retrieve fresh data, never the cached row. Network/5xx read failures have Retry and Cancel; 401 has Sign in; 403 has administrator guidance and Cancel; 404 has missing-record guidance and Cancel and invalidates the parent. A missing record on Save disables further saving and invalidates the parent too.

The name has an accessible required mark. Names are trimmed on both client and server, blank-after-trimming values are rejected, and the maximum is 100 JavaScript UTF-16 code units after trimming. Long table values truncate with the full name available as a title. Data is deterministically ordered by ascending immutable ID, not by name or modification time; editing a name therefore does not move the row. A successful response updates the local list in that same order and cap before closing, displays a localized toast naming the project, then the returning list makes its fresh read. A follow-up read failure does not turn a confirmed save into a failed write. A newly created record beyond the cap is acknowledged by its success toast and total/cap notice.

An uncertain save disables name changes and close/navigation actions, explains that Save retries the original payload, and retains the original operation key. Submit/Cancel are disabled while a request runs; the close icon, Escape, outside click and router navigation use the same busy/pending policy. Browser unload prompts before leaving a pending or dirty form. An idle dirty form asks before discarding changes. A definitive rejection releases the operation for correction. Saving a corrected draft starts a new operation. The schema has no deletion feature; tests can remove a record to exercise missing-record recovery.

| API                        | Contract                                                                     |
| -------------------------- | ---------------------------------------------------------------------------- |
| GET `/skillProjects`       | `{ data: [{ id, name }], meta: { total } }`, ascending ID, first 100 records |
| GET `/skillProjects/:id`   | `{ data: { id, name } }`, UUID identifier, 404 if absent                     |
| POST `/skillProjects`      | `{ name }`, required Idempotency-Key, returns saved `{ data: { id, name } }` |
| PATCH `/skillProjects/:id` | Same body/header and response as create; 404 if absent                       |

All endpoints require native authentication and the explicit `skill-projects` page grant. Invalid inputs return 400 with standard field violations; missing login returns 401, missing grant 403, missing record 404, and mismatched receipt input 409. Unknown server/transport outcomes retain the retry key. The service has no external side effects, and the mutation receipt and record commit in the same transaction.

The complete English/Chinese copy inventory is `client/pages/skill-projects/locales.ts`, covering titles/actions, empty/loading/refreshing, validation, denial/session/missing/error recovery, discard confirmation, uncertainty guidance and success toast. Existing FeedbackForm copy covers generic submission failures. No-results is inapplicable because there are no filters.

Additional acceptance checks: fresh edit data after a list loads; initial/edit skeletons with no writable form; 401/403/404/500 action differences; a held post-save read with immediate new name; uncertain retry with identical key and payload; concurrent submission attempts; first-invalid and restored focus; direct-link and history navigation; 99/100/101 record cap boundaries; blank, whitespace and 100/101-unit name boundaries including Chinese; 1280×800, 375×812 and 375×480 geometry, long-name containment, keyboard/IME entry, fixed reachable footer, both themes and presets. Runtime evidence and automated tests are recorded separately, and missing checks are identified rather than called passing.

Canonical source lives in `client/pages/skill-projects/`, `server/routes/skill-projects.ts`, `server/providers/skill-projects.ts` and its migration. `node scripts/sync-app-skill-examples.mjs` at the source repository root publishes it under the development Skill's `assets/list-edit-example/`; `--check` runs in the root script suite. Client/server/migration suites with `skill-projects` in their names run in the Examples test command; application typecheck/build cover the canonical implementation. Browser checks are separate acceptance evidence, not claimed as a continuous browser CI gate.
