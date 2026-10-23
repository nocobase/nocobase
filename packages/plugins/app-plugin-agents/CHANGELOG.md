# @nocobase/app-plugin-agents

## 1.0.0-beta.19

### Patch Changes

- c94a01c: Display model-provided OnlineAgent reasoning in live and saved conversations without exposing provider metadata or signatures. Keep reasoning separate from answer text, preserve manual expand/collapse choices during updates, and render each part safely in the shared chat and Examples application.
- ffe5494: Apply each application's online runner slots and tool limits from heartbeat replies without restarting. Count tasks and build jobs independently per application, wake capacity waits after changes, and keep existing leases during shrinkage. New registrations default to four slots and online registration settings take precedence over legacy client hints.

  Remove local slot configuration flags from register and start. Retain existing local values only for older servers until all connected applications support online capacity. The runner status JSON now reports effective capacity and its source under each apps entry instead of top-level slots and toolSlots. Runtime pages show reported capacity, pending synchronization, legacy compatibility and the last offline report.

- 5875cb9: Expose cancellation actors and a transactional stop request callback, and allow status events to refresh issue progress even when the issue already has the target status.
- Updated dependencies [0c5c4ff]
- Updated dependencies [5b72947]
- Updated dependencies [6e3d66e]
- Updated dependencies [6e3d66e]
- Updated dependencies [ffe5494]
- Updated dependencies [0c5c4ff]
  - @nocobase/app-server@3.0.0-beta.3
  - @nocobase/app-plugin-authentication@2.0.0-beta.13
  - @nocobase/app-cli@1.0.0-beta.27
  - @nocobase/app-plugin-authorization@1.0.0-beta.31
  - @nocobase/agent-protocol@0.1.0-beta.13
  - @nocobase/app-client@4.0.0-beta.2
  - @nocobase/app-plugin-file@1.0.0-beta.26
  - @nocobase/app-cli-client@0.1.0-beta.14

## 1.0.0-beta.18

### Minor Changes

- f2712b9: Make run git credentials independent of the code host. Protocol 12 adds `RunGit.tools` and the `gitTools` runner feature: the runner wraps the code host CLIs a run names (such as `gh` or `glab`) so every call runs with the current credential of one of the run's repositories, fetched through the run's credential broker, and fails with the reason instead of falling back to the machine's login. A credential's username is now the only one git uses (`oauth2` for GitLab, `x-access-token` for a GitHub App); the runner no longer defaults it for runs (a build job's token without a username keeps the old default).

  Every run's agent now gets `git`, `gh` and `glab` wrappers that refuse `gh`/`glab` logins and token output, `credential.*` set with `git -c`/`--config-env` or written outside the repository's own config, `http.*.extraHeader` in any git configuration, and git URLs with a user in them.

  Repository access providers are told whether the runner wraps CLIs (`tools`) and who answers for the run's subject now (`responsibleUserId`), at the claim, in `prepare` and on every `issue`, so an application can issue credentials for a task's owner. `RunGit.tools` is dropped for runners without the feature and for repositories without a credential in the payload.

  The runner's workspace notes now tell the agent to open and update change requests with the code host's command line rather than an application `pr open` command.

  Update the application before its runners: a server speaking protocol 11 refuses a runner speaking 12.

- fb3b3c5: Allow applications to supply bilingual description suggestions by tool and model through agent defaults, with model catalog fallback and existing descriptions preserved.

### Patch Changes

- 5d49614: Strip NUL characters from what runners report — run events, summaries, failure details and job events — before storing it. PostgreSQL refuses NUL in text and JSON columns, so one event carrying a NUL byte in tool output failed every later events upload of its run.
- Updated dependencies [ab68344]
- Updated dependencies [f2712b9]
- Updated dependencies [f8f64ad]
  - @nocobase/app-cli-client@0.1.0-beta.13
  - @nocobase/agent-protocol@0.1.0-beta.12
  - @nocobase/app-server@3.0.0-beta.2
  - @nocobase/app-plugin-authentication@2.0.0-beta.12
  - @nocobase/app-plugin-file@1.0.0-beta.26

## 1.0.0-beta.17

### Minor Changes

- 4f0d96e: Add opt-in native OnlineAgent Skills and application-branded CLI execution using an isolated, lazily created just-bash environment. Load current Skill support trees, support virtual parameter files and read bindings, retain existing business authorization, and release execution resources across stop, approval and retryable finalization without replaying writes.

  Redact execution credentials and declare intentionally disabled optional archive-native build scripts in workspace, generated-application and deployment installation policies.

### Patch Changes

- b805e54: Reset chat drafts and unsent attachments on every explicit new conversation, apply business-entry prefill atomically, and ignore stale uploads, context snapshots and conversation-creation callbacks while preserving drafts on ordinary close/reopen and first-send promotion.
- b805e54: Clear carried work context when starting a fresh chat, while preserving page registrations and atomically including explicitly requested business context.
- 301d309: Reuse a fixed task worktree across runs and tools, preserve dependencies and sessions, isolate per-run files and cancellation, and protect cleanup with nonexclusive usage records covering worker startup. Reclaim sessions only with their owning directory. Leave commits and pushes to agents, give them an explicit HEAD-to-branch refspec for detached workspaces, refresh initialization after lockfile changes or artifact cleanup, and default idle artifact retention to 24 hours. Prefer an immediately available previous runner under the same ordered-model admission rules, aggregate affinity location and occupancy reads, and reserve actual upgrade interruptions for that runner for five minutes.

  Separate ordered-model claim eligibility from full waiting diagnostics, evaluate affinity in queue order, and reuse batched resource metadata without repeating capacity reads for every candidate and machine.

  Serialize cache fetch and worktree creation through a short cache mutex, retry transient Git lock conflicts, fall back to a detached remote branch when another directory owns it, and avoid optional index locks and per-remote-branch reporting commands. Both workspace-cleanup and repository-cache lock waits now time out after two minutes as retryable workspace-busy failures. Report disk pauses as unavailable capacity while continuing claims during periodic workspace collection.

- 1fcc7a8: Hide the built-in online agent and online usage and prices when no chat model is enabled. Reject new online defaults and conversations with a clear error while preserving saved preferences, historical conversations, usage and prices.
- 4f0d96e: Keep native Sandbox construction internal to Agents composition and unify authentication, preparation, execution, and retryable cleanup ownership.
- 4f0d96e: Restore detailed bash and skill tool guidance while describing the native Sandbox's current capabilities and limits accurately.
- 4f0d96e: Bundle a lightweight just-bash runtime with self-contained declarations and third-party licenses instead of installing the full runtime dependency tree.
- b805e54: Allow idle OnlineAgent conversations to switch models without starting a new conversation. Show a model-only picker for existing native chats, preserve conversation configuration and drafts, and prevent sends while a model change is being saved or reconciled.

  Keep unspecified model restrictions absent instead of replacing them with a default-model allowlist. Treat omitted and explicit empty lists as unrestricted while preserving their distinct stored shapes, and retain nonempty business restrictions when switching models.

- 0b5a9c1: Preserve saved model price precision when editing another price, reopening the editor, or reloading prices.
- Updated dependencies [62da032]
- Updated dependencies [8b30952]
- Updated dependencies [301d309]
- Updated dependencies [4f0d96e]
  - @nocobase/app-client@4.0.0-beta.1
  - @nocobase/app-server@3.0.0-beta.1
  - @nocobase/app-cli@1.0.0-beta.26
  - @nocobase/agent-protocol@0.1.0-beta.11
  - @nocobase/app-plugin-authentication@2.0.0-beta.12
  - @nocobase/app-plugin-file@1.0.0-beta.26
  - @nocobase/app-plugin-authorization@1.0.0-beta.30
  - @nocobase/app-cli-client@0.1.0-beta.12

## 1.0.0-beta.16

### Patch Changes

- 1952789: Complete all ten supported languages in plugin and example plugin catalogues, including model suggestions and test Web Push notifications. Align calendars and invitation emails, support locale-specific plural forms, and validate resource loading and formatting.

  Correct joined translation text and distinguish configuration save actions, refund stages, and domain-specific operation labels.

- 06e53be: Clarify role permission categories, group account actions for individual review, omit bulk-selection controls and authorization counts, expose registered action descriptions, and place Agent administration under system tools. Show labelled selections for multiple data ranges and correctly describe an empty scope as granting no additional record access while preserving default, sharing and restriction rules. Synchronize the Registry and both templates without changing permission identifiers or existing grants.
- a0ec885: Compare computer discovery data independently of JSON key order, keep runner event text within MySQL storage limits, and make issue searches case-insensitive across database dialects.
- Updated dependencies [1952789]
- Updated dependencies [06e53be]
- Updated dependencies [c63a6e8]
  - @nocobase/app-plugin-authentication@2.0.0-beta.12
  - @nocobase/app-plugin-authorization@1.0.0-beta.30
  - @nocobase/app-plugin-file@1.0.0-beta.26
  - @nocobase/i18n@2.0.0-beta.1
  - @nocobase/authorization@1.0.0-beta.15
  - @nocobase/app-cli-client@0.1.0-beta.11
  - @nocobase/app-client@4.0.0-beta.0
  - @nocobase/app-cli@1.0.0-beta.25

## 1.0.0-beta.15

### Major Changes

- baf80fe: Remove the old conversation start, fallback and restore HTTP operations and the conversation fallback/restore CLI commands without aliases. Replace start with POST /api/agents/conversations followed by POST /api/agents/conversations/:id/messages, or conversation create followed by conversation message send. These are two non-atomic requests and may leave an empty conversation if sending fails. Fallback and restore have no same-session replacement: explicitly create a new conversation with the desired executor/agent, without automatically copying history or changing an existing binding. Trusted domain start/fallback/restore methods remain available.

  Historical unbound conversations remain read-only, with owner-authorized cancellation of unfinished old runs. Browser callers must use the narrow configuration input: move tool lists, model lists and system-prompt policy into trusted server configuration, and declare business variables through selected-scope schemas. Existing thinking handling remains unchanged. Apply the visibility migration before serving requests; existing ordinary records default to visible and new background sessions are hidden, with known-session authorization preserved.

  Background run still acknowledges admission. Use get to wait for validated, saved and finalized results, or try with a finite observation budget; observation timeout does not cancel execution. Deliver can return null after saving a notice in the caller's transaction without waking a new-bound conversation. Remove proposed-plan quantity hints from consultation cards while retaining historical data and plan mechanisms, and consolidate the framework and application upgrade documentation.

### Minor Changes

- baf80fe: Add extensible UI context snapshots, application-owned tool renderers, and guarded browser form registries to Agents. Preserve exact originating message linkage through public history and recovery, and demonstrate reviewed, draft-only form proposals in Examples without saving records or continuing completed tools.
- baf80fe: Add a shared public chat-model catalog hook and explicit model selection when creating Online Agent conversations. Update the Examples chat selector to group models by service alongside Agents, with an online-model-or-runner conversation hint and vertical-only option scrolling, preserving Runner status, metadata, and draft content.
- baf80fe: Use shared AI SDK Chat owners for public chat clients, render ordered UIMessage parts and Runner source segments, and reconcile durable history, tool approval, recovery and independent Stop across application surfaces.
- baf80fe: Stream native text increments immediately and support callable Runner agents through the shared OnlineAgent realtime service, atomic conversation admission, canonical block history and unified chat controls. Preserve executor bindings, explicit configuration validation and cancellation confirmation, and exclude server business context from public message metadata.
- baf80fe: Persist native OnlineAgent UI messages directly, expose standard AI SDK response streams, and bind durable tool approval continuations to the owning conversation and execution. Keep private model evidence separate from public parts and retry failed finalization without rerunning effects.
- baf80fe: Extract Native execution ownership behind the execution-specific OnlineAgentBackend contract and delegate backend selection, session creation, restoration and configuration from OnlineAgentService. Replace the Runner-specific backend interface and forwarding wrapper with one concrete Runner session, require explicit unsupported-capability rejection, preserve accepted response ownership across failed sends, retain deferred HTTP configuration boundaries, pin shared recovery to accepted submissions and drain Runner admissions before shutdown without cancelling or redispatching remote work.

  Use admission-only Runner receipts to avoid treating post-commit conversation projection failures as failed inputs. The server-side `ConversationService.sendRealtime()` return contract is now `{ seq, run }`; ordinary conversation send and HTTP response contracts are unchanged.

  Keep startup repair on the session manager and shared producer probing on OnlineAgentService instead of duplicating them in every backend. Remove the public Service `isActive()` and `notify()` methods, the backend notification entry and the `OnlineAgentNotification` type. Existing transactional conversation notices and Runner event refresh are unchanged. Restore sessions by authorized persisted mode and binding metadata, reject invalid bindings or unavailable backends explicitly, and never use configuration reads to infer backend identity.

  Organize OnlineAgent internals under `server/online/agent/`, alongside the online model gateway and services, by Native execution, Runner execution, persistence, message conversion/validation and shared transport. Consolidate fragmented helpers and separate interfaces and data types from runtime implementations while preserving the public server entry points and execution behavior.

- baf80fe: Require a plain JSON Schema in OnlineAgent background `run()` calls instead of Zod. Pass the schema to the AI SDK for structured generation and validate the generated result before persistence. Reject invalid, remote-reference and oversized schemas before accepting execution.
- baf80fe: Add the OnlineAgent server service foundation with versioned conversation configuration, complete SDK message persistence, injectable business tools, shared execution control, and first-subscription stream caching. Preserve ordinary conversation and message identifiers without persistent request deduplication. Connect the original chat HTTP resources and first-subscription events to one shared browser submission and stream controller for application and Registry chat views. Preserve uploaded attachments, per-view drafts and unknown-outcome feedback without hidden retries or Runner fallback.

  Recognize no-content streaming responses by HTTP status even when a browser exposes an empty body, so completed chats read saved history without a false disconnect warning.

  Resolve Scope/Provider model changes consistently through the configuration API. Let users explicitly permit a new input after an unknown send result, and preserve Registry drafts and files when the shared client refuses a submission.

  Let application-provided Organize entries own their availability feedback while retaining default Runner availability hints.

  Bind the authoritative execution session ID to each business tool context so applications can associate business proposals with the current chat without trusting model-supplied identifiers.

- baf80fe: Export validated SDK UI message contracts for OnlineAgent integration and align application SDK dependencies with the matching React client.
- baf80fe: Project saved Runner blocks into SDK UI messages with stable source identities, support optional cross-instance Redis stream recovery and native Stop, and persist independent native business notifications.

### Patch Changes

- baf80fe: Keep an acknowledged realtime recovery from attaching an older stream after a new chat input has started, preserving the active SDK response and its writing state.
- baf80fe: Avoid empty assistant bubbles while thinking and redundant success notifications in shared Agents chat. Keep chat transcripts within their available width while preserving bounded scrolling for wide code blocks and tables, application-owned message extras, and actionable execution feedback.
- baf80fe: Rename the OnlineAgent configuration component to `OnlineAgentConfigurator` and expose it as `onlineAgent.configurator`. Update public exports, tool registration examples, and application consumers to use the consistent naming.
- baf80fe: Reauthorize bounded references from the most recent historical page for follow-up chat input, preserving current context priority and omitting stale parameters or inaccessible records.
- baf80fe: Persist partial tool approval decisions without executing tools or continuing the model until every approval in the step is answered. Automatically finalize saved terminal Runner conversations after final synchronization when their projection producer has restarted.
- baf80fe: Describe Runner cancellation history as a request until termination is confirmed, preserving existing notice identifiers and cancellation behavior.
- baf80fe: Read the chat Agent directory directly from the conversation service without changing the HTTP response or eligibility checks. Remove `chatAgents` from the OnlineAgent service, runtime contract, and constructor dependencies; server callers should use `conversations.chatAgents(userId)` instead.
- baf80fe: Show shared chat progress and safe outcomes, follow growing replies only near the bottom, and align Native defaults, read state and cancellation confirmation across chat consumers.
- baf80fe: Describe conversation configuration, native model selection and SDK message input in generated API and CLI help.
- baf80fe: Save notices for native and Runner OnlineAgent conversations in the caller's transaction without waking an execution, including when input is supplied. Preserve active execution results and propagate persistence errors.

  Reject direct HTTP tool, model-list and system-prompt overrides. Validate business variables against schemas declared by the selected scopes, while preserving trusted server SDK configuration and existing thinking handling.

  Add showInChatList with a non-null true default. Filter ordinary chat lists before database pagination, allow explicit visibility at ordinary conversation creation, and always hide new background sessions. Known-session ownership checks and direct reads remain unchanged.

- baf80fe: Keep conversation agent identifiers non-null with a default sentinel, keep historical conversations readable and read-only while permitting owners to cancel unfinished old runs, and allow application shutdown to complete with a warning if OnlineAgent finalization fails. Persist tool messages using the existing display roles while retaining their canonical SDK roles. Prefix OnlineAgent integration types, narrow server exports, and document the service and configuration API in the plugin Skill.
- baf80fe: Wait for the admitted OnlineAgent execution in get(), including validated result persistence, finalization and occupancy release. Add try({ wait }) for bounded observation with distinct pending, failed and cancelled results and safe errors. Preserve run() admission semantics and finalization retries without rerunning model or tools.

  Update translation and structured extraction examples to await results without status polling while preserving deadlines, disconnect handling and cancellation of late admission.

- baf80fe: Use `OnlineAgentService` directly as the application service contract and remove redundant service interfaces. Update application dependencies, tests, and integration guidance to use the complete service type while retaining the shared realtime-session and Runner-backend contracts.
- baf80fe: Integrate single-instance startup correction, transactional UI notifications and background result observation with standard SDK chat. Preserve approval barriers and actual tool occupancy while making interrupted-effect feedback advisory after finalization.
- baf80fe: Repair previous-process native conversation occupancy during server startup while preserving saved results. Keep interrupted tool facts in private model history, remove effect-review admission locks, and allow owners to cancel historical runs while keeping historical conversations read-only. Stop continues to wait for actual native tool termination and finalization; cancellation requests for Runner and historical runs still require terminal confirmation.
- baf80fe: Show OnlineAgent thinking feedback before the first stream event and place animated waiting feedback directly after the latest chat message in Examples and the Registry block.
- baf80fe: Remove the unused legacy realtime protocol and process-local replay manager after migrating public chat consumers to SDK UI messages. Keep background structured execution and its private model evidence separate from browser streams, and verify the installed application contract.

  Show writing indicators only for the active SDK response so saved partial replies stay still after cancellation, refresh and subsequent turns.

- baf80fe: Store native realtime OnlineAgent messages once as complete SDK UIMessage originals. Derive public history and streams through shared safe projections and model history through current tool converters, enforce lossless JSON tool results, and preserve approval, recovery and finalization idempotency.
- baf80fe: Keep committed chat messages, execution occupancy, paginated history and command results consistent across views. Confirm uncertain submissions into canonical history without resending or reconnecting, and guard delayed actions and Undo callbacks for the authenticated provider lifetime.

  Keep published client test fixtures, navigation guards and language providers in the same Router and application contexts as application pages, and exercise translation model selection through its keyboard interaction.

- baf80fe: Unify native realtime and background conversations on complete internal SDK UI messages, deriving safe public UI history and private model replay from the same original. Restore the common `OnlineAgent` interface with `RealtimeOnlineAgent` and `BackgroundOnlineAgent` subinterfaces and concrete session implementations. Background agents expose `run`, `get`, and `try` without `send` or browser-stream dependencies; structured results remain independently validated execution data. Update application consumers to use the background interface. Historical background ModelMessage storage is not supported by the new reader.
- @nocobase/app-server@3.0.0-beta.0
  - @nocobase/app-plugin-file@1.0.0-beta.25

## 0.1.0-beta.14

### Patch Changes

- c640d35: Clarify runtime coding tool quota percentages as used capacity.
- 1952789: Require explicitly declared realtime topics and authorize dynamic resources before subscription and delivery. Isolate the server core behind a broker contract, retain the application adapter and service tokens, and handle asynchronous publication throughout plugins and examples. Add acknowledged browser subscriptions, bounded recovery and heartbeat handling, shared React refresh helpers, original-session revalidation, transport limits, and usage documentation. The included adapter remains in-process; events are transient and clients recover by refetching after acknowledgement.
- 1952789: Make mail synchronization and office workflow views refresh from committed state notifications, including empty sync results, failures, cancellation and lifecycle transitions. Add optional periodic reconciliation to the shared refresh scheduler, pause hidden views, and retain one-minute reconciliation for transient announcements and out-of-band changes. Reduce existing task, run, session and chat fallback reads to one minute while retaining time-based computer status checks, external indexing status reads, deployment health probes and bounded initialization waits.

  Announce knowledge rechunking start and completion even when no chunks change, and support optional committed status notifications from external indexers. Continue tracking pending index work when some sections have already failed.

  Preserve application providers when `renderWithApp` rerenders its page. Exercise mail refresh through real application services and fix the mail account navigation translation key exposed by those checks.

- 1952789: Add `refreshRealtimeQueries` to refresh active TanStack Query snapshots after pre-event requests settle, including initial loads, prefixes and predicates. Keep inactive snapshots invalid, expose refresh failures, and stop queued follow-ups when their owner is disposed. The application client now declares its TanStack Query peer contract.

  Use the shared catch-up behavior in Projects, Knowledge, Agents, Agent Sessions and the inbox. Refresh additional inbox topics after subscription readiness and preserve refresh promises so concurrent events coalesce correctly. Update application guidance to avoid reusing stale in-flight responses.

- 1952789: Retry transient subscription failures independently with bounded exponential backoff and jitter. Preserve permanent authorization refusals and correlation checks, cancel retries on disposal, and probe healthy foreground connections instead of rebuilding them.

  Retain stale snapshot state after failed reads and retry transient refresh failures without another realtime event. Expose refresh status, last successful synchronization, manual retry and separate subscription error callbacks. Clear previously authorized query data after an HTTP 401 or 403. Reuse the scheduler for Agent Sessions and subject run discovery while preserving slow reads and stream coalescing.

- 7afd595: Remove Refine from the client runtime

  The application shell no longer mounts Refine. `@nocobase/app-client` drops `app.refine`, `app.refineConfig`, `AppClientRefineConfig`, `AppClientRefineRegistry`, `AppClientRefineSetters`, `AppClientRefineSetterValue` and the provider-context methods `runWithProviderContext` and `runWithProviderContextAsync`, which existed only to attribute Refine settings to the provider that made them. Nothing in the repository read what was registered there: a title set through `app.refine.setOptions` never reached the page, and Refine resources never produced a menu entry.

  Refine also created the TanStack Query cache that pages read through `useQueryClient()`; `AppClientProviders` now creates it in the same place, the same way, so pages and plugins behave as before. `@tanstack/react-query` becomes a peer dependency of `@nocobase/app-client` and joins the identity-sensitive packages that plugins must declare as peers.

  `@nocobase/i18n/client` drops `createRefineI18nProvider`, `CreateRefineI18nProviderOptions` and `RefineI18nProvider`. `@nocobase/app-plugin-repository-example` drops its Client ServiceProvider and the `./client/providers` export, which only registered Refine resources.

  `nocobase build` builds the client with `vite build` instead of `refine build`, and `@nocobase/app-cli` no longer lists `@refinedev/cli` as an optional peer. The Default and Examples templates remove every `@refinedev/*` development dependency. The development and plugin Skills no longer mention Refine, and the upgrade Skill explains how an existing application removes its `this.app.refine` calls and Refine packages.

- 7356599: Vertically center runtime tool controls and quota details in their rows.
- Updated dependencies [1952789]
- Updated dependencies [1952789]
- Updated dependencies [1952789]
- Updated dependencies [1952789]
- Updated dependencies [1952789]
- Updated dependencies [7afd595]
  - @nocobase/app-cli@1.0.0-beta.25
  - @nocobase/app-client@4.0.0-beta.0
  - @nocobase/app-plugin-authentication@2.0.0-beta.11
  - @nocobase/app-plugin-authorization@1.0.0-beta.29
  - @nocobase/app-plugin-file@1.0.0-beta.25
  - @nocobase/app-server@3.0.0-beta.0
  - @nocobase/i18n@2.0.0-beta.0
  - @nocobase/authorization@1.0.0-beta.14
  - @nocobase/db@1.0.0-beta.21
  - @nocobase/markdown-mermaid@0.1.0-beta.2
  - @nocobase/service-provider@0.0.2-beta.2

## 0.1.0-beta.13

### Minor Changes

- 32ed5e2: Report coding account quota windows, filter scoped exhausted tools before claims, and restore eligibility at known reset times or after an authorized manual clear. Show quota status and usage in runtime tabs and agent availability, and batch page reads independently of the catalog size.

  Runtime API and CLI: runtime get returns directory totals without directory rows; runtime list omits models, policy, variables, quota details and load, and caps takes at three with takesCount. Use the paginated runtime workspaces command for directory rows. Runtime quota clear takes structured tool/scope/target/window fields and no client revision; only unknown-reset marks may be cleared.

  Classify quota revision races as retryable REVISION_CONFLICT while known-reset clears fail with QUOTA_RESET_KNOWN / FAILED_PRECONDITION.

  Batch related-task visibility and missing blocker reads with the existing issue visibility filter, preserving per-request permissions and hidden blocker counts as task and project counts grow.

### Patch Changes

- Updated dependencies [22717d7]
- Updated dependencies [32ed5e2]
  - @nocobase/app-server@2.0.0-beta.9
  - @nocobase/agent-protocol@0.1.0-beta.10
  - @nocobase/app-plugin-file@1.0.0-beta.24
  - @nocobase/app-plugin-authentication@2.0.0-beta.10
  - @nocobase/app-cli-client@0.1.0-beta.10

## 0.1.0-beta.12

### Minor Changes

- c28f719: The agent queue reads a fixed number of queries however many runs are held or queued: each queued row carries the claim rules' quick explanation, the newest activity of all held runs takes two reads, and the exact reason a queued run waits is read only when its row is unfolded (`RunService.queueWait`, `GET /api/agentBoard/issues/:issueId/agents/:agentId/wait`). The queue refreshes from coalesced announcements with a 45-second fallback poll, and the agents' work marks on issue lists refresh only for announcements about the issues shown, with a 60-second fallback poll.

### Patch Changes

- 14b7aec: Make the run retry back-off and the runners sweep interval configurable: `agents.runs.retryBaseDelayMs` sets the first back-off of a failed run attempt (30 seconds by default, still doubling up to ten minutes) and `agents.runners.sweepIntervalMs` how often the sweep runs (30 seconds by default). The defaults are unchanged; shorter values are meant for tests.
- 56251bc: Reuse issue context, previous summaries, comment deltas and initialization reads for matching parameters within a transaction, reducing repeated work during runner claims.
- ff3ce5d: Clarify that native agents must use the CLI for management operations while explicitly authorized independent test instances allow browser and HTTP verification, with existing credential and permission protections preserved.
- f1f3bd7: Read the dashboard, usage and metrics reports with a fixed number of queries whatever the number of issues, runs and usage records: runs, usage and issues are read in one query each with only the columns the figures use, model usage outside runs is summed in the database, and issue facts are read in three queries instead of two per 200 issues. The Studio dashboard now loads each panel from its own route, `GET /api/reports/delivery`, `GET /api/reports/agents` and `GET /api/reports/projects` (CLI `report delivery`, `report agents`, `report projects`), each loading, failing and refreshing on its own; `GET /api/reports/dashboard` and `report dashboard` are removed.
- 644a773: Reuse claim-local run, capacity, skill and sealed variable reads, batch candidate agent reads, and update routine runner activity timestamps without a separate transaction while preserving dispatch writes and delivery audits.
- 8b9fff1: Read run status without a transaction when no new input needs delivery, while preserving cancellation, lease ownership checks, and input redelivery.
- 616561b: Give dispatched agent runs five minutes to start while their runtime stays online. Immediately requeue server-reclaimed pre-start runtime interruptions without consuming failure attempts or losing unhandled input, stopping after ten consecutive interruptions. Count runner-reported worker startup failures against the normal failure budget with backoff, and distinguish terminal runtime failures from agent failures. Count and list only inbox decisions whose in-app messages still exist, filtering before pagination.
- f2fa59b: Revoke all prior runner registrations and keys when the same owner registers the same name and host again, without a registration lock or new table. Simultaneous registrations may temporarily leave multiple active records, which the next registration revokes. Add a paginated runtime token list that exposes only usable token metadata within the caller's permissions, provide executable revoke/delete guidance, and require an explicit server for runner installation before any files are installed.
- 7abd72b: Allow administrators to configure global and new-project skill defaults in the attachment section, and show visible attachment targets by name with project settings links. Align new-project defaults CLI access with the existing settings permissions.
- c2132c9: Return only workspace totals from the runner list API and `runtime list`, read independent runner summaries concurrently, and fetch directory diagnostics when opening a runner's details. Scripts reading `workspaceUsage.workspaces` from the list must use `runtime get` or the single-runner API instead. The CLI table now includes directory counts, unpushed counts and free disk bytes.
- e94b470: Send selected PNG and JPEG images through the existing conversation attachment flow when organizing requirements. Keep the source requirements and files in memory across navigation, with a manual return to edit or choose another agent after a reading failure.
- 49f61b9: Show optional settings permissions separately from business actions in CLI identity output, and explain run-token-only permissions. Add available-command typo suggestions, a hint for truncated text, and clean shutdown when a pipe closes early. Describe route schema inputs so generated CLI help and reference tables explain their parameters. The manifest identity and whoami JSON result gain an optional settings list; command admission and authorization are unchanged.
- e8f52c9: Keep variable and agent capability dialog actions reachable by limiting dialog height and scrolling long form content internally.
- Updated dependencies [846e75f]
- Updated dependencies [d34b6eb]
- Updated dependencies [98b3862]
- Updated dependencies [525ace4]
- Updated dependencies [1cdbaf4]
- Updated dependencies [5fe8773]
- Updated dependencies [b22d999]
- Updated dependencies [616561b]
- Updated dependencies [83e3609]
- Updated dependencies [00c5970]
- Updated dependencies [0037dd2]
- Updated dependencies [55fcee1]
- Updated dependencies [c0b7537]
- Updated dependencies [eb4b081]
- Updated dependencies [14b7aec]
- Updated dependencies [49f61b9]
- Updated dependencies [0037dd2]
  - @nocobase/app-cli-client@0.1.0-beta.8
  - @nocobase/app-cli@1.0.0-beta.23
  - @nocobase/db@1.0.0-beta.21
  - @nocobase/app-client@3.0.0-beta.2
  - @nocobase/app-server@2.0.0-beta.8
  - @nocobase/agent-protocol@0.1.0-beta.9
  - @nocobase/app-plugin-file@1.0.0-beta.24
  - @nocobase/app-plugin-authentication@2.0.0-beta.10
  - @nocobase/app-plugin-authorization@1.0.0-beta.28
  - @nocobase/authorization@1.0.0-beta.14
  - @nocobase/i18n@1.0.0-beta.7
  - @nocobase/markdown-mermaid@0.1.0-beta.2
  - @nocobase/service-provider@0.0.2-beta.2

## 0.1.0-beta.11

### Minor Changes

- 862a542: Support global default skills and transactional defaults for newly created Studio projects. Resolve skills from global through application scopes to working directories in one query, with more specific targets winning. Stop reading and exposing legacy agent skill attachments while preserving agent variables.
- aae3508: Clear finished runs' events and prompt snapshots hourly after a configurable retention period, defaulting to 14 days. Keep run history and delivery records, and show a retention notice when an expired run has no process data.

### Patch Changes

- 42aaf81: Append authorized project manager follow-ups to compatible active runs, deduplicate source comments, preserve comment authorization when dispatching multiple agents, and guard run completion with Collection optimistic revisions.
- 8e4cf26: Recover runners and agent-session bridges after a protocol upgrade. Heartbeat answers now carry the server's runner protocol (`protocolVersion`), and a runner that speaks an older protocol while no newer version is offered logs what it speaks, what the application needs and how to update, instead of looking up to date. A bridge refused for its protocol now receives the protocols the application speaks in the error's `metadata`; `acp start` then updates the CLI as `update` does and exits non-zero so its launchd, systemd or Startup service starts it again on the new version, and when no update helps it still exits non-zero after a pause rather than stopping with success. A computer whose bridge was refused as too old is shown on My agents with the commands to update it.
- facfe5c: Clear failures when a retried agent run is dispatched or succeeds, and show queued retry explanations separately from current failures while preserving historical errors.
- c1d2601: Claim polls no longer lock or write anything for queued runs they cannot take: comment consent, identity and the agent's concurrency limit are decided from reads, and a transaction opens only for the run about to be claimed. Consent decisions use guarded updates on the request and on each run instead of locking the whole comment run chain, which had exhausted the database pool when several runners polled at once.
- c1d2601: Require owner consent before another person's comment can run on the owner's personal runner. Team runners can take the queued work directly. Keep consent within the comment's run chain, show decisions in Studio's existing Needs you card and inbox, and let the original commenter run pending or rejected work as themselves.
- 92afa27: Make My follow-ups fast for someone who owns many open issues. `GET /api/followUps` reads what every row's progress needs in a fixed number of queries instead of a few per issue, and a row no longer works out why queued work has not been claimed (`waiting`, `managerWait`): the issue's own progress (`GET /api/issueProgress/{issueId}`), shown beside the list, still does. A new `GET /api/followUps/issues?issueIds=…` answers the rows of the named issues, and the page uses it to refresh only the rows an announced change names, a burst at a time, reading the whole overview again only when the list itself changed, on reconnect, for a change that names no issue, and on its fallback poll. The follow star on an issue reads only what the viewer follows from a new `GET /api/followUps/following` (`follow-up following` on the command line) instead of the whole overview, and an agent session's issue progress reads its issues in the same fixed number of queries. The projects plugin's comment queries gain `newestByEach`, the agents plugin's runs gain `openOnEach`, and its run request list takes `subjectIds` and `statuses`.
- 943a9a8: Fix MySQL installation of the agents and releases plugins by removing the unused directory/status index and limiting archive artifact keys to 172 characters while preserving full-value uniqueness. Add a Collection builder inspection method and forward migrations to converge existing installations without truncating data; oversized legacy artifact keys stop the upgrade before any column or index change. Rebuild the existing artifact-key unique index within the migration transaction on SQL Server so indexed legacy columns can be shortened while retaining uniqueness, nullable behavior and the actual index name under custom naming configurations.

  This fix edits the released migrations `202610020003_ag_create_runs` and `202610020001_rel_create_tables` because their oversized indexes prevent fresh MySQL installations from reaching a later repair migration. Existing installations should expect checksum warnings on the next `nocobase db apply`; installations using `onChecksumMismatch: error` stop instead. After reviewing these exact changes, use `nocobase db repair --dry-run` and then `nocobase db repair` to acknowledge the new checksums, followed by `nocobase db apply` to perform the forward schema changes. Repairing checksums alone does not upgrade the schema. The forward corrections are irreversible because restoring the old indexes would make MySQL installations invalid again. See the plugins' `docs/mysql-installation-upgrade.md` for the upgrade and failed-installation recovery procedure.

- 4626949: Start issue runs from the earliest linked open pull request in the same repository, allow agents to manage branches and pull request associations without rewriting pushed history, and preserve shared local branches and stashes when removing run worktrees. Only published runner-created temporary branches are cleaned up. A run that ends on another branch is preserved by that branch, without a saved head or push failure on the starting target.
- c1d2601: Preserve owner-initiated comment delegation without extra personal runner consent and retain every unfinished target and input when the commenter chooses Run as me.
- bdb0581: Reduce the server load of open issue and My follow-ups pages. Issue change announcements are gathered for a moment and name the issues that changed, so a page refreshes only what it shows of them; Studio announces new runs on an issue, so issue pages, What it waits for, owner handoffs and My follow-ups fall back to a slow poll instead of polling every few seconds; a preview label the server failed to set no longer makes the issue page poll every three seconds. Polled reads check issue visibility without loading the whole issue page (`IssueQueries.visible`), What it waits for reads only the project manager's newest comments (`CommentQueries.newestBy`), My follow-ups shares lookups across its issues, and pull request marks check visibility in one read. A runner heartbeat no longer announces a runner change, waking every waiting claim and refreshing every runtimes page, unless its disk sample moved by a gigabyte, crossed the free-space threshold or changed size.
- f36da62: Keep a runner claiming work while it collects working directories. Collection no longer measures every directory's size by reading every file, which on runners with many directories took tens of minutes per round and held all claims meanwhile; only pruning the shared pnpm store still holds claims. Routine collection now runs an hour after the previous round ended (`WORKSPACE_REPORT_INTERVAL_MS`), still at once when the disk runs low, and the runner logs each round's start and duration. Workspace diagnostics show a directory's size only when a runner reported one.
- 99be3d0: Use short private per-run temporary directories on Linux and macOS so Unix sockets can start, reserve TMP and TEMP alongside TMPDIR, and reclaim temporary files through the existing run lifecycle and garbage collection.
- bdb0581: A public realtime topic can be defined with `authenticated: true` (`defineTopic` and `registerTopic` of `@nocobase/app-server/realtime`): subscribing without a signed-in principal is then refused with `AUTHENTICATION_REQUIRED`, as for a user topic, and publishing skips connections without one. The projects plugin's `pm:changes`, the agents plugin's `agents:runners` and Studio's `studio:issues:runs`, whose announcements name records by id, now reach signed-in connections only. The authentication plugin opens the realtime connection again when the signed-in person changes, so a page signed in without a reload receives these topics and user topics.
- Updated dependencies [8e4cf26]
- Updated dependencies [69e212c]
- Updated dependencies [943a9a8]
- Updated dependencies [943a9a8]
- Updated dependencies [e23633e]
- Updated dependencies [1cd749c]
- Updated dependencies [f36da62]
- Updated dependencies [bdb0581]
- Updated dependencies [9b946f4]
  - @nocobase/agent-protocol@0.1.0-beta.8
  - @nocobase/app-cli-client@0.1.0-beta.7
  - @nocobase/app-server@2.0.0-beta.7
  - @nocobase/app-cli@1.0.0-beta.22
  - @nocobase/db@1.0.0-beta.20
  - @nocobase/app-plugin-authentication@2.0.0-beta.9
  - @nocobase/app-plugin-file@1.0.0-beta.23
  - @nocobase/app-plugin-authorization@1.0.0-beta.27

## 0.1.0-beta.10

### Minor Changes

- ddfe1b1: Discover agents from what runners report instead of having people create them. Each coding tool and normalized model a runner reports becomes one agent (`source: 'runner'`, a deterministic id, named from a model catalog such as "Claude · Opus 5.5"), pending until someone who manages agents writes what it is good at and enables it (`PATCH /api/agents/{agentId}` with `description`, `effort`, `enabled`); an application keeps agents of its own with `agents.ensureSystem`, and sets every discovered agent's instructions and actions with `agents.setDefaults`. A model a run reports unavailable is marked on that runner until the runner reports its models again, and an agent no runner reported for 14 days is shown without a runner and left out of `roster`. Online agents, consultations, the online executor, agent presets, creating, archiving and deleting agents, the chat model choice and the default chat model settings are removed; conversations go to an enabled agent and say why one cannot answer (`othersPersonal` added, `AGENT_NOT_ENABLED`). Model services remain for the application's own model calls through `models.gateway` (renamed from `online.gateway`). Claims carry `workspace.key` and `workspace.readOnly` from the subject's assembly (`SubjectAssembly.workspaceKey`, `readOnly`). The migration `202610240020_ag_runner_agents` adds the new columns, removes every existing agent (rows kept and marked deleted so history still names them), cancels their queued runs, withdraws their pending run requests and clears default chat agents.
- 6fc0af2: Require the issue owner to start or continue Studio project manager work, and ignore agent wakeups from comments on unstarted issues. Run the manager and its delegated steps as the current owner while preserving trigger audit information. Withdraw all queued agent work and request cancellation of held runs on owner transfers, without automatically restarting them. Correct legacy queued identities before claim and expose waiting reasons.

  Expose the existing transactional `Projects.activity` recorder for application issue events and deliver owner transfers to all work kinds before ordinary triggers, including executor clearing. Restore Studio wording for models, efforts, the start dialog and historical sub-issue activity.

  Preserve delegated execution identity throughout repeated retries, including handled inputs, and show the initiator of the current retry instead of copied retry history.

- abc3fcb: Keep enabled agents prominent, group new discoveries by tool and catalog model, and persist shared ignore and restore preferences with revision protection. Choose a provider without changing existing execution identities and show personal runner names. Discover only authenticated Pi providers and prevent model overrides from bypassing that filter. In Studio, authorize runs through their running identity and existing command scope instead of intersecting with legacy agent action lists, including reports, while retaining object permissions, credential scopes, read-only modes and human approval requirements.

  Show recognizable provider and runner labels when selecting a model and cap atomic bulk discovery operations at 256 selected groups with explicit counts and limits.

### Patch Changes

- 10e261b: Use a private linked Git worktree per run and save local continuation after stopping its tools. Fast-forward the resume reference, retain divergent heads as separately listed saved references, and preserve the directory on cleanup failure. Keep Codex state outside disposable worktrees. Other tools start fresh when their code directory changes; legacy sessions and clones are not migrated. Distinguish private local branches from task push targets and retain older runner compatibility.
- ee24e95: Clean idle build artifacts before pushed workspaces when disk space is low, pause new work until heartbeats detect recovery, and report disk-full failures for reassignment without counting a project-manager step failure. Show current disk capacity and workspace size, type and push diagnostics.

  Retry interrupted removal of verified pushed attempt directories from GC or the next run, stop their remaining processes before deleting remnants, and retain cleanup failure reasons without blocking later tasks. Preserve unpublished or uncommitted work for recovery.

  Verify the actual checkout branch and HEAD before retrying removal, report disk exhaustion even when local preservation metadata or events cannot be written, and continue safe pressure cleanup when diagnostic cache writes fail.

- 4748117: Allow the project manager to use an idle fallback after a configurable queue delay, exclude runners that cannot honor its workspace, and show selection and waiting reasons. Persist queue episodes through retries and restarts, withdraw unclaimed manager delegations after a configurable timeout, reliably report their cause in the dispatch thread, and publish identity-aware immediate capacity in each manager roster.
- fad531f: Initialize the project manager's name and description once in the installation's default language and allow administrators to edit them, including clearing the description. Restarts and unrelated settings saves preserve the identity. Later changes to the installation language do not rename an initialized manager.

  An upgrade seed preserves valid explicit settings, custom legacy agent values, empty descriptions, and unknown settings. Legacy agent values identical to the former built-in English defaults cannot be distinguished from manual writes and are initialized in the upgrade language when no valid explicit setting exists. A damaged `studioSettings.projectManager.value` stops initialization with a repair instruction instead of overwriting it.

  Resolve historical run inputs, notifications, delegation cards, plans, and consultation identity labels from stable agent IDs without rewriting historical text or execution snapshots. Legacy limit notices and plans whose identity cannot be recovered use neutral labels, and unresolved consultations mark the originally requested subject. Refresh identity caches when the manager is renamed.

  Mount application query effects inside the projects plugin's cache using its optional `queryEffects` composition point. Keep completed consultation labels current after renames and distinguish loading, inaccessible agents, and historical request snapshots.

- a2cf036: Interrupt agent runs for runner updates after stopping tools and preserving local continuation references. Requeue upgrade interruptions without consuming failure attempts or notifying project managers, retain task inputs, and report draining capacity and reasons in runner and queue views.
- Updated dependencies [157a914]
- Updated dependencies [8698e80]
- Updated dependencies [10e261b]
- Updated dependencies [9e99702]
- Updated dependencies [ddfe1b1]
- Updated dependencies [ee24e95]
- Updated dependencies [4748117]
- Updated dependencies [a2cf036]
- Updated dependencies [6758f9f]
  - @nocobase/app-cli-client@0.1.0-beta.6
  - @nocobase/agent-protocol@0.1.0-beta.7
  - @nocobase/app-server@2.0.0-beta.6
  - @nocobase/app-plugin-authentication@2.0.0-beta.8
  - @nocobase/app-plugin-file@1.0.0-beta.23

## 0.1.0-beta.9

### Patch Changes

- 65ec64a: Preserve failures after issue status transitions, isolate background card reconciliation failures, and return a specific failed precondition for repeated retries.
- 65ec64a: Prevent concurrent and repeated retries of the same run, retain retry attribution, and link retried runs to their replacements. Automatically settle obsolete failed-run decisions after retries, new work, reassignment, or issue completion, including outstanding cards from earlier releases.
- Updated dependencies [65ec64a]
- Updated dependencies [65ec64a]
  - @nocobase/agent-protocol@0.1.0-beta.6
  - @nocobase/app-cli-client@0.1.0-beta.5

## 0.1.0-beta.8

### Minor Changes

- 3668ab1: Tell each issue run what was said since the agent's last run. A subject's assembly may add a note to the turn of a resumed session (`turn.resumed`) or of a fresh one (`turn.fresh`), chosen once the claim knows which it is. The comment threads list (`GET /api/projects/issues/{issueId}/comments`, `issue comment list`) takes `since` to return only what was written after it. Studio uses both: a resumed run hears that no comment arrived, the few new comments, or how many and the `--since` command that reads them; a fresh session or a first run is told to read the issue's comments before acting.

### Patch Changes

- 693e43d: Update agent guidance to refer to the renamed `nocobase-app-plugin-development` Skill.
- Updated dependencies [d54dd59]
- Updated dependencies [d54dd59]
  - @nocobase/app-plugin-authentication@2.0.0-beta.7
  - @nocobase/app-cli@1.0.0-beta.20

## 0.1.0-beta.7

### Patch Changes

- cf23bfe: Republish every package so the `latest` dist-tag points at its current beta release, matching `beta`.
- Updated dependencies [cf23bfe]
  - @nocobase/agent-protocol@0.1.0-beta.5
  - @nocobase/app-cli@1.0.0-beta.19
  - @nocobase/app-cli-client@0.1.0-beta.4
  - @nocobase/app-client@3.0.0-beta.1
  - @nocobase/app-plugin-authentication@2.0.0-beta.6
  - @nocobase/app-plugin-authorization@1.0.0-beta.27
  - @nocobase/app-plugin-file@1.0.0-beta.23
  - @nocobase/app-server@2.0.0-beta.4
  - @nocobase/authorization@1.0.0-beta.13
  - @nocobase/cli-envelope@0.1.0-beta.1
  - @nocobase/db@1.0.0-beta.19
  - @nocobase/i18n@1.0.0-beta.7
  - @nocobase/markdown-mermaid@0.1.0-beta.2
  - @nocobase/service-provider@0.0.2-beta.2

## 0.1.0-beta.6

### Minor Changes

- 4044a42: Allow workflow Run agent rules to start a fresh session on every stage entry while preserving working directories and other agents' sessions. Preserve the choice across queued run merges, confirmation requests and retries, and expose it in run responses.

  New software development workflows enable fresh sessions for proposal review and code review. Existing workflows are unchanged: workflow owners can enable “Start a new session every time” in the rule editor. The agents database migration adds `freshSession` columns to runs and run requests with a default of false; no existing workflow configuration is migrated.

- 0f7ed64: Give a run's git a repository credential whenever it needs one, instead of one handed out at the claim that a long run outlives, and say why a push failed.

  - Protocol version 9 adds the `gitCredentials` runner feature, `RunGit.onDemand` (repository URLs whose credential the runner asks for), `POST /api/agents/runners/runs/:runId/gitCredentials` (`GitCredentialRequest` → `GitCredential`), the reasons `REPO_ACCESS_UNAVAILABLE` and `REPO_ACCESS_DENIED`, the run failures `repoAccessUnavailable` (retried) and `repoAccessDenied`, and `RepoReport.failure` (`authFailed`, `credentialUnavailable`, `credentialDenied`, `leaseLost`, `rejected`, `error`). Nothing of version 8 changed: an application on this version still hands claim-time credentials to runners without the feature. A runner of this version is refused by an application that does not know version 9, so update the application before its runners.
  - Repository access providers may implement `issue(request)`. For a runner with the feature the claim tells them `onDemand` (in `forRun`'s context and `prepare(run, { onDemand })`), they list their repositories in `RunGit.onDemand` and mint nothing at the claim; the plugin then calls `issue` outside any transaction, within 15 seconds, only while that runner holds that attempt of the run under a live lease, and only for a URL the claim listed, compared exactly. `issue` answers a credential with its expiry, null when the repository is not its own, or throws `RepoAccessError('unavailable' | 'denied', message)` with a message safe to show; with `refresh` it should issue a new credential rather than a cached one. Each issued credential is added to the run's redaction, and is never stored. A provider without `issue` keeps working as before.
  - Migration `202610100002_ag_add_run_git_credentials` adds `agRuns.gitCredentialUrls` (the URLs the claim listed) and `agRunRepos.failureReason` and `failureDetail`; a run's repositories (`RunRepo`) gain optional `failure` so existing application schemas remain compatible. The server always supplies it, null when the repository was pushed or not tried. Applications should show it, since a run that completed may still have work that was not pushed.
  - The runner keeps a run's credentials in the worker's memory and no longer puts any password in the agent's environment. The agent's git gets them through the runner's credential helper, which reaches the worker over a Unix socket private to the run; the runner's own git (checkout, submodules, the end-of-run push, which previously sent no credential) uses the same, never the host's credential helpers, and retries once with a fresh credential when the remote refuses one. The agent is told on stderr why git got no credential, and each failure is recorded as an `error` event with `meta.kind` `gitCredential`.
  - Host-side operations in task checkouts use the safe Git wrapper, retaining its metadata and configuration checks, protected hooks and fixed push URL/refspec. Run credentials disable restoration of host helpers; the agent environment clears helpers per repository URL before installing the runner's helper. Confirmed pushes update remote-tracking refs and the protected workspace record so cleanup recognizes pushed work.

- e9301ed: Check a subject’s admission policy in the claim transaction and cancel outdated issue runs without failing or retrying them. The same policy, with the subject's new optional `selectInputs`, also decides whether input may join a working run and whether pending input is delivered to it: input the subject rejects waits in a queued run for the claim to admit or cancel, and pending input it no longer admits or selects is marked handled instead of being delivered, or of holding the run's completion open. The runner completes again, rather than starting a turn with an empty prompt, when input it was told is pending never arrives. Studio permits its executor only in execution statuses and workflow agents only in their current stage; an agent mentioned by name, or answered under its own comment, runs in any stage, except the executor. Earlier stage instructions are left out of the turn rather than cancelling the run, which is cancelled only when nothing else remains. Approving a proposal now requires an eligible executor (`DESIGN_EXECUTOR_REQUIRED` otherwise). Requeue live workspace contention without consuming execution attempts, bounded by a six-hour wait, with a compatible failure fallback for older applications.

  Filter obsolete stage instructions consistently from the assembled task, turn and delivered inputs. Record permission-rejected executor claims atomically and notify the owner once with the required pull request permission and reassignment options. Preserve restart after an acknowledged project move.

- ee41a40: Show the executing agent's active work on issue tables and boards using scoped batch summaries, with pending approvals taking precedence and visible-page refreshes.

### Patch Changes

- 69309da: Normalize the runner artifact response description's string quoting to satisfy the shared formatter, without changing its text or runtime behavior.
- a50b4f6: Expose the chat query cache for application submission coordinators and keep conversation details and history current after sends. Explain unavailable header targets and query recovery conversations only when creation results are unknown. Keep upload tasks attached to their draft when an editor switches conversations, preserving pending sends across remounts.
- ca0bfe2: Normalize formatting of the agent distribution API description without changing its content or behavior.
- ee217d5: Start a fresh conversation with context recovery instructions when the requested conversation no longer exists, and report its session so later runs resume it. Claude checks its session file before opening the query, preserving immediate handling of startup errors. Cancelled runs now also report their confirmed session.
- b4c2116: Add compatible directory settlement diagnostics and repository-scoped merged head evidence. Recheck ended workspaces before cleanup, permit untracked leftovers only after commit and tracked-change checks, preserve unpushed submodule commits, cancel a removal when the follow-up report no longer confirms the work is over, and show low disk reports with permission-aware workspace diagnostics.
- 107edd5: Keep in-flight subject run requests when refresh signals arrive so slow responses can update the shared run cache instead of being repeatedly cancelled by discovery polling.
- c1b397d: Correct Alibaba Qwen's default DashScope base URL.
- 90d5fab: Remove a working directory once its subject's work is over, on the subject's status alone. Studio counts an issue as over when it is done or cancelled, whatever its pull requests are, and resolves directories without a known run by their issue key. The agents plugin no longer checks which runner worked on a subject, so legacy directories on any runner are decided too, and no longer asks bindings for commit evidence. The runner removes an ended directory with anything never pushed in it, and logs that it did; it still keeps one a run holds or used since the report, and one the second report no longer confirms as ended. Directories whose work goes on keep their unpushed-work protection. Runners released earlier still keep ended directories with unpushed work, since decisions now carry no commit evidence.

  New runners connected to older applications that only return legacy remove lists continue protecting unpushed commits and changes. Only a settled directory decision permits discarding unpushed work; automatic collection confirms that decision in a second report before deletion.

- Updated dependencies [251d19e]
- Updated dependencies [ca0bfe2]
- Updated dependencies [0f7ed64]
- Updated dependencies [e9301ed]
- Updated dependencies [ee217d5]
- Updated dependencies [b4c2116]
  - @nocobase/app-plugin-authentication@2.0.0-beta.5
  - @nocobase/app-cli-client@0.1.0-beta.3
  - @nocobase/agent-protocol@0.1.0-beta.4

## 0.1.0-beta.5

### Minor Changes

- 40a5679: An application can name the runner and its CLI on npm when it has no tarball of them. `agents.dist.npm` maps a product to its npm package and an exact version, such as `{ nocobase-runner: { package: '@nocobase/agent-runner', version: '1.0.0' } }`; a product `agents.dist.dir` has a current version of is still served from there exactly as before. Only callers that say they understand the answer receive it: the resolve route (`/api/agents/dist/products/<product>/targets/<target>`) answers `{ kind: 'npm', product, version, package, channel }` (or `kind=npm` lines with `format=env`) to a request with `accept=npm`, and a heartbeat answer carries `npmUpgrade` instead of `upgrade` only to a runner that declares the new `npm` feature. Every other caller gets what it got before: the artifact when there is a tarball, otherwise a 404 and no update.

  `@nocobase/agent-protocol` adds `DistNpmPackage`, `DistResolution`, `DIST_ACCEPT_NPM`, `NpmUpgradeNotice`, `HeartbeatResponse.npmUpgrade` and the `npm` runner feature (`NPM_UPGRADE_FEATURE`), and moves `PROTOCOL_VERSION` to 8 so that a runner announcing `npm` is refused cleanly by a server that does not know it. Nothing of protocol 7 changed: a server speaking 8 still serves runners speaking 3 to 7. A runner speaking 8 is shown as needing an upgrade by an application that serves only up to 7, so upgrade the application before its runners.

  NocoBase Studio pins the runner it serves to the exact `@nocobase/agent-runner` version it was built with, recorded by `pnpm build` in `dist/server/agents/served-versions.json` (the runner stays out of the deployment's dependencies), and names it on npm when its image carries no runner tarballs. Redeploying Studio moves runners that understand npm updates to that version.

- 13620d9: The runner and an application's CLI can now be installed and updated from npm when the application serves no tarball of them and names the exact npm version instead (`agents.dist.npm`). The install script asks with `accept=npm`; for an npm answer it checks for Node.js 24 or newer and `npm` (or `NOCOBASE_NPM`), runs `npm install --prefix <prefix>/versions/<version> --no-save --no-audit --no-fund --omit=optional <package>@<version>` and writes a launcher at `versions/<version>/bin/<command>`, so `current`, the linked command and the runner's user service work as they do for a tarball, and links `<prefix>/node` to the Node.js it checked. The runner declares the `npm` feature and installs a heartbeat's `npmUpgrade` the same way between runs; `nocobase-runner update` and `<cli> update` follow either answer, and an installation moves between tarball and npm versions in both directions (`installNpmVersion`, `npmLauncherScript` and `UpdateTarget` in `@nocobase/app-cli-client/install`). An application that answers no npm form is handled exactly as before.

  `@nocobase/agent-runner` and `@nocobase/app-cli-client` now depend on exactly the `@nocobase/agent-protocol` they were built with, and `@nocobase/studio-cli` and `@nocobase/agent-runner` on exactly their `@nocobase/app-cli-client`, so a version installed from npm behaves as it was built.

  `nocobase skills sync` no longer reads Skills from a packaged application CLI (a dependency declaring `nocobase.cli`, such as `@nocobase/studio-cli`): its `skills/` is for that command's users. NocoBase Studio declares `@nocobase/studio-cli`, so its build pins `nb-studio` to the version it was built with, and its CLI documentation and home-page agent prompt say that `nb-studio` needs Node.js 24 or newer with npm. The application development Skill documents `nocobase cli build --universal`.

- 459c33f: `nocobase cli build --universal` packs the application's CLI, or with `--runner` the runner, into one platform-independent tarball, `<product>-v<version>-universal.tar.gz`, that carries no Node.js and runs on the machine's own Node.js 24 or newer; without `--targets` it is the only tarball packed. Its launcher runs on `NOCOBASE_NODE`, the installation's `<prefix>/node`, `node` on PATH, or the Node a previous standalone version of the installation still carries, so a runner's user service, whose PATH usually has no `node`, keeps starting.

  The agents plugin serves that tarball to every platform without a tarball of its own (one built for the platform still wins) and marks the answer with `universal: true` (`universal=true` with `format=env`); answers for platform tarballs are unchanged. For a universal tarball the install script checks that `node` is Node.js 24 or newer before downloading, stops with how to install it otherwise, and links `<prefix>/node` to it; with `--runner` it prints a `corepack enable` hint when `pnpm` is missing. The "Add runtime" dialog says the host needs Node.js 24 or newer.

  An update of an installed CLI or runner to a version without a bundled Node (`applyUpdate` of `@nocobase/app-cli-client/install`) first leaves the Node it runs on in `<prefix>/node` (`pinNode`), copied when it is a Node an older version bundles, so a runner that updates itself from a standalone version keeps a Node after the old versions are removed.

### Patch Changes

- 9d28d61: The install script checks for npm with an explicit `if`, which shellcheck accepts.
- 97bd30b: The runner now runs agents with full access and the real home of the user it runs as, and is no longer a sandbox. Codex runs with approval policy `never` and the `danger-full-access` sandbox, accepting any approval it still asks for; Claude Code runs in `bypassPermissions` mode with no hooks; OpenCode and Pi have every permission request allowed. The command policy (allowed commands, denied patterns, download rules, path checks) and the isolated per-workspace home are gone; each run still gets its own TMPDIR, and Codex a per-workspace `CODEX_HOME` linking `auth.json` and `config.toml` from `~/.codex`. The push guard (the `pre-push` hook that let a checkout push only its run's branch) is removed, and an earlier runner's is deleted on upgrade; the run's short-lived repository credential is still provided, so protect default branches on the code host.

  Operators: an agent can now read and change anything the runner's user can, including SSH keys, cloud credentials and `~/.nocobase-runner`. Run the runner as a dedicated OS user that holds only what agents need, in a container or in a VM, and not as root (Claude Code refuses `bypassPermissions` as root). `start --agent-home` is gone. Agents' tool policies keep their idle timeout and turn limit; their permission mode and command patterns are accepted and no longer enforced, and the agent page no longer shows the command rules.

- d3763a2: Studio's `pnpm build` now packs the universal `nocobase-runner` and `nb-studio` packages into `dist/runners/`, at the exact versions it records in `dist/server/agents/served-versions.json` (`nb-studio` at `@nocobase/studio-cli`'s version, the runner at `@nocobase/agent-runner`'s), and fails when they differ. Studio serves them from there by default, so every build, deployment archive and image serves the runner and CLI it was built with, including to runners installed from a package, which can only update from one. `agents.dist.dir` in `config.yml` and `NB_STUDIO_RUNNERS_DIST` still take precedence, and npm stays the fallback for a Studio without packages, such as `pnpm dev`. The build installs the packages' dependencies with npm, so it needs access to the npm registry. The Dockerfile no longer takes a `runners-dist/` directory, and it rejects a prebuilt `dist/` without `dist/runners`. The published package now includes `ai/`, the Skills `nb-studio` ships, which an installed Studio needs to pack it.

  `nb-studio` packages are now versioned as `@nocobase/studio-cli` rather than as Studio. An installation that served `nb-studio` packed with `pnpm nocobase cli build` and no `--version` handed out Studio's version, which sorts higher, so `nb-studio update` does not offer the new package there: install `nb-studio` again with the install script.

  The agents plugin's documentation describes building the runner and CLI into an application's own build output as an alternative to separate CI artifacts.

  `@nocobase/studio-cli` now shares Studio's version line (a `fixed` changesets group), so the `nb-studio` Studio serves keeps the versions earlier Studio builds handed out and `nb-studio update` offers it to existing installations.

- Updated dependencies [40a5679]
- Updated dependencies [91f5344]
- Updated dependencies [17a183c]
- Updated dependencies [13620d9]
- Updated dependencies [97bd30b]
- Updated dependencies [459c33f]
  - @nocobase/agent-protocol@0.1.0-beta.3
  - @nocobase/app-cli@1.0.0-beta.18
  - @nocobase/app-plugin-authentication@2.0.0-beta.4
  - @nocobase/app-cli-client@0.1.0-beta.2

## 0.1.0-beta.4

### Minor Changes

- 5aae93b: Add optional raw event type filtering to run event queries and the generated CLI. Apply filters before sequence pagination while preserving the default unfiltered history and existing access checks.

  Add a reversible run/type/sequence index so following a sparse event type does not repeatedly scan unrelated events in long runs. Pagination cursors retain their existing meaning.

  Document complete transcript loading, scoped filter preferences, and filter label translation in the UI Library catalog.

- c796cb9: Remove the Settings and Dev route surfaces. `@nocobase/app-client` no longer exports `defineSettingsRoutes()`, `defineDevRoutes()`, `isAppClientSettingsRouteGroup()`, `isAppClientDevRouteGroup()` or their definition, contribution and registered-route types, and the resolved runtime no longer carries `settingsRouteTree`, `devRouteTree`, `settings`, `settingGroups`, `devRoutes` or `devRouteGroups`. `AppClientSettingsRouteNavigation` is renamed `AppClientRouteNavigation` and `AppClientSettingIcon` is renamed `AppClientRouteIcon`. A contribution to any parent other than `app` now fails registration with a message that names `defineAppRoutes()`. Plugins contribute no settings or dev pages; an application that wants a configuration page declares it with `defineAppRoutes()` in its own navigation, for example under a Settings group.

  The default and examples templates drop the settings layout, the `/settings/*` route, the dev route plumbing, and the Settings and Inbox buttons in the header; the `/inbox` page and the inbox block stay. The examples template no longer registers `@nocobase/app-plugin-departments-example`, which is removed. Upgrading an application means removing `defineSettingsRoutes([])` from `client/routes.ts`, the `settingsRouteTree` and `devRouteTree` props passed to `AppRouter`, and any settings layout it kept, and moving its own settings pages to `defineAppRoutes()`. Every package that depends on or peers with `@nocobase/app-client` is released again so that its published range accepts `3.0.0-beta.0`.

### Patch Changes

- c796cb9: Remove the AI employee packages from the repository

  `@nocobase/app-plugin-ai-employee`, `@nocobase/ai-employee` and `@nocobase/app-plugin-ai-employee-example` were already deprecated and no template installed them; they are now deleted and will not be released again. The Default and Examples templates drop `@nocobase/ai-employee-avatars`, which only the plugin's avatars used.

  Generated plugins' `AGENTS.md` and the copies shipped with existing plugins no longer list `@nocobase/ai-employee` among the identity-sensitive packages. The HTTP API references in the application development Skill use other plugins for their examples, and the upgrade Skill tells an application that still depends on the removed packages to review their usage before removing them, because the runtime will move past what their peer ranges accept.

  `pnpm build` no longer copies `ai/skills` into `dist/ai/skills`. The AI employee plugin was the only reader of that directory; an application that keeps Skills there for another purpose has to copy them itself, for example from a build hook.

- Updated dependencies [c796cb9]
- Updated dependencies [c796cb9]
- Updated dependencies [c796cb9]
- Updated dependencies [c796cb9]
- Updated dependencies [98e79a5]
- Updated dependencies [eea95a7]
- Updated dependencies [fb7b576]
  - @nocobase/app-cli@1.0.0-beta.17
  - @nocobase/app-server@2.0.0-beta.3
  - @nocobase/app-plugin-authentication@2.0.0-beta.3
  - @nocobase/app-plugin-authorization@1.0.0-beta.26
  - @nocobase/app-client@3.0.0-beta.0
  - @nocobase/app-plugin-file@1.0.0-beta.22
  - @nocobase/i18n@1.0.0-beta.6
  - @nocobase/authorization@1.0.0-beta.12
  - @nocobase/db@1.0.0-beta.18
  - @nocobase/markdown-mermaid@0.1.0-beta.1
  - @nocobase/service-provider@0.0.2-beta.1

## 0.1.0-beta.3

### Minor Changes

- 97d94dc: Preserve each run attempt's runtime, owner, tool version, requested model and reasoning effort, and expose primary-tool models reported during execution in run lists and details. Retain execution history when a retry releases its holder. Existing runs expose known usage models without inventing historical runtime snapshots.

  Allow applications to attach execution snapshots to agent activity traces and return the originating run and attempt on comments. Applications must wire these facts into their run views, CLI projections and activity badges; installed UI Library component copies require an explicit update.

  Separate requested settings from tool-reported effort, retaining report provenance and change times. Codex reports resolved thread settings and explicitly marks per-turn overrides unreported when the tool returns no resolved value. Apply reader machine permissions to execution history and action sources, skip unchanged snapshot writes, and filter/deduplicate legacy model queries in the database. Custom application outputs must apply the provided machine projections, and projects hosts can supply the same rights through `Viewer.seesExecutionMachine`.

- d942ae9: Add run requests to the agents plugin: when someone other than the person who answers for a subject wakes an agent on it, the work waits for that person to confirm it, or runs on the asker's own account.

  - `runs.enqueue` takes `responsibleUserId`, `requestedByUserId` (the source of the chain of work), `causedByRunId` (work a run caused keeps that run's source) and `execution: 'auto' | 'mine'`. When the source is the responsible, or no responsible is given, work is queued as before. When the source is someone else, `auto` stores a run request instead of queueing anything. `mine` queues the work at once as the source, on their own runner or a team runner, and is refused with `NO_RUNNER_AVAILABLE` when no online runner would take it by the claim's rules (`eligibility.canClaim`, the agent's team-only variables included).
  - Breaking for callers that read the result: `EnqueueResult` is now `RunEnqueued | RunRequestPending`, and `outcome` gains `'pending'`. A pending result has a `requestId` and has `runId` and `inputId` set to `null`. Check `outcome` before using `runId`. Work that names no responsible is never pending.
  - `actorUserId` is optional on `EnqueueRequest` when a `responsibleUserId` is given.
  - New `runs.requests` service:
    - `confirm` and `reject`: only by the responsible. Confirming queues the work as the responsible with the input as it was asked, and its actor is the asker.
    - `withdraw` and `runAsRequester`: only by the asker.
    - `list`, `get` and `pendingOn` read requests.
    - `reassign`: for when the subject's responsible changes. A request whose seven days already ran out is expired instead of being renewed or queued.
    - `expireDue`: run by the sweeper. A request expires after seven days and the asker gets a `run_request_expired` notice. Any path that finds a request past its expiry treats it as expired, even before the sweep.
  - A request keeps the work's `fireAt` and `maxAttempts`, and confirming restores them. A `fireAt` that has already passed means the work runs now. Work with a `parentRunId` (a consultation) is never made to wait for confirmation and is refused instead.
  - New routes, for people by session or unscoped API key only:
    - `GET /api/agents/runRequests`
    - `GET /api/agents/runRequests/{requestId}`
    - `POST /api/agents/runRequests/{requestId}/confirm`, `reject`, `withdraw` and `runAsMe`
    - CLI commands: `run request list|get|confirm|reject|withdraw|run-as-me`.
  - New events: `runRequest.created`, `confirmed`, `rejected`, `withdrawn`, `superseded` and `expired`. Breaking type rename: `RunnerNotice` is now the single `AgentsNotice` interface, which adds `run_request_expired` alongside the existing runner and run notices, with subjects of kind `runner`, `run` or `runRequest`. Applications must replace imports and references to `RunnerNotice` with `AgentsNotice`; no old-name alias is exported. Both `notice` and `notice.cleared` use this interface.
  - Runs record `requestedByUserId` and `confirmedByUserId`. Migration `202610090002_ag_create_run_requests` creates `agRunRequests`, adds both columns to `agRuns`, and fills `requestedByUserId` of existing runs from `actorUserId`. It runs after the team runner variables migration (`202610090001_ag_add_team_runner_variables`).
  - The sweeper's report gains `requestsExpired`.
  - Work is merged or appended only into runs with the same `actorUserId`, including `mine`, `runAsMe` and confirmed requests.
  - Subjects can bind `responsibleUserId(conn, subjectId)` to recheck current responsibility when confirming or rejecting. Without a resolver, applications must reassign requests when responsibility changes. A reassignment that has no usable responsible expires the request, notifies its requester and preserves execution as the requester.
  - `auto` requests require the requester's own agent permission. Identical pending snapshots reuse the existing request without renewing its expiry or emitting another creation event, including when database drivers return attempt counts as strings or equivalent scheduling times in different representations. Run request mutation routes declare concurrent settlement errors (409).
  - `@nocobase/agent-protocol` adds the error reasons `RUN_REQUEST_NOT_FOUND`, `RUN_REQUEST_SETTLED` and `NO_RUNNER_AVAILABLE`.

- f94ebc6: Pass proxies and CA certificates to coding tools, let the runner's owner pass and set variables, and let an agent take a variable from the runner.

  - The runner passes the proxy variables (`HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY`, `NO_PROXY`, upper and lower case) and the CA variables (`SSL_CERT_FILE`, `NODE_EXTRA_CA_CERTS`) from its own environment to every coding tool by default. The values of the proxy variables are redacted from what a run reports, since a proxy URL may carry a password.
  - `nocobase-runner start --pass-env NAME` and `service install --pass-env NAME` (repeatable) pass a variable from the runner's environment to every run. The names are remembered in the settings for later starts; `nocobase-runner env unset NAME` forgets one.
  - `service install` writes the installing shell's proxy, CA and `--pass-env` variables, with their current values, into the launchd plist or systemd unit beside `PATH`, and prints the names it wrote. The unit or plist is now written with mode 0600, `%` is escaped for systemd, and `--dry-run` and `--json` show `<hidden>` instead of the values.
  - `nocobase-runner env set NAME [VALUE]`, `env unset NAME` and `env list` keep the runner's local variables (`apps/<key>.json`, 0600). `set` reads the value from standard input when it is left out, and `list` shows names only.
  - Coding tool detection uses the whitelist, passed variables and local variables of its application, rather than the runner's whole environment. Heartbeats refresh detection when local variables or passed names change, without sharing local keys between applications.
  - A run's `workspace.passthrough` names are now provided only by the runner's local variables and its `--pass-env` names, no longer by any variable of the runner's environment. A run that asks for a name the runner does not provide fails before anything is prepared, with `setupFailed` and a message naming `nocobase-runner env set NAME` and `--pass-env NAME`.
  - Protocol: `RegisterRequest` and `HeartbeatRequest` gain an optional `variables`, the names of the variables the runner provides (names only, at most `MAX_RUNNER_VARIABLES`, validated by `RunnerVariableNamesSchema`). A server that does not know the field ignores it, and a runner that does not send it is shown as not reporting.
  - Agents plugin: a variable can be taken from the runner. `PUT /api/agents/variables/{scopeKind}/{scopeId}/{name}` takes `fromRunner: true` without a value (`variable set ... --from-runner`), which keeps the name only (new collection `agRunnerVariables`, migration `202610090005_ag_add_runner_variables`), and `Variable.fromRunner` marks such variables in lists. Such names merge with the other variables by scope like any variable, and a claim puts those whose last entry is taken from the runner into `workspace.passthrough` instead of `workspace.env`. The variable dialog has a "Take from the runtime" option, and the list a badge. Runner-owned names are rejected; older declarations of reserved names fail preparation explicitly.
  - Agents plugin: a runner's reported names are kept on the runner (`agRunners.variables`, `Runner.variables`, null when it reported none), and the runtime's sheet lists them under "Variables from this machine". Runners are not chosen by them.

- 1832cfc: Report models and available reasoning efforts detected by Pi, OpenCode and Codex through optional protocol 7 capability fields, with explicit detection status and periodic background refresh. Bound model counts and identifier lengths, and keep configuration, paths and credentials out of failure reasons. Store capabilities per runner and return model suggestions through existing visibility rules without changing Agent configuration. Discard invalid or unfamiliar advisory fields without rejecting registration or heartbeats.

  Run model discovery with the agent environment whitelist in empty temporary directories, terminate discovery process groups on cancellation and wait for cleanup during runner shutdown. Preserve Pi provider/model identifiers, discard invalid efforts individually and avoid reporting successful detection when every received model is invalid.

  Pi's startup version and authentication checks now also use the restricted environment. API keys supplied only through the runner daemon's environment no longer count as a Pi login during detection; configure Pi's persistent authentication for the runner user. Pass run-specific variables explicitly through the application's run environment or passthrough contract instead of relying on implicit daemon environment inheritance. Those run-specific variables are not used for host capability discovery.

- 0170880: Remove a runner's working directories once their work is over. Every ten minutes the runner reports each working directory it keeps for an application, with the last run that worked in it, whether it holds work that was never pushed and when it was last used, and the free space on the disk holding them (`POST /api/agents/runners/workspaces`). The application finds each run's subject and asks the subject's binding whether its work is over (the new optional `SubjectBinding.workspaces.settled`), never while a run on that subject has not finished, and answers which directories may go. Callers who may not see a runner's machine see only the counts and the disk of `Runner.workspaceUsage`, without the directories. The runner removes them, except a directory with unpushed work, which it keeps and reports as unpushed: changes not committed (untracked files included), or a HEAD past both where the runner started the checkout and what it last saw the remote task branch hold after pushing. The runner keeps its record of each working directory in its own directory (`~/.nocobase-runner/workspaces/`), out of the agent's reach, and checks a record an earlier runner left inside the working directory: caches are derived from the repository URL, paths must stay inside the directory, and what it says was pushed is ignored. The existing retention rules (7 days after a fully pushed run, 30 days unused) no longer remove a directory with unpushed work either. Whether a branch was merged is never judged from the default branch's history, so squash merges count as merged once the application says the work is over. A runner keeps reporting only to an application whose heartbeat answer announces it (`HeartbeatResponse.workspaces`); older runners and older applications keep the existing retention rules. The runner also watches the free space on the disk holding its working directories, reading it from the file system rather than measuring directories, against `min-free-disk`: 5 GB by default, or a size or a share of the disk (`nocobase-runner register --min-free-disk 20G`, or `nocobase-runner config set min-free-disk 20G|10%|off`). It removes on its own only the directories whose work is over, least recently used first, never a pushed directory whose work goes on; when the disk is still low after that, it logs once per collection how many pushed and unpushed directories remain and that `nocobase-runner gc` can remove them. `min-free-disk` replaces the earlier `workspace-limit` setting, which upgrading drops from the runner's settings with a one-time log line. `nocobase-runner gc` lists every working directory with its application, subject, server status, unpushed state and last use, with the disk's free space and the threshold, and with `--apply` removes what the rules allow, filtered by `--ended`, `--older-than` and `--subject`; `--force` also removes unpushed work. The application keeps each runner's last report (`agRunners.workspaceUsage`, added by a migration) and shows it as `Runner.workspaceUsage`.

### Patch Changes

- d89339e: Claude Code now reports its models and their reasoning efforts through the Agent SDK's `supportedModels()`, without sending a prompt, instead of reporting model detection as unsupported.

  Codex reasoning efforts are now `low`, `medium`, `high`, `xhigh`, `max` and `ultra`, as current Codex releases advertise them: `minimal` is gone, and `max` is passed to Codex as itself rather than as `xhigh`. An agent entry already saved with an effort its tool no longer takes keeps it until the entry is changed.

  In an agent's tools and models, the effort select stays aligned with the rest of its row, and the reported efforts are listed on a line of their own below the entry, naming only efforts that can be chosen. Model suggestions no longer carry a "Built-in" badge. In the agents list, a long description wraps within the name column, two lines at most, with the full text on hover. The agents list now shows the agents everyone can use first, the application's own in the order it added them, then the viewer's own agents, then the ones others share with them, each group by the name shown in the viewer's language; list entries carry `owned`, whether the caller owns the agent.

  The runner now gives agents its own Node.js and pnpm: it ships pnpm 11.7.0 and writes `node` and `pnpm` launchers first on each run's PATH, and keeps pnpm from switching to the version a repository's `packageManager` names, so `pnpm install` works on a machine without pnpm or with another Node.js. `nocobase-runner config set agent-tools system` keeps the machine's own instead. The runner's own `pnpm store prune` also uses the bundled pnpm, so garbage collection no longer needs pnpm on the runner's PATH.

- de5254b: Merge built-in model suggestions with visible runtimes' model reports in Agent editors, show reporting runtimes and their current readiness, and suggest their reported reasoning efforts without changing saved configuration. The model combobox expands to fit model names and source badges on one line, within the available viewport, and uses the correct singular or plural runtime count.
- 8974f9c: Retry a run's preparation when git fails for a passing cause. The runner retries cloning, fetching and the submodules' update three times, after 2, 5 and 15 seconds, when git's error names a cut-off TLS handshake, a reset, refused or timed-out connection, a name that did not resolve, or an HTTP 5xx or 429, and aborts a transfer slower than 1 KiB/s for a minute instead of hanging. Each retry is a `status` event in the run. A repository that does not exist, credentials the host refuses, a certificate the runner does not trust, any other HTTP 4xx, and an error that names no passing cause fail at once, with a hint of what to fix where git names the cause. When every retry fails, the run fails with the new retryable reason `prepareNetwork`, and the application queues it again under the run's retry policy. The failure's error event records how many retries were made and the last error, also when the last attempt failed for a permanent cause. Submodules an earlier preparation could not finish, nested ones included, are finished by the next preparation of the same worktree. The application announces the reasons it accepts on each run (`RunHeader.acceptedFailures`), and the runner reports `checkoutFailed` to an application that does not announce `prepareNetwork`.
- 97d94dc: Retain the latest actual reasoning effort observation across repeated reports so delayed reports cannot overwrite newer facts, while preserving value and source change times.
- Updated dependencies [d89339e]
- Updated dependencies [d942ae9]
- Updated dependencies [9235602]
- Updated dependencies [de5254b]
- Updated dependencies [f94ebc6]
- Updated dependencies [1832cfc]
- Updated dependencies [8974f9c]
- Updated dependencies [0170880]
- Updated dependencies [0daf996]
  - @nocobase/agent-protocol@0.1.0-beta.2
  - @nocobase/app-cli@1.0.0-beta.16

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

- 0fd2538: Answer conversations with an online agent when a runner agent cannot run for the person. The team's chat settings gain `onlineFallbackAgentId`, an online agent set on the agents page or with `conversation settings update --online-fallback-agent`. A conversation started with a runner agent that no runner may run for its owner now, such as one whose only online runner is someone else's personal runner, starts on that online agent as if switched, and the owner may switch back; `chatAgents` reports it per agent as `fallbackAgentId`. `POST …/fallback` may now switch a runner conversation to the online fallback agent, and a conversation's `mode` follows the agent it answers with. Without an online fallback agent set, runner conversations do not switch automatically.

  Runner availability uses the same claim eligibility as execution, including required features and variables restricted to team runners. Existing runner conversations also switch on the next message when no eligible runner remains, transferring unanswered queued messages to the online agent. Manual switching skips an unavailable system default, and switching back is offered only when the original agent can answer again.

  The configured online fallback is available for automatic and manual switching only while an enabled model service offers its default answering model. If that model becomes unavailable, new and existing conversations retain the original runner agent and record a system notice explaining why the online fallback cannot answer.

  Repeated messages during the same fallback failure keep a single explanatory notice. A changed failure reason or a failure after availability recovers records a new notice.

  Consumer behavior changes: a conversation's `mode` now follows its current agent when switching or restoring, rather than remaining fixed for its lifetime. Switching between runner and online agents clears the selected model. Clients should read the returned conversation's `mode` after each switch.

### Patch Changes

- 41cc0b8: Only a runner's owner may change it. A manager of runners (`agents.runners` manage) can no longer rename someone else's runner, change its slots, coding tools or job setting, or share a personal runner with the team, which would have sent everyone's work to another person's machine with their tools' sign-ins and credentials; `PATCH /api/agents/runners/:runnerId` answers `403` instead. A runner whose owner can no longer act (none recorded, or an account the application reports disabled or deleted) is changed by managers of runners, so it is not left unchangeable. Managers keep revoking any runner as an emergency measure, and deleting it once revoked: revoking someone else's runner now tells its owner through a `runner_revoked` notice and is recorded in the application's `security` log. Runner summaries gain `canRevoke`, and `canManage` and `canChangeTrust` now mean the caller may change the runner; the Runtimes page shows someone else's runner read only, with revoke or delete as the only menu items.
- Updated dependencies [487921c]
- Updated dependencies [a6758ec]
  - @nocobase/app-server@2.0.0-beta.2
  - @nocobase/app-cli@1.0.0-beta.15
  - @nocobase/app-cli-client@0.1.0-beta.1
  - @nocobase/app-plugin-file@1.0.0-beta.21
  - @nocobase/markdown-mermaid@0.1.0-beta.1
  - @nocobase/app-plugin-authentication@2.0.0-beta.2
  - @nocobase/app-client@2.0.0-beta.2
  - @nocobase/authorization@1.0.0-beta.12
  - @nocobase/db@1.0.0-beta.18
  - @nocobase/i18n@1.0.0-beta.5
  - @nocobase/service-provider@0.0.2-beta.1
  - @nocobase/app-plugin-authorization@1.0.0-beta.25

## 0.1.0-beta.1

### Minor Changes

- 476f988: A call to an OpenCode base URL (Zen or Go) carries `x-opencode-session` automatically, as OpenCode Go requires: the same session id for every model call of a conversation and a new one for each call outside any, so no service setting is needed. Every request to a provider names the plugin first in its user agent (`nocobase-agents/<version>`). The service form says which provider type serves which of OpenCode's model families.
- b8df35c: Limit a runner's concurrent runs per coding tool, beside its total slots, so a machine with Claude Code and Codex can run, say, at most two Claude runs and one Codex run at once.

  - `@nocobase/agent-protocol`: optional `toolSlots` on registration, `load.tools` on the heartbeat and `tools` on the claim (`ToolSlots`, `ToolLoad`). They are additions within protocol 7: a side that does not know them ignores them.
  - `@nocobase/agent-runner`: `register --slots` and `start --slots` take a total, limits per tool, or both (`3,claude=2,codex=1`). The limits hold across every application the machine serves; each claim says how many runs of each limited tool the runner can still take, and the heartbeat reports them.
  - `@nocobase/app-plugin-agents`: runners and registration tokens keep `toolSlots`, set on registration or on the runtime's settings and in the "Add runtime" dialog. A claim takes a run only when both the runner's total and the run's tool have room, using the agent's next tool while its first is full and passing over a run none of whose tools has room. A queued run waiting on a full tool reads `toolSlotsFull` rather than `runnersBusy`, and the runtimes page shows the runs by tool against each limit. The migration `202610080001_ag_add_runner_tool_slots` adds the columns. A runtime's settings list its coding tools in one table (on or off, sign-in, limit, runs now), and a tool's switch is now saved with "Save" together with the rest of the form instead of at once. The "Add runtime" dialog keeps the limits per tool under "Advanced" for the checked tools, and its button reads "Generate install command". A limit above the max concurrent runs is pointed out, since the total bounds it.
  - `@nocobase/app-plugin-projects`: words the `toolSlotsFull` wait reason.

  Every field this adds to the shared types is optional, so code that builds these objects itself needs no change: `Runner.toolSlots` and `Runner.toolLoad`, `RunnerSummary.activeByTool`, `RegistrationToken.toolSlots`, and `HeldItems.byTool` of `Slots`. The server always fills them in. A missing field reads as no limit per tool and nothing known about its use, and the runtimes page then shows no use per tool. `RUN_WAIT_REASONS` gains `toolSlotsFull`, so a `Record` keyed by every `RunWaitReason` needs an entry for it.

  Applications using a copied UI Library `agent-queue` block must merge the `toolSlotsFull` reason and wording changes from `ui-library/registry/agents/agent-queue` into their copy. This PR updates the registry source, including an optional label with an English fallback, but a plugin upgrade does not update installed source. Add `queue.reasons.toolSlotsFull` to the application's translations to show the new reason in its locale.

### Patch Changes

- 220700e: Size the Y axis of the usage page's daily trend chart to its tick labels, so cost amounts with a currency prefix are no longer clipped at the left edge.
- Updated dependencies [bb8484b]
- Updated dependencies [dc91aab]
- Updated dependencies [b8df35c]
  - @nocobase/app-client@2.0.0-beta.2
  - @nocobase/app-plugin-authentication@2.0.0-beta.2
  - @nocobase/app-plugin-file@1.0.0-beta.20
  - @nocobase/agent-protocol@0.1.0-beta.1
  - @nocobase/app-cli@1.0.0-beta.14
  - @nocobase/app-server@2.0.0-beta.1
  - @nocobase/authorization@1.0.0-beta.12
  - @nocobase/db@1.0.0-beta.18
  - @nocobase/i18n@1.0.0-beta.5
  - @nocobase/markdown-mermaid@0.1.0-beta.0
  - @nocobase/service-provider@0.0.2-beta.1
  - @nocobase/app-plugin-authorization@1.0.0-beta.25

## 0.1.0-beta.0

### Minor Changes

- 68d4feb: Add `@nocobase/app-plugin-agents`: agents for NocoBase applications. Work agents drive a coding tool (Claude Code, Codex, OpenCode or Pi) on the runners people connect, which the plugin registers, hands runs to through a long-poll claim with slots, leases and a sweeper, and serves the runner and the application's CLI to as tarballs with a one-line install script. Online agents call a model of the model services the plugin keeps (OpenAI, Anthropic, Google, DeepSeek and other providers through the AI SDK) and run on the server with a sandboxed shell, their skills and the application's CLI. Both share runs, people's conversations with agents (with attachments and page context), transcripts, skills and variables, business-action permissions bounded by the person who woke the agent, consultations between online agents, usage and cost reports, and an embedding, rerank and text gateway for the application's own model calls. The application assembles it through extension points (subjects, scopes, business actions, presets, the action gate, conversation sources) and its CLI commands come from its own routes through `cliRoute()`. The package ships the `nocobase-app-plugin-agents` Skill.

### Patch Changes

- Updated dependencies [37c8d20]
- Updated dependencies [37c8d20]
- Updated dependencies [37c8d20]
- Updated dependencies [37c8d20]
- Updated dependencies [37c8d20]
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
- Updated dependencies [be0fbbd]
- Updated dependencies [bc1e83f]
- Updated dependencies [3883eec]
- Updated dependencies [6993158]
- Updated dependencies [a6796d9]
- Updated dependencies [37c8d20]
- Updated dependencies [37c8d20]
- Updated dependencies [3f1b78f]
- Updated dependencies [8885ce4]
- Updated dependencies [0151805]
- Updated dependencies [bc1e83f]
- Updated dependencies [37c8d20]
- Updated dependencies [37c8d20]
- Updated dependencies [e538d12]
- Updated dependencies [bc1e83f]
- Updated dependencies [bc1e83f]
- Updated dependencies [37c8d20]
- Updated dependencies [bc1e83f]
- Updated dependencies [37c8d20]
- Updated dependencies [37c8d20]
- Updated dependencies [bc1e83f]
- Updated dependencies [6162033]
- Updated dependencies [37c8d20]
  - @nocobase/agent-protocol@0.1.0-beta.0
  - @nocobase/app-cli-client@0.1.0-beta.0
  - @nocobase/markdown-mermaid@0.1.0-beta.0
  - @nocobase/app-cli@1.0.0-beta.14
  - @nocobase/app-client@2.0.0-beta.1
  - @nocobase/app-server@2.0.0-beta.1
  - @nocobase/app-plugin-authentication@2.0.0-beta.1
  - @nocobase/authorization@1.0.0-beta.12
  - @nocobase/app-plugin-authorization@1.0.0-beta.25
  - @nocobase/db@1.0.0-beta.18
  - @nocobase/app-plugin-file@1.0.0-beta.19
  - @nocobase/i18n@1.0.0-beta.5
  - @nocobase/service-provider@0.0.2-beta.1

## 0.0.1

Initial version.
