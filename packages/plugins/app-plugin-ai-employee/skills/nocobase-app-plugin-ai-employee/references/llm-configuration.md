# Configure LLM services

Use this reference to configure LLM services, understand field synchronization, select models, and verify provider calls. The pre-start discovery and test commands support built-in providers; custom-provider discovery and existing services' model/enable state use the LLM services page. Service definitions and connection settings remain configuration-owned.

Register `@nocobase/app-plugin-ai-employee/cli` in `cli/plugins.ts` first. In `server/config/ai.ts`, use `defineAIConfig` from `@nocobase/app-plugin-ai-employee/server/config` instead of plain `defineAppConfig`, preserving existing `defaults` and `env`, so configuration checks validate the AI section.

## Built-in providers

| `provider`                     | Default base URL                                    |
| ------------------------------ | --------------------------------------------------- |
| `openai`, `openai-completions` | `https://api.openai.com/v1`                         |
| `deepseek`                     | `https://api.deepseek.com`                          |
| `kimi`                         | `https://api.moonshot.cn/v1`                        |
| `dashscope`                    | `https://dashscope.aliyuncs.com/compatible-mode/v1` |
| `xai`                          | `https://api.x.ai/v1`                               |
| `mimo`                         | `https://api.xiaomimimo.com/v1`                     |
| `orcarouter`                   | `https://api.orcarouter.ai/v1`                      |
| `shengsuanyun`                 | `https://router.shengsuanyun.com/api/v1`            |
| `mistral`                      | `https://api.mistral.ai`                            |
| `anthropic`                    | `https://api.anthropic.com`                         |
| `google-genai`                 | `https://generativelanguage.googleapis.com`         |
| `ollama`                       | `http://localhost:11434`                            |

Provider keys are case-sensitive. `openai` uses the Responses API; use `openai-completions` for gateways that only implement Chat Completions. `options.baseURL` overrides the default at the same path level: preserve `/v1` when the provider's default includes it. Do not invent a provider key or endpoint. See [provider capabilities](capabilities.md#what-each-provider-can-actually-do) when PDF input or built-in web search matters.

## Service fields

Declare services under `ai.llmServices`, keyed by service name. The object key is the service name and `ModelRef.llmService`; do not add a `name` field.

| Field                   | Meaning                                                                                                                                                                                                                                                                                                                                                   |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `title`                 | Display title. Defaults to the service name.                                                                                                                                                                                                                                                                                                              |
| `provider`              | Required registered provider key, such as `deepseek`. Provider keys are case-sensitive.                                                                                                                                                                                                                                                                   |
| `options`               | Provider-specific connection options. Use `apiKey` for the secret and `baseURL` only when overriding the provider default.                                                                                                                                                                                                                                |
| `enabledModels`         | Optional `{ label, value }[]` model choices. Use real IDs returned by `ai-employee models`; do not guess them. It initializes the service's model list when the service is first created.                                                                                                                                                                 |
| `overrideEnabledModels` | Optional boolean, default `false`. When `true`, reapplies `enabledModels` on every load and overwrites model choices made in the UI.                                                                                                                                                                                                                      |
| `modelOptions`          | Optional object storing model settings such as `temperature`, `topP`, `frequencyPenalty`, and `presencePenalty`. When the whole object is omitted, defaults are `1`, `1`, `0`, and `0` respectively; a supplied object is not merged with those defaults. Provider/model support and whether a caller forwards these settings must be checked separately. |
| `enabled`               | Optional boolean, default `true`. Applies when the database service is first created; later administrator state is preserved.                                                                                                                                                                                                                             |
| `sort`                  | Optional numeric ordering among services. Defaults to `0`; lower values appear first and influence the default model selection.                                                                                                                                                                                                                           |

Example:

```yaml
ai:
  llmServices:
    deepseek:
      title: DeepSeek
      provider: deepseek
      # options.apiKey: set privately; see API keys below
      modelOptions:
        temperature: 0.2
      enabled: true
      sort: 10
```

`options` and `modelOptions` are replaced, not merged, when a configured service is synchronized. If either is omitted, the service receives `{}` for `options` and the default `modelOptions`. Keep the complete intended object in configuration when those settings matter.

The configured service-name set is authoritative: services absent from `config.yml` are deleted during synchronization. Non-model fields (`title`, `provider`, `options`, `modelOptions`, and `sort`) are reapplied on every load. `enabledModels` and `enabled` normally preserve the database state after first creation, so later edits to those fields do not change an existing service unless `overrideEnabledModels: true` is set for the model list. The enable switch remains an administrator decision even when `enabled: true` is configured.

When `overrideEnabledModels` is enabled, tell the user that UI model selections will be overwritten on the next load. The setting is per service and should be used only when the model list belongs in configuration or source control.

A service entry with an invalid shape, an empty `provider`, an unexpected field type, or a non-boolean `overrideEnabledModels` fails configuration validation. Declare the AI section with `defineAIConfig`; otherwise `config check` may not validate it.

## Default model and selection boundaries

Enabled services are ordered by `sort`, then name; the chat initially selects the first model in the first service's enabled list. Configure that list at creation or deliberately use `overrideEnabledModels`; otherwise the database list determines the order.

An employee's own model settings take precedence: the chat offers only that employee's currently enabled models, in employee order, and selects the first. If none is enabled, chat cannot send and agent creation fails with `CONFIGURATION_ERROR` rather than falling back. Service `enabledModels` alone is not an access boundary: callers explicitly naming an unlisted model can still run outside the employee-specific restriction.

## Configure the service

The agent configures all non-secret LLM service fields itself, including the service entry, provider, title, any user-specified endpoint or model options, and selected models; do not ask the user to run these configuration steps. Only key entry belongs to the user. Use `config set` for non-secret scalar fields and silent targeted updates for structured values. Preserve existing credentials and unrelated configuration; keep provider defaults unless an override is needed. Declare the service under its name in `ai.llmServices`, without a `name` field, and leave `enabledModels` out until the user selects real IDs returned by the provider.

Keep the server stopped and run `pnpm nocobase config check --no-connect`. The user sets any missing key themselves with the `config set --from-env` guidance from the check. Never ask for, retrieve, or expose a key, configuration content, `.env`, or environment values.

### Configuration commands

Run these commands from the application directory with its server stopped. The agent sets non-secret scalar fields using dotted `key=value` assignments; one invocation can set multiple fields:

```bash
pnpm nocobase config set ai.llmServices.deepseek.provider=deepseek ai.llmServices.deepseek.title=DeepSeek
pnpm nocobase config check --no-connect
```

`config set` writes the application's configuration file. Values are YAML scalars (for example, `true` is a boolean and `10` is a number); it does not accept lists or maps. Use the silent targeted update described below for `enabledModels`. No `baseURL` assignment is needed for the official DeepSeek endpoint.

For key entry, give the user the following form to run privately after they have made their key available in their local environment:

```bash
pnpm nocobase config set --from-env ai.llmServices.deepseek.options.apiKey=DEEPSEEK_API_KEY
```

The right-hand side is the environment variable's name, not the key value. This copies its value into the configuration file; it does not create a runtime environment mapping. The agent must not inspect the variable. After the user confirms setup, the agent reruns the configuration check.

| Command                                   | What it checks                                                                                                                     |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm nocobase config check --no-connect` | Loads final configuration and validates it without connecting to any database. Prefer this during pre-start LLM setup.             |
| `pnpm nocobase config check`              | Also checks connections to configured non-SQLite databases by default. It does not start the application or run SQL or migrations. |

Errors produce a non-zero exit code; warnings alone do not unless `--strict` is added. A successful check does not prove that an API key works or that a model is callable; use the discovery and test commands below. For other flags, run `pnpm nocobase config set --help` or `pnpm nocobase config check --help`; general conventions are in the `nocobase-app-development` Skill's `references/cli.md`.

## Discover and save models

Run `pnpm nocobase ai-employee models <service> --json`, optionally with `--search keyword`, and let the user choose the returned IDs. A local script may silently update only `ai.llmServices.<service>.enabledModels`, preserving all other configuration, secrets, and comments. Do not output the file or sensitive parser errors. Run `pnpm nocobase config check --no-connect` after the update and keep the server stopped until the user confirms startup.

Save each selected model as `{ label: <display name>, value: <returned model ID> }` in `enabledModels`; put the desired default first. If a service was already initialized with an empty or incorrect list, merely editing `enabledModels` with the default `overrideEnabledModels: false` does not repair it: use the settings page or deliberately enable configuration ownership as described above.

Both commands use final configuration, including environment mappings, without startup or database access; neither writes configuration. `--search` filters IDs by case-insensitive substring. `--json` returns the standard `{ schemaVersion: 1, ok, command, status, result | error, warnings }` envelope: check `ok` and the exit status before using `result`. `models` returns `{ service, provider, models: [{ id }] }`; `test` returns `{ service, provider, model, callable: true }`. A listed ID does not prove callability. Never probe credentials with raw HTTP requests or configuration dumps after a command fails.

## Verify one model by default

After the user approves a potentially paid request, run `pnpm nocobase ai-employee test <service> --model <id> --json`. Test the user's specified model, or the first selected model when none is specified. Test every selected model only when the user explicitly asks for it. Report the IDs actually tested and do not imply that untested models passed.

The command sends a minimal completion and returns only callability. It does not print the completion, start the server, access the database, enable models, or update persisted model lists. A successful test does not replace a real chat verification.

## Existing services and custom providers

`enabledModels` initializes the database service record when it is first created. For a service that already exists, use `/settings/ai/llm-services` to choose and enable models unless `overrideEnabledModels: true` is deliberately configured; that option reapplies the configuration list on every load and overwrites UI selections.

Custom providers are registered during application startup, so the CLI cannot discover or test them. Start the application and use the LLM services page, then verify with a real chat.

## API keys

Keep `config.yml` ignored and untracked; for an App without Git yet, confirm `.gitignore` lists `/config.yml`. The user sets `ai.llmServices.<service>.options.apiKey` privately through `config set --from-env`; MCP credentials use `ai.mcpServers.<name>.headers.<Header>` or `.env.<VAR>`. Rerun `config check` after the user confirms setup.

For runtime-injected secrets, map the variable in `env` of `server/config/ai.ts`, such as `OPENAI_API_KEY: envString('llmServices.openai.options.apiKey')`, importing `envString` from `@nocobase/app-server/config`. Keep `defineAIConfig` and existing defaults. Map only declared services; mapped values override the file. A header variable contains the whole value, including `Bearer`. Verify mappings with `config env`, without printing values; changed mapping code requires rebuilding a deployment.

An existing server needs a restart after key changes. Keep a new service stopped until its models are configured: `pnpm dev` auto-restarts on configuration edits and could otherwise initialize an empty list. Deployments have separate configuration; follow the `nocobase-deployment` Skill.

## Safety

A local configuration update may read and write `config.yml` inside the process to update only the intended non-secret service fields. Its output must contain only changed paths or a safe success message. Preserve existing secrets, unrelated fields, and comments; never expose file content, keys, environment values, or sensitive error excerpts.
