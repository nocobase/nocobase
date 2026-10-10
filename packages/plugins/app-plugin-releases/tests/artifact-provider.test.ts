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
import { ReleasesProvider } from '../server/providers/releases.js';
import type { ReleasesPluginConfig } from '../server/config.js';
import { releasesToken } from '../server/tokens.js';
import { createHarness } from './harness.js';

afterEach(() => vi.restoreAllMocks());

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

it('rejects an invalid reference before initializing any Host or creating services', async () => {
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
      { default: 'missing', disks: {} },
    ),
  });
  provider.register();
  expect(() => container.resolve(releasesToken)).toThrow('drive.disks');
  expect(initialize).not.toHaveBeenCalled();
  expect(create).not.toHaveBeenCalled();
});
