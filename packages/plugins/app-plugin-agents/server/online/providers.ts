/**
 * The providers a model service can use (`MODEL_PROVIDERS` in `shared/models.ts`), each through its Vercel AI SDK
 * provider package: the language, embedding and reranking models of a service's models, and the models the provider
 * lists, read from its own list-models endpoint.
 *
 * Reranking: Cohere through its provider package; an OpenAI-compatible endpoint through `compatibleReranking`, a
 * `RerankingModelV4` of this plugin's posting `{ model, query, documents, top_n }` to `<base>/rerank` and reading
 * `results[].index` and `relevance_score`, the shape Cohere, Jina, vLLM and SiliconFlow share.
 */
import { createAlibaba } from '@ai-sdk/alibaba';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createCohere } from '@ai-sdk/cohere';
import { createDeepSeek } from '@ai-sdk/deepseek';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createMoonshotAI } from '@ai-sdk/moonshotai';
import { createOpenAI } from '@ai-sdk/openai';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import type {
  EmbeddingModel,
  JSONValue,
  LanguageModel,
  RerankingModel,
} from 'ai';
import { APICallError } from 'ai';
import { createOllama } from 'ollama-ai-provider-v2';

import { providerOf, type ModelProviderName } from '../../shared/models.js';

type JSONObject = Record<string, JSONValue>;
/** The SDK's reranking model specification, as `ai` names it (`RerankingModel` minus model ids and older versions). */
type RerankingModelV4 = Extract<RerankingModel, { specificationVersion: 'v4' }>;
type RerankingModelV4CallOptions = Parameters<RerankingModelV4['doRerank']>[0];
type RerankingModelV4Result = Awaited<ReturnType<RerankingModelV4['doRerank']>>;

/** What a call to a service needs: its provider, where to reach it and its key. */
export interface ModelConnection {
  readonly provider: ModelProviderName;
  /** Null calls the provider's default. */
  readonly baseUrl: string | null;
  readonly apiKey: string | null;
}

interface Settings {
  baseURL?: string;
  apiKey?: string;
}

function settingsOf(connection: ModelConnection): Settings {
  return {
    ...(connection.baseUrl ? { baseURL: connection.baseUrl } : {}),
    ...(connection.apiKey ? { apiKey: connection.apiKey } : {}),
  };
}

/** The base URL a connection calls: its own, else its provider's default. */
export function baseUrlOf(connection: ModelConnection): string | null {
  return (
    connection.baseUrl ??
    providerOf(connection.provider)?.defaultBaseUrl ??
    null
  );
}

/** The language model `model` of the connection's provider. */
export function languageModel(
  connection: ModelConnection,
  model: string,
): LanguageModel {
  const settings = settingsOf(connection);
  switch (connection.provider) {
    case 'openai':
      return createOpenAI(settings)(model);
    case 'anthropic':
      return createAnthropic(settings)(model);
    case 'google':
      return createGoogleGenerativeAI(settings)(model);
    case 'deepseek':
      return createDeepSeek(settings)(model);
    case 'alibaba':
      return createAlibaba(settings)(model);
    case 'moonshotai':
      return createMoonshotAI(settings)(model);
    case 'cohere':
      return createCohere(settings)(model);
    case 'ollama':
      return createOllama({
        ...(settings.baseURL ? { baseURL: settings.baseURL } : {}),
        ...(settings.apiKey
          ? { headers: { Authorization: `Bearer ${settings.apiKey}` } }
          : {}),
      })(model);
    case 'openai-compatible':
      return createOpenAICompatible({
        name: 'openai-compatible',
        baseURL: settings.baseURL ?? '',
        includeUsage: true,
        ...(settings.apiKey ? { apiKey: settings.apiKey } : {}),
      })(model);
  }
}

/** An embedding model and the provider options that ask it for `dimensions`. */
export interface EmbeddingCall {
  readonly model: EmbeddingModel;
  readonly providerOptions: Record<string, JSONObject>;
}

/**
 * Alibaba's embeddings are served by DashScope's own API, beside the OpenAI-compatible one a service names: the same
 * host's `/api/v1` (`…/compatible-mode/v1` → `…/api/v1`).
 */
function alibabaEmbeddingBase(baseURL: string | undefined): string | undefined {
  if (!baseURL) return undefined;
  return baseURL.replace(/\/compatible-mode\/v1\/?$/u, '/api/v1');
}

/**
 * The embedding model `model` of the connection's provider, asked for vectors of `dimensions` when set; throws
 * `Error` for a provider that serves no embeddings.
 */
export function embeddingModel(
  connection: ModelConnection,
  model: string,
  dimensions: number | null,
): EmbeddingCall {
  const settings = settingsOf(connection);
  const sized = (key: string, option: string): Record<string, JSONObject> =>
    dimensions ? { [key]: { [option]: dimensions } } : {};
  switch (connection.provider) {
    case 'openai':
      return {
        model: createOpenAI(settings).embeddingModel(model),
        providerOptions: sized('openai', 'dimensions'),
      };
    case 'google':
      return {
        model: createGoogleGenerativeAI(settings).embeddingModel(model),
        providerOptions: sized('google', 'outputDimensionality'),
      };
    case 'alibaba': {
      const embeddingBaseURL = alibabaEmbeddingBase(settings.baseURL);
      return {
        model: createAlibaba({
          ...settings,
          ...(embeddingBaseURL ? { embeddingBaseURL } : {}),
        }).embeddingModel(model),
        providerOptions: sized('alibaba', 'dimension'),
      };
    }
    case 'cohere':
      return {
        model: createCohere(settings).embeddingModel(model),
        providerOptions: sized('cohere', 'outputDimension'),
      };
    case 'ollama':
      return {
        model: createOllama({
          ...(settings.baseURL ? { baseURL: settings.baseURL } : {}),
          ...(settings.apiKey
            ? { headers: { Authorization: `Bearer ${settings.apiKey}` } }
            : {}),
        }).embedding(model),
        providerOptions: sized('ollama', 'dimensions'),
      };
    case 'openai-compatible':
      return {
        model: createOpenAICompatible({
          name: 'openai-compatible',
          baseURL: settings.baseURL ?? '',
          ...(settings.apiKey ? { apiKey: settings.apiKey } : {}),
        }).embeddingModel(model),
        providerOptions: sized('openaiCompatible', 'dimensions'),
      };
    default:
      throw new Error(`${connection.provider} serves no embedding models.`);
  }
}

/** The reranking model `model` of the connection's provider; throws `Error` for a provider that serves none. */
export function rerankingModel(
  connection: ModelConnection,
  model: string,
): RerankingModel {
  const settings = settingsOf(connection);
  switch (connection.provider) {
    case 'cohere':
      return createCohere(settings).rerankingModel(model);
    case 'openai-compatible':
      return compatibleReranking(
        settings.baseURL ?? '',
        settings.apiKey ?? null,
        model,
      );
    default:
      throw new Error(`${connection.provider} serves no rerank models.`);
  }
}

/** Where a compatible rerank endpoint says how many tokens it read (`usage.total_tokens`, as Jina does). */
export const RERANK_METADATA_KEY = 'openaiCompatible';

/**
 * A reranking model over an OpenAI-compatible service's `POST <base>/rerank` (the Cohere shape: `model`, `query`,
 * `documents`, `top_n`; answering `results[].index` and `relevance_score`). A failed request throws the SDK's
 * `APICallError`, so the gateway classifies it as it does a chat model's.
 */
export function compatibleReranking(
  baseURL: string,
  apiKey: string | null,
  modelId: string,
): RerankingModelV4 {
  return {
    specificationVersion: 'v4',
    provider: 'openai-compatible.reranking',
    modelId,
    async doRerank(
      options: RerankingModelV4CallOptions,
    ): Promise<RerankingModelV4Result> {
      const url = `${baseURL.replace(/\/+$/u, '')}/rerank`;
      const documents =
        options.documents.type === 'text'
          ? options.documents.values
          : options.documents.values.map((value) => JSON.stringify(value));
      const body = {
        model: modelId,
        query: options.query,
        documents,
        ...(options.topN === undefined ? {} : { top_n: options.topN }),
      };
      let response: Response;
      try {
        response = await fetch(url, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            ...(apiKey ? { authorization: `Bearer ${apiKey}` } : {}),
            ...Object.fromEntries(
              Object.entries(options.headers ?? {}).filter(
                (entry): entry is [string, string] =>
                  typeof entry[1] === 'string',
              ),
            ),
          },
          body: JSON.stringify(body),
          ...(options.abortSignal ? { signal: options.abortSignal } : {}),
        });
      } catch (error) {
        throw new APICallError({
          message: error instanceof Error ? error.message : String(error),
          url,
          requestBodyValues: body,
          cause: error,
          isRetryable: true,
        });
      }
      const text = await response.text();
      if (!response.ok)
        throw new APICallError({
          message: failureText(response.status, text),
          url,
          requestBodyValues: body,
          statusCode: response.status,
          responseBody: text,
          isRetryable: response.status === 429 || response.status >= 500,
        });
      let parsed: unknown;
      try {
        parsed = JSON.parse(text) as unknown;
      } catch {
        throw new APICallError({
          message: 'The rerank answer is not JSON.',
          url,
          requestBodyValues: body,
          statusCode: response.status,
          responseBody: text,
        });
      }
      const ranking = listOf(parsed, 'results').flatMap((item) => {
        if (!isRecord(item) || typeof item.index !== 'number') return [];
        const score =
          typeof item.relevance_score === 'number'
            ? item.relevance_score
            : typeof item.score === 'number'
              ? item.score
              : null;
        return score === null
          ? []
          : [{ index: item.index, relevanceScore: score }];
      });
      const usage =
        isRecord(parsed) && isRecord(parsed.usage) ? parsed.usage : {};
      const tokens =
        typeof usage.total_tokens === 'number' ? usage.total_tokens : null;
      return {
        ranking,
        ...(tokens === null
          ? {}
          : {
              providerMetadata: {
                [RERANK_METADATA_KEY]: { totalTokens: tokens },
              },
            }),
        response: { modelId, body: parsed },
      };
    },
  };
}

/** A provider's list-models request: the path under its base URL, its headers and where the ids are. */
interface ListRequest {
  /** Where the list is, when not under the base URL (`base` is the connection's). */
  readonly base?: (base: string) => string;
  readonly path: string;
  readonly headers: Record<string, string>;
  readonly ids: (body: unknown) => unknown[];
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const listOf = (body: unknown, key: string): unknown[] =>
  isRecord(body) && Array.isArray(body[key]) ? (body[key] as unknown[]) : [];

/** `GET <base>/models` answering `{ data: [{ id }] }`, as OpenAI and the providers compatible with it do. */
const openAiList = (apiKey: string | null): ListRequest => ({
  path: '/models',
  headers: apiKey ? { authorization: `Bearer ${apiKey}` } : {},
  ids: (body) =>
    listOf(body, 'data').map((item) => (isRecord(item) ? item.id : null)),
});

function listRequest(connection: ModelConnection): ListRequest {
  const { apiKey } = connection;
  switch (connection.provider) {
    case 'anthropic':
      return {
        path: '/models?limit=1000',
        headers: {
          'anthropic-version': '2023-06-01',
          ...(apiKey ? { 'x-api-key': apiKey } : {}),
        },
        ids: (body) =>
          listOf(body, 'data').map((item) => (isRecord(item) ? item.id : null)),
      };
    case 'google':
      return {
        path: '/models?pageSize=1000',
        headers: apiKey ? { 'x-goog-api-key': apiKey } : {},
        // Only the models that generate content; their names are `models/<id>`.
        ids: (body) =>
          listOf(body, 'models').map((item) =>
            isRecord(item) &&
            Array.isArray(item.supportedGenerationMethods) &&
            item.supportedGenerationMethods.includes('generateContent') &&
            typeof item.name === 'string'
              ? item.name.replace(/^models\//u, '')
              : null,
          ),
      };
    case 'cohere':
      // Cohere lists its models under v1 only; chat, embed and rerank are v2.
      return {
        base: (base) => base.replace(/\/v2$/u, '/v1'),
        path: '/models?page_size=1000',
        headers: apiKey ? { authorization: `Bearer ${apiKey}` } : {},
        ids: (body) =>
          listOf(body, 'models').map((item) =>
            isRecord(item) ? item.name : null,
          ),
      };
    case 'ollama':
      return {
        path: '/tags',
        headers: apiKey ? { authorization: `Bearer ${apiKey}` } : {},
        ids: (body) =>
          listOf(body, 'models').map((item) =>
            isRecord(item) ? item.name : null,
          ),
      };
    default:
      return openAiList(apiKey);
  }
}

/** The provider's answer to a failed request, in its words when it gave them. */
function failureText(status: number, text: string): string {
  try {
    const body = JSON.parse(text) as unknown;
    const error = isRecord(body) ? body.error : null;
    const message = isRecord(error) ? error.message : error;
    if (typeof message === 'string' && message) return message;
  } catch {
    // Not JSON: the status says it.
  }
  return `The provider answered HTTP ${status}.`;
}

/** The model ids the provider lists over the connection, sorted; throws with the provider's reason when it will not. */
export async function listModels(
  connection: ModelConnection,
  signal: AbortSignal,
): Promise<string[]> {
  const base = baseUrlOf(connection);
  if (!base) throw new Error('Set the base URL of the provider’s API.');
  const request = listRequest(connection);
  const root = base.replace(/\/+$/u, '');
  const response = await fetch(
    `${request.base ? request.base(root) : root}${request.path}`,
    {
      headers: request.headers,
      signal,
    },
  );
  const text = await response.text();
  if (!response.ok) throw new Error(failureText(response.status, text));
  let body: unknown;
  try {
    body = JSON.parse(text) as unknown;
  } catch {
    throw new Error('The provider’s model list is not JSON.');
  }
  const ids = new Set(
    request
      .ids(body)
      .filter((id): id is string => typeof id === 'string' && id.trim() !== '')
      .map((id) => id.trim()),
  );
  return [...ids].sort((a, b) => a.localeCompare(b));
}
