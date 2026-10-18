# OnlineAgent example

This Examples-only integration uses the Agents plugin's public chat SDK and model configuration route. The native example runs OnlineAgent directly with a configured chat model, without a Runner, custom Agent, tools or Skills. It does not add a plugin API or modify the Default template.

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

### Build the application business CLI

Before sending Runner chat, build the Examples business CLI from this application directory:

```bash
pnpm nocobase cli build --universal
```

The declared `nocobase-examples` CLI uses `@nocobase/app-cli-client` to call this application's published business APIs. It is not the development-management command `pnpm nocobase`, and installing `nocobase-runner` does not install it. The build writes a versioned archive and checksum manifest under `storage/runners/dist/stable/nocobase-examples/`; Agents serves the archive and the Runner downloads and verifies it during preparation. The universal archive requires Node.js 24 or newer on the execution machine. For machines without host Node.js, use `pnpm nocobase cli build --targets <platform>` to bundle Node.js instead. Build the Runner separately with `pnpm nocobase cli build --runner` when its distribution is not already available.

`server/config/agents.ts` aligns `agents.cli.name` with the declared CLI and keeps `agents.app` keyed by the runtime's application name (`main` by default), so introducing the CLI brand does not replace existing Runner registrations. Keep a customized `agents.app` identity unchanged when upgrading; if an existing deployment overrides `app.name` directly, explicitly preserve that name in `agents.app` as well. `config.yml` may override these defaults. The default run credential location `.nocobase-examples/run.json` matches the business client; never point a CLI override at the development CLI. No global CLI installation or Runner re-registration is needed for the served archive.

After changing the CLI brand or upgrading its client package, rebuild the archive. Build distribution artifacts in CI and mount them into production storage; do not commit them. If preparation reports `cliUnavailable` and says the CLI must be preinstalled, verify that this application's distribution contains the named business CLI for the Runner's platform (or a universal archive), rather than reinstalling the Runner or changing a model. Native OnlineAgent chat does not require this CLI build.

## Chat behavior

- The header button, keyboard shortcut and homepage entry control one shared panel across authenticated business pages. Route navigation and closing the panel do not stop a reply.
- Desktop/mobile presentation changes and mobile close/reopen preserve the mounted composer, including its draft and pending attachments. An upload finishing after Send becomes unavailable never submits automatically.
- Send a message and watch the streamed reply. **Stop** cancels the current execution; it remains available even if catalog refresh fails or the model is no longer offered. The server saves available native output when cancellation completes; Runner Stop waits for the existing cancellation acknowledgement and canonical history.
- **History** lists saved conversations owned by the current user. Reopen a new-bound conversation to read it and continue. Historical unbound conversations remain read-only, with Stop available for unfinished old runs. Saved history remains readable without a currently enabled model; native sending is gated by model readiness; Runner sending uses Agent and execution-machine availability.
- A catalog request error offers recovery rather than pretending there are no models. Expired sessions link to sign-in; forbidden or missing records do not offer an ineffective Retry. Empty history offers a new conversation, while an unsuccessful search offers **Clear filters**.
- Reload starts with a closed, new panel. Select persisted history explicitly. Signing out or switching identities discards the old panel selection, draft, cache and local stream subscription before mounting the next identity's controller. It does not delete saved conversations or automatically cancel a server execution.
- Interrupted or uncertain streams are not automatically resent or reconnected. Refresh saved history to determine what the server received before sending again.
- If conversation creation loses its response, explicitly creating another may leave an empty duplicate. The recovery explains this before sending; history refresh alone cannot recover a missing conversation ID.

Successful archive notifications keep **Undo** usable after the history row disappears, but never after signing out or switching accounts. The application guards late mutations and retained notification actions with the authenticated identity's lifetime rather than a page or history-row lifetime.

The panel UI is installed application source in `client/extensions/nocobase-agent-chat/`. Examples adds a local send-availability contract, recovery actions and OnlineAgent wording. The shared controller and API behavior remain owned by the public Agents SDK. The integration wrapper in `client/components/online-agent/` supplies identity isolation, model readiness, permission-aware configuration links and lazy loading. Do not overwrite these local adaptations during Registry upgrades without reviewing their tests.

## AI Translation: `OnlineAgent.background()`

Open **Agents → AI Translation** (`/ai-translation`) as any signed-in user. Choose an enabled chat model, enter up to 10,000 characters, choose the source and target languages, then select **Translate**. The source defaults to automatic detection and the target to English. The read-only result preserves plain text and line breaks; changing any input clears it. No Runner or application business CLI build is required.

This compact demo uses one awaited `POST /api/aiTranslation`. The application-owned helper in `server/providers/ai-translation.ts` calls the shared `agentsToken.onlineAgent.background()` with the trusted authenticated actor, native `online` executor, the selected model, and empty scope/tool lists. It calls `run(messages, schema)` with a `{ translation: string }` JSON Schema, awaits `get()` for the successful validated and saved result after execution cleanup. Admission is not completion: `run()` alone does not return the translation. The helper races this waiting read against its HTTP deadline without polling; timeout still requests best-effort cancellation, including late creation or admission. The route independently validates input and requires an unscoped signed-in identity; the browser never supplies user IDs or provider credentials.

The server observes for at most 60 seconds and requests best-effort `abort()` on timeout without waiting indefinitely for cleanup. This is not a hard execution-stop guarantee. Leaving the page stops browser observation, not necessarily server execution. Interrupted requests have an unknown outcome and are never automatically resent; manually translating again may call the model twice.

The demo creates no business tables, task records, polling endpoint, history page or cancellation UI. The Agents plugin still saves its background session in existing storage and hides new background sessions from the default chat list; that is not a realtime conversation that can be continued in the chat panel. Background visibility is fixed by the framework; this example does not archive or delete sessions. Page drafts and visible results are discarded on reload, navigation away or identity change.

Focused verification uses local fixtures rather than paid providers:

```bash
pnpm exec vitest run tests/components/ai-translation.test.tsx tests/logic/ai-translation.test.ts tests/logic/ai-translation-helper.test.ts
```

These tests cover the real structured-generation HTTP chain, ordinary-member access, scoped-key denial, input limits, model selection, safe errors, bounded observation and late cleanup, as well as loading, validation, translations and identity isolation in the UI. They do not establish translation quality or connectivity to an external provider.

## Verification

Run the focused tests from this application directory:

```bash
pnpm exec vitest run tests/components/online-agent-*.test.tsx tests/logic/agents-online.test.ts
```

The component tests cover identity transitions, late mutation/Undo isolation, delayed upload callbacks, shared controller state, mobile draft retention, model readiness and refresh races, localized notices, permission-aware links, Stop and read-error recovery. The HTTP integration test starts the real Examples standalone composition with disposable databases and storage through `@nocobase/app-testing`. It uses this application's local OpenAI-compatible HTTP fixture, not mocked application responses, plugin-internal test files or external models. It verifies authentication, authorization, encrypted-key redaction, model configuration and connection checking, streamed events, saved history, continuation context, conversation ownership and cancellation.

These tests prove the local application and HTTP-adapter contract, not connectivity to a real provider, the validity of a user's API key or the quality of model output. Verify those separately with a user-configured service: create a fresh chat, send a message, confirm a streamed reply, stop a longer response, reload and reopen the saved conversation. Never describe a fixture result as a successful real-provider call.

Native text increments display immediately. Runner text displays one completed block at a time before the run finishes, using canonical message positions so notices, retransmissions and final history do not duplicate output. An empty or failed native model catalog does not disable an available Runner. Changing executor starts a new conversation; existing conversations keep their saved Agent.

## Structured extraction

Open **Agents → Structured Extraction** (`/ai-structured-extraction`). Submit source text and a JSON Schema to inspect a validated result. The application-owned `server/providers/structured-extraction-service.ts` uses background execution and awaits its saved result, with a deadline and request-disconnect handling. Invalid input/schema errors are separate from execution, generated-output validation, storage and cleanup errors. Timeout can end the HTTP request before a tool terminates; the service requests cancellation without automatically resending work.

Run its focused checks from this application's directory:

```bash
pnpm exec vitest run tests/logic/structured-extraction.test.ts tests/logic/structured-extraction-service.test.ts
```

## Integration and upgrades

The framework contract, copyable server examples, permissions and lifecycle rules are in the installed Agents plugin Skill, `nocobase-app-plugin-agents/references/online-agent.md`, synchronized into `.agents/skills/` by the application. The same reference ships inside `@nocobase/app-plugin-agents/skills/`; it is available in a generated application without a repository checkout. Use that contract when adding an application business tool or calling background work from another service.

Update external callers of the removed start operation to `conversation create` then `conversation message send`, or their HTTP equivalents. They are two requests and can leave an empty conversation if sending fails. Removed fallback/restore HTTP and CLI commands have no same-session replacement: explicitly create a new conversation with the desired executor, without automatically copying history. Historical chats remain read-only but unfinished old runs can be stopped by their owner.

After upgrading, apply database migrations, open a new chat, send and stop a reply, then reload its history. Verify that AI Translation and Structured Extraction return results without adding background sessions to ordinary History. Existing ordinary chats remain visible. Check a historical consultation card with saved plans: its answer, steps, error and usage remain visible without a proposed-plan quantity hint.
