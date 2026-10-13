---
name: nocobase-app-plugin-agent-sessions
description: Register the Agent Sessions plugin in a NocoBase App so people talk in the browser with Codex or OpenCode on their own computers (`<cli> acp start`), route its page, tie the App's records to sessions with a link kind (registerLinkKind) that people can also mention with `#`, let sessions work for the App's projects (registerProjects), tell the agents how to work (registerInstructions), give the agents the App's tools over MCP (registerTools, defineSessionTool), or work out why a computer is offline, an agent is unavailable or a session's agent cannot reach the tools.
metadata:
  short-description: Browser sessions with the agents on people's own computers
---

# Agent Sessions App Plugin

Use this Skill when an App lets people hold conversations in its pages with the coding agents on their own computers, keeping the transcripts and the work those conversations create in the App. Do not use it for agents that run the team's work on runners; that is `nocobase-app-plugin-agents`.

The package README is the full reference: read it at `node_modules/@nocobase/app-plugin-agent-sessions/README.md` (in this repository, `packages/plugins/app-plugin-agent-sessions/README.md`).

## Key rules

- A session is its owner's alone. Every route answers only the signed-in person about their own computers and sessions; there is no permission to grant and no administrator view.
- The App needs the authentication plugin and its CLI built with `@nocobase/app-cli-client`, which has `acp start`. Pass the CLI's name and install command to `agentSessionsRoute({ cli, install })` so the page can tell people how to connect a computer.
- The plugin knows no business of its own. The App ties its records to sessions through `agentSessionsToken`: `registerLinkKind(kind, { resolve, start, search, progress })` says how a record stands for a viewer, starts its work, finds the records a person mentions with `#`, and tells the agent how each is going (its `list_session_work` tool); `registerProjects({ list })` names the projects a session may work for; `registerInstructions(text)` tells every session's agent how the App wants it to work, such as recording development as issues instead of doing it, in its first message and again when the text changes; and `registerTools(serverName, tools)` gives the agents the App's tools, each a `defineSessionTool({ name, description, input, run })` that runs as the session's owner, defaults to the session's `projectId`, and calls `link(kind, refId)` for what it creates. Do all of it from a service provider's `boot`.
- A request that needs the bridge's answer, such as listing a computer's folders, gets it through the App's cache. An App of several instances needs a shared cache, such as Redis, or those requests time out.
- Tools need the App's secrets service (`secrets.keys`): the tokens agents call them with are signed with a key derived for `agent-sessions/tools`. Without it sessions work and get no tools.
- `resolve` answers only what the viewer may see, in `viewer.locale`. `start` acts as the viewer; refuse what they may not do there rather than here.
- Sessions open with the agent's full access (Codex `agent-full-access`, OpenCode with every permission allowed), in the folders the person allows for the computer: the whole home directory by default, or those they add by browsing it in "My computers". `--root` on `acp start` is only a hard limit on the computer. Do not add a read-only default.

## Setup

1. Register the server plugin, and the client plugin with `{ routes: false }` when the App places the page itself: spread `agentSessionsRoute({ cli, install })` into the App's routes with its navigation entry.
2. In a service provider of the App, resolve `agentSessionsToken` from `@nocobase/app-plugin-agent-sessions/server` and register the App's link kinds and tools.
3. Each person installs the App's CLI, signs in (`<cli> login --server <url>`) and runs `<cli> acp start` on their computer, with Codex or OpenCode installed and signed in there.

## Verification

- The page's "My computers" dialog lists the computer as online with its agents' versions; an agent marked not installed or failed shows why on hover.
- A new session answers its first message; its details show the agent and its mode.
- Asking the agent to use the App's tools calls them (`mcp.<serverName>.<tool>` in the transcript), and what they link appears in the card after the turn and in the session list.

## Troubleshooting

| Symptom                                      | Cause                                                                                                                                                                           |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| The computer is offline                      | Its bridge has not polled for a minute: `acp start` stopped, or cannot reach the App. It says why in its terminal.                                                              |
| `acp start` stops with "sign-in has expired" | The person's credential no longer works; `<cli> login` again.                                                                                                                   |
| The agent is "not installed"                 | Neither `codex-acp`, `npx` beside `codex`, nor `opencode` is on the PATH the bridge started with.                                                                               |
| A session says the agent is not signed in    | Run `codex login` or `opencode auth login` on that computer.                                                                                                                    |
| The agent has no App tools                   | The App registered none, the secrets service has no key, or the agent does not support MCP over HTTP.                                                                           |
| A directory is refused                       | It is outside the folders allowed for the computer: add it in "My computers", or, when it is outside what `acp start --root` allows, start the bridge again with that `--root`. |
| Browsing a computer's folders times out      | Its bridge is not running, or the App runs several instances without a shared cache.                                                                                            |
