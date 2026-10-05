import {
  authenticationToken,
  type Auth,
} from '@nocobase/app-plugin-authentication';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import {
  findUndeclaredApiRoutes,
  generateApiDocument,
} from '@nocobase/app-server/router';
import { ServiceContainer } from '@nocobase/service-provider';
import { Hono } from 'hono';
import { describe, expect, it } from 'vitest';

import { apiRoutes } from '../server/routes/index.js';
import {
  appNoticeServiceToken,
  type AppNoticeService,
} from '../server/tokens.js';

describe('@nocobase/app-plugin-skills-example routes', () => {
  it('returns the default notice for an authenticated request', async () => {
    const router = await apiRoutes.createRouter(
      createApplication(
        { required: () => async (_context, next) => next() } as unknown as Auth,
        {
          getDefaultNotice: () => ({
            title: 'Hello',
            description: 'World',
            tone: 'info',
          }),
        },
      ),
    );

    const response = await router.request('/skillsExample/notice');

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      data: { title: 'Hello', description: 'World', tone: 'info' },
    });
  });

  it('rejects anonymous requests before reading the notice service', async () => {
    const router = await apiRoutes.createRouter(
      createApplication(
        {
          required: () => (context) =>
            context.json({ code: 'UNAUTHORIZED' }, 401),
        } as unknown as Auth,
        {
          getDefaultNotice: () => {
            throw new Error('Anonymous requests must not read the service.');
          },
        },
      ),
    );

    const response = await router.request('/skillsExample/notice');

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ code: 'UNAUTHORIZED' });
  });

  it('declares one API Route contribution', () => {
    expect(apiRoutes).toMatchObject({ scope: 'api' });
  });

  it('declares its Route for the API document', async () => {
    const router = await apiRoutes.createRouter(
      createApplication(
        { required: () => async (_context, next) => next() } as unknown as Auth,
        {
          getDefaultNotice: () => ({
            title: '',
            description: '',
            tone: 'info',
          }),
        },
      ),
    );

    expect(findUndeclaredApiRoutes(router)).toEqual([]);
    const document = await generateApiDocument(router, {
      info: { title: 'Skills example', version: '0.0.0' },
    });
    expect(document.paths?.['/api/skillsExample/notice']?.get).toMatchObject({
      tags: ['SkillsExample'],
      operationId: 'skillsExampleGetNotice',
    });
    expect(document.components?.schemas).toHaveProperty('SkillsExampleNotice');
  });
});

function createApplication(
  authentication: Auth,
  notice: AppNoticeService,
): AppPluginApplication {
  const container = new ServiceContainer();
  container.instance(authenticationToken, authentication);
  container.instance(appNoticeServiceToken, notice);
  return {
    appName: 'main',
    publicBasePath: '',
    config: { app: { name: 'main', publicBasePath: '' } },
    paths: {} as never,
    router: new Hono(),
    container,
  };
}
