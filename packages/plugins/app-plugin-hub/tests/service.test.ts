import { fileURLToPath } from 'node:url';
import configFingerprintMigration from '../database/migrations/202609160007_release_config_fingerprint.js';
import removeDeploymentMode from '../database/migrations/202609160006_remove_deployment_mode.js';
import publishingMigration from '../database/migrations/202609160005_release_publishing.js';
import sqlite from '@nocobase/db-sqlite';
import {
  mkdtemp,
  mkdir,
  readFile,
  readdir,
  rm,
  stat,
  writeFile,
} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import type {
  HostDeploymentSet,
  HostManagementService,
  HostRuntime,
  HostStatus,
} from '@nocobase/app-host/management';
import {
  createDatabaseManager,
  createMigrator,
  InMemoryCollectionMetadataStore,
  type DatabaseManager,
} from '@nocobase/db';
import { c as createTar, Header } from 'tar';
import { gzipSync } from 'node:zlib';
import { parse as parseYaml } from 'yaml';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import ownershipMigration from '../database/migrations/202609160004_hub_app_ownership.js';
import migration from '../database/migrations/202609010001_create_hub_app_tables.js';
import {
  DefaultHubService,
  HubError,
  type DefaultHubServiceOptions,
  type HubHostController,
} from '../server/services/hub.js';

describe('@nocobase/app-plugin-hub service', () => {
  let database: DatabaseManager;
  let rootDir: string;
  let host: FakeHostController;
  let service: DefaultHubService;

  beforeEach(async () => {
    rootDir = await mkdtemp(path.join(os.tmpdir(), 'nocobase-hub-test-'));
    database = createDatabaseManager({
      drivers: { sqlite },
      default: 'main',
      metadataStore: new InMemoryCollectionMetadataStore(),
      connections: { main: { dialect: 'sqlite', filename: ':memory:' } },
    });
    const authenticationDirectory =
      '../../app-plugin-authentication/database/migrations';
    await createMigrator({
      database,
      packageName: '@nocobase/app-plugin-authentication',
      directory: fileURLToPath(
        new URL(authenticationDirectory, import.meta.url),
      ),
    }).latest();
    for (const id of ['alice', 'bob']) {
      await database
        .query()
        .insertInto('user')
        .values({
          id,
          name: id,
          email: `${id}@example.com`,
          emailVerified: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .execute();
    }
    const connection = database.connection();
    await migration.up({
      builder: connection.builder,
      query: connection.query,
      connection,
    });
    await ownershipMigration.up({
      builder: connection.builder,
      query: connection.query,
      connection,
    });
    await publishingMigration.up({
      builder: connection.builder,
      query: connection.query,
      connection,
    });
    await removeDeploymentMode.up({
      builder: connection.builder,
      query: connection.query,
      connection,
    });
    await configFingerprintMigration.up({
      builder: connection.builder,
      query: connection.query,
      connection,
    });
    host = new FakeHostController();
    service = new DefaultHubService(createServiceOptions());
    await service.prepare();
  });

  function createServiceOptions(
    overrides: Partial<DefaultHubServiceOptions> = {},
  ): DefaultHubServiceOptions {
    return {
      database,
      hostController: host,
      config: {
        artifact: {
          driver: 'fs',
          location: path.join(rootDir, 'app-artifacts'),
          visibility: 'private',
        },
        host: {
          enabled: true,
          driver: 'tsx',
          appRevisionsDir: path.join(rootDir, 'app-deployments'),
          appVolumesDir: path.join(rootDir, 'app-volumes'),
          configPath: path.join(rootDir, 'hub', 'host-config.yml'),
        },
      },
      ...overrides,
    };
  }

  afterEach(async () => {
    await service.shutdown();
    await database.destroy();
    await rm(rootDir, { recursive: true, force: true });
  });

  it('keeps desired configurations and deployment logs independent of the Host config path', async () => {
    await service.shutdown();
    const options = createServiceOptions();
    service = new DefaultHubService({
      ...options,
      config: {
        ...options.config,
        desiredConfigsDir: path.join(rootDir, 'hub/desired-configs'),
        logging: {
          deployments: {
            directory: path.join(rootDir, 'hub/logs/deployments'),
          },
        },
        host: {
          ...options.config.host,
          configPath: path.join(rootDir, 'host/runtime/config.yml'),
        },
      },
    });
    await service.prepare();
    await service.createApp({ id: 'customer', name: 'Customer' });
    const release = await service.createRelease('customer', {
      bytes: await createArtifact(rootDir, '1.0.0'),
    });
    const deployment = await service.deploy('customer', {
      releaseId: release.id,
    });
    await waitForDeployment(service, 'customer', deployment.id);
    expect(deployment.config.path).toBe(
      path.join(
        rootDir,
        'hub/desired-configs/customer',
        `${deployment.id}.yml`,
      ),
    );
    expect(await readFile(deployment.config.path!, 'utf8')).toBeTruthy();
    const logs = await service.readLogs(
      'customer',
      { fromStart: true },
      deployment.id,
    );
    expect(logs.entries.length).toBeGreaterThan(0);
    await service.remove('customer');
    await expect(
      readFile(deployment.config.path!, 'utf8'),
    ).rejects.toMatchObject({ code: 'ENOENT' });
  });

  it('allows the same name across owners while keeping IDs globally unique', async () => {
    await service.createApp({ id: 'tms-alice', name: 'TMS' }, 'alice');
    await service.createApp({ id: 'tms-bob', name: 'TMS' }, 'bob');
    await expect(
      service.createApp({ id: 'tms-alice', name: 'Another name' }, 'bob'),
    ).rejects.toMatchObject({ code: 'APP_EXISTS', status: 409 });
    expect(
      (await service.listAppsPage({ createdBy: 'bob' })).items.map(
        ({ app }) => app.id,
      ),
    ).toEqual(['tms-bob']);
  });

  it('reports concurrent duplicate IDs as a conflict without losing the winner', async () => {
    const results = await Promise.allSettled([
      service.createApp({ id: 'tms', name: 'TMS' }, 'alice'),
      service.createApp({ id: 'tms', name: 'TMS' }, 'bob'),
    ]);
    expect(
      results.filter((result) => result.status === 'fulfilled'),
    ).toHaveLength(1);
    expect(
      results.find((result) => result.status === 'rejected'),
    ).toMatchObject({
      reason: { code: 'APP_EXISTS', status: 409 },
    });
    expect((await service.listAppsPage()).total).toBe(1);
  });

  it('scopes catalog totals, search, and pages to the authenticated creator', async () => {
    await service.createApp({ id: 'alice-a', name: 'Shared name' }, 'alice');
    await service.createApp({ id: 'alice-b', name: 'Shared name' }, 'alice');
    await service.createApp({ id: 'bob', name: 'Shared name' }, 'bob');
    await service.createApp({ id: 'legacy', name: 'Legacy' });
    const own = await service.listAppsPage({
      createdBy: 'alice',
      search: 'Shared',
      pageSize: 1,
      page: 2,
    });
    expect(own).toMatchObject({ total: 2, page: 2, pageSize: 1 });
    expect(own.items[0]?.app.id).toMatch(/^alice-/);
    expect(
      await service.listAppsPage({ createdBy: 'alice', search: 'bob' }),
    ).toMatchObject({ items: [], total: 0 });
    expect(await service.listAppsPage({ createdBy: 'new-user' })).toMatchObject(
      { items: [], total: 0 },
    );
    expect((await service.listAppsPage()).total).toBe(4);
    expect(
      await database
        .query()
        .selectFrom('hubApps')
        .select('createdBy')
        .where('id', '=', 'alice-a')
        .executeTakeFirst(),
    ).toEqual({ createdBy: 'alice' });
  });

  it('cleans the candidate artifact when release persistence fails', async () => {
    await service.createApp({ id: 'customer', name: 'Customer' });
    const bytes = await createArtifact(rootDir, '1.0.0');
    const failure = vi
      .spyOn(database, 'transaction')
      .mockRejectedValueOnce(new Error('Database unavailable'));
    await expect(service.createRelease('customer', { bytes })).rejects.toThrow(
      'Database unavailable',
    );
    failure.mockRestore();
    expect(await service.listReleases('customer')).toHaveLength(0);
    expect(
      (await readdir(path.join(rootDir, 'app-artifacts/customer'))).filter(
        (name) => name.endsWith('.tar.gz'),
      ),
    ).toEqual([]);
  });

  it('deduplicates concurrent uploads and binds multiple retry keys without rewriting releases', async () => {
    await service.createApp({ id: 'customer', name: 'Customer' });
    await service.createApp({ id: 'other', name: 'Other' });
    const bytes = await createArtifact(rootDir, '1.2.3');
    const [first, second] = await Promise.all([
      service.createRelease('customer', { bytes, idempotencyKey: 'ci-1' }),
      service.createRelease('customer', { bytes, idempotencyKey: 'ci-2' }),
    ]);
    expect(first.id).toBe(second.id);
    expect((await service.listReleases('customer')).length).toBe(1);
    expect((await service.createRelease('other', { bytes })).id).not.toBe(
      first.id,
    );
    const changed = await createArtifact(rootDir, '1.2.3', {
      configTemplate: 'name: changed',
    });
    await expect(
      service.createRelease('customer', {
        bytes: changed,
        idempotencyKey: 'ci-1',
      }),
    ).rejects.toMatchObject({ code: 'IDEMPOTENCY_CONFLICT' });
    expect(
      (await service.createRelease('customer', { bytes: changed })).id,
    ).not.toBe(first.id);
    expect(
      await database
        .query()
        .selectFrom('hubReleaseRequests')
        .selectAll()
        .execute(),
    ).toHaveLength(2);
  });

  it('uploads a Release without deploying it and reuses it on retry', async () => {
    await service.createApp({ id: 'customer', name: 'Customer' });
    const bytes = await createArtifact(rootDir, '1.2.3');
    const uploaded = await service.createRelease('customer', { bytes });
    expect(uploaded).toMatchObject({ version: '1.2.3', reused: false });
    expect(uploaded).not.toHaveProperty('operationId');
    expect(await service.createRelease('customer', { bytes })).toMatchObject({
      id: uploaded.id,
      reused: true,
    });
    expect((await service.listDeployments('customer')).total).toBe(0);
    expect(host.targetedOperations).toEqual([]);
    const deployment = await service.deploy('customer', {
      releaseId: uploaded.id,
    });
    expect(
      (await waitForDeployment(service, 'customer', deployment.id)).status,
    ).toBe('succeeded');
    expect((await service.listDeployments('customer')).total).toBe(1);
  });

  it('summarizes Releases with their build target and deployment history', async () => {
    await service.createApp({ id: 'customer', name: 'Customer' });
    await service.createApp({ id: 'other', name: 'Other' });
    const target = {
      ...host.runtime,
      libc: host.runtime.platform === 'linux' ? undefined : 'glibc',
    };
    const first = await service.createRelease('customer', {
      bytes: await createArtifact(rootDir, '1.0.0', {
        nocobase: { buildTarget: target },
      }),
    });
    const firstDeployment = await service.deploy('customer', {
      releaseId: first.id,
    });
    await waitForDeployment(service, 'customer', firstDeployment.id);
    const second = await service.createRelease('customer', {
      bytes: await createArtifact(rootDir, '2.0.0'),
    });
    const secondDeployment = await service.deploy('customer', {
      releaseId: second.id,
    });
    await waitForDeployment(service, 'customer', secondDeployment.id);
    const third = await service.createRelease('customer', {
      bytes: await createArtifact(rootDir, '3.0.0', {
        // Accepted by the upload check, which ignores the ABI, but not a complete target.
        nocobase: {
          buildTarget: {
            platform: host.runtime.platform,
            arch: host.runtime.arch,
            nodeMajor: host.runtime.nodeMajor,
          },
        },
      }),
    });
    host.nextApplyError = new Error('Simulated failure');
    const failed = await service.deploy('customer', { releaseId: third.id });
    expect(
      (await waitForDeployment(service, 'customer', failed.id)).status,
    ).toBe('failed');
    // Another App's successful deployment never marks this App's Releases.
    const foreign = await service.createRelease('other', {
      bytes: await createArtifact(rootDir, '9.0.0'),
    });
    await waitForDeployment(
      service,
      'other',
      (await service.deploy('other', { releaseId: foreign.id })).id,
    );

    const expectedTarget = {
      ...host.runtime,
      libc: host.runtime.platform === 'linux' ? 'glibc' : null,
    };
    const releases = await service.listReleases('customer');
    expect(
      releases.map(({ id, buildTarget, running, everDeployed }) => ({
        id,
        buildTarget,
        running,
        everDeployed,
      })),
    ).toEqual([
      // Its only deployment failed, and its build target is incomplete.
      { id: third.id, buildTarget: null, running: false, everDeployed: false },
      { id: second.id, buildTarget: null, running: true, everDeployed: true },
      // Deployed once, then superseded.
      {
        id: first.id,
        buildTarget: expectedTarget,
        running: false,
        everDeployed: true,
      },
    ]);
    expect(
      (await service.listReleases('customer', { limit: 2 })).map(
        ({ id }) => id,
      ),
    ).toEqual([third.id, second.id]);
    expect(await service.getReleaseSummary('customer', first.id)).toMatchObject(
      {
        id: first.id,
        version: '1.0.0',
        buildTarget: expectedTarget,
        running: false,
        everDeployed: true,
      },
    );
    await expect(
      service.getReleaseSummary('other', first.id),
    ).rejects.toMatchObject({ code: 'RELEASE_NOT_FOUND', status: 404 });
  });

  it.each([0, 101, 1.5, Number.NaN])(
    'rejects the Release list limit %s',
    async (limit) => {
      await service.createApp({ id: 'customer', name: 'Customer' });
      await expect(
        service.listReleases('customer', { limit }),
      ).rejects.toMatchObject({ code: 'INVALID_LIMIT', status: 400 });
    },
  );

  it('accepts an archive whose build target matches the Host or that records none', async () => {
    await service.createApp({ id: 'customer', name: 'Customer' });
    const { libc, ...matching } = host.runtime;
    expect(
      await service.createRelease('customer', {
        bytes: await createArtifact(rootDir, '1.0.0', {
          nocobase: { buildTarget: { ...matching, libc: libc ?? 'glibc' } },
        }),
      }),
    ).toMatchObject({ version: '1.0.0', reused: false });
    expect(
      await service.createRelease('customer', {
        bytes: await createArtifact(rootDir, '2.0.0'),
      }),
    ).toMatchObject({ version: '2.0.0', reused: false });
    expect(await service.listReleases('customer')).toHaveLength(2);
  });

  it('treats a missing C library as glibc and compares it only on Linux', async () => {
    await service.createApp({ id: 'customer', name: 'Customer' });
    host.runtime = {
      platform: 'linux',
      arch: 'x64',
      libc: 'glibc',
      nodeAbi: 137,
      nodeMajor: 24,
    };
    const target = { platform: 'linux', arch: 'x64', nodeMajor: 24 };
    expect(
      await service.createRelease('customer', {
        bytes: await createArtifact(rootDir, '1.0.0', {
          nocobase: { buildTarget: target },
        }),
      }),
    ).toMatchObject({ version: '1.0.0' });
    await expect(
      service.createRelease('customer', {
        bytes: await createArtifact(rootDir, '2.0.0', {
          nocobase: { buildTarget: { ...target, libc: 'musl' } },
        }),
      }),
    ).rejects.toMatchObject({
      code: 'BUILD_TARGET_MISMATCH',
      message: expect.stringContaining(
        'Archive targets linux-x64-musl Node 24; this Hub runs linux-x64 Node 24.',
      ),
    });
    host.runtime = {
      platform: 'darwin',
      arch: 'arm64',
      libc: null,
      nodeAbi: 137,
      nodeMajor: 24,
    };
    // The build records glibc on every platform; macOS has no C library to compare.
    expect(
      await service.createRelease('customer', {
        bytes: await createArtifact(rootDir, '3.0.0', {
          nocobase: {
            buildTarget: {
              platform: 'darwin',
              arch: 'arm64',
              libc: 'glibc',
              nodeAbi: 137,
              nodeMajor: 24,
            },
          },
        }),
      }),
    ).toMatchObject({ version: '3.0.0' });
  });

  it.each([
    [{ arch: 'arm64' }, 'linux-arm64 Node 24'],
    [{ nodeMajor: 22, nodeAbi: 127 }, 'linux-x64 Node 22'],
    [{ platform: 'darwin' }, 'darwin-x64 Node 24'],
  ])(
    'rejects an archive built for another target without storing it (%o)',
    async (difference, described) => {
      await service.createApp({ id: 'customer', name: 'Customer' });
      host.runtime = {
        platform: 'linux',
        arch: 'x64',
        libc: 'glibc',
        nodeAbi: 137,
        nodeMajor: 24,
      };
      const error: unknown = await service
        .createRelease('customer', {
          bytes: await createArtifact(rootDir, '1.0.0', {
            nocobase: {
              buildTarget: {
                platform: 'linux',
                arch: 'x64',
                libc: 'glibc',
                nodeAbi: 137,
                nodeMajor: 24,
                ...difference,
              },
            },
          }),
        })
        .catch((reason: unknown) => reason);
      expect(error).toBeInstanceOf(HubError);
      expect(error).toMatchObject({
        status: 422,
        code: 'BUILD_TARGET_MISMATCH',
        message: expect.stringContaining(
          `Archive targets ${described}; this Hub runs linux-x64 Node 24.`,
        ),
      });
      expect(await service.listReleases('customer')).toHaveLength(0);
      expect(
        await readdir(path.join(rootDir, 'app-artifacts')).catch(() => []),
      ).toEqual([]);
    },
  );

  it('accepts an archive with a build target while the Host status cannot be read', async () => {
    await service.createApp({ id: 'customer', name: 'Customer' });
    vi.spyOn(host, 'getManagementClient').mockRejectedValue(
      new Error('Host unavailable'),
    );
    expect(
      await service.createRelease('customer', {
        bytes: await createArtifact(rootDir, '1.0.0', {
          nocobase: {
            buildTarget: { platform: 'elsewhere', arch: 'x64', nodeMajor: 1 },
          },
        }),
      }),
    ).toMatchObject({ version: '1.0.0' });
  });

  it('exposes the Host build target in App details, or null while the Host is unavailable', async () => {
    await service.createApp({ id: 'customer', name: 'Customer' });
    expect((await service.getApp('customer')).buildTarget).toEqual(
      host.runtime,
    );
    vi.spyOn(host, 'getManagementClient').mockRejectedValue(
      new Error('Host unavailable'),
    );
    const detail = await service.getApp('customer');
    expect(detail.buildTarget).toBeNull();
    expect(detail.runtime.hostAvailable).toBe(false);
  });

  it('deploys an uploaded Release with supplied configuration, retains it by default and supports replacement', async () => {
    await service.createApp({ id: 'customer', name: 'Customer' });
    const first = await service.createRelease('customer', {
      bytes: await createArtifact(rootDir, '1.0.0', {
        configTemplate: 'feature: template\n',
      }),
    });
    const configured = await service.deploy('customer', {
      releaseId: first.id,
      config: { mode: 'file', content: 'feature: supplied\n' },
    });
    await waitForDeployment(service, 'customer', configured.id);
    expect((await service.readConfig('customer')).content).toContain(
      'feature: supplied',
    );
    expect(
      (await service.getRelease('customer', first.id)).configTemplate,
    ).toBe('feature: template\n');
    const second = await service.createRelease('customer', {
      bytes: await createArtifact(rootDir, '2.0.0', {
        configTemplate: 'feature: new-template\n',
      }),
    });
    const retained = await service.deploy('customer', {
      releaseId: second.id,
    });
    await waitForDeployment(service, 'customer', retained.id);
    expect((await service.readConfig('customer')).content).toContain(
      'feature: supplied',
    );
    const third = await service.deploy('customer', {
      releaseId: second.id,
      config: { mode: 'file', content: 'feature: replaced\n' },
    });
    await waitForDeployment(service, 'customer', third.id);
    expect((await service.readConfig('customer')).content).toContain(
      'feature: replaced',
    );
    expect((await service.readConfig('customer')).content).not.toContain(
      'feature: supplied',
    );
  });

  it('rejects invalid deployment YAML without creating a deployment', async () => {
    await service.createApp({ id: 'customer', name: 'Customer' });
    const release = await service.createRelease('customer', {
      bytes: await createArtifact(rootDir, '1.0.0'),
    });
    await expect(
      service.deploy('customer', {
        releaseId: release.id,
        config: { mode: 'file', content: 'invalid: [' },
      }),
    ).rejects.toThrow();
    expect((await service.listDeployments('customer')).total).toBe(0);
  });

  it('rejects invalid deployment requests before querying or writing a deployment', async () => {
    await service.createApp({ id: 'customer', name: 'Customer' });
    await expect(
      service.deploy('customer', { releaseId: '' }),
    ).rejects.toMatchObject({ status: 400, code: 'INVALID_DEPLOYMENT_INPUT' });
    expect((await service.listDeployments('customer')).total).toBe(0);
  });

  it('keeps standalone deployment retries stable and rejects a changed target', async () => {
    await service.createApp({ id: 'customer', name: 'Customer' });
    const release = await service.createRelease('customer', {
      bytes: await createArtifact(rootDir, '1.0.0'),
    });
    const first = await service.deploy('customer', {
      releaseId: release.id,
      idempotencyKey: 'deploy-1',
    });
    const again = await service.deploy('customer', {
      releaseId: release.id,
      idempotencyKey: 'deploy-1',
    });
    expect(again.id).toBe(first.id);
    expect(first.reused).toBe(false);
    expect(again.reused).toBe(true);
    await expect(
      service.deploy('customer', {
        releaseId: 'changed',
        idempotencyKey: 'deploy-1',
      }),
    ).rejects.toMatchObject({ code: 'IDEMPOTENCY_CONFLICT' });
    await waitForDeployment(service, 'customer', first.id);
    expect((await service.listDeployments('customer')).total).toBe(1);
  });

  it('retains deployment logs and isolates them from other apps without starting Host', async () => {
    await service.createApp({ id: 'customer', name: 'Customer' });
    await service.createApp({ id: 'other', name: 'Other' });
    const release = await service.createRelease('customer', {
      bytes: await createArtifact(rootDir, '1.2.3'),
    });
    const queued = await service.deploy('customer', {
      releaseId: release.id,
      config: { mode: 'external' },
    });
    await waitForDeployment(service, 'customer', queued.id);
    const ensure = vi.spyOn(host, 'ensureStarted');
    const page = await service.readLogs(
      'customer',
      { fromStart: true },
      queued.id,
    );
    expect(page.entries.map((entry) => entry.msg)).toEqual([
      'Deployment queued',
      'Deployment started',
      'Deployment succeeded',
    ]);
    expect(ensure).not.toHaveBeenCalled();
    await expect(service.readLogs('other', {}, queued.id)).rejects.toThrow(
      'Deployment not found',
    );
    expect(
      (await service.readLogs('customer', { cursor: page.cursor }, queued.id))
        .entries,
    ).toEqual([]);
  });

  it('paginates deployments with stable ordering and app isolation', async () => {
    await service.createApp({ id: 'customer', name: 'Customer' });
    await service.createApp({ id: 'other', name: 'Other' });
    const release = await service.createRelease('customer', {
      bytes: await createArtifact(rootDir, '1.2.3'),
    });
    const queued = await service.deploy('customer', {
      releaseId: release.id,
      config: { mode: 'external' },
    });
    await waitForDeployment(service, 'customer', queued.id);
    const row = await database
      .connection()
      .query.selectFrom('hubAppDeployments')
      .selectAll()
      .where('id', '=', queued.id)
      .executeTakeFirstOrThrow();
    for (let index = 0; index < 24; index += 1) {
      await database
        .connection()
        .query.insertInto('hubAppDeployments')
        .values({
          ...row,
          id: `history-${String(index).padStart(2, '0')}`,
          createdAt: new Date('2026-01-01'),
        })
        .execute();
    }
    const first = await service.listDeployments('customer');
    const second = await service.listDeployments('customer', { page: 2 });
    expect(first).toMatchObject({ total: 25, page: 1, pageSize: 20 });
    expect(first.items).toHaveLength(20);
    expect(second.items).toHaveLength(5);
    expect(
      new Set([...first.items, ...second.items].map((item) => item.id)).size,
    ).toBe(25);
    expect(second.items.map((item) => item.id)).toEqual([
      'history-04',
      'history-03',
      'history-02',
      'history-01',
      'history-00',
    ]);
    expect(
      (await service.listDeployments('customer', { page: 999 })).page,
    ).toBe(2);
    expect(await service.listDeployments('other')).toEqual({
      items: [],
      total: 0,
      page: 1,
      pageSize: 20,
    });
    for (const options of [
      { page: 0 },
      { page: 1.5 },
      { page: NaN },
      { pageSize: 101 },
      { pageSize: 0 },
    ]) {
      await expect(
        service.listDeployments('customer', options),
      ).rejects.toMatchObject({ code: 'INVALID_PAGINATION' });
    }
  });

  it('creates an App without inventing a deployment record', async () => {
    const detail = await service.createApp({
      id: 'customer',
      name: 'Customer',
    });

    expect(detail).toMatchObject({
      app: { id: 'customer', name: 'Customer' },
      deployment: {
        desiredState: 'stopped',
        activation: 'eager',
        config: { mode: 'file' },
      },
      hasReleases: false,
      hasPendingDeployment: false,
      currentVersion: null,
    });
  });

  it('reads the current ready proxy target without starting the Host', () => {
    const start = vi.spyOn(host, 'ensureStarted');
    expect(service.getHostProxyTarget()).toBeNull();
    host.info = { status: 'ready', targetUrl: 'http://127.0.0.1:13010' };
    expect(service.getHostProxyTarget()?.href).toBe('http://127.0.0.1:13010/');
    host.info = { status: 'starting', targetUrl: 'http://127.0.0.1:13011' };
    expect(service.getHostProxyTarget()).toBeNull();
    host.info.status = 'ready';
    expect(service.getHostProxyTarget()?.href).toBe('http://127.0.0.1:13011/');
    expect(start).not.toHaveBeenCalled();
  });

  it.each(['/hub', 'hub', ' //hub// ', '/hub/admin', '//hub/admin//'])(
    'reserves the normalized Hub mount %j and exposes the configured public entry',
    async (publicBasePath) => {
      const options = createServiceOptions({ publicBasePath });
      service = new DefaultHubService({
        ...options,
        config: { ...options.config, publicHostUrl: '/' },
      });
      await expect(
        service.createApp({ id: 'hub', name: 'Conflict' }),
      ).rejects.toMatchObject({ code: 'INVALID_APP_ID', status: 422 });
      expect(await service.listApps()).toEqual([]);
      const detail = await service.createApp({ id: 'hubble', name: 'Hubble' });
      expect(detail.hostUrl).toBe('/');
    },
  );

  it.each([undefined, '', '/', '///', '   '])(
    'allows App IDs when Hub has no public mount prefix (%j)',
    async (publicBasePath) => {
      service = new DefaultHubService(createServiceOptions({ publicBasePath }));
      const detail = await service.createApp({ id: 'hub', name: 'Hub' });
      expect(detail.app.basePath).toBe('/hub');
    },
  );

  it.each(['__live', '__ready', '__health', '__apps', '__future', ' __live '])(
    'rejects the Host-reserved App ID %j before persisting it',
    async (id) => {
      await expect(
        service.createApp({ id, name: 'Reserved' }),
      ).rejects.toMatchObject({
        code: 'INVALID_APP_ID',
        status: 422,
      });
      expect(await service.listApps()).toEqual([]);
    },
  );

  it.each(['_live', 'customer__app'])(
    'allows underscores outside the Host-reserved prefix (%j)',
    async (id) => {
      const detail = await service.createApp({ id, name: 'Customer' });
      expect(detail.app.id).toBe(id);
    },
  );

  it('restarts only the requested App without creating a deployment', async () => {
    await service.createApp({ id: 'customer', name: 'Customer' });
    await expect(service.restart('customer')).rejects.toMatchObject({
      code: 'APP_NOT_DEPLOYED',
    });
    const release = await service.createRelease('customer', {
      bytes: await createArtifact(rootDir, '1.2.3'),
    });
    const queued = await service.deploy('customer', {
      releaseId: release.id,
      config: { mode: 'external' },
    });
    await waitForDeployment(service, 'customer', queued.id);
    const before = await service.getApp('customer');
    host.targetedOperations = [];
    const after = await service.restart('customer');
    expect(host.targetedOperations).toEqual(['restart:customer']);
    expect(after.app.currentDeploymentId).toBe(before.app.currentDeploymentId);
    expect(after.deployment.activation).toBe(before.deployment.activation);
    expect(after.runtime.state).toBe('running');
    expect((await service.listDeployments('customer')).items).toHaveLength(1);
    await service.stop('customer');
    await expect(service.restart('customer')).rejects.toMatchObject({
      code: 'APP_NOT_RUNNING',
    });
  });

  it('lists lightweight summaries with one shared Host status request', async () => {
    await service.createApp({ id: 'first', name: 'First' });
    await service.createApp({ id: 'second', name: 'Second' });
    const status = vi.spyOn(service, 'hostStatus');
    const releases = vi.spyOn(service, 'listReleases');
    const deployments = vi.spyOn(service, 'listDeployments');
    const apps = await service.listApps();
    expect(apps).toHaveLength(2);
    expect(status).toHaveBeenCalledTimes(1);
    expect(releases).not.toHaveBeenCalled();
    expect(deployments).not.toHaveBeenCalled();
    for (const app of apps) {
      expect(app).toMatchObject({
        currentVersion: null,
        hasReleases: false,
        hasPendingDeployment: false,
      });
      expect(app).not.toHaveProperty('releases');
      expect(app).not.toHaveProperty('deployments');
      expect(app).not.toHaveProperty('deployment');
    }
    status.mockRejectedValue(new Error('Host offline'));
    const offline = await service.listApps();
    expect(status).toHaveBeenCalledTimes(2);
    expect(offline.every((app) => app.runtime.state === 'unknown')).toBe(true);
    vi.restoreAllMocks();
  });

  it('paginates App summaries with search, stable ordering, and status fields', async () => {
    await service.createApp({ id: 'customer-old', name: 'Customer Old' });
    await service.createApp({ id: 'customer-new', name: 'Customer New' });
    await service.createApp({ id: 'internal', name: 'Internal' });
    await database
      .connection()
      .query.updateTable('hubApps')
      .set({ createdAt: new Date('2026-01-01T00:00:00Z') })
      .where('id', '=', 'customer-old')
      .execute();
    await database
      .connection()
      .query.updateTable('hubApps')
      .set({ createdAt: new Date('2026-01-02T00:00:00Z') })
      .where('id', '=', 'customer-new')
      .execute();
    await database
      .connection()
      .query.updateTable('hubApps')
      .set({ createdAt: new Date('2026-01-03T00:00:00Z') })
      .where('id', '=', 'internal')
      .execute();

    const first = await service.listAppsPage({
      search: 'CUSTOMER',
      page: 1,
      pageSize: 1,
    });
    const second = await service.listAppsPage({
      search: 'customer',
      page: 2,
      pageSize: 1,
    });

    expect(first).toMatchObject({
      total: 2,
      page: 1,
      pageSize: 1,
      items: [
        {
          app: { id: 'customer-new', name: 'Customer New' },
          enabled: false,
          startupMode: 'eager',
        },
      ],
    });
    expect(second.items.map(({ app }) => app.id)).toEqual(['customer-old']);
  });

  it('validates App catalog pagination and search limits', async () => {
    for (const options of [
      { page: 0 },
      { page: 1.5 },
      { page: NaN },
      { pageSize: 0 },
      { pageSize: 101 },
      { search: 'x'.repeat(101) },
    ]) {
      await expect(service.listAppsPage(options)).rejects.toMatchObject({
        code: options.search ? 'INVALID_SEARCH' : 'INVALID_PAGINATION',
      });
    }
  });

  it('does not contact Host for an empty catalog', async () => {
    const status = vi.spyOn(service, 'hostStatus');
    expect(await service.listApps()).toEqual([]);
    expect(status).not.toHaveBeenCalled();
    status.mockRestore();
  });

  it('stores a Release config example as the deployment template', async () => {
    await service.createApp({ id: 'customer', name: 'Customer' });
    const release = await service.createRelease('customer', {
      bytes: await createArtifact(rootDir, '1.2.3', {
        configTemplate: '# Customer settings\nfeature:\n  enabled: false\n',
      }),
    });
    const content = '# Edited by the Hub\nfeature:\n  enabled: true\n';

    const queued = await service.deploy('customer', {
      releaseId: release.id,
      config: { mode: 'file', content },
    });
    const deployment = await waitForDeployment(service, 'customer', queued.id);
    const detail = await service.getApp('customer');

    expect(release.configTemplate).toBe(
      '# Customer settings\nfeature:\n  enabled: false\n',
    );
    expect(release.version).toBe('1.2.3');
    expect(deployment).toMatchObject({
      status: 'succeeded',
      phase: 'completed',
      cacheHit: false,
    });
    expect(detail.app.currentDeploymentId).toBe(queued.id);
    expect(detail.currentVersion).toBe('1.2.3');
    expect(detail).not.toHaveProperty('releases');
    expect(detail).not.toHaveProperty('deployments');
    expect(
      (await service.listDeployments('customer')).items[0]?.release,
    ).toMatchObject({ version: '1.2.3', checksum: release.checksum });
    expect(host.lastDeploymentSet?.deployments).toEqual([
      expect.objectContaining({
        appId: 'customer',
        desiredState: 'running',
        config: expect.objectContaining({ provider: 'file' }),
      }),
    ]);
    const configPath = deployment.config.path;
    if (!configPath) throw new Error('Expected deployment config path.');
    expect(parseYaml(await readFile(configPath, 'utf8'))).toMatchObject({
      auth: { secret: expect.any(String) },
      feature: { enabled: true },
    });
    expect(await readFile(configPath, 'utf8')).toContain('# Edited by the Hub');
  });

  it('renames an App without changing its identity, ownership, startup policy, or runtime', async () => {
    await service.createApp({ id: 'customer', name: 'Customer' }, 'alice');
    await service.createApp({ id: 'other', name: 'Shared name' }, 'bob');
    await service.updateSettings('customer', { activation: 'lazy' });
    const before = await service.getApp('customer');
    const operations = [...host.targetedOperations];
    const renamed = await service.updateSettings('customer', {
      name: '  Shared name  ',
      id: 'forged',
      createdBy: 'bob',
    } as never);
    expect(renamed.app).toMatchObject({
      ...before.app,
      name: 'Shared name',
      updatedAt: expect.anything(),
    });
    expect(host.targetedOperations).toEqual(operations);
    expect(
      (
        await service.listAppsPage({
          createdBy: 'alice',
          search: 'Shared name',
        })
      ).items.map(({ app }) => app.id),
    ).toEqual(['customer']);
    expect((await service.getApp('customer')).app.name).toBe('Shared name');
  });

  it.each(['', '   ', 'a'.repeat(256), null, 42])(
    'rejects invalid renamed application names (%j) atomically',
    async (name) => {
      await service.createApp({ id: 'customer', name: 'Customer' });
      const before = await service.getApp('customer');
      await expect(
        service.updateSettings('customer', {
          name,
          activation: 'lazy',
        } as never),
      ).rejects.toMatchObject({ code: 'INVALID_APP_NAME', status: 422 });
      expect((await service.getApp('customer')).app).toEqual(before.app);
    },
  );

  it('updates the recovery startup policy without a runtime operation', async () => {
    await service.createApp({ id: 'customer', name: 'Customer' });
    const release = await service.createRelease('customer', {
      bytes: await createArtifact(rootDir, '1.2.3'),
    });
    await service.deploy('customer', { releaseId: release.id });
    await waitForLatestDeployment(service, 'customer');
    const operations = [...host.targetedOperations];
    await service.updateSettings('customer', { activation: 'lazy' });
    expect(
      (await service.createDeploymentSet()).deployments[0]?.activation,
    ).toBe('lazy');
    await service.updateSettings('customer', { activation: 'eager' });
    expect(
      (await service.createDeploymentSet()).deployments[0]?.activation,
    ).toBe('eager');
    expect(host.targetedOperations).toEqual(operations);
  });

  it('persists application startup settings and starts a stopped app', async () => {
    await service.createApp({ id: 'customer', name: 'Customer' });
    await service.updateSettings('customer', { activation: 'lazy' });
    const release = await service.createRelease('customer', {
      bytes: await createArtifact(rootDir, '1.2.3'),
    });
    await service.deploy('customer', { releaseId: release.id });
    await waitForLatestDeployment(service, 'customer');

    expect(host.lastDeploymentSet?.deployments[0]).toMatchObject({
      desiredState: 'running',
      activation: 'lazy',
    });
    await service.stop('customer');

    const detail = await service.start('customer');

    expect(detail.deployment).toMatchObject({
      desiredState: 'running',
      observedState: 'running',
      activation: 'lazy',
    });
    expect(host.lastDeploymentSet?.deployments[0]).toMatchObject({
      desiredState: 'running',
      activation: 'lazy',
    });
    expect(host.targetedOperations).toEqual([
      'deploy:customer',
      'stop:customer',
      'start:customer',
    ]);
  });

  it('removes only the selected application and its persisted resources', async () => {
    const removeAppKeys = vi.fn().mockResolvedValue(undefined);
    service = new DefaultHubService(
      createServiceOptions({ apiKeys: { removeAppKeys } }),
    );
    await service.createApp({ id: 'customer', name: 'Customer' });
    const release = await service.createRelease('customer', {
      bytes: await createArtifact(rootDir, '1.2.3'),
    });
    await service.deploy('customer', { releaseId: release.id });

    await service.remove('customer');

    await expect(service.getApp('customer')).rejects.toMatchObject<
      Partial<HubError>
    >({ code: 'APP_NOT_FOUND' });
    expect(host.targetedOperations.at(-1)).toBe('remove:customer');
    expect(removeAppKeys).toHaveBeenCalledExactlyOnceWith('customer');
  });

  it('records an asynchronous failure without replacing the active deployment', async () => {
    await service.createApp({ id: 'customer', name: 'Customer' });
    const release = await service.createRelease('customer', {
      bytes: await createArtifact(rootDir, '1.2.3'),
    });
    host.nextApplyError = new Error('activation failed');

    const queued = await service.deploy('customer', { releaseId: release.id });
    const failed = await waitForDeployment(service, 'customer', queued.id);
    expect(failed).toMatchObject({
      status: 'failed',
      error: 'activation failed',
    });
    await expect(service.getApp('customer')).resolves.toMatchObject({
      app: { currentDeploymentId: null },
    });
  });

  it('keeps a surviving runtime running while recording a failed deployment', async () => {
    await service.createApp({ id: 'customer', name: 'Customer' });
    const release = await service.createRelease('customer', {
      bytes: await createArtifact(rootDir, '1.2.3'),
    });
    const initial = await service.deploy('customer', { releaseId: release.id });
    await waitForDeployment(service, 'customer', initial.id);
    const status = createStatus(host.lastDeploymentSet!);
    status.deployments[0]!.observedState = 'failed';
    status.deployments[0]!.error = 'New artifact unavailable';
    status.deployments[0]!.app = {
      state: 'active',
      desiredVersion: '1.2.3',
      lastError: null,
    } as NonNullable<HostStatus['deployments'][number]['app']>;
    vi.spyOn(host, 'applyDeployment').mockResolvedValue(status);
    const management = await host.getManagementClient();
    vi.spyOn(host, 'getManagementClient').mockResolvedValue({
      ...management,
      getStatus: async () => status,
    });
    const queued = await service.deploy('customer', { releaseId: release.id });
    expect(
      await waitForDeployment(service, 'customer', queued.id),
    ).toMatchObject({ status: 'failed', error: 'New artifact unavailable' });
    expect(await service.getApp('customer')).toMatchObject({
      app: { currentDeploymentId: initial.id },
      runtime: { state: 'running', error: null },
    });
    expect((await service.listApps())[0]?.runtime).toMatchObject({
      state: 'running',
      error: null,
    });
    status.deployments[0]!.app = null;
    expect((await service.getApp('customer')).runtime).toMatchObject({
      state: 'failed',
      error: 'New artifact unavailable',
    });
  });

  it('returns valid database dates rather than the Unix epoch', async () => {
    const before = Date.now() - 1_000;
    const detail = await service.createApp({
      id: 'customer',
      name: 'Customer',
    });

    expect(detail.app.createdAt.valueOf()).toBeGreaterThan(before);
    expect(detail.app.updatedAt.valueOf()).toBeGreaterThan(before);
  });

  it.each([
    {
      path: 'dist/server/embedded.js',
      type: 'SymbolicLink' as const,
      code: 'INVALID_ARTIFACT',
    },
    {
      path: 'dist/server/embedded.js',
      type: 'Link' as const,
      code: 'INVALID_ARTIFACT',
    },
    {
      path: 'config.example.yml',
      type: 'File' as const,
      size: 16 * 1024 * 1024 + 1,
      code: 'INVALID_ARTIFACT',
    },
    { path: '../outside.js', type: 'File' as const, code: 'UNSAFE_ARTIFACT' },
    { path: '/outside.js', type: 'File' as const, code: 'UNSAFE_ARTIFACT' },
  ])(
    'rejects malformed $type entry $path without breaking subsequent uploads',
    async (invalid) => {
      await service.createApp({ id: 'customer', name: 'Customer' });
      const temporaryRoot = path.join(rootDir, 'upload-temporary');
      await mkdir(temporaryRoot);
      const temporaryDirectory = vi
        .spyOn(os, 'tmpdir')
        .mockReturnValue(temporaryRoot);
      try {
        const entry = (data: {
          path: string;
          type: 'File' | 'SymbolicLink' | 'Link';
          size?: number;
        }) => {
          const size = data.size ?? 0;
          const header = new Header({
            ...data,
            size,
            mode: 0o600,
            linkpath: data.type === 'File' ? '' : 'package.json',
          });
          const block = Buffer.alloc(512);
          header.encode(block);
          return Buffer.concat([
            block,
            Buffer.alloc(Math.ceil(size / 512) * 512),
          ]);
        };
        const bytes = gzipSync(
          Buffer.concat([
            entry({ path: 'package.json', type: 'File' }),
            entry(invalid),
            entry({ path: 'config.example.yml', type: 'File' }),
            Buffer.alloc(1024),
          ]),
        );
        await expect(
          service.createRelease('customer', { bytes }),
        ).rejects.toMatchObject({ code: invalid.code, status: 422 });
        expect(await service.listReleases('customer')).toEqual([]);
        expect((await service.listDeployments('customer')).total).toBe(0);
        expect(host.targetedOperations).toEqual([]);
        expect(await readdir(temporaryRoot)).toEqual([]);

        const release = await service.createRelease('customer', {
          bytes: await createArtifact(rootDir, '1.2.3'),
        });
        expect(release.version).toBe('1.2.3');
        expect(await service.listReleases('customer')).toHaveLength(1);
        expect(await readdir(temporaryRoot)).toEqual([]);
      } finally {
        temporaryDirectory.mockRestore();
      }
    },
  );

  it('accepts a Release without a config example', async () => {
    await service.createApp({ id: 'customer', name: 'Customer' });
    const release = await service.createRelease('customer', {
      bytes: await createArtifact(rootDir, '1.2.3'),
    });

    expect(release.configTemplate).toBeNull();
  });

  it('accepts a build artifact with its manifest under dist', async () => {
    await service.createApp({ id: 'customer', name: 'Customer' });
    const release = await service.createRelease('customer', {
      bytes: await createArtifact(rootDir, '1.2.3', {
        manifestPath: 'dist',
      }),
    });

    expect(release).toMatchObject({
      version: '1.2.3',
      manifest: {
        name: '@example/customer',
        version: '1.2.3',
      },
    });
  });

  it.each(['config.example.yml', 'config.example.yaml'])(
    'reads %s as the Release config template',
    async (configTemplateName) => {
      await service.createApp({ id: 'customer', name: 'Customer' });
      const release = await service.createRelease('customer', {
        bytes: await createArtifact(rootDir, '1.2.3', {
          configTemplate: '{"feature":{"enabled":true}}\n',
          configTemplateName,
        }),
      });

      expect(release.configTemplate).toBe('{"feature":{"enabled":true}}\n');
    },
  );

  it('does not treat a real config.yml in the Release as a template', async () => {
    await service.createApp({ id: 'customer', name: 'Customer' });
    const release = await service.createRelease('customer', {
      bytes: await createArtifact(rootDir, '1.2.3', {
        configTemplate: 'auth:\n  secret: must-not-be-imported\n',
        configTemplateName: 'config.yml',
      }),
    });

    expect(release.configTemplate).toBeNull();
  });

  it('does not treat config.example.json as a supported template', async () => {
    await service.createApp({ id: 'customer', name: 'Customer' });
    const release = await service.createRelease('customer', {
      bytes: await createArtifact(rootDir, '1.2.3', {
        configTemplate: '{"feature":true}\n',
        configTemplateName: 'config.example.json',
      }),
    });

    expect(release.configTemplate).toBeNull();
  });

  it('rejects a Release with multiple config examples', async () => {
    await service.createApp({ id: 'customer', name: 'Customer' });

    await expect(
      service.createRelease('customer', {
        bytes: await createArtifact(rootDir, '1.2.3', {
          configTemplates: {
            'config.example.yml': 'feature: yml\n',
            'config.example.yaml': 'feature: yaml\n',
          },
        }),
      }),
    ).rejects.toMatchObject<Partial<HubError>>({
      code: 'INVALID_ARTIFACT',
      status: 422,
    });
  });

  it('rejects an invalid version in the Artifact package manifest', async () => {
    await service.createApp({ id: 'customer', name: 'Customer' });

    await expect(
      service.createRelease('customer', {
        bytes: await createArtifact(rootDir, 'invalid version'),
      }),
    ).rejects.toMatchObject<Partial<HubError>>({
      code: 'INVALID_ARTIFACT_VERSION',
      status: 422,
    });
  });

  it.each([
    ['a relocatable build', { relocatable: true }],
    ['a build for the application path', { basePath: '/customer/' }],
    ['a build too old to record where it belongs', {}],
  ])('accepts %s', async (_, nocobase) => {
    await service.createApp({ id: 'customer', name: 'Customer' });

    await expect(
      service.createRelease('customer', {
        bytes: await createArtifact(rootDir, '1.2.3', { nocobase }),
      }),
    ).resolves.toMatchObject({ version: '1.2.3' });
  });

  it('rejects a build compiled for another path than the Hub mounts it at', async () => {
    await service.createApp({ id: 'customer', name: 'Customer' });

    await expect(
      service.createRelease('customer', {
        bytes: await createArtifact(rootDir, '1.2.3', {
          nocobase: { basePath: '/main' },
        }),
      }),
    ).rejects.toMatchObject<Partial<HubError>>({
      code: 'BASE_PATH_MISMATCH',
      status: 422,
    });
  });

  it('initializes an absent config file from the Release template', async () => {
    await service.createApp({ id: 'customer', name: 'Customer' });
    const release = await service.createRelease('customer', {
      bytes: await createArtifact(rootDir, '1.2.3', {
        configTemplate:
          '# Keep this comment while Hub initializes the missing secret.\n' +
          'auth:\n' +
          '  emailAndPassword:\n' +
          '    enabled: true\n' +
          'feature:\n' +
          '  enabled: true\n',
      }),
    });

    const queued = await service.deploy('customer', { releaseId: release.id });
    const deployment = await waitForDeployment(service, 'customer', queued.id);
    const content = await readFile(deployment.config.path!, 'utf8');
    const parsed = parseYaml(content) as {
      readonly auth?: {
        readonly emailAndPassword?: unknown;
        readonly secret?: unknown;
      };
      readonly feature?: { readonly enabled?: unknown };
    };

    expect(parsed).toMatchObject({
      auth: {
        emailAndPassword: { enabled: true },
        secret: expect.any(String),
      },
      feature: { enabled: true },
    });
    expect(parsed.auth?.secret).toHaveLength(43);
    expect(content).toContain(
      '# Keep this comment while Hub initializes the missing secret.',
    );
    await expect(stat(deployment.config.path!)).resolves.toMatchObject({
      mode: expect.any(Number),
    });
    expect((await stat(deployment.config.path!)).mode & 0o777).toBe(0o600);
    expect(
      (await stat(path.dirname(deployment.config.path!))).mode & 0o777,
    ).toBe(0o700);
    expect(host.lastDeploymentSet?.deployments[0]?.config).toEqual({
      provider: 'file',
      revision: deployment.id,
      content,
    });
  });

  it.each([
    [
      'example secrets',
      'auth:\n  secret: replace-with-a-unique-secret\nsession:\n  secret: replace-with-a-unique-secret\n',
    ],
    ['omitted secret sections', 'feature: enabled\n'],
    [
      'omitted session section',
      'auth:\n  secret: replace-with-a-unique-secret\n',
    ],
    ['blank secrets', 'auth:\n  secret: ""\nsession:\n  secret: " "\n'],
  ])(
    'fills %s and preserves secrets across deployments and publication',
    async (_name, config) => {
      const template = `# Preserve this comment\n${config}`;
      await service.createApp({ id: 'customer', name: 'Customer' });
      const release = await service.createRelease('customer', {
        bytes: await createArtifact(rootDir, '1.2.3', {
          configTemplate: template,
        }),
      });
      const first = await service.deploy('customer', { releaseId: release.id });
      await waitForDeployment(service, 'customer', first.id);
      const initial = await service.readConfig('customer');
      const secrets = parseYaml(initial.content!) as {
        auth: { secret: string };
        session: { secret: string };
      };
      expect(secrets.auth.secret).toHaveLength(43);
      expect(secrets.session.secret).toHaveLength(43);
      expect(secrets.auth.secret).not.toBe(secrets.session.secret);
      expect(initial.content).toContain('# Preserve this comment');
      const second = await service.deploy('customer', {
        releaseId: release.id,
        config: { mode: 'file', content: template },
      });
      await waitForDeployment(service, 'customer', second.id);
      expect(
        parseYaml((await service.readConfig('customer')).content!),
      ).toEqual(secrets);
      const updated = await service.updateConfig('customer', {
        content: template,
      });
      expect(parseYaml(updated.content!)).toEqual(secrets);
      expect(
        await service.updateConfig('customer', { content: updated.content! }),
      ).toEqual(updated);
      const custom =
        'auth:\n  secret: supplied-auth-secret-at-least-32-characters\nsession:\n  secret: supplied-session-secret-at-least-32-characters\n';
      expect(
        (await service.updateConfig('customer', { content: custom })).content,
      ).toBe(custom);
    },
  );

  it('reuses an existing auth secret and keeps a user-provided secret', async () => {
    await service.createApp({ id: 'customer', name: 'Customer' });
    const firstRelease = await service.createRelease('customer', {
      bytes: await createArtifact(rootDir, '1.0.0', {
        configTemplate: 'feature: first\n',
      }),
    });
    const first = await service.deploy('customer', {
      releaseId: firstRelease.id,
    });
    const firstCompleted = await waitForDeployment(
      service,
      'customer',
      first.id,
    );
    const firstConfig = parseYaml(
      await readFile(firstCompleted.config.path!, 'utf8'),
    ) as { readonly auth: { readonly secret: string } };

    const secondRelease = await service.createRelease('customer', {
      bytes: await createArtifact(rootDir, '2.0.0', {
        configTemplate: 'feature: second\n',
      }),
    });
    const second = await service.deploy('customer', {
      releaseId: secondRelease.id,
    });
    const secondCompleted = await waitForDeployment(
      service,
      'customer',
      second.id,
    );
    const secondConfig = parseYaml(
      await readFile(secondCompleted.config.path!, 'utf8'),
    ) as { readonly auth: { readonly secret: string } };
    expect(secondConfig.auth.secret).toBe(firstConfig.auth.secret);

    const customSecret = 'custom-auth-secret-at-least-32-characters';
    const thirdRelease = await service.createRelease('customer', {
      bytes: await createArtifact(rootDir, '3.0.0'),
    });
    const third = await service.deploy('customer', {
      releaseId: thirdRelease.id,
      config: {
        mode: 'file',
        content: `auth:\n  secret: ${customSecret}\nfeature: custom\n`,
      },
    });
    const thirdCompleted = await waitForDeployment(
      service,
      'customer',
      third.id,
    );
    const thirdConfig = parseYaml(
      await readFile(thirdCompleted.config.path!, 'utf8'),
    ) as { readonly auth: { readonly secret: string } };
    expect(thirdConfig.auth.secret).toBe(customSecret);
  });

  it('does not generate a file secret for external configuration', async () => {
    await service.createApp({ id: 'customer', name: 'Customer' });
    const release = await service.createRelease('customer', {
      bytes: await createArtifact(rootDir, '1.2.3', {
        configTemplate: 'auth:\n  emailAndPassword:\n    enabled: true\n',
      }),
    });

    const queued = await service.deploy('customer', {
      releaseId: release.id,
      config: { mode: 'external' },
    });
    await waitForDeployment(service, 'customer', queued.id);

    expect(await service.readConfig('customer')).toEqual({
      mode: 'external',
      content: null,
    });
    expect(host.lastDeploymentSet?.deployments[0]?.config).toBeUndefined();
  });

  it('does not overwrite saved config with a newer Release template', async () => {
    await service.createApp({ id: 'customer', name: 'Customer' });
    const release = await service.createRelease('customer', {
      bytes: await createArtifact(rootDir, '1.2.3', {
        configTemplate: 'feature:\n  enabled: true\n',
      }),
    });

    const queued = await service.deploy('customer', {
      releaseId: release.id,
      config: { mode: 'file', content: 'feature:\n  enabled: false\n' },
    });
    const deployment = await waitForDeployment(service, 'customer', queued.id);

    const content = parseYaml(
      await readFile(deployment.config.path!, 'utf8'),
    ) as { readonly auth?: unknown; readonly feature?: unknown };
    expect(content).toMatchObject({
      auth: { secret: expect.any(String) },
      feature: { enabled: false },
    });
  });

  it('does not pass config to Host in external mode', async () => {
    await service.createApp({ id: 'customer', name: 'Customer' });
    const release = await service.createRelease('customer', {
      bytes: await createArtifact(rootDir, '1.2.3'),
    });

    const queued = await service.deploy('customer', {
      releaseId: release.id,
      config: { mode: 'external' },
    });
    await waitForDeployment(service, 'customer', queued.id);

    expect(await service.readConfig('customer')).toEqual({
      mode: 'external',
      content: null,
    });
    expect(host.lastDeploymentSet?.deployments[0]?.config).toBeUndefined();
  });

  it('updates the active file configuration without creating a deployment', async () => {
    await service.createApp({ id: 'customer', name: 'Customer' });
    const release = await service.createRelease('customer', {
      bytes: await createArtifact(rootDir, '1.2.3'),
    });
    const queued = await service.deploy('customer', {
      releaseId: release.id,
      config: { mode: 'file', content: 'feature: false\n' },
    });
    const deployment = await waitForDeployment(service, 'customer', queued.id);
    const deploymentsBefore = await service.listDeployments('customer');

    const updated = await service.updateConfig('customer', {
      content: 'feature: true\n',
    });
    expect(updated.mode).toBe('file');
    expect(parseYaml(updated.content!)).toMatchObject({
      auth: { secret: expect.any(String) },
      feature: true,
    });
    expect(
      parseYaml(host.publishedConfigContents.get('customer') ?? ''),
    ).toMatchObject({
      auth: { secret: expect.any(String) },
      feature: true,
    });

    expect(
      parseYaml(await readFile(deployment.config.path!, 'utf8')),
    ).toMatchObject({
      auth: { secret: expect.any(String) },
      feature: true,
    });
    expect((await service.listDeployments('customer')).total).toBe(
      deploymentsBefore.total,
    );
    expect(host.targetedOperations).toEqual(['deploy:customer']);
    expect(host.reloadAppConfig).toHaveBeenCalledWith('customer');
    host.reloadAppConfig.mockRejectedValueOnce(
      new Error('Invalid configuration'),
    );
    await expect(
      service.updateConfig('customer', { content: 'feature: false\n' }),
    ).rejects.toMatchObject({ code: 'CONFIG_RELOAD_FAILED' });
    expect(
      parseYaml(await readFile(deployment.config.path!, 'utf8')),
    ).toMatchObject({
      auth: { secret: expect.any(String) },
      feature: false,
    });
  });

  // `readConfig` answers an absent file with empty content, so the editor opens on an App whose `config.yml` is
  // gone and the save that follows has to write one back rather than fail on reading what is not there.
  it('writes the active file configuration back when it is missing from disk', async () => {
    await service.createApp({ id: 'customer', name: 'Customer' });
    const release = await service.createRelease('customer', {
      bytes: await createArtifact(rootDir, '1.2.3'),
    });
    const queued = await service.deploy('customer', {
      releaseId: release.id,
      config: { mode: 'file', content: 'feature: false\n' },
    });
    const deployment = await waitForDeployment(service, 'customer', queued.id);
    await rm(deployment.config.path!, { force: true });

    expect(await service.readConfig('customer')).toEqual({
      mode: 'file',
      content: '',
    });

    const updated = await service.updateConfig('customer', {
      content: 'feature: true\n',
    });

    expect(parseYaml(updated.content!)).toMatchObject({
      auth: { secret: expect.any(String) },
      feature: true,
    });
    expect(
      parseYaml(await readFile(deployment.config.path!, 'utf8')),
    ).toMatchObject({ feature: true });
  });

  it('rejects invalid updates to the active file configuration', async () => {
    await service.createApp({ id: 'customer', name: 'Customer' });
    const release = await service.createRelease('customer', {
      bytes: await createArtifact(rootDir, '1.2.3'),
    });
    const queued = await service.deploy('customer', {
      releaseId: release.id,
      config: { mode: 'file', content: 'feature: false\n' },
    });
    await waitForDeployment(service, 'customer', queued.id);

    await expect(
      service.updateConfig('customer', { content: 'feature: [' }),
    ).rejects.toMatchObject<Partial<HubError>>({
      code: 'INVALID_CONFIG_FILE',
      status: 422,
    });
  });

  it('does not allow Hub to edit external configuration', async () => {
    await service.createApp({ id: 'customer', name: 'Customer' });
    const release = await service.createRelease('customer', {
      bytes: await createArtifact(rootDir, '1.2.3'),
    });
    const queued = await service.deploy('customer', {
      releaseId: release.id,
      config: { mode: 'external' },
    });
    await waitForDeployment(service, 'customer', queued.id);

    await expect(
      service.updateConfig('customer', { content: 'feature: true\n' }),
    ).rejects.toMatchObject<Partial<HubError>>({
      code: 'CONFIG_NOT_EDITABLE',
      status: 409,
    });
  });

  it('refreshes observed state from the managed Host', async () => {
    await service.createApp({ id: 'customer', name: 'Customer' });
    const release = await service.createRelease('customer', {
      bytes: await createArtifact(rootDir, '1.2.3'),
    });
    await service.deploy('customer', { releaseId: release.id });
    await waitForLatestDeployment(service, 'customer');
    const current = host.lastDeploymentSet?.deployments[0];
    if (!current) throw new Error('Expected a deployment spec.');
    host.lastDeploymentSet = {
      revision: 42,
      deployments: [{ ...current, desiredState: 'stopped' }],
    };

    const detail = await service.refresh('customer');

    expect(detail.runtime).toMatchObject({
      state: 'stopped',
      hostRevision: 42,
    });
  });

  it('rejects invalid YAML and non-object file configuration', async () => {
    await service.createApp({ id: 'customer', name: 'Customer' });
    const release = await service.createRelease('customer', {
      bytes: await createArtifact(rootDir, '1.2.3'),
    });

    await expect(
      service.deploy('customer', {
        releaseId: release.id,
        config: { mode: 'file', content: 'feature: [' },
      }),
    ).rejects.toMatchObject<Partial<HubError>>({
      code: 'INVALID_CONFIG_FILE',
      status: 422,
    });
    await expect(
      service.deploy('customer', {
        releaseId: release.id,
        config: { mode: 'file', content: '- one\n- two\n' },
      }),
    ).rejects.toMatchObject<Partial<HubError>>({
      code: 'INVALID_CONFIG_FILE',
      status: 422,
    });
  });

  it('allows multiple builds with the same version', async () => {
    await service.createApp({ id: 'customer', name: 'Customer' });
    const first = await service.createRelease('customer', {
      bytes: await createArtifact(rootDir, '1.2.3'),
    });
    const second = await service.createRelease('customer', {
      bytes: await createArtifact(rootDir, '1.2.3', {
        configTemplate: 'feature: true\n',
      }),
    });

    expect(second.version).toBe(first.version);
    expect(second.id).not.toBe(first.id);
    expect(second.checksum).not.toBe(first.checksum);
  });

  it('keeps the active config when a newer Release has a config example', async () => {
    await service.createApp({ id: 'customer', name: 'Customer' });
    const firstRelease = await service.createRelease('customer', {
      bytes: await createArtifact(rootDir, '1.0.0', {
        configTemplate: 'feature: old\n',
      }),
    });
    const first = await service.deploy('customer', {
      releaseId: firstRelease.id,
    });
    const firstCompleted = await waitForDeployment(
      service,
      'customer',
      first.id,
    );
    const firstContent = parseYaml(
      await readFile(firstCompleted.config.path!, 'utf8'),
    ) as { readonly auth: { readonly secret: string } };

    const secondRelease = await service.createRelease('customer', {
      bytes: await createArtifact(rootDir, '2.0.0', {
        configTemplate: 'feature: new\n',
      }),
    });
    const second = await service.deploy('customer', {
      releaseId: secondRelease.id,
    });
    const completed = await waitForDeployment(service, 'customer', second.id);

    expect(
      parseYaml(await readFile(completed.config.path!, 'utf8')),
    ).toMatchObject({
      auth: { secret: firstContent.auth.secret },
      feature: 'old',
    });
  });

  it('keeps the active configuration when a Release has no config example', async () => {
    await service.createApp({ id: 'customer', name: 'Customer' });
    const firstRelease = await service.createRelease('customer', {
      bytes: await createArtifact(rootDir, '1.0.0', {
        configTemplate: 'feature: current\n',
      }),
    });
    const first = await service.deploy('customer', {
      releaseId: firstRelease.id,
    });
    const firstCompleted = await waitForDeployment(
      service,
      'customer',
      first.id,
    );
    const firstContent = parseYaml(
      await readFile(firstCompleted.config.path!, 'utf8'),
    ) as { readonly auth: { readonly secret: string } };

    const secondRelease = await service.createRelease('customer', {
      bytes: await createArtifact(rootDir, '2.0.0'),
    });
    const second = await service.deploy('customer', {
      releaseId: secondRelease.id,
    });
    const completed = await waitForDeployment(service, 'customer', second.id);

    expect(
      parseYaml(await readFile(completed.config.path!, 'utf8')),
    ).toMatchObject({
      auth: { secret: firstContent.auth.secret },
      feature: 'current',
    });
  });

  it('rolls back by creating a new deployment history record', async () => {
    await service.createApp({ id: 'customer', name: 'Customer' });
    const firstRelease = await service.createRelease('customer', {
      bytes: await createArtifact(rootDir, '1.0.0'),
    });
    const first = await service.deploy('customer', {
      releaseId: firstRelease.id,
    });
    await waitForDeployment(service, 'customer', first.id);
    const secondRelease = await service.createRelease('customer', {
      bytes: await createArtifact(rootDir, '2.0.0'),
    });
    const second = await service.deploy('customer', {
      releaseId: secondRelease.id,
    });
    await waitForDeployment(service, 'customer', second.id);

    const rollback = await service.rollback('customer', {
      deploymentId: first.id,
    });
    const completed = await waitForDeployment(service, 'customer', rollback.id);

    expect(completed).toMatchObject({
      kind: 'rollback',
      releaseId: firstRelease.id,
      rollbackTargetDeploymentId: first.id,
      previousDeploymentId: second.id,
      status: 'succeeded',
    });
    await expect(service.getApp('customer')).resolves.toMatchObject({
      app: { currentDeploymentId: rollback.id },
    });
  });

  it('allows rollback configuration to be reviewed and changed', async () => {
    await service.createApp({ id: 'customer', name: 'Customer' });
    const release = await service.createRelease('customer', {
      bytes: await createArtifact(rootDir, '1.0.0'),
    });
    const first = await service.deploy('customer', {
      releaseId: release.id,
      config: { mode: 'file', content: 'feature: false\n' },
    });
    await waitForDeployment(service, 'customer', first.id);

    const currentConfig = await service.readConfig('customer');
    expect(currentConfig.mode).toBe('file');
    expect(parseYaml(currentConfig.content!)).toMatchObject({
      auth: { secret: expect.any(String) },
      feature: false,
    });

    const rollback = await service.rollback('customer', {
      deploymentId: first.id,
      config: { mode: 'file', content: 'feature: true\n' },
    });
    const completed = await waitForDeployment(service, 'customer', rollback.id);
    expect(completed.config.path).not.toBe(first.config.path);
    expect(path.basename(completed.config.path!)).toBe(`${completed.id}.yml`);
    await vi.waitFor(async () => {
      await expect(stat(first.config.path!)).rejects.toMatchObject({
        code: 'ENOENT',
      });
    });

    expect(completed.config.mode).toBe(first.config.mode);
    expect(
      parseYaml(await readFile(completed.config.path!, 'utf8')),
    ).toMatchObject({
      auth: { secret: expect.any(String) },
      feature: true,
    });
  });

  it('isolates pending deployment configuration and cleans rejected candidates', async () => {
    await service.createApp({ id: 'customer', name: 'Customer' });
    const release = await service.createRelease('customer', {
      bytes: await createArtifact(rootDir, '1.0.0'),
    });
    const initial = await service.deploy('customer', {
      releaseId: release.id,
      config: { mode: 'file', content: 'value: old\n' },
    });
    await waitForDeployment(service, 'customer', initial.id);
    const gate = Promise.withResolvers<void>();
    vi.spyOn(host, 'applyDeployment').mockImplementationOnce(async (spec) => {
      await gate.promise;
      const status = createStatus({ revision: 2, deployments: [spec] });
      status.deployments[0]!.observedState = 'failed';
      status.deployments[0]!.error = 'Activation failed';
      return status;
    });
    const candidate = await service.deploy('customer', {
      releaseId: release.id,
      config: { mode: 'file', content: 'value: new\n' },
    });
    try {
      expect(candidate.config.path).not.toBe(initial.config.path);
      expect(
        parseYaml(await readFile(initial.config.path!, 'utf8')),
      ).toMatchObject({
        auth: { secret: expect.any(String) },
        value: 'old',
      });
      expect(
        parseYaml(await readFile(candidate.config.path!, 'utf8')),
      ).toMatchObject({
        auth: { secret: expect.any(String) },
        value: 'new',
      });
    } finally {
      gate.resolve();
    }
    expect(
      (await waitForDeployment(service, 'customer', candidate.id)).status,
    ).toBe('failed');
    await vi.waitFor(async () => {
      await expect(stat(candidate.config.path!)).rejects.toMatchObject({
        code: 'ENOENT',
      });
    });
    expect(
      parseYaml(await readFile(initial.config.path!, 'utf8')),
    ).toMatchObject({
      auth: { secret: expect.any(String) },
      value: 'old',
    });
  });

  it('inherits the target deployment config mode during rollback', async () => {
    await service.createApp({ id: 'customer', name: 'Customer' });
    const release = await service.createRelease('customer', {
      bytes: await createArtifact(rootDir, '1.0.0'),
    });
    const target = await service.deploy('customer', {
      releaseId: release.id,
      config: { mode: 'external' },
    });
    await waitForDeployment(service, 'customer', target.id);

    const rollback = await service.rollback('customer', {
      deploymentId: target.id,
    });
    const completed = await waitForDeployment(service, 'customer', rollback.id);

    expect(completed.config).toEqual({ mode: 'external' });
    expect(host.lastDeploymentSet?.deployments[0]?.config).toBeUndefined();
  });

  it('rejects changing the target deployment config mode during rollback', async () => {
    await service.createApp({ id: 'customer', name: 'Customer' });
    const release = await service.createRelease('customer', {
      bytes: await createArtifact(rootDir, '1.0.0'),
    });
    const target = await service.deploy('customer', {
      releaseId: release.id,
      config: { mode: 'external' },
    });
    await waitForDeployment(service, 'customer', target.id);

    await expect(
      service.rollback('customer', {
        deploymentId: target.id,
        config: { mode: 'file', content: 'feature: true\n' },
      }),
    ).rejects.toMatchObject<Partial<HubError>>({
      code: 'ROLLBACK_CONFIG_MODE_MISMATCH',
      status: 409,
    });
  });

  it('does not wait for eager Apps to finish during Host startup', async () => {
    await service.createApp({ id: 'customer', name: 'Customer' });
    const release = await service.createRelease('customer', {
      bytes: await createArtifact(rootDir, '1.2.3'),
    });
    const deployed = await service.deploy('customer', {
      releaseId: release.id,
    });
    await waitForDeployment(service, 'customer', deployed.id);
    let releaseStartup: (() => void) | undefined;
    host.nextDeploymentSetGate = new Promise<void>((resolve) => {
      releaseStartup = resolve;
    });

    await expect(service.restoreDesiredState()).resolves.toBeUndefined();
    await vi.waitFor(() => expect(host.deploymentSetStarted).toBe(true));
    expect(host.deploymentSetCompleted).toBe(false);

    releaseStartup?.();
    await host.nextDeploymentSetGate;
  });

  it('waits for startup restoration before reporting Host status', async () => {
    await service.createApp({ id: 'customer', name: 'Customer' });
    const release = await service.createRelease('customer', {
      bytes: await createArtifact(rootDir, '1.2.3'),
    });
    const deployed = await service.deploy('customer', {
      releaseId: release.id,
    });
    await waitForDeployment(service, 'customer', deployed.id);
    let releaseStartup: (() => void) | undefined;
    host.nextDeploymentSetGate = new Promise<void>((resolve) => {
      releaseStartup = resolve;
    });

    await service.restoreDesiredState();
    await vi.waitFor(() => expect(host.deploymentSetStarted).toBe(true));

    let resolved = false;
    const status = service.hostStatus().then((value) => {
      resolved = true;
      return value;
    });
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    expect(resolved).toBe(false);
    expect(host.deploymentSetCompleted).toBe(false);

    releaseStartup?.();
    await expect(status).resolves.toMatchObject({
      deployments: [{ appId: 'customer', observedState: 'running' }],
    });
  });

  it('stops waiting for a stuck startup restoration and reports unreached Apps as pending', async () => {
    await service.shutdown();
    service = new DefaultHubService(
      createServiceOptions({ startupRestorationWaitMs: 20 }),
    );
    await service.prepare();
    await service.createApp({ id: 'customer', name: 'Customer' });
    const release = await service.createRelease('customer', {
      bytes: await createArtifact(rootDir, '1.2.3'),
    });
    const deployed = await service.deploy('customer', {
      releaseId: release.id,
    });
    await waitForDeployment(service, 'customer', deployed.id);
    // Simulate a Host that has restarted with nothing registered yet and then hangs on the first App it restores.
    host.lastDeploymentSet = undefined;
    let releaseStartup: (() => void) | undefined;
    host.nextDeploymentSetGate = new Promise<void>((resolve) => {
      releaseStartup = resolve;
    });

    await service.restoreDesiredState();
    await vi.waitFor(() => expect(host.deploymentSetStarted).toBe(true));

    const started = Date.now();
    const status = await service.hostStatus();
    expect(Date.now() - started).toBeLessThan(1_000);
    expect(host.deploymentSetCompleted).toBe(false);
    expect(status.deployments).toEqual([]);

    const [restoring] = await service.listApps();
    expect(restoring?.runtime).toMatchObject({
      hostAvailable: true,
      state: 'pending',
    });
    await expect(
      service.updateSettings('customer', { activation: 'lazy' }),
    ).resolves.toMatchObject({ app: { startupMode: 'lazy' } });

    releaseStartup?.();
    await host.nextDeploymentSetGate;
    await vi.waitFor(async () => {
      const [restored] = await service.listApps();
      expect(restored?.runtime.state).toBe('running');
    });
  });

  it('rebuilds recovery targets from current configuration and settings after Host readiness', async () => {
    await service.createApp({ id: 'customer', name: 'Customer' });
    const release = await service.createRelease('customer', {
      bytes: await createArtifact(rootDir, '1.2.3'),
    });
    const operation = await service.deploy('customer', {
      releaseId: release.id,
      config: { mode: 'file', content: 'value: initial\n' },
    });
    await waitForDeployment(service, 'customer', operation.id);
    await service.restoreDesiredState();
    await vi.waitFor(() =>
      expect(
        parseYaml(
          host.lastDeploymentSet?.deployments[0]?.config?.content ?? '',
        ),
      ).toMatchObject({
        auth: { secret: expect.any(String) },
        value: 'initial',
      }),
    );
    await service.updateConfig('customer', { content: 'value: published\n' });
    await service.updateSettings('customer', { activation: 'lazy' });
    for (const listener of host.readyListeners) listener();
    await vi.waitFor(() => {
      expect(host.lastDeploymentSet?.deployments[0]).toMatchObject({
        activation: 'lazy',
        config: { revision: operation.id },
      });
      expect(
        parseYaml(
          host.lastDeploymentSet?.deployments[0]?.config?.content ?? '',
        ),
      ).toMatchObject({
        auth: { secret: expect.any(String) },
        value: 'published',
      });
    });
    expect(
      host.lastDeploymentSet?.deployments[0]?.config?.path,
    ).toBeUndefined();
  });
});

async function waitForLatestDeployment(
  service: DefaultHubService,
  appId: string,
): Promise<import('../server/tokens.js').HubDeploymentRecord> {
  const {
    items: [deployment],
  } = await service.listDeployments(appId);
  if (!deployment) throw new Error('Expected a deployment.');
  return await waitForDeployment(service, appId, deployment.id);
}

async function waitForDeployment(
  service: DefaultHubService,
  appId: string,
  deploymentId: string,
): Promise<import('../server/tokens.js').HubDeploymentRecord> {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const deployment = await service.getDeployment(appId, deploymentId);
    if (deployment.status !== 'queued' && deployment.status !== 'deploying') {
      return deployment;
    }
    await new Promise<void>((resolve) => setTimeout(resolve, 5));
  }
  throw new Error('Deployment did not complete.');
}

const TEST_HOST_RUNTIME: HostRuntime = {
  platform: process.platform,
  arch: process.arch,
  libc: process.platform === 'linux' ? 'glibc' : null,
  nodeAbi: Number(process.versions.modules),
  nodeMajor: Number(process.versions.node.split('.')[0]),
};

class FakeHostController implements HubHostController {
  info: ReturnType<HubHostController['getInfo']> = { status: 'stopped' };
  runtime: HostRuntime = { ...TEST_HOST_RUNTIME };
  getInfo(): ReturnType<HubHostController['getInfo']> {
    return this.info;
  }
  readonly readyListeners = new Set<() => void>();
  onReady(listener: () => void): () => void {
    this.readyListeners.add(listener);
    return () => {
      this.readyListeners.delete(listener);
    };
  }
  updateStartupPolicy(appId: string, activation: 'lazy' | 'eager'): void {
    const deployment = this.lastDeploymentSet?.deployments.find(
      (item) => item.appId === appId,
    );
    if (deployment) deployment.activation = activation;
  }
  restoreDeploymentSet(
    deploymentSet: HostDeploymentSet,
  ): ReturnType<FakeHostController['applyDeploymentSet']> {
    return this.applyDeploymentSet(deploymentSet);
  }
  readonly reloadAppConfig = vi.fn(async (_appId: string) => ({
    changedNamespaces: ['feature'],
  }));
  readonly publishedConfigContents = new Map<string, string>();
  readonly publishAppConfig = vi.fn(async (appId: string, content: string) => {
    this.publishedConfigContents.set(appId, content);
    return await this.reloadAppConfig(appId);
  });
  public lastDeploymentSet: HostDeploymentSet | undefined;
  public targetedOperations: string[] = [];
  public nextApplyError: Error | undefined;
  public nextDeploymentSetGate: Promise<void> | undefined;
  public deploymentSetStarted = false;
  public deploymentSetCompleted = false;

  public async ensureStarted(): Promise<URL> {
    return new URL('http://127.0.0.1:13010');
  }

  public async applyDeploymentSet(
    deploymentSet: HostDeploymentSet,
  ): Promise<{ readonly status: HostStatus }> {
    this.deploymentSetStarted = true;
    await this.nextDeploymentSetGate;
    this.lastDeploymentSet = deploymentSet;
    this.deploymentSetCompleted = true;
    return { status: createStatus(deploymentSet) };
  }

  public async applyDeployment(
    deployment: HostDeploymentSet['deployments'][number],
  ): Promise<HostStatus> {
    this.targetedOperations.push(`deploy:${deployment.appId}`);
    if (this.nextApplyError) {
      const error = this.nextApplyError;
      this.nextApplyError = undefined;
      throw error;
    }
    return this.updateDeployment(deployment);
  }

  public async startDeployment(
    deployment: HostDeploymentSet['deployments'][number],
  ): Promise<HostStatus> {
    this.targetedOperations.push(`start:${deployment.appId}`);
    return this.updateDeployment({ ...deployment, desiredState: 'running' });
  }

  public async stopDeployment(appId: string): Promise<HostStatus> {
    this.targetedOperations.push(`stop:${appId}`);
    const deployment = this.lastDeploymentSet?.deployments.find(
      (candidate) => candidate.appId === appId,
    );
    if (!deployment) throw new Error('Expected a deployment spec.');
    return this.updateDeployment({ ...deployment, desiredState: 'stopped' });
  }

  public async removeDeployment(appId: string): Promise<HostStatus> {
    this.targetedOperations.push(`remove:${appId}`);
    const revision = (this.lastDeploymentSet?.revision ?? 0) + 1;
    this.lastDeploymentSet = {
      revision,
      deployments:
        this.lastDeploymentSet?.deployments.filter(
          (deployment) => deployment.appId !== appId,
        ) ?? [],
    };
    return createStatus(this.lastDeploymentSet);
  }

  public async getManagementClient(): Promise<HostManagementService> {
    return {
      publishAppConfig: this.publishAppConfig,
      reloadAppConfig: this.reloadAppConfig,
      restoreDeploymentSet: async (deploymentSet) => ({
        accepted: true,
        status: createStatus(deploymentSet),
      }),
      applyDeploymentSet: async (deploymentSet) => ({
        accepted: true,
        status: createStatus(deploymentSet),
      }),
      applyDeployment: (deployment) => this.applyDeployment(deployment),
      startDeployment: (deployment) => this.startDeployment(deployment),
      stopDeployment: (appId) => this.stopDeployment(appId),
      removeDeployment: (appId) => this.removeDeployment(appId),
      getStatus: async () =>
        createStatus(
          this.lastDeploymentSet ?? { revision: 0, deployments: [] },
          this.runtime,
        ),
      restartApp: async (appId) => {
        this.targetedOperations.push(`restart:${appId}`);
        return createStatus(
          this.lastDeploymentSet ?? { revision: 0, deployments: [] },
        );
      },
    };
  }

  public async shutdown(): Promise<void> {}

  private updateDeployment(
    deployment: HostDeploymentSet['deployments'][number],
  ): HostStatus {
    const revision = (this.lastDeploymentSet?.revision ?? 0) + 1;
    this.lastDeploymentSet = {
      revision,
      deployments: [
        ...(this.lastDeploymentSet?.deployments.filter(
          (candidate) => candidate.id !== deployment.id,
        ) ?? []),
        deployment,
      ],
    };
    return createStatus(this.lastDeploymentSet);
  }
}

function createStatus(
  deploymentSet: HostDeploymentSet,
  runtime: HostRuntime = TEST_HOST_RUNTIME,
): HostStatus {
  return {
    mode: 'managed',
    runtime,
    ready: true,
    desiredRevision: deploymentSet.revision,
    reconciledRevision: deploymentSet.revision,
    deployments: deploymentSet.deployments.map((deployment) => ({
      id: deployment.id,
      appId: deployment.appId,
      desiredState: deployment.desiredState,
      observedState:
        deployment.desiredState === 'running' ? 'running' : 'stopped',
      revision: deploymentSet.revision,
      cacheHit: false,
      app: null,
      error: null,
    })),
  };
}

async function createArtifact(
  rootDir: string,
  version: string,
  options: {
    readonly configTemplate?: string;
    readonly configTemplateName?: string;
    readonly configTemplates?: Readonly<Record<string, string>>;
    readonly manifestPath?: 'root' | 'dist';
    readonly nocobase?: Readonly<Record<string, unknown>>;
  } = {},
): Promise<Uint8Array> {
  const source = path.join(rootDir, `artifact-${version}`);
  const archive = path.join(rootDir, `artifact-${version}.tar.gz`);
  await mkdir(path.join(source, 'dist', 'server'), { recursive: true });
  const manifestPath =
    options.manifestPath === 'dist'
      ? path.join('dist', 'package.json')
      : 'package.json';
  await writeFile(
    path.join(source, manifestPath),
    JSON.stringify({
      name: '@example/customer',
      version,
      ...(options.nocobase ? { nocobase: options.nocobase } : {}),
    }),
  );
  await writeFile(path.join(source, 'dist', 'server', 'embedded.js'), '');
  const entries = [manifestPath, 'dist/server/embedded.js'];
  if (options.configTemplate !== undefined) {
    const configTemplateName =
      options.configTemplateName ?? 'config.example.yml';
    await writeFile(
      path.join(source, configTemplateName),
      options.configTemplate,
    );
    entries.push(configTemplateName);
  }
  for (const [configTemplateName, configTemplate] of Object.entries(
    options.configTemplates ?? {},
  )) {
    await writeFile(path.join(source, configTemplateName), configTemplate);
    entries.push(configTemplateName);
  }
  await createTar({ cwd: source, file: archive, gzip: true }, entries);
  return await readFile(archive);
}
