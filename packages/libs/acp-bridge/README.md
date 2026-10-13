# @nocobase/acp-bridge

The bridge that makes a person's computer a place where their agent sessions run, and the wire protocol between it and a NocoBase application's agent sessions (`@nocobase/app-plugin-agent-sessions`). An application's command line starts it as `<cli> acp start` (`@nocobase/app-cli-client`); nothing else needs to.

Signed in as the person, the bridge registers the computer with the agents it found, long-polls the application for commands, runs each session's agent over the [Agent Client Protocol](https://agentclientprotocol.com) and reports what the agent does. It speaks plain HTTPS to the application, so it works from behind any network that lets the person open the application, and needs no port of its own.

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

`runBridge` returns when `signal` aborts, after stopping every agent it started, and throws `BridgeStopped` when the application refuses it in a way only the person can fix: the sign-in expired, the computer was removed, the application needs a newer protocol or does not offer agent sessions. Anything else, such as the network going away, it rides out, trying again with growing pauses. `stateFile` keeps the id the application gave the computer, so the same computer is not registered twice.

## Agents

| Agent    | Found as                                                                                                 | Opens in                                                |
| -------- | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| Codex    | `codex-acp` on the PATH, else `npx --yes @agentclientprotocol/codex-acp@2.2.2` when `codex` is installed | `agent-full-access`                                     |
| OpenCode | `opencode`, on the PATH or in `~/.opencode/bin`, as `opencode acp`                                       | `build`, with `OPENCODE_PERMISSION` allowing everything |

At start the bridge starts each agent it found once, to learn its version and that it speaks ACP, and registers again with what it learned. Each session runs its own agent process, in its own process group, started by the session's first command and stopped when the session closes, the application archives it or the bridge stops. A process that dies is started again by the next command, which continues the agent's conversation with `session/resume`, or with `session/load` while the history it replays is left out of the transcript. The person's choices (mode, model, reasoning effort and whatever else the agent offers as configuration options, or its session modes) are applied each time the session opens.

Sessions work only in the directories given as `roots`, the home directory by default; a command for any other directory fails its turn. The application narrows them further to the folders the person chose, which it finds by asking the bridge to list a directory's folders (`listFolders`, hidden ones left out, at most `MAX_FOLDERS`) and taking its answer on `BRIDGE_ROUTES.reply`. The agent gets the application's tools as an MCP server over HTTP when the application offers them and the agent supports it, at the address the bridge talks to, with the session's token as its bearer credential.

A permission request waits for the person up to 30 minutes and is then declined. Stopping a turn drops the messages waiting behind it and cancels the permission requests it left open.

## The protocol

`@nocobase/acp-bridge/protocol` has no Node dependency, so the application's server and browser read it too. It holds the routes (`BRIDGE_ROUTES`), the timings (`POLL_WAIT_MS`, `COMPUTER_OFFLINE_MS`), and every message as an interface with a zod schema of the same name and a `Schema` suffix:

| Message                            | Direction            | Carries                                                                                                                                                               |
| ---------------------------------- | -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `RegisterRequest`                  | bridge → application | `BRIDGE_PROTOCOL_VERSION`, the computer's id from an earlier registration, its name, platform, home directory, roots, and agents with the mode each opens sessions in |
| `PollRequest` / `PollResponse`     | bridge → application | The commands waiting for the computer: `prompt`, `cancel`, `permission`, `choose`, `close` and `listFolders`                                                          |
| `ReportRequest` / `ReportResponse` | bridge → application | A session's new events and state; the answer says whether the session is still open                                                                                   |
| `ReplyRequest`                     | bridge → application | The answer to a command that asks for one, such as a `FolderListing`, or why there is none                                                                            |

Every command names its session in full (`SessionTarget`: agent, directory, the agent's own session id, the person's choices and the tools), so a bridge that restarted needs nothing else to continue it. Events are the ACP `session/update` payloads as the agent sent them, with the turns, permission requests and notices around them; `coalesce` joins the pieces of one streamed message, and the updates of one tool call, into one update before they are sent, and `joinUpdates` lets the application grow a stored message the same way. A report carries a batch number and the time the bridge started, so a report sent again after a lost answer is stored once.

`BRIDGE_PROTOCOL_VERSION` changes with every incompatible change; the application answers a bridge speaking another version with `AGENT_SESSIONS_UPGRADE_REQUIRED`, and the bridge stops with a message asking for a newer command line.
