import { existsSync } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { createDriveManager, type AppDriveConfig } from '@nocobase/drive';
import { ServiceContainer } from '@nocobase/service-provider';
import { Hono } from 'hono';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import { AppConfig, createAppPaths } from '../src/config/index.js';
import { DriveProvider, driveManagerToken } from '../src/drive/index.js';
import type { AppPluginApplication } from '../src/plugins/index.js';

let root: string;
beforeEach(async () => {
  root = await mkdtemp(path.join(tmpdir(), 'drive-provider-'));
});
afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

it.each(['custom', 's3'])(
  'loads the %s factory through configuration and the shared token',
  async (name) => {
    const factory = vi.fn(
      () =>
        createDriveManager({
          default: 'local',
          disks: {
            local: {
              driver: 'fs',
              location: path.join(root, name),
              visibility: 'private',
            },
          },
        }).use().driver,
    );
    const drive: AppDriveConfig = {
      default: name,
      disks: {
        local: {
          driver: 'fs',
          location: path.join(root, 'local'),
          visibility: 'private',
        },
        s3: {
          driver: 's3',
          bucket: '',
          region: 'us-east-1',
          credentials: {},
          visibility: 'private',
        },
        [name]: factory,
      },
    };
    const app = await application(drive);
    await app.config.reload();
    expect(app.config.get<AppDriveConfig>('drive')!.disks[name]).toBe(factory);
    const provider = new DriveProvider(app);
    provider.register();
    await provider.boot();
    expect(app.container.resolveIfCreated(driveManagerToken)).toBeUndefined();
    expect(existsSync(path.join(root, 'local'))).toBe(true);
    expect(existsSync(path.join(root, name))).toBe(false);

    const manager = app.container.resolve(driveManagerToken);
    expect(factory).not.toHaveBeenCalled();
    expect(app.container.resolve(driveManagerToken)).toBe(manager);
    const disk = manager.use();
    await disk.put('hello.txt', 'hello');
    expect(await manager.use(name).get('hello.txt')).toBe('hello');
    expect(manager.use(name)).toBe(disk);
    expect(factory).toHaveBeenCalledOnce();

    if (name === 'custom') {
      expect(() => manager.use('s3')).toThrow();
      expect(app.config.get<AppDriveConfig>('drive')!.disks.s3).toEqual(
        drive.disks.s3,
      );
    }
    await provider.shutdown();
  },
);

it('boots with only a factory and never creates an unused driver during shutdown', async () => {
  const factory = vi.fn(() => {
    throw new Error('Unused driver.');
  });
  const app = await application({
    default: 'custom',
    disks: { custom: factory },
  });
  const provider = new DriveProvider(app);
  provider.register();
  await provider.boot();
  await provider.shutdown();
  expect(factory).not.toHaveBeenCalled();
  expect(app.container.resolveIfCreated(driveManagerToken)).toBeUndefined();
});

async function application(
  drive: AppDriveConfig,
): Promise<AppPluginApplication> {
  const config = new AppConfig();
  await config.loadAll();
  config.mergeDefaults({ drive });
  return {
    appName: 'test',
    publicBasePath: '',
    config,
    paths: createAppPaths({ rootDir: root }),
    router: new Hono(),
    container: new ServiceContainer(),
  };
}
