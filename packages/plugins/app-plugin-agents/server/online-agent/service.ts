import { nativeInputParts } from './input.js';
import type { BackgroundOnlineAgent, RealtimeOnlineAgent } from './agent.js';
import {
  NativeRealtimeOnlineAgent,
  NativeBackgroundOnlineAgent,
  type NativeSessionHost,
} from './native-session.js';
import { ConfiguredRunnerOnlineAgent } from './runner-session.js';
import { OnlineAgentUIStreams } from './ui-streams.js';
import { NativeMessages } from './messages.js';
import { NativeOnlineAgent } from './native.js';
import type { NativeApproval } from './native-store.js';
import type { Schema, LanguageModel, ModelMessage } from 'ai';
import type { ServiceResolver } from '@nocobase/service-provider';
import type {
  OnlineAgentRealtimeOptions,
  OnlineAgentRunnerBackend,
} from './realtime.js';
import { conflict, invalid } from '../kernel/errors.js';
import type { IdSource } from '../kernel/ids.js';
import type { ModelRef } from '../../shared/models.js';
import {
  OnlineAgentConfigurator,
  type OnlineAgentContext,
  type OnlineAgentConfig,
  type OnlineAgentOptions,
} from './config.js';
import {
  jsonSafe,
  type OnlineAgentJson,
  type OnlineAgentOutcome,
} from './codec.js';
import type {
  OnlineAgentSession,
  OnlineAgentSessionManager,
} from './sessions.js';
import type { ResolvedPageContext } from '../../shared/conversations.js';
import type { AppUIMessage } from '../../shared/online-agent.js';

type OnlineAgentAcceptance = {
  promise: Promise<number>;
  resolve(seq: number): void;
  reject(error: unknown): void;
};

function acceptance(): OnlineAgentAcceptance {
  let resolve!: (seq: number) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<number>((done, failed) => {
    resolve = done;
    reject = failed;
  });
  return { promise, resolve, reject };
}

export type OnlineAgentResult =
  | { ok: true; data: OnlineAgentJson }
  | { ok: false; reason: 'pending' }
  | { ok: false; reason: 'failed' | 'cancelled'; error: OnlineAgentSafeError };

export type OnlineAgentSafeError = {
  code: 'EXECUTION_FAILED' | 'EXECUTION_CANCELLED' | 'OUTPUT_INVALID';
  message: string;
};

/** A safe execution failure; admission and infrastructure errors still throw separately. */
export class OnlineAgentResultError extends Error {
  readonly code: OnlineAgentSafeError['code'];
  constructor(
    readonly reason: 'failed' | 'cancelled',
    error: OnlineAgentSafeError,
  ) {
    super(error.message);
    this.name = 'OnlineAgentResultError';
    this.code = error.code;
  }
}

type Observation = { result: OnlineAgentResult } | { error: unknown };
export type OnlineAgentExecution = {
  admitted?: boolean;
  observation?: Observation;
  observers: Set<(value: Observation) => void>;
  abort: AbortController;
  task?: Promise<void>;
  finalize?: () => Promise<void>;
  finalizing?: Promise<void>;
};

export type {
  OnlineAgent,
  RealtimeOnlineAgent,
  BackgroundOnlineAgent,
} from './agent.js';
export class OnlineAgentService {
  readonly configurator: OnlineAgentConfigurator =
    new OnlineAgentConfigurator();
  private stopping = false;
  private active = new Map<string, OnlineAgentExecution>();
  private gates = new Map<string, Promise<unknown>>();
  private native: NativeOnlineAgent;
  readonly uiStreams: OnlineAgentUIStreams;
  constructor(
    private deps: {
      sessions: OnlineAgentSessionManager;
      runner?: OnlineAgentRunnerBackend;
      ids: IdSource;
      resolver?: ServiceResolver;
      model(ref: ModelRef, sessionId: string): Promise<LanguageModel>;
      defaultModel(): Promise<ModelRef | null>;
      uiStreams?: OnlineAgentUIStreams;
      onError(error: unknown): void;
    },
  ) {
    this.uiStreams =
      deps.uiStreams ??
      new OnlineAgentUIStreams({ onError: (error) => deps.onError(error) });
    deps.sessions.native.messages = new NativeMessages(
      this.configurator,
      deps.resolver,
    );
    this.native = new NativeOnlineAgent({
      uiStreams: this.uiStreams,
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
  /** Called only by the server Provider before routes are mounted. */
  async recoverAtStartup(): Promise<void> {
    await this.deps.sessions.recoverAtStartup();
  }
  async shutdown(): Promise<void> {
    this.stopping = true;
    await this.deps.runner?.shutdown();
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
    await this.uiStreams.shutdown();
    if (failures.length)
      console.warn(
        'OnlineAgent finalization failed during shutdown.',
        new AggregateError(failures),
      );
  }

  /** Read-only process occupancy; no session lookup or authorization bypass. */
  isActive(sessionId: string): boolean {
    return this.active.has(sessionId);
  }

  /** The application authorizes its business event before delivering it as the conversation owner. */
  async notify(
    context: OnlineAgentContext,
    id: string,
    input: {
      id: string;
      parts: AppUIMessage['parts'];
    },
  ): Promise<AppUIMessage> {
    this.trusted(context);
    if (!input.id || input.id.length > 64)
      throw invalid('A valid notification ID is required.');
    return this.deps.sessions.native.deliver(
      context.user.id,
      id,
      input.id,
      input.parts,
    );
  }
  get recovery(): 'shared' | 'live' {
    return this.uiStreams.enabled ? 'shared' : 'live';
  }
  async producerAvailable(
    id: string,
    persistedRunning: boolean = true,
  ): Promise<boolean> {
    return (
      this.isActive(id) ||
      (persistedRunning && (await this.uiStreams.producerAvailable(id)))
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
  private trusted(context: OnlineAgentContext): void {
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
  }
  private open(
    context: OnlineAgentContext,
    kind: 'realtime',
    options: OnlineAgentRealtimeOptions,
    prepared?: { config: OnlineAgentConfig; hasModel: boolean },
  ): Promise<NativeRealtimeOnlineAgent>;
  private open(
    context: OnlineAgentContext,
    kind: 'background',
    options: OnlineAgentRealtimeOptions,
    prepared?: { config: OnlineAgentConfig; hasModel: boolean },
  ): Promise<NativeBackgroundOnlineAgent>;
  private async open(
    context: OnlineAgentContext,
    kind: OnlineAgentSession['kind'],
    options: OnlineAgentOptions & {
      sessionId?: string;
      selectedModel?: ModelRef;
      source?: string;
      title?: string;
      showInChatList?: boolean;
    },
    prepared?: { config: OnlineAgentConfig; hasModel: boolean },
  ) {
    this.trusted(context);
    let id = options.sessionId;
    if (!id) {
      const defaults = await this.deps.sessions.defaults(context.user.id);
      const selection =
        prepared ??
        (await this.configurator.resolveSelection(
          context,
          { ...options, scope: options.scope ?? defaults.scope },
          undefined,
          defaults.model
            ? [`${defaults.model.modelService}/${defaults.model.model}`]
            : [],
        ));
      const { config, hasModel } = selection;
      if (config.agentId && config.agentId !== 'online')
        throw invalid('This execution requires a Runner realtime adapter.');
      if (!hasModel) {
        const fallback =
          options.selectedModel ??
          defaults.model ??
          (await this.deps.defaultModel());
        if (fallback)
          config.model = [`${fallback.modelService}/${fallback.model}`];
      }
      const model = options.selectedModel ?? this.firstModel(config.model);
      this.validateModel(config.model, model);
      await this.deps.model(model, '');
      id = await this.deps.sessions.create(
        context.user.id,
        kind,
        config,
        model,
        {
          source: options.source,
          title: options.title,
          showInChatList: options.showInChatList,
        },
      );
    }
    const loaded = await this.deps.sessions.load(context.user.id, id);
    if (loaded.kind !== kind)
      throw invalid('This session has a different execution kind.');
    if (
      options.agentId &&
      options.agentId !== (loaded.config.agentId ?? 'online')
    )
      throw conflict('Start a new conversation to choose another agent.');
    const host: NativeSessionHost = {
      sessions: this.deps.sessions,
      native: this.native,
      active: this.active,
      uiStreams: this.uiStreams,
      gate: (id, work) => this.gate(id, work),
      finish: (execution) => this.finish(execution),
      start: (...args) => this.start(...args),
      approve: (...args) => this.approve(...args),
      observe: (...args) => this.observe(...args),
    };
    return kind === 'realtime'
      ? new NativeRealtimeOnlineAgent(host, context, loaded, options)
      : new NativeBackgroundOnlineAgent(host, context, loaded, options);
  }
  async configure(
    context: OnlineAgentContext,
    id: string,
    options: OnlineAgentOptions,
    selectedModel?: ModelRef,
    boundary?: 'http',
  ): Promise<OnlineAgentConfig & { selectedModel: ModelRef | null }> {
    this.trusted(context);
    const runner = await this.deps.runner?.configuration(context, id);
    if (runner) {
      const session = await this.deps.runner!.open(context, runner, {
        sessionId: id,
      });
      if ((await session.status()) === 'running')
        throw conflict('This conversation is busy.');
      if (selectedModel)
        throw invalid('Runner chat does not use a native model.');
      const config = await this.configurator.resolve(
        context,
        options,
        runner,
        [],
        boundary === 'http',
      );
      if (config.agentId !== runner.agentId)
        throw conflict('Start a new conversation to choose another agent.');
      await this.deps.runner!.configure(context, id, config, runner);
      return { ...config, selectedModel: null };
    }
    await this.realtime(context, { sessionId: id });
    return this.gate(id, async () => {
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
      await this.deps.sessions.configure(context.user.id, id, config, model);
      return { ...config, selectedModel: model };
    });
  }
  async configuration(
    context: OnlineAgentContext,
    id: string,
  ): Promise<OnlineAgentConfig & { selectedModel: ModelRef | null }> {
    this.trusted(context);
    const runner = await this.deps.runner?.configuration(context, id);
    if (runner) return { ...runner, selectedModel: null };
    await this.realtime(context, { sessionId: id });
    const session = await this.deps.sessions.load(context.user.id, id);
    return { ...session.config, selectedModel: session.model };
  }
  async realtime(
    context: OnlineAgentContext,
    options: OnlineAgentRealtimeOptions = {},
    boundary?: 'http',
  ): Promise<RealtimeOnlineAgent> {
    this.trusted(context);
    let prepared: { config: OnlineAgentConfig; hasModel: boolean } | undefined;
    if (options.sessionId) {
      const binding = await this.deps.runner?.configuration(
        context,
        options.sessionId,
      );
      if (binding) {
        if (options.agentId && options.agentId !== binding.agentId)
          throw conflict('Start a new conversation to choose another agent.');
        const {
          sessionId: _id,
          source: _source,
          title: _title,
          showInChatList: _showInChatList,
          selectedModel,
          ...overrides
        } = options;
        if (Object.keys(overrides).length || selectedModel) {
          const session = await this.deps.runner!.open(context, binding, {
            sessionId: options.sessionId,
          });
          if ((await session.status()) === 'running')
            throw conflict('This conversation is busy.');
        }
        const runner = await this.deps.runner!.open(context, binding, {
          ...options,
          selectedModel,
        });
        return new ConfiguredRunnerOnlineAgent(
          runner,
          context,
          this.deps.runner!,
          this.configurator,
          binding.agentId,
          Object.keys(overrides).length ? overrides : undefined,
        );
      }
    } else {
      const defaults = await this.deps.sessions.defaults(context.user.id);
      // Select the executor before querying any native model service.
      prepared = await this.configurator.resolveSelection(
        context,
        {
          ...options,
          scope: options.scope ?? defaults.scope,
        },
        undefined,
        [],
        boundary === 'http',
      );
      if (prepared.config.agentId && prepared.config.agentId !== 'online') {
        if (!this.deps.runner)
          throw invalid('Runner realtime execution is unavailable.');
        const runner = await this.deps.runner.open(
          context,
          prepared.config,
          options,
        );
        return this.realtime(context, { sessionId: runner.sessionId });
      }
    }
    return this.open(context, 'realtime', options, prepared);
  }
  background(
    context: OnlineAgentContext,
    options: OnlineAgentOptions & {
      sessionId?: string;
      selectedModel?: ModelRef;
      source?: string;
      title?: string;
    } = {},
  ): Promise<BackgroundOnlineAgent> {
    return this.open(context, 'background', options);
  }
  private firstModel(models: string[]): ModelRef {
    const value = models[0];
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
    this.trusted(context);
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
      onExecution?.(execution);
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
    return accepted.promise;
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
      onExecution?.(execution);
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
    return accepted.promise;
  }
}
