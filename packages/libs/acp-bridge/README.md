# @nocobase/acp-bridge

The bridge that makes a person's computer a place where their agent sessions run, and the wire protocol between it and a NocoBase application's agent sessions (`@nocobase/app-plugin-agent-sessions`). An application's command line starts it as `<cli> acp start`, or keeps it running from every login with `<cli> acp service install` (`@nocobase/app-cli-client`); nothing else needs to. It runs on macOS, Linux and Windows.

Signed in as the person the first time, the bridge registers the computer with the agents it found and receives the computer's own key, with which it registers and talks to the application from then on (`BRIDGE_HEADERS.computerKey`), so it keeps working however long the person's sign-in lasts. It long-polls the application for commands, runs each session's agent over the [Agent Client Protocol](https://agentclientprotocol.com) and reports what the agent does. It speaks plain HTTPS to the application, so it works from behind any network that lets the person open the application, and needs no port of its own.

```ts
import { runBridge } from '@nocobase/acp-bridge';

await runBridge({
  server: 'https://acme.example.com',
  headers: { authorization: `Bearer ${token}` },
  client: { name: 'acme', version: '1.0.0' },
  stateFile: '/home/zhou/.acme/acp/acme.json',
  roots: ['/home/zhou/code'],
  signal,
  log: console.log,
});
```

`runBridge` returns when `signal` aborts, after stopping every agent it started, and throws `BridgeStopped` when the application refuses it in a way only the person can fix: the sign-in expired before the computer had a key, the computer's key was refused (it was removed, or registered again elsewhere), the application needs a newer protocol or does not offer agent sessions. A key refused at start connects the computer again as the person unless `reconnect` is false, as it is for the background service. Anything else, such as the network going away or the application not answering yet at login, it rides out, trying again with growing pauses. `stateFile`, readable by its owner only, keeps the id the application gave the computer and its key, so the same computer is not registered twice.

## Agents

`AGENTS` lists the agents the bridge offers, the most used first: Codex, Claude Code, Gemini CLI, GitHub Copilot, Cursor, OpenCode, Qwen Code, Kimi CLI, CodeBuddy Code, Qoder CLI, Goose, Auggie, Factory Droid, Kilo Code, Cline, Amp and Mistral Vibe. Each is found as its own program run in its ACP mode (`gemini --acp`, `opencode acp` …) or as its ACP adapter (`codex-acp`, `claude-agent-acp`, else that adapter through `npx` when the agent itself is installed), on the PATH or in the directories the agent installs to. On Windows a program is found with one of PATHEXT's extensions, npm's `.cmd` launchers run through `cmd.exe`, every agent runs without a window, and stopping one ends its process tree (`taskkill /T`).

A session opens with the agent's full access: in the first of the agent's full-access modes it offers (`modes`, such as Codex's `agent-full-access`, Claude Code's `bypassPermissions`, Gemini CLI's `yolo`), or, for an agent offering none (`allowAll`), with the bridge allowing whatever it asks permission for. The bridge looks for agents again every minute and offers one installed while it runs.

At start the bridge starts each agent it found once, to learn its version and that it speaks ACP, and registers again with what it learned. Each session runs its own agent process, in its own process group (on Windows, its own process tree), started by the session's first command and stopped when the session closes, the application archives it or the bridge stops. A process that dies is started again by the next command, which continues the agent's conversation with `session/resume`, or with `session/load` while the history it replays is left out of the transcript. The person's choices (mode, model, reasoning effort and whatever else the agent offers as configuration options, or its session modes) are applied each time the session opens.

Sessions work only in the directories given as `roots`, the home directory by default; a command for any other directory fails its turn. The application narrows them further to the folders the person chose, which it finds by asking the bridge to list a directory's folders (`listFolders`, hidden ones left out, at most `MAX_FOLDERS`) and taking its answer on `BRIDGE_ROUTES.reply`. The agent gets the application's tools as an MCP server over HTTP when the application offers them and the agent supports it, at the address the bridge talks to, with the session's token as its bearer credential.

A permission request waits for the person up to 30 minutes and is then declined. Stopping a turn drops the messages waiting behind it and cancels the permission requests it left open.

## The protocol

`@nocobase/acp-bridge/protocol` has no Node dependency, so the application's server and browser read it too. It holds the routes (`BRIDGE_ROUTES`), the computer key's header (`BRIDGE_HEADERS`), the timings (`POLL_WAIT_MS`, `COMPUTER_OFFLINE_MS`), and every message as an interface with a zod schema of the same name and a `Schema` suffix:

| Message                                | Direction            | Carries                                                                                                                                                                                                                                                                                                                                     |
| -------------------------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `RegisterRequest` / `RegisterResponse` | bridge → application | `BRIDGE_PROTOCOL_VERSION`, the computer's id from an earlier registration, when this run of the bridge started (another run ends what the last one was doing), its name, platform, home directory, roots, and agents with their full-access modes; the answer is the computer's id, and its new key when the person registered it signed in |
| `PollRequest` / `PollResponse`         | bridge → application | The commands waiting for the computer: `prompt`, `cancel`, `permission`, `choose`, `close` and `listFolders`                                                                                                                                                                                                                                |
| `ReportRequest` / `ReportResponse`     | bridge → application | A session's new events and state; the answer says whether the session is still open                                                                                                                                                                                                                                                         |
| `ReplyRequest`                         | bridge → application | The answer to a command that asks for one, such as a `FolderListing`, or why there is none                                                                                                                                                                                                                                                  |

Every command names its session in full (`SessionTarget`: agent, directory, the agent's own session id, the person's choices and the tools), so a bridge that restarted needs nothing else to continue it. Events are the ACP `session/update` payloads as the agent sent them (the person's messages as `PromptPart`s, whose images the application may store apart and name by `file`), with the turns, permission requests and notices around them; `coalesce` joins the pieces of one streamed message, and the updates of one tool call, into one update before they are sent, and `joinUpdates` lets the application grow a stored message the same way. A report carries a batch number and the time the bridge started, so a report sent again after a lost answer is stored once.

`BRIDGE_PROTOCOL_VERSION` changes with every incompatible change; the application answers a bridge speaking another version with `AGENT_SESSIONS_UPGRADE_REQUIRED`, and the bridge stops with a message asking for a newer command line.

Protocol version 2 adds `discoverChoices` with a correlated request ID, installed agent ID, working directory and settings overrides. The bridge opens an isolated ACP session without prompts or MCP servers, declines permission requests, reads and applies actual configuration choices with the same machinery as normal sessions, then stops the process. Replies distinguish available choices (including fixed or empty choices) from an unsupported configuration surface. Discovery is bounded to 150 seconds and aborted on bridge shutdown. Agents may retain empty local sessions. Explicit settings on a normal session are validated and verified before its first prompt; a rejected or incompatible value fails without prompting.
