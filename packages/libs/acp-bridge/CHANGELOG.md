# @nocobase/acp-bridge

## 0.1.0-beta.1

### Minor Changes

- e23633e: Discover installed agents' real model and configuration choices before a new session's first message. Show loading, fixed, unsupported, offline and retry states, isolate settings by computer, agent and directory, and validate selected values before sending a prompt. Persist acknowledged dependent settings when existing sessions change models so reopening keeps their configuration. Bridge protocol version 2 requires upgrading the application CLI.

### Patch Changes

- 8e4cf26: Recover runners and agent-session bridges after a protocol upgrade. Heartbeat answers now carry the server's runner protocol (`protocolVersion`), and a runner that speaks an older protocol while no newer version is offered logs what it speaks, what the application needs and how to update, instead of looking up to date. A bridge refused for its protocol now receives the protocols the application speaks in the error's `metadata`; `acp start` then updates the CLI as `update` does and exits non-zero so its launchd, systemd or Startup service starts it again on the new version, and when no update helps it still exits non-zero after a pause rather than stopping with success. A computer whose bridge was refused as too old is shown on My agents with the commands to update it.
- 923a8e5: Refresh installed tool versions, paths and runner login status in long-running processes using bounded, cancellable background inspections. Rediscover previously unavailable tools and keep model capabilities consistent with the latest inspection. Reprobe ACP agents every minute and allow a session to retry after an authentication-required prompt error without replaying the failed message.

  Terminate ACP launcher descendants after the stop grace period even when the launcher exits first.

## 0.1.0-beta.0

### Minor Changes

- 157a914: Add `@nocobase/acp-bridge`, which makes a person's computer a place where their agent sessions run, on macOS, Linux or Windows: `runBridge` registers the computer with the agents installed there (Codex, Claude Code, Gemini CLI, GitHub Copilot, Cursor, OpenCode, Qwen Code, Kimi CLI and more, each in its ACP mode or through its ACP adapter), signed in as that person the first time and with the computer's own key from then on, so it stays connected however long the sign-in lasts; it offers an agent installed while it runs within a minute, long-polls the application for commands, runs each session's agent over the Agent Client Protocol with full access in the directories the person allowed, lists the computer's folders for a person choosing one, and reports what it does. `@nocobase/acp-bridge/protocol` is the wire protocol between the bridge and `@nocobase/app-plugin-agent-sessions`, with no Node dependency, so the application's server and browser read it too.

## 0.0.1

Initial version.
