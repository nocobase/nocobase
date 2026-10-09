# @nocobase/app-plugin-agents

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
