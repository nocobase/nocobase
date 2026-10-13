# @nocobase/app-plugin-agent-sessions

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
