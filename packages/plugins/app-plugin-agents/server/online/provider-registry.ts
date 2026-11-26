/**
 * The providers a model service can use: the plugin's own (`MODEL_PROVIDERS`, built in) and those other plugins
 * register (`agents.models.providers.register`). A registered provider names its type, title, the kinds of model it
 * serves and how to reach them; the plugin calls its `create` for each call over a service's connection, and offers it
 * in "Add service" (`GET /api/agents/modelProviders`).
 *
 * A registration lives as long as the process, or until the function `register` returns is called. A service saved
 * with a provider nobody registers any more stays listed and answers a clear error when it is called.
 */
import type { EmbeddingModel, LanguageModel, RerankingModel } from 'ai';

import {
  MODEL_KINDS,
  MODEL_PROVIDERS,
  type ModelKind,
  type ModelProviderOption,
} from '../../shared/models.js';

/** What a call needs: the service's provider type, where to reach it and its key. */
export interface ModelProviderConnection {
  readonly provider: string;
  /** Null calls the provider's default base URL. */
  readonly baseUrl: string | null;
  readonly apiKey: string | null;
}

/** The models of a provider over one connection; leave out what it does not serve. */
export interface ModelProviderClient {
  readonly language?: (model: string) => LanguageModel;
  readonly embedding?: (model: string) => EmbeddingModel;
  readonly rerank?: (model: string) => RerankingModel;
  /** The model ids it offers, for "Fetch models" and the connection test; absent offers none. */
  readonly listModels?: (signal: AbortSignal) => Promise<readonly string[]>;
}

export interface ModelProviderRegistration {
  /** Its type, stored on each service: lower-case letters, digits and dashes, unique, never a built-in one. */
  readonly type: string;
  readonly title: string;
  readonly kinds: readonly ModelKind[];
  /** The base URL it calls when a service sets none; null (the default) when a service must set one. */
  readonly defaultBaseUrl?: string | null;
  /** Whether it answers nothing without an API key; false by default. */
  readonly keyRequired?: boolean;
  /** Called for every call over a service's connection, with its base URL (or the default) and key. */
  readonly create: (connection: ModelProviderConnection) => ModelProviderClient;
}

export interface ModelProviderRegistry {
  /** Adds a provider; returns the function that removes it. Throws for a taken or malformed type. */
  register(registration: ModelProviderRegistration): () => void;
  /** Every provider, the built-in ones first, then the registered ones in registration order. */
  list(): readonly ModelProviderOption[];
}

const TYPE_PATTERN = /^[a-z0-9][a-z0-9-]{0,62}$/u;

const registered = new Map<string, ModelProviderRegistration>();

const optionOf = (
  registration: ModelProviderRegistration,
): ModelProviderOption => ({
  name: registration.type,
  title: registration.title,
  defaultBaseUrl: registration.defaultBaseUrl ?? null,
  keyRequired: registration.keyRequired ?? false,
  kinds: [...registration.kinds],
});

export const modelProviders: ModelProviderRegistry = {
  register(registration) {
    const type = registration.type;
    if (typeof type !== 'string' || !TYPE_PATTERN.test(type))
      throw new Error(
        `A model provider type is lower-case letters, digits and dashes: "${String(type)}".`,
      );
    if (
      MODEL_PROVIDERS.some((provider) => provider.name === type) ||
      registered.has(type)
    )
      throw new Error(`Model provider "${type}" is already registered.`);
    if (!registration.title?.trim())
      throw new Error(`Model provider "${type}" needs a title.`);
    if (
      !registration.kinds.length ||
      registration.kinds.some((kind) => !MODEL_KINDS.includes(kind))
    )
      throw new Error(
        `Model provider "${type}" must serve some of ${MODEL_KINDS.join(', ')}.`,
      );
    if (typeof registration.create !== 'function')
      throw new Error(`Model provider "${type}" needs create().`);
    registered.set(type, registration);
    return () => {
      if (registered.get(type) === registration) registered.delete(type);
    };
  },
  list: () => [...MODEL_PROVIDERS, ...[...registered.values()].map(optionOf)],
};

/** A provider by its type, built in or registered; null when nobody provides it. */
export function modelProviderOf(type: string): ModelProviderOption | null {
  const builtIn = MODEL_PROVIDERS.find((provider) => provider.name === type);
  if (builtIn) return builtIn;
  const registration = registered.get(type);
  return registration ? optionOf(registration) : null;
}

/** Whether `type` names a provider someone provides now. */
export function isModelProvider(type: string): boolean {
  return modelProviderOf(type) !== null;
}

/**
 * The client of a registered provider over `connection`, or null for a built-in one. Throws for a type nobody
 * provides any more.
 */
export function registeredClient(
  connection: ModelProviderConnection,
): ModelProviderClient | null {
  if (MODEL_PROVIDERS.some((provider) => provider.name === connection.provider))
    return null;
  const registration = registered.get(connection.provider);
  if (!registration)
    throw new Error(
      `The model provider "${connection.provider}" is not available: the plugin that provided it is not registered.`,
    );
  return registration.create({
    provider: connection.provider,
    baseUrl: connection.baseUrl ?? registration.defaultBaseUrl ?? null,
    apiKey: connection.apiKey,
  });
}
