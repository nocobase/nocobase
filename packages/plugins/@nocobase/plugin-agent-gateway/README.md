# @nocobase/plugin-agent-gateway

Agent Gateway connects Codex, Claude Code, OpenCode, and compatible command-line agents running on remote machines to NocoBase.

## Architecture

- The NocoBase plugin is the control and observation plane. It owns nodes, profiles, task templates, runs, events, artifacts, snapshots, permissions, and retention.
- `agent-gateway-daemon` is the execution plane. It runs on the agent machine, claims leased work, executes only configured provider commands, and reports bounded observations.
- NocoBase collections and workflows remain the business plane. Business records link to `agRuns` instead of embedding execution credentials or raw process configuration.

## Install a daemon

Create a one-time node invitation from **Settings > Agent Gateway > Nodes**, then run the generated bootstrap command on the target machine. The daemon stores its node token in `~/.agent-gateway-daemon/config.json` with mode `0600`.

Each daemon keeps node-local execution policies in that config file. A policy owns its `executionPolicyKey`, provider, executable, fixed base arguments, validated optional values, workspace root, referenced local environment keys, and timeout ceiling. The generated Codex, Claude Code, and OpenCode policies can be edited by the node administrator before the service starts.

NocoBase runs may send only the policy key, prompt or continuation message, a relative working directory inside the policy workspace, a bounded timeout, and Skill version IDs. Remote `args`, `extraArgs`, `env`, executable overrides, absolute working directories, and legacy `commandKey` fallbacks are rejected. `generic-cli` is available only when the node administrator adds an explicit local policy for it.

## Dispatch and observation

Runs may be created from the Runs page, task templates, dispatch bindings, or the `agentGatewayApi` resource actions. A daemon claims a run using a short lease. The claim exposes the selected execution policy key and a bounded capability summary, never the executable, local workspace path, secret values, or raw environment. Every state-changing report carries the claim token, `claimAttempt`, and `leaseVersion`, preventing stale daemons from writing to a reassigned run.

Observation data is stored separately as conversation events, run events, artifacts, snapshots, terminal output, and bounded API-call summaries. Sensitive tokens, command configuration, working directories, environment values, and artifact URLs are redacted before user-facing persistence.

External executions can be imported with:

```bash
agent-gateway-daemon import-external-run \
  --server-url https://nocobase.example.com \
  --api-token "$NOCOBASE_API_TOKEN" \
  --external-run-key example-run \
  --provider codex \
  --log-file ./codex.jsonl
```

## Security model

- Node actions require a node token; registration additionally requires a one-time invitation.
- Human actions use NocoBase ACL snippets and run-level data scopes.
- Browser terminal streaming uses short-lived, run-scoped tickets and never places bearer credentials in query strings.
- Raw terminal input is disabled by default.

## Development checks

```bash
yarn build @nocobase/plugin-agent-gateway
yarn test packages/plugins/@nocobase/plugin-agent-gateway/src/daemon/__tests__/runner.test.ts --run
TEST_DB_DIALECT=postgres ./run_server_test.sh packages/plugins/@nocobase/plugin-agent-gateway/src/server/__tests__/runLifecycle.test.ts --run
```
