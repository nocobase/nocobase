---
'@nocobase/agent-protocol': minor
'@nocobase/agent-runner': minor
'@nocobase/app-plugin-agents': minor
---

Pass proxies and CA certificates to coding tools, let the runner's owner pass and set variables, and let an agent take a variable from the runner.

- The runner passes the proxy variables (`HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY`, `NO_PROXY`, upper and lower case) and the CA variables (`SSL_CERT_FILE`, `NODE_EXTRA_CA_CERTS`) from its own environment to every coding tool by default. The values of the proxy variables are redacted from what a run reports, since a proxy URL may carry a password.
- `nocobase-runner start --pass-env NAME` and `service install --pass-env NAME` (repeatable) pass a variable from the runner's environment to every run. The names are remembered in the settings for later starts; `nocobase-runner env unset NAME` forgets one.
- `service install` writes the installing shell's proxy, CA and `--pass-env` variables, with their current values, into the launchd plist or systemd unit beside `PATH`, and prints the names it wrote. The unit or plist is now written with mode 0600, `%` is escaped for systemd, and `--dry-run` and `--json` show `<hidden>` instead of the values.
- `nocobase-runner env set NAME [VALUE]`, `env unset NAME` and `env list` keep the runner's local variables (`apps/<key>.json`, 0600). `set` reads the value from standard input when it is left out, and `list` shows names only.
- Coding tool detection now runs in the environment a run gets from the runner, rather than the runner's whole environment, so a tool shows as signed in only when its runs will be too.
- A run's `workspace.passthrough` names are now provided only by the runner's local variables and its `--pass-env` names, no longer by any variable of the runner's environment. A run that asks for a name the runner does not provide fails before anything is prepared, with `setupFailed` and a message naming `nocobase-runner env set NAME` and `--pass-env NAME`.
- Protocol: `RegisterRequest` and `HeartbeatRequest` gain an optional `variables`, the names of the variables the runner provides (names only, at most `MAX_RUNNER_VARIABLES`, validated by `RunnerVariableNamesSchema`). A server that does not know the field ignores it, and a runner that does not send it is shown as not reporting.
- Agents plugin: a variable can be taken from the runner. `PUT /api/agents/variables/{scopeKind}/{scopeId}/{name}` takes `fromRunner: true` without a value (`variable set ... --from-runner`), which keeps the name only (new collection `agRunnerVariables`, migration `202610090002_ag_add_runner_variables`), and `Variable.fromRunner` marks such variables in lists. Such names merge with the other variables by scope like any variable, and a claim puts those whose last entry is taken from the runner into `workspace.passthrough` instead of `workspace.env`. The variable dialog has a "Take from the runtime" option, and the list a badge.
- Agents plugin: a runner's reported names are kept on the runner (`agRunners.variables`, `Runner.variables`, null when it reported none), and the runtime's sheet lists them under "Variables from this machine". Runners are not chosen by them.
