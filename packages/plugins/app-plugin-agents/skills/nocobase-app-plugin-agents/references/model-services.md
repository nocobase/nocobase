# Model services

Agents run on runners and do not use model services. The plugin keeps model services for the App's own model calls, such as a knowledge base's embeddings, reranking and short texts. The README's "Model services" section is the reference.

## Model services

- A service is a provider type (`MODEL_PROVIDERS` in `@nocobase/app-plugin-agents/shared/models`: OpenAI, Anthropic, Google, DeepSeek, Alibaba, Moonshot, Cohere, Ollama, and OpenAI-compatible endpoints), a name, a base URL, a write-only API key sealed with the secrets service, an on/off switch and the models it offers. OpenCode Zen and Go serve each model family through its own API under one base URL: DeepSeek, GLM, Kimi and MiMo through a DeepSeek or OpenAI-compatible service, Claude, MiniMax and Qwen through an Anthropic one, GPT and Grok through an OpenAI one; a call to an OpenCode base URL sends `x-opencode-session` automatically. Each model has a kind: `chat` (short texts), `embedding` or `rerank`.
- Services are added on the Models page (`modelsRoute`, behind `agents.services`) or through the API (`service create|discover|check` on the CLI). They are never configured in `config.yml`.
- `GET /api/agents/models` (anyone signed in) lists the models of a kind the enabled services offer; `POST /api/agents/checkModel` (who reads agents) tests one with a short call and never throws.

## The model gateway

`models.gateway` on `agentsToken` serves the App's own model calls: `catalog(kind)`, `check(ref)`, `embed({ model, values, source })`, `rerank({ model, query, documents, topN?, source })` and `generate({ model, system?, prompt, maxOutputTokens?, source })`. Each names who asks (`source`), is recorded in `agModelUsage` and priced from the service's model prices, and throws `ModelError` with a code (`config`, `auth`, `quota`, `rateLimit`, `network`, `contextOverflow`, `filtered`, `badResponse`, `aborted`, `unknown`). Use it rather than calling a provider SDK, so keys, usage and prices stay in one place.

## Legacy vector collections

Agents 2 removes the legacy vector collection service. Use the model gateway for Embedding; Knowledge owns its independent document indexing and storage. Before upgrading an existing integration, read `@nocobase/app-plugin-agents/docs/vectors-migration.md`. There is no automatic conversion of legacy collections.


Use `models.gateway.search({ model, queries, sessionId, signal, source })` for retrieval through admitted providers and `models.gateway.fetch({ model, url, source, signal? })` for DeepSeek page Markdown. DeepSeek calls its official Search / Fetch APIs with the existing service key and official root Base URL; Responses `web_search` is not used. Search sources preserve provider-returned snippets, summaries and bodies. Every actual DeepSeek request records `search` / `fetch` usage, including failures, and throws distinguishable `ModelError` categories. Compose with `generate()` using untrusted evidence and keep citation URLs from retrieval. Read `docs/native-web-search.md` in this package for endpoint admission, bounds and request-based pricing; usage rows count attempts rather than billed successes.
