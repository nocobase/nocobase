import { createAppPaths } from '@nocobase/app-server/config';
import {
  findUndeclaredApiRoutes,
  generateApiDocument,
} from '@nocobase/app-server/router';
import { ServiceContainer } from '@nocobase/service-provider';
import { Hono } from 'hono';
import { describe, expect, it } from 'vitest';

import { apiRoutes } from '../server/routes/index.js';
import { DefaultHeartbeatService } from '../server/services/heartbeat.js';
import { heartbeatServiceToken } from '../server/tokens.js';

describe('@nocobase/app-plugin-service-provider-example routes', () => {
  it('serves its intentionally public lifecycle status Route', async () => {
    const container = new ServiceContainer();
    const heartbeat = new DefaultHeartbeatService();
    heartbeat.start();
    heartbeat.ready();
    container.instance(heartbeatServiceToken, heartbeat);

    const router = await apiRoutes.createRouter({
      appName: 'main',
      publicBasePath: '',
      config: { app: { name: 'main', publicBasePath: '' } },
      paths: createAppPaths({ rootDir: '/missing' }),
      router: new Hono(),
      container,
    });

    const response = await router.request('/serviceProviderExample/status');

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      data: {
        service: '@nocobase/app-plugin-service-provider-example',
        status: 'ready',
        startedAt: expect.any(String),
      },
    });
  });

  it('declares its public Route for the API document', async () => {
    const container = new ServiceContainer();
    container.instance(heartbeatServiceToken, new DefaultHeartbeatService());
    const router = await apiRoutes.createRouter({
      appName: 'main',
      publicBasePath: '',
      config: { app: { name: 'main', publicBasePath: '' } },
      paths: createAppPaths({ rootDir: '/missing' }),
      router: new Hono(),
      container,
    });

    expect(findUndeclaredApiRoutes(router)).toEqual([]);
    const document = await generateApiDocument(router, {
      info: { title: 'Service provider example', version: '0.0.0' },
    });
    expect(
      document.paths?.['/api/serviceProviderExample/status']?.get,
    ).toMatchObject({
      tags: ['ServiceProviderExample'],
      operationId: 'serviceProviderExampleGetStatus',
      security: [],
    });
  });
});
