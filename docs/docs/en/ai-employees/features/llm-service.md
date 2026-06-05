# Configure LLM Service

Before using AI Employees, configure available LLM services first.

Supported providers include OpenAI, Gemini, Claude, DeepSeek, Qwen, Kimi, and Ollama local models.

## Create Service

Go to `System Settings -> AI Employees -> LLM service`.

1. Click `Add New` to open the creation dialog.
2. Select `Provider`.
3. Fill `Title`, `API Key`, and `Base URL` (optional).
4. Configure `Enabled Models`:
   - `Recommended models`: use officially recommended models.
   - `Select models`: select from the provider model list.
   - `Manual input`: manually enter model ID and display name.
5. Click `Submit`.

![llm-service-create-provider-enabled-models.png](https://static-docs.nocobase.com/ai-employees/2026-02-14/llm-service-create-provider-enabled-models.png)

## Enable and Sort Services

In the LLM service list, you can:

- Toggle service status with the `Enabled` switch.
- Drag to reorder services (affects model display order).

![llm-service-list-enabled-and-sort.png](https://static-docs.nocobase.com/ai-employees/2026-02-14/llm-service-list-enabled-and-sort.png)

## Availability Test

Use `Test flight` at the bottom of the service dialog to verify service and model availability.

It is recommended to run this test before production use.
