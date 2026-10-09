# @nocobase/agent-runner

The runner makes this machine (a server, a VM or someone's own device) a runtime of one or more applications: it registers with them, claims the agent runs they queue, prepares each run's working directories and skills, and drives Claude Code, Codex, OpenCode or Pi on them. It knows no application's business: what the agent must know arrives as a rendered prompt, and what it can do is the application's CLI, which each run names (`RunPayload.cli` in `@nocobase/agent-protocol`); the runner installs that CLI (for Acme, the `acme` tarball the application serves), puts a shim first on the agent's PATH and writes the run's credential for it. Besides agent runs it executes only build jobs, for an application's off-by-default runner build method.

It runs as `nocobase-runner`, its own product (`RUNNER_PRODUCT`). `src/host.ts` holds how it names itself in messages and starts itself again, the version and product it reports on registration and every heartbeat, and the installation and served product it updates itself from (the install layout of `@nocobase/app-cli-client/install`).

An application serves `nocobase-runner` itself, as standalone tarballs that bundle Node.js, built by `pnpm nocobase cli build --runner` of `@nocobase/app-cli` (`<out>/<channel>/nocobase-runner/`, beside the application's CLI). "Add runtime" gives a one-line install (`curl -fsSL <server>/api/agents/dist/installScript | sh -s -- --runner --server <server> --token <one-time token>`) that installs the application's CLI and the runner under `~/.local/share/nocobase-runner`, links `~/.local/bin/nocobase-runner`, registers it and starts it as a user service. An installed runner started by its service updates itself between runs whenever a heartbeat answer names a newer `nocobase-runner` for its platform; `nocobase-runner update` does it now. A runner started from a source checkout only logs that an update is available.

```bash
nocobase-runner register --server https://app.example.com --token <one-time token>   # once per application
nocobase-runner start [--foreground] [--slots 2] [--agent-home isolated|real] [--pass-env NAME]...
nocobase-runner status | logs [-f] [--run <id>] | stop
nocobase-runner service install [--label <label>] [--pass-env NAME]... | uninstall    # a launchd agent (macOS) or a systemd user unit (Linux)
nocobase-runner env set NAME [VALUE] | unset NAME | list [--server <url>]              # local variables for runs that take them from the runner
nocobase-runner update [--check] [--auto on|off]
nocobase-runner uninstall [--purge] [--dry-run]
nocobase-runner unregister --server https://app.example.com
```

One daemon serves every application it is registered with; the slots are shared, and claims rotate across applications. Each application also caps what it hands this runner at the number set on its Runtimes page; when it is registered, that number is taken from `register --slots` if given, else from the registration token ("Add runtime"'s max concurrent runs), else 1, and registering without `--slots` raises the shared slots to the token's number but never lowers them. `register --cli <name>=<path>` makes it use a local build of a CLI instead of installing the one a run names.

### Skills

A run's skills (`RunPayload.skills`) are fetched once per content hash and placed, every run afresh, in `.nocobase-runner/plugin/skills/` of the subject's work directory, where each adapter registers them the way its tool finds skills. Beside them go the skills the run's CLI ships in its own package: once the CLI is installed (or found through `--cli`), the runner follows its entry to the nearest package.json that declares the command and takes every `skills/<slug>/SKILL.md` beside it (`cliSkills`), unless the run brings a skill of the same slug. `acme` ships `acme-cli` this way.

### Coding tools

The runner reports each coding tool it finds, with its version and whether it is signed in, on registration and every heartbeat; the Runtimes page shows them, and a tool it does not find is reported unavailable, so the application offers it no run for that tool. Claude Code is the `claude` on the runner's PATH, resolved to an absolute path and handed to the Claude Agent SDK as `pathToClaudeCodeExecutable`; it must be at least `DEFAULT_MIN_CLAUDE_VERSION`. The SDK's own Claude Code binary is never installed: its platform packages are ignored (`ignoredOptionalDependencies` in `pnpm-workspace.yaml`, and `--omit=optional` in the standalone pack).

### Environment variables

A coding tool runs with what the runner gives it, never with the runner's whole environment, and a runner started as a service never reads a shell's configuration such as `~/.zshrc`. What a tool gets, in order (`src/agent/env.ts`):

- The whitelist from the runner's own environment: `PATH`, `HOME`, `USER`, `LANG`, `TERM`, `TMPDIR`, the proxy variables `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY`, `NO_PROXY` in upper and lower case, and the CA variables `SSL_CERT_FILE` and `NODE_EXTRA_CA_CERTS`.
- The names the machine's owner passes with `--pass-env NAME` (repeatable, on `start` and `service install`). They are remembered in the settings for later starts, and `nocobase-runner env unset NAME` forgets one.
- The run's own variables, set in the application on the agent, a working directory or a scope it registers.
- The variables the run takes from the runner: those set as "Take from the runtime" in the application are names only, and the runner provides their values from its local variables (`nocobase-runner env set NAME`) or from a `--pass-env` name. A name it provides neither way fails the run before anything is prepared, with `setupFailed` and a message that says which command provides it; the application does not choose runners by them. The runner reports the names it provides (never their values) on registration and every heartbeat, and the runtime's page in the application lists them under "Variables from this machine".

`nocobase-runner env set NAME VALUE` keeps a local variable in each registration's file (`apps/<key>.json`, 0600), or only the one `--server` names; without `VALUE` it reads the value from standard input, which keeps it out of the shell's history (`printf %s "$KEY" | nocobase-runner env set PI_API_KEY`). `env list` shows names only. A running runner uses a change from its next run, and reports it with its next heartbeat.

A service gets nothing from the shell it was installed from unless it is written into the service: `service install` writes `PATH`, and the proxy, CA and `--pass-env` variables set in that shell with their current values, into the launchd plist or systemd unit (0600), and prints the names it wrote. Install it again after changing one of them. The values are never printed: `--dry-run` and `--json` show `<hidden>` in their place.

Tool detection (whether a tool is installed and signed in, reported on every heartbeat) runs in the same environment a run gets from the runner, so a login or key the tool reads from a variable is detected only when a run will have it too. The values of the proxy variables (except `NO_PROXY`), of the `--pass-env` names and of the variables a run takes from the runner are redacted from everything a run reports, since a proxy URL may carry a user and password.

### Where things are

The runner keeps its state in `~/.nocobase-runner` (0700, or wherever `NOCOBASE_RUNNER_HOME` says): settings, one registration per application in `apps/`, each registration's runner key in `credentials/` (0600), run records, event spools, logs, bare repository caches, installed CLIs, skill and mount bundles, the push guard hook, and `policy.json`. Agents work elsewhere, in `~/.nocobase-runner-work/<app>/<subject>/` (`NOCOBASE_RUNNER_WORK_ROOT`), each work directory holding the run's worktrees and `.nocobase-runner/` with the agent's home, its TMPDIR, the CLI shim, the run's skills (`plugin/`) and the workspace record. Build jobs work in `~/.nocobase-runner-work/.jobs/<app>/<jobId>/`, removed when each ends.

### Local policy

The machine's owner decides what it takes in `~/.nocobase-runner/policy.json`, which no application can change: `agents` (by name or id), `subjects` (the key a run names, such as `NP-*`), `repos` (`github.com/acme/*`), `build` (whether it takes build jobs), `isolation` (`none`, `user` through `sudo -n -u <user>`, or `container`, not supported yet) for a build's command, and `apps` for per-application overrides. Patterns use `*`; a missing list means anything. The runner reads it before every heartbeat and claim, reports it (`RunnerPolicy`), leaves `jobs.build` out of its features when it takes no builds, and fails anything outside it with `policyRefused`, which the application retries elsewhere. A file it cannot read makes it take nothing.

### What an agent can and cannot do

Every tool call goes through the run's policy (`src/core/command-policy.ts`): commands must match the agent's allowlist (the application's CLI and `cd` always do); explicit paths must resolve inside the work directory or a directory used in place; never the CLI credential file's directory, the runner's directory or the state directory of the person's own copy of the run's CLI (`~/.<cli>`, such as `~/.acme` with their `acme login`), dangerous patterns, commands that download and run code unless `allowedDownloads` lists them, or skipping the push guard. Every worktree may push only its run's branch to the repository it came from (`src/core/push-guard.ts`, a `pre-push` hook the agent's git uses as `core.hooksPath`). Keychain guards refuse reads of the CLI's keychain items (`<cli>-cli`, such as `acme-cli`). The environment is a short whitelist, the `--pass-env` names, the run's variables and the names the run takes from the runner (see "Environment variables"); no `NOCOBASE_RUNNER_*` variable or token reaches the agent. By default each work directory has its own home (`.nocobase-runner/home`) holding links to what the tools need (`~/.claude`, `~/.codex`, OpenCode's and Pi's directories, git and package manager configuration); `--agent-home real` gives the real home instead. Everything reported (events, summaries, failures, job logs) is redacted with `@nocobase/agent-protocol`'s redactor first.

The policy reads shell commands, it does not sandbox them: an agent allowed to run an interpreter or a build script can do anything the runner's user can. True isolation needs a separate OS user or a container per run.

### Development

`src/core/` is the daemon, the claim loop, the supervisor, leases, the event spool, checkouts, jobs, the local policy and isolation; `src/agent/` is agent runs: the coding tools' adapters, the run worker and the preparation of a run's workspace, skills, mounts, home, environment, CLI and credentials; `src/commands/` the commands; `src/host.ts` the command the runner runs as.

```bash
pnpm check                                          # lint, format, typecheck, tests, build
NOCOBASE_RUNNER_ADAPTER=echo nocobase-runner start …   # a scriptable stand-in for every coding tool
NOCOBASE_RUNNER_CLAUDE_SMOKE=1 pnpm vitest run tests/runner/adapters/claude.smoke.test.ts   # against the real tool
```
