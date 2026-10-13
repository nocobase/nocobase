# @nocobase/app-plugin-agent-sessions

Conversations in the browser with the coding agents on people's own computers. A person connects a computer with their application's command line (`<cli> acp start`), and from then on starts sessions in the application's pages that run there, with Codex or OpenCode, over the [Agent Client Protocol](https://agentclientprotocol.com). The application keeps every session's transcript and what the session created, so the conversations and their work stay in one place whichever computer they ran on.

A session belongs to the person who started it: only they see it, send it messages and answer its agent, and anyone else's requests about it answer as not found. The agents run on that person's computer as that person, with the access they have in their own terminal, so a session asks before nothing the agent would not ask about there. Sessions work only in the folders the person allows for the computer: all of its home directory by default, or the folders they add in the "My computers" dialog by browsing the computer, never typing a path. The bridge lists a computer's folders on request, and a person who wants a hard limit on the computer itself starts it with `--root`, under which the folders they choose must lie.

## How it fits together

| Part               | Where                                                                              | What it does                                                                                                                                                 |
| ------------------ | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| The bridge         | `@nocobase/acp-bridge`, started by `<cli> acp start` of `@nocobase/app-cli-client` | Signs in as the person, registers the computer and the agents it found, long-polls for commands, runs each session's agent over ACP and reports what happens |
| The service        | `server/service.ts`, the `agentSessionsToken` singleton                            | Keeps computers, sessions, transcripts, the commands waiting for each computer and the records tied to sessions                                              |
| The API            | `/api/agentSessions/...`                                                           | The pages' routes, and the bridge's under `/api/agentSessions/bridge`                                                                                        |
| The tools endpoint | `/mcp/agent-sessions`                                                              | The application's tools for the agents, as an MCP server over HTTP                                                                                           |
| The pages          | `client/`, the route `/agent-sessions`                                             | The session list, a new session, a session's conversation, and the person's computers                                                                        |

A poll waits up to 25 seconds for a command and is woken at once by one queued on the same server instance, and within a second by one queued on another, since commands wait in the database. A command that asks for an answer, such as listing a computer's folders, waits up to 10 seconds for the bridge's reply, which reaches it through the application's cache (`cachingToken`): an application of several instances needs a shared cache, such as Redis, for it. A computer that has not polled for a minute is offline. Reports are idempotent: each carries a batch number and the time the bridge started, so a report sent again after a lost answer is stored once. Streamed text arrives in fewer, larger updates, and the server grows a message's last event in place rather than storing every piece. The owner's pages hear of every change on the realtime topic `agent-sessions` and read it through the API.

## Using it in an application

Register the server plugin, and the client plugin with its route, where the application's navigation wants it:

```ts
// client/plugins.ts
agentSessions({ routes: false }),

// client/routes.ts
{
  ...agentSessionsRoute({ cli: 'acme', install: 'npm install -g @acme/cli' }),
  navigation: { title: 'navigation.agentSessions', icon: MessagesSquare },
},
```

`cli` is the command people connect a computer with, and is required; `install` is how they install it. The page's "My computers" dialog shows both. An application that does not place the page itself registers `agentSessions({ cli, install })` instead, and the plugin adds the route with its own menu entry.

### Tying records to sessions

An application ties its own records to sessions, such as the issues an agent created, and says how each stands and how its work starts. Register a link kind with a resolver from a service provider's `boot`:

```ts
const sessions = container.resolve(agentSessionsToken);
sessions.registerLinkKind('issue', {
  resolve: async (refIds, viewer) =>
    new Map(/* refId → { key, title, group, status, href, startable } */),
  start: async (refIds, viewer) => {
    /* start the work, as the viewer */
  },
  search: async (query, viewer, { projectId, limit }) => [
    /* { refId, key, title, ... } whose key or title contains query, projectId's first */
  ],
  progress: async (refIds, viewer) =>
    new Map(/* refId → how it is going, as JSON for the agent */),
});
sessions.registerProjects({
  list: async (viewer) => [
    /* { id, name } of the projects the viewer may see */
  ],
});
```

`key` is the record's short identifier, such as an issue's `ST-58`, which the pages show quietly before its `title`. `resolve` answers only what the viewer may see, in their language (`viewer.locale`); a session shows a record its resolver leaves out as nothing. After a turn that tied records to the session, the conversation shows them in a card where the owner starts the work on those they keep ticked, or chooses not to yet; either way the session stops asking (`POST /api/agentSessions/sessions/{sessionId}/links/decide`). The session list shows each session's records, their groups and how they stand.

With `search`, a person mentions records in a message by typing `#`: the composer offers those matching what follows, the session's project's first, and inserts `#ST-58`. A mentioned record is tied to the session as already decided, so the session shows it without asking to start it, and the agent is told what each mention is beneath the message; the transcript keeps the message as written, its mentions linking to the record.

### What the agent knows of the session's work

The records tied to a session, created in it or mentioned in its messages, are what the person means by "the tasks", and the agent is told so. A message carries the list beneath it whenever it changed since the agent was last told, each record with its standing in the person's language and what is new or changed marked, so that an agent coming back to a session a day later learns what happened meanwhile; a message after which nothing changed carries nothing. Every session's agent also has the tool `list_session_work`, which lists that work with how each is going as the kind's `progress` tells it, and the MCP `initialize` answer lists the work when the agent's session opens. `agentSessions.toldWork` keeps what the agent was last told, and `locale` the language its owner last wrote in.

With `registerProjects`, a new session may work for one of the application's projects (`GET /api/agentSessions/projects`). The session shows its project, the list groups and filters by it, and its tools learn it (`SessionToolContext.projectId`); the MCP `initialize` answer tells the agent to file work there unless the person names another project.

### How the agents work

`registerInstructions(text)` tells the agents in sessions how the application wants them to work, in English, such as what they do themselves and what they record for others to run. The agent reads it beneath a session's first message, and beneath the next message again whenever the text changed (`agentSessions.toldInstructions` keeps a hash of what it was told), and in the MCP `initialize` answer when its session opens. The transcript keeps the messages as written.

### Giving the agents tools

The agents reach the application's tools as an MCP server over HTTP. Register them once, under the server name the agents see:

```ts
sessions.registerTools('acme', [
  defineSessionTool({
    name: 'create_issues',
    description: 'Creates issues in a project.',
    input: z.object({
      projectId: z.string(),
      titles: z.array(z.string()).min(1),
    }),
    run: async ({ projectId, titles }, { userId, link }) => {
      const created = await issues.create(userId, projectId, titles);
      for (const issue of created) await link('issue', issue.id);
      return created;
    },
  }),
]);
```

A tool runs as the session's owner, with the session's project when it has one, and answers JSON; what it throws reaches the agent as a tool error it can correct. The bridge hands the agent the endpoint and a token for its session when the session opens, provided the agent supports MCP over HTTP (Codex and OpenCode do). A token is `<sessionId>.<HMAC>`, signed with a key the application's secrets derive for `agent-sessions/tools`, and reaches only its session while the session is not archived; without the secrets service sessions get no tools.

## The agents

| Agent    | Started as                                                                         | Mode a session opens in                                                    |
| -------- | ---------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Codex    | `codex-acp`, else `npx @agentclientprotocol/codex-acp` beside an installed `codex` | `agent-full-access`                                                        |
| OpenCode | `opencode acp`                                                                     | Its default `build`, with every permission allowed (`OPENCODE_PERMISSION`) |

Each opens with full access so that a person's first message is simply carried out, as it would be in their terminal. A new session offers the choices and the slash commands the agent offered in its latest session on that computer (the computer's `choices` and `commands`, such as Codex's model, reasoning effort and fast mode), starting from the same model and in the bridge's mode, and the person can change them before the first message and at any time in the conversation; the session keeps them when it reopens. An agent that asks permission anyway waits for the owner up to 30 minutes and is then declined. A session continues the agent's own conversation (`session/resume`, else `session/load`) whenever its agent process starts again. A person signs the agent in on their computer (`codex login`, `opencode auth login`); a session whose agent is not signed in says so.

## Transcripts

A session's transcript is the ACP `session/update` payloads as the agent sent them, with the person's messages, the turns, permission requests and their answers, notices and the records tied to the session. Strings longer than 32,768 characters are cut. Secrets are redacted before anything is stored, with the redactor of `@nocobase/agent-protocol` (tokens of the common services, `sk-…` keys, private keys, `Bearer` credentials, passwords in URLs and the like); a person's images are stored as sent.

Messages sent while the agent works wait their turn; stopping the turn (`POST .../cancel`) drops them too. Archiving a session stops its agent and refuses new messages until it is restored.

## Data

| Collection              | Holds                                                                                                                                                                                                      |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `agentSessionComputers` | A person's computers: name, platform, home directory, the agents found and the choices and commands each last offered, what the bridge allows and the folders the owner chose, when the bridge last polled |
| `agentSessions`         | A session: its computer, agent, directory and project, the agent's session id and state, the owner's choices, whether a turn runs or a permission request waits                                            |
| `agentSessionEvents`    | The transcript, numbered per session (`seq`)                                                                                                                                                               |
| `agentSessionCommands`  | Commands waiting for a computer's next poll                                                                                                                                                                |
| `agentSessionLinks`     | Records tied to sessions, and whether the owner decided about them                                                                                                                                         |

Removing a computer leaves its sessions readable; they take no more messages.

## Verification

```bash
pnpm --filter @nocobase/app-plugin-agent-sessions lint
pnpm --filter @nocobase/app-plugin-agent-sessions typecheck
pnpm --filter @nocobase/app-plugin-agent-sessions test
pnpm --filter @nocobase/app-plugin-agent-sessions build
```
