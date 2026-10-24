import { AsyncLocalStorage } from 'node:async_hooks';
import {
  createServiceToken,
  type ServiceToken,
} from '@nocobase/service-provider';

import { DemoReadOnlyError } from './errors.js';
import { classifySql, type SqlWrite } from './sql.js';

export interface DemoSqlRule {
  readonly connection: string;
  readonly table: string;
  readonly statement: string;
}

/** What the guard knows about one HTTP request while it runs. */
export interface DemoRequestState {
  readonly method: string;
  readonly path: string;
  /** Writes refused before reaching the database. */
  readonly blocked: SqlWrite[];
  /** Refuse writes to allowed tables too, for requests that would misuse them, such as ending other visitors' sessions. */
  readonly strict?: boolean;
  readonly allowed?: readonly DemoSqlRule[];
}

/** The part of a knex client the guard uses: its `query` event, emitted synchronously before a query runs. */
export interface QueryEventSource {
  on(event: 'query', listener: (query: { sql?: unknown }) => void): unknown;
}

export interface GuardedKnex {
  readonly client: QueryEventSource;
}

/** A request's state as the guard stores it, shared by the copies `runAllowed` makes. */
interface GuardedRequest extends DemoRequestState {
  readonly request: { ended: boolean };
}

/**
 * Refuses database writes made on behalf of an HTTP request.
 *
 * A request runs inside `run()`, which puts its state in async-local storage. Each knex client gets one `query`
 * listener; knex emits that event synchronously before it sends a query, from transaction clients too, so throwing
 * there stops the statement before the database sees it. Work with no request around it — migrations, seeds, jobs and
 * schedules — has no state and is never refused.
 *
 * In-process job, schedule and queue adapters carry the async context of whoever enqueued or armed the work, so their
 * tasks can run with a request's state. Once that request has finished, its state refuses nothing, so such work writes
 * as it would on a Redis worker. Work that starts before the request ends is still refused, while a response body
 * streamed after the handler returned is not; a demo accepts both.
 */
export class DemoWriteGuard {
  private readonly storage = new AsyncLocalStorage<GuardedRequest>();
  private readonly guarded = new WeakSet<QueryEventSource>();

  public run<T>(state: DemoRequestState, fn: () => T): T {
    const request = { ended: false };
    const end = () => {
      request.ended = true;
    };
    return this.storage.run({ ...state, request }, () => {
      const result = fn();
      if (!(result instanceof Promise)) {
        end();
        return result;
      }
      return result.finally(end) as T;
    });
  }

  /** Only authorized demo lifecycle handlers use this; their background work inherits the same exemption. */
  public runDemoData<T>(fn: () => T): T {
    return this.storage.exit(fn);
  }

  public runAllowed<T>(allowed: readonly DemoSqlRule[], fn: () => T): T {
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

  public attach(knex: GuardedKnex, connection: string): void {
    const client = knex.client;
    if (this.guarded.has(client)) return;
    this.guarded.add(client);
    client.on('query', (query) => this.inspect(query, connection));
  }

  private inspect(query: { sql?: unknown }, connection: string): void {
    const state = this.storage.getStore();
    if (!state || state.request.ended || typeof query.sql !== 'string') return;
    const writes = classifySql(query.sql).filter(
      (write) =>
        state.strict ||
        !write.table ||
        !state.allowed?.some(
          (rule) =>
            rule.connection === connection &&
            rule.table === write.table &&
            rule.statement === write.statement,
        ),
    );
    if (writes.length === 0) return;
    state.blocked.push(...writes);
    throw new DemoReadOnlyError(writes);
  }
}

/** Internal token, deliberately absent from the plugin's public service exports. */
export const demoWriteGuardToken: ServiceToken<DemoWriteGuard> =
  createServiceToken<DemoWriteGuard>(
    '@nocobase/app-plugin-demo-mode/write-guard',
  );
