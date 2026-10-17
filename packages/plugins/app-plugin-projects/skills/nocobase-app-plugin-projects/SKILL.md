---
name: nocobase-app-plugin-projects
description: Register the Projects plugin in a NocoBase App, call its /api/projects API for projects, issues, their fixed statuses, labels and members, grant its permissions, or work out why a projects request is rejected.
metadata:
  short-description: Projects, issues, statuses, labels and members
---

# Projects App Plugin

Use this Skill when an App needs project and issue tracking, or when a request under `/api/projects` fails. Do not use it
for generic collection CRUD; the plugin's tables are only written through its API.

## Public surfaces

- Server plugin: default export of `@nocobase/app-plugin-projects/server`; `projectsToken` from
  `@nocobase/app-plugin-projects/server/tokens` resolves the services. The App must bind `projectsAccessToken`
  (`ProjectsAccess`: `permissionsOf`, `admit`, `changed`, `administrators`, and optionally `permissionsOfUser` so
  notices reach only those who may see the issue): the plugin keeps no roles of its own. It may bind
  `projectsNoticesToken` (`ProjectsNotices`: `send`) to receive the plugin's notices (owner notified, commented,
  mentioned, status changed, owner or executor assigned; information carries a `group` to merge by) and keep its own
  inbox; otherwise they go to the in-app
  channel `projects.inboxChannel`. Another plugin binds `projectsTriggersToken` (`IssueTriggers`) to start work when
  a person comments, and adds notice rules through `projectsNoticeRulesToken`. Operation plans (`shared/plans.ts`)
  are proposed through `projects.plans` (`PlanService`: rehearse, create, propose to someone else, execute, preview an undo and undo in one step), and
  a plugin binds `projectsPlanHooksToken` (`PlanHooks.onPlanDecided`) to hear their decisions.
- Shared types: `@nocobase/app-plugin-projects/shared/<name>` (`access`, `attachments`, `comments`, `common`, `issues`,
  `labels`, `members`, `plans`, `projects`, `settings`, `statuses`, `subscriptions`, `subtasks`).
- Server routes: everything under `/api/projects`; see the package README for the list. Failures are the standard error body with domain `projects`: branch on `reason`, read details from `metadata`.
- Client: the default export of `@nocobase/app-plugin-projects/client` adds `/projects` (the list and "New project").
  The App owns a project's page (`/projects/:projectId`, routed as that route's child) and composes it from the
  headless `@nocobase/app-plugin-projects/client/projects` (`useProjectDetail`, `useProjectUpdate`,
  `useProjectMembership`, `useProjectResources`, `useResourceValidation`, `useDeleteProject`).
  The App also owns `/issues` and
  `/my-issues`: it composes them from the headless `@nocobase/app-plugin-projects/client/issues` (list and board queries,
  board moves, filters in the query string, executor options) and routes the plugin's pages under `/issues` (the New
  issue dialog with its AI draft and manual tabs, a plan) from `client/pages` (`issueChildRoutes`). It also owns an
  issue's page (`/issues/:issueId`), presented over the same headless entry (`useIssueDetail`, `useIssuePageActions`,
  `useIssueTimeline`, `useIssueCommentActions` and the rest), and hosts the plugin's "New sub-issue" dialog under it
  (`issueDetailChildRoutes`).
  The settings pages (issue prefix, labels) are exported from
  `@nocobase/app-plugin-projects/client/config` for the App to route under its own settings page, and shared page
  components from `@nocobase/app-plugin-projects/client/kit`. Changes are announced on the realtime topic `pm:changes`, naming the changed issues in `issueIds` when they can; refresh only those issues' reads then.

The NocoBase UI Library presents these headless entries; install an item rather than building the page from scratch, and read its example (`pnpm exec shadcn view @nocobase/<item>-demo`) first. `project-detail` is a block for a project's page, `issue-detail` a block for an issue's page, and `issue-table`, `kanban` and `comment-thread` the components for the issue list, the board and an issue's activity. For agents working on issues, `agent-queue` (a block) and `agent-run-history` (a component) take the runs of `@nocobase/app-plugin-agents`. Each is installed with `yes n | pnpm exec shadcn add @nocobase/<item>` and is presentational: map the hooks' data to its props and its callbacks to the hooks' mutations.

## Prerequisites

The App must register `@nocobase/app-plugin-authentication`, `@nocobase/app-plugin-authorization` and
`@nocobase/app-plugin-users` (whose invitations the member settings use) before this plugin, and bind
`projectsAccessToken` from one of its own providers. The roles seed still creates `pm-*` permission sets with composite
grants from before roles moved to the App; the App converts them (for example, `database/roles-conversion.ts`).

## Permissions and constraints

- Anonymous requests are 401. Every signed-in caller becomes a member on their first request, and the App's
  `admit` gives them its default role.
- Business actions (`pm.projects`: view, create, manage, delete; `pm.issues`: view, create, edit, comment,
  moderate-comments, close, change-owner, delete; `pm.attachments`: upload) reach none, related or all records. The
  plugin registers them as the `pm` resource type, one action per level (`edit.related`, `edit.all`; `create` and
  `delete` without levels; `shared/access.ts`: `levelActionsOf`), and a role grants the level's action; the App's
  `permissionsOf` says which for each request. Settings items (`pm.general`, `pm.labels`: read, update; `pm.members`: read, invite, assign, define-roles) are registered by the plugin. Creating an issue needs `pm.issues` `create`, not `edit`. `GET /api/projects/me` returns what the caller
  holds.
- Authorized original inviters can generate and privately deliver invitation links using an unscoped person credential, without global user creation permissions or an email channel. New accounts register from the link and remain email-unverified; existing users sign in with the matching account. Links use `app.publicOrigin` or the request origin. Generating a new link invalidates the old link; current access to every remaining project is rechecked. Other managers and scoped credentials remain email-only.
- Issue updates need the `revision` the caller read; a stale revision is 409 `REVISION_CONFLICT` (`ABORTED`).
- Statuses are fixed (`shared/statuses.ts`): `backlog`, `in_progress`, `blocked`, `in_review`, `done`, `cancelled`, the
  same for every project (`GET /api/projects/issues/statuses`). A new issue starts in `backlog` (nothing starts) or
  `in_progress` (its work starts); any other `statusKey` is 400 `INVALID_STATUS`. Left without `executor`, it gets the
  default executor a kind names (`PrincipalKind.defaultExecutor`; `GET /api/projects/executors` marks it `isDefault`).
  People move an issue between any two statuses; a principal of another kind only along its kind's `moves`, and only
  when its `mayMove` agrees; anything else is 400 `TRANSITION_NOT_ALLOWED`. Entering `blocked` or `in_review` records
  `owner_notified` and sends an `owner_notified` notice, unless the owner moved it. `PATCH /api/projects/issues/{issueId}`
  answers 200 `{ data: { issue } }`. An issue's nullable Markdown `acceptance` is its delivery report, ending with the
  acceptance criteria; it is written with the move to `in_review`, kept across later status changes, and replaced by the
  next delivery.
- Another plugin registers status events through `projectsStatusEventsToken` (`StatusEventTypes.add({ key, from, to })`,
  a dotted key such as `acme.merged`, the statuses it moves an issue out of and the one it moves it to) and fires one
  with `projects.statusEvents.fire({ event, issueIds, actor?, note?, details? }, tx?)`. Each issue in one of `from`
  moves to `to` as the system, inside `tx` when given; the activity `status_changed { event, note, cause }` names
  `actor`. The answer lists one outcome per issue: `moved`, `ignored { reason: 'notFound' | 'noTransition' }` or
  `refused { code }` (recorded as `auto_move_skipped`). `projects.statusEvents.target(event, issueId)` says where it
  would take one issue. In the browser, `StatusEventsContext` (`client/kit`) titles each event for the timeline.
- A sub-issue may have a `stage` (0–1000, 400 `INVALID_STAGE`). `POST /api/projects/issues/{issueId}/dependencies { dependsOnIssueId, type: 'blockedBy' | 'relatedTo' }` links issues (201); `DELETE …/dependencies/{dependencyId}` removes a link (204). `PATCH …/dependencies/{dependencyId} { type, expectedType }` changes its type atomically and preserves its ID (200); a stale type is 409 `DEPENDENCY_CHANGED`, and an existing target relationship is 409 `DEPENDENCY_EXISTS` with both links preserved. A related link can be converted from either end; the current issue waits when converted to `blockedBy`. A cycle is 400 `DEPENDENCY_CYCLE`, a duplicate 409 `DEPENDENCY_EXISTS`. Concurrent dependency graph changes can return 409 `DEPENDENCY_GRAPH_CHANGED`; reload and retry the whole operation, including a plan if the write belongs to one. All relationship writes, including both removal endpoints, share this protection so duplicate checks, activity and release notifications use a consistent relationship type and direction. Plans take the graph guard before their first row during rehearsal, execution and undo. Issue status/project changes, status events and deletion take the same guard before writing issue rows, so concurrent releases cannot leave unblocked work idle; automatic parent/stage completion retains it. Creation, parent/stage changes and restoration share this protection; independent creates without waits lock without changing the graph revision and do not conflict with each other; restoring a deleted issue can be rejected with `DEPENDENCY_CYCLE`. Issue detail carries `subtasks`, `blockedBy`, `blocks`, `relatedTo`, `blockers` and `hiddenBlockerCount`; list items `subtaskCount` and `blockedCount`. Finishing an issue releases the issues waiting on it (`dependency_released` notice) and tells the parent's owner when a stage or all sub-issues finish (`batch_done`, and the `onSubtasksFinished` trigger); the parent's status does not move on its own.
- Comments (`/api/projects/issues/{issueId}/comments`, `/api/projects/comments/{commentId}…`): posting, replying and resolving need
  `pm.issues` `comment`; only the author edits a comment (403 otherwise); deleting another's needs
  `moderate-comments`. Content is 1 to 200,000 characters (400 `INVALID_COMMENT`); a reply's parent must be a comment of the
  same issue (400 `INVALID_PARENT`); resolving a reply is 400 `NOT_THREAD_ROOT`; mentioning what a kind refuses is 403 `MENTION_FORBIDDEN`.
  Reactions (`POST …/react` and `…/unreact` with `{ emoji }`) take one of the fixed emoji (400 `INVALID_INPUT`).
- Files (`shared/attachments.ts`): stored through `@nocobase/app-plugin-file` on the App's default Drive disk (400
  `FILES_UNAVAILABLE` without it), any type, at most 20 MiB each (413 `FILE_TOO_LARGE`). Uploading needs
  `pm.attachments` `upload`: onto an issue (`POST /api/projects/issues/{issueId}/attachments`, with `edit`) or attached to nothing
  (`POST /api/projects/attachments`) and then sent with a comment by `attachmentIds` (at most 10 of the caller's own; 400
  `INVALID_ATTACHMENT` otherwise). Whoever sees the issue reads its files (`GET /api/projects/attachments/{attachmentId}/content`: safe
  images inline, everything else as a download); the uploader or a comment moderator removes an issue's file, and a
  comment's files go with the comment. Uploads attached to nothing are purged after 24 hours.
- Roles, members' roles and the default role for new members are the App's (for example, `/api/acme/roles`,
  `/api/acme/members`, `/api/acme/access/settings`).

## Verification

Work handlers receive the original optional `actor` on `onOwnerChanged`, `onUnblocked` and `onSubtasksFinished`, including `actor.trace.runId` when supplied. A status event moves as the system but records the actor it was fired with; pass the real actor when firing one, since an omitted actor defaults to the system.

`GET /api/projects/me` as a signed-in user returns 200 with `permissions`; `POST /api/projects/issues` with a `title` returns 201
with an identifier such as `PM-1`.

Invitation emails use `notificationService.sendTransient()` so credentials never enter notification message snapshots or job storage. This performs one bounded attempt without durable retries or deduplication. Failures retain safe status/category diagnostics without raw provider messages. The inviter can generate and privately deliver a new link if delivery fails. Historical notification snapshots are not rewritten.

Applications can fill `ExecutorPresentationContext` from the client kit with `{ kind, Component }`. The component receives `{ id, name, place: 'trigger' | 'menu' }` in new-task and subtask executor selects; candidates and permissions still come from the server. This lets a runtime integration show scoped quota without Projects depending on that integration.
