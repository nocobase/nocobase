# @nocobase/app-plugin-projects

Projects, issues, fixed statuses, labels and members for a NocoBase application.

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
  ids are named, whether it may execute issues (and who may give it work), whether it may be mentioned, the status
  moves its principals may make (`moves`, with an optional `mayMove` check per principal and issue), and the executor
  a new issue gets when it names none (`defaultExecutor`). Executors, activity, mentions and status moves name a kind
  by its key; the browser reads the list from `GET /api/projects/me` (`kinds`). A kind may
  also do work (`work`, an `IssueWorkHandler`, `server/kernel/work.ts`): unless a plugin binds `projectsTriggersToken`,
  every change, comment and release is handed, in its transaction, to the work handler of each kind it concerns (the
  executor before and after, the kinds a comment mentions or answers), which answers what it started (`RunAttempt[]`;
  `collectRunAttempts` gathers them around a call). A handler that opts into `observesIssueChanges` also receives creations and updates with an empty or different executor kind, once per change. Service writes pass their already authorized viewer to the observer, so nested routing need not acquire a second connection for permission reads. Issue responses and update events use the final snapshot after these transactional handlers. Creation in `in_progress` or a transition into it starts work; there is no separate start option. A handler asks `projects.subtasks.blockersOf` whether the issue
  waits for unfinished issues and then starts nothing (`skipped: 'blocked'`); it starts nothing either for an issue in
  backlog (`BACKLOG_STATUS`, `skipped: 'dormant'`), or for a principal's comment past a limit the kind keeps
  (`skipped: 'limited'`). A comment of anyone but the system reaches the handlers, with the person it
  was written for (`CommentChange.userId`). When a new `blockedBy` holds the issue, every kind's
  `onBlocked` withdraws the work it had not taken up yet. These skips and withdrawals are recorded on the issue's
  activity as the principal's (`work_skipped`, `work_withdrawn`, with the issues it waits for). It may name the business actions a principal of the kind may be
  given at most (`actions`) and describe executors for a picker (`executor.describe`). `projects.issueContext`
  (`IssueContextProvider`) reads an issue as such an executor needs it, on the caller's connection. When a principal
  can no longer take work (an agent archived or deleted), its plugin's assembler calls
  `projects.issues.releaseExecutor(executor, { actor, name })`: every live, unfinished issue it executes is left with
  no executor, recorded as `executor_changed` with `reason: 'executorRemoved'` and the executor's name ("Executor X was
  removed" on the timeline), and handed to the triggers like any change of executor.
- **Statuses**: six, fixed for every project (`shared/statuses.ts`): `backlog` (nothing starts), `in_progress`,
  `blocked` (waiting for a person), `in_review` (waiting to be accepted), `done` and `cancelled`. People move an issue
  between any two of them; a principal of another kind only along its kind's `moves`, and only when its `mayMove`
  agrees; the system only along a status event. Entering `blocked` or `in_review` tells the issue's owner, unless the
  owner moved it (`owner_notified`). The moves go through `server/lifecycle` (below), compiled from the statuses, the
  registered kinds' moves and the registered status events (`domains/statuses/`).
- **Status events**: other plugins register status events through `projectsStatusEventsToken` (a dotted key such as
  `acme.merged`, the statuses it moves an issue out of, `from`, and the status it moves it to, `to`) and fire one for a
  batch of issues with `projects.statusEvents.fire({ event, issueIds, actor?, note?, details? }, tx?)`: each issue in
  one of `from` moves to `to`, as the system, and the activity names `actor`. `projects.statusEvents.target(event,
issueId)` says where firing it would take one issue without moving it (for a confirmation that says what an action
  will do). The plugin never knows what an event means. In the browser, `StatusEventsContext` (`client/kit`) titles the
  events for the timeline. The issues pages show the list and the board, the board by default.
- **Starting an issue**: a new issue starts in `backlog` or `in_progress` (`START_STATUSES`; `backlog` when the request
  names none, `DEFAULT_START_STATUS`), and the New issue form asks "Start now" or "Later". Created in `in_progress`, or
  moved there, an issue's work starts.
- **Projects**: a lead, members, visibility (`workspace` or `members`), status, dates and linked resources.
- **Issues**: an owner, an executor (nobody, a member, or a principal of another registered kind), a status,
  priority, dates, a parent, labels and an activity history. Admins can soft-delete and restore.
- **Sub-issues and dependencies**: a sub-issue may have a stage (0–1000); a later stage waits until every earlier
  stage of its siblings is finished (done or closed). An issue may be blocked by others; a link that would make issues
  wait for each other in a cycle is refused. When an issue finishes, the issues waiting only on it are released (their
  executor, or with nobody working on them their owner, is told), and the parent's owner is told when a stage or all
  sub-issues are finished; the parent's own status does not move on its own. A project may have a setup issue (`Project.setupIssueId`, an issue created with
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

Server writers may pass an application-defined `message: { type, params }` alongside `origin` in `projects.comments.post` options. The namespaced type must match `^[a-z][a-z0-9-]*(\.[a-zA-Z][a-zA-Z0-9]*)+$` and be at most 100 characters. Parameters have at most 10 keys, with string, finite number or boolean values only; each string is at most 500 characters. Values are preserved without coercion or trimming. The writer validates and stores this generic envelope in the existing origin JSON. Reads expose only its type and public parameters as optional `IssueComment.message`, never other provenance, and omit it after deletion. Ordinary HTTP create/edit bodies reject this field. Applications define and validate their own message names and parameter contracts before writing, translate recognized types, and keep safe fallback Markdown in `content` for unknown types. Adding an application message needs no framework change, migration or additional read/write.

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
  finished) or that are among the ids given (whatever their status), with `truncated` past the limit, and
  `subscriptions.followedBy(conn, userId, issueIds)` those of them a person follows. An application's board of work joins its own records to issues with
  them, without a query per issue.
- **Hierarchy reads**: `issueQueries.hierarchy(viewer, query)` returns the complete independently authorized live issue scope, filtered matching IDs and internal dependency-wait facts before paging. It is an uncapped input for application-owned grouping, never a substitute for authorization. `hierarchy(viewer, query, { unfinishedOnly: true, includeIds })` instead reads unfinished tasks, explicitly included visible tasks and contiguous visible ancestors; dependency facts are scoped to those targets without exposing hidden blockers. `hierarchySource(viewer, query)` supplies authorized, filtered SQL relations for database-side hierarchy aggregation and pagination without materializing historical records. `visibleIds(viewer, ids)` reauthorizes explicit IDs without row or relationship hydration. `hierarchyItems(viewer, ids)` hydrates at most 500 independently reauthorized rows with visible child/dependency counts; callers must replace raw parent IDs at unreadable boundaries. Applications own attention policy, grouping and continuation consistency. No new task statuses or persistence are required.
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
  status rule's plan about an issue (from earlier versions), to the issue's owner and editors.
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

Invitation create/resend results include a shareable `inviteUrl` for an authorized original inviter using an unscoped person credential, regardless of email delivery. An invitation closed or rotated before its queued send returns `emailSent=false` without a link; other recipients, including existing accounts joining projects, still complete. Global user creation or role assignment permissions are not needed to copy a project invitation. `POST /api/projects/invitations/{invitationId}/resend?sendEmail=false` generates a new link without email, invalidating the old invitation. Member settings confirm this before generating a link, then offer a separate Copy action. Current project access is checked again; other managers can resend email but do not receive links, and scoped credentials remain email-only. Lists never expose tokens.

New accounts register directly from the invitation link with a name and password; acceptance leaves `emailVerified=false`. Email delivery is optional: authorized original inviters can privately forward the link when the email channel is absent or fails. Links use `app.publicOrigin` when configured, otherwise the invitation request origin. Existing accounts must sign in with the invited email. Acceptance consumes only the supplied invitation and applies only its grants; handlers run in its transaction and roll back account creation on failure.

| Method and path                                                                    | What it does                                                |
| ---------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| `GET /me`                                                                          | The caller with their permissions                           |
| `GET /members`, `GET /apiKeyActors`, `GET /executors`                              | Active members; API key identities; other executors         |
| `GET /mentionCandidates?q&issueId&pageSize`                                        | The `@` list: every mentionable kind's candidates           |
| `GET/POST /invitations`, `POST …/{invitationId}/resend`, `DELETE …/{invitationId}` | Member invitations                                          |
| `GET /settings`, `PATCH /settings`                                                 | Workspace settings                                          |
| `GET/POST /labels`, `PATCH/DELETE /labels/{labelId}`                               | Labels                                                      |
| `GET/POST /` , `GET/PATCH/DELETE /{projectId}`                                     | Projects                                                    |
| `POST /{projectId}/members`, `DELETE …/members/{userId}`                           | Project members (201 the member added; 204)                 |
| `POST /{projectId}/resources`, `PATCH/DELETE …/resources/{resourceId}`             | Project resources                                           |
| `GET /issues?…&orderBy&pageSize&pageToken`                                         | A page of issues, cursor-paginated                          |
| `GET /issues/board`                                                                | The board: a column per status, each a first page           |
| `GET /issues/statuses`                                                             | The fixed statuses                                          |
| `POST /issues`, `GET/PATCH/DELETE /issues/{issueId}`                               | Issues, by id or identifier (`PM-12`)                       |
| `POST /issues/{issueId}/restore`                                                   | Restores a deleted issue                                    |
| `GET /issues/{issueId}/activities?pageSize&pageToken`                              | Older activities                                            |
| `GET/POST /issues/{issueId}/comments`                                              | Older comment threads; posts a comment or reply             |
| `PATCH/DELETE /comments/{commentId}`                                               | Edits or deletes a comment                                  |
| `POST /comments/{commentId}/react`, `…/unreact`                                    | Adds or removes the caller's reaction (`{ emoji }`)         |
| `POST /comments/{commentId}/resolve`, `…/unresolve`                                | Resolves or reopens a thread (on its root)                  |
| `POST /issues/{issueId}/subscribe`, `…/unsubscribe`                                | Follows or unfollows the issue                              |
| `GET/POST /issues/{issueId}/attachments`                                           | The issue's own files; uploads one onto it                  |
| `GET /issues/{issueId}/screenshots`                                                | Latest 100 live Agent comment images and comment provenance |
| `POST /attachments`                                                                | Uploads one file, attached to nothing yet                   |
| `GET /attachments/{attachmentId}`, `…/content`, `DELETE`                           | A file, its bytes (`?download=true`), removing it           |
| `POST /issues/{issueId}/dependencies`                                              | Adds a link (`{ dependsOnIssueId, type }`)                  |
| `PATCH /issues/{issueId}/dependencies/{dependencyId}`                              | Changes a link type (`{ type, expectedType }`) atomically   |
| `DELETE /issues/{issueId}/dependencies/{dependencyId}`                             | Removes a link                                              |
| `POST /issues/{issueId}/removeDependency`                                          | Removes the link to an issue (`{ dependsOnIssueId, type }`) |
| `POST /plans/rehearse`                                                             | Rehearses a plan and stores nothing                         |
| `GET/POST /plans`, `GET/PATCH /plans/{planId}`                                     | Operation plans: list, create, read, edit rows              |
| `POST /plans/{planId}/execute`, `…/retry`, `…/void`                                | Decides a plan (`{ revision }`)                             |
| `POST /plans/{planId}/undo`                                                        | `{ dryRun: true }` previews undoing; else undoes            |
| `POST /intake/files`, `DELETE /intake/files/{fileId}`                              | The caller's intake uploads                                 |
| `POST /intake/split`, `POST /intake/extractTexts`                                  | The rule split; the uploads' text                           |
| `GET /intake/aiAvailability`                                                       | Whether AI can be asked                                     |
| `POST /intake/aiJobs`, `GET …/{jobId}`, `POST …/{jobId}/cancel`                    | A request to AI; cancelling it                              |

Relationship conversion preserves the link ID and checks the type the caller read (`expectedType`). A stale change returns 409 `DEPENDENCY_CHANGED`; if the target relationship already exists, it returns 409 `DEPENDENCY_EXISTS` and keeps both links. A related link may be converted from either end: the current issue becomes the waiting issue when changed to `blockedBy`.

Operations that add explicit or implicit waits (dependencies, conversions, issue creation, parent/stage changes and restores) share a dedicated database graph revision row. Its conditional increment protects cycle detection and writes until the outer transaction commits, across processes and projects. An outdated transaction snapshot returns 409 `DEPENDENCY_GRAPH_CHANGED`; reload and retry the whole operation. Every issue creation takes this protection before allocating its number, so plans that create issues and add dependencies use the same lock order. Standalone creates without dependencies lock the row without advancing the graph revision, so independent parallel creates still succeed without retrying each other. The revision is separate from settings/counters so MySQL reads of those rows after writing them cannot disguise an old graph snapshot. Restoring an issue is rejected if its waits would now create a cycle. Every relationship write, including both removal endpoints, acquires this protection before reading its type and endpoints, keeping duplicate checks, activity and release notifications consistent with conversions. Issue status and project changes, status events and deletion take the same guard before writing an issue, so concurrent changes cannot each see an old blocker and miss the last release. Automatic parent/stage completion keeps the originating guard; ordinary edits that cannot change waits do not acquire it. Plans acquire the guard without advancing its revision before their first row, including rehearsal and undo, so earlier issue edits cannot reverse the lock order of a later graph write.

Cursor lists (issues, activities, comment threads, plans) take `pageSize` (20 by default, at most 100; plans 50) and `pageToken`, and answer `meta.nextPageToken` until the last page. `orderBy` on issues is `updatedAt`, `createdAt`, `number` or `priority`, optionally followed by `asc` or `desc` (`updatedAt desc` by default). The other lists are answered whole with `meta.total`. A scoped API key may not use `/intake` or `/plans` (403 `SCOPED_KEY_FORBIDDEN`).

Errors are the standard error body with domain `projects`; clients branch on `reason`, and `metadata` carries the details. A missing resource the URL names is 404 `<RESOURCE>_NOT_FOUND` (such as `ISSUE_NOT_FOUND`); a project or issue named in the query that does not exist is 400 with a field violation. `PATCH /issues/{issueId}` needs the `revision` the caller read; a stale one is 409 `ABORTED` `REVISION_CONFLICT`. It answers 200 `{ data: { issue } }`. A status that does not exist, or a new issue in any status but `backlog` and `in_progress`, is 400 `INVALID_STATUS`; a move the caller's kind may not make is 400 `TRANSITION_NOT_ALLOWED`. A dependency that would close a cycle is 400 `DEPENDENCY_CYCLE` (`metadata.via`), one too deep to check 400 `DEPENDENCY_TOO_DEEP`, a duplicate 409 `ALREADY_EXISTS` `DEPENDENCY_EXISTS`. A plan with a failing row is 400 `PLAN_INVALID` with every row's check in `metadata.rows`; deciding a plan that is not open is 400 `PLAN_NOT_OPEN`, an expired one 400 `PLAN_EXPIRED`; undoing after the window is 400 `UNDO_EXPIRED`, with nothing left to revert 400 `NOTHING_TO_UNDO`, and when something changed since the preview 409 `ABORTED` `UNDO_STALE`. Other refusals by state are 400 `FAILED_PRECONDITION` too.

## Statuses and the lifecycle module

`server/lifecycle/` is a self-contained state machine for records, with no import from the domains, so it can become
a platform package: a definition as data (states with a category, transitions `from → to` naming who may take them,
`*` for any state, and event transitions `on` an event, which only `fire` takes), `validateDefinition`, `compile` (the
questions the application asks) and `move`, the one path through which a state changes. It runs in the caller's unit
of work, in order: who may (the actor on the transition, and a registered "who may" rule over the record), the guards
of the state left and the state entered, the caller's write, and the entry actions, each in its own savepoint. Rules
are registered by name (`createLifecycleRegistry`).

`server/domains/statuses/` compiles the fixed statuses into such a definition: people `* → *`, each registered kind's
`moves` (behind a "who may" rule asking the kind's `mayMove`), and each status event's transitions for the system; the
definition is compiled again whenever the kinds or events change. The entry action `notifyOwner` on `blocked` and
`in_review` records `owner_notified` and announces it. Notices (`server/providers/notifications.ts`) go to
`projectsNoticesToken` when the App binds it (`ProjectsNotices`: `send` each notice with its kind, type and issue) —
the assembling application keeps its inbox that way. Without it they go straight to the notification plugin's in-app
channel `projects.inboxChannel` names (`inbox` by default) when that channel is configured.

## Permissions

What can be granted (`shared/access.ts`); the application stores and assigns the roles that hold it:

| Kind             | Id                                         | Actions or levels                                         |
| ---------------- | ------------------------------------------ | --------------------------------------------------------- |
| Business actions | `pm.projects`                              | `view`, `create`, `manage`, `delete`                      |
| Business actions | `pm.issues`                                | `view`, `create`, `edit`, `comment`, `moderate-comments`, |
|                  |                                            | `close`, `change-owner`, `delete`                         |
| Business actions | `pm.attachments`                           | `upload`                                                  |
| Settings items   | `pm.general`, `pm.labels`                  | `read`, `update`                                          |
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
| `/my-issues`                          | The viewer's owned or executed issues, each once            |
| `/issues` (`?view=board` or `list`)   | Every visible issue; filters, search and order in the URL   |
| `/issues/new` (`?tab=ai` or `manual`) | The New issue dialog: AI draft (intake) or one issue        |
| `/issues/new?tab=ai&job=:id`          | The AI draft tab following a request to AI                  |
| `/issues/:id`, `/issues/plans/:id`    | One issue, by id or identifier; one plan, by its id         |
| `/projects`, `/projects/new`          | Projects; a new one (a project's page is the application's) |

My tasks combines owned and executed issues, and the New issue dialog opens on its "AI draft" tab (the last tab used is remembered in the browser): requirements typed or uploaded are split into a draft of issues, edited row by row and created together, after which the dialog closes. Its manual tab asks when the issue starts: "Start now" (`in_progress`) or "Later" (`backlog`), and preselects the default executor. Nothing asks "Start now?" any more: moving an issue to `in_progress` starts its work.

Applications that create tasks through conversation can render the retained create and subtask pages under `IssueCreationModeContext.Provider` (from `client/kit`) with `value='manual'`. This shows only the original guarded form, ignoring old AI tab parameters and preferences, without changing the default plugin pages.

The settings pages are exported for the application to route under its own `/config` (`client/config.ts`: the issue
prefix and labels), and components it reuses on its member pages are exported from
`client/kit.ts`. The application routes an issue's page itself and presents it (for example, with the UI Library's
`issue-detail`, `comment-thread` and `attachment-list`) over the headless parts in `client/issues.ts`: the issue
(`useIssueDetail`), its property changes (`useIssueUpdate`; `useConfirmedUpdate` applies a change at once), every other
change of the page (`useIssuePageActions`), the activity line (`useIssueTimeline`, `useIssueCommentActions`,
`useMentionSearch`, `useAttachmentUploads`), "Break into sub-issues" (`useIntakeBreakdown`), and the permission and
wording helpers. It routes a project's page the same way, as a child of the plugin's `/projects` (`projectsRoute` from
`client/pages`), over the headless parts in `client/projects.ts`: the project with the statuses
(`useProjectDetail`, `useProjectStatuses`), its property changes (`useProjectUpdate`), members and
visibility (`useProjectMembership`), working directories (`useProjectResources`, `useResourceValidation`), deleting it
(`useDeleteProject`), and the progress, numbers and permission helpers. The pages are behind the `pm-my-issues`, `pm-issues` and `pm-projects` page grants. They hide
what the server would refuse (`client/lib/permissions.ts` mirrors its rules); the server still checks every request.
Open pages refresh when the server announces a change on the `pm:changes` realtime topic: once for the events of a moment, naming known changed issues (`issueIds`), so a page refreshes only what it shows of them (`announcedIssueIds`, `changedIssueSegments` and `isIssueRead` in `client/kit`). `embeddedIssueSegments` additionally matches cached details containing a changed parent, child, dependency, related issue or blocker. Refresh those detail snapshots without expanding transitively or refreshing their unrelated discussions and projections.

## Layout

- `shared/`: types and constants the server and the client share.
- `server/kernel/`: infrastructure with no business rules (errors, events, transactions, pagination, validation).
- `server/access/`: how a request becomes a `Viewer` with resolved permissions.
- `server/lifecycle/`: the record state machine behind the statuses (see above).
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

When renewing an invitation, deleted projects are ignored if at least one selected project remains. The inviter must still be authorized to invite into every remaining project. If all originally selected projects were deleted, renewal is rejected.

Invitation emails use `notificationService.sendTransient()` so credentials never enter notification message snapshots or job storage. This performs one bounded attempt without durable retries or deduplication. Failures retain safe status/category diagnostics without raw provider messages. The inviter can generate and privately deliver a new link if delivery fails. Historical notification snapshots are not rewritten.

## Structured issue progress

`Issue` exposes nullable text `needsYou` and `next`. `PATCH /api/projects/issues/{issueId}` and `issue.update` plan rows accept them in the same transaction as `statusKey`. Both fields are optional for people, agents, plans and system events. Omitted needsYou is retained in Blocked or In review; null, empty or whitespace clears it. Applications may constrain authenticated callers at their request boundary. Leaving these states clears it. Omitted `next` is retained; nonblank text replaces it; null, an empty string or whitespace clears it. Done and Cancelled always clear it. Both fields allow at most 2,000 characters. Progress-only writes advance revision and emit the existing refresh event. System status events share the optional-field validation and clearing rules. The new reversible migration adds the two columns without backfilling comments.

`Issue` also exposes nullable Markdown `acceptance`: the issue's delivery report — how it was, the agreed approach, what changed, how it was checked, open issues and details — ending with the acceptance criteria the owner checks and where. `PATCH /api/projects/issues/{issueId}` accepts it in any status, normally with the move to In review (`nb-studio issue update <issue> --status in_review --acceptance-file report.md`). It is kept across status changes, including Done, Cancelled and a move back to In progress, and the next delivery replaces it; omitted it is retained, and null, an empty string or whitespace clears it. It allows at most 20,000 characters (`ISSUE_ACCEPTANCE_MAX`). Its reversible migration adds the column without backfilling.

Manual issue descriptions accept pasted images through the existing protected attachment upload. Creation accepts optional `attachmentIds` of the caller's own unattached uploads and requires `pm.attachments` `upload` in addition to issue creation permission. Files are bound in the creation transaction before work starts, so the first agent context includes them. Descriptions remain Markdown; image nodes survive detail edits. Uploading blocks submission; cancelling leaves unattached files to the existing purge.

Applications can provide `ExecutorPresentationContext` from the client kit to render the identity and availability of their registered executor kind in new issue and subtask selectors. It changes presentation only; the server still supplies candidates and enforces qualifications.

### Issue card summaries

`GET /api/projects/issues/summaries?refs=PM-12,123` accepts 1–100 IDs or identifiers and returns `{ data: [{ id, identifier, title, statusKey }], meta: { total } }`. It requires authentication and `pm.issues/view`; deleted, invisible and credential-project-excluded issues are omitted without distinguishing them from missing references. Duplicate references return one row. The batch performs one business query with the existing visibility predicate and no comment, member or relation hydration. Browser consumers may call `PmApi.issueSummaries(refs)` and use `FIXED_STATUSES` for labels and colors.

`pm.changed` preserves known `issueIds` for creation, deletion and membership changes too. `listsChanged: true` means lists and project counts must refresh while issue details remain scoped to those IDs and their directly embedded references. Child deletion and restoration also name the already-known parent, including when the restored child is absent from the parent's current snapshot. Batches larger than 100 IDs are split; events with unknown scope still omit `issueIds`. Re-read after each subscription acknowledgement to recover missed events.
