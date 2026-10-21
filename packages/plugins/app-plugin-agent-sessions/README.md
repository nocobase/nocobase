# @nocobase/app-plugin-agent-sessions

Conversations in the browser with the coding agents on people's own computers. A person connects a computer with their application's command line (`<cli> acp start`), and from then on starts sessions in the application's pages that run there, with the coding agent they use (Codex, Claude Code, Gemini CLI, GitHub Copilot, Cursor, OpenCode and others), over the [Agent Client Protocol](https://agentclientprotocol.com). Computers run macOS, Linux or Windows. The application keeps every session's transcript and what the session created, so the conversations and their work stay in one place whichever computer they ran on.

A session belongs to the person who started it: only they see it, send it messages and answer its agent, and anyone else's requests about it answer as not found. The agents run on that person's computer as that person, with the access they have in their own terminal, so a session asks before nothing the agent would not ask about there. Sessions work only in the folders the person allows for the computer: all of its home directory by default, or the folders they add in the "My computers" dialog by browsing the computer, never typing a path. The bridge lists a computer's folders on request, and a person who wants a hard limit on the computer itself starts it with `--root`, under which the folders they choose must lie.

## How it fits together

| Part        | Where                                                                              | What it does                                                                                                                         |
| ----------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| The bridge  | `@nocobase/acp-bridge`, started by `<cli> acp start` of `@nocobase/app-cli-client` | Registers the computer and the agents it found, long-polls for commands, runs each session's agent over ACP and reports what happens |
| The service | `server/service.ts`, the `agentSessionsToken` singleton                            | Keeps computers, sessions, transcripts, the commands waiting for each computer and the records tied to sessions                      |
| The API     | `/api/agentSessions/...`                                                           | The pages' routes, and the bridge's under `/api/agentSessions/bridge`                                                                |
| The pages   | `client/`, the route `/agent-sessions`                                             | The session list, a new session, a session's conversation, and the person's computers                                                |

A poll waits up to 25 seconds for a command and is woken at once by one queued on the same server instance, and within a second by one queued on another, since commands wait in the database. A command that asks for an answer, such as listing a computer's folders, waits up to 10 seconds for the bridge's reply, which reaches it through the application's cache (`cachingToken`): an application of several instances needs a shared cache, such as Redis, for it. A computer that has not polled for a minute is offline. Reports are idempotent: each carries a batch number and the time the bridge started, so a report sent again after a lost answer is stored once. Streamed text arrives in fewer, larger updates, and the server grows a message's last event in place rather than storing every piece. The owner's pages hear of every change on the realtime topic `agent-sessions` and read it through the API.

## Connecting a computer

The person installs the application's command line, signs in (`<cli> login`) and connects the computer:

| Command                       | What it does                                                                                                                                                                                     |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `<cli> acp service install`   | Keeps the computer connected in the background from every login: a launchd agent on macOS, a systemd user unit on Linux, a script in the Startup folder that runs it without a window on Windows |
| `<cli> acp service status`    | Whether the service is installed and the computer connected now, and where its output goes                                                                                                       |
| `<cli> acp service uninstall` | Stops and removes the service; the computer stays in the application, offline                                                                                                                    |
| `<cli> acp start`             | Connects the computer until the terminal stops it (Ctrl+C)                                                                                                                                       |

The first registration is signed in as the person and gives the computer its own key, which the bridge keeps beside the computer's id in a file only its owner reads, and sends from then on (`x-nocobase-computer-key`). The key does not expire, so a computer stays connected however long the person's sign-in lasts; it acts for its owner on the bridge's routes alone, and only for its own computer. Removing the computer in the application revokes it, and so does registering the computer signed in again. A bridge the person starts themselves connects such a computer again as them; the service instead stops, and stays stopped until the person starts it again. A service does not read the person's shell configuration, so installing it writes in the shell's PATH (where it finds the agents), the command line's own variables, proxy and CA variables, and the names given with `--pass-env`, such as an agent's API key kept in the shell. One bridge runs per profile on a computer: a second one, in a terminal or as the service, refuses to start.

The bridge retries what fails for a while, such as a lost connection while the computer slept, and starts looking for agents again every minute. Each agent is inspected independently; downloading one adapter does not hold up another agent. Availability follows installation, initialization, registration and the page refresh, so the one-minute scan interval does not promise readiness within a minute. Both My computers and the new-session form show a failed agent’s startup command and error output, including when another agent on the same computer remains usable.

## Using it in an application

Register the server plugin, and the client plugin with its route, where the application's navigation wants it:

```ts
// client/plugins.ts
agentSessions({ routes: false }),

// client/routes.ts
{
  ...agentSessionsRoute({ cli: 'acme', connectPrompt: ComputerSetup }),
  navigation: { title: 'navigation.agentSessions', icon: MessagesSquare },
},
```

`cli` is the command people connect a computer with, and is required. The optional `connectPrompt` component supplies the application’s setup trigger and dialog in both the empty state and "My computers". Without it, the plugin shows its default command checklist. An application that does not place the page itself registers `agentSessions({ cli, connectPrompt })` instead, and the plugin adds the route with its own menu entry. The previous `install` option is replaced by `connectPrompt`; applications own installation instructions and credentials. An offline computer still shows only the background service command.

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

A record's `status` carries its `label` and a `tone` (`idle`, `active`, `attention`, `done`), which older data has alone. Give it an `icon` too (`backlog`, `started`, `blocked`, `review`, `done`, `closed`) and, when it waits for the viewer, `needsYou` ("Needs your acceptance"): the page then draws the status as that shape, orders the session's bar by it and counts what waits for the viewer.

To open a kind's records beside the conversation instead of at their `href`, give `agentSessionsRoute` a panel for that kind, a component taking `LinkPanelProps` (the record, its place among the session's records of that kind, previous, next and close, and `variant`: `side` beside the conversation or `sheet` on a phone):

```ts
agentSessionsRoute({ cli: 'acme', linkPanels: { issue: IssuePanel } }),
```

The open record is in the address as `?<kind>=<refId>`; J and K move among the session's records of that kind and Esc closes it. Below 1600 pixels wide the session list folds to a rail while a record is open.

### In a panel beside other pages

`@nocobase/app-plugin-agent-sessions/client/panel` puts the sessions in a panel the application draws itself, beside whatever page is open. `AgentSessionsPanel` takes the options `agentSessionsRoute` takes, `view` (`{ kind: 'session', sessionId }`, `{ kind: 'new' }` or `{ kind: 'list' }`) with `onViewChange`, the application's own buttons in `actions`, and `onFullScreen`, which opens `/agent-sessions` at the same view and navigates there when left out. The session, the new session and the list are laid out by the panel's width rather than the screen's: below 448 pixels they look as they do on a phone. In the panel a new session starts in place, a session picked in the list opens in place, a session's details expand inside the panel without a page overlay, and a record tied to a session opens at its own `href`.

```tsx
<AgentSessionsPanel
  cli='acme'
  view={view}
  onViewChange={setView}
  attach={{
    id: `issue:${issue.id}`,
    attachments: [
      {
        id: issue.id,
        label: `${issue.key} ${issue.title}`,
        reference: { kind: 'issue', refId: issue.id },
      },
    ],
    projectId: issue.projectId,
  }}
  actions={<CloseButton />}
/>
```

`attach` puts what the panel was opened beside in the shown draft, once for each `id`: it shows above the message, where the person can remove it, and goes with the next message sent. An attachment with a `reference` is sent as a `#` mention of that record; one with `text` adds that text to the message, for what cannot be mentioned. `projectId` is the project a new session starts with. `useLinkedSessions(kind, refId)` lists the viewer's sessions tied to a record, the latest activity first (`GET /api/agentSessions/sessions?linked=<kind>:<refId>`), so the application can offer an explicit continuation entry on that record.

For automatic page context, pass `mode: 'replace'` and a `scope` for the current entry intent. Keep `scope` stable while the page changes and give each update a fresh `id`; start another scope for an explicit new session, which clears the previous message text and typed mentions. Replacement applies only to a new draft, preserves manual attachments, and stops following after the person removes automatic context or sends (including an unconfirmed submission). Send an empty attachment array to clear the previous automatic object. The project follows the applied context, too. An optional `attach.placeholder` customizes the new draft's hint without inserting message text. Pass `activeLink: { kind, refId }` to mark the record shown in the main page; clicking a sidebar task keeps the internal list open. The full-page task panels and phone sheets keep their existing behavior.

Hosts can pass optional `onInspectAttachment(attachment)` to `AgentSessionsPanel`. The attachment label becomes a button that invokes it with the same `text` and `reference` the composer submits; the host can show a preview without changing or removing the attachment. Without the callback, tags keep their existing appearance and behavior.

`useAgentSessionDraft()` from `client/panel` reads and writes portable draft text and attachments in the existing authenticated application memory cache: `drafts.read(view)` returns `{ text, attachments, mentions }` or `null` for a list. The selected inline `mentions` include only references still present in the text. `drafts.write(view, draft)` replaces those fields, clearing inline mentions when omitted. A write returns `false` while an unresolved submission owns the destination; the host must retain the source draft and handle that result before copying the destination back. Pending images and transport-specific state remain with their original draft. When transferring into a newly mounted panel, use an append attachment intent: a new `mode: 'replace'` scope deliberately clears text and typed mentions. This adds no server fields or storage.

`useAgentSessionAvailability()` from `client/panel` returns an asynchronous check of the owner's current computers. Call it at an entry action and await its boolean result: true means at least one computer is online with an Agent reporting no problem. It shares the plugin's owner-scoped cache, fetches fresh availability each time and adds no polling; request failures reject so the host can choose its fallback.

### What the agent knows of the session's work

The records tied to a session, created in it or mentioned in its messages, are what the person means by "the tasks", and the agent is told so. A message carries the list beneath it whenever it changed since the agent was last told, each record with its standing in the person's language and what is new or changed marked, so that an agent coming back to a session a day later learns what happened meanwhile; a message after which nothing changed carries nothing. The `session work` CLI command lists that work with progress from the kind's existing batch resolver. `agentSessions.toldWork` keeps what the agent was last told, and `locale` the interface language supplied with the owner's latest message. Application instructions can be a string or a `(viewer) => string` resolver and are resent when their generated content changes.

With `registerProjects`, a new session may work for one of the application's projects (`GET /api/agentSessions/projects`). The session shows its project, the list groups and filters by it, and the CLI creation context supplies it as the default project.

### How the agents work

`registerInstructions(text)` tells the agents in sessions how the application wants them to work, in English, such as what they do themselves and what they record for others to run. The agent reads it beneath a session's first message, and beneath the next message again whenever the text changed (`agentSessions.toldInstructions` keeps a hash of what it was told). The transcript keeps the messages as written.

### Telling the owner

What happens in a session while its owner is not looking can reach them elsewhere, such as in an inbox: register `registerNotices({ send, settle })` on `agentSessionsToken`. The owner is told when the agent waits for their permission, or when a turn ends, answered or failed (as when the agent could not start), unless they saw it on the session's page within 20 seconds: the page records how far its owner has seen the transcript while it is visible (`POST /api/agentSessions/sessions/{sessionId}/seen`, `agentSessions.seenSeq`). A turn they stopped tells nothing, and neither do the records a session ties to it, which the application tells of itself. Each notice (`SessionNotice`) names the session, its title and agent, and what the agent asks to do or why the turn failed; its `key` is the same when sent twice. The service settles what it told when the owner sees the session (`seen`), answers the request (`answered`) or archives the session (`archived`).

### Using the CLI and shared Skill

Sessions use the CLI with the bridge-selected person's existing login profile and the session id in environment variables. The session id is context, never a credential. There is no built-in MCP endpoint or session token. Before starting or restoring a session, the CLI ensures its bundled Skill is installed for the selected agent; unsupported tools or installation errors stop that opening with an explicit message. No files are written to the user's repository.

`creationContext(userId, sessionId)` checks ownership and rejects archived sessions before an application creates a record. After its normal permission-checked creation, the application calls the existing `link()` service. `sessionWork(viewer, sessionId)` checks ownership and returns only work its link resolver makes visible, with batch progress. The CLI exposes it as `session work <session>`.

## The agents

The bridge offers the agents installed on the computer, each run as its own program in its ACP mode or through its ACP adapter (`packages/libs/acp-bridge/src/agents.ts`); a person signs in to an agent with its own command line, and the pages list the others as also supported.

| Agent          | Started as                                                                                        | Full access                                                         |
| -------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Codex          | `codex-acp`, installed once by the bridge, else on PATH, else `npx`, next to an installed `codex` | Mode `agent-full-access`                                            |
| Claude Code    | `claude-agent-acp`, installed once by the bridge, else on PATH, else `npx`, beside `claude`       | Mode `bypassPermissions`                                            |
| Gemini CLI     | `gemini --acp`                                                                                    | Mode `yolo`                                                         |
| GitHub Copilot | `copilot --acp`                                                                                   | The bridge allows what it asks                                      |
| Cursor         | `cursor-agent acp`                                                                                | The bridge allows what it asks                                      |
| OpenCode       | `opencode acp`                                                                                    | Mode `build`, with every permission allowed (`OPENCODE_PERMISSION`) |
| Qwen Code      | `qwen --acp`                                                                                      | Mode `yolo`                                                         |
| Kimi CLI       | `kimi acp`                                                                                        | The bridge allows what it asks                                      |
| CodeBuddy Code | `codebuddy --acp`                                                                                 | The bridge allows what it asks                                      |
| Qoder CLI      | `qodercli --acp`                                                                                  | The bridge allows what it asks                                      |
| Goose          | `goose acp`                                                                                       | `GOOSE_MODE=auto`                                                   |
| Auggie         | `auggie --acp`                                                                                    | The bridge allows what it asks                                      |
| Factory Droid  | `droid exec --output-format acp-daemon`                                                           | The bridge allows what it asks                                      |
| Kilo Code      | `kilo acp`                                                                                        | The bridge allows what it asks                                      |
| Cline          | `cline --acp`                                                                                     | The bridge allows what it asks                                      |
| Amp            | `amp-acp`                                                                                         | The bridge allows what it asks                                      |
| Mistral Vibe   | `vibe-acp`                                                                                        | The bridge allows what it asks                                      |

On Windows the bridge finds each program with one of PATHEXT's extensions, runs npm's `.cmd` launchers through `cmd.exe` without a window, and stops an agent with its whole process tree; the application reads each computer's paths with its own system's rules. Each session opens with full access so that a person's first message is simply carried out, as it would be in their terminal: in the agent's full-access mode when it offers one, the person still free to choose another, or else with every permission it asks for allowed by the bridge. New sessions discover the installed agent's actual choices for the selected computer and directory; the first message does not wait for them. The existing composer shows model, reasoning level and other settings, including labeled fixed values; slash commands still come from the last session. A person can change settings before the first message and during the conversation, and the session keeps them when it reopens. An agent that asks permission anyway waits for the owner up to 30 minutes and is then declined. A session continues the agent's own conversation (`session/resume`, else `session/load`) whenever its agent process starts again. A person signs the agent in on their computer with its own command line (`codex login`, `claude`, `opencode auth login` and so on); a session whose agent is not signed in says what to run.

### Settings before the first message

`POST /api/agentSessions/computers/{computerId}/discoverChoices` accepts `agentId`, an absolute `cwd` within the owner's allowed folders, `settings` overrides and, from the new-session page, `sessionId`: the `submissionId` the session its first message creates will have. It uses the existing correlated command/reply transport and waits up to 160 seconds, including agent initialization. The ACP session receives no prompt or MCP servers, grants no requested tool permissions and creates no Studio session or work. Without `sessionId` the bridge stops its agent process; with it, the bridge keeps the agent and its open ACP session for up to five minutes, and the session created with that id takes it over for its first message instead of starting another, as `@nocobase/acp-bridge` describes. The new-session page chooses that id with the draft and replaces it once a message was sent with it, so each draft discovers for its own session. The agent may retain an empty session in its own history. Choices come from ACP configuration options, or session modes when configuration options are absent; no model list is hardcoded.

Discovery is local to the effective computer, agent and directory. Changing these selections or observed online/agent availability clears settings; late responses, including A → B → A, are ignored. Changing a setting repeats discovery to refresh dependent choices; a model change resets dependent overrides. Loading and failure do not prevent sending: a message sent before fresh choices arrive, or after discovery failed, carries only the settings the person chose and leaves the rest to the agent's defaults, and Retry refreshes failed choices; offline keeps the selected computer visible and asks to reconnect. An empty configurable surface and an unsupported surface each explain that agent defaults will be used. Send captures the target and settings together and locks selectors while creating the session.

The newly opened ACP session validates and applies explicit settings before its first prompt. Unknown, removed or rejected choices fail visibly without sending a prompt, including on retry; server creation does not trust historical computer choices. Existing-session choice changes, resume and streamed configuration updates continue through the existing path. Bridge protocol version 2 uses the existing upgrade-required response; there is no fallback to old bridges or persistent discovery cache.

While its agent opens, a session shows what the bridge is doing in place of "The agent is working…": starting the agent, opening its session or applying settings (`Session.startup`, from the bridge's reports and stored as `agentSessions.startup`; bridges that do not report it leave it null).

## Transcripts

A session's transcript is the ACP `session/update` payloads as the agent sent them, with the person's messages, the turns, permission requests and their answers, notices and the records tied to the session. Strings longer than 32,768 characters are cut. Secrets are redacted before anything is stored, with the redactor of `@nocobase/agent-protocol` (tokens of the common services, `sk-…` keys, private keys, `Bearer` credentials, passwords in URLs and the like); a person's images are stored apart, through the file plugin as the projects plugin stores attachments: the transcript names each by its row in `agentSessionImages`, and the page loads it from `GET /api/agentSessions/sessions/{sessionId}/images/{file}`, its owner's only (a raster image inline, anything else as a download, sandboxed). The agent still receives the image itself. Without the file plugin, images stay in the transcript as sent.

Messages sent while the agent works wait their turn; stopping the turn (`POST .../cancel`) drops them too. Archiving a session stops its agent and refuses new messages until it is restored.

### Withdrawing one queued message

The owner can withdraw one queued message without stopping the current reply or the other queued messages. `POST /agentSessions/sessions/{sessionId}/withdraw` names the original prompt event's `seq`. A short transaction under the existing session mutex decides whether withdrawal or the bridge's execution claim wins. Approval to execute is the start boundary, including agent initialization. Once approved, withdrawal answers `AGENT_SESSIONS_PROMPT_STARTED` and the browser refreshes the transcript.

Withdrawal immediately vetoes execution, including messages already in the computer's memory queue. It remains **Withdrawing, waiting for computer confirmation** until the computer removes that message and acknowledges it; offline withdrawals can wait indefinitely. The withdrawal command is retained and retransmitted until acknowledged. Repeated requests and acknowledgements are idempotent, and reconnecting or restarting cannot replay a withdrawn message. The original text and images remain readable; **Edit and send again** opens a separate draft with the original images and creates a new submission without replacing the current composer draft. Unreadable images block that edit with Retry rather than silently dropping them.

Bridge protocol 4 adds `/bridge/claim` and `/bridge/withdrawn`, identifies prompts by session, sequence and prompt ID, and fences polls and claims by the registered protocol and bridge start time. The computer's nullable `protocol` column is added by migration; old records remain unknown. The prompt event's private `_execution` JSON stores queued, claimed, withdrawing, withdrawn or ended decisions; the terminal decision prevents a late retry from executing a completed prompt. Public `withdrawalRequested` and `promptWithdrawn` events update every window without changing the current running turn or generating a reply notification. Streamed updates add no prompt lookups; terminal reports carry the original sequence and cannot revive withdrawals or clear a newer running turn.

Upgrade and restart the computer connection. Older bridges cannot poll new commands; already delivered legacy prompts have no withdrawal capability, even after the computer upgrades. Their transcript explains that they cannot be safely withdrawn. A network outage leaves the current turn running but prevents the next prompt from starting until a claim succeeds. Every new prompt carries complete application instructions and its work snapshot, avoiding a dependency on a preceding queued prompt that may be withdrawn. Roll out the server and bundled CLI together; no fallback executes a prompt before authorization.

An unsequenced command left on the server from before the upgrade cannot obtain a safe execution claim. The bridge records a warning asking the owner to copy it into a new message, rather than silently dropping it or executing it without authorization. Messages already received by an older bridge may still run there; upgrading never presents them as safely withdrawn.

Each new start adds one HTTP round trip and one session transaction, replacing the reported start event. Withdrawal and acknowledgement each take one session transaction. Only a full batch dominated by retained withdrawals adds a second bounded read, reserving up to 25 slots each for ordinary and retained commands so a lost acknowledgement cannot starve other commands. Empty polls retain their original reads and take no session lock. A poll containing withdrawals waits one second before repeating. There are no leases, automatic reruns or additional background sweepers.

## Data

| Collection              | Holds                                                                                                                                                                                                                              |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `agentSessionComputers` | A person's computers: name, platform, home directory, the agents found and the choices and commands each last offered, what the bridge allows and the folders the owner chose, the SHA-256 of its key, when the bridge last polled |
| `agentSessions`         | A session: its computer, agent, directory and project, the agent's session id and state, the owner's choices, whether a turn runs or a permission request waits, how far its owner has seen it and what they were told of          |
| `agentSessionEvents`    | The transcript, numbered per session (`seq`)                                                                                                                                                                                       |
| `agentSessionCommands`  | Commands waiting for a computer's next poll                                                                                                                                                                                        |
| `agentSessionLinks`     | Records tied to sessions, and whether the owner decided about them                                                                                                                                                                 |
| `agentSessionImages`    | The images sent in messages, stored through the file plugin: its file columns, and the session and its owner                                                                                                                       |

Removing a computer leaves its sessions readable; they take no more messages.

## Verification

Applications may call `service.onCommittedEvent(listener)` to observe immediate `turnEnded`, `turnFailed` and `permissionRequested` reminder identities after the transcript transaction commits. The callback receives only owner/session/title/sequence/reason, without transcript bodies or permission input. It runs independently of delayed notices and seen settlement, adds no SQL, and returns an unsubscribe function. Schedule asynchronous work from the listener and handle its failures in the application; observer failures cannot roll back a committed transcript. No event is emitted for cancelled turns or a transaction that rolls back.

```bash
pnpm --filter @nocobase/app-plugin-agent-sessions lint
pnpm --filter @nocobase/app-plugin-agent-sessions typecheck
pnpm --filter @nocobase/app-plugin-agent-sessions test
pnpm --filter @nocobase/app-plugin-agent-sessions build
```

## Retaining new-session state across navigation

An application can mount `AgentSessionsProvider` from `@nocobase/app-plugin-agent-sessions/client` inside its authentication provider and above its routes, with `owner` set to the authenticated user ID (or `null` when signed out). The routed pages then use that owner’s cache and a single live subscription across navigation. Changing owner destroys the previous cache; do not reuse an owner identifier across users. Studio supplies its owner-aware component through `agentSessions({ routes: false, cacheProvider: { name: 'owner-cache', after: ['@nocobase/app-plugin-authentication:authentication'], component: OwnerCache } })`. The plugin registers it in the extension layer after authentication; application-owned provider definitions cannot use that layer.

Discovery results remain valid for at most five minutes for the computer, agent metadata, directory, exposed roots/home/host and selected settings. Computer notifications and realtime reconnect invalidate discovery without clearing the selection or draft; expired or refreshing results are not sent as the session's settings. External agent configuration changes without an observable notification are bounded by that lifetime and can be refreshed with Retry. Same-key in-flight requests survive navigation, share one result and retain their thirty-second timeout; abandoning client waiting does not cancel queued bridge work. New-session drafts, attachments and selections live only in the owner’s memory cache, with a thirty-minute inactive eviction period, and disappear on reload, sign-out or account changes.

Both session creation and prompt submission accept an optional UUID `submissionId`. The browser always supplies it and retains the exact input with that ID until confirmation. After an uncertain result, **Retry original submission** sends the captured input with the same ID; **Edit as new message** explicitly releases it for a new submission, warning that the original may have arrived. Retry can recover confirmation while the computer is offline or the session is archived. No automatic retry or page-persistent recovery is performed; reload and account changes discard pending input. Legacy requests without an ID keep their previous behavior and have no duplicate protection.

The prompt event's existing primary key stores the submission ID; session creation uses that ID for both the session and its first prompt event. An internal digest of the normalized operation, target and ordered input detects conflicting reuse, which returns `409 AGENT_SESSIONS_SUBMISSION_CONFLICT` without exposing another owner's data. Internal digest metadata is removed from transcript responses and never sent to the bridge. The session, first event, links, image metadata and command commit together; notifications follow commit. Concurrent conflicts roll back before reading the original confirmation. Credentials last as long as the prompt event: permanent data removal or manual database restoration is outside this guarantee. No new collection, index or migration is required.

## Reading replies and processing permissions

`POST .../seen` settles completion and failure notices only. The conversation calls it after its visible transcript end has remained in view for one second; scrolling away, hiding the page or switching sessions cancels it. A long message must be scrolled to its end. Sending a message advances the existing read position in the prompt transaction and settles reply notices. Textual questions follow this same rule.

Permission notices are independent of reading. Delayed accounting still records a request the owner has seen while it waits. They settle with `answered` once the existing lifecycle makes the pending request count zero, including answers, terminal turns and cancellation, or with `archived` on archive. Registration is not itself a settlement rule; its existing invalidation of interrupted requests is observed without changing that lifecycle. Historical incorrectly settled notices are not restored.

The public session view includes its existing `seenSeq`. Applications can use that position, `waiting` and `archivedAt` to close displayed notifications, including replies read before delayed accounting. `sessionMarks` optionally renders an application-owned unread mark in each session list row, in both page and panel. The permission label is independent of computer connectivity. Immediate committed-event reminders retain their previous timing and suppression; reading and delayed accounting do not replace them.

Hosts can supply `AgentSessionsPanel.renderHeaderActions(menuItems)` to replace the new-session, list and session header controls with a common toolbar. The session title retains rename, archive, details and stop commands; hosts can also include the supplied `menuItems` in their own menu. When omitted, the existing header controls and full-page navigation remain unchanged. Expansion can then be owned by the host without navigating or replacing the mounted draft.

`AgentSessionsPanel.showHistory` optionally places the existing session list beside the current content, retaining the mounted draft during layout changes. With custom header controls, the session title also exposes the existing session commands, so hosts can use a direct toolbar without an overflow control.
