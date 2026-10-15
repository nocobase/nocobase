# @nocobase/app-plugin-agent-sessions

## 0.1.0-beta.1

### Minor Changes

- e23633e: Discover installed agents' real model and configuration choices before a new session's first message. Show loading, fixed, unsupported, offline and retry states, isolate settings by computer, agent and directory, and validate selected values before sending a prompt. Persist acknowledged dependent settings when existing sessions change models so reopening keeps their configuration. Bridge protocol version 2 requires upgrading the application CLI.

### Patch Changes

- 8e4cf26: Recover runners and agent-session bridges after a protocol upgrade. Heartbeat answers now carry the server's runner protocol (`protocolVersion`), and a runner that speaks an older protocol while no newer version is offered logs what it speaks, what the application needs and how to update, instead of looking up to date. A bridge refused for its protocol now receives the protocols the application speaks in the error's `metadata`; `acp start` then updates the CLI as `update` does and exits non-zero so its launchd, systemd or Startup service starts it again on the new version, and when no update helps it still exits non-zero after a pause rather than stopping with success. A computer whose bridge was refused as too old is shown on My agents with the commands to update it.
- 8558f9f: Show the full title of truncated session work links on hover or keyboard focus.
- 1ccefb5: Reduce the mobile session header and reply box, keep linked task counts and actual statuses visible, and fit replies to the keyboard viewport. Defer header folding until its height change can be compensated without moving the message being read, including at scroll boundaries. Preserve the compensated reading position when the header resize reaches the automatic bottom-follow observer.
- 9478dc0: Use the current Studio interface language for task titles and descriptions created in My Agent sessions, respecting explicit user language requests and refreshing instructions after a language switch or session restoration.
- Updated dependencies [8e4cf26]
- Updated dependencies [69e212c]
- Updated dependencies [943a9a8]
- Updated dependencies [943a9a8]
- Updated dependencies [e23633e]
- Updated dependencies [923a8e5]
- Updated dependencies [1cd749c]
- Updated dependencies [f36da62]
- Updated dependencies [bdb0581]
- Updated dependencies [9b946f4]
  - @nocobase/agent-protocol@0.1.0-beta.8
  - @nocobase/acp-bridge@0.1.0-beta.1
  - @nocobase/app-server@2.0.0-beta.7
  - @nocobase/db@1.0.0-beta.20
  - @nocobase/app-plugin-authentication@2.0.0-beta.9
  - @nocobase/app-plugin-file@1.0.0-beta.23

## 0.1.0-beta.0

### Minor Changes

- 157a914: Add `@nocobase/app-plugin-agent-sessions`: conversations in the browser with the coding agents on people's own computers (Codex, Claude Code, Gemini CLI, GitHub Copilot, Cursor, OpenCode and more, on macOS, Linux or Windows), connected with `<cli> acp service install` or `acp start`; each computer authenticates with its own key, revoked by removing it. Each session is its owner's alone and keeps its full transcript in the application, redacted of secrets, with the images sent stored through the file plugin. A new session starts from the model, reasoning effort, speed, mode and commands the agent offered on that computer, in a folder chosen by browsing the computer rather than typing a path, and may work for one of the application's projects (`registerProjects`); messages sent while the agent works wait their turn, and the owner answers the agent's permission requests and changes its choices from the page. Applications tie their own records to sessions with `registerLinkKind` on `agentSessionsToken`, so a session shows how they stand, its owner starts their work in one step and mentions them in a message with `#`, and the agent knows them as the session's tasks: each message tells it what changed since the last one, and `list_session_work` tells how each is going; tell the agents how to work with `registerInstructions`; and give the agents their tools as an MCP server over HTTP at `/mcp/agent-sessions` with `registerTools` and `defineSessionTool`. The page `/agent-sessions` lists the sessions with their records, filters for those waiting for the owner and by project, archives them with one key, and works on a phone. Applications hear of what happens in a session while its owner is not looking with `registerNotices` (the agent waits for permission, a turn ended or failed), told only of what the session's page did not show them and settled once they see it.

### Patch Changes

- 933694f: Clarify how My Agent and Studio's project manager share onboarding work.
- a1d02ff: Open conversation image attachments in a viewport-fitted overlay with zoom controls and keyboard closing.
- Updated dependencies [157a914]
- Updated dependencies [10e261b]
- Updated dependencies [9e99702]
- Updated dependencies [ddfe1b1]
- Updated dependencies [ee24e95]
- Updated dependencies [4748117]
- Updated dependencies [a2cf036]
  - @nocobase/acp-bridge@0.1.0-beta.0
  - @nocobase/agent-protocol@0.1.0-beta.7
  - @nocobase/app-server@2.0.0-beta.6
  - @nocobase/app-plugin-authentication@2.0.0-beta.8
  - @nocobase/app-plugin-file@1.0.0-beta.23

## 0.0.1

Initial version.
