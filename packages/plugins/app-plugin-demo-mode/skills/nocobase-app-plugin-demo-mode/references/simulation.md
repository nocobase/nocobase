# Model and execution simulation

There are three different boundaries: the model generates a reply or a tool-call request, the application executes a tool or external request, and a Runner executes a task. Simulating the first does not simulate the other two.

## Current public model adapter

A dataset's `answers` is an ordered array of `DemoAnswer` objects. Each has a stable `id`, `match(request)` and `reply(request)`. The request includes the model, system text, messages, last user prompt, offered tools, tool results, inferred language and an optional application-supplied `tag`. A reply is text, `{ text }`, or `{ toolCalls: [{ name, arguments }] }`. Only tools offered in the current request can be returned by the gateway.

Import these types through `@nocobase/app-plugin-demo-mode/server/tokens`. Define answers in the application beside its dataset. Prefer exact business tags and validated input structures for structured outputs. Match broad conversational examples after specific business operations. Preserve the consuming service's JSON schema; an apparently plausible string is not a valid business result.

For application-owned generation, call `await demoData.load()` before reading the current binding, verify `demoData.models.isDemoModel(ref)`, then call `demoData.models.complete({ system, prompt, tag })`. The model binding is environment infrastructure and survives data clear/reset. HTTP callers use the generated authenticated OpenAI-compatible gateway at `/api/demoMode/models/v1`; do not expose its bearer key in a UI or Skill example.

The gateway follows the OpenAI response protocol: `GET /models` returns `{ object: 'list', data: [...] }`, and `POST /chat/completions` returns a raw chat completion. Neither has an additional application `{ data }` envelope. A request with `stream: true` receives `text/event-stream` containing completion chunks and a final `data: [DONE]` event. Use the host's OpenAI-compatible client; do not unwrap these responses like the plugin's management APIs.

Unmatched model requests receive an explicitly simulated fallback. No real provider is called by `DemoModels`. This guarantee is local to that service: application code that elects to invoke a different real model remains responsible for its demo scope policy.

## Registered tool and Runner adapters

Register application-specific tool and Runner adapters on `demoConfigurationToken`, and invoke them through `invokeMock(id, input)` at the actual transport/dispatch boundary. The registry does not automatically intercept actual tool execution, outbound transport or Runner dispatch. Inspect those application entry points before claiming an Agent is completely mocked. Keep their adapters behind the existing authenticated, authorized business service boundary. Select simulation from the server environment mode, not a client flag or the presence of an imported-record marker.

For each boundary, record the operation identifier, input validation, applicable record scope, fixture result schema, simulated side effects and behavior when no fixture matches. Fail closed for unknown operations inside demo scope. Do not offer a “mock disabled” switch that silently enables real publishing, email, payment, repository push or arbitrary Runner work.

A simulated Runner result must visibly identify itself as simulated, preserve the application's run/task state transitions and remain outside official execution receipts or publication/effect tracking. If a Runner adapter is not implemented, report “not supported” and refuse execution rather than marking the run successful with a fabricated real execution record.

Answers for the application's own text generation must keep each consumer's contract. Pass the operation as `tag` when calling `models.complete`, answer each tag with the JSON that operation parses, and write people-facing text in the language the application asked for (for example a language note appended to its prompt). Conversational answers can call the tools the request offers, then summarize their real results; order specific answers before broad ones.

## Acceptance checks

Test text generation, structured business replies, a tool-call round trip, malformed tool input and an unmatched call. Verify no external provider or real Runner is reached, including when scope lookup fails, after process restart and after clearing a demo project while work is queued. Test mode `off` separately to confirm the application still uses its normal Agent outside demo deployments. List each verified boundary; “model mock works” is insufficient evidence for “all Agent calls are mocked.”

## Application-configured Demo Agent proxy

Use `configuration.registerAgent<Input, Output>({ id, title, defaultEnabled, execute })` when the whole Agent execution should be replaced. `execute(input)` belongs to the application and returns its normal result contract, clearly labeled as simulated. The proxy appears in the existing Runner mock configuration card and uses the same permissions and revision-safe toggle. Keep its ID stable across releases.

For an immediate execution, call `proxy.run(input, () => normalAgent(input))` at the existing authorized Agent entry point. Mode `off` uses the normal Agent; every input in an enabled demo environment uses the configured demo implementation. Disabled mocks, unsupported operations and adapter failures must never trigger a real fallback. A queued demo run still calls `execute` directly and is refused if demo mode is subsequently off.

For durable tasks, call `proxy.prepare()` before enqueueing, persist the proxy ID and a simulation marker in application-owned work, and use `proxy.execute(input)` after claiming work. Call `configuration.withFreshPolicy(callback)` when the worker runs so an originating request's old policy cannot hide revocation. Recheck actor/owner permissions, scope and task revisions; never enqueue an official Runner execution for a replacement. Keep your normal cancellation and duplicate-delivery protections. The proxy does not fabricate official Agent definitions or execution receipts.

If the requested demo needs visible execution progress, provide a short playback; an immediate simulated response is sufficient otherwise. For playback, let `execute(input)` return the result together with a scripted transcript — thinking, tool calls and their results built from the run's own material (its brief, the page it targets read through the in-process responder, the data summary, the knowledge), the submission and the usage — and play it back from the worker: wait between events, append each one to the application's run record, and stop between two events once the run is asked to stop. Return that transcript wherever the application already shows a run's events, in the same shape as an official run's, so its existing view renders it. Scale the pauses with a setting so tests can play back instantly, keep the playback short enough that the interrupted-run recovery does not mistake it for a crash, and leave transcripts out of list responses that are polled often.

Write exceptions remain separate: register only the tables and operations needed to create tasks and persist results, and require explicit UI rules. Use the same normal workflow for human review and mark any demo publication as simulated. Do not manufacture PR URLs, live deployment evidence or real effect metrics. Application Skills should inspect the input/result schemas, build useful task-specific fixtures, register the proxy at the execution boundary, and test handoff through review as well as failure and non-demo paths.

### Model services

The plugin supports Agents 1.0 only and provisions the model through `agents.models.services`; it owns the durable model binding and its key. It does not override an existing global chat default. In an application provider's `ready()` after the plugin is ready, read `demoData.models.serviceName` and construct `{ modelService: serviceName, model: 'demo-chat' }` for the application's demo AI flows. `start()` runs earlier. Treat a missing binding as unavailable; do not fall through to a real provider in demo mode. With no existing default, Agents may select the first enabled model through its own normal policy.

Keep this selection scoped to the current demo environment. Do not call `setDefaultChat` or overwrite an Agent's ordinary persisted selection merely to demonstrate it. For online chat, pass the simulated reference to `chatModel` as described below. For other flows, pass it through their public per-operation model option, or use `models.complete` for application-owned generation. When mode is `off`, use the application's normal selection. Startup in off mode disables the plugin-owned model service; enabling Demo Mode again reuses the same service and credential. Clear/reset leave it enabled. An installed Agents host without model services fails startup with an actionable error.

## Online chat without changing Agents

Use the plugin's `chat` configuration for native online conversations. Call `chatModel(simulatedRef)` before admitting work and before model I/O; it returns undefined outside demo mode, rejects disabled demo chat, and otherwise returns the configured model or simulated fallback. Read this policy before entering a business transaction to avoid nested-connection deadlocks. The host verifies model availability through its normal model service. Do not reuse a cached configuration for subsequent turns.

Wrap each business tool with `runChatTool(id, { readOnly, run, mock })` after authorization. Administrators select `read`, `mock`, or `deny` per tool. Only mark local data queries `readOnly`; even a webpage fetch needs a mock adapter. No matching rule or missing mock means rejection. Keep normal conversation ownership and explicit scoped persistence rules; this policy intentionally does not bypass the SQL guard or modify Agents. Declare each served tool to the administration page through its `chatTools` option; the page explains the token cost of a real model.

### Online conversation persistence

Applications chatting through the Agents OnlineAgent service call `runOnlineConversation(callback)` around the public session operation only (create, send, abort, finalize, configure, rename, mark read), after checking ownership and the agent scope. Chat must be enabled. This grants scoped conversation and message writes, inherited by the session's continuation; it never opens global table rules. Do not put an HTTP dispatcher, tool, model call, upload or agent configuration inside it. Refuse other agents, runner conversations, attachments, approvals and configuration overrides. Keep fixture creation outside the HTTP boundary, independent of the visitor chat switch. The host still enforces tool permissions at execution.
