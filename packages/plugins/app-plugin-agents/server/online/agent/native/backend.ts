import { nativeInputParts } from '../messages/validation.js';
import {
  NativeRealtimeOnlineAgent,
  NativeBackgroundOnlineAgent,
} from './session.js';
import type {
  NativeSessionHost,
  OnlineAgentBackend,
  OnlineAgentSessionManager,
} from '../contracts.js';
import type { OnlineAgentUIStreams } from '../transport/streams.js';
import { NativeMessages } from '../messages/projection.js';
import { NativeOnlineAgent } from './execution.js';
import type {
  NativeApproval,
  OnlineAgentRealtimeOptions,
  OnlineAgentBoundary,
  OnlineAgentInitialConfiguration,
  OnlineAgentConfiguration,
  OnlineAgentResult,
  OnlineAgentContext,
  OnlineAgentConfig,
  OnlineAgentOptions,
  OnlineAgentJson,
  OnlineAgentOutcome,
} from '../types.js';
import type { Schema, LanguageModel, ModelMessage } from 'ai';
import type { ServiceResolver } from '@nocobase/service-provider';
import { conflict, invalid } from '../../../kernel/errors.js';
import type { IdSource } from '../../../kernel/ids.js';
import type { ModelRef } from '../../../../shared/models.js';
import type { OnlineAgentConfigurator } from '../configuration.js';
import { jsonSafe } from '../messages/json.js';
import type { OnlineAgentSession } from '../persistence/types.js';
import type { ResolvedPageContext } from '../../../../shared/conversations.js';
import type {
  Observation,
  OnlineAgentExecution,
  OnlineAgentAcceptance,
} from './types.js';

function acceptance(): OnlineAgentAcceptance {
  let resolve!: (seq: number) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<number>((done, failed) => {
    resolve = done;
    reject = failed;
  });
  return { promise, resolve, reject };
}

export class NativeOnlineAgentBackend implements OnlineAgentBackend {
  readonly kind = 'native' as const;
  readonly configurator: OnlineAgentConfigurator;
  private stopping = false;
  private active = new Map<string, OnlineAgentExecution>();
  private gates = new Map<string, Promise<unknown>>();
  private native: NativeOnlineAgent;
  readonly uiStreams: OnlineAgentUIStreams;
  constructor(
    private deps: {
      sessions: OnlineAgentSessionManager;
      configurator: OnlineAgentConfigurator;
      ids: IdSource;
      resolver?: ServiceResolver;
      model(ref: ModelRef, sessionId: string): Promise<LanguageModel>;
      defaultModel(): Promise<ModelRef | null>;
      uiStreams: OnlineAgentUIStreams;
      onError(error: unknown): void;
    },
  ) {
    this.configurator = deps.configurator;
    this.uiStreams = deps.uiStreams;
    deps.sessions.native.messages = new NativeMessages(
      this.configurator,
      deps.resolver,
    );
    this.native = new NativeOnlineAgent({
      ...deps,
      configurator: this.configurator,
      finish: (execution) => {
        const current = [...this.active.values()].find(
          (value) => value === execution,
        );
        return current ? this.finish(current) : undefined;
      },
      complete: (id, execution, result) => {
        const current = this.active.get(id);
        if (current !== execution) return;
        this.active.delete(id);
        if (result && current) {
          try {
            this.notifyObservers(current, {
              result: this.result(
                result.outcome,
                result.data,
                result.outputInvalid,
              ),
            });
          } catch (error) {
            this.notifyObservers(current, { error });
          }
        }
      },
    });
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
      console.warn(
        'OnlineAgent finalization failed during shutdown.',
        new AggregateError(failures),
      );
  }

  /** @internal Native process occupancy; no session lookup or authorization bypass. */
  hasLocalExecution(sessionId: string): boolean {
    return this.active.has(sessionId);
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
  private available(): void {
    if (this.stopping) throw conflict('OnlineAgent is stopping.');
  }
  async createRealtime(
    context: OnlineAgentContext,
    initial: OnlineAgentInitialConfiguration,
    options: OnlineAgentRealtimeOptions,
    boundary?: OnlineAgentBoundary,
  ): Promise<NativeRealtimeOnlineAgent> {
    const id = await this.create(context, 'realtime', initial, options);
    return this.restoreRealtime(context, { sessionId: id }, boundary);
  }
  async restoreRealtime(
    context: OnlineAgentContext,
    options: OnlineAgentRealtimeOptions & { sessionId: string },
    boundary?: OnlineAgentBoundary,
  ): Promise<NativeRealtimeOnlineAgent> {
    const loaded = await this.load(context, 'realtime', options);
    return new NativeRealtimeOnlineAgent(
      this.host(),
      context,
      loaded,
      options,
      boundary,
    );
  }
  async createBackground(
    context: OnlineAgentContext,
    initial: OnlineAgentInitialConfiguration,
    options: OnlineAgentRealtimeOptions,
    boundary?: OnlineAgentBoundary,
  ): Promise<NativeBackgroundOnlineAgent> {
    const id = await this.create(context, 'background', initial, options);
    return this.restoreBackground(context, { sessionId: id }, boundary);
  }
  async restoreBackground(
    context: OnlineAgentContext,
    options: OnlineAgentRealtimeOptions & { sessionId: string },
    boundary?: OnlineAgentBoundary,
  ): Promise<NativeBackgroundOnlineAgent> {
    const loaded = await this.load(context, 'background', options);
    return new NativeBackgroundOnlineAgent(
      this.host(),
      context,
      loaded,
      options,
      boundary,
    );
  }
  private async create(
    context: OnlineAgentContext,
    kind: OnlineAgentSession['kind'],
    initial: OnlineAgentInitialConfiguration,
    options: OnlineAgentRealtimeOptions,
  ): Promise<string> {
    this.available();
    const config = structuredClone(initial.config);
    if (config.agentId && config.agentId !== 'online')
      throw invalid('This configuration belongs to a Runner backend.');
    if (!initial.hasModel) {
      const fallback =
        options.selectedModel ??
        initial.defaultModel ??
        (await this.deps.defaultModel());
      if (fallback)
        config.model = [`${fallback.modelService}/${fallback.model}`];
    }
    const model = options.selectedModel ?? this.firstModel(config.model);
    this.validateModel(config.model, model);
    await this.deps.model(model, '');
    this.available();
    return this.deps.sessions.create(context.user.id, kind, config, model, {
      source: options.source,
      title: options.title,
      showInChatList: options.showInChatList,
    });
  }
  private async load(
    context: OnlineAgentContext,
    kind: OnlineAgentSession['kind'],
    options: OnlineAgentRealtimeOptions & { sessionId: string },
  ): Promise<OnlineAgentSession> {
    this.available();
    const loaded = await this.deps.sessions.load(
      context.user.id,
      options.sessionId,
    );
    if (loaded.kind !== kind)
      throw invalid('This session has a different execution kind.');
    if (
      options.agentId &&
      options.agentId !== (loaded.config.agentId ?? 'online')
    )
      throw conflict('Start a new conversation to choose another agent.');
    return loaded;
  }
  private async retryFinalization(
    context: OnlineAgentContext,
    id: string,
  ): Promise<void> {
    const current = await this.deps.sessions.load(context.user.id, id);
    const execution = this.active.get(id);
    if (execution) {
      await execution.task;
      await this.finish(execution);
    } else if (current.call?.state === 'running' || current.call?.closing) {
      throw conflict(
        'Finalization requires the live producer that owns its snapshot; reconcile history and execution.',
      );
    }
  }

  private async abort(
    context: OnlineAgentContext,
    id: string,
    kind: OnlineAgentSession['kind'],
  ): Promise<void> {
    if (kind === 'background') {
      await this.deps.sessions.load(context.user.id, id);
      const execution = await this.gate(id, async () => {
        const current = this.active.get(id);
        current?.abort.abort();
        return current;
      });
      if (execution) {
        await execution.task;
        await this.finish(execution);
      }
      return;
    }
    // The facade was authorized when opened. Signal before asynchronous reads.
    const execution = this.active.get(id);
    if (execution) {
      execution.abort.abort();
      await execution.task;
      await this.finish(execution);
      return;
    }
    const current = await this.deps.sessions.load(context.user.id, id);
    if (current.call?.state === 'waitingApproval') {
      await this.deps.sessions.native.stop(context.user.id, id);
      return;
    }
    if (current.call?.state === 'running' && !this.active.has(id)) {
      if (
        current.call.executionId &&
        (await this.uiStreams.requestStop(
          context.user.id,
          id,
          current.call.executionId,
        ))
      )
        return;
      throw conflict(
        'The producer is unavailable; stopping has not been confirmed.',
      );
    }
    await this.deps.sessions.load(context.user.id, id);
  }

  private host(): NativeSessionHost {
    return {
      sessions: this.deps.sessions,
      native: this.native,
      uiStreams: this.uiStreams,
      isActive: (id) => this.hasLocalExecution(id),
      abort: (...args) => this.abort(...args),
      retryFinalization: (...args) => this.retryFinalization(...args),
      start: (...args) => this.start(...args),
      approve: (...args) => this.approve(...args),
      observe: (...args) => this.observe(...args),
    };
  }
  async configure(
    context: OnlineAgentContext,
    id: string,
    options: OnlineAgentOptions,
    selectedModel?: ModelRef,
    boundary?: 'http',
  ): Promise<OnlineAgentConfig & { selectedModel: ModelRef | null }> {
    this.available();
    return this.gate(id, async () => {
      this.available();
      if (this.active.has(id)) throw conflict('This conversation is busy.');
      const session = await this.deps.sessions.load(context.user.id, id);
      const config = await this.configurator.resolve(
        context,
        options,
        session.config,
        [],
        boundary === 'http',
      );
      if ((config.agentId ?? 'online') !== (session.config.agentId ?? 'online'))
        throw conflict('Start a new conversation to choose another agent.');
      const model =
        selectedModel ??
        (options.model !== undefined ||
        JSON.stringify(config.model) !== JSON.stringify(session.config.model)
          ? this.firstModel(config.model)
          : session.model);
      this.validateModel(config.model, model);
      await this.deps.model(model, id);
      this.available();
      await this.deps.sessions.configure(context.user.id, id, config, model);
      return { ...config, selectedModel: model };
    });
  }
  async configuration(
    context: OnlineAgentContext,
    id: string,
  ): Promise<OnlineAgentConfiguration> {
    this.available();
    const session = await this.deps.sessions.load(context.user.id, id);
    return { ...session.config, selectedModel: session.model };
  }
  private firstModel(models: string[]): ModelRef {
    const value = models[0];
    if (!value) throw invalid('No enabled chat model is configured.');
    const separator = value?.indexOf('/') ?? -1;
    if (separator < 1 || separator === value.length - 1)
      throw invalid('The selected model is outside this configuration.');
    return {
      modelService: value.slice(0, separator),
      model: value.slice(separator + 1),
    };
  }
  private validateModel(allowed: string[], model: ModelRef) {
    if (!allowed.includes(`${model.modelService}/${model.model}`))
      throw invalid('The selected model is outside this configuration.');
  }
  private notifyObservers(
    execution: OnlineAgentExecution,
    value: Observation,
  ): void {
    execution.observation = value;
    for (const observer of execution.observers) observer(value);
    execution.observers.clear();
  }
  private async observe(
    userId: string,
    id: string,
    wait?: number,
  ): Promise<OnlineAgentResult> {
    // Capture before the ownership read: an earlier waiter must never follow a later turn.
    const execution = this.active.get(id);
    const admitted = execution?.admitted;
    const started = performance.now();
    const row = await (execution
      ? this.deps.sessions.load(userId, id)
      : this.gate(id, async () => {
          if (this.active.has(id))
            throw conflict(
              'The execution changed while reading its result. Read again.',
            );
          return this.deps.sessions.load(userId, id);
        }));
    let observed: Observation;
    if (execution) {
      if (!admitted) throw conflict('No accepted execution is available.');
      if (execution.observation) observed = execution.observation;
      else {
        const remaining =
          wait === undefined
            ? undefined
            : Math.max(0, wait - (performance.now() - started));
        if (remaining === 0) return { ok: false, reason: 'pending' };
        observed = await new Promise<Observation>((resolve) => {
          let timer: ReturnType<typeof setTimeout> | undefined;
          const done = (value: Observation) => {
            clearTimeout(timer);
            execution.observers.delete(done);
            resolve(value);
          };
          execution.observers.add(done);
          if (remaining !== undefined) {
            // Avoid Node's overflow-to-1ms behavior for valid large budgets.
            const deadline = performance.now() + remaining;
            const expire = () => {
              const left = deadline - performance.now();
              if (left <= 0) done({ result: { ok: false, reason: 'pending' } });
              else timer = setTimeout(expire, Math.min(left, 2_147_483_647));
            };
            timer = setTimeout(expire, Math.min(remaining, 2_147_483_647));
          }
        });
      }
    } else {
      if (!row.call) throw conflict('No accepted execution is available.');
      if (row.call.state === 'running' || row.call.closing)
        throw conflict(
          'This execution is not owned by the current server process.',
        );
      observed = { result: this.result(row.call.outcome, row.call.result) };
    }
    if ('error' in observed) throw observed.error;
    // Each observer owns its returned value; mutations cannot affect other waiters.
    return observed.result.ok
      ? { ok: true, data: jsonSafe(observed.result.data) }
      : {
          ...observed.result,
          ...(observed.result.reason === 'pending'
            ? {}
            : { error: { ...observed.result.error } }),
        };
  }
  private result(
    outcome: OnlineAgentOutcome | undefined,
    data?: OnlineAgentJson,
    outputInvalid = false,
  ): OnlineAgentResult {
    if (outcome === 'completed' && data !== undefined)
      return { ok: true, data };
    if (outcome === 'cancelled')
      return {
        ok: false,
        reason: 'cancelled',
        error: {
          code: 'EXECUTION_CANCELLED',
          message: 'The execution was cancelled.',
        },
      };
    if (outcome === 'failed')
      return {
        ok: false,
        reason: 'failed',
        error: {
          code: outputInvalid ? 'OUTPUT_INVALID' : 'EXECUTION_FAILED',
          message: outputInvalid
            ? 'The model output does not match the JSON Schema.'
            : 'The execution failed.',
        },
      };
    throw conflict('No successful structured result is available.');
  }
  private finish(execution: OnlineAgentExecution) {
    if (!execution.finalizing && execution.finalize) {
      execution.observation = undefined;
      execution.finalizing = execution
        .finalize()
        .catch((error: unknown) => {
          this.notifyObservers(execution, {
            error: conflict(
              'The execution could not be finalized. Retry finalization before reading its result.',
            ),
          });
          throw error;
        })
        .finally(() => {
          execution.finalizing = undefined;
        });
    }
    return execution.finalizing;
  }
  private async approve(
    context: OnlineAgentContext,
    id: string,
    input: NativeApproval,
    onExecution?: (execution: OnlineAgentExecution) => void,
  ): Promise<number> {
    this.available();
    const accepted = acceptance();
    const execution: OnlineAgentExecution = {
      abort: new AbortController(),
      observers: new Set(),
    };
    await this.gate(id, async () => {
      if (this.stopping) throw conflict('OnlineAgent is stopping.');
      if (this.active.size >= 1024)
        throw conflict('OnlineAgent execution limit exceeded.');
      if (this.active.has(id)) throw conflict('This conversation is busy.');
      this.active.set(id, execution);
      execution.task = this.native.run(
        context,
        id,
        [],
        undefined,
        execution,
        accepted,
        input,
      );
    });
    const seq = await accepted.promise;
    onExecution?.(execution);
    return seq;
  }
  private async start(
    context: OnlineAgentContext,
    id: string,
    messages: ModelMessage[],
    input?: {
      attachmentIds?: string[][];
      clientId?: string;
      messageId?: string;
      workContext?: ResolvedPageContext;
      overrides?: OnlineAgentOptions;
      selectedModel?: ModelRef;
      boundary?: OnlineAgentBoundary;
    },
    schema?: Schema<OnlineAgentJson>,
    onExecution?: (execution: OnlineAgentExecution) => void,
  ): Promise<number> {
    if (!messages.length || messages.some((message) => message.role !== 'user'))
      throw invalid('Input must contain user messages.');
    // Normalize URL/binary SDK inputs before reserving occupancy; unsupported inputs leave no live producer.
    const inputs = structuredClone(
      messages.map((message, index) => ({
        id:
          index === 0 && input?.messageId
            ? input.messageId
            : this.deps.ids.next(),
        parts: nativeInputParts(message),
        attachments: input?.attachmentIds?.[index] ?? [],
        clientId: input?.clientId,
        workContext: input?.workContext,
        ...(message.providerOptions
          ? {
              providerOptions: jsonSafe(message.providerOptions) as NonNullable<
                typeof message.providerOptions
              >,
            }
          : {}),
      })),
    );
    await this.deps.sessions.load(context.user.id, id);
    if (this.stopping) throw conflict('OnlineAgent is stopping.');
    const execution: OnlineAgentExecution = {
      abort: new AbortController(),
      observers: new Set(),
    };
    const accepted = acceptance();
    await this.gate(id, async () => {
      if (this.stopping) throw conflict('OnlineAgent is stopping.');
      if (this.active.has(id)) throw conflict('This conversation is busy.');
      if (this.active.size >= 1024)
        throw conflict('OnlineAgent execution limit exceeded.');
      this.active.set(id, execution);
      execution.task = this.native.run(
        context,
        id,
        inputs,
        input,
        execution,
        accepted,
        undefined,
        schema,
      );
    });
    const seq = await accepted.promise;
    onExecution?.(execution);
    return seq;
  }
}
