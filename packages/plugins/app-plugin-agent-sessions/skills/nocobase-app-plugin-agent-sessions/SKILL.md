---
name: nocobase-app-plugin-agent-sessions
description: Register the Agent Sessions plugin in a NocoBase App so people talk in the browser with the coding agents on their own computers (Codex, Claude Code, Gemini CLI, GitHub Copilot, Cursor, OpenCode and more, on macOS, Linux or Windows; `<cli> acp service install` or `acp start`), route its page, tie the App's records to sessions with a link kind (registerLinkKind) that people can also mention with `#`, let sessions work for the App's projects (registerProjects), tell the agents how to work (registerInstructions), notify the owner (registerNotices), work out why a computer is offline, an agent is unavailable or a session's agent cannot reach the tools.
metadata:
  short-description: Browser sessions with the agents on people's own computers
---

# Agent Sessions App Plugin

Use this Skill when an App lets people hold conversations in its pages with the coding agents on their own computers, keeping the transcripts and the work those conversations create in the App. Do not use it for agents that run the team's work on runners; that is `nocobase-app-plugin-agents`.

The package README is the full reference: read it at `node_modules/@nocobase/app-plugin-agent-sessions/README.md` (in this repository, `packages/plugins/app-plugin-agent-sessions/README.md`).

## Key rules

- A session is its owner's alone. Every route answers only the signed-in person about their own computers and sessions; there is no permission to grant and no administrator view.
- The App needs the authentication plugin and its CLI built with `@nocobase/app-cli-client`, which has `acp start`. Pass the CLI's name and install command to `agentSessionsRoute({ cli, install })` so the page can tell people how to connect a computer.
- The plugin knows no business of its own. The App ties its records to sessions through `agentSessionsToken`: `registerLinkKind(kind, { resolve, start, search, progress })` says how a record stands for a viewer, starts its work, finds the records a person mentions with `#`, and tells the agent how each is going (the `session work` CLI command); `registerProjects({ list })` names the projects a session may work for; `registerNotices({ send, settle })` tells the App what the owner should hear of while not looking at a session (the agent waits for permission, a turn ended or failed), for its inbox; `registerInstructions(text)` tells every session's agent how the App wants it to work, such as recording development as issues instead of doing it, in its first message and again when the text changes. Do all of it from a service provider's `boot`.
- A link's `status` gives `icon` (`backlog`, `started`, `blocked`, `review`, `done`, `closed`) and `needsYou` (what it waits on the viewer for) beside `label` and `tone`, so the page draws the App's own status shapes and counts what waits. `agentSessionsRoute({ cli, linkPanels: { <kind>: Component } })` opens a kind's records beside the conversation (`LinkPanelProps`, `?<kind>=<refId>` in the address) instead of at their `href`.
- The images people send are stored through the file plugin (`agentSessionImages`) and served to their owner by the plugin; register the file plugin, or images stay in the transcript as sent.
- A request that needs the bridge's answer, such as listing a computer's folders, gets it through the App's cache. An App of several instances needs a shared cache, such as Redis, or those requests time out.
- `resolve` answers only what the viewer may see, in `viewer.locale`. `start` acts as the viewer; refuse what they may not do there rather than here.
- Sessions open with the agent's full access (its full-access mode, such as Codex `agent-full-access` or Claude Code `bypassPermissions`, or else every permission allowed by the bridge), in the folders the person allows for the computer: the whole home directory by default, or those they add by browsing it in "My computers". `--root` on `acp start` is only a hard limit on the computer. Do not add a read-only default.

## Setup

1. Register the server plugin, and the client plugin with `{ routes: false }` when the App places the page itself: spread `agentSessionsRoute({ cli, install })` into the App's routes with its navigation entry.
2. In a service provider of the App, resolve `agentSessionsToken` from `@nocobase/app-plugin-agent-sessions/server` and register the App's link kinds and tools.
3. Each person installs a coding agent and signs in to it, installs the App's CLI, signs in (`<cli> login --server <url>`) and runs `<cli> acp service install` on their computer, which keeps it connected from every login (`<cli> acp start` connects it until the terminal stops). The first registration gives the computer its own key, so it stays connected however long the sign-in lasts.

## Verification

Hosts embedding `AgentSessionsPanel` can use `attach.mode: 'replace'` with a stable `scope` and a fresh update `id` to follow page context in a new draft. A new explicit entry starts another scope. Automatic context replaces only its own attachments and stops following after removal or submission; manual mentions, images and attachments survive page changes. Use `activeLink` to mark the host page's current record in the sidebar's internal task list; sidebar task links keep that list open without a page overlay.

- The page's "My computers" dialog lists the computer as online with its agents' versions; an agent marked not installed or failed shows why on hover.
- A new session answers its first message; its details show the agent and its mode.
- Asking the agent to use the App calls its CLI as the signed-in owner. Verify creation checks the session owner and links records through the existing service.

## Troubleshooting

Queued messages support individual withdrawal with bridge protocol 4. The server arbitrates withdrawal against execution before agent initialization, and the UI waits for computer removal confirmation before showing Withdrawn. Offline withdrawal remains pending. Upgrade and restart older computer connections; messages already delivered to an older bridge explicitly have no safe withdrawal capability. Editing a withdrawn message opens a separate draft and retains its images, without replacing the current draft. Do not replace this protocol with session cancellation or client-only hiding.

| Symptom                                     | Cause                                                                                                                                                                                |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| The computer is offline                     | Its bridge has not polled for a minute: it stopped, or cannot reach the App. `<cli> acp service status` says whether the service runs and where its output is.                       |
| The bridge stops with "no longer connected" | The computer was removed in the App, or registered again elsewhere: run `<cli> acp start` (or install the service again) to connect it anew.                                         |
| The bridge stops with "sign-in has expired" | It had no key yet and the person's credential no longer works; `<cli> login` again.                                                                                                  |
| The agent is "not installed"                | Its program is not on the PATH the bridge started with; a service has the PATH of the shell that installed it, so install the service again after installing an agent somewhere new. |
| A session says the agent is not signed in   | Run the agent's own sign-in on that computer, as the message says (`codex login`, `claude`, `opencode auth login` …).                                                                |
| A directory is refused                      | It is outside the folders allowed for the computer: add it in "My computers", or, when it is outside what `acp start --root` allows, start the bridge again with that `--root`.      |
| Browsing a computer's folders times out     | Its bridge is not running, or the App runs several instances without a shared cache.                                                                                                 |

Session startup and restore require the CLI’s bundled shared Skill. Unsupported agents or Skill installation failures stop the opening with a message; no repository files or session credentials are created.
