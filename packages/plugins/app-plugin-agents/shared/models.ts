/**
 * The models online agents talk to, as the browser and the API exchange them: the model services this plugin keeps
 * (`agModelServices`), the providers a service can use, and the catalog of what the enabled services offer. Every
 * answer is `{ data }`; a list is `{ data, meta: { total } }`.
 *
 * | Method | Path                                 | Needs                    | Body                          | `data`                     |
 * | ------ | ------------------------------------ | ------------------------ | ----------------------------- | -------------------------- |
 * | GET    | `agents/models`                      | a session                | `?kind=` (chat by default)    | `ModelService[]` (catalog) |
 * | POST   | `agents/checkModel`                  | `agents.agents` read     | `ModelRef`                    | `ModelCheck`               |
 * | GET    | `agents/services`                    | `agents.services` read   |                               | `ModelServiceView[]`       |
 * | POST   | `agents/services`                    | `agents.services` manage | `CreateModelServiceRequest`   | `ModelServiceView` (201)   |
 * | PATCH  | `agents/services/:serviceName`       | `agents.services` manage | `UpdateModelServiceRequest`   | `ModelServiceView`         |
 * | DELETE | `agents/services/:serviceName`       | `agents.services` manage |                               | 204                        |
 * | POST   | `agents/discoverModels`              | `agents.services` manage | `ModelConnectionRequest`      | `ProviderModels`           |
 * | POST   | `agents/checkConnection`             | `agents.services` manage | `ModelConnectionCheckRequest` | `ModelCheck`               |
 * | GET    | `agents/defaultModels`               | a session                |                               | `DefaultModels`            |
 * | PUT    | `agents/defaultModels/chat`          | `agents.services` manage | `ModelRef`                    | `DefaultModels`            |
 *
 * The catalog names services and models, never keys or URLs. An API key is write-only: a service answers whether it
 * has one (`apiKeySet`). Listing models and checking take a connection being edited (`provider`, `baseUrl`, `apiKey`)
 * over a saved service (`service`), so a form can try a new key before saving it and an unchanged one without sending
 * it; neither fails for the provider's sake, they answer what it said.
 *
 * Every request to a provider says who sends it (`User-Agent: nocobase-agents/<version>`). A call to an OpenCode
 * base URL (Zen or Go) additionally carries `x-opencode-session` with a session id the server derives: the same one
 * for every model call of a conversation, a new one for each call outside any.
 */

export type ModelProviderName =
  | 'openai'
  | 'anthropic'
  | 'google'
  | 'deepseek'
  | 'alibaba'
  | 'moonshotai'
  | 'ollama'
  | 'cohere'
  | 'openai-compatible';

/**
 * What a model of a service is for: `chat` (online agents talk to it), `embedding` (turns text into vectors for a
 * vector index) or `rerank` (orders documents by how well they answer a query). Agents only ever see chat models.
 */
export type ModelKind = 'chat' | 'embedding' | 'rerank';

export const MODEL_KINDS: readonly ModelKind[] = [
  'chat',
  'embedding',
  'rerank',
];

/** A provider a service can use. */
export interface ModelProviderOption {
  /** Its key, such as `openai`. */
  readonly name: ModelProviderName;
  readonly title: string;
  /** The base URL it calls when a service sets none; null when a service must set one. */
  readonly defaultBaseUrl: string | null;
  /** Whether it answers nothing without an API key. */
  readonly keyRequired: boolean;
  /** The kinds of model it serves, through its Vercel AI SDK provider (`server/online/providers.ts`). */
  readonly kinds: readonly ModelKind[];
}

/** The providers a service can use, each through its Vercel AI SDK provider package (`server/online/providers.ts`). */
export const MODEL_PROVIDERS: readonly ModelProviderOption[] = [
  {
    name: 'openai',
    title: 'OpenAI',
    defaultBaseUrl: 'https://api.openai.com/v1',
    keyRequired: true,
    kinds: ['chat', 'embedding'],
  },
  {
    name: 'anthropic',
    title: 'Anthropic',
    defaultBaseUrl: 'https://api.anthropic.com/v1',
    keyRequired: true,
    kinds: ['chat'],
  },
  {
    name: 'google',
    title: 'Google Gemini',
    defaultBaseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    keyRequired: true,
    kinds: ['chat', 'embedding'],
  },
  {
    name: 'deepseek',
    title: 'DeepSeek',
    defaultBaseUrl: 'https://api.deepseek.com',
    keyRequired: true,
    kinds: ['chat'],
  },
  {
    name: 'alibaba',
    title: 'Alibaba Qwen',
    defaultBaseUrl: 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1',
    keyRequired: true,
    kinds: ['chat', 'embedding'],
  },
  {
    name: 'moonshotai',
    title: 'Moonshot Kimi',
    defaultBaseUrl: 'https://api.moonshot.ai/v1',
    keyRequired: true,
    kinds: ['chat'],
  },
  {
    name: 'ollama',
    title: 'Ollama',
    defaultBaseUrl: 'http://127.0.0.1:11434/api',
    keyRequired: false,
    kinds: ['chat', 'embedding'],
  },
  {
    name: 'cohere',
    title: 'Cohere',
    defaultBaseUrl: 'https://api.cohere.com/v2',
    keyRequired: true,
    kinds: ['chat', 'embedding', 'rerank'],
  },
  {
    name: 'openai-compatible',
    title: 'OpenAI-compatible',
    defaultBaseUrl: null,
    keyRequired: false,
    kinds: ['chat', 'embedding', 'rerank'],
  },
];

export const MODEL_PROVIDER_NAMES: readonly ModelProviderName[] =
  MODEL_PROVIDERS.map((provider) => provider.name);

export function providerOf(name: string): ModelProviderOption | null {
  return MODEL_PROVIDERS.find((provider) => provider.name === name) ?? null;
}

/** The session header OpenCode Zen and Go require; a call to an OpenCode base URL sends it without being asked. */
export const OPENCODE_SESSION_HEADER = 'x-opencode-session';

/** Whether a base URL is OpenCode's (Zen or Go), which requires `OPENCODE_SESSION_HEADER`. */
export function isOpenCodeUrl(baseUrl: string | null | undefined): boolean {
  if (!baseUrl) return false;
  try {
    const host = new URL(baseUrl).hostname.toLowerCase();
    return host === 'opencode.ai' || host.endsWith('.opencode.ai');
  } catch {
    return false;
  }
}

export interface ModelOption {
  /** The provider's model id. */
  readonly value: string;
  readonly label: string;
  readonly kind: ModelKind;
  /** For an embedding model, the size of the vectors asked for; null takes the model's own. Null for other kinds. */
  readonly dimensions: number | null;
}

/** An enabled service with the models of one kind it offers. */
export interface ModelService {
  /** Its name, which an agent stores (`OnlineModelEntry.modelService`). */
  readonly name: string;
  readonly title: string;
  /** Its provider's key, such as `openai`. */
  readonly provider: string;
  readonly models: readonly ModelOption[];
}

export interface ModelCatalog {
  /** The enabled services that offer at least one model of the kind asked for (chat unless said otherwise). */
  readonly services: readonly ModelService[];
  /**
   * In a chat catalog the server reads, the system default chat model online agents with no models of their own use
   * (`DefaultModels.effectiveChat`); null when no service offers a chat model.
   */
  readonly defaultModel?: ModelRef | null;
}

export interface ModelRef {
  readonly modelService: string;
  readonly model: string;
}

/** Whether a model answered a short test request. */
export interface ModelCheck {
  readonly ok: boolean;
  /** Why not, in the provider's words. */
  readonly message: string | null;
  /**
   * When it did not answer as the kind it was checked as but did as another kind its provider serves, that kind: the
   * model looks like a model of another kind. Null or absent otherwise.
   */
  readonly looksLike?: ModelKind | null;
}

/** The system default chat model, as `agents/defaultModels` answers it. */
export interface DefaultChatModel extends ModelRef {
  /** Its service's title. */
  readonly serviceTitle: string;
  /** Its label in the service. */
  readonly modelLabel: string;
}

/**
 * The models used where nothing names one: online agents with no models of their own answer with the default chat
 * model. It is set on the Models page; when none is set, the first chat model an enabled service offers is used, and
 * the first one enabled becomes the default.
 */
export interface DefaultModels {
  /** The default chat model as set; null when none is. */
  readonly chat: ModelRef | null;
  /** The chat model used now: the one set while it is offered, else the first offered; null when none is. */
  readonly effectiveChat: DefaultChatModel | null;
}

/** Whether the catalog offers `model` of `modelService`. */
export function offers(
  catalog: Pick<ModelCatalog, 'services'>,
  modelService: string | null,
  model: string | null,
): boolean {
  return Boolean(
    modelService &&
    model &&
    catalog.services.some(
      (service) =>
        service.name === modelService &&
        service.models.some((option) => option.value === model),
    ),
  );
}

/** Whether the catalog offers an online agent's entry; false for none. */
export function offersEntry(
  catalog: Pick<ModelCatalog, 'services'>,
  entry: ModelRef | null,
): boolean {
  return offers(catalog, entry?.modelService ?? null, entry?.model ?? null);
}

/** A service, as `GET agents/services` lists it. */
export interface ModelServiceView {
  /** What agents and model prices store to name it; made from the title when it is added, and never changed. */
  readonly name: string;
  readonly title: string;
  readonly provider: ModelProviderName;
  readonly baseUrl: string | null;
  /** Whether an API key is set; the key itself is never answered. */
  readonly apiKeySet: boolean;
  readonly enabled: boolean;
  /** The models it offers, in order. */
  readonly models: readonly ModelOption[];
}

export interface ModelInput {
  readonly value: string;
  readonly label?: string;
  /** `chat` when absent; must be a kind the service's provider serves. */
  readonly kind?: ModelKind;
  /** An embedding model's vector size (1–8192); absent or null takes the model's own. */
  readonly dimensions?: number | null;
}

/** `POST agents/services`. */
export interface CreateModelServiceRequest {
  readonly title: string;
  readonly provider: ModelProviderName;
  readonly baseUrl?: string | null;
  readonly apiKey?: string | null;
  readonly models?: readonly ModelInput[];
  /** True when absent. */
  readonly enabled?: boolean;
}

/** `PATCH agents/services/:serviceName`: what is absent stays; `apiKey` null clears the key. */
export interface UpdateModelServiceRequest {
  readonly title?: string;
  readonly baseUrl?: string | null;
  readonly apiKey?: string | null;
  readonly models?: readonly ModelInput[];
  readonly enabled?: boolean;
}

/**
 * A connection to try: a saved service (`service`), what is being edited, or both, the edited values winning. `apiKey`
 * null tries without a key; absent, the saved service's key.
 */
export interface ModelConnectionRequest {
  readonly service?: string;
  readonly provider?: ModelProviderName;
  readonly baseUrl?: string | null;
  readonly apiKey?: string | null;
}

/**
 * `POST agents/checkConnection`: tries `model` over the connection as its kind says: a chat model answers a short
 * question, an embedding model embeds a short text (with `dimensions`), a rerank model orders two short documents.
 */
export interface ModelConnectionCheckRequest extends ModelConnectionRequest {
  readonly model: string;
  /** `chat` when absent. */
  readonly kind?: ModelKind;
  readonly dimensions?: number | null;
}

/** A model a provider lists, with the kind its id suggests (`guessModelKind`); people may change it. */
export interface ProviderModel {
  readonly id: string;
  readonly kind: ModelKind;
}

/** The models a provider lists over a connection, or why it would not. */
export type ProviderModels =
  | { readonly ok: true; readonly items: readonly ProviderModel[] }
  | { readonly ok: false; readonly message: string };

/**
 * The kind a model id suggests, among `kinds` (those its provider serves): `rerank` for an id naming reranking,
 * `embedding` for one naming embeddings (`embed`, `embedding`), else `chat`; the provider's first kind when it serves
 * no such kind.
 */
export function guessModelKind(
  id: string,
  kinds: readonly ModelKind[],
): ModelKind {
  const lower = id.toLowerCase();
  const guess: ModelKind = lower.includes('rerank')
    ? 'rerank'
    : lower.includes('embed')
      ? 'embedding'
      : 'chat';
  return kinds.includes(guess) ? guess : (kinds[0] ?? 'chat');
}
