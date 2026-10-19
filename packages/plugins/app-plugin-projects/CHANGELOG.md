# @nocobase/app-plugin-projects

## 0.1.0-beta.12

### Patch Changes

- e897e4f: Preserve pending history pages and coalesce refreshes when realtime changes arrive during pagination.
- e897e4f: Keep loaded issue history complete across live updates and scroll to a linked comment only once.
- 32ed5e2: Report coding account quota windows, filter scoped exhausted tools before claims, and restore eligibility at known reset times or after an authorized manual clear. Show quota status and usage in runtime tabs and agent availability, and batch page reads independently of the catalog size.

  Runtime API and CLI: runtime get returns directory totals without directory rows; runtime list omits models, policy, variables, quota details and load, and caps takes at three with takesCount. Use the paginated runtime workspaces command for directory rows. Runtime quota clear takes structured tool/scope/target/window fields and no client revision; only unknown-reset marks may be cleared.

  Classify quota revision races as retryable REVISION_CONFLICT while known-reset clears fail with QUOTA_RESET_KNOWN / FAILED_PRECONDITION.

  Batch related-task visibility and missing blocker reads with the existing issue visibility filter, preserving per-request permissions and hidden blocker counts as task and project counts grow.

- Updated dependencies [22717d7]
  - @nocobase/app-server@2.0.0-beta.9
  - @nocobase/app-plugin-file@1.0.0-beta.24
  - @nocobase/app-plugin-authentication@2.0.0-beta.10

## 0.1.0-beta.11

### Minor Changes

- 8286a8a: Add a bounded screenshot endpoint for live Agent comments with stable comment provenance and existing issue visibility checks.

### Patch Changes

- 44bc7a7: Cancel invitation link copy feedback timers when the component unmounts, preventing stale updates after the dialog closes.

## 0.1.0-beta.10

### Minor Changes

- 55fcee1: Replace the built-in agent session MCP endpoint and tool registration API with the Studio CLI and shared Skill. Bridge protocol 3 requires a matching CLI upgrade. Session agents use the bridge-selected login profile, validate session ownership before creating linked tasks, default to the session project and Backlog, and read linked work and issue progress through CLI routes. Prepare the shared Skill before starting or restoring sessions and explain unsupported agents or installation failures. Teach both bundled Skill copies to discuss and search before recording work and combine related requirements into as few tasks as practical.

### Patch Changes

- 56251bc: Reuse issue context, previous summaries, comment deltas and initialization reads for matching parameters within a transaction, reducing repeated work during runner claims.
- d34b6eb: Reject explicit issue start requests that would save into Backlog before allocating an issue number or writing the issue. Keep the validation message client-neutral and explain the required In progress flags in command help and recovery suggestions. Preserve validated application suggestions from API error metadata in CLI errors without changing the JSON envelope shape.
- f1f3bd7: Read the dashboard, usage and metrics reports with a fixed number of queries whatever the number of issues, runs and usage records: runs, usage and issues are read in one query each with only the columns the figures use, model usage outside runs is summed in the database, and issue facts are read in three queries instead of two per 200 issues. The Studio dashboard now loads each panel from its own route, `GET /api/reports/delivery`, `GET /api/reports/agents` and `GET /api/reports/projects` (CLI `report delivery`, `report agents`, `report projects`), each loading, failing and refreshing on its own; `GET /api/reports/dashboard` and `report dashboard` are removed.
- f963c9b: Merge owned and executed tasks, preserve split list placement after status changes, unify agent working marks, and open embedded task run transcripts without leaving the current page.

  Keep the selected split-view task and its updated status visible after cancellation or when its new group lies beyond the loaded page, until another task or query scope is selected.

- bc1facd: The issue board reads a fixed number of queries whatever the number of issues: each column's ids are read in its order, then every column's rows and what they show beside them at once (16 queries instead of about 54). `GET /api/projects/issues` takes `issueIds` (comma-separated, at most 100) to read only some issues within the other filters. On Studio's issue pages the board and the trash now stay current through the app-wide refresh: a change naming issues reads only the rows shown, and the list is read again when one of them left it or changed column, or for a change naming no issues.
- c28f719: Read the authorized issue hierarchy in a fixed number of queries whatever the number of issues: which issues wait for unfinished ones takes two queries instead of several per hundred issues, exact list filters are matched on the issues already read, and `hierarchyItems` hydrates up to 500 issues at once and accepts the readable ids its caller has already read. A change of an issue's project, parent or executor is now announced as one that moves lists, and the projects list is refreshed only for announcements that name no issues, the only ones that can change its counts. Saving an issue no longer refreshes its detail twice when the page reads it by id.
- 89d5165: Issues gain `acceptance`, the issue's Markdown delivery report ending with the acceptance criteria the owner checks, written with the move to In review (`nb-studio issue update <issue> --status in_review --acceptance-file report.md`), kept across status changes — including Done, Cancelled and a move back to In progress — until the next delivery replaces it, at most 20,000 characters. The blocked status is named 阻塞中 in Chinese, replacing 待确定; threads have the wording to fold earlier replies; New issue shows its plus alone on a phone.
- de0861a: Add permission-safe issue hierarchy reads (`issueQueries.hierarchy` and `hierarchyItems`) so an application can show an issue's ancestors and page through its children.
- ab5c0fc: Support pasting protected images into new issue descriptions and retain them when editing. Bind uploaded attachments before starting work so agents can read them from their first run.
- 7abd72b: Allow administrators to configure global and new-project skill defaults in the attachment section, and show visible attachment targets by name with project settings links. Align new-project defaults CLI access with the existing settings permissions.
- e94b470: Send selected PNG and JPEG images through the existing conversation attachment flow when organizing requirements. Keep the source requirements and files in memory across navigation, with a manual return to edit or choose another agent after a reading failure.
- 49f61b9: Show optional settings permissions separately from business actions in CLI identity output, and explain run-token-only permissions. Add available-command typo suggestions, a hint for truncated text, and clean shutdown when a pipe closes early. Describe route schema inputs so generated CLI help and reference tables explain their parameters. The manifest identity and whoami JSON result gain an optional settings list; command admission and authorization are unchanged.
- 2972218: Align intake project and agent controls, and keep long plan confirmations scrollable with visible action buttons.
- Updated dependencies [98b3862]
- Updated dependencies [1cdbaf4]
- Updated dependencies [5fe8773]
- Updated dependencies [b22d999]
- Updated dependencies [00c5970]
- Updated dependencies [0037dd2]
- Updated dependencies [c0b7537]
- Updated dependencies [eb4b081]
- Updated dependencies [14b7aec]
- Updated dependencies [49f61b9]
- Updated dependencies [0037dd2]
  - @nocobase/db@1.0.0-beta.21
  - @nocobase/app-client@3.0.0-beta.2
  - @nocobase/app-server@2.0.0-beta.8
  - @nocobase/app-plugin-file@1.0.0-beta.24
  - @nocobase/app-plugin-authentication@2.0.0-beta.10
  - @nocobase/app-plugin-users@2.0.0-beta.5
  - @nocobase/app-plugin-authorization@1.0.0-beta.28
  - @nocobase/authorization@1.0.0-beta.14
  - @nocobase/i18n@1.0.0-beta.7
  - @nocobase/markdown-mermaid@0.1.0-beta.2
  - @nocobase/repository-input@0.1.0-beta.3
  - @nocobase/service-provider@0.0.2-beta.2
  - @nocobase/app-plugin-notification@1.0.0-beta.27

## 0.1.0-beta.9

### Minor Changes

- 862a542: Support global default skills and transactional defaults for newly created Studio projects. Resolve skills from global through application scopes to working directories in one query, with more specific targets winning. Stop reading and exposing legacy agent skill attachments while preserving agent variables.
- f43817d: Persist the owner's required decision and the next step as structured issue fields. Require needsYou only for authenticated Studio project-manager direct status updates to Blocked or In review, keep generic and human progress input optional, clear it when work resumes, and clear next when work ends. Studio displays these fields without extracting progress or delivery notes from comments and links to the project manager's latest explanation.

### Patch Changes

- 92afa27: Make My follow-ups fast for someone who owns many open issues. `GET /api/followUps` reads what every row's progress needs in a fixed number of queries instead of a few per issue, and a row no longer works out why queued work has not been claimed (`waiting`, `managerWait`): the issue's own progress (`GET /api/issueProgress/{issueId}`), shown beside the list, still does. A new `GET /api/followUps/issues?issueIds=…` answers the rows of the named issues, and the page uses it to refresh only the rows an announced change names, a burst at a time, reading the whole overview again only when the list itself changed, on reconnect, for a change that names no issue, and on its fallback poll. The follow star on an issue reads only what the viewer follows from a new `GET /api/followUps/following` (`follow-up following` on the command line) instead of the whole overview, and an agent session's issue progress reads its issues in the same fixed number of queries. The projects plugin's comment queries gain `newestByEach`, the agents plugin's runs gain `openOnEach`, and its run request list takes `subjectIds` and `statuses`.
- facfe5c: Remove a duplicate Issue type import that prevented type checking and builds.
- bdb0581: Reduce the server load of open issue and My follow-ups pages. Issue change announcements are gathered for a moment and name the issues that changed, so a page refreshes only what it shows of them; Studio announces new runs on an issue, so issue pages, What it waits for, owner handoffs and My follow-ups fall back to a slow poll instead of polling every few seconds; a preview label the server failed to set no longer makes the issue page poll every three seconds. Polled reads check issue visibility without loading the whole issue page (`IssueQueries.visible`), What it waits for reads only the project manager's newest comments (`CommentQueries.newestBy`), My follow-ups shares lookups across its issues, and pull request marks check visibility in one read. A runner heartbeat no longer announces a runner change, waking every waiting claim and refreshing every runtimes page, unless its disk sample moved by a gigabyte, crossed the free-space threshold or changed size.
- 7534a32: Restore the previous task tables and remove grouped task tables for now.
- 6c4634b: Scope Studio's pull request announcements (`studio:git`) to the issues they affect. Stores of a moment are gathered into one announcement naming the issues the changed pull requests are linked to, and pages read again only those issues' pull requests, marks, previews and progress, through one subscription per page; an announcement it cannot tie to pull requests, and a reconnect, still refresh everything. The topic now reaches signed-in connections only, and a hidden tab no longer polls an issue's previews. Also removes a duplicated type import in the projects plugin's issue queries.
- bdb0581: A public realtime topic can be defined with `authenticated: true` (`defineTopic` and `registerTopic` of `@nocobase/app-server/realtime`): subscribing without a signed-in principal is then refused with `AUTHENTICATION_REQUIRED`, as for a user topic, and publishing skips connections without one. The projects plugin's `pm:changes`, the agents plugin's `agents:runners` and Studio's `studio:issues:runs`, whose announcements name records by id, now reach signed-in connections only. The authentication plugin opens the realtime connection again when the signed-in person changes, so a page signed in without a reload receives these topics and user topics.
- Updated dependencies [69e212c]
- Updated dependencies [943a9a8]
- Updated dependencies [943a9a8]
- Updated dependencies [1cd749c]
- Updated dependencies [bdb0581]
- Updated dependencies [9b946f4]
  - @nocobase/app-server@2.0.0-beta.7
  - @nocobase/db@1.0.0-beta.20
  - @nocobase/app-plugin-authentication@2.0.0-beta.9
  - @nocobase/app-plugin-file@1.0.0-beta.23
  - @nocobase/app-plugin-authorization@1.0.0-beta.27
  - @nocobase/app-plugin-notification@1.0.0-beta.27
  - @nocobase/app-plugin-users@2.0.0-beta.4

## 0.1.0-beta.8

### Minor Changes

- 6fc0af2: Require the issue owner to start or continue Studio project manager work, and ignore agent wakeups from comments on unstarted issues. Run the manager and its delegated steps as the current owner while preserving trigger audit information. Withdraw all queued agent work and request cancellation of held runs on owner transfers, without automatically restarting them. Correct legacy queued identities before claim and expose waiting reasons.

  Expose the existing transactional `Projects.activity` recorder for application issue events and deliver owner transfers to all work kinds before ordinary triggers, including executor clearing. Restore Studio wording for models, efforts, the start dialog and historical sub-issue activity.

  Preserve delegated execution identity throughout repeated retries, including handled inputs, and show the initiator of the current retry instead of copied retry history.

- ddfe1b1: Replace workflows with six fixed issue statuses: Backlog, In progress, Blocked, In review, Done and Cancelled. Workflows, workflow templates, status rules, approval requests and checklists are removed, together with their routes, CLI commands, settings (`pm.workflows`) and client pieces (`WorkflowSelect`, the start dialog, status rule editors). A new issue starts in Backlog unless it is created in In progress ("Start now"); moving an issue to Blocked or In review notifies its owner. Other plugins register status events with `projectsStatusEventsToken` (`{ key, from, to }`) and fire them with `projects.statusEvents.fire`, replacing `workflowEvents`; a principal kind may now say which moves it makes (`moves`, `mayMove`) and which executor it defaults to (`defaultExecutor`). `PATCH /api/projects/issues/{issueId}` answers `{ data: { issue } }`. The migration `202610240010_pm_fixed_statuses` maps every issue to the fixed statuses by key and category (todo and other started statuses to In progress, ui_review to In review, done to Done, closed to Cancelled) and drops the workflow, approval and checklist tables and `pmProjects.workflowId`; it cannot be rolled back to the workflows it removed.

### Patch Changes

- 0e28a3c: Describe `issue subscribe` and `issue unsubscribe` (`POST /api/projects/issues/{issueId}/subscribe|unsubscribe`) as subscribing to and unsubscribing from an issue's notifications, so the API document and the command line no longer call them following, which Studio's "My follow-ups" means.
- cb009d7: Pause agent work after an owner transfer until the new owner accepts. Add owner acceptance and rejection in issue pages and inbox decisions, with transfer activities and localized waiting reasons.
- fad531f: Initialize the project manager's name and description once in the installation's default language and allow administrators to edit them, including clearing the description. Restarts and unrelated settings saves preserve the identity. Later changes to the installation language do not rename an initialized manager.

  An upgrade seed preserves valid explicit settings, custom legacy agent values, empty descriptions, and unknown settings. Legacy agent values identical to the former built-in English defaults cannot be distinguished from manual writes and are initialized in the upgrade language when no valid explicit setting exists. A damaged `studioSettings.projectManager.value` stops initialization with a repair instruction instead of overwriting it.

  Resolve historical run inputs, notifications, delegation cards, plans, and consultation identity labels from stable agent IDs without rewriting historical text or execution snapshots. Legacy limit notices and plans whose identity cannot be recovered use neutral labels, and unresolved consultations mark the originally requested subject. Refresh identity caches when the manager is renamed.

  Mount application query effects inside the projects plugin's cache using its optional `queryEffects` composition point. Keep completed consultation labels current after renames and distinguish loading, inaccessible agents, and historical request snapshots.

- Updated dependencies [9e99702]
  - @nocobase/app-server@2.0.0-beta.6
  - @nocobase/app-plugin-authentication@2.0.0-beta.8
  - @nocobase/app-plugin-file@1.0.0-beta.23

## 0.1.0-beta.7

### Minor Changes

- 3668ab1: Let an agent's comment wake other agents, so one agent can hand work to another and be woken by its reply. A comment of anyone but the system now reaches the work handlers, with the person it was written for (`CommentChange.userId`). In Studio, an agent's comment wakes the agents it mentions, never itself and never the agent whose comment it answers; mentioning no agent, it wakes the issue's executing agent unless it mentions a person or the executor wrote it. It acts for the person its run acts for (the issue's owner when no run wrote it). A workflow's new `commentRunLimit` (20 by default, edited in the workflow's Limits card or through `definition.commentRunLimit`) caps such runs per issue within 24 hours; past it the comment starts nothing (`work_skipped`, reason `limited`), the owner is notified, and a person who may edit the issue can continue it once from the issue page. A run an agent's comment started always answers in that comment's thread once it ends: with its final output when it completed without commenting, or with why it failed when it failed for good; `CommentWriter.post` takes `forUserId`, the person the triggers hear the comment was written for.
- 3668ab1: Tell each issue run what was said since the agent's last run. A subject's assembly may add a note to the turn of a resumed session (`turn.resumed`) or of a fresh one (`turn.fresh`), chosen once the claim knows which it is. The comment threads list (`GET /api/projects/issues/{issueId}/comments`, `issue comment list`) takes `since` to return only what was written after it. Studio uses both: a resumed run hears that no comment arrived, the few new comments, or how many and the `--since` command that reads them; a fresh session or a first run is told to read the issue's comments before acting.

### Patch Changes

- 693e43d: Update agent guidance to refer to the renamed `nocobase-app-plugin-development` Skill.
- Updated dependencies [d54dd59]
  - @nocobase/app-plugin-authentication@2.0.0-beta.7

## 0.1.0-beta.6

### Patch Changes

- cf23bfe: Republish every package so the `latest` dist-tag points at its current beta release, matching `beta`.
- Updated dependencies [cf23bfe]
  - @nocobase/app-client@3.0.0-beta.1
  - @nocobase/app-plugin-authentication@2.0.0-beta.6
  - @nocobase/app-plugin-authorization@1.0.0-beta.27
  - @nocobase/app-plugin-file@1.0.0-beta.23
  - @nocobase/app-plugin-notification@1.0.0-beta.27
  - @nocobase/app-plugin-users@2.0.0-beta.4
  - @nocobase/app-server@2.0.0-beta.4
  - @nocobase/authorization@1.0.0-beta.13
  - @nocobase/db@1.0.0-beta.19
  - @nocobase/i18n@1.0.0-beta.7
  - @nocobase/markdown-mermaid@0.1.0-beta.2
  - @nocobase/repository-input@0.1.0-beta.3
  - @nocobase/service-provider@0.0.2-beta.2

## 0.1.0-beta.5

### Patch Changes

- ca0bfe2: Return invitation links after successful email delivery and let authorized original inviters generate a fresh link without sending email. Show copy controls for newly created and resent invitations, confirm rotation, and explain when a concurrent change makes the link unavailable. Keep scalar URLs complete in CLI text output; structured fields retain their compact display.

  Preserve registration through invitation links without requiring an email channel or configured public origin. Links use app.publicOrigin when configured and otherwise the invitation request origin. Acceptance leaves the new account's email unverified. Existing accounts must sign in with the invited identity, and each token accepts only its own invitation. Only token hashes are stored; rotation invalidates the previous link.

  When no authentication base URL is configured, derive the trusted origin for cookie writes from each request URL using Better Auth's proxy-header policy. This allows same-origin invitation acceptance with unrelated or session cookies while rejecting cross-origin writes and preserving configured origins.

  Retrieve plugin invitations through their domain-authorized endpoint. Recheck the original inviter's current role and project permissions. Other managers may resend email but do not receive credentials; scoped credentials remain email-only. Renewal ignores deleted projects if at least one remains, checking access to each remaining project, and rejects renewal if all selected projects are gone.

  Send invitation credentials through a transient notification attempt without durable message snapshots, automatic retries or raw provider diagnostics. Preserve safe failure categories and submission status. Batches use at most five concurrent sends and a shared 30-second mail-delivery budget. Recheck each link after sending or exhausting the budget so concurrent closure or rotation does not expose invalid links or discard other recipients and existing-account project updates.

- be823bd: Add pasted image files to the new issue requirements file list while preserving native text paste behavior, and enable image previews for pasted and manually uploaded images with the shared attachment UI.
- a76c859: Let issue details add "Related" links as well as prerequisites, and let editors change an existing relationship's type, so linking related work no longer holds the issue.

  Group relationship conversion and removal in one row menu, and translate stale relationship conflicts in English and Chinese.

  Convert relationship types atomically on the server, preserving the link ID and rejecting stale changes or an existing target relationship without deleting either link.

  Protect dependency graph additions with a shared database revision so concurrent conversions, new dependencies, hierarchy changes and restores cannot commit a cycle, including transactions with an older MySQL snapshot.

  Protect symmetric related links against concurrent additions and conversions, and acquire the graph guard before plan rows so mixed edits cannot reverse the issue-row lock order during rehearsal, execution or undo.

  Keep relationship removal under the same graph protection as conversion, so both removal endpoints use consistent relationship types and endpoints for activity and release notifications.

  Wake waiting work only when a relationship conversion or removal actually clears its blockers. Editing a completed prerequisite, or deleting an already completed issue, no longer starts an agent that was intentionally left idle.

  Serialize blocker status changes and deletion with relationship edits before writing issue rows, including approvals, workflow events and automatic parent completion, so concurrent releases cannot leave unblocked work idle.

- Updated dependencies [251d19e]
- Updated dependencies [ca0bfe2]
  - @nocobase/app-plugin-authentication@2.0.0-beta.5
  - @nocobase/app-plugin-users@2.0.0-beta.3
  - @nocobase/app-plugin-notification@1.0.0-beta.26

## 0.1.0-beta.4

### Minor Changes

- c796cb9: Remove the Settings and Dev route surfaces. `@nocobase/app-client` no longer exports `defineSettingsRoutes()`, `defineDevRoutes()`, `isAppClientSettingsRouteGroup()`, `isAppClientDevRouteGroup()` or their definition, contribution and registered-route types, and the resolved runtime no longer carries `settingsRouteTree`, `devRouteTree`, `settings`, `settingGroups`, `devRoutes` or `devRouteGroups`. `AppClientSettingsRouteNavigation` is renamed `AppClientRouteNavigation` and `AppClientSettingIcon` is renamed `AppClientRouteIcon`. A contribution to any parent other than `app` now fails registration with a message that names `defineAppRoutes()`. Plugins contribute no settings or dev pages; an application that wants a configuration page declares it with `defineAppRoutes()` in its own navigation, for example under a Settings group.

  The default and examples templates drop the settings layout, the `/settings/*` route, the dev route plumbing, and the Settings and Inbox buttons in the header; the `/inbox` page and the inbox block stay. The examples template no longer registers `@nocobase/app-plugin-departments-example`, which is removed. Upgrading an application means removing `defineSettingsRoutes([])` from `client/routes.ts`, the `settingsRouteTree` and `devRouteTree` props passed to `AppRouter`, and any settings layout it kept, and moving its own settings pages to `defineAppRoutes()`. Every package that depends on or peers with `@nocobase/app-client` is released again so that its published range accepts `3.0.0-beta.0`.

### Patch Changes

- c796cb9: Remove the AI employee packages from the repository

  `@nocobase/app-plugin-ai-employee`, `@nocobase/ai-employee` and `@nocobase/app-plugin-ai-employee-example` were already deprecated and no template installed them; they are now deleted and will not be released again. The Default and Examples templates drop `@nocobase/ai-employee-avatars`, which only the plugin's avatars used.

  Generated plugins' `AGENTS.md` and the copies shipped with existing plugins no longer list `@nocobase/ai-employee` among the identity-sensitive packages. The HTTP API references in the application development Skill use other plugins for their examples, and the upgrade Skill tells an application that still depends on the removed packages to review their usage before removing them, because the runtime will move past what their peer ranges accept.

  `pnpm build` no longer copies `ai/skills` into `dist/ai/skills`. The AI employee plugin was the only reader of that directory; an application that keeps Skills there for another purpose has to copy them itself, for example from a build hook.

- fb7b576: Keep workflow editing actions visible while scrolling and preserve unsaved editors through host-managed navigation guards. Restore declined navigation safely across native hash history index resets and history predating the mounted guard. Subscribe to page unload only while edits or requests are pending, and document the shared navigation boundary.
- Updated dependencies [c796cb9]
- Updated dependencies [c796cb9]
- Updated dependencies [c796cb9]
- Updated dependencies [c796cb9]
- Updated dependencies [98e79a5]
- Updated dependencies [eea95a7]
- Updated dependencies [fb7b576]
  - @nocobase/app-plugin-users@2.0.0-beta.2
  - @nocobase/app-server@2.0.0-beta.3
  - @nocobase/app-plugin-authentication@2.0.0-beta.3
  - @nocobase/app-plugin-authorization@1.0.0-beta.26
  - @nocobase/app-plugin-notification@1.0.0-beta.25
  - @nocobase/app-client@3.0.0-beta.0
  - @nocobase/app-plugin-file@1.0.0-beta.22
  - @nocobase/i18n@1.0.0-beta.6
  - @nocobase/authorization@1.0.0-beta.12
  - @nocobase/db@1.0.0-beta.18
  - @nocobase/markdown-mermaid@0.1.0-beta.1
  - @nocobase/repository-input@0.1.0-beta.2
  - @nocobase/service-provider@0.0.2-beta.1

## 0.1.0-beta.3

### Minor Changes

- 97d94dc: Preserve each run attempt's runtime, owner, tool version, requested model and reasoning effort, and expose primary-tool models reported during execution in run lists and details. Retain execution history when a retry releases its holder. Existing runs expose known usage models without inventing historical runtime snapshots.

  Allow applications to attach execution snapshots to agent activity traces and return the originating run and attempt on comments. Applications must wire these facts into their run views, CLI projections and activity badges; installed UI Library component copies require an explicit update.

  Separate requested settings from tool-reported effort, retaining report provenance and change times. Codex reports resolved thread settings and explicitly marks per-turn overrides unreported when the tool returns no resolved value. Apply reader machine permissions to execution history and action sources, skip unchanged snapshot writes, and filter/deduplicate legacy model queries in the database. Custom application outputs must apply the provided machine projections, and projects hosts can supply the same rights through `Viewer.seesExecutionMachine`.

### Patch Changes

- 2cb84e0: Keep long workflow rule summaries within the save confirmation dialog and workflow rule lists, including on narrow screens.
- e088465: Preserve the original actor and run trace in owner transfer, dependency release, subtask completion and status rule callbacks while retaining system permissions for workflow event transitions.

## 0.1.0-beta.2

### Minor Changes

- 57c59a0: Queue work as the person it runs as, and let a variable keep its runs on team runners.

  - New work for an agent on a subject now merges only into a run working as the same person (`actorUserId`). Work woken by someone else starts a run of its own instead of borrowing the identity of a run already queued or held, and the owner's own work is no longer swallowed by a run another person's comment queued, which their personal runner would never take. Runs of one agent, subject and thread are still claimed one at a time, so the second waits with `sameWorkActive`. A retry likewise looks only at open runs of the person retrying.
  - Variables gain `teamRunnersOnly`, off by default and off for every existing variable (migration `202610090001_ag_add_team_runner_variables`, which also adds `agRuns.teamOnlyVariables`). Without it nothing changes: a run's variables go to whichever runner takes it, including the personal runner of anyone who may use the agent, and the variables settings now say so. Jobs also enforce the mark on the exact stored variables referenced by their prepared spec, including repository credentials. Custom job secret sources may throw `JobSecretsNotAllowed` (exported from `server/tokens`) to report this runner mismatch; a personal runner leaves such a job queued without a preparation failure, continues to other jobs, and receives no values or delivery audits from the refused claim. A run that gets a variable marked `teamRunnersOnly` is taken only by a team runner: a personal runner leaves it, the run notes which variables asked for a team runner, and its wait answers the new reason `secretsNotAllowed` with those variables (`RunWait.variables`). The mark is checked and the values are opened in the claim's own transaction, so a runner receives exactly what was checked. `PUT /api/agents/variables/{scopeKind}/{scopeId}/{name}` takes `teamRunnersOnly`, and without `value` changes only the mark of an existing variable; the variable dialog has a "Team runtimes only" checkbox, and replacing a value with an empty field keeps the stored one.
  - Waits are now a code and its values, never text: `RunWait` gains `params` (`RunWaitParams`), the values each reason's words need, such as `{ tool, used, limit }` for `toolSlotsFull`, `{ variables }` for `secretsNotAllowed`, `{ active, limit }` for `concurrencyFull`, `{ features }`, `{ until }`, `{ tool }`, `{ runners }` and `{ detail }` for the others; it is optional, and the earlier fields stay. `RUN_WAIT_REASONS` adds `secretsNotAllowed`.
  - The agents plugin's client words waits: `formatRunWait(t, wait)` and `runWaitBlocks(wait)` from `@nocobase/app-plugin-agents/client/runs`, with texts in the plugin's namespace (`runWait.reasons.<reason>`, English and Chinese) and the page's `t`, so they follow a language switch. An application uses it as it is, rewords any reason in its locale file's `overrides` for that namespace (a reason this version does not know included), or formats waits itself; a reason with no text reads as "Queued (<reason>)".
  - The `agent-queue` Registry item no longer knows any wait reason: `AgentQueueWait.reason` is a string, the `AgentQueueWaitReason` type and `labels.queue.reasons` are removed, `waitText` and `isBlockingWait` become `waitView`, and the new `formatWait` prop words a wait (`{ text, detail?, blocking? }`), showing the reason code without it. Applications with a copy of the item, Studio included, sync it once and pass `formatWait`, such as `formatRunWait` with `runWaitBlocks`; a reason added later then needs no change to the copy.
  - The projects plugin's intake progress no longer words wait reasons itself: `IntakeAiProgress` gains an optional `waitParams`, and the application gives the words through the new `IntakeWaitFormatContext` (from `@nocobase/app-plugin-projects/client/kit`), such as the agents plugin's `formatRunWait`; without it a queued request reads as waiting, naming the reason. Its own texts per reason are removed.
  - Applications should forward the new `run_secrets_not_allowed` notice (to the run's actor and owner, naming the variables) and its `notice.cleared`, sent once a runner takes the run. Repository access providers that mint credentials in `prepare` may implement `discard(run, prepared)`, called when a claim is skipped or rolled back.
  - New `eligibility` service (`runnersFor`, `canClaim`, `mayQueue`, `teamOnly`): whether a runner would take an agent's work done as a person, by the claim's rules including team-only variables, for callers deciding before a run exists. `availability` accepts the person (`actorUserId`) and uses it, and `GET /api/agents/available` now answers `online` for the caller: an agent whose only online runners would not take the caller's work reads as offline. Enqueue itself never refuses for this; such work waits.
  - The added data fields remain optional for consumers constructing their own objects: `RunWait.variables` and `RunWait.params` may be omitted, and `Variable.teamRunnersOnly` may be omitted (treated as false). The API still supplies the mark when listing stored variables.

### Patch Changes

- Updated dependencies [487921c]
- Updated dependencies [a6758ec]
  - @nocobase/app-server@2.0.0-beta.2
  - @nocobase/app-plugin-file@1.0.0-beta.21
  - @nocobase/markdown-mermaid@0.1.0-beta.1
  - @nocobase/app-plugin-authentication@2.0.0-beta.2
  - @nocobase/app-client@2.0.0-beta.2
  - @nocobase/authorization@1.0.0-beta.12
  - @nocobase/db@1.0.0-beta.18
  - @nocobase/i18n@1.0.0-beta.5
  - @nocobase/repository-input@0.1.0-beta.2
  - @nocobase/service-provider@0.0.2-beta.1
  - @nocobase/app-plugin-authorization@1.0.0-beta.25
  - @nocobase/app-plugin-notification@1.0.0-beta.24
  - @nocobase/app-plugin-users@2.0.0-beta.1

## 0.1.0-beta.1

### Patch Changes

- 10a1759: End a bare URL in issue descriptions and comments at the first CJK character or full-width punctuation mark, so `PR：https://example.com/pull/8（分支 x）` links `https://example.com/pull/8` instead of `https://example.com/pull/8（分支`. The UI Library catalog in the application Skill lists the `remark-cjk-autolink.ts` file the `markdown-view` item now installs.
- b8df35c: Limit a runner's concurrent runs per coding tool, beside its total slots, so a machine with Claude Code and Codex can run, say, at most two Claude runs and one Codex run at once.

  - `@nocobase/agent-protocol`: optional `toolSlots` on registration, `load.tools` on the heartbeat and `tools` on the claim (`ToolSlots`, `ToolLoad`). They are additions within protocol 7: a side that does not know them ignores them.
  - `@nocobase/agent-runner`: `register --slots` and `start --slots` take a total, limits per tool, or both (`3,claude=2,codex=1`). The limits hold across every application the machine serves; each claim says how many runs of each limited tool the runner can still take, and the heartbeat reports them.
  - `@nocobase/app-plugin-agents`: runners and registration tokens keep `toolSlots`, set on registration or on the runtime's settings and in the "Add runtime" dialog. A claim takes a run only when both the runner's total and the run's tool have room, using the agent's next tool while its first is full and passing over a run none of whose tools has room. A queued run waiting on a full tool reads `toolSlotsFull` rather than `runnersBusy`, and the runtimes page shows the runs by tool against each limit. The migration `202610080001_ag_add_runner_tool_slots` adds the columns. A runtime's settings list its coding tools in one table (on or off, sign-in, limit, runs now), and a tool's switch is now saved with "Save" together with the rest of the form instead of at once. The "Add runtime" dialog keeps the limits per tool under "Advanced" for the checked tools, and its button reads "Generate install command". A limit above the max concurrent runs is pointed out, since the total bounds it.
  - `@nocobase/app-plugin-projects`: words the `toolSlotsFull` wait reason.

  Every field this adds to the shared types is optional, so code that builds these objects itself needs no change: `Runner.toolSlots` and `Runner.toolLoad`, `RunnerSummary.activeByTool`, `RegistrationToken.toolSlots`, and `HeldItems.byTool` of `Slots`. The server always fills them in. A missing field reads as no limit per tool and nothing known about its use, and the runtimes page then shows no use per tool. `RUN_WAIT_REASONS` gains `toolSlotsFull`, so a `Record` keyed by every `RunWaitReason` needs an entry for it.

  Applications using a copied UI Library `agent-queue` block must merge the `toolSlotsFull` reason and wording changes from `ui-library/registry/agents/agent-queue` into their copy. This PR updates the registry source, including an optional label with an English fallback, but a plugin upgrade does not update installed source. Add `queue.reasons.toolSlotsFull` to the application's translations to show the new reason in its locale.

- Updated dependencies [bb8484b]
- Updated dependencies [dc91aab]
  - @nocobase/app-client@2.0.0-beta.2
  - @nocobase/app-plugin-authentication@2.0.0-beta.2
  - @nocobase/app-plugin-file@1.0.0-beta.20
  - @nocobase/app-plugin-notification@1.0.0-beta.24
  - @nocobase/app-server@2.0.0-beta.1
  - @nocobase/authorization@1.0.0-beta.12
  - @nocobase/db@1.0.0-beta.18
  - @nocobase/i18n@1.0.0-beta.5
  - @nocobase/markdown-mermaid@0.1.0-beta.0
  - @nocobase/repository-input@0.1.0-beta.2
  - @nocobase/service-provider@0.0.2-beta.1
  - @nocobase/app-plugin-authorization@1.0.0-beta.25
  - @nocobase/app-plugin-users@2.0.0-beta.1

## 0.1.0-beta.0

### Minor Changes

- 68d4feb: Add `@nocobase/app-plugin-projects`: projects, issues, workflows, labels and members for a NocoBase application. Issues carry workflow states, assignees of pluggable kinds (people, the plugin's own rules, or kinds another plugin registers, such as agents), sub-issues and dependencies, comments with reactions, attachments and activity; operation plans let a person confirm, rehearse, execute and undo a batch of changes proposed for them; intake splits and extracts issues from text and files. Business permissions are declared in `shared/access.ts` (the `pm` resource type, `edit.related` and `edit.all` levels) and resolved by the assembling application through `projectsAccessToken`. Every route is documented with command-line hints, and the client exports headless hooks (`client/kit`, `client/issues`) for the UI Library's project and issue blocks.

### Patch Changes

- 32d8faa: On PostgreSQL, a member who may see no project, no issue or no App no longer gets a server error: the filters used a NUL character as a placeholder id that matches nothing, which PostgreSQL refuses. The releases plugin's App list, for one, answered 500 to every member who had created no App.
- ec4a25d: On PostgreSQL, a lookup over an empty list of ids no longer fails with an invalid byte sequence: it sent a NUL character as a placeholder that matches nothing, which PostgreSQL refuses. This stopped the default workflow template from installing on a fresh database.
- 6162033: A pending invitation's row menu no longer closes by itself when the invitation list renders again, such as when it is fetched again: the list's cells are no longer rebuilt on every render.
- Updated dependencies [37c8d20]
- Updated dependencies [37c8d20]
- Updated dependencies [37c8d20]
- Updated dependencies [37c8d20]
- Updated dependencies [bc1e83f]
- Updated dependencies [bc1e83f]
- Updated dependencies [bc1e83f]
- Updated dependencies [bc1e83f]
- Updated dependencies [37c8d20]
- Updated dependencies [37c8d20]
- Updated dependencies [bc1e83f]
- Updated dependencies [bc1e83f]
- Updated dependencies [37c8d20]
- Updated dependencies [37c8d20]
- Updated dependencies [37c8d20]
- Updated dependencies [37c8d20]
- Updated dependencies [37c8d20]
- Updated dependencies [37c8d20]
- Updated dependencies [bc1e83f]
- Updated dependencies [bc1e83f]
- Updated dependencies [be0fbbd]
- Updated dependencies [bc1e83f]
- Updated dependencies [6993158]
- Updated dependencies [a6796d9]
- Updated dependencies [37c8d20]
- Updated dependencies [37c8d20]
- Updated dependencies [3f1b78f]
- Updated dependencies [8885ce4]
- Updated dependencies [0151805]
- Updated dependencies [bc1e83f]
- Updated dependencies [bc1e83f]
- Updated dependencies [37c8d20]
- Updated dependencies [37c8d20]
- Updated dependencies [e538d12]
- Updated dependencies [bc1e83f]
- Updated dependencies [bc1e83f]
- Updated dependencies [bc1e83f]
- Updated dependencies [bc1e83f]
- Updated dependencies [37c8d20]
- Updated dependencies [bc1e83f]
- Updated dependencies [37c8d20]
- Updated dependencies [bc1e83f]
- Updated dependencies [bc1e83f]
- Updated dependencies [6162033]
- Updated dependencies [bc1e83f]
- Updated dependencies [bc1e83f]
  - @nocobase/markdown-mermaid@0.1.0-beta.0
  - @nocobase/app-client@2.0.0-beta.1
  - @nocobase/app-server@2.0.0-beta.1
  - @nocobase/app-plugin-authentication@2.0.0-beta.1
  - @nocobase/authorization@1.0.0-beta.12
  - @nocobase/app-plugin-authorization@1.0.0-beta.25
  - @nocobase/app-plugin-users@2.0.0-beta.1
  - @nocobase/app-plugin-notification@1.0.0-beta.23
  - @nocobase/db@1.0.0-beta.18
  - @nocobase/app-plugin-file@1.0.0-beta.19
  - @nocobase/i18n@1.0.0-beta.5
  - @nocobase/repository-input@0.1.0-beta.2
  - @nocobase/service-provider@0.0.2-beta.1

## 0.0.1

### Patch Changes

- Add the initial plugin scaffold.
