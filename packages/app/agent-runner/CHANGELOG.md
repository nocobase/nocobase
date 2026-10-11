# @nocobase/agent-runner

## 0.1.0-beta.4

### Minor Changes

- 13620d9: The runner and an application's CLI can now be installed and updated from npm when the application serves no tarball of them and names the exact npm version instead (`agents.dist.npm`). The install script asks with `accept=npm`; for an npm answer it checks for Node.js 24 or newer and `npm` (or `NOCOBASE_NPM`), runs `npm install --prefix <prefix>/versions/<version> --no-save --no-audit --no-fund --omit=optional <package>@<version>` and writes a launcher at `versions/<version>/bin/<command>`, so `current`, the linked command and the runner's user service work as they do for a tarball, and links `<prefix>/node` to the Node.js it checked. The runner declares the `npm` feature and installs a heartbeat's `npmUpgrade` the same way between runs; `nocobase-runner update` and `<cli> update` follow either answer, and an installation moves between tarball and npm versions in both directions (`installNpmVersion`, `npmLauncherScript` and `UpdateTarget` in `@nocobase/app-cli-client/install`). An application that answers no npm form is handled exactly as before.

  `@nocobase/agent-runner` and `@nocobase/app-cli-client` now depend on exactly the `@nocobase/agent-protocol` they were built with, and `@nocobase/studio-cli` and `@nocobase/agent-runner` on exactly their `@nocobase/app-cli-client`, so a version installed from npm behaves as it was built.

  `nocobase skills sync` no longer reads Skills from a packaged application CLI (a dependency declaring `nocobase.cli`, such as `@nocobase/studio-cli`): its `skills/` is for that command's users. NocoBase Studio declares `@nocobase/studio-cli`, so its build pins `nb-studio` to the version it was built with, and its CLI documentation and home-page agent prompt say that `nb-studio` needs Node.js 24 or newer with npm. The application development Skill documents `nocobase cli build --universal`.

- 97bd30b: The runner now runs agents with full access and the real home of the user it runs as, and is no longer a sandbox. Codex runs with approval policy `never` and the `danger-full-access` sandbox, accepting any approval it still asks for; Claude Code runs in `bypassPermissions` mode with no hooks; OpenCode and Pi have every permission request allowed. The command policy (allowed commands, denied patterns, download rules, path checks) and the isolated per-workspace home are gone; each run still gets its own TMPDIR, and Codex a per-workspace `CODEX_HOME` linking `auth.json` and `config.toml` from `~/.codex`. The push guard (the `pre-push` hook that let a checkout push only its run's branch) is removed, and an earlier runner's is deleted on upgrade; the run's short-lived repository credential is still provided, so protect default branches on the code host.

  Operators: an agent can now read and change anything the runner's user can, including SSH keys, cloud credentials and `~/.nocobase-runner`. Run the runner as a dedicated OS user that holds only what agents need, in a container or in a VM, and not as root (Claude Code refuses `bypassPermissions` as root). `start --agent-home` is gone. Agents' tool policies keep their idle timeout and turn limit; their permission mode and command patterns are accepted and no longer enforced, and the agent page no longer shows the command rules.

### Patch Changes

- 91f5344: Allow applications to opt coding runs into verified empty-repository initialization. Prepare the default branch without a seed commit, report the first-delivery instructions, and guard its push against updating an existing remote branch. Keep missing branches in populated repositories as checkout failures.
- Updated dependencies [40a5679]
- Updated dependencies [91f5344]
- Updated dependencies [13620d9]
- Updated dependencies [97bd30b]
- Updated dependencies [459c33f]
  - @nocobase/agent-protocol@0.1.0-beta.3
  - @nocobase/app-cli-client@0.1.0-beta.2

## 0.1.0-beta.3

### Minor Changes

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
- b5c6a64: Share one pnpm store between every run on a machine, `<work root>/.pnpm-store`, so a working directory holds links to its dependencies instead of a copy of them. The agent's environment names the store in `pnpm_config_store_dir` and `npm_config_store_dir`, which a run cannot override; Codex's sandbox may write it; and the agent is told to install without `--store-dir` and never to edit files under `node_modules` in place. Once garbage collection removes a working directory, the daemon runs `pnpm store prune` as soon as no run or claim is active, pausing claims until it finishes. Outstanding claims finish their policy checks and start workers before pruning, so claimed leases are not delayed. Failed pruning stays pending and is retried at the next idle opportunity after five minutes. Existing working directories keep the dependencies they already installed until they are reinstalled or collected.

### Patch Changes

- 97d94dc: Preserve each run attempt's runtime, owner, tool version, requested model and reasoning effort, and expose primary-tool models reported during execution in run lists and details. Retain execution history when a retry releases its holder. Existing runs expose known usage models without inventing historical runtime snapshots.

  Allow applications to attach execution snapshots to agent activity traces and return the originating run and attempt on comments. Applications must wire these facts into their run views, CLI projections and activity badges; installed UI Library component copies require an explicit update.

  Separate requested settings from tool-reported effort, retaining report provenance and change times. Codex reports resolved thread settings and explicitly marks per-turn overrides unreported when the tool returns no resolved value. Apply reader machine permissions to execution history and action sources, skip unchanged snapshot writes, and filter/deduplicate legacy model queries in the database. Custom application outputs must apply the provided machine projections, and projects hosts can supply the same rights through `Viewer.seesExecutionMachine`.

- d89339e: Claude Code now reports its models and their reasoning efforts through the Agent SDK's `supportedModels()`, without sending a prompt, instead of reporting model detection as unsupported.

  Codex reasoning efforts are now `low`, `medium`, `high`, `xhigh`, `max` and `ultra`, as current Codex releases advertise them: `minimal` is gone, and `max` is passed to Codex as itself rather than as `xhigh`. An agent entry already saved with an effort its tool no longer takes keeps it until the entry is changed.

  In an agent's tools and models, the effort select stays aligned with the rest of its row, and the reported efforts are listed on a line of their own below the entry, naming only efforts that can be chosen. Model suggestions no longer carry a "Built-in" badge. In the agents list, a long description wraps within the name column, two lines at most, with the full text on hover. The agents list now shows the agents everyone can use first, the application's own in the order it added them, then the viewer's own agents, then the ones others share with them, each group by the name shown in the viewer's language; list entries carry `owned`, whether the caller owns the agent.

  The runner now gives agents its own Node.js and pnpm: it ships pnpm 11.7.0 and writes `node` and `pnpm` launchers first on each run's PATH, and keeps pnpm from switching to the version a repository's `packageManager` names, so `pnpm install` works on a machine without pnpm or with another Node.js. `nocobase-runner config set agent-tools system` keeps the machine's own instead. The runner's own `pnpm store prune` also uses the bundled pnpm, so garbage collection no longer needs pnpm on the runner's PATH.

- 9235602: Let a Codex run write the `.agents` directory of each of its working trees. Codex's `workspaceWrite` sandbox keeps `.agents` read-only inside every writable root as its own skills root, so an application's `pnpm install` failed with `SKILLS_SYNC_FAILED` when its `skills sync` wrote `.agents/skills`. The runner now creates `.agents` in every working directory and every checked-out submodule before Codex starts, and opens each as a writable root; `~/.agents` and anything outside the run's working directories stay closed.

  Open `.agents` only when its real path is exactly the canonical working tree's `.agents` directory. Links to other paths, including protected siblings or the working tree root, dangling links and non-directory paths are left intact and skipped without stopping the run. Use checked-out submodules' complete paths, including spaces and recursively nested submodules.

  `nocobase skills sync` no longer rewrites a skill whose synchronized copy already matches its source byte for byte, nor a `.claude/skills` link that already points at it, nor an unchanged `.agents/.skills-sync.json`. A sync with nothing new writes nothing.

- 38683c7: Make a runner that updated itself exit so its service starts the new version, and stop what runs leave behind.

  - The foreground daemon now always exits once it has stopped, after stopping whatever is still running below it, instead of returning and waiting for the event loop to drain: a handle left open could keep the old version running, still seen as active by systemd or launchd, so the new version was never started. After updating itself it exits with code 75, which a service set to restart on failure restarts too; otherwise with 0.
  - A run's processes are stopped when its worker ends even when they run in a process group of their own, such as the Codex app-server, the OpenCode server, or a development server or watcher a command started, and even when they left their parent at once. Every process the run's tool starts inherits a random tag of the run's own in its environment (`AGENT_RUN_PROCESS_TAG`), and when the worker exits the daemon kills whatever still carries it, besides the process groups it noted below the worker; it sweeps every run's tag once more when it stops, and recovering a run left by an earlier daemon sweeps it too. The worker also stops what is still below it before it exits.
  - Closing an OpenCode server waits until its process group is empty, not only until the server exits, and kills what is left there, whether the server exited before the close or during it.

- 0170880: Run the runner's own pnpm outside every directory an agent can write, and stop sharing store files with working directories through hard links. `pnpm store prune` used to start in the shared store, which agents may write, so a `package.json` naming another `packageManager`, a `pnpm-workspace.yaml` moving the store or an `.npmrc` left there could make the runner download and run another pnpm or prune elsewhere; it now starts in the runner's own empty `~/.nocobase-runner/tools/cwd/`, names the store with `--store-dir`, turns off switching pnpm versions and passes only PATH, HOME and LANG from the runner's environment. Runs now install with `package-import-method` set to `clone` where the runner finds the work root's file system clones files, and to `copy` elsewhere, never to pnpm's fallbacks that end in hard links, so an accidental edit inside `node_modules` no longer changes the shared store's copy for every other task: APFS, Btrfs, XFS with reflink and ZFS with block cloning clone files at next to no cost, while ext4 copies them, so each working directory there holds a full copy of its dependencies again and the store still saves the download. This guards against accidents, not against a hostile task: tasks on one runner share a store they can all write, so they trust each other, and the store is not an isolation boundary between them.
- 8974f9c: Retry a run's preparation when git fails for a passing cause. The runner retries cloning, fetching and the submodules' update three times, after 2, 5 and 15 seconds, when git's error names a cut-off TLS handshake, a reset, refused or timed-out connection, a name that did not resolve, or an HTTP 5xx or 429, and aborts a transfer slower than 1 KiB/s for a minute instead of hanging. Each retry is a `status` event in the run. A repository that does not exist, credentials the host refuses, a certificate the runner does not trust, any other HTTP 4xx, and an error that names no passing cause fail at once, with a hint of what to fix where git names the cause. When every retry fails, the run fails with the new retryable reason `prepareNetwork`, and the application queues it again under the run's retry policy. The failure's error event records how many retries were made and the last error, also when the last attempt failed for a permanent cause. Submodules an earlier preparation could not finish, nested ones included, are finished by the next preparation of the same worktree. The application announces the reasons it accepts on each run (`RunHeader.acceptedFailures`), and the runner reports `checkoutFailed` to an application that does not announce `prepareNetwork`.
- 0170880: Prepare new task repositories as reference clones with their own Git metadata inside the working directory, so sandboxed coding tools can commit, rebase and update submodules without write access to shared repository caches. Retain existing worktrees and protect borrowed cache objects from automatic pruning.

  Keep push permissions in the runner's protected registry outside checkouts and ignore checkout-local permission files. Enforce protected hooks and checked configuration for every host-side Git operation in a task checkout, using trusted repository URLs for remote queries and automatic pushes. Reject unsafe configuration and redirected submodule metadata without discarding pending work. Remove stale local branches imported from the bare cache when preparing a new task clone.

  Allow standard submodule update policies and common local Git preferences during push and resume, while rejecting custom submodule update commands.

  Retain network retry behavior through the protected Git entry point and keep pending submodule preparation records in the runner-owned cache.

- Updated dependencies [d89339e]
- Updated dependencies [d942ae9]
- Updated dependencies [de5254b]
- Updated dependencies [f94ebc6]
- Updated dependencies [1832cfc]
- Updated dependencies [8974f9c]
- Updated dependencies [0170880]
- Updated dependencies [0daf996]
  - @nocobase/agent-protocol@0.1.0-beta.2

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
