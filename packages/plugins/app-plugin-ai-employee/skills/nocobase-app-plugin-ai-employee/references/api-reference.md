# Exact AI Employee HTTP and AI Service Contracts

Read this only when the App must call the AI employee routes directly. The installed `nocobaseAIService` and chat transport already cover employee and model discovery, conversation lifecycle and history, file upload, SSE send/resend/resume, tool decisions, frontend-tool results, and reconnect recovery — so a handwritten request is warranted only for an operation the service does not expose, and belongs in one centralized App adapter rather than in a page component.

When you do write one, preserve current-user scope, abort signals, SSE framing, approval and resume, and error handling. The plugin owns two prefixes: the employees themselves are under `/api/aiEmployees`, and every other AI resource — conversations, files, models, LLM services, MCP servers, skills, tools and usage — under `/api/aiEmployee`. Paths below are written in full, with `{name}` marking a path parameter; encode every parameter as one URL segment (`encodeURIComponent`).

Every JSON success is `{ data }`, and a list is `{ data: [...], meta }`: a paged list reports its paging in `meta`, and a list read whole — the roster, templates, employees, Skills, tools, models, LLM providers and services, provider models, MCP servers, and a user's own conversations — reports `meta: { total }`. Times in query parameters and in answers are RFC 3339 strings. A JSON body is limited to 1 MiB, and a run body (`send`, `resend`, `resumeToolCall`) to 5 MiB; a larger one answers 413 `BODY_TOO_LARGE`. Every failure is the standard error body described in [Errors and security](#errors-and-security); branch on its `reason`, never on `message`.

## Table of contents

- [Model reference](#model-reference)
- [AIService](#aiservice)
- [Employees and models](#employees-and-models)
- [Conversation lifecycle](#conversation-lifecycle)
- [HTTP conversation walkthrough](#http-conversation-walkthrough)
- [Message streaming](#message-streaming)
- [Tool decisions and resume](#tool-decisions-and-resume)
- [Files](#files)
- [Management resources](#management-resources)
- [SSE](#sse)
- [Errors and security](#errors-and-security)

## Model reference

Every server execution model reference is:

```ts
type ModelRef = {
  llmService: string; // LLM service name from config.yml/settings
  model: string; // provider model id
};
```

Do not send the frontend display label. The frontend `AIModel.value` maps to `ModelRef.model`; `AIModel.llmService` maps to `ModelRef.llmService`. A request body carrying a model must carry both fields and nothing else, or it is refused with 400.

## AIService

```ts
interface AIService {
  listEmployees(): Promise<AIEmployee[]>;
  listModels(): Promise<AIModel[]>;
  updateEmployeeUserPrompt(username: string, prompt: string): Promise<void>;
  listConversations(keyword?: string): Promise<AIConversation[]>;
  getConversationMessages(
    sessionId: string,
    options?: { updateRead?: boolean },
  ): Promise<AIChatMessage[]>;
  getConversationActiveState(
    sessionId: string,
  ): Promise<'idle' | 'streaming' | 'invoking' | undefined>;
  updateConversationTitle(sessionId: string, title: string): Promise<void>;
  destroyConversation(sessionId: string): Promise<void>;
  uploadFile(
    file: File,
    signal?: AbortSignal,
  ): Promise<Record<string, unknown>>;
  createConversation(options: {
    employee: AIEmployee;
    model: AIModel;
    systemMessage?: string;
    skillSettings?: { skills?: string[]; tools?: string[] };
  }): Promise<string>; // sessionId
  sendMessagesStream(
    body: SendMessagesRequest & { sessionId: string },
    signal?: AbortSignal,
  ): Promise<ReadableStream<Uint8Array>>;
  resendMessagesStream(
    body: ResendMessagesRequest & { sessionId: string },
    signal?: AbortSignal,
  ): Promise<ReadableStream<Uint8Array>>;
  updateToolCallDecision(
    options: UpdateToolCallDecisionOptions,
  ): Promise<{ updated: number; toolCalls: UpdatedToolCall[] }>;
  resumeToolCallStream(
    body: ResumeToolCallRequest & { sessionId: string },
    signal?: AbortSignal,
  ): Promise<ReadableStream<Uint8Array>>;
  resumeConversationStream(
    sessionId: string,
    signal?: AbortSignal,
  ): Promise<ReadableStream<Uint8Array>>;
}
```

The actual interface uses `unknown` for raw streaming bodies so custom transports remain possible. The installed service takes `sessionId` out of a run body and puts it in the path; the rest is the request body documented below. `getConversationMessages(sessionId, { updateRead: true })` reads the history and then marks the conversation read with a second request.

## Employees and models

### `GET /api/aiEmployees/roster`

No query. Returns `{ data: AIEmployee[], meta: { total } }`: every enabled employee — there is no per-user or per-role filter — ordered by the user's own sort, then the employee's `sort`, with this user's own prompt for each. Every signed-in user may read it; the full employee records are the settings list at `GET /api/aiEmployees`.

```ts
type AIEmployee = {
  username: string;
  nickname: string;
  position?: string;
  bio?: string;
  greeting?: string;
  description?: string;
  avatar?: string;
  category?: string;
  deprecated?: boolean;
  builtIn?: boolean;
  userConfig?: { prompt?: string };
  chatSettings?: Record<string, unknown>;
  skillSettings?: {
    skills?: string[]; // effective: the employee's own plus every GENERAL Skill
    tools?: { name: string; autoCall?: boolean }[]; // effective, GENERAL tools included
  };
  modelSettings?: {
    enabled?: boolean;
    llmService?: string;
    model?: string;
    models?: { llmService?: string; model?: string }[];
  };
};
```

### `PUT /api/aiEmployees/{username}/userPrompt`

Body `{ prompt: string }`, replacing the signed-in user's own prompt for that employee. Returns `{ data: { prompt } }`; 404 `AI_EMPLOYEE_NOT_FOUND` for an unknown employee.

### `GET /api/aiEmployee/models`

Query `type`: `LLM` (the default) or `EMBEDDING`. Returns `{ data: EnabledLLMService[] }`, one group per enabled service:

```ts
type EnabledLLMService = {
  llmService: string;
  llmServiceTitle: string;
  provider: string;
  providerTitle?: string;
  enabledModels: { label: string; value: string }[];
  supportWebSearch: boolean;
  webSearchModels?: string[];
  isToolConflict: boolean;
};
```

With `type=LLM`, `enabledModels` are the chat models chosen on the settings page; the Registry flattens each item into `AIModel`. With `type=EMBEDDING`, only services whose provider supports embeddings are listed, and `enabledModels` are the embedding model ids that provider suggests; web search and tool conflict are always false there.

Other model routes:

- `GET /api/aiEmployee/llmProviders`: no input; returns `{ data, meta: { total } }` with the installed provider metadata.
- `GET /api/aiEmployee/llmServices/{name}/providerModels?q=<search>`: the chat models the provider itself offers, as `{ data: { id: string }[], meta: { total } }`, optionally filtered by `q`. It calls the provider with the service's stored key, so it requires AI settings access like the [management resources](#management-resources); a provider that cannot be reached answers 503 `PROVIDER_MODELS_UNAVAILABLE`.

For setup-time model discovery and callability checks, follow [Configure LLM services](llm-configuration.md); do not recreate the CLI flow with raw HTTP requests.

## Conversation lifecycle

### `POST /api/aiEmployee/conversations`

```ts
type CreateConversationRequest = {
  aiEmployee: { username: string }; // other fields of an employee object are ignored
  modelSettings?: ModelRef | Record<string, unknown>; // the normal Registry flow sends a ModelRef
  systemMessage?: string;
  skillSettings?: {
    skills?: string[];
    tools?: string[];
  };
  conversationSettings?: Record<string, unknown>;
  scope?: string;
};
```

`aiEmployee.username` must name an enabled employee: an unknown one is 400 `AI_EMPLOYEE_NOT_FOUND` with a field violation on `aiEmployee.username`, a disabled one 400 `AI_EMPLOYEE_DISABLED` (`FAILED_PRECONDITION`). Answers 201 with `{ data }`, the inserted conversation record, whose `sessionId` every following request names.

### `GET /api/aiEmployee/conversations`

Query `{ q?: string }`, matching part of the title. Returns `{ data, meta: { total } }`: all of the current user's main-agent chat conversation records, newest `updatedAt` first. A user's own chat list is read whole and is not paged. Records use `sessionId`, `aiEmployeeUsername`, `read`, and `options.modelSettings`; `title` can be `null` before the first text prompt. The Registry normalizes each item to:

```ts
type AIConversation = {
  id: string; // sessionId
  title: string;
  employeeUsername: string;
  updatedAt: string;
  unread?: boolean;
  model?: { llmService?: string; model: string };
};
```

### `GET /api/aiEmployee/conversations/{sessionId}/messages`

Query:

```ts
{
  pageToken?: string; // `meta.nextPageToken` of the previous page
  pageSize?: number;  // 1–200, default 10
}
```

Reading history never marks it read; that is [`markRead`](#post-apiaiemployeeconversationssessionidmarkread).

#### History response envelope and pagination

```ts
type GetMessagesResponse = {
  data: HistoryMessage[];
  meta: { nextPageToken?: string };
};
```

Rows come in descending message-id order (newest first), at most `pageSize` of them. `meta.nextPageToken` is present while older messages remain; request the next older page by sending it back unchanged as `pageToken`, and stop when it is absent. An empty conversation answers `{ "data": [], "meta": {} }`. `pageSize` goes up to 200 so a chat can open a conversation with its recent history in one request; it does not promise the whole conversation.

A conversation that is missing or not the caller's answers 404 `CONVERSATION_NOT_FOUND`, never an empty history. Standalone `role: 'tool'` rows are excluded; their results are joined into assistant tool calls. System rows are not filtered out by this endpoint. Nested sub-agent messages are ordered oldest first within their own session, unlike the top-level rows.

#### History message schema

These are parsed response rows, not raw database `AIMessage` records, incoming send-message objects, or Registry `AIChatMessage` objects. The built-in parsers expose the following JSON-facing shape; optional properties can be omitted and nullable persisted fields can be `null`. `unknown` below means provider/application-defined JSON, not an executable value.

```ts
type HistoryMessage = {
  key: string; // stable persisted message id; keep it as a string
  role?: string | null; // 'user', 'system', or the employee's username on its replies; never 'assistant'
  createdAt?: string | null; // serialized timestamp, normally ISO 8601; not a JS Date
  content: HistoryContent; // object even when stored content is null
};

type HistoryContent = {
  messageId: string; // same persisted id as the outer key
  from: 'main-agent' | 'sub-agent';
  type?: string | null; // normally text; not guaranteed for every stored message
  content?: unknown; // usually text, but may be null, absent, or structured JSON
  metadata?: Record<string, unknown> | null;
  attachments?: unknown[] | null;
  workContext?: HistoryWorkContext[] | null;
  tool_calls?: HistoryToolCall[] | null;
  reasoning?: unknown;
  reference?: { title?: string; url?: string }[] | null;
  subAgentConversations?: {
    sessionId: string;
    toolCallId: string;
    status: 'pending' | 'completed';
    messages: HistoryMessage[];
  }[];
  [key: string]: unknown; // retained content and provider-specific extensions
};

type HistoryWorkContext = {
  type: string;
  id?: string;
  title?: string;
  content?: unknown;
  [key: string]: unknown;
};

type HistoryToolCall = {
  id: string; // tool-call id, NOT the containing message id
  name: string;
  type: string;
  args: unknown;
  invokeStatus?: string | null;
  invokeStartTime?: number | string | null; // epoch milliseconds, possibly a decimal string
  invokeEndTime?: number | string | null;
  auto?: boolean | null;
  status?: string | null;
  content?: unknown; // joined tool result, possibly null or absent
  execution?: 'frontend' | 'backend';
  willInterrupt?: boolean;
  defaultPermission?: 'ASK' | 'ALLOW';
  [key: string]: unknown;
};
```

| Field                                           | Meaning and absence handling                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `key`, `content.messageId`                      | Both identify the same persisted message. There is **no top-level `messageId`**, `id`, or `sessionId` in the built-in parsed row. Use `key` for stable rendering/deduplication and as the `messageId` for resend, tool decisions, or resume; send/edit uses `editingMessageId`. Keep the conversation's `sessionId` separately. Never convert a message id or page token to `number`.                                                                                       |
| `role`, `createdAt`                             | Passed through from persistence. An employee's reply is stored with its username as `role` (`atlas`, say), not `assistant`, so treat any role other than `user` or `system` as that employee's. Normal writes provide a role and creation time, but storage allows nulls; tolerate missing/null values from older or custom records. Do not infer chronological order from timestamps or use an array index as a persistent id.                                             |
| `content.type`, `content.content`               | Structured content wrapper and its payload. Display text only after checking `typeof row.content.content === 'string'`. An assistant tool-only message can have empty text; provider parsers can retain structured content or omit a text payload.                                                                                                                                                                                                                          |
| `content.metadata`                              | Optional/nullable persisted metadata, such as `model`, `provider`, `llmService`, usage, response metadata, and interrupt state. Provider-dependent; not a required display contract.                                                                                                                                                                                                                                                                                        |
| `content.attachments`                           | Optional/nullable array of persisted attachment JSON. Normal uploaded references contain `filename` and may include `id`, `uid`, `size`, `mimetype`, `url`, `preview`, and `source`; see [Files](#files) and `IncomingAttachmentRef` below. No attachment is guaranteed on a row, and URLs are not necessarily absolute.                                                                                                                                                    |
| `content.workContext`                           | Optional/nullable array of resolved context snapshots. `type` and `id` identify the items the Registry sends; their content and additional fields depend on the App. This is not a live DOM/page handle.                                                                                                                                                                                                                                                                    |
| `content.tool_calls`                            | Response spelling is snake case, unlike incoming/persisted `toolCalls`. Normally absent when persisted `toolCalls` is null, or `[]` when an empty array was stored; raw/provider content can also carry null. Join fields can be absent/null when no tool result exists, and execution/permission can be absent if the tool is no longer registered. `willInterrupt` reflects frontend execution or `auto === false`, not proof that a call is currently awaiting approval. |
| `content.from`, `content.subAgentConversations` | Top-level rows are marked `main-agent`. When sub-agent metadata exists, nested sessions carry `sessionId`, the dispatch `toolCallId`, status, and parsed messages marked `sub-agent`; a session can have an empty `messages` array.                                                                                                                                                                                                                                         |
| `content.reasoning`, `content.reference`        | Optional provider additions. Reasoning can include `{ status: 'stop', content: string }`; references can include titles/URLs. Do not require them or assume every provider returns the same structure.                                                                                                                                                                                                                                                                      |

Normalize optional arrays with an array check rather than assuming every response contains `[]`. The Registry service requests one page of 200, reverses the rows, removes tool/system roles, and maps them to UI messages; its `AIChatMessage[]` return value is not the HTTP response schema. See the [HTTP walkthrough](#http-conversation-walkthrough) and the [server manager history boundary](server-runs.md#aiconversationsmanager).

### `GET /api/aiEmployee/conversations/{sessionId}`

Returns `{ data }`: the caller's conversation record, with `llmActiveState` (`'idle' | 'streaming' | 'invoking'`) telling whether a run is still going; `idle` when the record has none. 404 `CONVERSATION_NOT_FOUND` when it is missing or not the caller's.

### `POST /api/aiEmployee/conversations/{sessionId}/markRead`

No body. Marks the conversation read and returns `{ data }`, the updated record.

### `PATCH /api/aiEmployee/conversations/{sessionId}`

Body `{ title: string }`. Returns `{ data }`, the updated record.

### `PUT /api/aiEmployee/conversations/{sessionId}/options`

Replaces the conversation's options as a whole; a field left out is removed:

```ts
{
  systemMessage?: string;
  skillSettings?: { skills?: string[]; tools?: string[] };
  conversationSettings?: Record<string, unknown>;
  modelSettings?: ModelRef | Record<string, unknown>;
}
```

Returns `{ data }`, the options now stored.

### `DELETE /api/aiEmployee/conversations/{sessionId}`

Answers 204 with no body; 404 when the conversation is missing or not the caller's.

### `GET /api/aiEmployee/conversations/unreadCount`

Returns `{ data: { count: number } }`, the caller's unread main-agent chat conversations.

## HTTP conversation walkthrough

This sequence uses a cookie-authenticated App mounted at its origin root. For a path-mounted App, include its public base path in `BASE_URL`. Prerequisites: an existing enabled user, an enabled employee, and a configured LLM service/model with valid credentials. Replace `atlas`, `openai`, and `gpt-4.1` with values available from `GET /api/aiEmployees/roster` and `GET /api/aiEmployee/models`; they are example identifiers, not automatic configuration. Responses below are illustrative snapshots, not fixed ids, timestamps, or guaranteed model text.

### 1. Authenticate and retain the session cookie

Authentication is under `/api/auth`, not under the AI employee routes; the standard username/password endpoint is `/api/auth/sign-in/username`. The user authenticates privately through the App's configured mechanism. An agent must never ask for, read, or print a password, token, cookie jar, `.env`, or `config.yml`, and must not construct a login command containing a password. Prefer the signed-in application's existing API client. The shell examples below are for an operator's private terminal with a protected cookie jar already established, not commands an agent uses to collect credentials.

```bash
BASE_URL='http://localhost:3000'
```

Example JSON response (the user object can include additional configured fields):

```json
{
  "redirect": false,
  "token": "REDACTED_SESSION_TOKEN",
  "user": {
    "id": "user-alice",
    "name": "Alice",
    "username": "alice",
    "email": "alice@example.com",
    "emailVerified": false,
    "image": null,
    "createdAt": "2026-04-09T09:00:00.000Z",
    "updatedAt": "2026-04-09T09:00:00.000Z"
  }
}
```

The response also sets the session cookie; the operator's protected cookie jar supplies it to subsequent `-b` options. Cookie names, secure prefixes, and paths depend on deployment configuration. Do not assume the JSON `token` enables Bearer authentication: that requires an explicitly configured authentication integration. Do not use legacy `/api/auth:signIn` or manually invent cookie values.

### 2. Create a conversation

```bash
curl -sS -b /tmp/nocobase-ai.cookies \
  -H 'Content-Type: application/json' \
  -d '{"aiEmployee":{"username":"atlas"},"modelSettings":{"llmService":"openai","model":"gpt-4.1"}}' \
  "$BASE_URL/api/aiEmployee/conversations"
```

Example response, HTTP 201:

```json
{
  "data": {
    "userId": "user-alice",
    "aiEmployeeUsername": "atlas",
    "options": {
      "modelSettings": { "llmService": "openai", "model": "gpt-4.1" }
    },
    "thread": 1,
    "from": "main-agent",
    "category": "chat",
    "sessionId": "11111111-1111-4111-8111-111111111111",
    "createdAt": "2026-04-09T10:00:00.000Z",
    "updatedAt": "2026-04-09T10:00:00.000Z"
  }
}
```

Keep the returned `data.sessionId` verbatim. Creation returns the inserted record; database defaults such as `read` and `llmActiveState` need not appear until a later read. The HTTP create endpoint requires an employee even though the trusted server manager also supports model-only sessions.

### 3. List conversations

```bash
curl -sS -b /tmp/nocobase-ai.cookies \
  "$BASE_URL/api/aiEmployee/conversations"
```

Example response when this is the user's only conversation:

```json
{
  "data": [
    {
      "sessionId": "11111111-1111-4111-8111-111111111111",
      "thread": 1,
      "topicId": null,
      "from": "main-agent",
      "scope": null,
      "userId": "user-alice",
      "aiEmployeeUsername": "atlas",
      "title": null,
      "options": {
        "modelSettings": { "llmService": "openai", "model": "gpt-4.1" }
      },
      "llmActiveState": "idle",
      "category": "chat",
      "read": true,
      "createdAt": "2026-04-09T10:00:00.000Z",
      "updatedAt": "2026-04-09T10:00:00.000Z"
    }
  ],
  "meta": { "total": 1 }
}
```

### 4. Read the new conversation's history

Set `SESSION_ID` to the value returned in step 2, not to the example value when calling a real App:

```bash
SESSION_ID='11111111-1111-4111-8111-111111111111'
curl -sS -b /tmp/nocobase-ai.cookies \
  "$BASE_URL/api/aiEmployee/conversations/$SESSION_ID/messages"
```

Response before sending any messages:

```json
{ "data": [], "meta": {} }
```

### 5. Send a message

```bash
curl -N -b /tmp/nocobase-ai.cookies \
  -H 'Content-Type: application/json' \
  -d '{"aiEmployee":"atlas","model":{"llmService":"openai","model":"gpt-4.1"},"messages":[{"role":"user","content":{"type":"text","content":"Say hello in one short sentence."}}]}' \
  "$BASE_URL/api/aiEmployee/conversations/$SESSION_ID/send"
```

The request is checked before the stream opens, so these answer in the standard error body rather than on the stream: a malformed body 400 `INVALID_INPUT`, a body without a user message 400 `INVALID_INPUT` on `messages`, an employee the body names that does not exist 400 `AI_EMPLOYEE_NOT_FOUND` on `aiEmployee`, an unknown conversation or one that is not the caller's chat 404 `CONVERSATION_NOT_FOUND`, and three runs of the caller already streaming 429 `CONVERSATION_LIMIT_REACHED`. A `send` refused for that limit keeps its user message, so a later `resend` runs it. After that the response is an SSE stream, HTTP 200, whatever the run does: read [SSE](#sse) frames until the stream closes, and treat an `error` frame as the failure, since the status alone does not prove execution succeeded. Do not call `response.json()` on it. Do not resend automatically if the request disconnects or the result is uncertain; read the persisted history instead.

A stream that closes without a reply has not necessarily finished. A run that paused for a tool decision closes the same way, and history is where the difference shows: its tool calls are recorded as `interrupted` rather than completed, and the assistant turn carries the interrupt id. Answer them with [the user decision](#put-apiaiemployeeconversationssessionidmessagesmessageidtoolcallstoolcallididuserdecision) and continue with [`resumeToolCall`](#post-apiaiemployeeconversationssessionidresumetoolcall) rather than treating the tool-calling turn as the reply.

### 6. Read persisted user and assistant messages, then mark them read

```bash
curl -sS -b /tmp/nocobase-ai.cookies \
  "$BASE_URL/api/aiEmployee/conversations/$SESSION_ID/messages"
curl -sS -b /tmp/nocobase-ai.cookies -X POST \
  "$BASE_URL/api/aiEmployee/conversations/$SESSION_ID/markRead"
```

Illustrative text-only history after successful completion (metadata varies by provider, and tool use can produce additional rows):

```json
{
  "data": [
    {
      "key": "2030000000000000002",
      "createdAt": "2026-04-09T10:00:02.000Z",
      "role": "atlas",
      "content": {
        "type": "text",
        "content": "Hello! How can I help you today?",
        "messageId": "2030000000000000002",
        "metadata": {
          "provider": "openai",
          "model": "gpt-4.1",
          "llmService": "openai"
        },
        "attachments": null,
        "workContext": null,
        "tool_calls": [],
        "from": "main-agent"
      }
    },
    {
      "key": "2030000000000000001",
      "createdAt": "2026-04-09T10:00:01.000Z",
      "role": "user",
      "content": {
        "type": "text",
        "content": "Say hello in one short sentence.",
        "messageId": "2030000000000000001",
        "metadata": null,
        "attachments": null,
        "workContext": null,
        "from": "main-agent"
      }
    }
  ],
  "meta": {}
}
```

Render oldest first by reversing a copy of the rows; retain `key` as the stable id. Remove the local cookie jar when finished.

## Message streaming

### `POST /api/aiEmployee/conversations/{sessionId}/send`

```ts
type IncomingAttachmentRef = {
  id?: string | number;
  uid?: string;
  filename: string; // required
  size?: number;
  mimetype?: string;
  url?: string;
  preview?: string;
  source?: {
    dataSourceKey?: string;
    collectionName?: string;
    field?: string;
    documentCache?: boolean;
  };
  [key: string]: unknown;
};

type IncomingChatMessage = {
  key?: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: { type: string; content: unknown };
  attachments?: IncomingAttachmentRef[];
  workContext?: Record<string, unknown>[];
  metadata?: Record<string, unknown>;
  toolCalls?: Record<string, unknown>[];
};

type SendMessagesRequest = {
  aiEmployee: string; // employee username
  model?: ModelRef;
  messages: IncomingChatMessage[]; // must contain a user message
  editingMessageId?: string;
  webSearch?: boolean;
  frontendTools?: Record<string, unknown>[]; // the page's frontend tool registrations
  toolCallResults?: { id: string; result: unknown }[];
  important?: string;
  timezone?: string; // falls back to the `x-timezone` header
  systemMessage?: string; // accepted, not applied
  skillSettings?: Record<string, unknown>; // accepted, not applied
};
```

The system message and skill settings come from the conversation, set when it was [created](#post-apiaiemployeeconversations) or through [its options](#put-apiaiemployeeconversationssessionidoptions); the chat repeats them in this body, and they are accepted but not applied. Any other field is refused with 400.

Registry normal flow sends exactly one latest user message with content `{ type: 'text', content: string }`, completed attachments only, and resolved work context. The response is SSE. For the JSON history after execution, read [the messages](#get-apiaiemployeeconversationssessionidmessages).

### `POST /api/aiEmployee/conversations/{sessionId}/resend`

```ts
type ResendMessagesRequest = {
  messageId?: string;
  model?: ModelRef;
  webSearch?: boolean;
};
```

Response is SSE.

### `POST /api/aiEmployee/conversations/{sessionId}/resumeStream`

No body. Response is SSE. Use for reconnecting to an active/cached stream, not for resending the user prompt.

### `POST /api/aiEmployee/conversations/{sessionId}/abort`

No body. Aborts active agent execution for that conversation and returns `{ data }`, the conversation record; 404 when the conversation is not the caller's.

## Tool decisions and resume

### `PUT /api/aiEmployee/conversations/{sessionId}/messages/{messageId}/toolCalls/{toolCallId}/userDecision`

The body is the decision itself:

```ts
type ToolCallDecision =
  | { type: 'approve' }
  | { type: 'reject'; message?: string }
  | {
      type: 'edit';
      editedAction: { name: string; args: unknown };
    };
```

The path names the conversation, the assistant message that made the call, and the tool call. A missing conversation, message or tool call answers 404 (`CONVERSATION_NOT_FOUND`, `MESSAGE_NOT_FOUND`, `TOOL_CALL_NOT_FOUND`). Only a tool call that is still interrupted is updated; any other leaves `updated: 0` rather than failing, so check it. For `executeFrontendTool`, the nested tool id must still exist in current conversation context, or it answers 400 `FRONTEND_TOOL_UNAVAILABLE`. Returns:

```ts
{
  data: {
    updated: number;
    toolCalls: {
      id: string;
      name: string;
      invokeStatus?: string;
      status?: string;
      auto?: boolean;
      execution?: string;
      willInterrupt?: boolean;
      args?: unknown;
      [key: string]: unknown; // every other stored field, such as content and userDecision
    }[];
  };
}
```

### `POST /api/aiEmployee/conversations/{sessionId}/resumeToolCall`

```ts
type ResumeToolCallRequest = {
  messageId?: string; // if omitted, server uses latest message
  toolCallResults?: { id: string; result: unknown }[];
  model?: ModelRef;
  webSearch?: boolean;
};
```

Response is SSE. For browser tools, `toolCallResults[].id` is the original tool-call id and `result` must be serializable.

### `PATCH /api/aiEmployee/conversations/{sessionId}/messages/{messageId}/toolCalls/{toolCallId}`

Body `{ args: unknown }`. Replaces the persisted arguments of that tool call and returns `{ data }`, the updated tool call; 404 when the conversation, message or tool call does not exist. This does not itself execute or resume the tool.

## Files

### `POST /api/aiEmployee/files`

Multipart form data with exactly one field named `file` whose value is a browser `File`; another content type, or none, answers 415 `UNSUPPORTED_MEDIA_TYPE`, a form without `file` 400, and a request body over 20 MiB 413 `BODY_TOO_LARGE`. Answers 201 with `{ data: { id, filename, size, mimetype, extname, disk, path, url, preview, data, source: { collectionName: 'aiFiles' } } }`, where `url` and `preview` are both the preview address below. `filename` is the name the file was uploaded with, in any script, minus any directory part and control characters, and at most 128 characters with the extension kept. The Registry resolves returned relative URLs.

### `GET /api/aiEmployee/files/{fileId}/preview`

Returns the file itself, not a JSON envelope, served inline with the original file name in `Content-Disposition`. An attachment stored by an upload comes back in history with `preview` pointing here, and with `url` pointing here too unless its disk gives the file a URL of its own; an address stored by releases before these routes is replaced with the current one. On send, an `aiFiles` attachment the sender did not upload is dropped. The user who uploaded the file can preview it; anyone else, and anyone previewing a file that records no uploader, needs AI settings access, and gets 403 `FILE_ACCESS_DENIED` without it. An unknown file is 404 `FILE_NOT_FOUND` only for a caller with AI settings access; anyone else gets the same 403 `FILE_ACCESS_DENIED` as for another user's file, so ids cannot be probed.

## Management resources

The routes behind the AI settings page. Besides a signed-in session, every route in this section requires access to that page — `page:ai.settings` with the `access` action — and answers 403 `AI_SETTINGS_ACCESS_REQUIRED` without it; an ordinary chat user reaches none of them. LLM services and MCP servers are configured in `config.yml`, and their routes here only change what the settings page manages. Request bodies are strict: an unknown field answers 400 naming it.

### Employees

- `GET /api/aiEmployees`: every employee record, with `meta: { total }`.
- `GET /api/aiEmployees/templates`: with `meta: { total }`.
- `GET /api/aiEmployees/{username}`
- `POST /api/aiEmployees`: body `{ username, ...fields }`; 201 with the created record. An existing username is 409 `AI_EMPLOYEE_ALREADY_EXISTS`, and a username equal to a fixed segment beside `{username}` (`roster`, `templates`) is refused with 400.
- `PATCH /api/aiEmployees/{username}`: the fields to change; 404 `AI_EMPLOYEE_NOT_FOUND` for an unknown employee.
- `DELETE /api/aiEmployees/{username}`: 204, or 404.

Editable employee fields:

```ts
{
  nickname?: string;
  position?: string;
  avatar?: string;
  bio?: string;
  greeting?: string;
  description?: string;
  category?: string;
  defaultPrompt?: string | null;
  about?: string | null;
  enabled?: boolean;
  deprecated?: boolean;
  sort?: number;
  chatSettings?: Record<string, unknown>;
  modelSettings?: {
    enabled?: boolean;
    llmService?: string;
    model?: string;
    models?: ModelRef[];
  };
  skillSettings?: {
    skills?: string[]; // omitted from a sent skillSettings, it becomes []
    tools?: { name: string; autoCall?: boolean }[];
    enabledSkills?: string[] | null; // when set, the exact Skills the roster reports
    enabledTools?: string[] | null; // when set, the exact tools the roster reports
  };
  enableKnowledgeBase?: boolean;
  knowledgeBasePrompt?: string | null;
  knowledgeBase?: {
    knowledgeBaseKeys?: string[];
    topK?: number;
    score?: number;
    retrievalStrategy?: 'always' | 'onDemand';
  };
}
```

### Skills

- `GET /api/aiEmployee/skills`: `{ data: ManagedSkillSummary[] }`, without Markdown content.
- `GET /api/aiEmployee/skills/{name}`: `{ data }`, the summary plus `content`.
- `POST /api/aiEmployee/skills`: 201; an existing name is 409 `SKILL_ALREADY_EXISTS`.
- `PATCH /api/aiEmployee/skills/{name}`: 404 `SKILL_NOT_FOUND` for an unknown skill.
- `DELETE /api/aiEmployee/skills/{name}`: 204, or 404.

```ts
type ManagedSkillSummary = {
  name: string;
  i18n?: { namespace: string };
  title: string;
  description: string;
  about: string;
  scope: 'SPECIFIED' | 'GENERAL' | 'CUSTOM';
  source: string;
  tools: {
    name: string;
    i18n?: { namespace: string };
    title: string;
    description: string;
    about: string;
    available: boolean; // false for a name no registered tool has
  }[];
};
```

Create body (an update takes the same fields except `name`, each optional):

```ts
{
  name: string;
  scope?: 'SPECIFIED' | 'GENERAL' | 'CUSTOM';
  i18n?: { namespace: string };
  description?: string;
  content?: string;
  tools?: string[];
  from?: string;
  introduction?: { title?: string; about?: string };
}
```

### Tools

- `GET /api/aiEmployee/tools`: `{ data: ManagedToolSummary[] }`.
- `GET /api/aiEmployee/tools/{name}`: `{ data }`, the summary plus `inputSchema` (a JSON Schema, or `null` when the schema is not plain JSON).
- `POST /api/aiEmployee/tools`: 201; an existing name is 409 `TOOL_ALREADY_EXISTS`.
- `PATCH /api/aiEmployee/tools/{name}`: 404 `TOOL_NOT_FOUND` for an unknown tool.
- `DELETE /api/aiEmployee/tools/{name}`: 204, or 404.

```ts
type ManagedToolSummary = {
  name: string;
  i18n?: { namespace: string };
  title: string;
  description: string;
  about: string;
  scope: 'SPECIFIED' | 'GENERAL' | 'CUSTOM';
  source: string; // `from`: loader, workflow, mcp, or empty
  defaultPermission: 'ASK' | 'ALLOW';
};
```

Create body (an update takes the same fields with an optional `definition` that has no `name`):

```ts
{
  scope?: 'SPECIFIED' | 'GENERAL' | 'CUSTOM';
  i18n?: { namespace: string };
  from?: 'loader' | 'workflow' | 'mcp';
  execution?: 'frontend' | 'backend';
  defaultPermission?: 'ASK' | 'ALLOW';
  silence?: boolean;
  introduction?: { title?: string; about?: string };
  definition: {
    name: string;
    description?: string;
    schema?: Record<string, unknown>;
  };
}
```

A managed backend tool cannot be created from JSON alone without an existing executable `invoke` function, and is refused with 400. Define executable App tools in `server/ai/tools`; use management routes primarily to edit registered metadata/frontend tools.

### MCP servers

MCP servers are configured only in `config.yml` `ai.mcpServers`; there is no route that creates, edits, or deletes one. The enable switch and tool permissions these routes change are stored and survive a restart; a tool is named `mcp-<server>-<tool>`.

- `GET /api/aiEmployee/mcpServers` and `GET /api/aiEmployee/mcpServers/{name}`: configured servers, with secret-like environment/header values redacted; the list with `meta: { total }`.
- `GET /api/aiEmployee/mcpServers/tools`: `{ data: Record<serverName, MCPToolEntry[]> }`, the tools of every connected server.
- `POST /api/aiEmployee/mcpServers/{name}/enable` and `.../disable`: return `{ data }`, the server.
- `PATCH /api/aiEmployee/mcpServers/{name}/tools/{toolName}`: body `{ permission: 'ASK' | 'ALLOW' }`, where `toolName` is the exposed `mcp-<server>-<tool>` name; returns `{ data }`, the tool entry. 404 `MCP_TOOL_NOT_FOUND` when that server has no such connected tool.
- `POST /api/aiEmployee/mcpServers/{name}/testConnection`: tests that configured server using only its saved configuration; no body. Both test routes answer 200 with `{ data: { success: boolean; error?: string } }`: a server that cannot be reached is the result of the test, not a failed request.
- `POST /api/aiEmployee/mcpServers/testConnection`: tests a remote server that is not saved, from `{ transport: 'http' | 'sse', url, headers? }`. A `stdio` server runs a local command, so it can only be tested by name; an inline `transport: 'stdio'` body is refused with 400.

An unknown `{name}` is 404 `MCP_SERVER_NOT_FOUND`. `tools` and `testConnection` are fixed segments beside `{name}`, so a server configured under either name is a configuration error: `pnpm nocobase config check` reports it and the plugin refuses to start until it is renamed. A configured server as returned:

```ts
{
  name: string;
  title?: string;
  description?: string;
  enabled?: boolean;
  transport: 'stdio' | 'sse' | 'http';
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  url?: string;
  headers?: Record<string, string>;
  restart?: Record<string, unknown>;
  toolPermissions?: Record<string, 'ASK' | 'ALLOW'>; // keyed by the server's own tool name
  sort?: number;
}
```

### LLM services

LLM services are defined only in `config.yml` `ai.llmServices`; there is no route that creates, deletes, or reconfigures one.

- `GET /api/aiEmployee/llmServices` (with `meta: { total }`) and `GET /api/aiEmployee/llmServices/{name}`
- `POST /api/aiEmployee/llmServices/{name}/enable` and `.../disable`
- `PUT /api/aiEmployee/llmServices/{name}/enabledModels` with `{ mode: 'provider' | 'custom'; models: { label?: string; value: string }[] }`
- `GET /api/aiEmployee/llmServices/{name}/providerModels?q=`, described under [Employees and models](#employees-and-models)

Each change touches only its one field, returns `{ data }` with the updated service, answers 404 `LLM_SERVICE_NOT_FOUND` for a name that is not configured, and never creates a service. A service has this shape, with secret-like `options` redacted:

```ts
{
  name: string;
  title: string;
  provider: string;
  options: Record<string, unknown>;
  enabledModels: {
    mode: 'provider' | 'custom';
    models: { label: string; value: string }[];
  };
  modelOptions?: Record<string, unknown>;
  enabled: boolean;
  sort: number;
}
```

### Conversation center

Every user's conversations, read-only, for the settings page:

- `GET /api/aiEmployee/managedConversations`: query `q` (part of the title, at most 200 characters), `userId`, `aiEmployeeUsername`, `page` (1–10000) and `pageSize` (1–100, default 20). Returns `{ data, meta: { page, pageSize, total } }`: main conversations only, newest first, each row carrying `user` (`id`, `name`, `username`) and `aiEmployee` (`username`, `nickname`, `avatar`), or `null` when either no longer exists.
- `GET /api/aiEmployee/managedConversations/{sessionId}/messages`: one history page, in the same shape and with the same `pageToken`/`pageSize` as a user's own history. `sessionId` must be a UUID (400 `INVALID_INPUT` otherwise), and an unknown session is 404.
- `GET /api/aiEmployee/conversationOwners`: query `q` (part of the name or username), `userId`, `page` (1–10000) and `pageSize` (1–100, default 20). Returns `{ data: { id, name, username }[], meta: { page, pageSize, total } }`, only users who own a main conversation, ordered by name.

### Usage statistics

Read-only aggregation over `aiUsageEvents`. Each route returns `{ data }`.

- `GET /api/aiEmployee/usage/summary`
- `GET /api/aiEmployee/usage/series`
- `GET /api/aiEmployee/usage/breakdown`
- `GET /api/aiEmployee/usage/filterOptions`

Shared query parameters: `start` and `end` (inclusive, RFC 3339 times with an offset such as `2026-09-20T00:00:00Z`; the range defaults to the last 7 days and may not exceed 366 days), `timezoneOffset` (east-positive minutes, rounded to whole hours), and the equality filters `model`, `provider`, `llmService`, `aiEmployeeUsername`, `userId`, `category`, `from`. `series` also takes `granularity` (`hour`, `day`, `week`, `month`, or `auto`); `breakdown` takes `dimension` (one of `model`, `provider`, `llmService`, `aiEmployeeUsername`, `userId`, `category`, `from`) and `top` (1–50, default 10), how many of the largest rows to return. `top` ranks rather than pages: there is no next page, and `totals` lets the caller show the remainder.

```ts
interface UsageTotals {
  eventCount: number;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  cachedTokens: number;
  reasoningTokens: number;
  toolCallCount: number;
  autoToolCallCount: number;
}
```

`summary` also takes `compareShiftHours` (1 to 8784), the whole-period offset its comparison window moves back by; it returns `{ range, totals, previous, previousRange }`, where `previous` is `range` shifted back by that many hours. Without it the comparison falls back to the equally long window immediately before `range`, which skews whenever the range ends midway through a period — a range covering today so far would otherwise be measured against the stretch that just ended rather than against the same hours yesterday. `series` returns `{ range, granularity, buckets }` with one bucket per period in the range, empty periods included as zeros. Every time in an answer — `range.start`, `range.end`, `previousRange` and each bucket's `start` — is an RFC 3339 string in UTC. `breakdown` returns `{ range, dimension, rows, totals }`, rows sorted by `totalTokens` descending and labelled with an employee nickname or user name where one resolves. `filterOptions` returns the `models` and `aiEmployees` present in the range, ignoring the filters so a narrowed dimension still lists its alternatives.

From client code, call these through `useAIEmployeeClient()` from `@nocobase/app-plugin-ai-employee/client`: `fetchUsageSummary`, `fetchUsageSeries`, `fetchUsageBreakdown` and `fetchUsageFilterOptions` take the query object, with `start` and `end` in epoch milliseconds, and an optional `AbortSignal`; they send RFC 3339 times and read the answer's times back as epoch milliseconds.

Grouping by period relies on `aiUsageEvents.occurredHour`, a UTC hour index written alongside `occurredAt`. Coarser buckets and the timezone shift are applied to that index in the service, so the SQL stays one portable `GROUP BY`.

## SSE

Headers:

```text
Content-Type: text/event-stream; charset=utf-8
Cache-Control: no-cache
Connection: keep-alive
X-Accel-Buffering: no
```

Each frame is:

```text
data: <JSON>\n\n
```

Frame types include `stream_start`, `stream_end`, content, reasoning and web search frames, `tool_calls` and `tool_call_status`, `new_message`, `sub_agent_completed`, `chunks_cache_missing` from `resumeStream`, and `error`. There is no separate interrupt frame: a tool call awaiting approval arrives through `tool_calls` or `tool_call_status` with `invokeStatus: 'interrupted'`. A stream failure is sent as:

```json
{
  "type": "error",
  "body": "message",
  "code": "optional"
}
```

The run routes answer HTTP 200 once the stream opens, whatever the run does afterwards, so the status never tells a failed run from a successful one; only what is checked before the stream opens — the path, the body, the conversation, the employee and message the body names, and the parallel run limit — answers with the standard error body. When the failure is the agent's — on `send`, `resend` or `resumeToolCall` — `code` carries its `AgentServiceErrorCode` and `body` its root message — `CONFIGURATION_ERROR` for a missing or disabled model or service, `PROVIDER_ERROR` for a provider failure, and the rest as listed in [server-runs.md § Failures a caller has to tell apart](server-runs.md#failures-a-caller-has-to-tell-apart) — so branch on `code`, never on the text of `body`. A failure on the stream before the agent runs, such as a conversation removed after the stream opened, has no `code`, and neither does a failure replaying a stream through `resumeStream`.

Always pass an `AbortSignal`. After disconnect, inspect active state/history and use resume; never blindly duplicate a mutation.

## Errors and security

Every failure outside an open SSE stream is the standard error body, with the same `requestId` in the `x-request-id` response header:

```ts
{
  error: {
    code: number; // the HTTP status
    status: 'INVALID_ARGUMENT' | 'FAILED_PRECONDITION' | 'UNAUTHENTICATED' | 'PERMISSION_DENIED' | 'NOT_FOUND' | 'ALREADY_EXISTS' | 'RESOURCE_EXHAUSTED' | 'UNAVAILABLE' | 'INTERNAL';
    reason: string; // what to branch on
    domain: string; // `aiEmployees` for this plugin's own reasons
    message: string; // for developers; never shown to users
    fieldViolations?: { field: string; description: string }[];
    requestId?: string;
  };
}
```

From the App's `ApiClient`, a failure is an `ApiClientError` carrying `status`, `reason` and `domain`. The reasons this plugin reports, all with domain `aiEmployees`:

| Status | Reason                                                                                                                                                                                                                                                | When                                                                                                                                      |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| 403    | `AI_SETTINGS_ACCESS_REQUIRED`                                                                                                                                                                                                                         | A management route without `page:ai.settings` access                                                                                      |
| 403    | `FILE_ACCESS_DENIED`                                                                                                                                                                                                                                  | Previewing a file someone else uploaded without AI settings access                                                                        |
| 404    | `AI_EMPLOYEE_NOT_FOUND`, `SKILL_NOT_FOUND`, `TOOL_NOT_FOUND`, `LLM_SERVICE_NOT_FOUND`, `MCP_SERVER_NOT_FOUND`, `MCP_TOOL_NOT_FOUND`, `CONVERSATION_NOT_FOUND`, `MESSAGE_NOT_FOUND`, `TOOL_CALL_NOT_FOUND`, `FILE_NOT_FOUND`, `FILE_CONTENT_NOT_FOUND` | The resource the path names does not exist, or is a conversation that is not the caller's                                                 |
| 409    | `AI_EMPLOYEE_ALREADY_EXISTS`, `SKILL_ALREADY_EXISTS`, `TOOL_ALREADY_EXISTS`                                                                                                                                                                           | Creating one with a name already taken                                                                                                    |
| 400    | `AI_EMPLOYEE_NOT_FOUND`, `MESSAGE_NOT_FOUND` with a field violation                                                                                                                                                                                   | A conversation or run body naming an employee or message that does not exist                                                              |
| 400    | `AI_EMPLOYEE_NOT_FOUND`, `CONVERSATION_EMPTY`, `NO_TOOL_CALLS` (`FAILED_PRECONDITION`)                                                                                                                                                                | A `resend` or `resumeToolCall` whose conversation's employee is gone, that has no message to run from, or whose message has no tool calls |
| 400    | `AI_EMPLOYEE_DISABLED`, `FRONTEND_TOOL_UNAVAILABLE`, `LLM_PROVIDER_NOT_FOUND` (`FAILED_PRECONDITION`)                                                                                                                                                 | The request is valid but the state it depends on forbids it                                                                               |
| 400    | `INVALID_REQUEST`                                                                                                                                                                                                                                     | Any other request the service refuses, such as a range longer than a year                                                                 |
| 413    | `BODY_TOO_LARGE`                                                                                                                                                                                                                                      | A request body over its route's limit                                                                                                     |
| 415    | `UNSUPPORTED_MEDIA_TYPE`                                                                                                                                                                                                                              | An upload that is not `multipart/form-data`                                                                                               |
| 429    | `CONVERSATION_LIMIT_REACHED` (`RESOURCE_EXHAUSTED`)                                                                                                                                                                                                   | A `send` or `resend` while three runs of the caller are already streaming                                                                 |
| 503    | `PROVIDER_MODELS_UNAVAILABLE`                                                                                                                                                                                                                         | The LLM provider could not list its models                                                                                                |

Two kinds come from the framework rather than this plugin: an invalid path, query or body answers 400 `INVALID_INPUT` with domain `app` and a field violation for each problem (an unknown body field included), and a missing session answers 401 `AUTHENTICATION_REQUIRED` with domain `authentication`. An unknown `/api` path is 404 `ROUTE_NOT_FOUND`, and an unexpected failure 500 `INTERNAL_ERROR` with nothing about its cause.

Every route requires a signed-in session; there is no anonymous caller. Beyond that, routes fall into two groups:

- **AI settings access** (`page:ai.settings`, `access`), 403 without it: every [management resource](#management-resources) — employees other than the roster and the user prompt, skills, tools, LLM services and provider models, MCP servers, the conversation center and conversation owners, and usage statistics.
- **Every signed-in user**, scoped to what that user owns: the employee roster and the user's own prompt, `/api/aiEmployee/conversations/...`, files (with the ownership rule above), and the non-secret model catalog `GET /api/aiEmployee/models` and `GET /api/aiEmployee/llmProviders`, which return provider metadata, enabled service names and model ids, never credentials, and which other plugins read to offer a model choice.

Backend tools must still enforce business authorization using `ctx.actor` and supplied services/repositories.
