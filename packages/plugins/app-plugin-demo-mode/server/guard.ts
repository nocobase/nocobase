import { AsyncLocalStorage } from 'node:async_hooks';
import {
  createServiceToken,
  type ServiceToken,
} from '@nocobase/service-provider';

import type { DemoModeSettings } from './config.js';
import { DemoReadOnlyError } from './errors.js';
import { classifySql, type SqlWrite } from './sql.js';

/** What the guard knows about one HTTP request while it runs. */
export interface DemoRequestState {
  readonly method: string;
  readonly path: string;
  /** Writes refused, or in `observe` mode the writes that would have been. */
  readonly blocked: SqlWrite[];
  /** Set only by the startup probe, which must be refused in every mode. */
  readonly probe?: boolean;
  /** Refuse writes to allowed tables too, for requests that would misuse them, such as ending other visitors' sessions. */
  readonly strict?: boolean;
  readonly allowed?: readonly { table: string; statement: string }[];
}

/** The part of a knex client the guard uses: its `query` event, emitted synchronously before a query runs. */
export interface QueryEventSource {
  on(event: 'query', listener: (query: { sql?: unknown }) => void): unknown;
}

export interface GuardedKnex {
  readonly client: QueryEventSource;
}

/**
 * Refuses database writes made on behalf of an HTTP request.
 *
 * A request runs inside `run()`, which puts its state in async-local storage. Each knex client gets one `query`
 * listener; knex emits that event synchronously before it sends a query, from transaction clients too, so throwing
 * there stops the statement before the database sees it. Work with no request around it — migrations, seeds, jobs and
 * schedules — has no state and is never refused.
 */
export class DemoWriteGuard {
  private readonly storage = new AsyncLocalStorage<DemoRequestState>();
  private readonly guarded = new WeakSet<QueryEventSource>();

  public constructor(private readonly settings: DemoModeSettings) {}

  public run<T>(state: DemoRequestState, fn: () => T): T {
    return this.storage.run(state, fn);
  }

  /** Only authorized demo lifecycle handlers use this; their background work inherits the same exemption. */
  public runDemoData<T>(fn: () => T): T {
    return this.storage.exit(fn);
  }

  public runAllowed<T>(
    allowed: readonly { table: string; statement: string }[],
    fn: () => T,
  ): T {
    const state = this.storage.getStore();
    return state
      ? this.storage.run(
          { ...state, allowed: [...(state.allowed ?? []), ...allowed] },
          fn,
        )
      : fn();
  }

  /** Whether `knex`'s current client is guarded. A reconnect replaces the client, so callers check again. */
  public isAttached(knex: GuardedKnex): boolean {
    return this.guarded.has(knex.client);
  }

  public attach(knex: GuardedKnex): void {
    const client = knex.client;
    if (this.guarded.has(client)) return;
    this.guarded.add(client);
    client.on('query', (query) => this.inspect(query));
  }

  private inspect(query: { sql?: unknown }): void {
    const state = this.storage.getStore();
    if (!state || typeof query.sql !== 'string') return;
    const writes = classifySql(query.sql).filter(
      (write) =>
        state.probe ||
        state.strict ||
        !write.table ||
        (!this.settings.allowTables.has(write.table) &&
          !state.allowed?.some(
            (rule) =>
              rule.table === write.table && rule.statement === write.statement,
          )),
    );
    if (writes.length === 0) return;
    state.blocked.push(...writes);
    if (state.probe || this.settings.mode === 'read-only') {
      throw new DemoReadOnlyError(writes);
    }
  }
}

/** Internal token, deliberately absent from the plugin's public service exports. */
export const demoWriteGuardToken: ServiceToken<DemoWriteGuard> =
  createServiceToken<DemoWriteGuard>(
    '@nocobase/app-plugin-demo-mode/write-guard',
  );
