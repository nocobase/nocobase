---
'@nocobase/app-plugin-ai-employee': minor
---

Key `ai.llmServices` by service name, and stop expanding `${NAME}` in AI configuration

**Breaking.** `ai.llmServices` is now a map keyed by service name, like `ai.mcpServers`, instead of a list of entries that each carry a `name`. The list form, and a `name` field inside an entry, are rejected at startup with a message naming the path. Each service therefore has a stable configuration path, such as `ai.llmServices.openai.options.apiKey`, which `pnpm nocobase config set` can write and an `env` mapping can target; neither can address an item of a list.

**Breaking.** `${NAME}` in `ai.llmServices` and `ai.mcpServers` is no longer expanded, and `expandEnvironmentReferences` is no longer exported. The plugin read those values from `process.env`, which a built server started with `pnpm start` does not merge `.env` into, so a key kept in `.env` became an empty string there. A key is now written into `config.yml` with `pnpm nocobase config set --from-env`, like a database password. Where a service manager, container or CI injects it instead, the application maps the variable in `env` of `server/config/ai.ts`, which reads the process environment together with `.env` and `.env.local` in development and in a built server alike, and `pnpm nocobase config env` lists it.

The plugin's Skill follows: an agent writes the service entry without the key and without invented model ids, tells the user the key's path to set rather than asking for the key or building a command that reads one, and has the models picked on the LLM services page, which fetches them from the provider with the configured key.

To upgrade an application:

1. In `config.yml`, and in `config.example.yml` if it lists services, move each `ai.llmServices` entry under its name and delete its `name` field — `- name: openai` followed by its fields becomes `openai:` followed by the same fields.
2. For each `${NAME}` under `ai.llmServices` or `ai.mcpServers`, write the value into the untracked `config.yml` with `pnpm nocobase config set --from-env <path>=<VARIABLE>`, such as `ai.llmServices.openai.options.apiKey=OPENAI_API_KEY`. Where the environment injects the key instead, remove the value and map the variable in `server/config/ai.ts`, declaring the section with `defineAIConfig` from `@nocobase/app-plugin-ai-employee/server/config` in place of `defineAppConfig`: `env: { OPENAI_API_KEY: envString('llmServices.openai.options.apiKey') }`, with `envString` from `@nocobase/app-server/config`. Either way the value is the whole field, so a header such as `Authorization: Bearer ${TOKEN}` needs `Bearer <token>`.
3. Run `pnpm nocobase config check`, which now warns about any `${NAME}` left in either section, and `pnpm nocobase config env` when a variable is mapped.
