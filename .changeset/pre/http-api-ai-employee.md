---
'@nocobase/app-plugin-ai-employee': major
---

Move the AI employee routes onto the HTTP API rules. The employees themselves are now under `/api/aiEmployees`, and every other AI resource under `/api/aiEmployee`, without an `ai` prefix; the `/api/ai/{resource}:{action}` routes are gone. The `nocobase-ai` Registry item, the settings pages and the plugin client send the new requests, so an application's installed `client/extensions/nocobase-ai` copy must be updated from the Registry together with the plugin.

Employees:

- `GET aiEmployees:listByUser` → `GET /api/aiEmployees/roster`
- `GET aiEmployees:list` → `GET /api/aiEmployees`
- `GET aiEmployees:get?key=` → `GET /api/aiEmployees/{username}`
- `GET aiEmployees:getTemplates` → `GET /api/aiEmployees/templates`
- `POST aiEmployees:create` → `POST /api/aiEmployees` (201). An existing username is now `409 AI_EMPLOYEE_ALREADY_EXISTS` instead of an update, and `roster` and `templates` are reserved usernames.
- `PUT aiEmployees:update?key=` → `PATCH /api/aiEmployees/{username}`; `DELETE aiEmployees:destroy?key=` → `DELETE /api/aiEmployees/{username}` (204). Both answer 404 for an unknown employee.
- `POST aiEmployees:updateUserPrompt` `{ aiEmployee, prompt }` → `PUT /api/aiEmployees/{username}/userPrompt` `{ prompt }`

Models and LLM services:

- `GET ai:listAllEnabledModels` → `GET /api/aiEmployee/models`; `GET ai:listLLMServices?model=EMBEDDING` and `GET ai:listModels?model=EMBEDDING` → `GET /api/aiEmployee/models?type=EMBEDDING`, one group per service with its suggested embedding models
- `GET ai:listLLMProviders` → `GET /api/aiEmployee/llmProviders`
- `POST ai:listProviderModels` `{ llmService, search }` → `GET /api/aiEmployee/llmServices/{name}/providerModels?q=`
- `GET llmServices:list` / `get?key=` → `GET /api/aiEmployee/llmServices` / `GET /api/aiEmployee/llmServices/{name}`
- `POST llmServices:updateEnabled` → `POST /api/aiEmployee/llmServices/{name}/enable` and `.../disable`
- `POST llmServices:updateEnabledModels` → `PUT /api/aiEmployee/llmServices/{name}/enabledModels`
- `POST ai:testFlight` is removed; it only ever failed.

MCP servers, skills, tools, files and usage:

- `GET aiMcpServers:list` / `get?key=` / `listTools` → `GET /api/aiEmployee/mcpServers`, `.../mcpServers/{name}`, `.../mcpServers/tools`
- `POST aiMcpServers:testConnection` → `POST /api/aiEmployee/mcpServers/{name}/testConnection` for a configured server, `POST /api/aiEmployee/mcpServers/testConnection` for unsaved remote values
- `POST aiMcpServers:updateEnabled` → `POST /api/aiEmployee/mcpServers/{name}/enable` and `.../disable`
- `tools` and `testConnection` are fixed segments beside `/api/aiEmployee/mcpServers/{name}`, so an MCP server configured under either name in `ai.mcpServers` is now a configuration error: `config check` reports it and the plugin refuses to start until it is renamed.
- `POST aiMcpServers:updateToolPermission` `{ toolName, permission }` → `PATCH /api/aiEmployee/mcpServers/{name}/tools/{toolName}` `{ permission }`
- `GET aiSkills:list` and `listAll` → `GET /api/aiEmployee/skills`; `GET aiSkills:get?key=` and `getDetails?name=` → `GET /api/aiEmployee/skills/{name}`; create, update and destroy → `POST` (201, `409 SKILL_ALREADY_EXISTS`), `PATCH` and `DELETE` (204) on the same paths. The list and detail are the management summary, now with `about`, `scope` and `source`.
- The same for tools at `/api/aiEmployee/tools`, whose summary now carries `defaultPermission`; `409 TOOL_ALREADY_EXISTS`.
- `POST aiFiles:create` → `POST /api/aiEmployee/files` (201); `GET aiFiles:preview?id=` → `GET /api/aiEmployee/files/{fileId}/preview`. Upload results and history attachments carry the new preview address, and history replaces an old `/aiFiles:preview?id=` address a message stored.
- `GET aiUsage:summary|series|breakdown|filterOptions` → `GET /api/aiEmployee/usage/summary|series|breakdown|filterOptions`. `start` and `end` are now RFC 3339 times instead of epoch milliseconds, and every time in an answer (`range`, `previousRange`, bucket `start`) is an RFC 3339 string; the breakdown's `limit` is now `top`, since it ranks rather than pages.
- The employee settings page reads the commercial knowledge base plugin's list at `GET /api/aiKnowledgeBases` instead of `GET /api/ai/aiKnowledgeBase:list`.

Conversations:

- `GET aiConversations:list?keyword=` → `GET /api/aiEmployee/conversations?q=`
- `POST aiConversations:create` → `POST /api/aiEmployee/conversations` (201)
- `GET aiConversations:get?sessionId=` → `GET /api/aiEmployee/conversations/{sessionId}`, now the conversation record with `llmActiveState`, and 404 instead of `idle` for a conversation that is not the caller's
- `PUT aiConversations:update` → `PATCH /api/aiEmployee/conversations/{sessionId}`; `PUT aiConversations:updateOptions` → `PUT /api/aiEmployee/conversations/{sessionId}/options`, which now replaces the options rather than merging into them; `DELETE aiConversations:destroy` → `DELETE /api/aiEmployee/conversations/{sessionId}` (204)
- `GET aiConversations:getMessages` → `GET /api/aiEmployee/conversations/{sessionId}/messages?pageToken=&pageSize=`. Reading no longer marks a conversation read; `updateRead` is replaced by `POST /api/aiEmployee/conversations/{sessionId}/markRead`, and `paginate=false` by `pageSize` (up to 200).
- `GET aiConversations:unreadCount` and `unreadCounts` → `GET /api/aiEmployee/conversations/unreadCount`, `{ data: { count } }`
- `POST aiConversations:sendMessages` / `resendMessages` / `resumeToolCall` / `resumeStream` → `POST /api/aiEmployee/conversations/{sessionId}/send` / `resend` / `resumeToolCall` / `resumeStream`, with `sessionId` taken from the path rather than the body. The SSE stream is unchanged; the request is now checked before it opens, so these answer in the standard error body instead of an `error` frame: a malformed body or one without a user message (400 `INVALID_INPUT`), an employee the body names that does not exist (400 `AI_EMPLOYEE_NOT_FOUND` on `aiEmployee`), a `messageId` the conversation does not have (400 `MESSAGE_NOT_FOUND`), an unknown conversation (404), a `resend` or `resumeToolCall` with nothing to run (400 `FAILED_PRECONDITION`: `AI_EMPLOYEE_NOT_FOUND`, `CONVERSATION_EMPTY`, `NO_TOOL_CALLS`), and the parallel run limit (429 `CONVERSATION_LIMIT_REACHED`). `stream` is no longer accepted.
- `POST aiConversations:abort` → `POST /api/aiEmployee/conversations/{sessionId}/abort`
- `POST aiConversations:updateUserDecision` → `PUT /api/aiEmployee/conversations/{sessionId}/messages/{messageId}/toolCalls/{toolCallId}/userDecision`, with the decision as the body
- `POST aiConversations:updateToolArgs` → `PATCH /api/aiEmployee/conversations/{sessionId}/messages/{messageId}/toolCalls/{toolCallId}` `{ args }`, answering 404 instead of `null` for an unknown tool call
- `GET aiConversations:listAll` → `GET /api/aiEmployee/managedConversations?q=&page=&pageSize=`, `{ data, meta: { page, pageSize, total } }`; `GET aiConversations:getAllMessages` → `GET /api/aiEmployee/managedConversations/{sessionId}/messages?pageToken=`; `GET aiConversations:listUsers?keyword=&limit=` → `GET /api/aiEmployee/conversationOwners?q=&page=&pageSize=`, `{ data, meta: { page, pageSize, total } }`. A managed conversation's `sessionId` that is not a UUID is now `400 INVALID_INPUT` from the path schema.

Responses and errors:

- Every JSON success is `{ data }`, and a list `{ data, meta }`; a history page reports `meta.nextPageToken` instead of `hasMore` and `cursor`. Lists read whole (roster, templates, employees, skills, tools, models, LLM providers and services, provider models, MCP servers, a user's own conversations) report `meta: { total }`. MCP `testConnection` keeps answering `{ data: { success, error } }`.
- Request bodies are limited: 1 MiB for JSON routes, 5 MiB for `send`, `resend` and `resumeToolCall`, and 20 MiB for `POST /api/aiEmployee/files` (`AI_FILE_UPLOAD_MAX_BYTES`, overridable through the routes' `uploadMaxSize` option). A larger body answers `413 BODY_TOO_LARGE`; an upload without a multipart content type answers `415 UNSUPPORTED_MEDIA_TYPE`. Nested request objects reject unknown fields.
- `GET /api/aiEmployee/files/{fileId}/preview` checks permission before existence: a caller without AI settings access gets `403 FILE_ACCESS_DENIED` for a missing id just as for another user's file; only a caller who may read any file sees `404 FILE_NOT_FOUND`.
- The employee settings page offers a knowledge base only when its `enabled` is the boolean `true`.
- Every failure uses the standard error body with domain `aiEmployees` instead of `{ errors: [{ message }], error }`, and its status no longer depends on the wording of the message. Reasons: `AI_SETTINGS_ACCESS_REQUIRED` and `FILE_ACCESS_DENIED` (403); `AI_EMPLOYEE_NOT_FOUND`, `SKILL_NOT_FOUND`, `TOOL_NOT_FOUND`, `LLM_SERVICE_NOT_FOUND`, `MCP_SERVER_NOT_FOUND`, `MCP_TOOL_NOT_FOUND`, `CONVERSATION_NOT_FOUND`, `MESSAGE_NOT_FOUND`, `TOOL_CALL_NOT_FOUND`, `FILE_NOT_FOUND` and `FILE_CONTENT_NOT_FOUND` (404, where several answered 400 before); the three `*_ALREADY_EXISTS` (409); `AI_EMPLOYEE_DISABLED`, `FRONTEND_TOOL_UNAVAILABLE` and `LLM_PROVIDER_NOT_FOUND` (`FAILED_PRECONDITION`); `UNSUPPORTED_MEDIA_TYPE` (415); `PROVIDER_MODELS_UNAVAILABLE` (503, instead of the provider's own status); and `INVALID_REQUEST` (400) for other refused requests. Invalid input answers `400 INVALID_INPUT` with a field violation for each problem, and an unknown body field is rejected.
- A run that fails over SSE keeps its `error` frame; an agent failure that is not streamed now reports 503 instead of 502 for provider failures and 400 instead of 422 for a recursion limit.
