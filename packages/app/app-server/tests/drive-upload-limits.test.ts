import {
  AppConfig,
  defaultAppConfigs,
  defineAppConfig,
} from '../src/config/index.js';
import { DriveProvider } from '../src/drive/index.js';
import { defineServerPlugins } from '../src/plugins/index.js';
import {
  createAppFromRuntime,
  defineAppRuntime,
  resolveAppRuntime,
} from '../src/runtime/index.js';
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
              value: { drive: { disks: { unused: { maxFileSizeMb } } } },
            }),
          }),
        defaultConfigs: defaultAppConfigs({
          drive: defineAppConfig({
            defaults: {
              default: 'local',
              disks: {
                local: {
                  driver: 'fs',
                  location: '/unused',
                  visibility: 'private',
                },
                unused: {
                  driver: 'fs',
                  location: '/unused',
                  visibility: 'private',
                },
              },
            },
          }),
        }),
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
        'drive.disks.unused.maxFileSizeMb',
      );
    } finally {
      await app.shutdown();
    }
  },
);
