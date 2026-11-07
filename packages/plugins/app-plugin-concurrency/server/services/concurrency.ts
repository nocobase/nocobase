import {
  ConcurrentAbortError,
  ConcurrentAcquireError,
  ConcurrentCloseError,
  ConcurrentConfigurationError,
  type ConcurrentManager,
} from '@nocobase/concurrency';
import {
  resolveConcurrencyConfig,
  type ConcurrencySnapshot,
} from '../../config/resolve.js';
import type {
  ConcurrencyService,
  ConcurrencyImplementation,
  ConcurrencyInstance,
  ResolvedConcurrencyConfig,
  ConcurrencyServiceOptions,
  ConcurrencyLogEvent,
} from '../../shared/types.js';
import { MutexConcurrencyInstance } from '../mutex/instance.js';
import { reportSafely } from '../diagnostics.js';

interface EntryState {
  readonly config: ResolvedConcurrencyConfig;
  initializing: Promise<ConcurrentManager>;
  instance?: ConcurrencyInstance;
  closed?: boolean;
  stopping?: Promise<void>;
}

export class ManagedConcurrencyService implements ConcurrencyService {
  private phase:
    'registering' | 'booted' | 'starting' | 'started' | 'stopping' | 'closed' =
    'registering';
  private readonly implementations = new Map<
    string,
    ConcurrencyImplementation
  >();
  private readonly states = new Map<string, EntryState>();
  private readonly instances = new WeakSet<ConcurrencyInstance>();
  private readonly mutexNamespaces = new Set<string>();
  private snapshot?: ConcurrencySnapshot;
  private stopping?: Promise<void>;
  private localReported = false;
  private reloadReported = false;

  public constructor(private readonly options: ConcurrencyServiceOptions) {
    this.registerImplementation('mutex', {
      validate: () => {},
      create: (entry) =>
        new MutexConcurrencyInstance(entry, (event) =>
          this.report({
            ...event,
            configKey: entry.key,
            adapter: entry.adapter,
            namespace: entry.namespace,
          }),
        ),
    });
  }
  public registerImplementation(
    adapter: string,
    implementation: ConcurrencyImplementation,
  ): void {
    if (
      this.phase !== 'registering' ||
      typeof adapter !== 'string' ||
      !adapter.length ||
      this.implementations.has(adapter) ||
      !implementation ||
      typeof implementation.validate !== 'function' ||
      typeof implementation.create !== 'function'
    )
      throw new ConcurrentConfigurationError(
        'Concurrency implementation registration is invalid, duplicate or closed.',
      );
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
    this.implementation(snapshot.entries.get(snapshot.defaultKey)!);
    this.snapshot = snapshot;
  }
  public async start(): Promise<void> {
    if (this.phase !== 'booted' || !this.snapshot)
      throw new ConcurrentAcquireError('Concurrency service is not booted.');
    this.phase = 'starting';
    await this.initialize(this.snapshot.defaultKey);
    if (this.isStopping())
      throw new ConcurrentAbortError('Concurrency startup was interrupted.');
    this.phase = 'started';
  }
  public async getManager(configKey?: string): Promise<ConcurrentManager> {
    if (this.isStopping())
      throw new ConcurrentAbortError('Concurrency service is closed.');
    if (this.phase !== 'started')
      throw new ConcurrentAcquireError('Concurrency service is not started.');
    const snapshot = this.snapshot!;
    const key = configKey === undefined ? snapshot.defaultKey : configKey;
    if (
      typeof key !== 'string' ||
      (configKey !== undefined && (!key.length || key === 'default')) ||
      !snapshot.entries.has(key)
    )
      throw new ConcurrentConfigurationError(
        'Unknown concurrency configuration name.',
      );
    const manager = await this.initialize(key);
    if (this.isStopping())
      throw new ConcurrentAbortError('Concurrency service is closed.');
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
    if (this.stopping) return this.stopping;
    this.phase = 'stopping';
    this.stopping = Promise.resolve()
      .then(() => this.stopAll())
      .finally(() => {
        this.stopping = undefined;
      });
    return this.stopping;
  }
  private isStopping(): boolean {
    return this.phase === 'stopping' || this.phase === 'closed';
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
          'Another enabled mutex configuration owns this namespace.',
        );
      this.mutexNamespaces.add(config.namespace);
    }
    const state: EntryState = {
      config,
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
    if (this.isStopping())
      throw new ConcurrentAbortError(
        'Concurrency initialization was interrupted.',
      );
    try {
      const instance = implementation.create(state.config);
      if (
        !instance ||
        typeof instance.start !== 'function' ||
        typeof instance.shutdown !== 'function' ||
        !instance.manager ||
        typeof instance.manager.createLock !== 'function' ||
        typeof instance.manager.createSynchronous !== 'function' ||
        this.instances.has(instance)
      )
        throw new ConcurrentConfigurationError(
          'Implementation must create a fresh managed instance.',
        );
      this.instances.add(instance);
      state.instance = instance;
      if (this.isStopping())
        throw new ConcurrentAbortError(
          'Concurrency initialization was interrupted.',
        );
      await instance.start();
      if (this.isStopping())
        throw new ConcurrentAbortError(
          'Concurrency initialization was interrupted.',
        );
      if (
        state.config.adapter === 'mutex' &&
        !this.localReported &&
        !['develop', 'development'].includes(this.options.nodeEnv ?? '')
      ) {
        this.localReported = true;
        this.report({
          phase: 'local',
          configKey: state.config.key,
          adapter: 'mutex',
          namespace: state.config.namespace,
        });
      }
      return instance.manager;
    } catch (cause) {
      if (cause instanceof ConcurrentAbortError && this.isStopping())
        throw cause;
      this.report({ phase: 'initialize', configKey: state.config.key, cause });
      throw new ConcurrentConfigurationError(
        'Concurrency initialization failed.',
        { cause },
      );
    }
  }
  private closeState(state: EntryState): Promise<void> {
    if (state.closed || !state.instance) return Promise.resolve();
    state.stopping ??= Promise.resolve()
      .then(() => state.instance!.shutdown())
      .then(() => {
        state.closed = true;
      })
      .finally(() => {
        state.stopping = undefined;
      });
    return state.stopping;
  }
  private async stopAll(): Promise<void> {
    const results = await Promise.allSettled(
      [...this.states.values()].map(async (state) => {
        // Close saved resources before waiting for an in-progress start.
        let failure: unknown;
        let failed = false;
        try {
          await this.closeState(state);
        } catch (cause) {
          failure = cause;
          failed = true;
        }
        await state.initializing.catch(() => {});
        if (!failed) await this.closeState(state);
        if (failed) throw failure;
      }),
    );
    const errors: unknown[] = [];
    for (const result of results)
      if (result.status === 'rejected') errors.push(result.reason);
    if (errors.length)
      throw new ConcurrentCloseError(
        'Concurrency shutdown could not close all instances.',
        { cause: new AggregateError(errors) },
      );
    this.phase = 'closed';
  }
  private report(event: ConcurrencyLogEvent): void {
    reportSafely(this.options.report, event);
  }
}
