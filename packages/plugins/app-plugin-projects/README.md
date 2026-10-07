# @nocobase/app-plugin-projects

Projects, issues, workflows, labels and members for a NocoBase application.

## What it provides

- **Members**: every signed-in user who opens the API becomes a member, and the application gives them its default
  role for new members (`ProjectsAccess.admit`).
- **Access, declared**: the pages, settings items and business actions with the levels each offers
  (`shared/access.ts`). The plugin registers its settings items and its businesses (the `pm` resource type, one action
  per level: `edit.related`, `edit.all`); the application that assembles it keeps the roles and
  binds `projectsAccessToken` (`server/tokens.ts`), which tells the plugin each request's `Permissions`, admits new
  members and names the administrators. The assembling application does this in `server/access`.
- **Invitations**: sent by the user management plugin; an invitation from the member settings carries projects, and
  the invitee joins them on acceptance.
- **Settings**: the issue identifier prefix (`PM` by default). Issue numbers come from one workspace-wide counter.
- **Labels**: a shared label list.
- **Kinds**: who acts on issues or is named in them. `user` (people) and `system` (the plugin's own rules) are built
  in; another plugin registers more through `projectsKindsToken` (`server/kernel/kinds.ts`): a key, a title, how its
  ids are named, whether it may execute issues (and who may give it work), whether it may be mentioned, and which
  moves a workflow may let it make. Executors, activity, mentions, checklist checkers, approval requesters and
  workflow transitions name a kind by its key; the browser reads the list from `GET /api/projects/me` (`kinds`). A kind may
  also do work (`work`, an `IssueWorkHandler`, `server/kernel/work.ts`): unless a plugin binds `projectsTriggersToken`,
  every change, comment and release is handed, in its transaction, to the work handler of each kind it concerns (the
  executor before and after, the kinds a comment mentions or answers), which answers what it started (`RunAttempt[]`;
  `collectRunAttempts` gathers them around a call). A handler asks `projects.subtasks.blockersOf` whether the issue
  waits for unfinished issues and then starts nothing (`skipped: 'blocked'`); it starts nothing either for an issue in
  backlog (`BACKLOG_STATUS`, `skipped: 'dormant'`). When a new `blockedBy` holds the issue, every kind's
  `onBlocked` withdraws the work it had not taken up yet. These skips and withdrawals are recorded on the issue's
  activity as the principal's (`work_skipped`, `work_withdrawn`, with the issues it waits for). It may name the business actions a principal of the kind may be
  given at most (`actions`) and describe executors for a picker (`executor.describe`). `projects.issueContext`
  (`IssueContextProvider`) reads an issue as such an executor needs it, on the caller's connection. When a principal
  can no longer take work (an agent archived or deleted), its plugin's assembler calls
  `projects.issues.releaseExecutor(executor, { actor, name })`: every live, unfinished issue it executes is left with
  no executor, recorded as `executor_changed` with `reason: 'executorRemoved'` and the executor's name ("Executor X was
  removed" on the timeline), and handed to the triggers like any change of executor.
- **Workflows**: the statuses of a project's issues and which kinds may move an issue between them. Every workflow
  keeps the nine built-in statuses (backlog, todo, analysis, proposal review, in progress, in review, blocked, done,
  cancelled); it may rename and recolour them, add its own and restrict the moves. A project picks one; a project without one, and an issue without a project, use the default workflow. The
  plugin ships no workflow: until one is the default, they use the built-in statuses, people move freely and the
  system closes merged work. Workflows are edited in the app (`/config/workflows`, "Workflow templates"). A
  status may carry rules run when an issue enters it: a checklist the issue must complete before moving on (except to
  a closed status), and a notification to the issue's owner. A move may need an approval by the issue's owner, the
  project lead or an admin: it waits as a request until one of them approves it (the issue moves) or rejects it.
- **Contributed status rules and templates**: other plugins add status rule types through `projectsStatusRulesToken`
  (a key, settings validation, what entering the status does in the move's transaction, and a sentence for change
  summaries) and workflows that use them through `projectsWorkflowTemplatesToken` (installed once each; a template
  with `makeDefault` becomes the default when none is). The plugin installs templates in the background from its
  `boot()` and awaits `templates.installed()` in its `ready()`, so the application serves no request before the
  templates added while the plugins booted are workflows; code that needs them earlier awaits `installed()` itself. The
  plugin's own types (`checklist`, `notifyOwner`, `subtasksDone`, `blockersDone`, `startOption`) follow the same contract
  (`server/domains/workflows/built-in-rule-types.ts`) and are looked up in the same registry, in front of the
  contributed ones; `projects.statusRules.list()` lists both. In the browser, `StatusRuleTypesContext` (`client/kit`)
  gives each contributed type its title and hint, the categories it may sit on, its group in the editor's "Add rule"
  menu (`action`, the default, or `condition`), an icon, the settings a new rule starts with, a settings editor and a
  one-line summary; the plugin describes its own types the same way (`client/lib/built-in-rule-types.ts`), and the
  editor has no case of its own for any type. The rules dialog lists the rules a status has as cards, collapsed to
  their title and summary, and adds one from the menu ("When entering", "Entry conditions", "Automatic moves");
  `PmExpandableTextarea` (`client/kit`) is the compact text area for long settings such as an instruction. A rule
  whose plugin is gone stays in the definition: the editor shows it as unavailable and entering the status skips it.
  `POST /api/projects/workflows/{workflowId}/preview` lists what saving a definition would change in the rules, and which rules wake
  someone without anybody confirming it. A contributed type may also hold an entry condition (`canEnter`): every move
  into a status carrying it asks it first, whoever moves (a person, an agent, a plan, an applied approval, the system
  on an event), and a refusal is 400 with the type's own code. An exit condition (`canLeave`) is asked the same way
  before an issue leaves a status carrying the rule.
- **Contributed workflow events and issue marks**: other plugins register workflow events through
  `projectsWorkflowEventsToken` (a dotted key such as `acme.merged`, and the status categories a transition on it may
  leave and enter) and fire one for a batch of issues with `projects.workflowEvents.fire({ event, issueIds, actor?,
note?, details? }, tx?)`: each issue moves along its workflow's `on` transition, as the system, and the activity names
  `actor`. `projects.workflowEvents.target(event, issueId)` says where firing it would take one issue without moving it
  (for a confirmation that says what an action will do). The plugin never knows what an event means. A transition on an event whose plugin is gone stays in the
  definition and shows as unavailable. In the browser, `WorkflowEventsContext` (`client/kit`) titles the events for the
  editor and the timeline. The issues pages show the list and the board, the board by default.
- **Ways to start an issue**: a status carrying a `startOption` rule (with an optional label and hint, text or i18n
  keys) is offered by the New issue form as a process to start in, such as "Design first" on Analysis or "Straight to
  development" on Todo; `GET /api/projects/issues/starts?projectId=` lists them, the workflow's initial status first, and
  nothing while no status carries the rule (the form then shows no choice). `POST /api/projects/issues` takes the choice as
  `statusKey`.
- **Projects**: a lead, members, visibility (`workspace` or `members`), status, dates and linked resources.
- **Issues**: an owner, an executor (nobody, a member, or a principal of another registered kind), a status from the
  project's workflow, priority, dates, a parent, labels and an activity history. Admins can soft-delete and restore.
- **Sub-issues and dependencies**: a sub-issue may have a stage (0–1000); a later stage waits until every earlier
  stage of its siblings is finished (done or closed). An issue may be blocked by others; a link that would make issues
  wait for each other in a cycle is refused. When an issue finishes, the issues waiting only on it are released (their
  executor, or with nobody working on them their owner, is told), and the parent's owner is told when a stage or all
  sub-issues are finished. A workflow may move the parent then: a transition with `on: 'subtasks.done'` and the
  `system` actor. A status may also refuse issues whose sub-issues are open (`subtasksDone`) or that are blocked
  (`blockersDone`). A project may have a setup issue (`Project.setupIssueId`, an issue created with
  `projectSetup: true` by someone who manages the project, one unfinished at a time): every issue created in the
  project after it, except its own sub-issues, is created blocked by it until it is finished. `IssueTriggers` (`onUnblocked`, `onBlocked`, `onSubtasksFinished`) let other plugins react, and
  `subtasks.visibleBlockers(viewer, issueIds)` tells another plugin's board what holds each issue now, in a fixed number
  of reads, leaving out what the viewer may not see.
- **Comments**: threads (a root and its flat replies) in Markdown with mentions (`[@Name](mention://<kind>/<id>)`),
  reactions from a fixed emoji set, resolvable threads, edits and soft deletion by their author, and deletion by a
  moderator. A comment starting with `/note` starts no work. Another plugin writes its own comment kinds through
  `projects.comments.post` (`CommentWriter`) and reacts to new comments through `projectsTriggersToken`
  (`IssueTriggers.onCommentCreated`, answering whom it woke). Writing a comment touches the issue's last activity
  without changing its `revision`, so an open edit of the issue does not conflict.
- **Attachments** (`shared/attachments.ts`, `server/domains/attachments/`): files on an issue (its own) or sent with a
  comment, any type, up to 20 MiB each, stored through the file plugin (`@nocobase/app-plugin-file`) on the App's
  default Drive disk. A file starts as an upload of its uploader's attached to nothing (a person, or an agent working
  on an issue as its own principal) and is attached in the transaction of the change that takes it: an upload onto
  the issue, a comment's `attachmentIds`, or an executed intake plan, whose files go to the issues it created. Whoever
  sees the issue reads its files; the plugin serves them itself, after that check, with safe images inline and
  everything else as a download (`nosniff`, a sandbox CSP, `private, no-store`). Uploading needs `pm.attachments`
  `upload`; the uploader or someone who moderates the issue's comments removes an issue's file, and a comment's files
  go with the comment. Uploads attached to nothing for 24 hours and deleted comments' files are purged every hour.
  Another plugin reads and stores files through `projects.attachments` (`AttachmentService`); in the browser, the App
  shows and previews them on its own issue page.
- **Followers**: an issue's creator, owner, people executing it, commenters and those mentioned follow it; anyone who
  sees it may follow or unfollow.
- **Notices**: the plugin plans who to tell inside the change's transaction (`server/domains/notices/`: comments,
  mentions, status changes, owner and executor assignments, with rules other plugins add through
  `projectsNoticeRulesToken`), drops the actor and lower-priority duplicates, and sends after commit only to those who
  may still see the issue (`ProjectsAccess.permissionsOfUser`). Information about the same thing carries a `group`
  so an inbox can merge it.
- **Batch reads for boards**: `issueQueries.matching(viewer, query, { executorType?, issueIds?, limit? })` answers, in
  a fixed number of reads, the viewer's issues within the list's filters that an executor of a kind works on (unless
  finished) or that are among the ids given (whatever their status), with `truncated` past the limit;
  `approvals.pendingOn(issueIds)` the pending approval requests on them, and `subscriptions.followedBy(conn, userId,
issueIds)` those of them a person follows. An application's board of work joins its own records to issues with
  them, without a query per issue.
- **Operation plans** (`shared/plans.ts`, `server/domains/plans/`): a short list of changes (create or update an
  issue, comment, add or remove a dependency, create a project; 1–50 rows, later rows may refer to what earlier ones
  create) that one person, the decider, reviews and executes as a whole. Creating, editing and retrying a plan
  rehearse it: every row runs as the decider in one transaction that always rolls back (a savepoint per row), the
  triggers only report whom they would wake (`Tx.rehearsal`, `kernel/work.ts`) and nothing is announced; each row
  gets its errors, wakes, risk flags and the baseline of its target. Execution is one transaction as the person who
  clicks; a target changed since the rehearsal makes the plan `stale` and nothing is applied. An executed plan can be
  undone for 24 hours in one step: a preview (`previewUndo`) lists the reverse rows and what they leave alone because
  someone changed it since, and undoing applies them at once in one transaction; no other plan is created. The plan
  card shows and decides a plan wherever the application places it (for example, in the conversation that proposed it); the
  plugin lists plans nowhere of its own. Changes
  made through a plan, or by an agent for a person (`Actor.via = 'agent'` with its trace), show on the timeline as
  "via ‹Agent›" or "via ‹Agent›'s plan" (`Activity.via`). Other plugins use `projects.plans` (`PlanService`) and hear
  decisions through `projectsPlanHooksToken` (`PlanHooks.onPlanDecided`). A plan is visible to its decider and, for a
  status rule's plan about an issue, to the issue's owner and editors.
- **Intake with AI** (`shared/intake-ai.ts`, `server/domains/plans/intake/intake.ai.*`): as the old NocoProject, AI
  splits requirements into drafts ("AI split"), revises the drafts by one instruction ("Ask AI to revise", with the
  rows it added or changed highlighted and an undo), and breaks an issue down into sub-issue drafts ("AI breakdown" on
  the issue page). The plugin runs no model: the application binds an organiser (`projectsIntakeOrganizerToken`,
  `IntakeOrganizer`), which is handed each request's task (`IntakeAiTask`, worded for any runtime by
  `intakeAiInstructions` and `intakeAiMaterial`) and answers later with `projects.intakeAi.deliver` (the drafts) or
  `ended`. A request is a job (`pmIntakeJobs`) the page follows (`progress`: queued and why, or the organiser's newest
  activity) and the person may cancel. Delivered drafts become a pending intake plan the person decides, rehearsed with
  their own permissions, in place of the draft the request was made on; AI never creates an issue. Asking needs
  `pm.issues` `create`; without an organiser the AI draft tab offers the rule split only. an application's organiser is an agent
  run on a runner (`server/agents/intake/`).

## Server API

Everything is under `/api/projects` and needs a session (401 otherwise). Responses are `{ data }`, lists `{ data, meta }`; inputs are validated (400 `INVALID_INPUT`, domain `app`, with `fieldViolations`; JSON bodies are strict). Fixed segments come before `/{projectId}`.

| Method and path                                                                    | What it does                                                |
| ---------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| `GET /me`                                                                          | The caller with their permissions                           |
| `GET /members`, `GET /apiKeyActors`, `GET /executors`                              | Active members; API key identities; other executors         |
| `GET /mentionCandidates?q&issueId&pageSize`                                        | The `@` list: every mentionable kind's candidates           |
| `GET/POST /invitations`, `POST …/{invitationId}/resend`, `DELETE …/{invitationId}` | Member invitations                                          |
| `GET /settings`, `PATCH /settings`                                                 | Workspace settings                                          |
| `GET/POST /labels`, `PATCH/DELETE /labels/{labelId}`                               | Labels                                                      |
| `GET/POST /workflows`, `GET/PATCH/DELETE /workflows/{workflowId}`                  | Workflows; a new one is a copy (`copyFrom`)                 |
| `POST /workflows/{workflowId}/preview`                                             | What saving a definition would change                       |
| `POST /workflows/{workflowId}/setDefault`                                          | Makes a workflow the default                                |
| `GET/POST /` , `GET/PATCH/DELETE /{projectId}`                                     | Projects                                                    |
| `POST /{projectId}/members`, `DELETE …/members/{userId}`                           | Project members (201 the member added; 204)                 |
| `POST /{projectId}/resources`, `PATCH/DELETE …/resources/{resourceId}`             | Project resources                                           |
| `GET /issues?…&orderBy&pageSize&pageToken`                                         | A page of issues, cursor-paginated                          |
| `GET /issues/board`                                                                | The board: a column per status, each a first page           |
| `GET /issues/statuses`, `GET /issues/starts`                                       | A workflow's statuses; the ways to start an issue           |
| `POST /issues`, `GET/PATCH/DELETE /issues/{issueId}`                               | Issues, by id or identifier (`PM-12`)                       |
| `POST /issues/{issueId}/restore`                                                   | Restores a deleted issue                                    |
| `GET /issues/{issueId}/activities?pageSize&pageToken`                              | Older activities                                            |
| `GET/POST /issues/{issueId}/comments`                                              | Older comment threads; posts a comment or reply             |
| `PATCH/DELETE /comments/{commentId}`                                               | Edits or deletes a comment                                  |
| `POST /comments/{commentId}/react`, `…/unreact`                                    | Adds or removes the caller's reaction (`{ emoji }`)         |
| `POST /comments/{commentId}/resolve`, `…/unresolve`                                | Resolves or reopens a thread (on its root)                  |
| `POST /issues/{issueId}/subscribe`, `…/unsubscribe`                                | Follows or unfollows the issue                              |
| `GET/POST /issues/{issueId}/attachments`                                           | The issue's own files; uploads one onto it                  |
| `POST /attachments`                                                                | Uploads one file, attached to nothing yet                   |
| `GET /attachments/{attachmentId}`, `…/content`, `DELETE`                           | A file, its bytes (`?download=true`), removing it           |
| `GET /issues/{issueId}/checklists`                                                 | Every checklist the issue has had                           |
| `PATCH /issues/{issueId}/checklists/{statusKey}/items/{itemKey}`                   | Checks or unchecks an item (`{ checked }`)                  |
| `POST /issues/{issueId}/dependencies`                                              | Adds a link (`{ dependsOnIssueId, type }`)                  |
| `DELETE /issues/{issueId}/dependencies/{dependencyId}`                             | Removes a link                                              |
| `POST /issues/{issueId}/removeDependency`                                          | Removes the link to an issue (`{ dependsOnIssueId, type }`) |
| `GET /approvals`                                                                   | Status changes waiting for the caller's approval            |
| `POST /approvals/{approvalId}/approve`, `…/reject`                                 | An approver decides (`{ comment? }`)                        |
| `POST /approvals/{approvalId}/withdraw`                                            | Whoever asked withdraws the request                         |
| `POST /plans/rehearse`                                                             | Rehearses a plan and stores nothing                         |
| `GET/POST /plans`, `GET/PATCH /plans/{planId}`                                     | Operation plans: list, create, read, edit rows              |
| `POST /plans/{planId}/execute`, `…/retry`, `…/void`                                | Decides a plan (`{ revision }`)                             |
| `POST /plans/{planId}/undo`                                                        | `{ dryRun: true }` previews undoing; else undoes            |
| `POST /intake/files`, `DELETE /intake/files/{fileId}`                              | The caller's intake uploads                                 |
| `POST /intake/split`, `POST /intake/extractTexts`                                  | The rule split; the uploads' text                           |
| `GET /intake/aiAvailability`                                                       | Whether AI can be asked                                     |
| `POST /intake/aiJobs`, `GET …/{jobId}`, `POST …/{jobId}/cancel`                    | A request to AI; cancelling it                              |

Cursor lists (issues, activities, comment threads, plans) take `pageSize` (20 by default, at most 100; plans 50) and `pageToken`, and answer `meta.nextPageToken` until the last page. `orderBy` on issues is `updatedAt`, `createdAt`, `number` or `priority`, optionally followed by `asc` or `desc` (`updatedAt desc` by default). The other lists are answered whole with `meta.total`. A scoped API key may not use `/intake` or `/plans` (403 `SCOPED_KEY_FORBIDDEN`).

Errors are the standard error body with domain `projects`; clients branch on `reason`, and `metadata` carries the details. A missing resource the URL names is 404 `<RESOURCE>_NOT_FOUND` (such as `ISSUE_NOT_FOUND`); a project or issue named in the query that does not exist is 400 with a field violation. `PATCH /issues/{issueId}` and `PATCH /workflows/{workflowId}` need the `revision` the caller read; a stale one is 409 `ABORTED` `REVISION_CONFLICT`. An invalid workflow is 400 `INVALID_WORKFLOW` with every problem in `metadata.issues` (`{ path: 'states[3].key', message }`). A change that would leave an issue in a status its workflow no longer has (editing a workflow, switching a project's, choosing another default) is 400 `FAILED_PRECONDITION` `WORKFLOW_STATUS_CONFLICT` with the count per status and project in `metadata.conflicts`. `PATCH /issues/{issueId}` answers `{ data: { issue, pendingApproval } }`: 200 with `pendingApproval: null` once applied, or 202 with the request when the status change waits for approval, applying nothing else of the request; another request for the same issue is 400 `APPROVAL_PENDING`. A dependency that would close a cycle is 400 `DEPENDENCY_CYCLE` (`metadata.via`), one too deep to check 400 `DEPENDENCY_TOO_DEEP`, a duplicate 409 `ALREADY_EXISTS` `DEPENDENCY_EXISTS`; entering a status that waits for sub-issues or blockers is 400 `FAILED_PRECONDITION` `SUBTASKS_OPEN` or `ISSUE_BLOCKED`. A plan with a failing row is 400 `PLAN_INVALID` with every row's check in `metadata.rows`; deciding a plan that is not open is 400 `PLAN_NOT_OPEN`, an expired one 400 `PLAN_EXPIRED`; undoing after the window is 400 `UNDO_EXPIRED`, with nothing left to revert 400 `NOTHING_TO_UNDO`, and when something changed since the preview 409 `ABORTED` `UNDO_STALE`. Other refusals by state are 400 `FAILED_PRECONDITION` too.

## Workflows and the lifecycle module

`server/lifecycle/` is a self-contained state machine for records, with no import from the domains, so it can become
a platform package: a definition as data (states with a category, transitions `from → to` naming who may take them,
`*` for any state, and event transitions `on` an event the definition lists, which only `fire` takes), `validateDefinition` (paths for every problem, plus rules the application passes in), `compile`
(the questions the application asks) and `move`, the one path through which a state changes. It runs in the
caller's unit of work, in order: who may (the actor on the transition, and a registered "who may" rule over the record),
the guards of the state left and the state entered, an approval when a transition needs one, the caller's write, and
the entry actions, each in its own savepoint. Rules are registered by name (`createLifecycleRegistry`: state rules,
"who may" rules, approvers); a definition names them with their settings, and validation checks both.
`server/domains/workflows/` stores the definitions and adds this plugin's rules: `workflow.rules.ts` (the built-in
statuses, each transition within what its kinds allow, people able to leave every status, one rule of a kind per
status) and
`workflow.registry.ts` (every status rule type, built in or contributed, as a lifecycle state rule, and the approvers
`owner`, `projectLead`, `admin`). When several transitions match a move (`* → *` and `in_review → done`), the move
takes them all, and needs an approval when any of them does; a move on an event never waits for one.
`server/domains/approvals/` keeps the requests; a request has its own lifecycle in code (pending → approved, rejected,
withdrawn or stale, each decision a transition with a "who may" rule). Approving moves the issue as the requester's
move, checked again; when it no longer passes, the request goes stale. Notices (`server/providers/notifications.ts`:
the owner told, approvers asked to decide, the requester told the outcome) go to `projectsNoticesToken` when the App
binds it (`ProjectsNotices`: `send` each notice with its kind, type, issue and approval request; `resolve` a decision
once its request is decided) — the assembling application keeps its inbox that way. A request another kind (an agent) made tells the
issue's owner its outcome instead of the requester; an approved request that no longer applies (its conditions failed
when it was approved) tells the approvers and whoever asked, except the approver (`approval_stale`). The issue page lists
the last five decided requests (`IssueDetail.recentApprovals`). Without it they go straight to the notification
plugin's in-app channel `projects.inboxChannel` names (`inbox` by default) when that channel is configured.

## Permissions

What can be granted (`shared/access.ts`); the application stores and assigns the roles that hold it:

| Kind             | Id                                         | Actions or levels                                         |
| ---------------- | ------------------------------------------ | --------------------------------------------------------- |
| Business actions | `pm.projects`                              | `view`, `create`, `manage`, `delete`                      |
| Business actions | `pm.issues`                                | `view`, `create`, `edit`, `comment`, `moderate-comments`, |
|                  |                                            | `close`, `change-owner`, `delete`                         |
| Business actions | `pm.attachments`                           | `upload`                                                  |
| Settings items   | `pm.general`, `pm.labels`, `pm.workflows`  | `read`, `update`                                          |
| Settings items   | `pm.members`                               | `read`, `invite`, `assign`, `define-roles`                |
| Pages            | `pm-my-issues`, `pm-issues`, `pm-projects` | `access`                                                  |

Each business action reaches none, related or all records, granted as the action of its level on the `pm` resource
type (`levelActionsOf`: `edit.related`, `edit.all`; an action without related records as itself; `RELATIONS`: projects the user can see or leads,
issues in those projects or owned by them); the services read the level from the request's `Permissions` and apply
the related rules themselves. Creating an issue needs `create`, which `edit` does not imply; creating a label while
editing an issue still needs `pm.labels` `update`. Commenting, replying and resolving threads need `comment` (related:
the issues one sees); authors edit and delete their own comments; deleting someone else's needs `moderate-comments`
(related: issues one owns or whose project one leads). Reacting, following and reading files need only seeing the issue; uploading a file needs `pm.attachments` `upload` (related: the issues one sees) besides `edit` (onto the issue) or `comment` (with a comment). Pages are granted on their own: a role may act through the API on
what it has no page for.

The plugin seeds no roles: the application that assembles it seeds its own (the assembling application:
`database/main/seeds/202610010022_acme_roles.ts`).

## Pages

| Path                                  | What it shows                                               |
| ------------------------------------- | ----------------------------------------------------------- |
| `/my-issues/owned`, `executing`       | The viewer's issues, as owner or executor                   |
| `/issues` (`?view=board` or `list`)   | Every visible issue; filters, search and order in the URL   |
| `/issues/new` (`?tab=ai` or `manual`) | The New issue dialog: AI draft (intake) or one issue        |
| `/issues/new?tab=ai&job=:id`          | The AI draft tab following a request to AI                  |
| `/issues/:id`, `/issues/plans/:id`    | One issue, by id or identifier; one plan, by its id         |
| `/projects`, `/projects/new`          | Projects; a new one (a project's page is the application's) |

As the old NocoProject had it, My issues has "I own" and "I execute" only, and the New issue dialog opens on its "AI
draft" tab (the last tab used is remembered in the browser): requirements typed or uploaded are split into a draft of
issues, edited row by row and created together, after which the dialog closes. Its manual tab offers the workflow's ways
to start an issue as its process. A change that would start an executor of another kind working asks "Start now?"
first, as the old NocoProject asked: giving an agent the issue (on creation, a sub-issue, or in the properties) or
moving an issue it executes out of backlog (a status change or a board drag). Nothing starts in backlog or a finished
status, so a change landing there asks nothing. Approvals are decided on the issue
page and wherever the application sends their notices (for example, its inbox).

The settings pages are exported for the application to route under its own `/config` (`client/config.ts`: the issue
prefix, labels, workflows and one workflow), and components it reuses on its member pages are exported from
`client/kit.ts`. The application routes an issue's page itself and presents it (for example, with the UI Library's
`issue-detail`, `comment-thread` and `attachment-list`) over the headless parts in `client/issues.ts`: the issue
(`useIssueDetail`), its property changes (`useIssueUpdate`, and `useConfirmedUpdate` for "Start now?"), every other
change of the page (`useIssuePageActions`), the activity line (`useIssueTimeline`, `useIssueCommentActions`,
`useMentionSearch`, `useAttachmentUploads`), "Break into sub-issues" (`useIntakeBreakdown`), and the permission and
wording helpers. It routes a project's page the same way, as a child of the plugin's `/projects` (`projectsRoute` from
`client/pages`), over the headless parts in `client/projects.ts`: the project with its statuses and workflow
(`useProjectDetail`, `useProjectStatuses`, `useProjectWorkflow`), its property changes (`useProjectUpdate`), members and
visibility (`useProjectMembership`), working directories (`useProjectResources`, `useResourceValidation`), deleting it
(`useDeleteProject`), and the progress, numbers and permission helpers. The pages are behind the `pm-my-issues`, `pm-issues` and `pm-projects` page grants. They hide
what the server would refuse (`client/lib/permissions.ts` mirrors its rules); the server still checks every request.
Open pages refresh when the server announces a change on the `pm:changes` realtime topic.

## Layout

- `shared/`: types and constants the server and the client share.
- `server/kernel/`: infrastructure with no business rules (errors, events, transactions, pagination, validation).
- `server/access/`: how a request becomes a `Viewer` with resolved permissions.
- `server/lifecycle/`: the record state machine behind workflows (see above).
- `server/domains/<name>/`: one folder per domain: `*.store.ts` (tables), `*.access.ts` (who sees what),
  `*.service.ts` (writes), `*.routes.ts` (HTTP), `index.ts` (the domain's public surface).
- `server/composition.ts`: wires the domains; `server/providers/` registers them with the app.
- `client/api/`: the typed `/api/projects` client and the query keys; `client/hooks/`, `client/lib/`: the viewer, notices,
  permissions, statuses and formatting the pages share.
- `client/components/`: `ui/` holds shadcn primitives (registry output, not edited by hand); `pm-*` are this plugin's
  own components.
- `client/pages/<area>/`: one folder per page area.

## Verification

```bash
pnpm --filter @nocobase/app-plugin-projects check
```
