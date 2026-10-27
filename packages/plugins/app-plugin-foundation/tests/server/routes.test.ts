import { authenticationToken } from '@nocobase/app-plugin-authentication';
import { authorizationToken } from '@nocobase/app-plugin-authorization';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import {
  findApiDocumentSchemaProblems,
  findUndeclaredApiRoutes,
  generateApiDocument,
} from '@nocobase/app-server/router';
import { ServiceContainer } from '@nocobase/service-provider';
import { describe, expect, it, vi } from 'vitest';

import type { FoundationOverview } from '../../shared/foundation.js';
import routes, { apiRoutes } from '../../server/routes/index.js';
import { foundationServiceToken } from '../../server/tokens.js';

const OVERVIEW_PATH = '/foundation/overview';

const OVERVIEW: FoundationOverview = {
  capabilities: [],
  checkedAt: '2026-10-20T08:00:00.000Z',
  durationMs: 12,
  connection: 'default',
};

describe('@nocobase/app-plugin-foundation API routes', () => {
  it('contributes the protected Foundation routes', () => {
    expect(routes).toEqual([apiRoutes]);
  });

  it('rejects an anonymous request before collecting anything', async () => {
    const overview = vi.fn();
    const router = await apiRoutes.createRouter(
      application({ identity: 'anonymous', overview }),
    );

    expect((await router.request(OVERVIEW_PATH)).status).toBe(401);
    expect(overview).not.toHaveBeenCalled();
  });

  it('rejects a signed-in user without unrestricted access, whatever grants they hold', async () => {
    const overview = vi.fn();
    const router = await apiRoutes.createRouter(
      application({ identity: 'restricted', overview }),
    );

    const response = await router.request(OVERVIEW_PATH);

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({
      error: expect.objectContaining({
        code: 403,
        status: 'PERMISSION_DENIED',
        reason: 'FOUNDATION_FORBIDDEN',
        domain: 'foundation',
      }),
    });
    expect(overview).not.toHaveBeenCalled();
  });

  it('answers an administrator with unrestricted access', async () => {
    const overview = vi.fn().mockResolvedValue(OVERVIEW);
    const router = await apiRoutes.createRouter(
      application({ identity: 'unrestricted', overview }),
    );

    const response = await router.request(OVERVIEW_PATH);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ data: OVERVIEW });
    expect(overview).toHaveBeenCalledWith({
      refresh: false,
      countRecords: false,
    });
  });

  it('checks authorization again after a successful response has warmed the service', async () => {
    let identity: 'anonymous' | 'restricted' | 'unrestricted' = 'unrestricted';
    const overview = vi.fn().mockResolvedValue(OVERVIEW);
    const router = await apiRoutes.createRouter(
      application({
        get identity() {
          return identity;
        },
        overview,
      }),
    );
    expect((await router.request(OVERVIEW_PATH)).status).toBe(200);
    identity = 'restricted';
    expect((await router.request(`${OVERVIEW_PATH}?refresh=true`)).status).toBe(
      403,
    );
    identity = 'anonymous';
    expect((await router.request(OVERVIEW_PATH)).status).toBe(401);
    expect(overview).toHaveBeenCalledTimes(1);
  });

  it('collects again when asked to refresh, and rejects a malformed flag', async () => {
    const overview = vi.fn().mockResolvedValue(OVERVIEW);
    const router = await apiRoutes.createRouter(
      application({ identity: 'unrestricted', overview }),
    );

    expect((await router.request(`${OVERVIEW_PATH}?refresh=true`)).status).toBe(
      200,
    );
    expect(overview).toHaveBeenLastCalledWith({
      refresh: true,
      countRecords: false,
    });
    expect(
      (await router.request(`${OVERVIEW_PATH}?refresh=sometimes`)).status,
    ).toBe(400);
  });

  it('declares its route in the API document without schema problems', async () => {
    const router = await apiRoutes.createRouter(
      application({ identity: 'unrestricted', overview: vi.fn() }),
    );

    expect(findUndeclaredApiRoutes(router)).toEqual([]);
    const document = await generateApiDocument(router, {
      info: { title: 'test', version: '0.0.0' },
    });
    expect(findApiDocumentSchemaProblems(document)).toEqual([]);
    expect(
      (
        document.paths?.['/api/foundation/overview'] as {
          get?: { operationId?: string };
        }
      ).get?.operationId,
    ).toBe('foundationGetOverview');
  });

  it.each(['anonymous', 'restricted'] as const)(
    'protects collection browsing and explicit counts from a %s identity',
    async (identity) => {
      const overview = vi.fn();
      const collections = vi.fn();
      const router = await apiRoutes.createRouter(
        application({ identity, overview, collections }),
      );
      expect((await router.request('/foundation/collections')).status).toBe(
        identity === 'anonymous' ? 401 : 403,
      );
      expect(
        (await router.request(`${OVERVIEW_PATH}?countRecords=true`)).status,
      ).toBe(identity === 'anonymous' ? 401 : 403);
      expect(overview).not.toHaveBeenCalled();
      expect(collections).not.toHaveBeenCalled();
    },
  );

  it('validates collection searches, paging and the explicit count flag', async () => {
    const overview = vi.fn().mockResolvedValue(OVERVIEW);
    const collections = vi.fn().mockResolvedValue({
      items: [{ name: 'orders', kind: 'table' }],
      total: 1,
    });
    const router = await apiRoutes.createRouter(
      application({ identity: 'unrestricted', overview, collections }),
    );
    expect(
      (await router.request('/foundation/collections?search=orders&offset=50'))
        .status,
    ).toBe(200);
    expect(collections).toHaveBeenCalledWith({ search: 'orders', offset: 50 });
    expect(
      (await router.request('/foundation/collections?offset=-1')).status,
    ).toBe(400);
    expect(
      (await router.request(`${OVERVIEW_PATH}?countRecords=unknown`)).status,
    ).toBe(400);
    expect(
      (await router.request(`${OVERVIEW_PATH}?countRecords=true`)).status,
    ).toBe(200);
    expect(overview).toHaveBeenCalledWith({
      refresh: false,
      countRecords: true,
    });
    collections.mockResolvedValue(undefined);
    expect((await router.request('/foundation/collections')).status).toBe(503);
  });
});

function application(options: {
  readonly identity: 'anonymous' | 'restricted' | 'unrestricted';
  readonly overview: ReturnType<typeof vi.fn>;
  readonly collections?: ReturnType<typeof vi.fn>;
}): AppPluginApplication {
  const container = new ServiceContainer();
  container.singleton(authenticationToken, () => ({
    required:
      () =>
      async (
        context: { json: (body: unknown, status: number) => unknown },
        next: () => Promise<void>,
      ) => {
        if (options.identity === 'anonymous')
          return context.json({ code: 'UNAUTHENTICATED' }, 401);
        await next();
        return undefined;
      },
  }));
  container.singleton(authorizationToken, () => ({
    middleware:
      () =>
      async (
        context: { set: (key: string, value: unknown) => void },
        next: () => Promise<void>,
      ) => {
        context.set('authz', {
          // A restricted identity may hold every grant there is; only unrestricted access opens the overview.
          snapshot: () =>
            Promise.resolve({
              unrestricted: options.identity === 'unrestricted',
              permissions: [
                { resource: { type: 'page', id: '*' }, actions: ['access'] },
              ],
            }),
        });
        await next();
      },
  }));
  container.singleton(foundationServiceToken, () => ({
    overview: options.overview,
    collections: options.collections,
  }));
  return {
    container,
    config: { get: () => undefined },
  } as unknown as AppPluginApplication;
}
