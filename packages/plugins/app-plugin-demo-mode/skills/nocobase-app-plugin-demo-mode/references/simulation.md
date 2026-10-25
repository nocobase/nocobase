# Model and execution simulation

Read only the sections needed by the demo. Registered simulations and integrated demo chat are enabled by default and have no administration-page controls. The application opts in by connecting the relevant boundaries; unused integration methods have no effect on its flows. A simulated model does not intercept tool calls, external services or Runner execution; adapt each used boundary. Resolve the original `demoDataToken` and `demoConfigurationToken` from `@nocobase/app-plugin-demo-mode/server/tokens`.

## Simulated model

Agents 1.0 with `agents.models.services` is required only for model integration. In an application provider's `ready()`, after the plugin is ready, select `{ modelService: demoData.models.serviceName, model: 'demo-chat' }` for demo flows. `start()` runs too early. A missing binding means unavailable; never fall back to a real provider in Demo Mode. Keep the application's normal global defaults intact.

Define the dataset's ordered `answers` array using the exported `DemoAnswer` type. Each answer has `id`, `match(request)` and `reply(request)`. Requests include messages, offered tools, tool results, language and an optional application `tag`. Replies are text, `{ text }`, or `{ toolCalls: [{ name, arguments }] }`; return only offered tools. Put specific business matches before broad conversational answers and preserve each caller's output schema and requested language.

For application-owned generation, call `await demoData.load()`, verify `demoData.models.isDemoModel(ref)`, then call `demoData.models.complete({ system, prompt, tag })`. Use stable tags for structured business outputs. For HTTP, use the host's OpenAI-compatible client with the authenticated gateway at `/api/demoMode/models/v1`; its responses follow OpenAI's protocol without an additional application `{ data }` envelope. Keep its bearer key server-side.

Unmatched requests to this model receive a simulated fallback. Calls that the application sends to another provider remain its responsibility. Clear/reset preserve the model binding.

## Tool and external adapters

Register `configuration.registerMock({ id, title, kind, scope, invoke })`, then call `invokeMock(id, input)` at the authorized application boundary. Registration does not intercept or invoke anything. Registered adapters default to enabled; `defaultEnabled: false` opts out. Explicit saved overrides still apply and can be changed through the configuration service or API, including values saved before the UI controls were removed.

Adapters return the business service's expected result shape. Unknown or disabled adapters throw `DEMO_MOCK_UNAVAILABLE`; never catch this to invoke the real provider. Use the server-side Demo Mode flag for dispatch, including visitor-created records and background work.

## Replace a whole Agent

Use `configuration.registerAgent<Input, Output>({ id, title, execute })` when the application should simulate the entire Agent. Keep a stable ID and return the application's normal result contract, labeled as simulated. Registered Agent adapters default to enabled; `defaultEnabled: false` and explicit saved overrides remain supported.

For immediate execution, call `proxy.run(input, () => normalAgent(input))` after normal authorization. Demo Mode off selects the normal callback; enabled Demo Mode selects the adapter. Disabled mocks and adapter failures must refuse execution without a real fallback.

Preserve the application's normal task, cancellation and result/review workflow. Add playback only when requested. Do not present simulated results as real publications, deployments or external execution receipts. Configure [collection exceptions](policies.md#collection-write-exceptions) only for business writes that the workflow needs.

### Durable Agent dispatch

For queued work, authorize first, call `proxy.prepare()` and persist its decision with the job:

| Result  | Admission                                                                   |
| ------- | --------------------------------------------------------------------------- |
| `true`  | Save a demo marker and `proxy.id`; queue application-owned simulation work. |
| `false` | Use the ordinary queue path.                                                |
| Throws  | Refuse admission without queuing real work.                                 |

When claiming a demo job, skip it if it was cancelled. Resolve the saved proxy ID and call `configuration.withFreshPolicy(() => proxy.execute(job.input))`. Use `execute`, not `run`, so turning Demo Mode off cannot route an already queued demo job to the real callback. Unknown proxies, disabled adapters and disabled Demo Mode must fail that job.

Ordinary queued jobs must also check the current Demo Mode flag at execution before real transport or Runner dispatch. Preserve duplicate-delivery protections. Generic queued mocks likewise need `withFreshPolicy(() => configuration.invokeMock(id, input))`; an admission-time `requireMock` check alone is insufficient.

## Optional online chat

Online demo chat is enabled by default, with no UI switch. Integrate it only for a requested chat experience; the plugin does not automatically redirect standard Online Agent sessions. Call `configuration.chatModel(simulatedRef)` before admission and each model request, outside business transactions. It returns undefined outside Demo Mode and rejects an explicit disabled chat override. Use the returned model reference for the operation, retaining normal selection outside Demo Mode. Existing saved overrides remain effective; use the configuration service or API to change them when needed.

After business authorization, wrap tools with `runChatTool(id, { readOnly, run, mock })`. Without a saved override, the supplied `mock` takes precedence; otherwise a host-declared `readOnly: true` permits the local `run` callback. All other operations are refused. Only local data queries qualify as `readOnly`; network fetches need mocks. Explicit `read`, `mock` or `deny` overrides remain supported, and a missing required adapter must reject execution. Tool adaptation belongs at the server invocation boundary.

For the Agents OnlineAgent service, wrap only its public session operation with `runOnlineConversation(callback)`, keeping the service's normal session checks. This permits conversation/message persistence when chat is enabled. Do not wrap a dispatcher, tool/model call, upload or agent configuration. Keep fixture creation separate from visitor chat enablement. Applications with their own conversation persistence use their normal collection policy.

## Verify the implemented flows

Test the actual model outputs, structured results and tool/Agent paths the demo uses, including unsupported input and disabled adapters. Confirm no real provider is reached and non-demo execution still uses its normal path. For queues, also test cancellation and cleanup. For online chat, verify the tool policies the demo uses.
