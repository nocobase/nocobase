import {
  streamText,
  stepCountIs,
  type LanguageModel,
  type ModelMessage,
} from 'ai';
import type { ServiceResolver } from '@nocobase/service-provider';
import type { ZodType } from 'zod';
import { reasoningOf } from '../online/gateway.js';
import { decode, encode } from './codec.js';
import { conflict, invalid } from '../kernel/errors.js';
import type { IdSource } from '../kernel/ids.js';
import type { ModelRef } from '../../shared/models.js';
import {
  OnlineAgentConfigurer,
  type Context,
  type Options,
  type ToolContext,
} from './config.js';
import { jsonSafe, project, type Json, type Outcome } from './codec.js';
import type { Session, SessionManager } from './sessions.js';
import {
  MemoryOnlineAgentStreamManager,
  type StreamManager,
  type Writer,
} from './streams.js';

type Acceptance = {
  promise: Promise<void>;
  resolve(): void;
  reject(error: unknown): void;
};

function acceptance(): Acceptance {
  let resolve!: () => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<void>((done, failed) => {
    resolve = done;
    reject = failed;
  });
  return { promise, resolve, reject };
}

type Execution = {
  abort: AbortController;
  task?: Promise<void>;
  finalize?: () => Promise<void>;
  finalizing?: Promise<void>;
};

export interface Agent {
  readonly sessionId: string;
  status(): Promise<'running' | 'idle'>;
  history(): Promise<ModelMessage[]>;
  receive(): Promise<ReadableStream<import('./streams.js').Event> | null>;
  abort(): Promise<void>;
  retryFinalization(): Promise<void>;
  send(
    messages: ModelMessage[],
    input?: {
      attachmentIds?: string[][];
      overrides?: Options;
      selectedModel?: ModelRef;
    },
  ): Promise<void>;
  run(
    messages: ModelMessage[],
    schema?: ZodType,
    input?: { overrides?: Options; selectedModel?: ModelRef },
  ): Promise<void>;
  get(): Promise<Json>;
}
export class OnlineAgentService {
  readonly configurer: OnlineAgentConfigurer = new OnlineAgentConfigurer();
  private stopping = false;
  private active = new Map<string, Execution>();
  private gates = new Map<string, Promise<unknown>>();
  readonly streams: StreamManager;
  constructor(
    private deps: {
      sessions: SessionManager;
      ids: IdSource;
      resolver?: ServiceResolver;
      model(ref: ModelRef, sessionId: string): Promise<LanguageModel>;
      defaultModel(): Promise<ModelRef | null>;
      streams?: StreamManager;
      onError(error: unknown): void;
    },
  ) {
    this.streams = deps.streams ?? new MemoryOnlineAgentStreamManager();
  }
  async shutdown(): Promise<void> {
    this.stopping = true;
    const executions = [...this.active.values()];
    executions.forEach((execution) => execution.abort.abort());
    const results = await Promise.allSettled(
      executions.map(async (execution) => {
        await execution.task;
        await this.finish(execution);
      }),
    );
    const failures = results.flatMap((result) =>
      result.status === 'rejected' ? [result.reason as unknown] : [],
    );
    if (failures.length)
      throw new AggregateError(
        failures,
        'OnlineAgent finalization failed during shutdown.',
      );
  }

  private async gate<T>(id: string, work: () => Promise<T>): Promise<T> {
    const previous = this.gates.get(id) ?? Promise.resolve();
    const next = previous.catch(() => {}).then(work);
    this.gates.set(id, next);
    try {
      return await next;
    } finally {
      if (this.gates.get(id) === next) this.gates.delete(id);
    }
  }
  private async open(
    context: Context,
    kind: Session['kind'],
    options: Options & { sessionId?: string; selectedModel?: ModelRef },
  ) {
    if (
      !context.user.id ||
      !context.authorization ||
      context.credentials === undefined ||
      context.credentials === null ||
      context.authorization.identity.principal?.type !== 'user' ||
      context.authorization.identity.principal?.id !== context.user.id
    )
      throw invalid(
        'A trusted user, authorization and full entry credentials are required.',
      );
    if (this.stopping) throw conflict('OnlineAgent is stopping.');
    let id = options.sessionId;
    if (!id) {
      const defaults = await this.deps.sessions.defaults(context.user.id);
      const model =
        options.selectedModel ??
        defaults.model ??
        (await this.deps.defaultModel());
      if (!model) throw invalid('Select a chat model.');
      const config = await this.configurer.resolve(
        context,
        { ...options, scope: options.scope ?? defaults.scope },
        undefined,
        [`${model.modelService}/${model.model}`],
      );
      this.validateModel(config.model, model);
      await this.deps.model(model, '');
      id = await this.deps.sessions.create(
        context.user.id,
        kind,
        config,
        model,
      );
    }
    const loaded = await this.deps.sessions.load(context.user.id, id);
    if (loaded.kind !== kind)
      throw invalid('This session has a different execution kind.');
    const sessionId = id;
    const userId = context.user.id;
    const {
      sessionId: _sessionId,
      selectedModel: requestedModel,
      ...requestedOptions
    } = options;
    const requestedOverrides =
      options.sessionId && Object.keys(requestedOptions).length
        ? requestedOptions
        : undefined;
    if (
      options.sessionId &&
      (requestedOverrides || requestedModel) &&
      (this.active.has(sessionId) ||
        loaded.call?.state === 'running' ||
        loaded.call?.closing)
    )
      throw conflict('This conversation is busy.');
    const status = async () => {
      const row = await this.deps.sessions.load(userId, sessionId);
      return this.active.has(sessionId) ||
        row.call?.state === 'running' ||
        row.call?.closing
        ? ('running' as const)
        : ('idle' as const);
    };
    return {
      sessionId,
      status,
      history: () => this.deps.sessions.history(userId, sessionId),
      receive: async () => {
        await this.deps.sessions.load(userId, sessionId);
        return this.streams.receive(sessionId);
      },
      abort: async () => {
        await this.deps.sessions.load(userId, sessionId);
        const execution = await this.gate(sessionId, async () => {
          const current = this.active.get(sessionId);
          current?.abort.abort();
          return current;
        });
        if (execution) {
          await execution.task;
          await this.finish(execution);
        }
      },
      retryFinalization: async () => {
        await this.deps.sessions.load(userId, sessionId);
        const execution = this.active.get(sessionId);
        if (execution) {
          await execution.task;
          await this.finish(execution);
        }
      },
      send: (
        messages: ModelMessage[],
        input?: {
          attachmentIds?: string[][];
          overrides?: Options;
          selectedModel?: ModelRef;
        },
      ) =>
        this.start(context, sessionId, messages, {
          ...input,
          overrides: input?.overrides ?? requestedOverrides,
          selectedModel: input?.selectedModel ?? requestedModel,
        }),
      run: (
        messages: ModelMessage[],
        schema?: ZodType,
        input?: { overrides?: Options; selectedModel?: ModelRef },
      ) =>
        this.start(
          context,
          sessionId,
          messages,
          {
            ...input,
            overrides: input?.overrides ?? requestedOverrides,
            selectedModel: input?.selectedModel ?? requestedModel,
          },
          schema,
        ),
      get: async (): Promise<Json> => {
        const row = await this.deps.sessions.load(userId, sessionId);
        if (
          (await status()) !== 'idle' ||
          row.call?.outcome !== 'completed' ||
          row.call.result === undefined
        )
          throw conflict('No successful structured result is available.');
        return row.call.result;
      },
    };
  }
  realtime(
    context: Context,
    options: Options & { sessionId?: string; selectedModel?: ModelRef } = {},
  ): Promise<Agent> {
    return this.open(context, 'realtime', options);
  }
  background(
    context: Context,
    options: Options & { sessionId?: string; selectedModel?: ModelRef } = {},
  ): Promise<Agent> {
    return this.open(context, 'background', options);
  }
  private validateModel(allowed: string[], model: ModelRef) {
    if (!allowed.includes(`${model.modelService}/${model.model}`))
      throw invalid('The selected model is outside this configuration.');
  }
  private finish(execution: Execution) {
    if (!execution.finalizing)
      execution.finalizing = execution.finalize?.().finally(() => {
        execution.finalizing = undefined;
      });
    return execution.finalizing;
  }
  private async start(
    context: Context,
    id: string,
    messages: ModelMessage[],
    input?: {
      attachmentIds?: string[][];
      overrides?: Options;
      selectedModel?: ModelRef;
    },
    schema?: ZodType,
  ): Promise<void> {
    if (!messages.length || messages.some((message) => message.role !== 'user'))
      throw invalid('Input must contain user messages.');
    messages.forEach((message) => encode(message));
    if (this.stopping) throw conflict('OnlineAgent is stopping.');
    const execution: Execution = { abort: new AbortController() };
    const accepted = acceptance();
    await this.gate(id, async () => {
      if (this.stopping) throw conflict('OnlineAgent is stopping.');
      if (this.active.has(id)) throw conflict('This conversation is busy.');
      this.active.set(id, execution);
      execution.task = this.prepareAndExecute(
        context,
        id,
        decode(encode(messages)) as ModelMessage[],
        input,
        schema,
        execution,
        accepted,
      );
    });
    return accepted.promise;
  }

  private async prepareAndExecute(
    context: Context,
    id: string,
    messages: ModelMessage[],
    input:
      | {
          attachmentIds?: string[][];
          overrides?: Options;
          selectedModel?: ModelRef;
        }
      | undefined,
    schema: ZodType | undefined,
    execution: Execution,
    accepted: Acceptance,
  ): Promise<void> {
    let session: Session;
    let config: Session['config'];
    let model: LanguageModel;
    let history: ModelMessage[];
    let afterSeq: number;
    const pending: Promise<unknown>[] = [];
    let boundContext: ToolContext;
    let tools: ReturnType<OnlineAgentConfigurer['bind']>;
    try {
      session = await this.deps.sessions.load(context.user.id, id);
      if (
        session.call?.state === 'running' ||
        session.call?.closing ||
        session.call?.requiresEffectReview
      )
        throw conflict(
          'The previous execution has not been confirmed stopped.',
        );
      config = input?.overrides
        ? await this.configurer.resolve(
            context,
            input.overrides,
            session.config,
          )
        : session.config;
      const selected = input?.selectedModel ?? session.model;
      this.validateModel(config.model, selected);
      if (selected.modelService !== session.model.modelService)
        throw invalid('Create a new session to change model services.');
      model = await this.deps.model(selected, id);
      boundContext = Object.freeze({
        ...context,
        user: Object.freeze({ ...context.user }),
        variable: config.variable,
        systemPrompt: config.systemPrompt,
        signal: execution.abort.signal,
      });
      tools = this.configurer.bind(
        config,
        boundContext,
        this.deps.resolver,
        (task) => {
          pending.push(task);
        },
      );
      history = await this.deps.sessions.history(context.user.id, id);
      execution.abort.signal.throwIfAborted();
      afterSeq = await this.deps.sessions.accept(
        context.user.id,
        id,
        config,
        selected,
        messages.map((message, index) => ({
          id: this.deps.ids.next(),
          message,
          attachments: input?.attachmentIds?.[index],
        })),
      );
    } catch (error) {
      if (this.active.get(id) === execution) this.active.delete(id);
      accepted.reject(error);
      return;
    }
    let writer: Writer | undefined;
    let response: ModelMessage[] = [];
    let partial = '';
    let publishedLength = 0;
    let outcome: Outcome = 'completed';
    let result: Json | undefined;
    let sdkStopped: Promise<void> | undefined;
    try {
      if (session.kind === 'realtime')
        writer = await this.streams.open(id, afterSeq);
      let sdkFailure: { error: unknown } | undefined;
      const generated = streamText({
        model,
        system: config.systemPrompt,
        messages: [...history, ...messages],
        tools,
        toolsContext: Object.fromEntries(
          Object.keys(tools).map((name) => [name, boundContext]),
        ),
        abortSignal: execution.abort.signal,
        maxRetries: 0,
        reasoning: reasoningOf(config.thinking),
        stopWhen: stepCountIs(20),
        onChunk: async ({ chunk }) => {
          if (chunk.type === 'text-delta') {
            partial += chunk.text;
            if (
              publishedLength === 0 ||
              partial.length - publishedLength >= 1024
            ) {
              await writer?.publish(response.length, project(null, partial));
              publishedLength = partial.length;
            }
          }
        },
        onError: ({ error }) => {
          sdkFailure = { error };
        },
        onStepEnd: async (step) => {
          if (
            sdkFailure ||
            execution.abort.signal.aborted ||
            step.finishReason === 'error' ||
            step.finishReason === 'other'
          )
            return;
          const first = response.length;
          response.push(...step.response.messages);
          partial = '';
          publishedLength = 0;
          for (let index = first; index < response.length; index++)
            await writer?.publish(index, project(response[index]));
        },
      });
      sdkStopped = Promise.resolve(generated.responseMessages).then(
        () => {},
        () => {},
      );
      accepted.resolve();
      for await (const part of generated.fullStream)
        if (part.type === 'error') sdkFailure = { error: part.error };
      if (sdkFailure) throw sdkFailure.error;
      response = await generated.responseMessages;
      if (execution.abort.signal.aborted) outcome = 'cancelled';
      else {
        if ((await generated.finishReason) !== 'stop')
          throw new Error('The model stopped before completing its answer.');
        if (schema)
          result = jsonSafe(schema.parse(JSON.parse(await generated.text)));
        else if (session.kind === 'background')
          result = jsonSafe(await generated.text);
      }
    } catch (error) {
      outcome = execution.abort.signal.aborted ? 'cancelled' : 'failed';
      execution.abort.abort();
      this.deps.onError(error);
      // The input is already committed; an open/start failure is an accepted failed execution.
      accepted.resolve();
    }
    await sdkStopped;
    await Promise.allSettled(pending);
    const items: { id: string; message: ModelMessage | null }[] = response.map(
      (message) => ({
        id: this.deps.ids.next(),
        message: message,
      }),
    );
    if (partial) items.push({ id: this.deps.ids.next(), message: null });
    let saved: number | undefined;
    let sealed = false;
    execution.finalize = async () => {
      if (saved === undefined)
        saved = await this.deps.sessions.save(
          context.user.id,
          id,
          items.map((item) => ({
            ...item,
            ...(item.message === null ? { partial } : {}),
          })),
          {
            actorId: context.user.id,
            state: 'running',
            outcome,
            ...(outcome !== 'completed' && pending.length
              ? { requiresEffectReview: true }
              : {}),
            ...(result === undefined ? {} : { result }),
          },
        );
      if (!sealed) {
        await writer?.finish(outcome, saved);
        sealed = true;
      }
      await this.deps.sessions.finish(context.user.id, id);
      if (this.active.get(id) === execution) this.active.delete(id);
    };
    try {
      await this.finish(execution);
    } catch (error) {
      this.deps.onError(error);
    }
  }
}
