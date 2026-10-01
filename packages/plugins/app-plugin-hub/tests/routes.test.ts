import {
  authenticationToken,
  type Auth,
} from '@nocobase/app-plugin-authentication';
import {
  authorizationToken,
  type Authorization,
  type PermissionSetsApi,
} from '@nocobase/app-plugin-authorization';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import { AuthorizationDeniedError } from '@nocobase/authorization/core';
import { ServiceContainer } from '@nocobase/service-provider';
import { describe, expect, it, vi } from 'vitest';

import { apiRoutes } from '../server/routes/index.js';
import { hubServiceToken, type HubService } from '../server/tokens.js';

describe('@nocobase/app-plugin-hub API routes', () => {
  it.each([
    '/hub/apps/customer/logs',
    '/hub/apps/customer/deployments/deployment-1/logs',
  ])('protects logs and disables response caching: %s', async (url) => {
    const readLogs = vi.fn<HubService['readLogs']>().mockResolvedValue({
      entries: [],
      cursor: '',
      available: false,
      hasMore: false,
      reset: false,
      enabled: true,
    });
    const router = await apiRoutes.createRouter(
      createApplication('administrator', { readLogs }),
    );
    const response = await router.request(url);
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(readLogs).toHaveBeenCalled();
    for (const role of ['anonymous', 'member'] as const) {
      const denied = await apiRoutes.createRouter(
        createApplication(role, { readLogs }),
      );
      expect((await denied.request(url)).status).toBe(
        role === 'anonymous' ? 401 : 403,
      );
    }
  });

  it('returns a paginated App catalog and passes query options', async () => {
    const listAppsPage = vi
      .fn<HubService['listAppsPage']>()
      .mockResolvedValue({ items: [], total: 21, page: 2, pageSize: 24 });
    const router = await apiRoutes.createRouter(
      createApplication('administrator', {
        listApps: vi.fn<HubService['listApps']>(),
        listAppsPage,
      }),
    );

    const response = await router.request(
      '/hub/apps?search=customer&page=2&pageSize=24',
    );

    expect(response.status).toBe(200);
    expect(listAppsPage).toHaveBeenCalledWith({
      search: 'customer',
      page: 2,
      pageSize: 24,
    });
    await expect(response.json()).resolves.toEqual({
      data: { items: [], total: 21, page: 2, pageSize: 24 },
    });
  });

  it('returns deployment pagination metadata and passes query options', async () => {
    const listDeployments = vi
      .fn<HubService['listDeployments']>()
      .mockResolvedValue({ items: [], total: 21, page: 2, pageSize: 20 });
    const router = await apiRoutes.createRouter(
      createApplication('administrator', {
        listApps: vi.fn<HubService['listApps']>(),
        listDeployments,
      }),
    );
    const response = await router.request(
      '/hub/apps/customer/deployments?page=2&pageSize=20',
    );
    expect(response.status).toBe(200);
    expect(listDeployments).toHaveBeenCalledWith('customer', {
      page: 2,
      pageSize: 20,
    });
    await expect(response.json()).resolves.toEqual({
      data: { items: [], total: 21, page: 2, pageSize: 20 },
    });
  });

  it('rejects anonymous requests', async () => {
    const listAppsPage = vi.fn<HubService['listAppsPage']>();
    const router = await apiRoutes.createRouter(
      createApplication('anonymous', {
        listApps: vi.fn<HubService['listApps']>(),
        listAppsPage,
      }),
    );

    const response = await router.request('/hub/apps');

    expect(response.status).toBe(401);
    expect(listAppsPage).not.toHaveBeenCalled();
  });

  it('rejects authenticated users without Hub access', async () => {
    const listAppsPage = vi.fn<HubService['listAppsPage']>();
    const router = await apiRoutes.createRouter(
      createApplication('member', {
        listApps: vi.fn<HubService['listApps']>(),
        listAppsPage,
      }),
    );

    const response = await router.request('/hub/apps');

    expect(response.status).toBe(403);
    expect(listAppsPage).not.toHaveBeenCalled();
  });

  it('serves Hub data to Hub administrators', async () => {
    const listAppsPage = vi
      .fn<HubService['listAppsPage']>()
      .mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 24 });
    const router = await apiRoutes.createRouter(
      createApplication('administrator', {
        listApps: vi.fn<HubService['listApps']>(),
        listAppsPage,
      }),
    );

    const response = await router.request('/hub/apps');

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      data: { items: [], total: 0, page: 1, pageSize: 24 },
    });
    expect(listAppsPage).toHaveBeenCalledOnce();
  });

  it('returns only the protected Hub role definitions to user administrators', async () => {
    const router = await apiRoutes.createRouter(
      createApplication(
        'administrator',
        vi.fn<HubService['listApps']>().mockResolvedValue([]),
        [
          {
            key: 'hub-administrator',
            title: 'Hub administrator',
            grants: [
              {
                resource: { type: 'user', id: '*' },
                actions: [{ action: 'read' }, { action: 'create' }],
              },
            ],
          },
          {
            key: 'unrelated-role',
            title: 'Unrelated',
            grants: [],
          },
          {
            key: 'hub-operator',
            title: 'Hub operator',
            grants: [
              {
                resource: { type: 'hub.app', id: '*' },
                actions: [{ action: 'read' }],
              },
            ],
          },
        ],
      ),
    );

    const response = await router.request('/hub/roles');

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      data: [
        {
          key: 'hub-administrator',
          title: 'Hub administrator',
          grants: [
            {
              resource: { type: 'user', id: '*' },
              actions: ['read', 'create'],
            },
          ],
        },
        {
          key: 'hub-operator',
          title: 'Hub operator',
          grants: [
            {
              resource: { type: 'hub.app', id: '*' },
              actions: ['read'],
            },
          ],
        },
      ],
    });
  });

  it('rejects the Hub role matrix for users without user-read access', async () => {
    const router = await apiRoutes.createRouter(
      createApplication(
        'member',
        vi.fn<HubService['listApps']>().mockResolvedValue([]),
      ),
    );

    const response = await router.request('/hub/roles');

    expect(response.status).toBe(403);
  });

  it('keeps the Release config example out of lists and reads it on demand', async () => {
    const release = {
      id: 'release-1',
      appId: 'customer',
      version: '1.0.0',
      artifactKey: 'releases/customer/release-1.tgz',
      checksum: 'a'.repeat(64),
      size: 100,
      configTemplate: 'auth:\n  secret: sensitive\n',
      manifest: null,
      createdAt: new Date('2026-09-04T00:00:00Z'),
    } as const;
    const listReleases = vi
      .fn<HubService['listReleases']>()
      .mockResolvedValue([
        { ...release, buildTarget: null, running: true, everDeployed: true },
      ]);
    const router = await apiRoutes.createRouter(
      createApplication('administrator', {
        listApps: vi.fn<HubService['listApps']>().mockResolvedValue([]),
        listReleases,
        getRelease: vi
          .fn<HubService['getRelease']>()
          .mockResolvedValue(release),
      }),
    );

    const listResponse = await router.request('/hub/apps/customer/releases');
    const listBody = (await listResponse.json()) as {
      readonly data: readonly Record<string, unknown>[];
    };
    expect(listBody.data[0]).toMatchObject({
      id: 'release-1',
      hasConfigTemplate: true,
    });
    expect(listBody.data[0]).not.toHaveProperty('configTemplate');
    expect(Object.keys(listBody.data[0] ?? {}).sort()).toEqual([
      'buildTarget',
      'checksum',
      'createdAt',
      'everDeployed',
      'hasConfigTemplate',
      'id',
      'running',
      'size',
      'version',
    ]);
    // Without a limit the web UI keeps receiving every Release.
    expect(listReleases).toHaveBeenCalledWith('customer', {});

    const configResponse = await router.request(
      '/hub/apps/customer/releases/release-1/config-template',
    );
    expect(configResponse.headers.get('cache-control')).toBe('no-store');
    await expect(configResponse.json()).resolves.toEqual({
      data: { content: 'auth:\n  secret: sensitive\n' },
    });
  });

  it.each(['0', '101', '-1', '1.5', 'abc', '', '01'])(
    'rejects the Release list limit %j',
    async (limit) => {
      const listReleases = vi.fn<HubService['listReleases']>();
      const router = await apiRoutes.createRouter(
        createApplication('administrator', {
          listApps: vi.fn<HubService['listApps']>().mockResolvedValue([]),
          listReleases,
        }),
      );
      const response = await router.request(
        `/hub/apps/customer/releases?limit=${limit}`,
      );
      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toMatchObject({
        error: { code: 'INVALID_LIMIT' },
      });
      expect(listReleases).not.toHaveBeenCalled();
    },
  );

  it.each(['1', '20', '100'])(
    'passes the Release list limit %s',
    async (limit) => {
      const listReleases = vi
        .fn<HubService['listReleases']>()
        .mockResolvedValue([]);
      const router = await apiRoutes.createRouter(
        createApplication('administrator', {
          listApps: vi.fn<HubService['listApps']>().mockResolvedValue([]),
          listReleases,
        }),
      );
      const response = await router.request(
        `/hub/apps/customer/releases?limit=${limit}`,
      );
      expect(response.status).toBe(200);
      expect(listReleases).toHaveBeenCalledWith('customer', {
        limit: Number(limit),
      });
    },
  );

  it('rejects oversized Release bodies before reading them', async () => {
    const router = await apiRoutes.createRouter(
      createApplication(
        'administrator',
        vi.fn<HubService['listApps']>().mockResolvedValue([]),
      ),
    );

    const response = await router.request('/hub/apps/customer/releases', {
      method: 'POST',
      headers: {
        'content-type': 'application/gzip',
        'content-length': String(256 * 1024 * 1024 + 1),
      },
      body: 'not-read',
    });

    expect(response.status).toBe(413);
    await expect(response.json()).resolves.toMatchObject({
      error: { code: 'ARTIFACT_TOO_LARGE' },
    });
  });

  it.each([
    'application/vnd.nocobase.release-upload.v1',
    'application/json',
    undefined,
  ])(
    'rejects Release uploads of type %s without reading them',
    async (contentType) => {
      const createRelease = vi.fn<HubService['createRelease']>();
      const router = await apiRoutes.createRouter(
        createApplication('administrator', {
          listApps: vi.fn<HubService['listApps']>().mockResolvedValue([]),
          createRelease,
        }),
      );

      const response = await router.request('/hub/apps/customer/releases', {
        method: 'POST',
        headers: {
          ...(contentType ? { 'content-type': contentType } : {}),
          'x-hub-config-length': '4',
        },
        body: 'not-read',
      });

      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toMatchObject({
        error: { code: 'INVALID_CONTENT_TYPE' },
      });
      expect(createRelease).not.toHaveBeenCalled();
    },
  );

  it('returns an upload result without a deployment', async () => {
    const createRelease = vi
      .fn<HubService['createRelease']>()
      .mockResolvedValue({
        id: 'release-1',
        appId: 'customer',
        artifactKey: 'customer/release-1.tar.gz',
        version: '1.0.0',
        checksum: 'a'.repeat(64),
        size: 3,
        configTemplate: 'name: example',
        manifest: null,
        createdAt: new Date('2026-09-29T00:00:00.000Z'),
        reused: true,
      });
    const router = await apiRoutes.createRouter(
      createApplication('administrator', {
        listApps: vi.fn<HubService['listApps']>().mockResolvedValue([]),
        createRelease,
      }),
    );

    const response = await router.request('/hub/apps/customer/releases', {
      method: 'POST',
      headers: {
        'content-type': 'application/octet-stream',
        'idempotency-key': 'ci-1',
        'x-artifact-sha256': 'a'.repeat(64),
      },
      body: 'abc',
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      data: {
        id: 'release-1',
        releaseId: 'release-1',
        version: '1.0.0',
        checksum: 'a'.repeat(64),
        size: 3,
        createdAt: '2026-09-29T00:00:00.000Z',
        hasConfigTemplate: true,
        reused: true,
      },
    });
    expect(createRelease).toHaveBeenCalledWith('customer', {
      stream: expect.anything(),
      checksum: 'a'.repeat(64),
      idempotencyKey: 'ci-1',
    });
  });

  it('refreshes one application from the Host status', async () => {
    const refresh = vi.fn<HubService['refresh']>().mockResolvedValue({
      app: { id: 'customer' },
    } as never);
    const router = await apiRoutes.createRouter(
      createApplication('administrator', {
        listApps: vi.fn<HubService['listApps']>().mockResolvedValue([]),
        refresh,
      }),
    );

    const response = await router.request('/hub/apps/customer/refresh', {
      method: 'POST',
    });

    expect(response.status).toBe(200);
    expect(refresh).toHaveBeenCalledWith('customer');
  });

  it('starts a previously deployed application', async () => {
    const start = vi.fn<HubService['start']>().mockResolvedValue({
      app: { id: 'customer' },
    } as never);
    const router = await apiRoutes.createRouter(
      createApplication('administrator', {
        listApps: vi.fn<HubService['listApps']>().mockResolvedValue([]),
        start,
      }),
    );

    const response = await router.request('/hub/apps/customer/start', {
      method: 'POST',
    });

    expect(response.status).toBe(200);
    expect(start).toHaveBeenCalledWith('customer');
  });

  it('updates application startup settings', async () => {
    const updateSettings = vi
      .fn<HubService['updateSettings']>()
      .mockResolvedValue({ app: { id: 'customer' } } as never);
    const router = await apiRoutes.createRouter(
      createApplication('administrator', {
        listApps: vi.fn<HubService['listApps']>().mockResolvedValue([]),
        updateSettings,
      }),
    );

    const response = await router.request('/hub/apps/customer/settings', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ activation: 'lazy', name: 'Renamed App' }),
    });

    expect(response.status).toBe(200);
    expect(updateSettings).toHaveBeenCalledWith('customer', {
      name: 'Renamed App',
      activation: 'lazy',
    });
  });

  it('accepts deployments asynchronously', async () => {
    const createdAt = new Date('2026-09-18T07:00:00.000Z');
    const deploy = vi.fn<HubService['deploy']>().mockResolvedValue({
      id: 'deployment-1',
      status: 'queued',
      reused: true,
      createdAt,
    } as never);
    const router = await apiRoutes.createRouter(
      createApplication('administrator', {
        listApps: vi.fn<HubService['listApps']>().mockResolvedValue([]),
        deploy,
      }),
    );

    const response = await router.request('/hub/apps/customer/deploy', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        releaseId: 'release-1',
        config: { mode: 'external' },
      }),
    });

    expect(response.status).toBe(202);
    await expect(response.json()).resolves.toEqual({
      data: {
        id: 'deployment-1',
        operationId: 'deployment-1',
        status: 'queued',
        reused: true,
        createdAt: createdAt.toISOString(),
      },
    });
    expect(deploy).toHaveBeenCalledWith('customer', {
      releaseId: 'release-1',
      config: { mode: 'external' },
    });
  });

  it('creates rollback operations asynchronously', async () => {
    const rollback = vi.fn<HubService['rollback']>().mockResolvedValue({
      id: 'deployment-2',
      status: 'queued',
    } as never);
    const router = await apiRoutes.createRouter(
      createApplication('administrator', {
        listApps: vi.fn<HubService['listApps']>().mockResolvedValue([]),
        rollback,
      }),
    );

    const response = await router.request('/hub/apps/customer/rollback', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        deploymentId: 'deployment-1',
        config: { mode: 'file', content: 'feature: true\n' },
      }),
    });

    expect(response.status).toBe(202);
    expect(rollback).toHaveBeenCalledWith('customer', {
      deploymentId: 'deployment-1',
      config: { mode: 'file', content: 'feature: true\n' },
    });
  });

  it('updates the active file configuration without creating a deployment', async () => {
    const updateConfig = vi.fn<HubService['updateConfig']>().mockResolvedValue({
      mode: 'file',
      content: 'feature: true\n',
    });
    const router = await apiRoutes.createRouter(
      createApplication('administrator', {
        listApps: vi.fn<HubService['listApps']>().mockResolvedValue([]),
        updateConfig,
      }),
    );

    const response = await router.request('/hub/apps/customer/config', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ content: 'feature: true\n' }),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(response.headers.get('pragma')).toBe('no-cache');
    expect(updateConfig).toHaveBeenCalledWith('customer', {
      content: 'feature: true\n',
    });
    await expect(response.json()).resolves.toMatchObject({
      data: { mode: 'file', content: 'feature: true\n' },
    });
  });

  it('removes one application for a system administrator', async () => {
    const remove = vi.fn<HubService['remove']>().mockResolvedValue(undefined);
    const router = await apiRoutes.createRouter(
      createApplication('administrator', {
        listApps: vi.fn<HubService['listApps']>().mockResolvedValue([]),
        remove,
      }),
    );

    const response = await router.request('/hub/apps/customer', {
      method: 'DELETE',
    });

    expect(response.status).toBe(200);
    expect(remove).toHaveBeenCalledWith('customer');
  });
});

function createApplication(
  role: 'anonymous' | 'member' | 'administrator',
  service:
    | HubService['listApps']
    | (Partial<HubService> &
        Pick<HubService, 'listApps'> & {
          readonly listAppsPage?: HubService['listAppsPage'];
        }),
  permissionSets: readonly {
    readonly key: string;
    readonly title?: string;
    readonly grants: readonly {
      readonly resource: { readonly type: string; readonly id: string };
      readonly actions: readonly { readonly action: string }[];
    }[];
  }[] = [],
): AppPluginApplication {
  const container = new ServiceContainer();
  container.instance(authenticationToken, {
    required: () => async (context, next) => {
      if (role === 'anonymous') {
        return context.json({ code: 'UNAUTHORIZED' }, 401);
      }
      await next();
    },
  } as Auth);
  container.instance(authorizationToken, {
    permissionSets: {
      list: () => Promise.resolve(permissionSets),
    } as unknown as PermissionSetsApi,
    middleware: () => async (context, next) => {
      context.set('authz', {
        identity: { principal: { type: 'user', id: role } },
        can: async () => role === 'administrator',
        require: async () => {
          if (role !== 'administrator') {
            throw new AuthorizationDeniedError({
              effect: 'deny',
              reasons: [
                {
                  code: 'HUB_ACCESS_DENIED',
                  message: 'Hub access is not allowed',
                },
              ],
            });
          }
        },
      });
      await next();
    },
  } as unknown as Authorization);
  const resolvedService =
    typeof service === 'function'
      ? {
          listApps: service,
          listAppsPage: vi
            .fn<HubService['listAppsPage']>()
            .mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 24 }),
        }
      : {
          ...service,
          listAppsPage:
            service.listAppsPage ??
            vi.fn<HubService['listAppsPage']>().mockResolvedValue({
              items: [],
              total: 0,
              page: 1,
              pageSize: 24,
            }),
        };
  container.instance(hubServiceToken, resolvedService as HubService);
  return {
    appName: 'hub',
    publicBasePath: '',
    config: {} as AppPluginApplication['config'],
    container,
    paths: {} as AppPluginApplication['paths'],
  };
}
