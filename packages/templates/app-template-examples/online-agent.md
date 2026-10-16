# OnlineAgent example

This Examples-only integration uses the Agents plugin's public chat SDK and model configuration route. It runs OnlineAgent directly with a configured chat model, without a Runner, custom Agent, tools or Skills. It does not add a plugin API or modify the Default template.

## Configure a model

1. Start this application's own configuration and database as described in [Getting started](README.MD#getting-started). Open the `Local:` URL printed by `pnpm dev`, including its application base path.
2. Sign in with an administrator or another account allowed to manage `settings:agents.services`.
3. Open **Agents → Models** (`/models`, relative to the application mount path). Create a service using its provider, base URL and API key. Use **OpenAI-compatible** for a Chat Completions-compatible endpoint.
4. Discover models or add a model manually, mark it as a chat model and enable it. Check the connection through the Models page.
5. Open chat from the header button, Cmd/Ctrl+J or the homepage Online Agent card. If the panel was already open, close and reopen it or return focus to the window to refresh the available models.

API keys are write-only secrets held by the server and encrypted through `secrets.keys`. Enter them through Models; never commit them, put them in client code or copy another application's configuration. This example does not expose a model-default writer: OnlineAgent uses the applicable configured default or the first enabled offered chat model. A conversation keeps its configuration snapshot; start a new conversation to try changed model settings.

Models is visible only with `settings:agents.services` **read** permission; service changes, discovery and connection checks require **manage**. Ordinary signed-in users can chat without receiving model-service management access. A user without Models access sees guidance to ask an administrator when no chat model is configured. Server APIs enforce these permissions independently of navigation.

## Configure agents and runtimes

The same **Agents** menu also exposes the plugin's **Agents** (`/agents`) and **Runtimes** (`/runtimes`) pages. Open Runtimes and choose **Add runtime** (`/runtimes/connect`) to configure allowed coding tools and concurrency, then follow the plugin's installation and registration instructions on the execution machine. Use Agents to manage the runner-discovered agents after connection. These pages configure Runner execution; select an available Agent in a new chat to use it through the same panel.

The pages retain the plugin's `page:agents` and `page:runtimes` access grants. Agent management requires `settings:agents.agents` management access; team-runtime management requires `settings:agents.runners` management access. Personal-runtime operations remain subject to the plugin's ownership checks. Adding these menu entries does not grant permissions, register a runtime or start a local process.

## Chat behavior

- The header button, keyboard shortcut and homepage entry control one shared panel across authenticated business pages. Route navigation and closing the panel do not stop a reply.
- Desktop/mobile presentation changes and mobile close/reopen preserve the mounted composer, including its draft and pending attachments. An upload finishing after Send becomes unavailable never submits automatically.
- Send a message and watch the streamed reply. **Stop** cancels the current execution; it remains available even if catalog refresh fails or the model is no longer offered. The server saves native partial output when cancelled; Runner Stop waits for the existing cancellation acknowledgement and canonical history.
- **History** lists saved conversations owned by the current user. Reopen one to read it and continue. Saved history remains readable without a currently enabled model; native sending is gated by model readiness; Runner sending uses Agent and execution-machine availability.
- A catalog request error offers recovery rather than pretending there are no models. Expired sessions link to sign-in; forbidden or missing records do not offer an ineffective Retry. Empty history offers a new conversation, while an unsuccessful search offers **Clear filters**.
- Reload starts with a closed, new panel. Select persisted history explicitly. Signing out or switching identities discards the old panel selection, draft, cache and local stream subscription before mounting the next identity's controller. It does not delete saved conversations or automatically cancel a server execution.
- Interrupted or uncertain streams are not automatically resent or reconnected. Refresh saved history to determine what the server received before sending again.
- If conversation creation loses its response, explicitly creating another may leave an empty duplicate. The recovery explains this before sending; history refresh alone cannot recover a missing conversation ID.

Successful archive notifications keep **Undo** usable after the history row disappears, but never after signing out or switching accounts. The application guards late mutations and retained notification actions with the authenticated identity's lifetime rather than a page or history-row lifetime.

The panel UI is installed application source in `client/extensions/nocobase-agent-chat/`. Examples adds a local send-availability contract, recovery actions and OnlineAgent wording. The shared controller and API behavior remain owned by the public Agents SDK. The integration wrapper in `client/components/online-agent/` supplies identity isolation, model readiness, permission-aware configuration links and lazy loading. Do not overwrite these local adaptations during Registry upgrades without reviewing their tests.

## Verification

Run the focused tests from this application directory:

```bash
pnpm exec vitest run tests/components/online-agent-*.test.tsx tests/logic/agents-online.test.ts
```

The component tests cover identity transitions, late mutation/Undo isolation, delayed upload callbacks, shared controller state, mobile draft retention, model readiness and refresh races, localized notices, permission-aware links, Stop and read-error recovery. The HTTP integration test starts the real Examples standalone composition with disposable databases and storage through `@nocobase/app-testing`. It uses this application's local OpenAI-compatible HTTP fixture, not mocked application responses, plugin-internal test files or external models. It verifies authentication, authorization, encrypted-key redaction, model configuration and connection checking, streamed events, saved history, continuation context, conversation ownership and cancellation.

These tests prove the local application and HTTP-adapter contract, not connectivity to a real provider, the validity of a user's API key or the quality of model output. Verify those separately with a user-configured service: create a fresh chat, send a message, confirm a streamed reply, stop a longer response, reload and reopen the saved conversation. Never describe a fixture result as a successful real-provider call.

Native text increments display immediately. Runner text displays one completed block at a time before the run finishes, using canonical message positions so notices, retransmissions and final history do not duplicate output. An empty or failed native model catalog does not disable an available Runner. Changing executor starts a new conversation; existing conversations keep their saved Agent.
