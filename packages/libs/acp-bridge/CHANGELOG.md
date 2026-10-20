# @nocobase/acp-bridge

## 1.0.0-beta.3

### Minor Changes

- b322dcf: Allow owners to withdraw individual queued agent messages through server execution claims and computer removal acknowledgements. Bridge protocol 4 requires upgrading and restarting the computer connection; messages already delivered to older bridges cannot be safely withdrawn. Each new message carries its complete instructions and work context. Offline withdrawals remain pending until confirmed, and editing a withdrawn message preserves images and the current draft.

  Unsequenced pre-upgrade commands still on the server cannot be authorized by the new bridge and display a warning asking the owner to send a new message. They are never silently executed without a claim.

  Avoid returning unused command payloads during enqueueing so large prompts also work on Oracle.

  Confirm each turn’s reports before claiming its successor so errors, usage and completion details keep their transcript boundary. Settle cancelled pending claims even when an approval response is delayed or lost, preventing archived sessions from remaining active or replaying closed messages.

### Patch Changes

- baa743e: Run pinned ACP adapters from bridge-managed installations with Node.js and repair deleted adapter or dependency files using an installation inventory. Inspect and report each agent independently so a slow installation cannot block other agents, merge registration updates, and display bounded startup commands and error output in computer and new-session views even while another agent is usable.

## 1.0.0-beta.2

### Major Changes

- 55fcee1: Replace the built-in agent session MCP endpoint and tool registration API with the Studio CLI and shared Skill. Bridge protocol 3 requires a matching CLI upgrade. Session agents use the bridge-selected login profile, validate session ownership before creating linked tasks, default to the session project and Backlog, and read linked work and issue progress through CLI routes. Prepare the shared Skill before starting or restoring sessions and explain unsupported agents or installation failures. Teach both bundled Skill copies to discuss and search before recording work and combine related requirements into as few tasks as practical.

### Minor Changes

- f584e87: The bridge manages the ACP adapters for Codex and Claude Code instead of fetching them with npx for every session: the first time one is needed it installs the pinned version (`@agentclientprotocol/codex-acp@2.2.2`, `@agentclientprotocol/claude-agent-acp@0.89.1`) once, with the `npm` on PATH and without optional dependencies, into `adapters/` beside the bridge's state file, and from then on runs it with the Node.js running the bridge against the `codex` or `claude` installed on the computer (`CODEX_PATH`, `CLAUDE_CODE_EXECUTABLE`), so a session no longer waits seconds for npx. Nothing of either adapter ships inside this package. The install starts in the background when the bridge first looks for agents; a session starting meanwhile waits up to 90 seconds for it. A managed adapter needs Codex 0.160.1 or Claude Code 2.1.200 or newer; with an older agent, a Claude Code that is a Windows batch file, no npm or a failed install, the bridge falls back to an adapter installed on PATH, then to npx with the same pinned version. `NOCOBASE_ACP_ADAPTERS=installed` prefers an adapter installed on PATH over the managed one. `BridgeOptions.adapters` names another directory for the managed adapters. `resolveAgent` takes an optional fourth argument, `ResolveOptions`, which installs and runs managed adapters only when it names their directory (`adapters`); a `ResolvedAgent` may carry the environment its launcher adds and whether it is a managed adapter (`managed`), and an `AgentLauncher` describes a managed adapter in `managed`.
- c272997: A new session's first message takes over the agent its choices were discovered with, instead of starting another. The new-session page chooses the session's id with the draft and names it in `discoverChoices` (`sessionId`); the bridge runs that discovery's agent with the session's environment and keeps it, with its open ACP session, for up to five minutes and at most one per computer, and the session created with that id applies its own choices to it and prompts it. While a session's agent opens, the bridge reports what it is doing (`startup`: starting the agent, opening its session, applying settings), stored as `agentSessions.startup` and shown on the session page. Both protocol fields are optional, so older bridges and applications keep working as before.

### Patch Changes

- 846e75f: Allow all compatible ACP agents to open My Agent sessions by supplying the shared CLI Skill as prompt instructions when native installation is unavailable. Preserve Claude Code and Codex installation, session identity and permission behavior.
- 00c5970: Return agent settings before process cleanup, preserve editable drafts and model selections during discovery, display confirmed messages immediately, and bound realtime refresh rates with recovery reads and optional timing diagnostics.

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
