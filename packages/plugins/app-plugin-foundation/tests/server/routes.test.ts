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
  it('contributes the overview route and nothing else', () => {
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
    expect(overview).toHaveBeenCalledWith({ refresh: false });
  });

  it('collects again when asked to refresh, and rejects a malformed flag', async () => {
    const overview = vi.fn().mockResolvedValue(OVERVIEW);
    const router = await apiRoutes.createRouter(
      application({ identity: 'unrestricted', overview }),
    );

    expect((await router.request(`${OVERVIEW_PATH}?refresh=true`)).status).toBe(
      200,
    );
    expect(overview).toHaveBeenLastCalledWith({ refresh: true });
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
});

function application(options: {
  readonly identity: 'anonymous' | 'restricted' | 'unrestricted';
  readonly overview: ReturnType<typeof vi.fn>;
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
  }));
  return {
    container,
    config: { get: () => undefined },
  } as unknown as AppPluginApplication;
}
