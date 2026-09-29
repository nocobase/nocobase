---
'@nocobase/app-plugin-ai-employee': minor
---

Check `ai.llmServices` in `config check`, and warn about a service with no key

`defineAIConfig`, exported from `@nocobase/app-plugin-ai-employee/server/config`, declares the `ai` section with the plugin's validation, the way `defineAuthConfig` does for `auth`. With it, `pnpm nocobase config check` reports a structural problem in `ai.llmServices` — the list form, a `name` field, a wrong field type or an empty `provider` — as an error by path, instead of the start failing on it later. A service whose built-in provider sends `options.apiKey` and has none is reported as a warning naming that path, with the `config set --from-env` command that sets it; `ollama` and providers an application registers are not checked. An application that keeps a plain `defineAppConfig` for `ai` still starts, with the section unchecked until then; switch `server/config/ai.ts` to `defineAIConfig` to get the checks.
