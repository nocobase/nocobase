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
- Send a message and watch the streamed reply. **Stop** cancels the current execution; it remains available even if catalog refresh fails or the model is no longer offered. The server saves native partial output when cancelled; Runner Stop waits for the existing cancellation acknowledgement and canonical history.
- **History** lists saved conversations owned by the current user. Reopen one to read it and continue. Saved history remains readable without a currently enabled model; native sending is gated by model readiness; Runner sending uses Agent and execution-machine availability.
- A catalog request error offers recovery rather than pretending there are no models. Expired sessions link to sign-in; forbidden or missing records do not offer an ineffective Retry. Empty history offers a new conversation, while an unsuccessful search offers **Clear filters**.
- Reload starts with a closed, new panel. Select persisted history explicitly. Signing out or switching identities discards the old panel selection, draft, cache and local stream subscription before mounting the next identity's controller. It does not delete saved conversations or automatically cancel a server execution.
- GET recovery uses the SDK and optional plugin-managed shared Redis. Missing or interrupted streams require saved history and business-state reconciliation. Inputs and tools are never automatically repeated.
- If conversation creation loses its response, explicitly creating another may leave an empty duplicate. The recovery explains this before sending; history refresh alone cannot recover a missing conversation ID.

Successful archive notifications keep **Undo** usable after the history row disappears, but never after signing out or switching accounts. The application guards late mutations and retained notification actions with the authenticated identity's lifetime rather than a page or history-row lifetime.

The panel UI is installed application source in `client/extensions/nocobase-agent-chat/`. Examples adds a local send-availability contract, recovery actions and OnlineAgent wording. The shared controller and API behavior remain owned by the public Agents SDK. The integration wrapper in `client/components/online-agent/` supplies identity isolation, model readiness, permission-aware configuration links and lazy loading. Do not overwrite these local adaptations during Registry upgrades without reviewing their tests.

## AI Translation: `OnlineAgent.background()`

Open **Agents → AI Translation** (`/ai-translation`) as any signed-in user. Choose an enabled chat model, enter up to 10,000 characters, choose the source and target languages, then select **Translate**. The source defaults to automatic detection and the target to English. The read-only result preserves plain text and line breaks; changing any input clears it. No Runner or application business CLI build is required.

This compact demo uses one awaited `POST /api/aiTranslation`. The application-owned helper in `server/providers/ai-translation.ts` calls the shared `agentsToken.onlineAgent.background()` with the trusted authenticated actor, native `online` executor, the selected model, and empty scope/tool lists. It calls `run(messages, schema)` with a `{ translation: string }` JSON Schema, waits until `status()` is idle, then reads the successful structured value with `get()`. Admission is not completion: `run()` alone does not return the translation. The route independently validates input and requires an unscoped signed-in identity; the browser never supplies user IDs or provider credentials.

The server observes for at most 60 seconds and requests best-effort `abort()` on timeout without waiting indefinitely for cleanup. This is not a hard execution-stop guarantee. Leaving the page stops browser observation, not necessarily server execution. Interrupted requests have an unknown outcome and are never automatically resent; manually translating again may call the model twice.

The demo creates no business tables, task records, polling endpoint, history page or cancellation UI. The Agents plugin still saves its background session in existing storage and currently includes it in the owner's chat history; that is not a realtime conversation that can be continued in the chat panel. This example does not hide, archive or delete those sessions. Page drafts and visible results are discarded on reload, navigation away or identity change.

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

The component tests cover identity transitions, late mutation/Undo isolation, delayed upload callbacks, shared SDK Chat ownership, mobile draft retention, model readiness and refresh races, localized notices, permission-aware links, Stop and read-error recovery. The HTTP integration test starts the real Examples standalone composition with disposable databases and storage through `@nocobase/app-testing`. It uses this application's local OpenAI-compatible HTTP fixture, not mocked application responses, plugin-internal test files or external models. It verifies authentication, authorization, encrypted-key redaction, model configuration and connection checking, streamed events, saved history, continuation context, conversation ownership and cancellation.

These tests prove the local application and HTTP-adapter contract, not connectivity to a real provider, the validity of a user's API key or the quality of model output. Verify those separately with a user-configured service: create a fresh chat, send a message, confirm a streamed reply, stop a longer response, reload and reopen the saved conversation. Never describe a fixture result as a successful real-provider call.

For a browser smoke test of an independently generated application, start it on its own test database, then run `pnpm exec playwright test tests/playwright/online-agent.test.ts`. Set `APP_URL` to the full server entry including its base path, and supply the isolated administrator with `E2E_USERNAME` / `E2E_PASSWORD`. The test creates a local HTTP model fixture, configures it through the real application API, and drives the installed chat without mocking browser responses. It checks incremental output, stable saved history after reload, trusted follow-up context and the independent Stop endpoint. `E2E_SCREENSHOT_DIR` optionally saves English running-interface screenshots; `E2E_BROWSER_PATH` selects an installed Chromium executable. Run only against a disposable application: the test creates conversations and a temporary model service.

Native text increments display immediately. Runner text displays one completed block at a time before the run finishes, using canonical message positions so notices, retransmissions and final history do not duplicate output. An empty or failed native model catalog does not disable an available Runner. Changing executor starts a new conversation; existing conversations keep their saved Agent.

## Chat feedback, defaults and read state

`chatFeedback`, `chatIsRunning` and `useChatScroll` from the public client/chat entry provide presentation shared by the Registry block and its application copies. Local submissions show sending immediately; execution and current-stream state show waiting/thinking until the first visible reply. A successful Stop request remains stopping until the execution actually becomes idle. EOF or an interrupted subscription reports an unconfirmed result, never success or an automatic resend. Outcomes use localized safe keys; internal provider errors are not displayed. `requiresEffectReview` asks the person to check actions before continuing. Layout growth follows only while the reader remains near the bottom; loading older messages preserves their position.

The built-in `online` choice is part of the service directory and may be saved as a personal or team default even before a model is configured; its availability still reports `noModel`. UI selection remains picked agent, personal default, then team default and passes that choice explicitly. Service calls that omit `agentId` retain Native compatibility, regardless of a Runner preference. Explicit scope/options precedence and existing session binding are unchanged; invalid or unavailable choices never silently select another backend.

Accepted user input marks the conversation read in its existing transaction. Only newly persisted visible assistant output marks it unread; empty cancellation/failure, tool-only records and duplicate finalization do not. Stop/abort resolves after the cancellation request has been processed; consumers must use execution status, saved history and terminal stream confirmation rather than the request Promise to decide whether another turn is safe. Follow-up context is limited to reauthorized references from the latest earlier page-bearing user message, with current page references taking priority. Full historical page context, including old selections, filters, routes and credentials, is not replayed.

The historical `runCancelled` notice means that cancellation was requested, not that execution has ended. It is rendered as “Cancellation requested.” even when older stored text says otherwise; terminal feedback still waits for the existing execution and saved-history confirmation.

## Historical page references

On a follow-up, OnlineAgent may supplement the current user input with authorized references from only the latest earlier page-bearing user message. It reuses loaded Native history; Runner admission performs one bounded latest-page read outside the existing admission transaction. Current page references (including a selection source) take priority, duplicates are removed, and historical additions use only the remaining slots of a ten-reference budget after counting current references; existing current-context limits stay unchanged. An empty, deleted, unknown or inaccessible latest page never falls back to an older one.

References are re-resolved through the existing page-kind resolver for the current user, once per kind. Only kind, identifier and the current title (at most 2,000 characters) enter the supplementary untrusted user data. Stored titles, URLs, keys, routes, filters, selections and entry credentials are not replayed. The supplement is not written back to conversation history or promoted to a system instruction. A Native entry with a restricted credential scope receives no inferred historical references because the existing resolver accepts user identity only; ordinary current context and tool authorization stay unchanged.

Resolvers remain responsible for business authorization and their own database reads. One batched resolver invocation does not imply one SQL query: Studio currently resolves each issue through its authorized detail service. There is no extra Native history query, new table, lock, persistent idempotency, automatic resend or reconnect. Runner protocol and lifecycle remain unchanged; existing Runner session memory and previously generated answers are not erased by this policy.

## UIMessage extensions and approval

Messages are `AppUIMessage` values from the SDK: render ordered text, file, tool, `data-notice` and `data-business` parts. `ChatExtensionsContext` receives the original UIMessage; `renderMessageExtra` runs once on its final source segment. `renderDataPart` can supply a card, while null preserves the built-in renderer. A null `renderNews` falls back to localized `newsText`, then the saved title. Timeline hooks retain stable business keys and their own authorized queries/subscriptions. Composer `toolbar` and `notice` remain child props. This does not restore missing Studio producers or the old ask_agent chain.

Approval buttons bind the saved message, execution and genuine tool approval ID. Denial does not execute the tool. Waiting approval and effect review retain business occupancy. Refresh rereads revisions by ID; pagination drains `nextAfter` before advancing its watermark. Independent notifications arrive by durable history polling (5 seconds running, 30 seconds idle) or business announcements after the model response has closed.
