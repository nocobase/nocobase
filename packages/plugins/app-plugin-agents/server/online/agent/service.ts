import type { LanguageModel } from 'ai';
import type { ServiceResolver } from '@nocobase/service-provider';
import type {
  BackgroundOnlineAgent,
  RealtimeOnlineAgent,
  OnlineAgentBackend,
  OnlineAgentSessionManager,
} from './contracts.js';
import type {
  OnlineAgentBoundary,
  OnlineAgentConfiguration,
  OnlineAgentInitialConfiguration,
  OnlineAgentContext,
  OnlineAgentOptions,
  OnlineAgentRealtimeOptions,
} from './types.js';
import { NativeOnlineAgentBackend } from './native/backend.js';
import { OnlineAgentUIStreams } from './transport/streams.js';
import { OnlineAgentConfigurator } from './configuration.js';
import type { IdSource } from '../../kernel/ids.js';
import { conflict, invalid } from '../../kernel/errors.js';
import type { ModelRef } from '../../../shared/models.js';

/** Trusted application entry and backend orchestration; executions belong to their backend. */
export class OnlineAgentService {
  readonly configurator: OnlineAgentConfigurator;
  readonly uiStreams: OnlineAgentUIStreams;
  private readonly native: NativeOnlineAgentBackend;
  private stopping = false;

  constructor(
    private deps: {
      sessions: OnlineAgentSessionManager;
      runner?: OnlineAgentBackend;
      configurator?: OnlineAgentConfigurator;
      ids: IdSource;
      resolver?: ServiceResolver;
      model(ref: ModelRef, sessionId: string): Promise<LanguageModel>;
      defaultModel(): Promise<ModelRef | null>;
      uiStreams?: OnlineAgentUIStreams;
      onError(error: unknown): void;
    },
  ) {
    this.configurator = deps.configurator ?? new OnlineAgentConfigurator();
    this.uiStreams =
      deps.uiStreams ??
      new OnlineAgentUIStreams({ onError: (error) => deps.onError(error) });
    this.native = new NativeOnlineAgentBackend({
      ...deps,
      configurator: this.configurator,
      uiStreams: this.uiStreams,
    });
  }

  /** Only the owning Provider invokes startup recovery before serving requests. */
  async recoverAtStartup(): Promise<void> {
    await this.deps.sessions.recoverAtStartup();
  }

  async shutdown(): Promise<void> {
    this.stopping = true;
    // Both backends settle their work before the one owner closes their shared transport.
    const results = await Promise.allSettled([
      this.native.shutdown(),
      this.deps.runner?.shutdown(),
    ]);
    await this.uiStreams.shutdown();
    const errors = results.flatMap((result) =>
      result.status === 'rejected' ? [result.reason as unknown] : [],
    );
    if (errors.length)
      throw new AggregateError(
        errors,
        'OnlineAgent backends could not shut down.',
      );
  }

  get recovery(): 'shared' | 'live' {
    return this.uiStreams.enabled ? 'shared' : 'live';
  }

  /** Native status projection uses local occupancy even without a realtime output channel. */
  async producerAvailable(
    id: string,
    persistedRunning: boolean = true,
  ): Promise<boolean> {
    return (
      this.native.hasLocalExecution(id) ||
      (persistedRunning && (await this.uiStreams.producerAvailable(id)))
    );
  }

  async configure(
    context: OnlineAgentContext,
    id: string,
    options: OnlineAgentOptions,
    selectedModel?: ModelRef,
    boundary?: OnlineAgentBoundary,
  ): Promise<OnlineAgentConfiguration> {
    this.trusted(context);
    return (await this.persistedBackend(context, id)).configure(
      context,
      id,
      options,
      selectedModel,
      boundary,
    );
  }

  async configuration(
    context: OnlineAgentContext,
    id: string,
  ): Promise<OnlineAgentConfiguration> {
    this.trusted(context);
    return (await this.persistedBackend(context, id)).configuration(
      context,
      id,
    );
  }

  async realtime(
    context: OnlineAgentContext,
    options: OnlineAgentRealtimeOptions = {},
    boundary?: OnlineAgentBoundary,
  ): Promise<RealtimeOnlineAgent> {
    this.trusted(context);
    if (options.sessionId) {
      const backend = await this.persistedBackend(context, options.sessionId);
      return backend.restoreRealtime(
        context,
        { ...options, sessionId: options.sessionId },
        boundary,
      );
    }
    const initial = await this.initial(context, options, boundary);
    return this.selectedBackend(initial).createRealtime(
      context,
      initial,
      options,
      boundary,
    );
  }

  async background(
    context: OnlineAgentContext,
    options: OnlineAgentOptions & {
      sessionId?: string;
      selectedModel?: ModelRef;
      source?: string;
      title?: string;
    } = {},
    boundary?: OnlineAgentBoundary,
  ): Promise<BackgroundOnlineAgent> {
    this.trusted(context);
    if (options.sessionId) {
      const backend = await this.persistedBackend(context, options.sessionId);
      return backend.restoreBackground(
        context,
        { ...options, sessionId: options.sessionId },
        boundary,
      );
    }
    const initial = await this.initial(context, options, boundary);
    return this.selectedBackend(initial).createBackground(
      context,
      initial,
      options,
      boundary,
    );
  }

  private async initial(
    context: OnlineAgentContext,
    options: OnlineAgentRealtimeOptions,
    boundary?: OnlineAgentBoundary,
  ): Promise<OnlineAgentInitialConfiguration> {
    const defaults = await this.deps.sessions.defaults(context.user.id);
    // Backend selection precedes Native model lookup and validation.
    const resolved = await this.configurator.resolveSelection(
      context,
      {
        ...options,
        scope: options.scope ?? defaults.scope,
      },
      undefined,
      boundary === 'http',
    );
    this.trusted(context);
    return { ...resolved, defaultModel: defaults.model };
  }

  private selectedBackend(
    initial: OnlineAgentInitialConfiguration,
  ): OnlineAgentBackend {
    if (!initial.config.agentId || initial.config.agentId === 'online')
      return this.native;
    if (!this.deps.runner) throw invalid('Runner execution is unavailable.');
    return this.deps.runner;
  }

  private async persistedBackend(
    context: OnlineAgentContext,
    id: string,
  ): Promise<OnlineAgentBackend> {
    const identity = await this.deps.sessions.identify(context.user.id, id);
    if (identity.backend === 'native') return this.native;
    if (!this.deps.runner) throw invalid('Runner execution is unavailable.');
    return this.deps.runner;
  }

  private trusted(context: OnlineAgentContext): void {
    if (
      !context.user.id ||
      !context.authorization ||
      context.credentials === undefined ||
      context.credentials === null ||
      context.authorization.identity.principal?.type !== 'user' ||
      context.authorization.identity.principal.id !== context.user.id
    )
      throw invalid(
        'A trusted user, authorization and full entry credentials are required.',
      );
    if (this.stopping) throw conflict('OnlineAgent is stopping.');
  }
}
