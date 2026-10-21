# Model and execution simulation

There are three different boundaries: the model generates a reply or a tool-call request, the application executes a tool or external request, and a Runner executes a task. Simulating the first does not simulate the other two.

## Current public model adapter

A dataset's `answers` is an ordered array of `DemoAnswer` objects. Each has a stable `id`, `match(request)` and `reply(request)`. The request includes the model, system text, messages, last user prompt, offered tools, tool results, inferred language and an optional application-supplied `tag`. A reply is text, `{ text }`, or `{ toolCalls: [{ name, arguments }] }`. Only tools offered in the current request can be returned by the gateway.

Import these types through `@nocobase/app-plugin-demo-mode/server/tokens`. Define answers in the application beside its dataset. Prefer exact business tags and validated input structures for structured outputs. Match broad conversational examples after specific business operations. Preserve the consuming service's JSON schema; an apparently plausible string is not a valid business result.

For application-owned generation, call `await demoData.load()` before reading the current binding, verify `demoData.models.isDemoModel(ref)`, then call `demoData.models.complete({ system, prompt, tag })`. This refresh matters after a CLI or another process reset replaces the model key/service. HTTP callers use the generated authenticated OpenAI-compatible gateway at `/api/demoMode/models/v1`; do not expose its bearer key in a UI or Skill example.

Unmatched model requests receive an explicitly simulated fallback. No real provider is called by `DemoModels`. This guarantee is local to that service: application code that elects to invoke a different real model remains responsible for its demo scope policy.

## Registered tool and Runner adapters

Register application-specific tool and Runner adapters on `demoConfigurationToken`, and invoke them through `invokeMock(id, input)` at the actual transport/dispatch boundary. The registry does not automatically intercept actual tool execution, outbound transport or Runner dispatch. Inspect those application entry points before claiming an Agent is completely mocked. Keep their adapters behind the existing authenticated, authorized business service boundary. Resolve demo scope from trusted persisted ownership, not a client-provided boolean or a prompt claiming to be a demo.

For each boundary, record the operation identifier, input validation, applicable record scope, fixture result schema, simulated side effects and behavior when no fixture matches. Fail closed for unknown operations inside demo scope. Do not offer a “mock disabled” switch that silently enables real publishing, email, payment, repository push or arbitrary Runner work.

A simulated Runner result must visibly identify itself as simulated, preserve the application's run/task state transitions and remain outside official execution receipts or publication/effect tracking. If a Runner adapter is not implemented, report “not supported” and refuse execution rather than marking the run successful with a fabricated real execution record.

Answers for the application's own text generation must keep each consumer's contract. Pass the operation as `tag` when calling `models.complete`, answer each tag with the JSON that operation parses, and write people-facing text in the language the application asked for (for example a language note appended to its prompt). Conversational answers can call the tools the request offers, then summarize their real results; order specific answers before broad ones.

## Acceptance checks

Test text generation, structured business replies, a tool-call round trip, malformed tool input and an unmatched call. Verify no external provider or real Runner is reached, including when scope lookup fails, after process restart and after clearing a demo project while work is queued. Test ordinary non-demo calls separately to confirm the adapter did not redirect unrelated tenants. List each verified boundary; “model mock works” is insufficient evidence for “all Agent calls are mocked.”

## Application-configured Demo Agent proxy

Use `configuration.registerAgent<Input, Output>({ id, title, scope, defaultEnabled, matches, execute })` when the whole Agent execution should be replaced. `matches(input)` verifies persisted demo ownership; `execute(input)` belongs to the application and returns its normal result contract, clearly labeled as simulated. The proxy appears in the existing Runner mock configuration card and uses the same permissions and revision-safe toggle. Keep its ID stable across releases.

For an immediate execution, call `proxy.run(input, () => normalAgent(input))` at the existing authorized Agent entry point. Non-demo input uses the normal Agent; matching input uses the configured demo implementation. Scope lookup errors, disabled mocks, unsupported operations and adapter failures must never trigger a real fallback. Turning demo mode off also refuses matching demo calls.

For durable tasks, call `proxy.prepare(input)` before enqueueing, persist the proxy ID and a simulation marker in application-owned work, and use `proxy.execute(input)` after claiming work. Call `configuration.withFreshPolicy(callback)` when the worker runs so an originating request's old policy cannot hide revocation. Recheck actor/owner permissions, scope and task revisions; never enqueue an official Runner execution for a replacement. Keep your normal cancellation and duplicate-delivery protections. The proxy does not fabricate official Agent definitions or execution receipts.

A replacement that returns its result at once has no process to show. Let `execute(input)` return the result together with a scripted transcript — thinking, tool calls and their results built from the run's own material (its brief, the page it targets read through the in-process responder, the data summary, the knowledge), the submission and the usage — and play it back from the worker: wait between events, append each one to the application's run record, and stop between two events once the run is asked to stop. Return that transcript wherever the application already shows a run's events, in the same shape as an official run's, so its existing view renders it. Scale the pauses with a setting so tests can play back instantly, keep the playback short enough that the interrupted-run recovery does not mistake it for a crash, and leave transcripts out of list responses that are polled often.

Write exceptions remain separate: register only the tables and operations needed to create tasks and persist results, and require explicit UI rules. Use the same normal workflow for human review and mark any demo publication as simulated. Do not manufacture PR URLs, live deployment evidence or real effect metrics. Application Skills should inspect the input/result schemas, build useful task-specific fixtures, register the proxy at the execution boundary, and test handoff through review as well as failure and non-demo paths.
