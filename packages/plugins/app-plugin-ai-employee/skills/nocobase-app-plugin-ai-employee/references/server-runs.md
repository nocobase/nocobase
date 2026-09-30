# Running AI from App Server Code

Two different jobs: getting the App's own employees and tools into the runtime the plugin already created, and — much more rarely — driving an agent directly from App server code instead of through the chat UI.

## Table of contents

- [Register App resources](#register-app-resources)
- [When to drive an agent directly](#when-to-drive-an-agent-directly)
- [Public container tokens](#public-container-tokens)
- [Conversation first, then agent](#conversation-first-then-agent)
- [`AIConversationsManager`](#aiconversationsmanager)
- [`createAIEmployee()`](#createaiemployee)
- [`createAgent()`](#createagent)
- [Executing an agent](#executing-an-agent)
- [Running unattended](#running-unattended)
- [Context provider and persistence are not extension points](#context-provider-and-persistence-are-not-extension-points)
- [Security and lifecycle](#security-and-lifecycle)

## Register App resources

The App does not create an `AIManager`. The plugin already made one; the App hands it resources. Do not call `createAIManager()` for ordinary App work.

**1. Aggregate with static imports** in `server/ai/index.ts`, subclassing the public `AIResourceRegistrar`:

```ts
import { AIResourceRegistrar } from '@nocobase/app-plugin-ai-employee/server';
import type { AIEmployeeManager, ToolsManager } from '@nocobase/ai-employee';
import orderDesk from './employees/order-desk/index.js';
import createOrder from './tools/create-order.js';

export default class AppAIResources extends AIResourceRegistrar {
  protected override async registerAIEmployees(
    manager: AIEmployeeManager,
  ): Promise<void> {
    await manager.registerEmployee(orderDesk);
  }

  protected override async registerTools(manager: ToolsManager): Promise<void> {
    await manager.registerTools(createOrder);
  }
}
```

**2. Call it from an App `ServiceProvider.boot()`**, resolving the original `aiManagerToken`:

```ts
import type { Application } from '@nocobase/app-server/application';
import { aiManagerToken } from '@nocobase/app-plugin-ai-employee/server';
import { ServiceProvider } from '@nocobase/service-provider';
import AppAIResources from '../ai/index.js';

export default class AIResourcesProvider extends ServiceProvider<Application> {
  public readonly name = 'app/ai-resources';

  public override async boot(): Promise<void> {
    const ai = this.app.container.resolve(aiManagerToken);
    await new AppAIResources({ source: 'application' }).registerAIResources(ai);
  }
}
```

**3. Add it to `serviceProviders` in `server/providers/index.ts`**, after the AI Employee plugin's own provider has booted. The App runtime drives `register → boot → start → ready → shutdown`; never register at module top level.

Notes that decide whether this works:

- Import `aiManagerToken` from the package export. `createServiceToken` keys the container by object identity, so recreating a token with the same name yields a different key that resolves nothing.
- `registerAIResources()` runs tools, then skills, then employees. Do not reason from that order: names are resolved when the agent runs, not when it registers, so the App's employees can name the plugin's built-ins even though the plugin's own Provider booted first. What the order does buy is that one registrar's own resources are in place before its employees are read.
- The App root's `ai/skills` is already a default Skill directory; do not add it again. Add further directories through `config.yml` `ai.skills.paths`, not through the registrar's constructor.
- `AIResourceRegistrarOptions` accepts `logger`, `source`, and `skillsDirectories`. Only `logger` and `source` are worth setting from an App: Skill paths belong in `config.yml`. A registrar registers no MCP servers; they are defined only in `config.yml`.
- Two tools registered under one name is a decision, not an accident. Make it explicit rather than relying on registration order.
- A definition computed from another service still goes through the registrar, whose methods run in this `boot()`. Only a tool set that depends on who is asking, and a custom LLM provider, use the managers on `ai` directly; see [runtime-extensions.md](runtime-extensions.md).

## When to drive an agent directly

The normal path covers almost everything:

```text
App ai/ resources + client/extensions/nocobase-ai
        ↓  @nocobase/app-plugin-ai-employee
   /api/ai, persisted conversations, SSE, tool approval
```

Reach for `AgentServiceFactory` only for an App-owned server integration that must invoke an agent with no browser present — a workflow adapter, a scheduled job, an App-owned API route, a server service. The caller must already have a clear actor, an authorization policy, and a lifecycle for the work. Confirm the existing `/api/ai` behavior is genuinely insufficient before proposing this.

## Public container tokens

```ts
import {
  aiConversationsManagerToken,
  agentServiceFactoryToken,
} from '@nocobase/app-plugin-ai-employee/server';

const conversations = container.resolve(aiConversationsManagerToken);
const factory = container.resolve(agentServiceFactoryToken);
```

These two and `aiManagerToken` are what an App runs agents through. The same entry also exports `AIResourceRegistrar`, `aiConversationsManagerToken` and its `CreateAIConversationParams` and `CreatedAIConversation` types, the config types and helpers, the `AgentRequest`, `AgentInvokeRequest`, `AgentInvokeResult`, `AgentInvokeInterrupt`, `AgentInterruptAction`, `AgentStreamEvent`, and `AgentServiceErrorCode` types, and the `AgentServiceError` class. The plugin's internal factories — its repository, manager, service, and data-service tokens — are not exported and are not part of the contract; an App tool declares the App's own service tokens instead. Never deep-import a plugin server or agent source file.

`AgentServiceFactory` is an App-level singleton, but every `createAIEmployee()` or `createAgent()` call produces a new session-scoped `AgentService` with its own private context and conversation objects. Do not cache an `AgentService` globally or register one as a singleton.

## Conversation first, then agent

```ts
const conversation = await conversations.create({
  userId: actor.id,
  aiEmployee: { username: 'order-desk' },
  title: 'Order enquiry',
});

const agent = await factory.createAIEmployee({
  username: 'order-desk',
  state: { sessionId: conversation.sessionId },
  actor,
  runtime: { logger },
});

const { message } = await agent.invoke({
  userMessages: [{ role: 'user', content: 'How many orders are still open?' }],
});
```

`sessionId` is the identity shared by the conversation, message persistence, stream cache, tool state, abort handling, usage events, and checkpoints, so it has to exist before the agent does. Treat it as an opaque string: never coerce it to a number, expose it without authorization, or reuse it across users.

## `AIConversationsManager`

```ts
type CreateAIConversationParams = {
  userId?: string | number;
  aiEmployee?: { username: string };     // omit for a model-only createAgent() session
  title?: string;
  options?: CreateAIConversationParams['options']; // systemMessage, skillSettings,
                                         // conversationSettings, modelSettings, frontendTools
  from?: 'main-agent' | 'sub-agent';
  scope?: string;
  transaction?: DatabaseConnection;      // only when the caller already owns one
};

create(options: CreateAIConversationParams): Promise<CreatedAIConversation>; // the row, with its sessionId
update(options: { userId; sessionId; title?; options? }): Promise<AIConversationEntity | null>;
getConversation(options: { sessionId; userId? }): Promise<AIConversationEntity | null>;
getMessages(options: { userId; sessionId; cursor?; paginate?; updateRead? }):
  Promise<{ rows: any[]; hasMore?: boolean; cursor?: string | null }>; // rows shaped as below
```

`userId` is the owning application user — never a user id a model supplied. Always pass `userId` when reading or mutating a user-owned conversation; a missing or mismatched owner is not a successful lookup.

`getMessages` returns parsed history rows, not raw persistence records and not the Registry's already-normalized `AIChatMessage[]`. A row exposes `key` and a nested `content.messageId`; there is no top-level `messageId` or `sessionId`. Pagination matches HTTP: newest-first, 10 per page by default, `{ rows }` with a 200-row cap for `paginate=false`, tool rows joined into `content.tool_calls`, and `updateRead=true` marking the conversation read. Keep ids as strings, take the session id from the authorized conversation rather than from a row, and read [api-reference.md § History message schema](api-reference.md#history-message-schema) before adapting history into a new request.

## `createAIEmployee()`

```ts
interface CreateEmployeeOptions {
  readonly username: string;
  readonly state: AgentState; // its sessionId is the conversation the agent runs in
  readonly actor: Actor; // required; there is no implicit root
  readonly runtime: AgentRuntime; // required; logger, and optionally translate and the caller's headers
  readonly from?: 'main-agent' | 'sub-agent';
  readonly systemPrompt?: string;
  readonly skillSettings?: AIEmployeeSkillSettings;
}
```

- `username` must identify an accessible employee. Do not copy a built-in definition into the App to reach one.
- `state` is what the execution _is_, built where the request is parsed rather than assembled field by field at the call site. It becomes the agent context every backend tool receives. Its `frontendTools` is a serializable manifest of available browser tools — never callbacks, DOM nodes, or functions.
- `actor` comes from the authenticated request or a trusted server job context, never from request JSON. Its `locale` is the language the run uses. There is no implicit root: neither factory fills a missing actor in.
- `systemPrompt` and `skillSettings` are the conversation's own configuration. They narrow or extend the employee's capabilities without bypassing permission checks.
- The model is the employee's, not the caller's. The factory resolves `state.model` against the employee's policy once, when the agent is created — honouring a requested model only when the employee's configuration allows it, and resolving the employee's own when the state names none. An employee with its own models replaces a model it does not allow with the first of them that is enabled; an employee without model settings runs the requested model as given, unchecked, so a disabled or unknown one fails when the run starts.

**The tool context is fixed here.** `AgentServiceFactory` builds it once from `actor`, `state`, and `runtime`, and the service supplies the same one on every execution. A caller never passes it, and an `agentContext` key on `AgentRequest.runtime` is ignored — so request data cannot substitute another actor, session, or set of dependencies. A tool that needs the session id or the resolved model reads `ctx.state`, which is why an integration that activates tools must supply a real `state` rather than an empty one.

## `createAgent()`

For an execution with no AI Employee behind it — a fixed prompt, a fixed model, a named set of tools:

```ts
interface CreateAgentOptions {
  readonly sessionId: string; // required
  readonly actor: Actor; // required
  readonly runtime: AgentRuntime; // required
  readonly model?: ModelRef;
  readonly systemPrompt?: string;
  readonly tools?: readonly string[];
  readonly skills?: readonly string[];
  readonly persistence?: ConversationPersistence; // not exported; see below
  readonly checkpointer?: BaseCheckpointSaver; // where a paused run is kept; see below
}
```

All three of `sessionId`, `actor`, and `runtime` are required: a fixed agent has nowhere to persist without a session, and there is no implicit root. `model` is fixed at creation and a request cannot override it; if none is supplied, the factory takes the first enabled model when the agent is created, and rejects there if there is none. `tools` names registered tools to activate. `skills` activates the tools those Skills name and gives the agent `getSkill`, bound to exactly those Skills, with the Skills listed in its system prompt — so the model loads a Skill's procedure when a request matches it, as an employee's does. `getSkill` loads nothing outside that list, so a Skill that tells the model to load another works only when both are listed: give `data-query` together with `data-metadata`. A name that matches no registered Skill is dropped without an error — the agent is created, and that Skill is simply absent from its prompt — so check each name against the Skills in AI settings. A Skill's tools are active from the start rather than after it is loaded. A fixed agent has no employee presets, so each tool's own `defaultPermission` decides: `ALLOW` runs without asking, and `ASK` — which is also what a tool declaring nothing gets — pauses the run exactly as it does for an employee, reported as `interrupt` from `invoke()` and continued with `resumeInvoke()`. `autoCall` does not exist here. `messages` is not a creation option — the turn's messages go to `invoke()` or `stream()`.

A pause is kept by a checkpointer. By default it is the plugin's own tables, so a newly created agent for the same `sessionId` resumes the run; beside a `persistence` the caller supplies, it is the process instead, and only the same `AgentService` can resume. `checkpointer` overrides the default, for instance to keep a short-lived job's pauses out of the database. Take it from the factory — `factory.getMemorySaver()` for this process only, `factory.getDatabaseCheckpointSaver()` for the plugin's tables — rather than constructing one yourself: the option is typed against the plugin's own `@langchain/langgraph`, and a saver built from another copy may not fit it. A saver of your own, such as one backed by another store, extends `BaseCheckpointSaver` from that same package. `createAIEmployee()` takes no checkpointer: an employee's pauses are always kept in the plugin's tables, because a tool decision or a resume from the chat rebuilds the agent and reads them there, and a sub-agent keeps none, since its pause belongs to the agent that called it.

## Executing an agent

```ts
interface AgentRequest {
  messageId?: string;                  // the message this operation forks from
  userMessages?: AIMessageInput[];
  userDecisions?: { interruptId?: string; decisions: UserDecision[] };
  runtime?: Record<string, unknown>;   // per-call middleware channel, e.g. appendMessages
  writer?: (chunk: unknown) => void;
  signal?: AbortSignal;
}

interface AgentInvokeRequest<T = never> extends AgentRequest { responseFormat?: ZodType<T>; }
interface AgentInvokeInterrupt { id: string; actions: AgentInterruptAction[]; }
interface AgentInvokeResult<T = never> { message: AIMessageInput | null; structuredResponse?: T; interrupt?: AgentInvokeInterrupt; }

invoke<T>(request?: AgentInvokeRequest<T>): Promise<AgentInvokeResult<T>>;
stream(request?: AgentRequest): AsyncGenerator<AgentStreamEvent>;
resumeInvoke<T>(request: AgentInvokeRequest<T>): Promise<AgentInvokeResult<T>>;
resumeStream(request: AgentRequest): AsyncGenerator<AgentStreamEvent>;
forkInvoke<T>(request: AgentInvokeRequest<T>): Promise<AgentInvokeResult<T>>;
forkStream(request: AgentRequest): AsyncGenerator<AgentStreamEvent>;
cancelToolCall(): Promise<AIMessageInput[] | undefined>;
abort(reason?: unknown): void;
```

`AIMessageInput` is `{ role, content, createdAt?, toolCalls?, attachments?, workContext?, metadata? }`; `messageId` and `sessionId` are server-assigned, so omit them.

`invoke()` reports the assistant turn it produced as `message`, in this package's own message shape rather than the underlying graph state. `message` is `null` when the execution produced no assistant content. A turn that paused for a human decision resolves rather than rejects, with `interrupt` set: its `id` is what a resume passes as `interruptId`, `actions` lists the paused tool calls in decision order, and `message` is the assistant turn that requested them rather than a finished answer. Before `invoke()` returns, those tool calls are already recorded as `interrupted` on the conversation, so a decision can be attached to each of them through the HTTP API as well. `interrupt` is absent when the execution finished, so check it before treating `message` as the answer. Only an agent nested inside another agent's tool, such as a sub-agent, rejects with a `GraphInterrupt` instead, for the enclosing agent to record.

When the integration needs data rather than prose, supply a Zod `responseFormat` and read `structuredResponse`:

```ts
const { structuredResponse } = await agent.invoke({
  userMessages: [{ role: 'user', content: 'Summarize this month of orders.' }],
  responseFormat: z.object({
    total: z.number(),
    openCount: z.number(),
  }),
});
```

Read the value from `structuredResponse`, never by parsing `message.content`. How the schema is satisfied depends on the model — one with native JSON-schema output answers with the JSON as content, one without is handed the schema as a tool and the final assistant message is that tool call with empty content. `structuredResponse` holds the parsed value either way. `stream()` takes no `responseFormat`; it reports the answer as content events and has nowhere to put a structured value.

Use `messageId` when forking from a persisted message, `userDecisions` only to resume an interrupt, and `signal` for cancellation from HTTP, a workflow, or a job. Consume `stream()` with `for await`, and do not hand-parse or persist stream events when the surrounding App service already owns that transport.

Do not infer HTTP behavior from this return value: `sendMessages` with `stream: false` currently invokes internally but still responds over SSE without serializing the result. For external callers use the [HTTP walkthrough](api-reference.md#http-conversation-walkthrough); for an App-owned integration that genuinely needs the direct result, use this API.

## Running unattended

An agent driven from a job, a schedule, a workflow node, or any other caller with nobody watching differs from a chat in four ways. What the surrounding system is — how it schedules, where it writes its result — is its own concern and not this plugin's; what follows is only what this plugin requires of it.

**Use `invoke()`, not `stream()`.** `stream()` is an async generator: the run advances only while something consumes it, so an unattended caller that forgets to drain it stalls holding an open conversation. `invoke()` runs the loop to completion and returns the result. Use `responseFormat` when the caller needs data rather than prose — it is simpler and more reliable than instructing the model to put its answer somewhere.

**Pass an `AbortSignal` and own the cancellation.** `AgentRequest.signal` is merged with the service's own controller, so either can stop the run. Give it the signal the surrounding system already cancels with — a job timeout, a shutdown hook, a user cancelling upstream — rather than inventing a second timer. There is no built-in wall-clock limit; the only automatic stop is a graph recursion limit of 200 steps, which surfaces as its own error code. On abort the run rejects with `code: 'ABORTED'`, and only the assistant turn in progress at that moment is dropped. Everything before it stays: the user message is saved when the run starts, each earlier step's assistant message and tool results are saved as the run goes, and a tool that already ran has already had its effect. So before retrying, read the conversation to see how far the run got, and rely on the tools being safe to call twice rather than on the run having left nothing behind. A tool that was still running when the signal fired is recorded with `status: 'error'` and the abort reason as its content, but it may have finished its work anyway: its side effect can have happened even though the record says it failed, so judge progress from the business data the tool writes, not from that status alone.

**Run as a real, authorized user.** A job has no signed-in user, but the agent still needs one. A conversation's `userId` references a user row, so an invented id fails at `conversations.create`; and the data tools authorize the actor's id through the authorization service, never through `isRoot`, so an actor with no grants reads an empty catalog rather than an error. Create a dedicated service account for the job, grant it exactly what the job reads and writes, and pass that user as `actor`, with `roles` set to that account's real role names and `isRoot: false`.

**Say which day it is.** A job that works by date — yesterday's orders, this month's total — passes `state.timezone`, an IANA name such as `Asia/Shanghai`. The current date in the employee's system prompt and the data tools' date handling both use it; without it they follow the server's own time zone, which a deployment often sets to UTC.

**Decide what an interrupt means before it happens.** A tool that is not allowed to run on its own suspends the run to ask a person, and in an unattended run there is nobody to ask. `invoke()` then resolves with `interrupt` set and the paused tool calls recorded, and the run stays suspended until someone resumes it. So the reliable arrangement is not to interrupt at all, which means knowing every tool the run can reach:

- **`createAgent()`** reaches only the tools it names, the ones its Skills name, and `getSkill` when it has Skills — list a chain of Skills in full, since `getSkill` loads only the ones given. Name only tools declaring `defaultPermission: 'ALLOW'` that run on the server: a tool with `execution: 'frontend'` pauses whatever its permission says, because only a browser can run it.
- **`createAIEmployee()`** also reaches every `GENERAL` tool, and several of those pause: `suggestions` asks, `formFiller` runs in a browser, which an unattended run does not have, and so does any other `GENERAL` tool that does not declare `ALLOW` — including every tool of a configured MCP server whose name does not start with `get`, since MCP tools register as `GENERAL` (see [capabilities.md § MCP servers](capabilities.md#mcp-servers-configyml)). A model commonly ends a turn by offering suggestions, so an employee run that does not exclude them stops there. Exclude them by naming the session's tools in `skillSettings`, as an allowlist:

```ts
// Every tool this run may use, including the ones a Skill activates.
// data-query has the model load data-metadata first, so both are listed.
const skillSettings = {
  toolsVersion: 1,
  tools: [
    'getSkill',
    'getDataSources',
    'getCollectionNames',
    'getCollectionMetadata',
    'searchFieldMetadata',
    'dataSourceQuery',
    'dataSourceCounting',
    'dataQuery',
  ],
  skillsVersion: 1,
  skills: ['data-query', 'data-metadata'],
};

const conversation = await conversations.create({
  userId: actor.id,
  aiEmployee: { username: 'order-desk' },
  title: 'Nightly order summary',
  options: { skillSettings },
});

const agent = await factory.createAIEmployee({
  username: 'order-desk',
  state: { sessionId: conversation.sessionId, timezone: 'Asia/Shanghai' },
  actor,
  runtime: { logger },
  skillSettings,
});
```

Give the conversation the same `skillSettings` as the agent. The agent's copy governs this run; every later run over HTTP — a tool decision, a resume or a retry from the chat — rebuilds the agent from the conversation's copy, so a conversation without one is resumed with the employee's full tool set.

The list narrows what the employee already allows; it never adds a tool the employee does not have. It covers tools a Skill activates as well as base tools, so a Skill's tools have to be on it too — and when one Skill tells the model to load another, as `data-query` does with `data-metadata`, the whole chain's tools, or the model gets `Tool unavailable.` partway and the run ends in a guessed answer rather than an error. Two groups pass it regardless: the system tools — `getSkill`, `subAgentWebSearch`, `knowledge-base-retrieve` and `aiEmployeeWorkflowTaskOutput` — each still subject to its own switch, and `loadFrontendTool` and `executeFrontendTool`, which appear only when the session carries a frontend tool manifest and then always pause; a server-side run should not pass one. `toolsVersion` matters only for an empty list: with it, `tools: []` leaves only the system tools; without it, an empty list means no filter at all. `skills` with `skillsVersion` narrows the Skills the same way — only the named Skills are offered to `getSkill` and listed in the prompt, and with `skillsVersion` an empty list offers none — so a run that should follow one procedure is not offered the others.

If a tool that asks is genuinely required, the caller is deciding on the user's behalf and should say so — resume with an explicit decision per action rather than a blanket approval, and make only a decision the action allows:

```ts
let result = await agent.invoke({ userMessages });
// A resumed run can pause again on the next tool it reaches, so bound the rounds.
for (let round = 0; result.interrupt; round++) {
  if (round >= 5) {
    throw new Error(
      `Still paused after ${round} decisions: ${conversation.sessionId}`,
    );
  }
  const { id, actions } = result.interrupt;
  result = await agent.resumeInvoke({
    userDecisions: {
      interruptId: id,
      // One decision per action, in `actions` order.
      decisions: actions.map((action) =>
        action.toolCall?.name === 'draft-reply' &&
        action.allowedDecisions?.includes('approve')
          ? { type: 'approve' }
          : { type: 'reject', message: 'Not allowed in an unattended run' },
      ), // 'edit' with editedAction is the third choice
    },
  });
}
```

A model that keeps calling a tool the loop rejects would otherwise loop for as long as it keeps trying; past the bound the run stays paused, with its calls recorded, for someone to look at. Approving whatever is pending, unconditionally, turns every `ASK` into an `ALLOW` without the tool or the employee saying so. If that is the intent, make it the tool's declared permission instead, where it is visible.

An action identifies its tool call — `toolCall.id` and `toolCall.name` — but does not carry the arguments. A caller that decides on what the tool was about to do, rather than on which tool it is, reads the arguments from `message.toolCalls` on the same result and joins them on `id`: `message` is the assistant turn that requested the paused calls.

A run that is neither resumed nor revisited stays paused, with its calls recorded as `interrupted`. Do not send a new turn into that conversation as it stands: `invoke()` does not clear pending calls. `agent.cancelToolCall()` does — it closes them as ignored by the user and returns the tool messages that close them — but the chat route also puts the closed turn ahead of the next message, which is not part of the public API. For an unattended run, start a new conversation instead, or resume the one that paused.

**Give the run a way out, if it needs one.** Anything the agent should do _during_ the run — report progress, notify a channel, hand a partial result onward — is an ordinary backend tool: register it in code, declare what it needs on `dependencies`, and activate it by name for this agent. The model calls it like any other tool. This is for effects that must happen while the run is going; when all the caller wants is the answer at the end, `responseFormat` already delivers it and a tool adds a failure mode for nothing.

### Failures a caller has to tell apart

`AgentServiceError` carries a typed code, and an unattended caller needs it because retrying is its decision to make. Import it from the public entry and check it by class:

```ts
import { AgentServiceError } from '@nocobase/app-plugin-ai-employee/server';

try {
  // Creation resolves the model, so it is inside the try as well.
  const agent = await factory.createAIEmployee({
    username,
    state,
    actor,
    runtime,
  });
  await agent.invoke({ userMessages });
} catch (error) {
  if (!(error instanceof AgentServiceError)) throw error;
  logger.warn(
    { code: error.code, cause: error.rootMessage },
    'agent run failed',
  );
  if (error.retryable) scheduleRetry();
}
```

Where a model problem surfaces depends on the factory method. `createAgent()` resolves its model and LLM service completely when the agent is created, so a missing or unusable model rejects there with `CONFIGURATION_ERROR`, before `invoke()` is reached. `createAIEmployee()` rejects at creation with `CONFIGURATION_ERROR` only when no model is usable at all: the employee's own model settings are on but name no model, or name models none of which is enabled, or the employee has no model settings and no service has an enabled model. A model that resolves but points at a service that cannot run — its provider no longer registered, say — fails when `invoke()` or `stream()` runs, with the same code. So handle `CONFIGURATION_ERROR` from both creation and the run. An unknown employee `username` rejects at creation with a plain `Error`, since it is a mistake in the caller rather than a state to retry.

`retryable` says whether an immediate second attempt could plausibly differ:

| Code                    | What happened                                     | `retryable` |
| ----------------------- | ------------------------------------------------- | ----------- |
| `GRAPH_RECURSION_ERROR` | The 200-step limit was reached                    | `true`      |
| `EMPTY_RESPONSE`        | `stream()` produced nothing at all                | `true`      |
| `CONFIGURATION_ERROR`   | No usable model, LLM service, or provider         | `false`     |
| `PROVIDER_ERROR`        | Anything else that failed, including the provider | `false`     |
| `ABORTED`               | The signal fired; `aborted` is also set           | `false`     |

The two retryable ones are retryable because a model is not deterministic: another attempt may take fewer steps or actually answer. `EMPTY_RESPONSE` comes only from `stream()`; the same outcome from `invoke()` resolves with `message: null` instead of rejecting, so check for it. `CONFIGURATION_ERROR` fails the same way until someone changes the configuration. `PROVIDER_ERROR` is the catch-all — a provider outage, a rate limit, a network failure, and also a tool dependency the container cannot resolve — and `false` means only that an immediate retry is not worth it, because the provider client has already retried transient failures itself. A retry the caller schedules minutes later, with backoff, can still succeed; read `rootMessage` to tell an outage from a mistake before deciding.

`AgentServiceErrorCode` also declares `MODEL_RESPONSE_ERROR` and `PERSISTENCE_ERROR`, which the agent path never raises. Handle them if switching exhaustively; do not wait for them. Over HTTP, the chat actions answer `200` with an SSE body whatever the run does, and a failed run arrives as an `error` event carrying the same `code`; see [api-reference.md § SSE](api-reference.md#sse).

Read `rootMessage` rather than walking `cause`: it returns the deepest message in the chain, guarding against cycles, and it is the one worth logging — the wrapper's own message is usually the least specific thing available.

A paused run is none of these either: `invoke()` resolves with `interrupt` set rather than rejecting. Only a nested agent rejects with a `GraphInterrupt`, which is not an `AgentServiceError` and has no code — match the error `name` if calling one directly.

## Context provider and persistence are not extension points

`AgentContextProvider` and `ConversationPersistence` are how this plugin assembles an agent, not surfaces an App implements. Neither factory method accepts a context provider, and although `createAgent()` takes a `persistence`, its type and the repository types it is built from are not exported from `@nocobase/app-plugin-ai-employee/server`. Do not implement either in an App or reach for them by deep import. If an integration genuinely needs different storage or context, that is a missing public surface — say so and stop, rather than rebuilding one from private files.

## Security and lifecycle

- Resolve both tokens from the App container. Do not construct a competing manager.
- Authorize the user id, the employee username, the session id, tool activation, and conversation access — separately from whatever the prompt says.
- Create the conversation before the session-bound agent.
- Keep every context value and tool result serializable.
- Pass an `AbortSignal` from the surrounding HTTP, workflow, or job cancellation, and call `abort()` only on a service this code owns.
- Never expose `AgentService` to untrusted request input without an App-owned route policy. It is a server API and is deliberately not a browser one.
- If conversation creation succeeds and agent creation then fails, do not retry blindly: record the session id, inspect the conversation state, and use an App-owned cleanup or archive path if the product needs one.
- Dispose App-owned resources when the App service or job lifecycle ends.
- Test the whole chain — conversation creation, agent creation, invoke and stream, persistence, errors, abort, resume — separately from ordinary UI checks.
