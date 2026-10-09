# @nocobase/agent-runner

## 0.1.0-beta.2

### Patch Changes

- 9321a2a: Initialize a repository's submodules while preparing its worktree, before the agent starts and outside the coding tool's sandbox, and fail the preparation with a clear error when they cannot be fetched. A new worktree initializes every submodule recursively; a resumed one only those not initialized yet. Submodules are fetched with the repository's credential, sent only to the repository's own host. Codex's sandbox now also lets the agent write the run's other working directories and each worktree's own Git directory (`<cache>/worktrees/<name>`), never the shared repository cache.
- a6758ec: Point published package repository metadata to nocobase/nocobase while preserving each package's monorepo directory.
- Updated dependencies [a6758ec]
  - @nocobase/app-cli-client@0.1.0-beta.1

## 0.1.0-beta.1

### Minor Changes

- b8df35c: Limit a runner's concurrent runs per coding tool, beside its total slots, so a machine with Claude Code and Codex can run, say, at most two Claude runs and one Codex run at once.

  - `@nocobase/agent-protocol`: optional `toolSlots` on registration, `load.tools` on the heartbeat and `tools` on the claim (`ToolSlots`, `ToolLoad`). They are additions within protocol 7: a side that does not know them ignores them.
  - `@nocobase/agent-runner`: `register --slots` and `start --slots` take a total, limits per tool, or both (`3,claude=2,codex=1`). The limits hold across every application the machine serves; each claim says how many runs of each limited tool the runner can still take, and the heartbeat reports them.
  - `@nocobase/app-plugin-agents`: runners and registration tokens keep `toolSlots`, set on registration or on the runtime's settings and in the "Add runtime" dialog. A claim takes a run only when both the runner's total and the run's tool have room, using the agent's next tool while its first is full and passing over a run none of whose tools has room. A queued run waiting on a full tool reads `toolSlotsFull` rather than `runnersBusy`, and the runtimes page shows the runs by tool against each limit. The migration `202610080001_ag_add_runner_tool_slots` adds the columns. A runtime's settings list its coding tools in one table (on or off, sign-in, limit, runs now), and a tool's switch is now saved with "Save" together with the rest of the form instead of at once. The "Add runtime" dialog keeps the limits per tool under "Advanced" for the checked tools, and its button reads "Generate install command". A limit above the max concurrent runs is pointed out, since the total bounds it.
  - `@nocobase/app-plugin-projects`: words the `toolSlotsFull` wait reason.

  Every field this adds to the shared types is optional, so code that builds these objects itself needs no change: `Runner.toolSlots` and `Runner.toolLoad`, `RunnerSummary.activeByTool`, `RegistrationToken.toolSlots`, and `HeldItems.byTool` of `Slots`. The server always fills them in. A missing field reads as no limit per tool and nothing known about its use, and the runtimes page then shows no use per tool. `RUN_WAIT_REASONS` gains `toolSlotsFull`, so a `Record` keyed by every `RunWaitReason` needs an entry for it.

  Applications using a copied UI Library `agent-queue` block must merge the `toolSlotsFull` reason and wording changes from `ui-library/registry/agents/agent-queue` into their copy. This PR updates the registry source, including an optional label with an English fallback, but a plugin upgrade does not update installed source. Add `queue.reasons.toolSlotsFull` to the application's translations to show the new reason in its locale.

### Patch Changes

- Updated dependencies [b8df35c]
  - @nocobase/agent-protocol@0.1.0-beta.1

## 0.1.0-beta.0

### Minor Changes

- 37c8d20: Add `@nocobase/agent-runner` (`nocobase-runner`): it makes a machine, such as a server, a VM or someone's own device, a runtime of one or more NocoBase applications. It registers with them, claims the agent runs they queue, prepares each run's working directories and skills, and drives Claude Code, Codex, OpenCode or Pi on them, with the application's CLI installed for the run and the run's credential written for it. It also executes build jobs, installs as a user service (launchd or systemd), and updates itself between runs when an application serves a newer build. Its state lives in `~/.nocobase-runner` and its environment variables are `NOCOBASE_RUNNER_*`.

### Patch Changes

- Updated dependencies [37c8d20]
- Updated dependencies [37c8d20]
  - @nocobase/agent-protocol@0.1.0-beta.0
  - @nocobase/app-cli-client@0.1.0-beta.0

## 0.0.1

Initial version.
