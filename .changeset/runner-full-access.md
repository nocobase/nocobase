---
'@nocobase/agent-runner': minor
'@nocobase/agent-protocol': patch
'@nocobase/app-plugin-agents': patch
---

The runner now runs agents with full access and the real home of the user it runs as, and is no longer a sandbox. Codex runs with approval policy `never` and the `danger-full-access` sandbox, accepting any approval it still asks for; Claude Code runs in `bypassPermissions` mode with no hooks; OpenCode and Pi have every permission request allowed. The command policy (allowed commands, denied patterns, download rules, path checks) and the isolated per-workspace home are gone; each run still gets its own TMPDIR, and Codex a per-workspace `CODEX_HOME` linking `auth.json` and `config.toml` from `~/.codex`. The push guard (the `pre-push` hook that let a checkout push only its run's branch) is removed, and an earlier runner's is deleted on upgrade; the run's short-lived repository credential is still provided, so protect default branches on the code host.

Operators: an agent can now read and change anything the runner's user can, including SSH keys, cloud credentials and `~/.nocobase-runner`. Run the runner as a dedicated OS user that holds only what agents need, in a container or in a VM, and not as root (Claude Code refuses `bypassPermissions` as root). `start --agent-home` is gone. Agents' tool policies keep their idle timeout and turn limit; their permission mode and command patterns are accepted and no longer enforced, and the agent page no longer shows the command rules.
