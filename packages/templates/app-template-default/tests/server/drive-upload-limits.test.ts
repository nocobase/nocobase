import drive from '../../server/config/drive.js';
import { AppConfig, defaultAppConfigs } from '@nocobase/app-server/config';
import { DriveProvider } from '@nocobase/app-server/drive';
import { defineServerPlugins } from '@nocobase/app-server/plugins';
import {
  createAppFromRuntime,
  defineAppRuntime,
  resolveAppRuntime,
} from '@nocobase/app-server/runtime';
import { expect, it } from 'vitest';

it.each([0, -1, 1.5, '50', null])(
  'fails startup with a clear disk configuration path (%s)',
  async (maxFileSizeMb) => {
    const runtime = await resolveAppRuntime(
      defineAppRuntime({
        createAppConfig: () =>
          new AppConfig().load({
            name: 'drive-test',
            read: async () => ({
              kind: 'map',
              value: { drive: { disks: { local: { maxFileSizeMb } } } },
            }),
          }),
        defaultConfigs: defaultAppConfigs({ drive }),
        plugins: defineServerPlugins([]),
        serviceProviders: [DriveProvider],
        routes: [],
      }),
      {
        id: 'drive-test',
        appName: 'test',
        basePath: '',
        mode: 'embedded',
        paths: { rootDir: process.cwd() },
        env: {},
        registerDisposer() {},
      },
    );
    const app = createAppFromRuntime(runtime);
    try {
      await expect(app.start()).rejects.toThrow(
        'drive.disks.local.maxFileSizeMb',
      );
    } finally {
      await app.shutdown();
    }
  },
);
