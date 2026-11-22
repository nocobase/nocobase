import { authenticationToken } from '@nocobase/app-plugin-authentication';
import { authorizationToken } from '@nocobase/app-plugin-authorization';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import {
  ApiError,
  findApiDocumentSchemaProblems,
  findUndeclaredApiRoutes,
  generateApiDocument,
} from '@nocobase/app-server/router';
import { ServiceContainer } from '@nocobase/service-provider';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { PLUGINS_ACCESS } from '../../shared/access.js';
import routes, { apiRoutes } from '../../server/routes/index.js';
import { createApplicationFixture } from '../helpers/application.js';

const MAIL = '@nocobase/app-plugin-mail';
const cleanups: (() => Promise<void>)[] = [];
afterEach(async () => {
  await Promise.all(cleanups.splice(0).map((cleanup) => cleanup()));
});

type Identity = 'anonymous' | 'without-grant' | 'with-grant';

async function application(identity: () => Identity) {
  const fixture = await createApplicationFixture({
    dependencies: [MAIL],
    installed: [{ name: MAIL, version: '1.2.3' }],
  });
  cleanups.push(fixture.cleanup);
  const required = vi.fn();
  const container = new ServiceContainer();
  container.singleton(authenticationToken, () => ({
    required:
      () =>
      async (
        context: { json: (body: unknown, status: number) => unknown },
        next: () => Promise<void>,
      ) => {
        if (identity() === 'anonymous')
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
          require: (access: unknown) => {
            required(access);
            if (identity() !== 'with-grant')
              throw new ApiError({
                status: 'PERMISSION_DENIED',
                reason: 'AUTHORIZATION_DENIED',
                domain: 'authorization',
                message: 'Denied.',
              });
            return Promise.resolve();
          },
        });
        await next();
      },
  }));
  const app = {
    container,
    config: { get: () => undefined },
    paths: {
      rootDir: fixture.rootDir,
      server: () => fixture.rootDir,
    },
    registeredServerPlugins: [{ packageName: MAIL, version: '1.2.3' }],
  } as unknown as AppPluginApplication;
  return { router: await apiRoutes.createRouter(app), required };
}

describe('GET /api/foundation/plugins', () => {
  it('lists the plugins for a holder of «Plugins · View»', async () => {
    const { router, required } = await application(() => 'with-grant');

    const response = await router.request(
      `/foundation/plugins?client=${encodeURIComponent(MAIL)}`,
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      data: [
        expect.objectContaining({
          packageName: MAIL,
          name: 'mail',
          version: '1.2.3',
          state: 'registered',
          enabled: true,
        }),
      ],
      meta: { deployed: false },
    });
    expect(required).toHaveBeenCalledWith(PLUGINS_ACCESS);
  });

  it('answers 403 without the grant and 401 without a sign-in', async () => {
    let identity: Identity = 'without-grant';
    const { router } = await application(() => identity);

    const denied = await router.request('/foundation/plugins');
    expect(denied.status).toBe(403);
    expect(await denied.json()).toEqual({
      error: expect.objectContaining({ reason: 'AUTHORIZATION_DENIED' }),
    });

    identity = 'anonymous';
    expect((await router.request('/foundation/plugins')).status).toBe(401);
  });

  it('declares itself in the API document', async () => {
    const { router } = await application(() => 'with-grant');
    expect(findUndeclaredApiRoutes(router)).toEqual([]);
    const document = await generateApiDocument(router, {
      info: { title: 'Test', version: '1.0.0' },
    });
    expect(findApiDocumentSchemaProblems(document)).toEqual([]);
    expect(
      Object.values(document.paths ?? {}).map((item) => item?.get?.operationId),
    ).toEqual(['foundationListPlugins']);
  });

  it('contributes only the plugins API', () => {
    expect(routes).toEqual([apiRoutes]);
  });
});
