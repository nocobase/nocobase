# OnlineAgent example

This Examples-only integration uses the Agents plugin's public chat SDK and model configuration route. The basic native chat example runs OnlineAgent directly with a configured chat model, without a Runner, custom Agent, tools or Skills; the separate AI Form Fill demonstration below explicitly selects its application-owned proposal tool scope. It does not add a plugin API or modify the Default template.

## Model reasoning

When the selected native model actually returns SDK reasoning parts, the installed chat displays them separately from the answer, including saved history. It does not request, synthesize or infer hidden reasoning from models or Runner text. Active reasoning opens automatically; each part collapses when it ends, and history starts collapsed. Manual open/close choices override automatic changes for that mounted part, including message revisions. Reasoning uses the answer's safe Markdown renderer, supports keyboard toggling, and remains outside text copy/search helpers. A reasoning-only response does not also show generic thinking; Stop and execution outcomes keep their existing meaning.

For an offline browser regression, build this package and run `node --experimental-import-meta-resolve --import tsx tests/fixtures/online-agent-reasoning-acceptance.ts` from its directory. Set `E2E_SCREENSHOT_DIR` to retain screenshots. The harness creates temporary configuration, isolated databases/storage, synthetic credentials and a local HTTP model fixture; it prints the actual application entry URL and disposes its owned server and data after the tests. It never calls a paid provider. This automated check does not replace acceptance against an explicitly authorized real provider or user review.

## Configure a model

1. Start this application's own configuration and database as described in [Getting started](README.MD#getting-started). Open the `Local:` URL printed by `pnpm dev`, including its application base path.
2. Sign in with an administrator or another account allowed to manage `settings:agents.services`.
3. Open **Agents → Models** (`/models`, relative to the application mount path). Create a service using its provider, base URL and API key. Use **OpenAI-compatible** for a Chat Completions-compatible endpoint.
4. Discover models or add a model manually, mark it as a chat model and enable it. Check the connection through the Models page.
5. Open chat from the header button, Cmd/Ctrl+J or the homepage Online Agent card. If the panel was already open, close and reopen it or return focus to the window to refresh the available models.

API keys are write-only secrets held by the server and encrypted through `secrets.keys`. Enter them through Models; never commit them, put them in client code or copy another application's configuration. This example does not expose a model-default writer: OnlineAgent uses the applicable configured default or the first enabled offered chat model. A conversation keeps its configuration snapshot; start a new conversation to try changed model settings.

Models is visible only with `settings:agents.services` **read** permission; service changes, discovery and connection checks require **manage**. Ordinary signed-in users can chat without receiving model-service management access. A user without Models access sees guidance to ask an administrator when no chat model is configured. Server APIs enforce these permissions independently of navigation.

## Configure agents and runtimes

The same **Agents** menu also exposes the plugin's **Agents** (`/agents`) and **Runtimes** (`/runtimes`) pages. Open Runtimes and choose **Add runtime** (`/runtimes/connect`) to configure allowed coding tools and concurrency, then follow the plugin's installation and registration instructions on the execution machine. Use Agents to manage the runner-discovered agents after connection. These pages configure Runner execution; switch the panel to Runner agents with the switch in its header, then select an available Agent in a new chat to use it through the same panel.

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
- The panel shows one kind of agent at a time: the Online agent (a configured model) or Runner agents, each with its own history. The switch in the header appears only when both are configured. A new conversation starts with the agent this person used last, remembered in this browser for this application, then with their default and the team's.
- Full width shows the history in a column on the left and the conversation on the right; going to another page from the navigation brings the panel back to its usual width. Click a context chip, in the composer or under a sent message, to see what it carries.
- **History** lists saved conversations owned by the current user. Reopen a new-bound conversation to read it and continue. Historical unbound conversations remain read-only, with Stop available for unfinished old runs. Saved history remains readable without a currently enabled model; native sending is gated by model readiness; Runner sending uses Agent and execution-machine availability.
- A catalog request error offers recovery rather than pretending there are no models. Expired sessions link to sign-in; forbidden or missing records do not offer an ineffective Retry. Empty history says so in one line and offers a new conversation, while an unsuccessful search offers **Clear filters**; **Archived** at the foot of the history switches to archived conversations.
- Reload starts with a closed, new panel. Select persisted history explicitly. Signing out or switching identities discards the old panel selection, draft, cache and local stream subscription before mounting the next identity's controller. It does not delete saved conversations or automatically cancel a server execution.
- GET recovery uses the SDK and optional plugin-managed shared Redis. Missing or interrupted streams require saved history and business-state reconciliation. Inputs and tools are never automatically repeated.
- If conversation creation loses its response, explicitly creating another may leave an empty duplicate. The recovery explains this before sending; history refresh alone cannot recover a missing conversation ID.
- Native user messages offer **Edit** and **Copy**, and linked assistant replies offer **Copy** and **Regenerate**. Runner messages offer Copy only. Inline Send and Regenerate execute directly without a confirmation dialog: the original answer and every later message are deleted, completed business operations are not undone and tools may run again. Editing preserves the original attachments/context and the independent bottom-composer draft. Rejected edits remain editable; unknown admission only synchronizes history and never automatically repeats the POST.

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

## AI Form Fill: browser drafts only

Open **Agents → AI form assistance** (`/ai-form-fill`) or its homepage example entry as a signed-in user. This Examples-only page needs an enabled chat model, not a Runner or business CLI build. Its route intentionally has `auth: 'required'` and `authz: 'skip'`: it demonstrates local draft editing with no business record persistence or separate page grant. If adapting it to real records, implement independent server authorization for every record operation; a UI snapshot or page route is not a permission grant.

1. Start with an empty **Purchase request**: purchase item, requesting department, quantity, estimated total in CNY, expected delivery date and purchase purpose. Edit manually or use AI; the centered form uses two columns on wide screens and stacks on narrow screens. There are no record selectors or technical ID fields.
2. Click **AI fill** at the upper-right of the **Purchase request** Card. This explicit action selects the current form and opens the shared chat; there are no separate page-level Ask agent or bottom Include form buttons. Registration or visiting the page alone does not select the form. Remove its composer chip if you do not want to include it in a later message.
3. The shortcut creates a Native `online` conversation with `config.scope: ['examples-form-fill']` and the enabled model choice, then opens the existing shared panel with a localized draft prompt. It does not send automatically. Review/edit the prompt and click Send. Opening an ordinary header chat does not automatically select the form or enable this business scope.
4. Send reads the latest explicitly selected form through the async snapshot API. The tool returns validated values in the normal SDK tool part; completed output automatically updates the matching browser draft, without an Apply or confirmation button.
5. The card validates completed output, matches its exact originating message's selected target and awaits the registry result. Missing selected context, incomplete/error/invalid output, stale instances, manual draft edits and validation failures never silently apply a patch. The card displays the outcome without taking keyboard focus; edit the filled values directly in the original form.
6. No save request, business record write, form submission or SDK continuation occurs. The completion message offers **Undo this fill** to restore the draft just before the latest AI patch; manual editing clears this undo so it cannot overwrite later edits. **Clear form** resets the fields. Both actions advance the revision, so a pending older proposal cannot refill the cleared/restored draft. Manual editing after Send invalidates that source snapshot even if a different field changed. Refresh/navigation discards page draft state; stable operation keys deduplicate rerenders and reconnects, and stale source snapshots cannot update a newly mounted form.

### Ownership and implementation map

| Owner                     | Files and responsibility                                                                                                                                                                                                                                                                                  |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Agents plugin             | Public `client/chat` exports: open UI JSON transport, `AIToolRendererProvider`/`AIToolRendererMap`/`AIToolRendererProps`, `AIFormRegistryProvider`/`AIFormRegistry`/`useAIFormRegistry`/`useAIForm`, explicit context selection and existing Chat ownership, message admission, persistence and recovery. |
| Examples shared contract  | [`shared/ai-form-fill.ts`](shared/ai-form-fill.ts): exact tool name `examples_form_proposal`, scope `examples-form-fill`, strict proposal/patch schemas; these are not plugin APIs.                                                                                                                       |
| Examples server           | [`server/providers/ai-form-fill.ts`](server/providers/ai-form-fill.ts), registered in `server/providers/index.ts`: boot-time `online.configurator.registerTool` plus named scope, safe `public.input`/`public.output`, and a tool that returns a validated proposal without writing anything.             |
| Examples page             | [`client/pages/ai-form-fill/index.tsx`](client/pages/ai-form-fill/index.tsx): safe fields, revision/identity-aware ref adapter, source registration, separate inclusion control, Native conversation creation and shared panel launcher.                                                                  |
| Examples card             | [`client/components/online-agent/form-proposal-card.tsx`](client/components/online-agent/form-proposal-card.tsx) and `form-values-editor.tsx`: output validation, read-only output preview, exact source match, automatic registry application and localized outcomes.                                    |
| Examples composition      | [`client/components/online-agent/provider.tsx`](client/components/online-agent/provider.tsx): one identity-bound form registry and renderer map around the existing `ChatProvider`, covering both page and shared panel while preserving cache/panel reset.                                               |
| Installed Registry source | `client/extensions/nocobase-agent-chat/`: standard SDK tool-name dispatch, fallback, source linkage, context chips and async Send snapshot integration, retaining the application's readiness/recovery adaptations.                                                                                       |

The application schema is `{ formId, instance, identity, revision, values }`. Procurement patches contain optional `name` (nonblank, at most 120 characters), `department` (`design`, `engineering`, `marketing`, `admin`), `quantity` (integer 1–10,000), `budget` (total CNY 0–1,000,000), `arrival` (valid `YYYY-MM-DD` date) and `purpose` (nonblank, at most 2,000 characters), with at least one field. Blank fields are omitted from snapshots, and numeric text is converted only at the snapshot/apply boundary. Legacy `priority` and `subscribe` remain readable in old conversation cards but are not accepted by the current procurement form. The proposal's target tokens are untrusted model output, not server credentials. The tool's explicit `public` projections expose only this safe validated proposal; SDK-standard `toModelOutput` is separate and does not replace browser safety projections.

`useAIForm` returns a ref callback attached as `<form ref={ref}>`, not `{ ref, context }`. Registration is local discoverability only. `useChatUIContextSource` supplies `getSnapshot: () => registry.snapshot(id)`; `sources.selectUI({ kind: 'form', id }, true)` records separate user intent. The installed composer awaits `sources.snapshotUI()` at Send before `buildPageContext`. The detached `context.ui = { version: 1, items: [...] }` preserves custom JSON through server admission, Native model input, public user metadata and history. It is separate from server-authorized business `context.items`; unknown UI kinds are supported without a resolver. A follow-up needing current state must include a fresh snapshot; earlier Native snapshots can remain historical model data, but do not authorize a new card absent from that card's own source message.

The renderer's `context.sourceMessage` is resolved only from the assistant's server-owned `metadata.sourceUserMessageId`, with exactly one loaded user message matching that id and conversation. `context.sourceContext` is that message's saved context. Native execution establishes this association and preserves it through public projection and approval revisions. Missing history/source metadata prevents automatic filling; the card never guesses from the latest user message, current composer selection, model allowed ids or mere presence in the registry. This example is Native-only and does not claim Runner can call a browser setter.

When a tool part reaches `output-available`, the card validates its output and matches the source snapshot's id/instance/identity/revision, then automatically calls `registry.apply({ source, operationId, values, signal })`. It does not wait for the remaining assistant text or user confirmation. The key includes conversation id, message id and SDK tool-call id, deduplicating rerenders/remounts within the identity-bound registry. Read-only history never starts an operation. The registry verifies the live instance, identity, unchanged revision and declared field capabilities, then validates and awaits the setter. A setter attempt invalidates that snapshot even if it fails or reports partial application. The example's setter checks `operation.isCurrent()` immediately before a synchronous local state/ref commit and advances its revision synchronously. Async adapters must honor cancellation and perform the same last-moment guard after preparation; arbitrary third-party setters are not made transactional, and partial/failed outcomes must be reported honestly. No local result is presented as a persisted server business fact.

Read the installed `@nocobase/app-plugin-agents/docs/ai-forms.md` for the exported types, open non-form UI-kind example, limits, renderer states/approval controls and integrated registration/composition snippets. The synchronized plugin Skill's `nocobase-app-plugin-agents/references/online-agent.md` routes to that contract; edit its package-owned source when changing plugin guidance, never the synchronized copy. Keep this business demonstration local to Examples rather than copying it into Default.

### Focused form verification

From this application directory, the form-specific validation entry points are:

```bash
pnpm exec vitest run tests/components/ai-form-proposal.test.tsx tests/logic/ai-form-fill.test.ts
pnpm exec playwright test tests/playwright/ai-form-fill.test.ts
```

The logic suite uses the real application composition and disposable database with a local OpenAI-compatible model fixture; the browser suite drives the installed UI against an isolated built application. Set `APP_URL` to its actual full application entry URL including base path and provide `E2E_USERNAME`/`E2E_PASSWORD` for its isolated administrator. Missing credentials/application URL skip the browser suite, which is not a passing acceptance result. These are verification commands and intended contracts, not a claim that this document ran them; report actual results separately. The model fixture proves local integration, not external-provider connectivity or proposal quality.

When using `tests/fixtures/online-agent-browser-server.ts`, rebuild the affected plugin/application outputs before starting it: it loads `dist/server/standalone.js` and requires the real form provider to be present. From this directory, start that fixture against disposable configuration/storage with `node --experimental-import-meta-resolve --import tsx tests/fixtures/online-agent-browser-server.ts`. The experimental resolution flag is relevant to this source fixture's two-argument `import.meta.resolve`: it resolves `agentsToken` relative to `dist/package.json`, preserving token identity with the built application instead of mixing workspace-source and deployed copies. This is fixture setup, not a production startup requirement. Use its printed `Local:` URL; never assume a port or reuse another person's run.

## Verification

Run the focused tests from this application directory:

```bash
pnpm exec vitest run tests/components/online-agent-*.test.tsx tests/logic/agents-online.test.ts
```

The component tests cover identity transitions, late mutation/Undo isolation, delayed upload callbacks, shared SDK Chat ownership, mobile draft retention, model readiness and refresh races, localized notices, permission-aware links, Stop and read-error recovery. The HTTP integration test starts the real Examples standalone composition with disposable databases and storage through `@nocobase/app-testing`. It uses this application's local OpenAI-compatible HTTP fixture, not mocked application responses, plugin-internal test files or external models. It verifies authentication, authorization, encrypted-key redaction, model configuration and connection checking, streamed events, saved history, continuation context, conversation ownership and cancellation.

These tests prove the local application and HTTP-adapter contract, not connectivity to a real provider, the validity of a user's API key or the quality of model output. Verify those separately with a user-configured service: create a fresh chat, send a message, confirm a streamed reply, stop a longer response, reload and reopen the saved conversation. Never describe a fixture result as a successful real-provider call.

For a browser smoke test of an independently generated application, start it on its own test database, then run `pnpm exec playwright test tests/playwright/online-agent.test.ts`. Set `APP_URL` to the full server entry including its base path, and supply the isolated administrator with `E2E_USERNAME` / `E2E_PASSWORD`. The test creates a local HTTP model fixture, configures it through the real application API, and drives the installed chat without mocking browser responses. It checks incremental output, stable saved history after reload, trusted follow-up context and the independent Stop endpoint. `E2E_SCREENSHOT_DIR` optionally saves English running-interface screenshots; `E2E_BROWSER_PATH` selects an installed Chromium executable. Run only against a disposable application: the test creates conversations and a temporary model service.

Native text increments display immediately. Runner text displays one completed block at a time before the run finishes, using canonical message positions so notices, retransmissions and final history do not duplicate output. An empty or failed native model catalog does not disable an available Runner. Changing executor starts a new conversation; existing conversations keep their saved Agent.

## Structured extraction

Open **Agents → Structured Extraction** (`/ai-structured-extraction`). Switch between Contact profile and Purchase order examples: source text stays on the left and editable extracted fields on the right, stacking on narrow screens. Each tab retains its local text, model selection and result. Completed extraction fills the result directly; there is no confirmation step or no-model configuration callout. The application-owned `server/providers/structured-extraction-service.ts` uses background execution and awaits its saved result, with a deadline and request-disconnect handling. Invalid input/schema errors are separate from execution, generated-output validation, storage and cleanup errors. Timeout can end the HTTP request before a tool terminates; the service requests cancellation without automatically resending work.

Run its focused checks from this application's directory:

```bash
pnpm exec vitest run tests/logic/structured-extraction.test.ts tests/logic/structured-extraction-service.test.ts
```

## Integration and upgrades

The framework contract, copyable server examples, permissions and lifecycle rules are in the installed Agents plugin Skill, `nocobase-app-plugin-agents/references/online-agent.md`, synchronized into `.agents/skills/` by the application. The same reference ships inside `@nocobase/app-plugin-agents/skills/`; it is available in a generated application without a repository checkout. Use that contract when adding an application business tool or calling background work from another service.

Update external callers of the removed start operation to `conversation create` then `conversation message send`, or their HTTP equivalents. They are two requests and can leave an empty conversation if sending fails. Removed fallback/restore HTTP and CLI commands have no same-session replacement: explicitly create a new conversation with the desired executor, without automatically copying history. Historical chats remain read-only but unfinished old runs can be stopped by their owner.

References are re-resolved through the existing page-kind resolver for the current user, once per kind. Only kind, identifier and the current title (at most 2,000 characters) enter the supplementary untrusted user data. Stored titles, URLs, keys, routes, filters, selections and entry credentials are not replayed. The supplement is not written back to conversation history or promoted to a system instruction. A Native entry with a restricted credential scope receives no inferred historical references because the existing resolver accepts user identity only; ordinary current context and tool authorization stay unchanged.

Resolvers remain responsible for business authorization and their own database reads. One batched resolver invocation does not imply one SQL query: Studio currently resolves each issue through its authorized detail service. There is no extra Native history query, new table, lock, persistent idempotency, automatic resend or automatic resubmission. Runner protocol and lifecycle remain unchanged; existing Runner session memory and previously generated answers are not erased by this policy.

## UIMessage extensions and approval

Messages are `AppUIMessage` values from the SDK: render ordered text, file, tool, `data-notice` and `data-business` parts. `ChatExtensionsContext` receives the original UIMessage; `renderMessageExtra` runs once on its final source segment. `renderDataPart` can supply a card, while null preserves the built-in renderer. A null `renderNews` falls back to localized `newsText`, then the saved title. Timeline hooks retain stable business keys and their own authorized queries/subscriptions. Composer `toolbar` and `notice` remain child props. This does not restore missing Studio producers or the old ask_agent chain.

Approval buttons bind the saved message, execution and genuine tool approval ID. Denial does not execute the tool. Waiting approval and actually executing tools retain business occupancy. Advisory effect-review feedback does not permanently lock a completed conversation. Refresh rereads revisions by ID; pagination drains `nextAfter` before advancing its watermark. Independent notifications arrive by durable history polling (5 seconds running, 30 seconds idle) or business announcements after the model response has closed.

## Integrated execution behavior

Background examples observe run through get/try rather than status polling and do not appear in the chat list. HTTP policy overrides are rejected; only declared scope variables and trusted model selections are accepted. Native conversation notices committed in a business transaction become ordered UI data parts after commit, with rollback preserving atomicity.

The serving application supports one execution process at a time. Only after the old process has exited may a replacement repair its unfinished native executions at boot. Saved terminal results remain intact, missing terminal snapshots become failed UI messages, and valid approvals remain pending. CLI and repeated same-process initialization do not reclaim current work. This does not add execution replay or overlapping deployment support.
