/**
 * Fakes for rendering the plugin's pages: the application client (API, toaster, realtime), translations and
 * authorization are replaced (`vi.mock` in each test file calls `clientMocks`), and every request is answered by the
 * test's `routes`. Translations render as their keys, with interpolated values appended, so a test reads what a page
 * asked to show.
 */
import { vi } from 'vitest';

export interface ApiRequest {
  readonly path: string;
  readonly method: string;
  readonly query: Readonly<Record<string, unknown>>;
  readonly json: unknown;
}

export type Routes = Record<string, (request: ApiRequest) => unknown>;

export class FakeApiError extends Error {
  public readonly status: number;
  public readonly reason?: string;
  /** The error body, as the client keeps it. */
  public readonly payload: unknown;

  public constructor(status: number, reason?: string, payload?: unknown) {
    super(reason ?? `HTTP ${status}`);
    this.status = status;
    if (reason) this.reason = reason;
    this.payload = payload;
  }
}

/**
 * The body a route answers: a handler returns the answer's `data` (an array is a list, with `meta.total`), or a whole
 * body with `data` and `meta` when the test needs paging; `undefined` is a 204.
 */
function answerOf(result: unknown): unknown {
  if (result === undefined) return undefined;
  if (Array.isArray(result))
    return { data: result, meta: { total: result.length } };
  if (result && typeof result === 'object' && 'data' in result) return result;
  return { data: result };
}

export const api = {
  routes: {} as Routes,
  calls: [] as ApiRequest[],
  request: vi.fn(
    async (options: {
      path: string;
      method?: string;
      query?: Record<string, unknown>;
      json?: unknown;
    }): Promise<unknown> => {
      const request: ApiRequest = {
        path: options.path,
        method: options.method ?? 'GET',
        query: options.query ?? {},
        json: options.json,
      };
      api.calls.push(request);
      const handler =
        api.routes[`${request.method} ${request.path}`] ??
        (request.method === 'GET' ? api.routes[request.path] : undefined);
      if (!handler)
        throw new FakeApiError(
          404,
          `NO_ROUTE ${request.method} ${request.path}`,
        );
      return answerOf(await handler(request));
    },
  ),
};

/** An in-memory realtime client: tests publish on a topic and the subscribed pages hear it. */
export const realtime = {
  listeners: new Map<string, Set<(event: { payload: unknown }) => void>>(),
  subscribe(topic: string, listener: (event: { payload: unknown }) => void) {
    const set = realtime.listeners.get(topic) ?? new Set();
    set.add(listener);
    realtime.listeners.set(topic, set);
    return () => set.delete(listener);
  },
  onOpen: () => () => undefined,
  publish(topic: string, payload: unknown): void {
    for (const listener of realtime.listeners.get(topic) ?? [])
      listener({ payload });
  },
};

export const toasts: { type?: string; title: unknown }[] = [];

/** The settings permissions `useCan` grants, as `item/action`. */
export const granted = new Set<string>();

function interpolate(key: string, options?: Record<string, unknown>): string {
  if (!options) return key;
  const values = Object.entries(options)
    .filter(([name]) => name !== 'defaultValue' && name !== 'ns')
    .map(([name, value]) => `${name}=${String(value)}`);
  return values.length ? `${key}(${values.join(',')})` : key;
}

/** The module replacements every client test installs with `vi.mock`; they keep the hooks' names. */
/* eslint-disable @eslint-react/no-unnecessary-use-prefix */
export const clientMocks = {
  /** The client runtime's fakes, with its real unsaved-changes guard (dialogs ask before discarding input). */
  appClient: async () => {
    const actual = await vi.importActual<typeof import('@nocobase/app-client')>(
      '@nocobase/app-client',
    );
    return {
      UnsavedChangesContext: actual.UnsavedChangesContext,
      useGuardedClose: actual.useGuardedClose,
      useUnsavedChanges: actual.useUnsavedChanges,
      useUnsavedChangesGuard: actual.useUnsavedChangesGuard,
      PageBreadcrumbProvider: actual.PageBreadcrumbProvider,
      usePageBreadcrumb: actual.usePageBreadcrumb,
      usePageBreadcrumbLevels: actual.usePageBreadcrumbLevels,
      ApiClientError: FakeApiError,
      realtimeClientToken: 'realtime',
      useApiClient: () => api,
      useService: () => realtime,
      useToaster: () => ({
        show: (options: { type?: string; title: unknown }) => {
          toasts.push(options);
          return String(toasts.length);
        },
        close: () => undefined,
      }),
    };
  },
  i18n: () => ({
    useTranslation: () => ({ t: interpolate, i18n: { language: 'en-US' } }),
    useLocale: () => ({ locale: 'en-US' }),
    withNamespace: (_namespace: string, component: unknown) => component,
  }),
  authorization: () => ({
    useCan: (check: {
      resource: { id: string };
      action: string;
    }): { can: boolean } => ({
      can: granted.has(`${check.resource.id}/${check.action}`),
    }),
  }),
};
/* eslint-enable @eslint-react/no-unnecessary-use-prefix */

export function resetApi(
  routes: Routes,
  permissions: readonly string[] = [],
): void {
  api.routes = routes;
  api.calls = [];
  api.request.mockClear();
  toasts.length = 0;
  realtime.listeners.clear();
  granted.clear();
  for (const permission of permissions) granted.add(permission);
}

export function callsTo(method: string, path: string): ApiRequest[] {
  return api.calls.filter(
    (call) => call.method === method && call.path === path,
  );
}
