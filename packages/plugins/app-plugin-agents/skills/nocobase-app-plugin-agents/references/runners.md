# Runners

A runner (shown as a runtime) is `nocobase-runner` from `@nocobase/agent-runner`, running on a server, a VM or someone's own device. It registers with one or more Apps, long-polls them for work and drives a coding tool for runner agents' runs. The wire protocol is `@nocobase/agent-protocol`. The README's "What it does" section (Runners, The claim, Runs, The sweep) and `@nocobase/agent-runner`'s README are the reference.

## Registering a runner

A runner registers once per App with a one-time registration token (10 minutes):

- On the web: Runtimes page, "Add runtime". It asks who the runner works for (personal, or team for who manages `agents.runners`), which coding tools it may run and its maximum concurrent runs, then shows the one-line install and the register command with a fresh token, and waits for the runner to connect.
- Through the API: `POST /api/agents/runners/registrationTokens` (CLI: `runtime token create`).
- From the App's checkout or deployment: `pnpm nocobase agents runner-token --trust team` or `--trust ownerOnly --owner <user id>`, optionally `--tools claude,codex`. It prints the token (`--json` for the envelope).

Then on the runner's machine: `nocobase-runner register --server <App URL> --token <token>`, and `nocobase-runner start` or `nocobase-runner service install` (launchd on macOS, a systemd user unit on Linux). The install script does all of this in one line; see [Distribution](distribution.md).

A runner authenticates afterwards with its own key. Personal runners (`ownerOnly`) run only work their owner started, and receive its variables like any runner, except those marked "Team runtimes only" (`teamRunnersOnly`): a run that gets one goes to a team runner. Their owner may share them with the team. `nocobase-runner unregister --server <url>` or "Revoke" on the Runtimes page ends a registration.

## How work reaches a runner

- **Heartbeat**: the runner reports its system, features, coding tools (version, installed, signed in), its owner's local policy and the product it runs as. It is marked offline after 150 s without one. The heartbeat answer reconciles what it holds (releasing what the server no longer thinks it holds, asking it to stop what was cancelled) and carries an `upgrade` notice when a newer `nocobase-runner` is served for its platform.
- **Claim**: one long-poll, `POST /api/agents/runners/claim?wait=true`, answers jobs and runs together, at most the runner's free slots. A run is handed over only when one of the agent's tools is enabled, installed and signed in there, the agent names no runner or this one, the runner is shared or owned by who woke the agent, its features cover what the run needs, the agent's concurrency has room and the runner's local policy allows the agent, subject and repositories. The claim renders the brief, mints a run token and hands over working directories, variables, skills and the CLI to install.
- **Lease and sweep**: a runner renews its lease while it works; the sweeper (every 30 s) takes back runs from runners that went away or lost their lease, and retries the retryable failures (`runnerOffline`, `policyRefused`, `leaseExpired`, `startTimeout`, `cliUnavailable`, `toolNetwork`, `toolRateLimit`) while attempts remain.
- **Local policy**: the machine's owner decides what it takes in `~/.nocobase-runner/policy.json` (agents, subjects, repos, build, per-App overrides). An App cannot change it. Work outside it fails `policyRefused` and goes to another runner; a policy file it cannot read makes it take nothing.

## Protocol versions and `upgrade_required`

Every runner request carries its protocol version (`PROTOCOL_VERSION` of `@nocobase/agent-protocol`). The App serves a range (`MIN_PROTOCOL_VERSION` to `PROTOCOL_VERSION`; `RunnerSummary.requiredProtocol` on the API). A runner outside it stays connected with status `upgrade_required`: it gets no work, what it held is released, and its owner is told once per protocol through the `notice` event (`runner_upgrade_required`; `notice.cleared` once it connects with a supported protocol). Forward that event to the App's inbox or notifications so the owner hears about it.

What to do: upgrade the runner to a version that speaks the App's protocol. An installed runner updates itself between runs when the App serves a newer `nocobase-runner`, or now with `nocobase-runner update`; that only helps once the App serves a runner built from the matching `@nocobase/agent-runner`, so rebuild and remount the runner tarballs whenever the App's agents plugin is upgraded (see [Distribution](distribution.md)). A runner that reports no product (installed before products existed) is offered no update: install it again with the one-line install.

## Coding tools

The runner finds each coding tool on its PATH and reports whether it is signed in. A tool not found, or not signed in, is offered no runs: sign in on the runner's machine as the runner's user (for example `claude` and its login), then wait for the next heartbeat. Which tools a runner is offered work for is chosen on the Runtimes page (`enabledTools`). A model the tool's account cannot use fails the run `modelUnavailable`.
