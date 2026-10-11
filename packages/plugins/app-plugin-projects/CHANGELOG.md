# @nocobase/app-plugin-projects

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
