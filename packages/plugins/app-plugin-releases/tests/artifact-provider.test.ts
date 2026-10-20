// @vitest-environment node
import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { parse } from 'yaml';
import { afterEach, expect, it, vi } from 'vitest';
import { AppHostSupervisor } from '@nocobase/app-host/supervisor';
import { databaseManagerToken } from '@nocobase/db';
import { ServiceContainer } from '@nocobase/service-provider';
import type { AppConfigAccessor } from '@nocobase/app-server/config';
import type { AppDriveConfig, AppDriveDiskConfig } from '@nocobase/drive';
import { createReleases } from '../server/composition.js';
import { ReleasesProvider } from '../server/providers/releases.js';
import type { ReleasesPluginConfig } from '../server/config.js';
import { releasesToken } from '../server/tokens.js';
import { createHarness } from './harness.js';

afterEach(() => vi.restoreAllMocks());

it('rejects a disk factory before initializing a Host or invoking the factory', () => {
  const factory = vi.fn(() => {
    throw new Error('Must not run.');
  });
  const initialize = vi.spyOn(AppHostSupervisor, 'initialize');
  const create = vi.spyOn(AppHostSupervisor, 'create');
  const container = new ServiceContainer();
  const provider = new ReleasesProvider({
    container,
    config: accessor(
      {
        artifact: { disk: 'custom' },
        dataDir: 'storage/releases',
        host: {
          enabled: true,
          configPath: 'unused.yml',
          appVolumesDir: 'volumes',
        },
      },
      { default: 'custom', disks: { custom: factory } },
    ),
  });
  provider.register();
  expect(() => container.resolve(releasesToken)).toThrow(
    'release artifacts require a serializable disk configuration object',
  );
  expect(factory).not.toHaveBeenCalled();
  expect(initialize).not.toHaveBeenCalled();
  expect(create).not.toHaveBeenCalled();
});

function accessor(
  releases: ReleasesPluginConfig,
  drive: AppDriveConfig,
): AppConfigAccessor {
  return {
    get: <T>(key: string) =>
      ({ releases, drive })[key as 'releases' | 'drive'] as T | undefined,
    mergeDefaults() {},
    raw: () => ({}),
    reload: () => Promise.resolve({ changedNamespaces: [] }),
    subscribe: () => () => {},
  };
}

it.each(['fs', 's3'] as const)(
  'passes resolved %s disk configuration to both Hosts without the prefix',
  async (kind) => {
    const harness = await createHarness();
    const container = new ServiceContainer();
    container.instance(databaseManagerToken, harness.database);
    // Initialize isolated supervisors without starting children or using the process-wide singleton.
    vi.spyOn(AppHostSupervisor, 'initialize').mockImplementation((options) =>
      AppHostSupervisor.create(options),
    );
    const configPath = (backend: string) =>
      path.join(harness.rootDir, backend, 'config.yml');
    const host = (backend: string) => ({
      enabled: true,
      entrypoint: 'unused.js',
      configPath: configPath(backend),
      appVolumesDir: path.join(harness.rootDir, backend, 'volumes'),
      appRevisionsDir: path.join(harness.rootDir, backend, 'revisions'),
    });
    const disk: AppDriveDiskConfig =
      kind === 'fs'
        ? { driver: 'fs', location: 'storage/archives', visibility: 'private' }
        : {
            driver: 's3',
            bucket: 'archives',
            region: 'auto',
            credentials: {},
            forcePathStyle: true,
            supportsACL: false,
            visibility: 'private',
          };
    const drive = { default: 'archives', disks: { archives: disk } };
    const before = structuredClone(drive);
    const provider = new ReleasesProvider({
      container,
      config: accessor(
        {
          artifact: { disk: 'archives', prefix: 'releases' },
          dataDir: path.join(harness.rootDir, 'data'),
          host: host('process'),
          docker: host('docker'),
        },
        drive,
      ),
    });
    provider.register();
    try {
      const services = container.resolve(releasesToken);
      const driver = services.drivers.get('host');
      for (const [backend, dir] of [
        ['in-process', 'process'],
        ['docker', 'docker'],
      ]) {
        const session = await driver.open(
          {
            id: backend,
            name: backend,
            config: { backend },
            secret: null,
            publicUrl: null,
          },
          { desired: () => Promise.resolve([]) },
        );
        try {
          const written = parse(await readFile(configPath(dir), 'utf8')) as {
            host: { artifact: AppDriveDiskConfig };
          };
          expect(written.host.artifact).toEqual(
            kind === 'fs'
              ? { ...disk, location: path.resolve('storage/archives') }
              : disk,
          );
          expect(written.host.artifact).not.toHaveProperty('prefix');
          expect(written.host.artifact).not.toHaveProperty('disk');
        } finally {
          await session.close();
        }
      }
      expect(drive).toEqual(before);
    } finally {
      await provider.shutdown();
      await harness.close();
    }
  },
);

it.each([
  [{ default: 'missing', disks: {} }, 'drive.disks'],
  [
    {
      default: 'assets',
      disks: {
        missing: {
          driver: 's3',
          bucket: 'public-assets',
          region: 'auto',
          credentials: {},
          supportsACL: false,
          visibility: 'public',
        },
      },
    },
    'release artifacts must be stored on a private disk',
  ],
] satisfies [AppDriveConfig, string][])(
  'rejects an unusable reference before initializing any Host or creating services (%#)',
  (drive, message) => {
    const initialize = vi.spyOn(AppHostSupervisor, 'initialize');
    const create = vi.spyOn(AppHostSupervisor, 'create');
    const container = new ServiceContainer();
    const provider = new ReleasesProvider({
      container,
      config: accessor(
        {
          artifact: { disk: 'missing' },
          dataDir: 'storage/releases',
          host: {
            enabled: true,
            configPath: 'unused.yml',
            appVolumesDir: 'volumes',
            appRevisionsDir: 'revisions',
          },
        },
        drive,
      ),
    });
    provider.register();
    expect(() => container.resolve(releasesToken)).toThrow(message);
    expect(initialize).not.toHaveBeenCalled();
    expect(create).not.toHaveBeenCalled();
  },
);

it('rejects a public referenced disk in the direct composition entry', async () => {
  const harness = await createHarness();
  try {
    expect(() =>
      createReleases({
        database: harness.database,
        config: {
          artifact: { disk: 'assets', prefix: 'releases' },
          dataDir: path.join(harness.rootDir, 'data'),
        },
        drive: {
          default: 'assets',
          disks: {
            assets: {
              driver: 'fs',
              location: path.join(harness.rootDir, 'public'),
              url: '/storage',
              visibility: 'public',
            },
          },
        },
        drivers: harness.services.drivers,
        access: () => harness.application,
      }),
    ).toThrow('release artifacts must be stored on a private disk');
  } finally {
    await harness.close();
  }
});
