---
'@nocobase/app-cli': patch
'@nocobase/app-skills': patch
'@nocobase/app-template-default': patch
'@nocobase/app-template-examples': patch
---

Follow `ai.llmServices` becoming a map keyed by service name, with `${NAME}` no longer expanded

`config check` now reports a `${NAME}` under `ai.llmServices` and `ai.mcpServers` as literal text, as it already did for every other section, since the AI employee plugin no longer expands one. The application development Skill no longer names the AI sections as an exception.

The templates default `ai.llmServices` to an empty map and declare `server/config/ai.ts` with the AI employee plugin's `defineAIConfig`, so `config check` validates the section and warns about a service with no key, and with an empty `env` for an application's own mappings. The commented AI example in `config.example.yml` shows the map form without a key, says how to set one with `pnpm nocobase config set --from-env`, and no longer claims that a change applies without a restart: a standalone server reads the file when it starts, and `pnpm dev` restarts on its own.
