---
name: nocobase-app-plugin-projects
description: Register the Projects plugin in a NocoBase App, call its /api/projects API for projects, issues, workflows, labels and members, grant its permissions, or work out why a projects request is rejected.
metadata:
  short-description: Projects, issues, workflows, labels and members
---

# Projects App Plugin

Use this Skill when an App needs project and issue tracking, or when a request under `/api/projects` fails. Do not use it
for generic collection CRUD; the plugin's tables are only written through its API.

## Public surfaces

- Server plugin: default export of `@nocobase/app-plugin-projects/server`; `projectsToken` from
  `@nocobase/app-plugin-projects/server/tokens` resolves the services. The App must bind `projectsAccessToken`
  (`ProjectsAccess`: `permissionsOf`, `admit`, `changed`, `administrators`, and optionally `permissionsOfUser` so
  notices reach only those who may see the issue): the plugin keeps no roles of its own. It may bind
  `projectsNoticesToken` (`ProjectsNotices`: `send`, `resolve`) to receive the plugin's notices (owner notified,
  approval requested as a `decision`, approval decided, commented, mentioned, status changed, owner or executor
  assigned; information carries a `group` to merge by) and keep its own inbox; otherwise they go to the in-app
  channel `projects.inboxChannel`. Another plugin binds `projectsTriggersToken` (`IssueTriggers`) to start work when
  a person comments, and adds notice rules through `projectsNoticeRulesToken`. Operation plans (`shared/plans.ts`)
  are proposed through `projects.plans` (`PlanService`: rehearse, create, propose to someone else, execute, preview an undo and undo in one step), and
  a plugin binds `projectsPlanHooksToken` (`PlanHooks.onPlanDecided`) to hear their decisions.
- Shared types: `@nocobase/app-plugin-projects/shared/<name>` (`access`, `attachments`, `comments`, `common`, `issues`,
  `labels`, `members`, `plans`, `projects`, `settings`, `subscriptions`, `subtasks`, `workflows`).
- Server routes: everything under `/api/projects`; see the package README for the list. Failures are the standard error body with domain `projects`: branch on `reason`, read details from `metadata`.
- Client: the default export of `@nocobase/app-plugin-projects/client` adds `/projects` (the list and "New project").
  The App owns a project's page (`/projects/:projectId`, routed as that route's child) and composes it from the
  headless `@nocobase/app-plugin-projects/client/projects` (`useProjectDetail`, `useProjectUpdate`,
  `useProjectMembership`, `useProjectResources`, `useResourceValidation`, `useDeleteProject`, `useProjectWorkflow`).
  The App also owns `/issues` and
  `/my-issues`: it composes them from the headless `@nocobase/app-plugin-projects/client/issues` (list and board queries,
  board moves, filters in the query string, executor options) and routes the plugin's pages under `/issues` (the New
  issue dialog with its AI draft and manual tabs, a plan) from `client/pages` (`issueChildRoutes`). It also owns an
  issue's page (`/issues/:issueId`), presented over the same headless entry (`useIssueDetail`, `useIssuePageActions`,
  `useIssueTimeline`, `useIssueCommentActions` and the rest), and hosts the plugin's "New sub-issue" dialog under it
  (`issueDetailChildRoutes`).
  The settings pages (issue prefix, labels, workflows) are exported from
  `@nocobase/app-plugin-projects/client/config` for the App to route under its own settings page, and shared page
  components from `@nocobase/app-plugin-projects/client/kit`. Changes are announced on the realtime topic `pm:changes`.

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
  `permissionsOf` says which for each request. Settings items (`pm.general`, `pm.labels`, `pm.workflows`: read,
  update; `pm.members`: read, invite, assign, define-roles) are registered by the plugin. Creating an issue needs `pm.issues` `create`, not `edit`. `GET /api/projects/me` returns what the caller
  holds.
- Issue updates need the `revision` the caller read; a stale revision is 409 `REVISION_CONFLICT` (`ABORTED`).
- An issue cannot be created in a terminal status, and moving it to another project needs a status that project's
  workflow has. A status change the workflow does not allow for the caller is 400 `TRANSITION_NOT_ALLOWED`.
- Workflows (`/api/projects/workflows`) are read by every member and changed with `pm.workflows` `update`. A definition is
  `{ states: [{ key, name, category, color, builtIn? }], transitions: [{ from, to, actors }] }` (`*` for any
  status, actors: registered kind keys, `user` and `system` built in); the seven built-in statuses stay, each
  transition stays within what its kinds allow (`mayEnter`, `mayTargetAny`), and people can leave every status. Problems are 400 `INVALID_WORKFLOW` with `metadata.issues`; dropping a
  status issues are in is 400 `WORKFLOW_STATUS_CONFLICT` (`FAILED_PRECONDITION`). A project's `workflowId` (null: the default) switches only
  when every issue keeps its status.
- A status may carry `rules`: `{ type: 'checklist', config: { items: [{ key, label, required }] } }` and
  `{ type: 'notifyOwner', config: { message? } }`, each at most once. Entering the status copies the checklist to the
  issue (`GET /api/projects/issues/{issueId}/checklists`, `PATCH …/checklists/{statusKey}/items/{itemKey} { checked }` by anyone who may
  edit the issue); leaving it for anything but a closed status is 400 `CHECKLIST_INCOMPLETE` until the required items
  are checked. `notifyOwner` records `owner_notified` and sends an `owner_notified` notice (see `projectsNoticesToken`
  above); nothing is sent when the owner moved the issue.
- Another plugin adds status rule types through `projectsStatusRulesToken` (`StatusRuleTypes.add({ type, categories?,
validate?, describe?, canEnter?, entered? })`; `entered` runs in the move's transaction with the issue after the move
  and may `setExecutor`; `canEnter` runs before every move into the status, the system's event moves included, and
  answers null or `{ code, message, details? }`, which refuses the move with 400 `code`) and workflows that use them through `projectsWorkflowTemplatesToken` (installed once each, marked by
  `builtInKey`, titled by the template's `title`). What such a rule did is recorded as `stage_action_applied` or
  `stage_action_skipped { reason }`. A rule whose type is gone stays in the definition: saving keeps it unchanged,
  entering skips it as `unavailable`. `POST /api/projects/workflows/{workflowId}/preview { definition }` (with `pm.workflows`
  `update`) lists the rules a save would add or remove and those that wake someone without confirmation. In the
  browser, `StatusRuleTypesContext` from `client/kit` gives each type its title, editor and summary.
- Another plugin registers workflow events through `projectsWorkflowEventsToken` (`WorkflowEventTypes.add({ key, from?,
to? })`, a dotted key such as `acme.merged`; `from`/`to` are the status categories a transition on it may leave and
  enter) and fires one with `projects.workflowEvents.fire({ event, issueIds, actor?, note?, details? }, tx?)`. Each
  issue with a `{ from, to, actors: ['system'], on: event }` transition from its status moves as the system, inside
  `tx` when given; the activity `status_changed { event, note, cause }` names `actor`. The answer lists one outcome
  per issue: `moved`, `ignored { reason: 'notFound' | 'noTransition' }` or `refused { code }` (an entry condition held
  it back, recorded as `auto_move_skipped`). Only registered, contributed events may be fired. A transition on an
  event whose plugin is gone is kept while unchanged. In the browser, `WorkflowEventsContext` (`client/kit`) gives
  each event its title and hint for the workflow editor and the timeline.
- A transition may carry `approval: { approvers: ['owner' | 'projectLead' | 'admin', …] }`. A status change through
  it answers `PATCH /api/projects/issues/{issueId}` with 202 `{ data: { issue, pendingApproval } }` (the issue unchanged) unless the
  mover is an approver or none resolves. `GET /api/projects/approvals` lists the caller's; `POST /api/projects/approvals/{approvalId}/
approve|reject` (403 `NOT_APPROVER`) and `/withdraw` (403 `NOT_REQUESTER`) decide; a decided request is 400
  `APPROVAL_DECIDED`, a second pending one 400 `APPROVAL_PENDING`. Approving moves the issue, or leaves the request
  `stale` when the move no longer passes; the issue leaving the status also makes its request stale.
- A sub-issue may have a `stage` (0–1000, 400 `INVALID_STAGE`). `POST /api/projects/issues/{issueId}/dependencies
{ dependsOnIssueId, type: 'blockedBy' | 'relatedTo' }` links issues (201); `DELETE …/dependencies/{dependencyId}`
  removes a link (204). A cycle is 400 `DEPENDENCY_CYCLE`, a duplicate 409 `DEPENDENCY_EXISTS`. Issue detail carries
  `subtasks`, `blockedBy`, `blocks`, `relatedTo`, `blockers` and `hiddenBlockerCount`; list items `subtaskCount` and
  `blockedCount`. Finishing an issue releases the issues waiting on it (`dependency_released` notice) and tells the
  parent's owner when a stage or all sub-issues finish (`batch_done`). A workflow transition `{ from, to, actors:
['system'], on: 'subtasks.done' }` moves the parent then; status rules `{ type: 'subtasksDone' }` (400
  `SUBTASKS_OPEN`) and `{ type: 'blockersDone' }` (400 `ISSUE_BLOCKED`) refuse entering a status too early.
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

`GET /api/projects/me` as a signed-in user returns 200 with `permissions`; `POST /api/projects/issues` with a `title` returns 201
with an identifier such as `PM-1`.
