# @nocobase/app-plugin-agent-sessions

## 1.0.0-beta.3

### Minor Changes

- b322dcf: Allow owners to withdraw individual queued agent messages through server execution claims and computer removal acknowledgements. Bridge protocol 4 requires upgrading and restarting the computer connection; messages already delivered to older bridges cannot be safely withdrawn. Each new message carries its complete instructions and work context. Offline withdrawals remain pending until confirmed, and editing a withdrawn message preserves images and the current draft.

  Unsequenced pre-upgrade commands still on the server cannot be authorized by the new bridge and display a warning asking the owner to send a new message. They are never silently executed without a claim.

  Avoid returning unused command payloads during enqueueing so large prompts also work on Oracle.

  Confirm each turn’s reports before claiming its successor so errors, usage and completion details keep their transcript boundary. Settle cancelled pending claims even when an approval response is delayed or lost, preventing archived sessions from remaining active or replaying closed messages.

### Patch Changes

- baa743e: Run pinned ACP adapters from bridge-managed installations with Node.js and repair deleted adapter or dependency files using an installation inventory. Inspect and report each agent independently so a slow installation cannot block other agents, merge registration updates, and display bounded startup commands and error output in computer and new-session views even while another agent is usable.
- Updated dependencies [b322dcf]
- Updated dependencies [baa743e]
  - @nocobase/acp-bridge@1.0.0-beta.3

## 1.0.0-beta.2

### Major Changes

- 55fcee1: Replace the built-in agent session MCP endpoint and tool registration API with the Studio CLI and shared Skill. Bridge protocol 3 requires a matching CLI upgrade. Session agents use the bridge-selected login profile, validate session ownership before creating linked tasks, default to the session project and Backlog, and read linked work and issue progress through CLI routes. Prepare the shared Skill before starting or restoring sessions and explain unsupported agents or installation failures. Teach both bundled Skill copies to discuss and search before recording work and combine related requirements into as few tasks as practical.

### Minor Changes

- c272997: A new session's first message takes over the agent its choices were discovered with, instead of starting another. The new-session page chooses the session's id with the draft and names it in `discoverChoices` (`sessionId`); the bridge runs that discovery's agent with the session's environment and keeps it, with its open ACP session, for up to five minutes and at most one per computer, and the session created with that id applies its own choices to it and prompts it. While a session's agent opens, the bridge reports what it is doing (`startup`: starting the agent, opening its session, applying settings), stored as `agentSessions.startup` and shown on the session page. Both protocol fields are optional, so older bridges and applications keep working as before.
- 8f58ed1: The sessions can be shown in a panel the application draws beside its other pages: `@nocobase/app-plugin-agent-sessions/client/panel` exports `AgentSessionsPanel`, showing one session, a new session or the list with buttons between them and to the full page, and `useLinkedSessions`. The session page, the new session and the list are laid out by their container's width instead of the screen's, so the page itself looks as before. What the application attaches, such as the record the panel was opened beside, shows above the message until removed and goes with it, as a `#` mention or as text. `GET /api/agentSessions/sessions` takes `linked=<kind>:<refId>` to list the viewer's sessions tied to one record.
- 5d04db9: A new session's first message no longer waits for the agent's choices to be discovered. Sent before they arrive, or after discovery failed, it carries only the settings the person chose, which the session checks before its first prompt, and the agent keeps its own defaults for the rest; sent once they have arrived, it carries every choice as shown, as before.
- c4659bd: Share token-based CLI setup instructions and dialogs between the account menu and My Agent, install the CLI skill, and explain local agents, connected computers and Runners. Replace the agent sessions install option with an application-provided connectPrompt component while preserving the default checklist and the offline service command.

### Patch Changes

- 89d5165: On a phone the session header hides where the session runs, which the details list, and keeps the offline notice to one line; beside open details it drops the duplicated task summary, and the details list the session's tasks as compact rows. The waiting filter reads 等你确认.
- de0861a: Draw linked records with the status icon and the waiting label their application gives (`SessionLink.status.icon` and `needsYou`), order the session's bar by status, and let an application open a session's records in a panel beside the conversation (`linkPanels`), or in a sheet on a phone.
- 02ba348: Keep session list actions and selectors on one line in English and Chinese, move archive navigation to the list heading, and prevent long names from crowding session details and computer controls on narrow screens.
- 49f61b9: Describe the session identifier in generated CLI help and API documentation.
- 3cb2bf8: Expose an optional, removable observer for committed session reminder events, without changing delayed notices or bridge lifecycle behavior.
- 00c5970: Keep the new-session editor available while the recent-session list loads, and preserve deliberate draft and configuration changes when the list arrives.
- 00c5970: Return agent settings before process cleanup, preserve editable drafts and model selections during discovery, display confirmed messages immediately, and bound realtime refresh rates with recovery reads and optional timing diagnostics.
- 00c5970: Keep agent settings discovery, selected models and unsent drafts across menu navigation in an authenticated application cache. Share pending discovery requests and retain live invalidation between visits while discarding cached state when the signed-in user changes.
- 01c3b00: Keep a compact task count available in the collapsed mobile conversation header.
- 00c5970: Keep transcript read progress separate from prompt confirmations so queued messages cannot hide a preceding reply's final streamed content.
- 00c5970: Allow explicit retries of unconfirmed agent messages without duplicating sessions, messages, commands or images. Commit a new session and its first message together, retain immutable browser submission input, and support file uploads within the caller's transaction.
- 109ab4e: Expose an on-demand check for available computers and agents, allow a host-specific new-session placeholder, and clear message text when starting a new automatic attachment scope.
- 20d4b5f: Keep retained composer drafts synchronous so continuous IME input is not interrupted, while preserving drafts across navigation.
- c0cab26: Support replaceable automatic context in new session drafts, preserve manual attachments and stop following after removal or submission. Keep sidebar session details inside the panel and highlight the record open in the host page.
- Updated dependencies [f584e87]
- Updated dependencies [846e75f]
- Updated dependencies [c272997]
- Updated dependencies [98b3862]
- Updated dependencies [1cdbaf4]
- Updated dependencies [5fe8773]
- Updated dependencies [b22d999]
- Updated dependencies [00c5970]
- Updated dependencies [616561b]
- Updated dependencies [83e3609]
- Updated dependencies [00c5970]
- Updated dependencies [0037dd2]
- Updated dependencies [55fcee1]
- Updated dependencies [c0b7537]
- Updated dependencies [eb4b081]
- Updated dependencies [14b7aec]
- Updated dependencies [49f61b9]
- Updated dependencies [0037dd2]
  - @nocobase/acp-bridge@1.0.0-beta.2
  - @nocobase/db@1.0.0-beta.21
  - @nocobase/app-client@3.0.0-beta.2
  - @nocobase/app-server@2.0.0-beta.8
  - @nocobase/agent-protocol@0.1.0-beta.9
  - @nocobase/app-plugin-file@1.0.0-beta.24
  - @nocobase/app-plugin-authentication@2.0.0-beta.10
  - @nocobase/i18n@1.0.0-beta.7
  - @nocobase/service-provider@0.0.2-beta.2

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
