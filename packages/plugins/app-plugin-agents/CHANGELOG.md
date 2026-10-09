# @nocobase/app-plugin-agents

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
