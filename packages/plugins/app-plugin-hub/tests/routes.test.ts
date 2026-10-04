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
    const response = await router.request(
      `${url}?pageToken=token-1&q=failed&level=error&fromStart=true`,
    );
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(readLogs).toHaveBeenCalledWith(
      'customer',
      { cursor: 'token-1', search: 'failed', level: 'error', fromStart: true },
      url.includes('deployment-1') ? 'deployment-1' : undefined,
    );
    // The entries are the data; the token to read on from and the journal's state are the list's meta.
    await expect(response.json()).resolves.toEqual({
      data: [],
      meta: {
        nextPageToken: '',
        available: false,
        hasMore: false,
        reset: false,
        enabled: true,
      },
    });
    for (const role of ['anonymous', 'member'] as const) {
      const denied = await apiRoutes.createRouter(
        createApplication(role, { readLogs }),
      );
      expect((await denied.request(url)).status).toBe(
        role === 'anonymous' ? 401 : 403,
      );
    }
  });

  it('validates log levels and RFC 3339 bounds, passing bounds in the journal form', async () => {
    const readLogs = vi.fn<HubService['readLogs']>().mockResolvedValue({
      entries: [],
      cursor: '',
      available: true,
      hasMore: false,
      reset: false,
      enabled: true,
    });
    const router = await apiRoutes.createRouter(
      createApplication('administrator', { readLogs }),
    );
    for (const query of [
      'level=verbose',
      'level=',
      'since=yesterday',
      'until=2026-01-01',
    ]) {
      const response = await router.request(`/hub/apps/customer/logs?${query}`);
      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toMatchObject({
        error: { status: 'INVALID_ARGUMENT', reason: 'INVALID_INPUT' },
      });
    }
    expect(readLogs).not.toHaveBeenCalled();

    const response = await router.request(
      '/hub/apps/customer/logs?level=warn&since=2026-01-01T00:00:00Z&until=2026-01-02T00:00:00.5Z',
    );
    expect(response.status).toBe(200);
    expect(readLogs).toHaveBeenCalledWith(
      'customer',
      {
        level: 'warn',
        since: '2026-01-01T00:00:00.000Z',
        until: '2026-01-02T00:00:00.500Z',
        fromStart: false,
      },
      undefined,
    );
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
      '/hub/apps?q=customer&page=2&pageSize=24',
    );

    expect(response.status).toBe(200);
    expect(listAppsPage).toHaveBeenCalledWith({
      search: 'customer',
      page: 2,
      pageSize: 24,
    });
    await expect(response.json()).resolves.toEqual({
      data: [],
      meta: { total: 21, page: 2, pageSize: 24 },
    });
  });

  it.each(['page=0', 'pageSize=101', 'pageSize=abc', `q=${'x'.repeat(101)}`])(
    'rejects the App catalog query %s before listing',
    async (query) => {
      const listAppsPage = vi.fn<HubService['listAppsPage']>();
      const router = await apiRoutes.createRouter(
        createApplication('administrator', {
          listApps: vi.fn<HubService['listApps']>(),
          listAppsPage,
        }),
      );
      const response = await router.request(`/hub/apps?${query}`);
      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toMatchObject({
        error: {
          status: 'INVALID_ARGUMENT',
          reason: 'INVALID_INPUT',
          domain: 'app',
        },
      });
      expect(listAppsPage).not.toHaveBeenCalled();
    },
  );

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
      data: [],
      meta: { total: 21, page: 2, pageSize: 20 },
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
    await expect(response.json()).resolves.toMatchObject({
      error: {
        status: 'PERMISSION_DENIED',
        reason: 'AUTHORIZATION_DENIED',
        domain: 'authorization',
      },
    });
    expect(listAppsPage).not.toHaveBeenCalled();
  });

  it('serves Hub data to Hub administrators', async () => {
    const listAppsPage = vi
      .fn<HubService['listAppsPage']>()
      .mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 20 });
    const router = await apiRoutes.createRouter(
      createApplication('administrator', {
        listApps: vi.fn<HubService['listApps']>(),
        listAppsPage,
      }),
    );

    const response = await router.request('/hub/apps');

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      data: [],
      meta: { total: 0, page: 1, pageSize: 20 },
    });
    expect(listAppsPage).toHaveBeenCalledWith({ page: 1, pageSize: 20 });
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
      meta: { total: 2 },
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
    const listReleasesPage = vi
      .fn<HubService['listReleasesPage']>()
      .mockResolvedValue({
        items: [
          { ...release, buildTarget: null, running: true, everDeployed: true },
        ],
        total: 1,
        page: 1,
        pageSize: 20,
      });
    const router = await apiRoutes.createRouter(
      createApplication('administrator', {
        listApps: vi.fn<HubService['listApps']>().mockResolvedValue([]),
        listReleasesPage,
        getRelease: vi
          .fn<HubService['getRelease']>()
          .mockResolvedValue(release),
      }),
    );

    const listResponse = await router.request('/hub/apps/customer/releases');
    const listBody = (await listResponse.json()) as {
      readonly data: readonly Record<string, unknown>[];
      readonly meta: unknown;
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
    expect(listBody.meta).toEqual({ page: 1, pageSize: 20, total: 1 });
    expect(listReleasesPage).toHaveBeenCalledWith('customer', {
      page: 1,
      pageSize: 20,
    });

    const configResponse = await router.request(
      '/hub/apps/customer/releases/release-1/configTemplate',
    );
    expect(configResponse.headers.get('cache-control')).toBe('no-store');
    await expect(configResponse.json()).resolves.toEqual({
      data: { content: 'auth:\n  secret: sensitive\n' },
    });
  });

  it.each(['page=0', 'pageSize=0', 'pageSize=101', 'pageSize=1.5', 'page=abc'])(
    'rejects the Release list query %s',
    async (query) => {
      const listReleasesPage = vi.fn<HubService['listReleasesPage']>();
      const router = await apiRoutes.createRouter(
        createApplication('administrator', {
          listApps: vi.fn<HubService['listApps']>().mockResolvedValue([]),
          listReleasesPage,
        }),
      );
      const response = await router.request(
        `/hub/apps/customer/releases?${query}`,
      );
      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toMatchObject({
        error: { reason: 'INVALID_INPUT', domain: 'app' },
      });
      expect(listReleasesPage).not.toHaveBeenCalled();
    },
  );

  it.each([
    ['page=2&pageSize=1', { page: 2, pageSize: 1 }],
    ['pageSize=100', { page: 1, pageSize: 100 }],
  ] as const)('passes the Release list query %s', async (query, expected) => {
    const listReleasesPage = vi
      .fn<HubService['listReleasesPage']>()
      .mockResolvedValue({ items: [], total: 0, ...expected });
    const router = await apiRoutes.createRouter(
      createApplication('administrator', {
        listApps: vi.fn<HubService['listApps']>().mockResolvedValue([]),
        listReleasesPage,
      }),
    );
    const response = await router.request(
      `/hub/apps/customer/releases?${query}`,
    );
    expect(response.status).toBe(200);
    expect(listReleasesPage).toHaveBeenCalledWith('customer', expected);
  });

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
      error: {
        code: 413,
        status: 'INVALID_ARGUMENT',
        reason: 'ARTIFACT_TOO_LARGE',
        domain: 'hub',
      },
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

      expect(response.status).toBe(415);
      await expect(response.json()).resolves.toMatchObject({
        error: { reason: 'INVALID_CONTENT_TYPE', domain: 'hub' },
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

    expect(response.status).toBe(201);
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
    const refresh = vi
      .fn<HubService['refresh']>()
      .mockResolvedValue(appDetail());
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
    // A lifecycle operation answers with the App as it stands afterwards.
    await expect(response.json()).resolves.toMatchObject({
      data: { app: { id: 'customer' }, runtime: { state: 'running' } },
    });
  });

  it('starts a previously deployed application', async () => {
    const start = vi.fn<HubService['start']>().mockResolvedValue(appDetail());
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
      .mockResolvedValue(appDetail({ name: 'Renamed App' }));
    const router = await apiRoutes.createRouter(
      createApplication('administrator', {
        listApps: vi.fn<HubService['listApps']>().mockResolvedValue([]),
        updateSettings,
      }),
    );

    const response = await router.request('/hub/apps/customer/settings', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ activation: 'lazy', name: 'Renamed App' }),
    });

    expect(response.status).toBe(200);
    expect(updateSettings).toHaveBeenCalledWith('customer', {
      name: 'Renamed App',
      activation: 'lazy',
    });
    await expect(response.json()).resolves.toEqual({
      data: { name: 'Renamed App', activation: 'lazy' },
    });
  });

  it('rejects unknown and invalid settings before calling the service', async () => {
    const updateSettings = vi.fn<HubService['updateSettings']>();
    const router = await apiRoutes.createRouter(
      createApplication('administrator', {
        listApps: vi.fn<HubService['listApps']>().mockResolvedValue([]),
        updateSettings,
      }),
    );

    for (const body of [{ activation: 'sometimes' }, { startupMode: 'lazy' }]) {
      const response = await router.request('/hub/apps/customer/settings', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      expect(response.status).toBe(400);
      const payload = (await response.json()) as {
        readonly error: {
          readonly reason: string;
          readonly fieldViolations: readonly { readonly field: string }[];
        };
      };
      expect(payload.error.reason).toBe('INVALID_INPUT');
      expect(payload.error.fieldViolations.length).toBeGreaterThan(0);
    }
    expect(updateSettings).not.toHaveBeenCalled();
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

    expect(response.status).toBe(204);
    await expect(response.text()).resolves.toBe('');
    expect(remove).toHaveBeenCalledWith('customer');
  });

  it('answers a service error in the standard body with its metadata', async () => {
    const { HubError } = await import('../server/services/hub.js');
    const appendReleaseUpload = vi
      .fn<HubService['appendReleaseUpload']>()
      .mockRejectedValue(
        new HubError('Offset mismatch.', 'UPLOAD_OFFSET_MISMATCH', 'ABORTED', {
          metadata: { offset: 4 },
        }),
      );
    const router = await apiRoutes.createRouter(
      createApplication('administrator', {
        listApps: vi.fn<HubService['listApps']>().mockResolvedValue([]),
        appendReleaseUpload,
      }),
    );

    const response = await router.request(
      '/hub/apps/customer/releases/uploads/upload-1',
      {
        method: 'PATCH',
        headers: {
          'content-type': 'application/octet-stream',
          'content-length': '3',
          'upload-offset': '0',
        },
        body: 'abc',
      },
    );

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({
      error: {
        code: 409,
        status: 'ABORTED',
        reason: 'UPLOAD_OFFSET_MISMATCH',
        domain: 'hub',
        metadata: { offset: 4 },
      },
    });
  });

  it('validates the headers of an upload chunk before reading it', async () => {
    const appendReleaseUpload = vi.fn<HubService['appendReleaseUpload']>();
    const router = await apiRoutes.createRouter(
      createApplication('administrator', {
        listApps: vi.fn<HubService['listApps']>().mockResolvedValue([]),
        appendReleaseUpload,
      }),
    );

    const response = await router.request(
      '/hub/apps/customer/releases/uploads/upload-1',
      {
        method: 'PATCH',
        headers: { 'content-type': 'application/octet-stream' },
        body: 'abc',
      },
    );

    expect(response.status).toBe(400);
    const payload = (await response.json()) as {
      readonly error: {
        readonly reason: string;
        readonly fieldViolations: readonly { readonly field: string }[];
      };
    };
    expect(payload.error.reason).toBe('INVALID_INPUT');
    expect(payload.error.fieldViolations.map(({ field }) => field)).toEqual(
      expect.arrayContaining(['upload-offset']),
    );
    expect(appendReleaseUpload).not.toHaveBeenCalled();
  });
});

function appDetail(
  overrides: { readonly name?: string } = {},
): Awaited<ReturnType<HubService['getApp']>> {
  const now = new Date('2026-09-29T00:00:00.000Z');
  return {
    buildTarget: null,
    hasReleases: true,
    hasPendingDeployment: false,
    currentVersion: '1.0.0',
    app: {
      id: 'customer',
      name: overrides.name ?? 'Customer',
      description: null,
      currentDeploymentId: 'deployment-1',
      enabled: true,
      basePath: '/apps/customer',
      backend: 'in-process',
      startupMode: 'lazy',
      createdAt: now,
      updatedAt: now,
    },
    deployment: {
      desiredReleaseId: 'release-1',
      observedReleaseId: 'release-1',
      desiredState: 'running',
      observedState: 'running',
      activation: 'lazy',
      basePath: '/apps/customer',
      config: { mode: 'file' },
      error: null,
      updatedAt: now,
    },
    runtime: {
      hostAvailable: true,
      state: 'running',
      version: '1.0.0',
      startedAt: null,
      lastAccessedAt: null,
      activeRequests: 0,
      hostRevision: null,
      error: null,
    },
    hostUrl: null,
  };
}

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
