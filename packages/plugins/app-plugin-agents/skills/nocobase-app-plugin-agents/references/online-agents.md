# Online agents and model services

An online agent talks to a model of a model service and is run by the App itself, on every instance (`agents.server.enabled`), through the same claim as runner runs: it needs no runner and answers in seconds. Its tools are a sandboxed in-process shell (`bash`, no real processes or network) carrying the App's CLI, and `skill`, which reads one of the run's skills. The README's "What it does" (Online runs) and "Online agents" sections are the reference.

## Model services

- A service is a provider type (`MODEL_PROVIDERS` in `@nocobase/app-plugin-agents/shared/models`: OpenAI, Anthropic, Google, DeepSeek, Alibaba, Moonshot, Cohere, Ollama, and OpenAI-compatible endpoints), a name, a base URL, a write-only API key sealed with the secrets service, an on/off switch and the models it offers. Each model has a kind: `chat` (what agents talk to), `embedding` or `rerank`.
- Services are added on the Models page (`modelsRoute`, behind `agents.services`) or through the API (`service create|discover|check` on the CLI). They are never configured in `config.yml`.
- The system default chat model (Models page, `PUT /api/agents/defaultModels/chat`) is what an online agent that lists no model answers with. With none set, the first chat model an enabled service offers is used.
- An online agent lists ordered entries (service, model, effort); its first is the default. A conversation may pick another of the agent's entries. A failing model fails the run; nothing falls back to another entry.
- `GET /api/agents/models` (anyone signed in) lists what agents may use; `POST /api/agents/checkModel` (who reads agents) tests one with a short call and never throws.

## The model gateway

`online.gateway` on `agentsToken` serves the App's own model calls outside runs: `catalog(kind)`, `check(ref)`, `embed({ model, values, source })`, `rerank({ model, query, documents, topN?, source })` and `generate({ model, system?, prompt, maxOutputTokens?, source })`. Each names who asks (`source`), is recorded in `agModelUsage` and priced like runs, and throws `ModelError` with a code (`config`, `auth`, `quota`, `rateLimit`, `network`, `contextOverflow`, `filtered`, `badResponse`, `aborted`, `unknown`). Use it rather than calling a provider SDK, so keys, usage and prices stay in one place.

`online.skills.register(skill)` adds a skill every online run gets besides its own, typically the App's CLI skill.

## Commands in an online run

The run's shell carries the App's CLI, built from the command manifest for the run (the actions of the waking person that the agent is configured with). Each command is one request through the App with the run's token, so the route checks the permission again. Commands that send or save files are refused. A route therefore needs `runToken` in its `security` and an `x-cli` `action` the gate allows before an online agent can call it.

Run limits: `agents.server.maxSteps` model calls (then `stepLimit`); a cancel aborts within a second; at shutdown an instance hands its runs back (`runnerOffline`).

## Consultations

An online run may ask another online agent a question (`ask_agent`), synchronously, in a read-only child run (`parentRunId`) bounded by `agents.server.consult.timeoutMs` and `tokenBudget`, at most `CONSULT_MAX_DEPTH` deep. The gate keeps a consultation to reading actions plus those `ActionGate.consultable` allows. See the README's "Consultations" section.

## Vectors

`vectors.collection(spec)` gives the App semantic search over items it names, embedded with the model it chooses, in the store `agents.vectors` configures (`sqlite-vec` by default, `pgvector` for several instances or Alpine). `status()` answers availability and a `VectorUnavailableCode` when it is not available; then search answers null and the caller keeps its keyword search. See the README's "Vectors" section.
