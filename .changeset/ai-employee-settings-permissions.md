---
'@nocobase/app-plugin-ai-employee': major
'@nocobase/app-template-default': patch
'@nocobase/app-template-examples': patch
---

Grant the AI employee settings in Permission Sets under System management → AI, one settings item per settings page, instead of through the single `{ type: 'page', id: 'ai.settings' }` page grant, and remove the management routes no settings page called.

The items are `ai.employees`, `ai.llmServices` and `ai.mcpServers` with `read` and `manage`, and `ai.skills`, `ai.tools`, `ai.usage` and `ai.conversations` with `read`. `read` opens a page and reads what it shows; `manage` saves an employee, enables an LLM service or MCP server, chooses an LLM service's models (reading its provider's catalog included) and sets an MCP tool's permission. `manage` does not include `read`, and without `manage` a page shows its settings read-only. Every management route now names the permissions it accepts in its API document description and answers 403 `AI_SETTINGS_ACCESS_REQUIRED` without any of them. The employee list also accepts `read` on `ai.conversations`, for the conversation center's employee filter, and the skill and tool lists accept `read` on `ai.employees`, for the employee editor. Previewing another user's AI file now requires `read` on `ai.conversations`.

**Breaking.** A grant of every page (`{ type: 'page', id: '*' }`) no longer opens the AI settings, and code that grants `{ type: 'page', id: 'ai.settings' }` grants nothing any more; grant the items through `authz.settings.grant()` or a Permission Set instead. The migration `202610070001_ai_employee_settings_permissions` gives every item and action to each stored Permission Set that held the `ai.settings` page grant, so whoever managed AI before keeps exactly that; a Permission Set that granted only every page has to be given the items it should hold.

**Breaking.** These routes are removed, because no settings page called them: `GET /api/aiEmployees/templates`, `POST /api/aiEmployees`, `DELETE /api/aiEmployees/{username}`, `POST`, `PATCH` and `DELETE` on `/api/aiEmployee/skills` and `/api/aiEmployee/tools`, `GET /api/aiEmployee/llmServices/{name}`, `GET /api/aiEmployee/mcpServers/{name}`, `POST /api/aiEmployee/mcpServers/testConnection` and `POST /api/aiEmployee/mcpServers/{name}/testConnection`. Employees, skills and tools are registered in code, and the lists carry what the single-record reads returned. `testConnection` is no longer a reserved MCP server name, and `templates` no longer a reserved employee username.

The application templates' page-permission tests no longer expect the AI employee plugin to offer a page grant, and check that each of its settings pages requires `read` on an AI settings item.
