/**
 * A fake `/api/projects` for rendering the plugin's pages (see `render.tsx`): the application client, translations and authorization are
 * replaced (see `vi.mock` in each test file, which calls `clientMocks()`), and every request is answered by the
 * test's `routes`. Translations render as their keys, with interpolated values appended, so a test reads what a
 * page asked to show.
 */
import { vi } from 'vitest';

import type { Me } from '../../shared/members.js';
import { permissionsOf, type Role } from '../permissions.js';

export interface ApiRequest {
  readonly path: string;
  readonly method: string;
  readonly query: Readonly<Record<string, unknown>>;
  readonly json: unknown;
}

export type Routes = Record<string, (request: ApiRequest) => unknown>;

export class FakeApiError extends Error {
  public constructor(
    public readonly status: number,
    public readonly reason?: string,
  ) {
    super(reason ?? `HTTP ${status}`);
  }
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
        api.routes[request.path];
      if (!handler)
        throw new FakeApiError(
          404,
          `NO_ROUTE ${request.method} ${request.path}`,
        );
      return handler(request);
    },
  ),
};

export const toasts: { type?: string; title: unknown }[] = [];

function interpolate(key: string, options?: Record<string, unknown>): string {
  if (!options) return key;
  const values = Object.entries(options)
    .filter(([name]) => name !== 'defaultValue' && name !== 'ns')
    .map(([name, value]) => `${name}=${String(value)}`);
  return values.length ? `${key}(${values.join(',')})` : key;
}

/**
 * The module replacements every client test installs with `vi.mock`. They stand in for hooks, so they keep the hooks'
 * names.
 */
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
      usePageBreadcrumb: actual.usePageBreadcrumb,
      ApiClientError: FakeApiError,
      useApiClient: () => api,
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
    useTranslation: () => ({
      t: interpolate,
      i18n: { language: 'en-US' },
    }),
    useLocale: () => ({ locale: 'en-US' }),
  }),
  authorization: () => ({ useAuthorizationRevision: () => 0 }),
};
/* eslint-enable @eslint-react/no-unnecessary-use-prefix */

export function me(role: Role = 'admin', userId = 'u1'): Me {
  return {
    userId,
    name: userId,
    permissions: permissionsOf(role, userId),
    kinds: [
      { key: 'user', title: null, executor: true, mentionable: true },
      { key: 'system', title: null, executor: false, mentionable: false },
    ],
  };
}

export function resetApi(routes: Routes): void {
  api.routes = routes;
  api.calls = [];
  api.request.mockClear();
  toasts.length = 0;
}
