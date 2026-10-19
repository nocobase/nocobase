import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { Blocker, InputProblem } from './errors.js';
import type { RecordView } from './runtime.js';
import type { JsonObject } from './types.js';
import type { FireView, LifecycleDescriptionView } from './views.js';

export type { Blocker, BlockerKind, InputProblem } from './errors.js';
export type {
  AvailableTransition,
  RecordHistory,
  RecordView,
} from './runtime.js';
export type { EffectRun, TransitionEntry } from './store.js';
export type { JsonObject } from './types.js';
export type { FireView, LifecycleDescriptionView } from './views.js';

/** One request; the shape `@nocobase/app-client`'s API client accepts. */
export interface LifecycleRequest {
  readonly method?: 'GET' | 'POST';
  readonly path: string;
  readonly query?: Record<string, string>;
  readonly json?: unknown;
  readonly signal?: AbortSignal;
}

/**
 * Sends a request and resolves with its JSON body, or rejects with an error
 * whose `payload` is the JSON body of a refusal. An application's API client
 * already is one; nothing here depends on it.
 */
export interface LifecycleTransport {
  request<T>(request: LifecycleRequest): Promise<T>;
}

export interface LifecycleReadOptions {
  readonly signal?: AbortSignal;
}

export interface LifecycleClientOptions {
  readonly transport: LifecycleTransport;
  /**
   * Where the plugin's lifecycle routes start: `<basePath>/<lifecycle>/…`
   * as {@link createLifecycleClient} lists them.
   */
  readonly basePath: string;
  /** Sent with every request, such as who a demo page acts as. */
  readonly query?: Record<string, string>;
}

export interface FireRequest {
  readonly input?: JsonObject;
  /** Defaults to a fresh key, so a request the network repeats fires once. */
  readonly requestId?: string;
  /** The version the page showed; a record that moved on since is refused. */
  readonly expectVersion?: number | null;
}

export interface RetryRequest {
  /** Retry a run whose `onFailure` already moved the record on; see `runtime.retryRun()`. */
  readonly force?: boolean;
  /** Why it is forced, for the server's log. */
  readonly reason?: string;
}

/**
 * Talks to the routes a plugin serves for its lifecycles, below its
 * `basePath`, each answering `{ data }` and refusing with the standard error
 * body — the fields `lifecycleErrorFields()` gives:
 *
 * - `GET <lifecycle>/lifecycle` — `LifecycleDescriptionView`
 * - `GET <lifecycle>/{id}` — `RecordView`
 * - `POST <lifecycle>/{id}/fire` with `{ transition, input, requestId, expectVersion? }` — `FireView`
 * - `POST <lifecycle>/{id}/effectRuns/{runId}/retry` with `{ force?, reason? }`, `…/continue` and `…/cancel` — `RecordView`
 */
export interface LifecycleClient {
  describe(lifecycle: string): Promise<LifecycleDescriptionView>;
  view(
    lifecycle: string,
    id: string,
    options?: LifecycleReadOptions,
  ): Promise<RecordView>;
  fire(
    lifecycle: string,
    id: string,
    transition: string,
    request?: FireRequest,
  ): Promise<FireView>;
  retryRun(
    lifecycle: string,
    id: string,
    runId: string,
    request?: RetryRequest,
  ): Promise<RecordView>;
  /** Tries a run's waiting continuation at once; see `runtime.continueRun()`. */
  continueRun(
    lifecycle: string,
    id: string,
    runId: string,
  ): Promise<RecordView>;
  cancelRun(lifecycle: string, id: string, runId: string): Promise<RecordView>;
}

/**
 * A refusal as the routes answer it, read from the standard error body:
 * `reason` is the lifecycle's code, such as `GUARD_REJECTED`, and the
 * blockers and problems are what a page shows.
 */
export class LifecycleRequestError extends Error {
  public constructor(
    message: string,
    public readonly reason: string,
    public readonly blockers: readonly Blocker[],
    public readonly problems: readonly InputProblem[],
    public readonly status?: number,
  ) {
    super(message);
    this.name = 'LifecycleRequestError';
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** A blocker as a route sent it; one without a `kind` is a `permission` refusal, as an unmarked guard's is. */
function withKind(blocker: unknown): Blocker {
  if (!isObject(blocker) || blocker.kind !== undefined)
    return blocker as Blocker;
  return { ...(blocker as Omit<Blocker, 'kind'>), kind: 'permission' };
}

/** `{ error: { reason, message, metadata: { blockers, problems } } }`, from the transport's error `payload`. */
function refusalOf(cause: unknown): unknown {
  if (!isObject(cause) || !isObject(cause.payload)) return cause;
  const body = cause.payload.error;
  if (!isObject(body) || typeof body.message !== 'string') return cause;
  const metadata = isObject(body.metadata) ? body.metadata : {};
  return new LifecycleRequestError(
    body.message,
    typeof body.reason === 'string' ? body.reason : 'ERROR',
    Array.isArray(metadata.blockers) ? metadata.blockers.map(withKind) : [],
    Array.isArray(metadata.problems)
      ? (metadata.problems as InputProblem[])
      : [],
    typeof cause.status === 'number' ? cause.status : undefined,
  );
}

function segment(value: string): string {
  return encodeURIComponent(value);
}

/**
 * A fresh request key. `randomUUID` exists only in secure contexts, and a
 * page served over plain HTTP from another machine is not one, so it falls
 * back to `getRandomValues`, and to `Math.random` where even that is absent.
 */
function requestKey(): string {
  const crypto = globalThis.crypto as Partial<Crypto> | undefined;
  if (typeof crypto?.randomUUID === 'function') return crypto.randomUUID();
  const bytes = new Uint8Array(16);
  if (typeof crypto?.getRandomValues === 'function')
    crypto.getRandomValues(bytes);
  else
    for (let index = 0; index < bytes.length; index += 1)
      bytes[index] = Math.floor(Math.random() * 256);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = [...bytes].map((byte) => byte.toString(16).padStart(2, '0'));
  return `${hex.slice(0, 4).join('')}-${hex.slice(4, 6).join('')}-${hex.slice(6, 8).join('')}-${hex.slice(8, 10).join('')}-${hex.slice(10).join('')}`;
}

export function createLifecycleClient(
  options: LifecycleClientOptions,
): LifecycleClient {
  const base = options.basePath.replace(/\/+$/, '');
  const send = async <T>(request: LifecycleRequest): Promise<T> => {
    let body: { readonly data: T };
    try {
      body = await options.transport.request<{ readonly data: T }>({
        ...request,
        ...(options.query ? { query: options.query } : {}),
      });
    } catch (cause) {
      throw refusalOf(cause);
    }
    return body.data;
  };
  const record = (lifecycle: string, id: string): string =>
    `${base}/${segment(lifecycle)}/${segment(id)}`;
  return {
    describe: (lifecycle) =>
      send({ path: `${base}/${segment(lifecycle)}/lifecycle` }),
    view: (lifecycle, id, options) =>
      send({ path: record(lifecycle, id), signal: options?.signal }),
    fire: (lifecycle, id, transition, request = {}) =>
      send({
        method: 'POST',
        path: `${record(lifecycle, id)}/fire`,
        json: {
          transition,
          input: request.input ?? {},
          requestId: request.requestId ?? requestKey(),
          ...(request.expectVersion === undefined
            ? {}
            : { expectVersion: request.expectVersion }),
        },
      }),
    retryRun: (lifecycle, id, runId, request = {}) =>
      send({
        method: 'POST',
        path: `${record(lifecycle, id)}/effectRuns/${segment(runId)}/retry`,
        json: request,
      }),
    continueRun: (lifecycle, id, runId) =>
      send({
        method: 'POST',
        path: `${record(lifecycle, id)}/effectRuns/${segment(runId)}/continue`,
      }),
    cancelRun: (lifecycle, id, runId) =>
      send({
        method: 'POST',
        path: `${record(lifecycle, id)}/effectRuns/${segment(runId)}/cancel`,
      }),
  };
}

export interface UseLifecycleOptions {
  /** How often an open record refreshes, for effects finishing in the background. Defaults to 4 s; 0 turns it off. */
  readonly refreshMs?: number;
  /** Defaults to true. Disable when a refresh scheduler owns the initial snapshot. */
  readonly loadOnMount?: boolean;
}

export interface UseLifecycleResult {
  /** The client the hook talks through, for firing on a record the page has not selected, such as one just created. */
  readonly client: LifecycleClient;
  readonly description: LifecycleDescriptionView | undefined;
  /** Undefined until loaded, and while no record is selected. */
  readonly view: RecordView | undefined;
  /** The last load's failure; a fire's is thrown to its caller instead. */
  readonly error: Error | undefined;
  readonly busy: boolean;
  /**
   * Fires with a fresh request key and the version on screen, then shows the
   * record as the transition left it. Rejects with a `LifecycleRequestError`
   * carrying the blockers or problems.
   */
  readonly fire: (transition: string, input?: JsonObject) => Promise<FireView>;
  /**
   * Rejects with `RUN_SETTLED` when the run's `onFailure` already moved the
   * record on, or its continuation still waits to — continue that one
   * instead — unless forced.
   */
  readonly retryRun: (runId: string, request?: RetryRequest) => Promise<void>;
  /**
   * Tries the run's waiting continuation at once, one the sweep gave up on
   * included. Rejects with its refusal when it is refused again, and with
   * `NO_CONTINUATION` when none waits.
   */
  readonly continueRun: (runId: string) => Promise<void>;
  readonly cancelRun: (runId: string) => Promise<void>;
  /** Reloads and records errors without rejecting, for existing callers. */
  readonly reload: () => Promise<void>;
  /** A cancellable snapshot read that rejects on failure, for refresh schedulers. */
  readonly refresh: (signal?: AbortSignal) => Promise<void>;
}

/**
 * One lifecycle record on a page: loads it, keeps it fresh, and fires its
 * transitions. Pass `id` undefined while nothing is selected.
 */
export function useLifecycle(
  client: LifecycleClient,
  lifecycle: string,
  id: string | undefined,
  options: UseLifecycleOptions = {},
): UseLifecycleResult {
  const refreshMs = options.refreshMs ?? 4_000;
  const loadOnMount = options.loadOnMount !== false;
  // A new identity prevents responses for another record, lifecycle or transport
  // (including an account switch) from entering the current view.
  const scope = useMemo(
    () => ({ client, lifecycle, id }),
    [client, lifecycle, id],
  );
  const lifetimeRef = useRef({
    scope,
    active: true,
    revision: 0,
    controllers: new Set<AbortController>(),
  });
  const [described, setDescribed] = useState<{
    client: LifecycleClient;
    lifecycle: string;
    value: LifecycleDescriptionView;
  }>();
  const [loaded, setLoaded] = useState<{
    scope: typeof scope;
    view: RecordView;
  }>();
  const [failure, setFailure] = useState<{
    scope: typeof scope;
    error: Error;
  }>();
  const [acting, setActing] = useState<typeof scope>();

  useEffect(() => {
    const lifetime = {
      scope,
      active: true,
      revision: 0,
      controllers: new Set<AbortController>(),
    };
    lifetimeRef.current = lifetime;
    return () => {
      lifetime.active = false;
      lifetime.revision += 1;
      for (const controller of lifetime.controllers) controller.abort();
    };
  }, [scope]);

  const refresh = useCallback(
    async (signal?: AbortSignal): Promise<void> => {
      const lifetime = lifetimeRef.current;
      if (id === undefined || !lifetime.active || lifetime.scope !== scope)
        return;
      const revision = ++lifetime.revision;
      const controller = new AbortController();
      const abort = (): void => controller.abort(signal?.reason);
      if (signal?.aborted) abort();
      else signal?.addEventListener('abort', abort, { once: true });
      lifetime.controllers.add(controller);
      const current = (): boolean =>
        lifetime.active &&
        lifetime.revision === revision &&
        !controller.signal.aborted;
      try {
        controller.signal.throwIfAborted();
        const view = await client.view(lifecycle, id, {
          signal: controller.signal,
        });
        if (current()) {
          setLoaded({ scope, view });
          setFailure(undefined);
        }
      } catch (cause) {
        if (current()) {
          const error =
            cause instanceof Error ? cause : new Error(String(cause));
          setFailure({ scope, error });
          if (isObject(cause) && (cause.status === 401 || cause.status === 403))
            setLoaded(undefined);
        }
        throw cause;
      } finally {
        lifetime.controllers.delete(controller);
        signal?.removeEventListener('abort', abort);
      }
    },
    [client, lifecycle, id, scope],
  );

  const reload = useCallback(
    (): Promise<void> => refresh().catch(() => {}),
    [refresh],
  );

  useEffect(() => {
    let active = true;
    void client.describe(lifecycle).then(
      (value) => {
        if (active) setDescribed({ client, lifecycle, value });
      },
      () => undefined,
    );
    return () => {
      active = false;
    };
  }, [client, lifecycle]);

  useEffect(() => {
    if (id === undefined) return undefined;
    let pending = false;
    const poll = (): void => {
      // A slow successful read must settle before another poll supersedes it.
      if (pending) return;
      pending = true;
      void reload().finally(() => {
        pending = false;
      });
    };
    const first = loadOnMount ? setTimeout(poll, 0) : undefined;
    const timer = refreshMs > 0 ? setInterval(poll, refreshMs) : undefined;
    return () => {
      clearTimeout(first);
      if (timer) clearInterval(timer);
    };
  }, [reload, refreshMs, loadOnMount, id]);

  const view = loaded?.scope === scope ? loaded.view : undefined;
  const error = failure?.scope === scope ? failure.error : undefined;
  const busy = acting === scope;
  const description =
    described?.client === client && described.lifecycle === lifecycle
      ? described.value
      : undefined;

  const act = useCallback(
    async <T extends RecordView>(work: () => Promise<T>): Promise<T> => {
      const lifetime = lifetimeRef.current;
      if (id === undefined || lifetime.scope !== scope || !lifetime.active)
        throw new Error('No record is selected.');
      lifetime.revision += 1;
      setActing(scope);
      try {
        const next = await work();
        if (lifetime.active) {
          // Reads started before or during this mutation cannot replace its result.
          lifetime.revision += 1;
          setLoaded({ scope, view: next });
          setFailure(undefined);
        }
        return next;
      } finally {
        if (lifetime.active) setActing(undefined);
      }
    },
    [id, scope],
  );

  return useMemo(
    () => ({
      client,
      description,
      view,
      error,
      busy,
      fire: (transition: string, input: JsonObject = {}) =>
        act(() =>
          client.fire(lifecycle, id ?? '', transition, {
            input,
            ...(view ? { expectVersion: view.version } : {}),
          }),
        ),
      retryRun: async (runId: string, request: RetryRequest = {}) => {
        await act(() => client.retryRun(lifecycle, id ?? '', runId, request));
      },
      continueRun: async (runId: string) => {
        await act(() => client.continueRun(lifecycle, id ?? '', runId));
      },
      cancelRun: async (runId: string) => {
        await act(() => client.cancelRun(lifecycle, id ?? '', runId));
      },
      reload,
      refresh,
    }),
    [
      description,
      view,
      error,
      busy,
      act,
      client,
      lifecycle,
      id,
      reload,
      refresh,
    ],
  );
}

export interface LifecycleHookOptions {
  /**
   * A hook returning the transport, such as an application's `useApiClient`.
   * It is called on every render of the hook it configures, so it follows
   * the rules of hooks like any other.
   */
  readonly useTransport: () => LifecycleTransport;
  /** Where the plugin's lifecycle routes start; see {@link createLifecycleClient}. */
  readonly basePath: string;
  /** How often an open record refreshes. Defaults to 4 s; 0 turns it off. */
  readonly refreshMs?: number;
  /** Defaults to true. Disable when a refresh scheduler owns the initial snapshot. */
  readonly loadOnMount?: boolean;
}

/** The hook `createLifecycleHook()` returns: one record of one lifecycle. */
export type UseRecordLifecycle = (
  lifecycle: string,
  id: string | undefined,
  /** Sent with every request, such as who a demo page acts as. */
  query?: Readonly<Record<string, string>>,
) => UseLifecycleResult;

/**
 * Configures `useLifecycle()` once for a plugin's routes, so a page needs a
 * single call:
 *
 * ```ts
 * export const useLeaveLifecycle = createLifecycleHook({
 *   useTransport: useApiClient,
 *   basePath: LEAVE_LIFECYCLE_ROUTES,
 * });
 *
 * const { view, busy, fire } = useLeaveLifecycle('leaves', id);
 * ```
 *
 * The client is built once per transport and query, so a query written
 * inline does not reload the record on every render.
 */
export function createLifecycleHook(
  options: LifecycleHookOptions,
): UseRecordLifecycle {
  const refresh: UseLifecycleOptions = {
    refreshMs: options.refreshMs,
    loadOnMount: options.loadOnMount,
  };
  return function useRecordLifecycle(lifecycle, id, query) {
    const transport = options.useTransport();
    // An inline query is a new object every render; key the client by its content.
    const queryKey = query === undefined ? '' : JSON.stringify(query);
    const client = useMemo(
      () =>
        createLifecycleClient({
          transport,
          basePath: options.basePath,
          ...(queryKey === ''
            ? {}
            : { query: JSON.parse(queryKey) as Record<string, string> }),
        }),
      [transport, queryKey],
    );
    return useLifecycle(client, lifecycle, id, refresh);
  };
}
