/**
 * The model gateway online agents' runs call (`ModelGateway`): the catalog of what the enabled model services offer,
 * a short check of one model, and one streaming model call with tools. It also serves the application's model calls
 * outside runs: embeddings (`embed`, over `embedMany`), reranking (`rerank`) and short utility texts (`generate`), each
 * recorded as it returns in `agModelUsage` with the caller's `source` (`reports/model-usage.ts`). It is implemented on
 * Vercel AI SDK Core (`streamText`, `generateText`, `embedMany`, `rerank`) over the services this plugin keeps
 * (`services.ts`) and their providers (`providers.ts`).
 *
 * `stream` is one model request: the tools are declared without an implementation, so the call ends with the tool
 * calls the model made. An online run's loop is the SDK's own (`ToolLoopAgent`, `executor.ts`), over the language model
 * `languageModel` hands it. Keys never leave the server: callers name a service and a model.
 *
 * Usage follows the agents protocol's `Usage`: the counts do not overlap, so each is priced at its own rate.
 * `inputTokens` excludes cached input (`cacheReadTokens`) and cache writes (`cacheWriteTokens`); `outputTokens`
 * includes reasoning, which `reasoningTokens` repeats for information.
 *
 * The SDK retries a failed request itself (`maxRetries`, 2 for a run, none for a check), so a person waiting on a reply
 * hears of a limit within seconds; longer back-off is the run queue's. A failure throws `ModelError` with a code.
 */
import {
  APICallError,
  embedMany,
  generateText,
  rerank as sdkRerank,
  jsonSchema,
  LoadAPIKeyError,
  NoSuchModelError,
  RetryError,
  streamText,
  tool,
  type LanguageModel,
  type LanguageModelUsage,
  type ModelMessage as SdkMessage,
  type SystemModelMessage,
  type ToolSet,
} from 'ai';

import {
  providerOf,
  type ModelCatalog,
  type ModelCheck,
  type ModelKind,
  type ModelRef,
} from '../../shared/models.js';
import type { ModelUsageRecorder } from '../core/reports/model-usage.js';
import {
  embeddingModel,
  languageModel,
  RERANK_METADATA_KEY,
  rerankingModel,
  type ModelConnection,
} from './providers.js';

/** A tool as the model is told of it. */
export interface ModelToolSpec {
  /** `^[a-zA-Z0-9_-]{1,64}$`. */
  readonly name: string;
  readonly description: string;
  /** A JSON Schema of an object. */
  readonly inputSchema: Readonly<Record<string, unknown>>;
}

export interface ModelToolCall {
  readonly id: string;
  readonly name: string;
  /** The arguments the model gave, parsed from JSON; whatever it sent when that failed. */
  readonly args: unknown;
}

export type ModelMessage =
  | {
      readonly role: 'system';
      readonly content: string;
      /**
       * Whether the provider should cache the prompt up to this message (Anthropic's `cacheControl`; OpenAI caches long
       * prefixes by itself).
       */
      readonly cache?: boolean;
    }
  | { readonly role: 'user'; readonly content: string }
  | {
      readonly role: 'assistant';
      readonly content: string;
      readonly toolCalls?: readonly ModelToolCall[];
    }
  | {
      readonly role: 'tool';
      readonly toolCallId: string;
      readonly content: string;
    };

/** What one model call used; the counts do not overlap (see above). */
export interface ModelUsage {
  readonly inputTokens: number;
  readonly outputTokens: number;
  readonly cacheReadTokens?: number;
  readonly cacheWriteTokens?: number;
  readonly reasoningTokens?: number;
}

export type ModelEvent =
  | { readonly type: 'text'; readonly delta: string }
  | { readonly type: 'reasoning'; readonly delta: string }
  | { readonly type: 'toolCall'; readonly call: ModelToolCall }
  | {
      readonly type: 'finish';
      readonly reason: 'stop' | 'toolCalls' | 'length' | 'filtered';
      /** The model that answered, as its provider names it. */
      readonly model: string;
      readonly usage: ModelUsage;
    };

export interface ModelRequest {
  /** With the entry's reasoning effort (`ONLINE_EFFORTS`); the provider's default when absent. */
  readonly model: ModelRef & { readonly reasoning?: string | null };
  readonly messages: readonly ModelMessage[];
  readonly tools?: readonly ModelToolSpec[];
  readonly signal?: AbortSignal;
}

/**
 * Why a model call failed:
 *
 * | code              | means                                                                  | worth retrying |
 * | ----------------- | ---------------------------------------------------------------------- | -------------- |
 * | `config`          | the service or model is not there (unknown, disabled, deleted)         | no             |
 * | `auth`            | the service's credentials were refused, or it has none                 | no             |
 * | `quota`           | the account is out of credit or quota                                  | no             |
 * | `rateLimit`       | too many requests now                                                  | yes, later     |
 * | `network`         | the provider could not be reached, or failed on its side (5xx)          | yes            |
 * | `contextOverflow` | the request is longer than the model takes                             | no             |
 * | `filtered`        | the provider's content filter stopped it                               | no             |
 * | `badResponse`     | any other refusal of the request (400)                                 | no             |
 * | `aborted`         | the caller's signal aborted it                                         | no             |
 * | `unknown`         | anything else                                                          | no             |
 */
export const MODEL_ERRORS = [
  'config',
  'auth',
  'quota',
  'rateLimit',
  'network',
  'contextOverflow',
  'filtered',
  'badResponse',
  'aborted',
  'unknown',
] as const;

export type ModelErrorCode = (typeof MODEL_ERRORS)[number];

/** What a failed model call throws. */
export class ModelError extends Error {
  public override readonly name: string = 'ModelError';
  public readonly code: ModelErrorCode;
  /** The provider's HTTP status, when it answered with one. */
  public readonly status: number | null;

  public constructor(
    code: ModelErrorCode,
    message: string,
    options: { readonly status?: number | null; readonly cause?: unknown } = {},
  ) {
    super(message, { cause: options.cause });
    this.code = code;
    this.status = options.status ?? null;
  }
}

/** `ModelGateway.embed`: texts to turn into vectors, by an embedding model; `source` names the caller in usage. */
export interface EmbedRequest {
  readonly model: ModelRef;
  readonly values: readonly string[];
  readonly source: string;
  readonly signal?: AbortSignal;
}

export interface EmbedResult {
  /** One vector per value, in order. */
  readonly embeddings: number[][];
  /** The vectors' size. */
  readonly dimension: number;
  /** The model that answered, as the service names it. */
  readonly model: string;
  readonly tokens: number;
}

/** `ModelGateway.rerank`: documents to order by how well they answer `query`, by a rerank model. */
export interface RerankRequest {
  readonly model: ModelRef;
  readonly query: string;
  readonly documents: readonly string[];
  /** At most this many, best first; all of them when absent. */
  readonly topN?: number;
  readonly source: string;
  readonly signal?: AbortSignal;
}

export interface RerankResult {
  /** Best first: each document's place in `documents` and its relevance (higher is better). */
  readonly ranking: { index: number; score: number }[];
}

/** `ModelGateway.generate`: one short text from a chat model, without tools, for utility work. */
export interface GenerateRequest {
  readonly model: ModelRef;
  readonly system?: string;
  readonly prompt: string;
  readonly maxOutputTokens?: number;
  readonly source: string;
  readonly signal?: AbortSignal;
}

/** Where models come from: online agents' runs and the application's own model calls. */
export interface ModelGateway {
  /** The enabled services that offer at least one model of `kind` (`chat` by default), with those models. */
  catalog(kind?: ModelKind): Promise<ModelCatalog>;
  /** Asks the chat model a short question; never throws. */
  check(ref: ModelRef): Promise<ModelCheck>;
  /** One model call, streamed; throws `ModelError`. */
  stream(request: ModelRequest): AsyncIterable<ModelEvent>;
  /** The chat model of an enabled service, for an online run's agent loop (`executor.ts`); throws `ModelError`. */
  languageModel(ref: ModelRef): Promise<LanguageModel>;
  /** Embeds texts with an embedding model; throws `ModelError`. Recorded as `embedding` use. */
  embed(request: EmbedRequest): Promise<EmbedResult>;
  /** Orders documents with a rerank model; throws `ModelError`. Recorded as `rerank` use. */
  rerank(request: RerankRequest): Promise<RerankResult>;
  /** One short text from a chat model; throws `ModelError`. Recorded as `text` use. */
  generate(request: GenerateRequest): Promise<{ text: string }>;
}

/** A service's connection and what it says of one of its models. */
export interface ModelEndpoint {
  readonly connection: ModelConnection;
  /** An embedding model's requested vector size; null for the model's own or another kind. */
  readonly dimensions: number | null;
}

/** What the gateway reads of the services (`ModelServices`). */
export interface ModelSource {
  catalog(kind?: ModelKind): Promise<ModelCatalog>;
  /**
   * The connection of an enabled service that offers `model` as a model of `kind` (`chat` by default); throws
   * `ModelError` `config` or `auth` otherwise.
   */
  connectionFor(ref: ModelRef, kind?: ModelKind): Promise<ModelConnection>;
  /** As `connectionFor`, with what the service says of the model. */
  endpointFor(ref: ModelRef, kind: ModelKind): Promise<ModelEndpoint>;
}

/** A check, with the code of its failure for the server to reason about; `ModelCheck` itself never carries it. */
export type CheckResult = ModelCheck & { readonly code?: ModelErrorCode };

/** A check as answered: without its failure's code. */
export const answered = ({
  ok,
  message,
  looksLike,
}: CheckResult): ModelCheck =>
  looksLike === undefined ? { ok, message } : { ok, message, looksLike };

/** How long a check may take. */
export const CHECK_TIMEOUT_MS = 20_000;
const MESSAGE_MAX = 500;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const text = (value: unknown): string =>
  typeof value === 'string' ? value : '';

/** An entry's reasoning effort (`ONLINE_EFFORTS`) as the SDK names it; the provider's default otherwise. */
export function reasoningOf(
  effort: string | null | undefined,
): 'minimal' | 'low' | 'medium' | 'high' | 'xhigh' | 'provider-default' {
  switch (effort) {
    case 'minimal':
    case 'low':
    case 'medium':
    case 'high':
    case 'xhigh':
      return effort;
    default:
      return 'provider-default';
  }
}

/** The error's code and type as the provider's JSON body names them. */
function bodyCodes(body: string | undefined): {
  code: string;
  type: string;
} {
  try {
    const parsed = JSON.parse(body ?? '') as unknown;
    const error =
      isRecord(parsed) && isRecord(parsed.error) ? parsed.error : {};
    return { code: text(error.code), type: text(error.type) };
  } catch {
    return { code: '', type: '' };
  }
}

const NETWORK_CODES = [
  'ECONNREFUSED',
  'ECONNRESET',
  'ETIMEDOUT',
  'ENOTFOUND',
  'EAI_AGAIN',
  'UND_ERR_CONNECT_TIMEOUT',
  'UND_ERR_SOCKET',
];

/** A failure of the SDK or the provider as a `ModelError`. */
export function classify(error: unknown, signal?: AbortSignal): ModelError {
  if (error instanceof ModelError) return error;
  if (signal?.aborted)
    return new ModelError('aborted', 'The call was stopped.', {
      cause: error,
    });
  if (RetryError.isInstance(error) && error.lastError !== undefined)
    return classify(error.lastError, signal);
  const message = error instanceof Error ? error.message : String(error);
  const of = (code: ModelErrorCode, status: number | null = null) =>
    new ModelError(code, message, { status, cause: error });
  if (NoSuchModelError.isInstance(error)) return of('config');
  if (LoadAPIKeyError.isInstance(error)) return of('auth');
  const lower = message.toLowerCase();
  if (APICallError.isInstance(error)) {
    const status = error.statusCode ?? null;
    const { code, type } = bodyCodes(error.responseBody);
    if (
      code === 'context_length_exceeded' ||
      lower.includes('maximum context length') ||
      lower.includes('context window') ||
      lower.includes('too many tokens')
    )
      return of('contextOverflow', status);
    if (
      code === 'insufficient_quota' ||
      type === 'insufficient_quota' ||
      status === 402
    )
      return of('quota', status);
    if (status === 401 || status === 403) return of('auth', status);
    if (status === 429) return of('rateLimit', status);
    if (status === 404 || code === 'model_not_found')
      return of('config', status);
    if (code === 'content_filter' || lower.includes('content filter'))
      return of('filtered', status);
    if (status === null || status >= 500) return of('network', status);
    if (status === 400) return of('badResponse', status);
    return of('unknown', status);
  }
  if (!isRecord(error)) return of('unknown');
  const name = text(error.name);
  const cause = isRecord(error.cause) ? error.cause : {};
  const code = text(error.code) || text(cause.code);
  if (name === 'AbortError') return of('aborted');
  if (
    name === 'TimeoutError' ||
    NETWORK_CODES.includes(code) ||
    lower.includes('fetch failed')
  )
    return of('network');
  return of('unknown');
}

/**
 * The messages as the SDK reads them: the system messages are its instructions, the rest its messages, a tool result
 * naming its tool from the call it answers.
 */
export function toPrompt(messages: readonly ModelMessage[]): {
  instructions: SystemModelMessage[];
  messages: SdkMessage[];
} {
  const names = new Map<string, string>();
  const instructions: SystemModelMessage[] = [];
  const rest: SdkMessage[] = [];
  for (const message of messages) {
    if (message.role === 'system')
      instructions.push({
        role: 'system',
        content: message.content,
        ...(message.cache
          ? {
              providerOptions: {
                anthropic: { cacheControl: { type: 'ephemeral' } },
              },
            }
          : {}),
      });
    else rest.push(toSdkMessage(message, names));
  }
  return { instructions, messages: rest };
}

function toSdkMessage(
  message: Exclude<ModelMessage, { role: 'system' }>,
  names: Map<string, string>,
): SdkMessage {
  switch (message.role) {
    case 'user':
      return { role: 'user', content: message.content };
    case 'assistant':
      for (const call of message.toolCalls ?? []) names.set(call.id, call.name);
      return {
        role: 'assistant',
        content: [
          ...(message.content
            ? [{ type: 'text' as const, text: message.content }]
            : []),
          ...(message.toolCalls ?? []).map((call) => ({
            type: 'tool-call' as const,
            toolCallId: call.id,
            toolName: call.name,
            input: isRecord(call.args) ? call.args : {},
          })),
        ],
      };
    case 'tool':
      return {
        role: 'tool',
        content: [
          {
            type: 'tool-result',
            toolCallId: message.toolCallId,
            toolName: names.get(message.toolCallId) ?? '',
            output: { type: 'text', value: message.content },
          },
        ],
      };
  }
}

/** The tools as the SDK declares them: a JSON Schema each, and no implementation, so the call ends at the calls. */
function toolsOf(specs: readonly ModelToolSpec[] = []): ToolSet {
  return Object.fromEntries(
    specs.map((spec) => [
      spec.name,
      tool({
        description: spec.description,
        inputSchema: jsonSchema(spec.inputSchema),
      }),
    ]),
  );
}

/** What a model call used, as the agents protocol counts it (see above). */
export function usageOf(usage: LanguageModelUsage | undefined): ModelUsage {
  const cacheRead = usage?.inputTokenDetails.cacheReadTokens ?? 0;
  const cacheWrite = usage?.inputTokenDetails.cacheWriteTokens ?? 0;
  const reasoning = usage?.outputTokenDetails.reasoningTokens ?? 0;
  return {
    inputTokens: Math.max(
      0,
      (usage?.inputTokens ?? 0) - cacheRead - cacheWrite,
    ),
    outputTokens: usage?.outputTokens ?? 0,
    ...(cacheRead > 0 ? { cacheReadTokens: cacheRead } : {}),
    ...(cacheWrite > 0 ? { cacheWriteTokens: cacheWrite } : {}),
    ...(reasoning > 0 ? { reasoningTokens: reasoning } : {}),
  };
}

function finishOf(
  reason: string | undefined,
  calls: number,
): 'stop' | 'toolCalls' | 'length' | 'filtered' {
  if (reason === 'length') return 'length';
  if (reason === 'content-filter') return 'filtered';
  return calls > 0 ? 'toolCalls' : 'stop';
}

/** Whether `model` answers a short request over the connection, within `CHECK_TIMEOUT_MS`; never throws. */
export async function checkModel(
  connection: ModelConnection,
  model: string,
): Promise<CheckResult> {
  const signal = AbortSignal.timeout(CHECK_TIMEOUT_MS);
  try {
    if (!connection.apiKey && providerOf(connection.provider)?.keyRequired)
      throw new ModelError('auth', 'The service has no API key.');
    await generateText({
      model: languageModel(connection, model),
      prompt: 'Answer with one word: ok.',
      maxRetries: 0,
      abortSignal: signal,
    });
    return { ok: true, message: null };
  } catch (error) {
    const failure = signal.aborted
      ? new ModelError('network', 'The model did not answer in time.')
      : classify(error);
    return {
      ok: false,
      message: failure.message.slice(0, MESSAGE_MAX),
      code: failure.code,
    };
  }
}

/** Whether the embedding model embeds a short text over the connection, within `CHECK_TIMEOUT_MS`; never throws. */
export async function checkEmbedding(
  connection: ModelConnection,
  model: string,
  dimensions: number | null,
): Promise<CheckResult> {
  return checked(connection, async (signal) => {
    const call = embeddingModel(connection, model, dimensions);
    const { embeddings } = await embedMany({
      model: call.model,
      values: ['ok'],
      providerOptions: call.providerOptions,
      maxRetries: 0,
      abortSignal: signal,
    });
    const size = embeddings[0]?.length ?? 0;
    if (size === 0)
      throw new ModelError('badResponse', 'The model answered no vector.');
    if (dimensions && size !== dimensions)
      throw new ModelError(
        'badResponse',
        `The model answered vectors of ${size} dimensions, not ${dimensions}.`,
      );
  });
}

/** Whether the rerank model orders two short documents over the connection; never throws. */
export async function checkRerank(
  connection: ModelConnection,
  model: string,
): Promise<CheckResult> {
  return checked(connection, async (signal) => {
    await sdkRerank({
      model: rerankingModel(connection, model),
      query: 'ok',
      documents: ['ok', 'no'],
      maxRetries: 0,
      abortSignal: signal,
    });
  });
}

async function checked(
  connection: ModelConnection,
  attempt: (signal: AbortSignal) => Promise<void>,
): Promise<CheckResult> {
  const signal = AbortSignal.timeout(CHECK_TIMEOUT_MS);
  try {
    if (!connection.apiKey && providerOf(connection.provider)?.keyRequired)
      throw new ModelError('auth', 'The service has no API key.');
    await attempt(signal);
    return { ok: true, message: null };
  } catch (error) {
    const failure = signal.aborted
      ? new ModelError('network', 'The model did not answer in time.')
      : classify(error);
    return {
      ok: false,
      message: failure.message.slice(0, MESSAGE_MAX),
      code: failure.code,
    };
  }
}

/** How many texts one embedding request carries at most; `embedMany` splits further where a provider takes fewer. */
const EMBED_PARALLEL_CALLS = 2;

const unsupported = (error: unknown): ModelError =>
  new ModelError(
    'config',
    error instanceof Error ? error.message : String(error),
    { cause: error },
  );

export function createModelGateway(
  source: ModelSource,
  options: {
    readonly maxRetries?: number;
    /** Where model calls outside runs are recorded; nowhere without it. */
    readonly usage?: ModelUsageRecorder;
    readonly onError?: (message: string, error: unknown) => void;
  } = {},
): ModelGateway {
  const maxRetries = options.maxRetries ?? 2;
  const record = async (
    entry: Parameters<ModelUsageRecorder['record']>[0],
  ): Promise<void> => {
    if (!options.usage) return;
    try {
      await options.usage.record(entry);
    } catch (error) {
      (options.onError ?? ((message, cause) => console.error(message, cause)))(
        'Agents could not record a model call.',
        error,
      );
    }
  };

  async function* stream(
    request: ModelRequest,
  ): AsyncGenerator<ModelEvent, void, undefined> {
    const connection = await source.connectionFor(request.model);
    const { signal } = request;
    const calls: ModelToolCall[] = [];
    let answered = request.model.model;
    let reason: string | undefined;
    let usage: LanguageModelUsage | undefined;
    try {
      const result = streamText({
        model: languageModel(connection, request.model.model),
        ...toPrompt(request.messages),
        tools: toolsOf(request.tools),
        reasoning: reasoningOf(request.model.reasoning),
        maxRetries,
        ...(signal ? { abortSignal: signal } : {}),
        // Failures arrive as `error` parts below; the SDK would also log them.
        onError: () => undefined,
      });
      for await (const part of result.fullStream)
        switch (part.type) {
          case 'text-delta':
            if (part.text) yield { type: 'text', delta: part.text };
            break;
          case 'reasoning-delta':
            if (part.text) yield { type: 'reasoning', delta: part.text };
            break;
          case 'tool-call':
            calls.push({
              id: part.toolCallId,
              name: part.toolName,
              args: part.input,
            });
            break;
          case 'finish-step':
            if (part.response.modelId) answered = part.response.modelId;
            break;
          case 'finish':
            reason = part.finishReason;
            usage = part.totalUsage;
            break;
          case 'error':
            throw part.error;
          case 'abort':
            throw new ModelError('aborted', 'The call was stopped.');
          default:
            break;
        }
    } catch (error) {
      throw classify(error, signal);
    }
    for (const call of calls) yield { type: 'toolCall', call };
    yield {
      type: 'finish',
      reason: finishOf(reason, calls.length),
      model: answered,
      usage: usageOf(usage),
    };
  }

  async function embed(request: EmbedRequest): Promise<EmbedResult> {
    const { signal } = request;
    const { connection, dimensions } = await source.endpointFor(
      request.model,
      'embedding',
    );
    if (request.values.length === 0)
      return {
        embeddings: [],
        dimension: dimensions ?? 0,
        model: request.model.model,
        tokens: 0,
      };
    let call: ReturnType<typeof embeddingModel>;
    try {
      call = embeddingModel(connection, request.model.model, dimensions);
    } catch (error) {
      throw unsupported(error);
    }
    try {
      const result = await embedMany({
        model: call.model,
        values: [...request.values],
        providerOptions: call.providerOptions,
        maxParallelCalls: EMBED_PARALLEL_CALLS,
        maxRetries,
        ...(signal ? { abortSignal: signal } : {}),
      });
      const embeddings = result.embeddings.map((vector) => [...vector]);
      const tokens = result.usage.tokens;
      await record({
        purpose: 'embedding',
        source: request.source,
        modelService: request.model.modelService,
        model: request.model.model,
        inputTokens: tokens,
        outputTokens: 0,
        units: request.values.length,
      });
      return {
        embeddings,
        dimension: embeddings[0]?.length ?? 0,
        model: request.model.model,
        tokens,
      };
    } catch (error) {
      throw classify(error, signal);
    }
  }

  async function rerank(request: RerankRequest): Promise<RerankResult> {
    const { signal } = request;
    const connection = await source.connectionFor(request.model, 'rerank');
    if (request.documents.length === 0) return { ranking: [] };
    let model: ReturnType<typeof rerankingModel>;
    try {
      model = rerankingModel(connection, request.model.model);
    } catch (error) {
      throw unsupported(error);
    }
    try {
      const result = await sdkRerank({
        model,
        query: request.query,
        documents: [...request.documents],
        ...(request.topN === undefined ? {} : { topN: request.topN }),
        maxRetries,
        ...(signal ? { abortSignal: signal } : {}),
      });
      const metadata = result.providerMetadata?.[RERANK_METADATA_KEY];
      const tokens =
        isRecord(metadata) && typeof metadata.totalTokens === 'number'
          ? metadata.totalTokens
          : 0;
      await record({
        purpose: 'rerank',
        source: request.source,
        modelService: request.model.modelService,
        model: request.model.model,
        inputTokens: tokens,
        outputTokens: 0,
        units: request.documents.length,
      });
      return {
        ranking: result.ranking.map((item) => ({
          index: item.originalIndex,
          score: item.score,
        })),
      };
    } catch (error) {
      throw classify(error, signal);
    }
  }

  async function generate(request: GenerateRequest): Promise<{ text: string }> {
    const { signal } = request;
    const connection = await source.connectionFor(request.model, 'chat');
    try {
      const result = await generateText({
        model: languageModel(connection, request.model.model),
        ...(request.system ? { instructions: request.system } : {}),
        prompt: request.prompt,
        ...(request.maxOutputTokens
          ? { maxOutputTokens: request.maxOutputTokens }
          : {}),
        maxRetries,
        ...(signal ? { abortSignal: signal } : {}),
      });
      const usage = usageOf(result.totalUsage);
      await record({
        purpose: 'text',
        source: request.source,
        modelService: request.model.modelService,
        model: result.response.modelId || request.model.model,
        inputTokens:
          usage.inputTokens +
          (usage.cacheReadTokens ?? 0) +
          (usage.cacheWriteTokens ?? 0),
        outputTokens: usage.outputTokens,
        units: 1,
      });
      return { text: result.text };
    } catch (error) {
      throw classify(error, signal);
    }
  }

  return {
    catalog: (kind) => source.catalog(kind),
    embed,
    rerank,
    generate,
    async check(ref) {
      try {
        return answered(
          await checkModel(await source.connectionFor(ref), ref.model),
        );
      } catch (error) {
        return { ok: false, message: classify(error).message };
      }
    },
    stream,
    async languageModel(ref) {
      const connection = await source.connectionFor(ref);
      try {
        return languageModel(connection, ref.model);
      } catch (error) {
        throw classify(error);
      }
    },
  };
}
