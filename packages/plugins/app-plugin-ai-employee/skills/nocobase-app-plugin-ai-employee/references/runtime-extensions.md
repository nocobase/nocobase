# Runtime Extensions

What an App reaches through the `AIManager` beyond what an `AIResourceRegistrar` registers: tools that depend on who is asking, model lookups, a custom LLM provider, and a direct model call.

## Table of contents

- [When to go past the registrar](#when-to-go-past-the-registrar)
- [Reaching the manager](#reaching-the-manager)
- [Dynamic tools](#dynamic-tools)
- [LLM services and model lookups](#llm-services-and-model-lookups)
- [A custom LLM provider](#a-custom-llm-provider)
- [A direct model call](#a-direct-model-call)
- [Not for an App](#not-for-an-app)

## When to go past the registrar

Employees and tools are registered only through an `AIResourceRegistrar` subclass, and Skills only as `SKILL.md` files under `ai/skills` or a directory listed in `config.yml` `ai.skills.paths`, as [server-runs.md § Register App resources](server-runs.md#register-app-resources) shows — including when a definition is computed from another service, since the registrar's methods run in the App's own `boot()`. Reach for the `AIManager` itself only for:

- a tool set that depends on who is asking;
- an LLM backend no built-in provider speaks;
- reading which models exist at runtime, or making one business model call with no conversation.

For setup-time model discovery and callability checks, follow [Configure LLM services](llm-configuration.md) instead of writing App code.

## Reaching the manager

Resolve `aiManagerToken` from the App container in a `ServiceProvider.boot()` that runs after the AI Employee plugin's provider has booted — the Provider that runs the registrar is the natural place:

```ts
import type { Application } from '@nocobase/app-server/application';
import { aiManagerToken } from '@nocobase/app-plugin-ai-employee/server';
import { ServiceProvider } from '@nocobase/service-provider';
import AppAIResources from '../ai/index.js';
import { companyProviderOptions } from '../ai/company-provider.js';

export default class AIResourcesProvider extends ServiceProvider<Application> {
  public readonly name = 'app/ai-resources';

  public override async boot(): Promise<void> {
    const ai = this.app.container.resolve(aiManagerToken);
    ai.llmProviderManager.registerLLMProvider(
      'company',
      companyProviderOptions,
    );
    await new AppAIResources({ source: 'application' }).registerAIResources(ai);
  }
}
```

A tool that needs the manager declares it rather than closing over it: `dependencies: { ai: aiManagerToken }` gives the tool `ctx.deps.ai`. A tool that declares nothing has no `ctx.deps.ai`; there is no ambient handle.

## Dynamic tools

`registerTools()` registers a fixed tool. `registerDynamicTools(provider)` registers a function that produces tools each time tools are looked up — for a tool set that depends on who is asking, not merely on which services a tool uses:

```ts
ai.toolsManager.registerDynamicTools(async (register, filter) => {
  if (!filter?.ctx) return;
  await register.registerTools(await toolsFor(filter.ctx));
});
```

- The provider runs whenever tools are listed, and on a lookup by name that no fixed tool answers; `isToolsExisted()` never runs it. What it registers is not kept, so it is cheap and repeatable or it is neither.
- `filter` is the lookup's own: `scope`, `defaultPermission`, `silence`, `sessionId`, and `ctx`. An employee run passes its `AgentContext` as `ctx`. `createAgent()` looks its tools up by name without one, so a provider that returns nothing without `ctx` gives a fixed agent nothing.
- A `GENERAL` tool produced this way reaches every employee whose tool selection has never been saved, like any other `GENERAL` tool; see [capabilities.md § How Skills and Tools relate](capabilities.md#how-skills-and-tools-relate).

The rest of the tools manager: `getTools(name, filter?)`, `listTools(filter?)`, `isToolsExisted(name)`, and `unregisterTools(name | name[])`, which returns how many it removed.

## LLM services and model lookups

LLM services belong in `config.yml` `ai.llmServices` — see [Configure LLM services](llm-configuration.md). `llmServiceManager.registerLLMService()` exists, but the configured name set is authoritative: every configuration load deletes the services it does not list, so a service registered from code disappears on the next one.

The provider manager answers questions an App asks at run time:

| Call                                                           | Returns                                                                                                                                             |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `listLLMProviders()`                                           | the registered providers and what each supports                                                                                                     |
| `listAllEnabledModels()`                                       | every enabled service with its enabled models, as the chat's selector lists them                                                                    |
| `resolveModel(requested?)`                                     | a requested `{ llmService, model }` unchanged, without checking that it is enabled; otherwise the first enabled model, rejecting when there is none |
| `getLLMService({ llmService, model, webSearch?, reasoning? })` | a provider instance for that model, for a [direct model call](#a-direct-model-call)                                                                 |
| `createEmbedding({ llmService, model })`                       | an embeddings client, for a provider that declares one                                                                                              |

## A custom LLM provider

Write one only when no built-in provider speaks the backend's protocol. A backend that is OpenAI-compatible needs no code: configure a service with the matching built-in provider and its `baseURL`.

**The chat provider** extends `LLMProvider` and builds the LangChain chat model:

```ts
import { LLMProvider } from '@nocobase/ai-employee';
import { ChatOpenAI } from '@langchain/openai';

export class CompanyProvider extends LLMProvider {
  public get baseURL(): string {
    return 'https://llm.example.com/v1';
  }

  public createModel(): ChatOpenAI {
    const { apiKey } = this.serviceOptions;
    const { model, ...modelOptions } = this.modelOptions ?? {};
    return new ChatOpenAI({
      apiKey,
      model,
      ...modelOptions,
      configuration: { baseURL: this.getResolvedBaseURL() },
    });
  }
}
```

- The LangChain model package — `@langchain/openai` here — is imported by the App's server code, so it goes in the App's `dependencies`, not `devDependencies`.
- `serviceOptions` is the service's `options` from `config.yml`, with any mapped environment variables applied; `modelOptions` holds the `llmService` and the selected `model`, plus `builtIn: { webSearch: true }` when search was asked for; the service's model options are not in it.
- The manager also constructs the class with no options, to read its capabilities. `createModel()` runs only when `modelOptions` is given, so neither the constructor nor a field initializer may require a key or a model.
- `getResolvedBaseURL()` returns the service's `options.baseURL` when set, otherwise the class's `baseURL`, checked against the URL whitelist. Build request URLs with it, or with `buildRequestURL(path)`, never by hand.

**An embedding provider** is a separate class, needed only when the backend serves embeddings — for instance for a knowledge base:

```ts
import { EmbeddingProvider } from '@nocobase/ai-employee';
import { OpenAIEmbeddings } from '@langchain/openai';

export class CompanyEmbeddingProvider extends EmbeddingProvider {
  protected getDefaultUrl(): string {
    return 'https://llm.example.com/v1';
  }

  public createEmbedding(): OpenAIEmbeddings {
    return new OpenAIEmbeddings({
      apiKey: this.apiKey,
      model: this.model,
      configuration: { baseURL: this.baseURL },
    });
  }
}
```

`apiKey` and `model` throw when the service does not supply them; `baseURL` falls back to the class's own, and throws only when neither is set or the URL fails the whitelist.

**Register it** under a key, with its metadata:

```ts
import { SupportedModel, type LLMProviderMeta } from '@nocobase/ai-employee';

export const companyProviderOptions: LLMProviderMeta = {
  title: 'Company LLM',
  provider: CompanyProvider,
  embedding: CompanyEmbeddingProvider,
  supportedModel: [SupportedModel.LLM, SupportedModel.EMBEDDING],
  models: { [SupportedModel.EMBEDDING]: ['company-embedding'] },
  supportWebSearch: false,
};
```

The Provider in [Reaching the manager](#reaching-the-manager) registers it from `boot()`; never at module level, where there is no manager yet.

- `supportedModel` decides where the provider is offered; list both kinds explicitly when both exist.
- `models` suggests embedding model ids for the embedding picker, and nothing else. Chat models are always fetched from the provider's own API through `ai:listProviderModels`.
- `supportWebSearch` and `webSearchModels` are what `subAgentWebSearch` checks before it searches; claim them only for a backend that searches, and implement `builtInTools()` and `parseWebSearchAction()` to match.
- Registering under a built-in key, such as `openai`, replaces that provider for the whole App. Treat it as a decision to confirm with the user, not a way to customize one service.

**Then configure a service** in `config.yml` whose `provider` is exactly the registered key:

```yaml
ai:
  llmServices:
    company-production:
      title: Company Production
      provider: company # options.apiKey: see llm-configuration.md § API keys
      enabledModels:
        - label: Company Chat
          value: company-chat
```

The configuration is read while the AI Employee plugin boots, before an App Provider has registered its provider, and nothing rejects the unknown key then: a service is matched to its provider only when it is used. Until the provider is registered, the service is simply absent from the model selector.

**Override only what the backend does differently**: `listModels()` for model discovery; `parseResponseMessage()` and `parseResponseChunk()` for response shape; `parseReasoningContent()` for streamed reasoning; `builtInTools()`, `parseWebSearchAction()` and `isToolConflict()` for native search; `getStructuredOutputOptions()` for structured output; `resolveReasoningOptions()` for reasoning parameters; `isApiSupportedAttachment()` for files the backend reads natively; `prepareStoredAssistantAdditionalKwargs()` for response metadata that has to survive storage; `parseResponseMetadata()` and `parseResponseError()` for usage and failures. Start from the built-in provider nearest the backend's protocol.

The pre-start `ai-employee models` and `test` commands use built-in providers only: they do not run the App Provider's `boot()`, so they cannot discover or test this custom implementation, even when it replaces a built-in key. Use the running application's LLM services page and chat instead.

**Verify it** in the App: the provider appears in AI settings; construction with no options succeeds; a configured service resolves through `getLLMService()`; a chat with that model answers; a missing key and a backend error each produce a readable failure; and embeddings work if declared. Follow [API key guidance](llm-configuration.md#api-keys), and never log `serviceOptions`.

## A direct model call

For one model call with no conversation — no history, no tool loop, no persistence — `getLLMService()` returns a provider to call:

```ts
const { provider } = await ai.llmProviderManager.getLLMService({
  llmService: 'company-production',
  model: 'company-chat',
});
const reply = await provider.invoke({
  messages: [
    {
      role: 'system',
      content: 'Classify the ticket as billing, bug or other.',
    },
    { role: 'user', content: ticket.body },
  ],
});
```

- `messages` is sent as it is. The system prompt is a `role: 'system'` message at its start; there is no separate field.
- `structuredOutput` binds a JSON schema. `tools` takes registered tool entities, such as those `toolsManager.getTools()` and `listTools()` return — not bare `{ name, description, schema }` definitions, which type-check and fail when called; pass `toolContext: { agentContext, container }` to give each tool the context and declared dependencies an agent would — without it a tool that needs a context fails when it is called. A direct call runs no tool loop, so the reply's tool calls are the caller's to handle.
- Built-in web search (`webSearch: true`) is for a call without tools: passing both logs a warning, and on a provider that cannot combine them the tools are not bound.

Anything that needs tools to run, a pause for approval, or a stored conversation is an agent, not a direct call; see [server-runs.md](server-runs.md#when-to-drive-an-agent-directly).

## Not for an App

- **`ai.features.enableFeatures()`** is how a capability plugin, such as the knowledge base, attaches its implementation; an App provides none of them.
- **MCP servers from code**: `mcpServerManager.registerMCP()` works, but the configuration sync deletes every server `config.yml` does not list. MCP belongs in `ai.mcpServers`; see [capabilities.md § MCP servers](capabilities.md#mcp-servers-configyml).
- **`switchRepository()`** on the employee, LLM service and MCP server managers moves where the plugin stores their state. The plugin does this at start; an App never does.
- **A second `AIManager`** from `createAIManager()`; see [source-map.md § The installed dependency](source-map.md#the-installed-dependency).
