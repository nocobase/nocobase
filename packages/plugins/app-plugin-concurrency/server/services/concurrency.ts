import {
  createConcurrentRuntime,
  ConcurrentAcquireError,
  ConcurrentCloseError,
  ConcurrentConfigurationError,
  type ConcurrentManager,
  type ConcurrentRuntime,
  type ConcurrentOptions,
} from '@nocobase/concurrency';
import { LocalConcurrentBackend } from '../mutex/index.js';
import {
  resolveConcurrencyConfig,
  type ConcurrencySnapshot,
} from '../../config/resolve.js';
import type {
  ConcurrencyService,
  ConcurrencyImplementation,
  OwnedConcurrencyBackend,
  ResolvedConcurrencyConfig,
  ConcurrencyServiceOptions,
  ConcurrencyLogEvent,
} from '../../shared/types.js';

interface EntryState {
  readonly config: ResolvedConcurrencyConfig;
  initializing: Promise<ConcurrentManager>;
  handle?: OwnedConcurrencyBackend;
  runtime?: ConcurrentRuntime;
  runtimeClosed?: boolean;
  disposed?: boolean;
  draining?: Promise<void>;
}
const LOCAL_WARNING_ENVIRONMENTS = new Set(['develop', 'development']);

/** Host ownership only: lease state and backend lifecycle remain in the core runtime. */
export class ManagedConcurrencyService implements ConcurrencyService {
  private phase:
    'registering' | 'booted' | 'starting' | 'started' | 'stopping' | 'closed' =
    'registering';
  private readonly implementations = new Map<
    string,
    ConcurrencyImplementation
  >();
  private readonly states = new Map<string, EntryState>();
  private readonly mutexNamespaces = new Map<string, string>();
  private snapshot?: ConcurrencySnapshot;
  private stopping?: Promise<void>;
  private localReported = false;
  private reloadReported = false;

  public constructor(private readonly options: ConcurrencyServiceOptions) {
    this.implementations.set('mutex', {
      validate: () => {},
      create: () =>
        Promise.resolve({
          backend: new LocalConcurrentBackend(),
          dispose: () => Promise.resolve(),
        }),
    });
  }

  public registerImplementation(
    adapter: string,
    implementation: ConcurrencyImplementation,
  ): void {
    if (
      this.phase !== 'registering' ||
      typeof adapter !== 'string' ||
      adapter.length === 0 ||
      this.implementations.has(adapter) ||
      typeof implementation?.validate !== 'function' ||
      typeof implementation.create !== 'function'
    )
      throw new ConcurrentConfigurationError(
        'Concurrency implementation registration is invalid, duplicate or closed.',
      );
    // Capture methods: later mutation of the caller's registration object cannot change the booted service.
    this.implementations.set(adapter, {
      validate: implementation.validate.bind(implementation),
      create: implementation.create.bind(implementation),
    });
  }

  public boot(config: unknown): void {
    if (this.phase !== 'registering')
      throw new ConcurrentConfigurationError(
        'Concurrency service has already booted.',
      );
    this.phase = 'booted';
    const snapshot = resolveConcurrencyConfig(config, this.options.appName);
    for (const entry of snapshot.entries.values())
      this.implementations.get(entry.adapter)?.validate(entry);
    const selected = snapshot.entries.get(snapshot.defaultKey)!;
    this.implementation(selected);
    this.snapshot = snapshot;
  }

  public async start(): Promise<void> {
    if (this.phase !== 'booted' || !this.snapshot)
      throw new ConcurrentAcquireError('Concurrency service is not booted.');
    this.phase = 'starting';
    await this.initialize(this.snapshot.defaultKey);
    if (this.phase !== 'starting')
      throw new ConcurrentAcquireError(
        'Concurrency startup was interrupted by shutdown.',
      );
    this.phase = 'started';
  }

  public async getManager(configKey?: string): Promise<ConcurrentManager> {
    if (this.phase !== 'started')
      throw new ConcurrentAcquireError(
        'Concurrency service is not started or is stopping.',
      );
    const snapshot = this.snapshot!;
    const key = configKey === undefined ? snapshot.defaultKey : configKey;
    if (
      typeof key !== 'string' ||
      (configKey !== undefined && (key.length === 0 || key === 'default')) ||
      !snapshot.entries.has(key)
    )
      throw new ConcurrentConfigurationError(
        'Unknown concurrency configuration name.',
      );
    const manager = await this.initialize(key);
    if (this.phase !== 'started')
      throw new ConcurrentAcquireError('Concurrency service is stopping.');
    return manager;
  }

  public configurationChanged(): void {
    if (this.snapshot && !this.reloadReported) {
      this.reloadReported = true;
      this.report({ phase: 'reload' });
    }
  }

  public shutdown(): Promise<void> {
    if (this.phase === 'closed') return Promise.resolve();
    this.phase = 'stopping';
    this.stopping ??= this.stopAll().finally(() => {
      this.stopping = undefined;
    });
    return this.stopping;
  }

  private implementation(
    entry: ResolvedConcurrencyConfig,
  ): ConcurrencyImplementation {
    const implementation = this.implementations.get(entry.adapter);
    if (!implementation)
      throw new ConcurrentConfigurationError(
        'Selected concurrency adapter is not registered.',
      );
    return implementation;
  }

  private initialize(key: string): Promise<ConcurrentManager> {
    const previous = this.states.get(key);
    if (previous) return previous.initializing;
    const config = this.snapshot!.entries.get(key)!;
    const implementation = this.implementation(config);
    if (config.adapter === 'mutex') {
      if (this.mutexNamespaces.has(config.namespace))
        throw new ConcurrentConfigurationError(
          'Another enabled mutex configuration owns this namespace; reuse its configuration name.',
        );
      this.mutexNamespaces.set(config.namespace, key);
    }
    const state: EntryState = {
      config,
      // Defer the factory until the state is registered, including synchronous/reentrant implementations.
      initializing: Promise.resolve().then(() =>
        this.create(state, implementation),
      ),
    };
    this.states.set(key, state);
    return state.initializing;
  }

  private async create(
    state: EntryState,
    implementation: ConcurrencyImplementation,
  ): Promise<ConcurrentManager> {
    const { config } = state;
    try {
      state.handle = await implementation.create(config);
      state.runtime = await createConcurrentRuntime({
        backend: state.handle.backend,
        namespace: config.namespace,
        operationTimeoutMs: config.operationTimeoutMs,
        cleanupTimeoutMs: config.cleanupTimeoutMs,
        ...(this.options.clock ? { clock: this.options.clock } : {}),
        ...(this.options.scheduler
          ? { scheduler: this.options.scheduler }
          : {}),
        logger: ({ phase }) =>
          this.report({
            phase,
            configKey: config.key,
            adapter: config.adapter,
            namespace: config.namespace,
          }),
      });
    } catch (cause) {
      this.report({
        phase: 'initialize',
        configKey: config.key,
        adapter: config.adapter,
        namespace: config.namespace,
      });
      throw new ConcurrentConfigurationError(
        'Concurrency initialization failed.',
        { cause },
      );
    }
    if (
      config.adapter === 'mutex' &&
      !this.localReported &&
      !LOCAL_WARNING_ENVIRONMENTS.has(this.options.nodeEnv ?? '')
    ) {
      this.localReported = true;
      this.report({
        phase: 'local',
        configKey: config.key,
        adapter: config.adapter,
        namespace: config.namespace,
      });
    }
    const manager = state.runtime.manager;
    const resourceOptions = (
      options?: ConcurrentOptions,
    ): ConcurrentOptions => {
      if (
        options !== undefined &&
        (options === null ||
          typeof options !== 'object' ||
          Reflect.ownKeys(options).some((field) => field !== 'ttl'))
      )
        throw new ConcurrentConfigurationError(
          'Concurrency resource options accept only ttl.',
        );
      const ttl = options?.ttl;
      return { ttl: ttl ?? config.ttl };
    };
    return Object.freeze({
      createLock: (name: string, options?: ConcurrentOptions) =>
        manager.createLock(name, resourceOptions(options)),
      createSynchronous: (name: string, options?: ConcurrentOptions) =>
        manager.createSynchronous(name, resourceOptions(options)),
    });
  }

  private drain(state: EntryState): Promise<void> {
    if (state.disposed) return Promise.resolve();
    state.draining ??= (async () => {
      // A rejected construction promise has settled before we retry partial backend cleanup.
      await state.initializing.catch(() => {});
      if (state.runtime && !state.runtimeClosed) {
        await state.runtime.close({
          timeoutMs: state.config.shutdownTimeoutMs,
        });
        state.runtimeClosed = true;
      } else if (!state.runtime && state.handle && !state.runtimeClosed) {
        await state.handle.backend.close();
        state.runtimeClosed = true;
      }
      if (state.handle) await state.handle.dispose();
      state.disposed = true;
    })().finally(() => {
      state.draining = undefined;
    });
    return state.draining;
  }

  private observeDrain(state: EntryState): Promise<void> {
    const waitingForInitialization = !state.runtime;
    const draining = this.drain(state);
    if (!waitingForInitialization) return draining;
    // Only the caller's notification is bounded. The saved drain keeps observing late setup and owns its resources.
    return new Promise<void>((resolve, reject) => {
      const timer = setTimeout(
        () =>
          reject(
            new ConcurrentCloseError(
              'Concurrency initialization is still draining.',
            ),
          ),
        state.config.shutdownTimeoutMs,
      );
      draining.then(
        () => {
          clearTimeout(timer);
          resolve();
        },
        (error: unknown) => {
          clearTimeout(timer);
          reject(
            error instanceof Error
              ? error
              : new ConcurrentCloseError('Concurrency cleanup failed.', {
                  cause: error,
                }),
          );
        },
      );
    });
  }

  private async stopAll(): Promise<void> {
    const results = await Promise.allSettled(
      [...this.states.values()].map((state) => this.observeDrain(state)),
    );
    const errors = results.flatMap((result) =>
      result.status === 'rejected' ? [result.reason as unknown] : [],
    );
    if (errors.length)
      throw new ConcurrentCloseError(
        'Concurrency shutdown is incomplete; retry shutdown on the same service.',
        { cause: new AggregateError(errors) },
      );
    this.phase = 'closed';
  }

  private report(event: ConcurrencyLogEvent): void {
    try {
      this.options.report?.(event);
    } catch {
      /* Diagnostics must not change business or cleanup results. */
    }
  }
}
