# Model services

Agents run on runners and do not use model services. The plugin keeps model services for the App's own model calls, such as a knowledge base's embeddings, reranking and short texts. The README's "Model services" and "Vectors" sections are the reference.

## Model services

- A service is a provider type (`MODEL_PROVIDERS` in `@nocobase/app-plugin-agents/shared/models`: OpenAI, Anthropic, Google, DeepSeek, Alibaba, Moonshot, Cohere, Ollama, and OpenAI-compatible endpoints), a name, a base URL, a write-only API key sealed with the secrets service, an on/off switch and the models it offers. OpenCode Zen and Go serve each model family through its own API under one base URL: DeepSeek, GLM, Kimi and MiMo through a DeepSeek or OpenAI-compatible service, Claude, MiniMax and Qwen through an Anthropic one, GPT and Grok through an OpenAI one; a call to an OpenCode base URL sends `x-opencode-session` automatically. Each model has a kind: `chat` (short texts), `embedding` or `rerank`.
- Services are added on the Models page (`modelsRoute`, behind `agents.services`) or through the API (`service create|discover|check` on the CLI). They are never configured in `config.yml`.
- `GET /api/agents/models` (anyone signed in) lists the models of a kind the enabled services offer; `POST /api/agents/checkModel` (who reads agents) tests one with a short call and never throws.
- The default chat model is the chat model used where nothing names one. With none set, the first chat model an enabled service offers becomes it; the App sets another with `models.services.setDefaultChat(ref, byUserId)` on `agentsToken`. `GET /api/agents/defaultModels` (anyone signed in, `model defaults` on the CLI) answers it as set and as used now, and the Models page marks it in its service's row.

## The model gateway

`models.gateway` on `agentsToken` serves the App's own model calls: `catalog(kind)`, `check(ref)`, `embed({ model, values, source })`, `rerank({ model, query, documents, topN?, source })` and `generate({ model, system?, prompt, maxOutputTokens?, source })`. Each names who asks (`source`), is recorded in `agModelUsage` and priced from the service's model prices, and throws `ModelError` with a code (`config`, `auth`, `quota`, `rateLimit`, `network`, `contextOverflow`, `filtered`, `badResponse`, `aborted`, `unknown`). Use it rather than calling a provider SDK, so keys, usage and prices stay in one place.

## Vectors

`vectors.collection(spec)` gives the App semantic search over items it names, embedded with the model it chooses, in the store `agents.vectors` configures (`sqlite-vec` by default, `pgvector` for several instances or Alpine). `status()` answers availability and a `VectorUnavailableCode` when it is not available; then search answers null and the caller keeps its keyword search. See the README's "Vectors" section.
