// @vitest-environment node
import { AppConfig, defaultAppConfigs } from '@nocobase/app-server/config';
import { defineServerPlugins } from '@nocobase/app-server/plugins';
import {
  defineAppRuntime,
  resolveAppRuntime,
  createAppFromRuntime,
} from '@nocobase/app-server/runtime';
import { describe, expect, it } from 'vitest';
import { defineProjectsConfig } from '../config/index.js';

function resolve(value: unknown) {
  return resolveAppRuntime(
    defineAppRuntime({
      createAppConfig: () =>
        new AppConfig().load({
          name: 'attachment-config-test',
          read: async () => ({ kind: 'map', value: { projects: value } }),
        }),
      defaultConfigs: defaultAppConfigs({ projects: defineProjectsConfig() }),
      plugins: defineServerPlugins([]),
      serviceProviders: [],
      routes: [],
    }),
    {
      id: 'attachment-config-test',
      appName: 'test',
      basePath: '',
      mode: 'embedded',
      paths: { rootDir: process.cwd() },
      env: {},
      registerDisposer() {},
    },
  );
}

describe('attachment deployment configuration', () => {
  it('defaults to 20 MiB and publishes the effective value alone', async () => {
    const runtime = await resolve({});
    expect(runtime.config.get('projects.attachments.maxFileSizeMb')).toBe(20);
    expect(runtime.config.publicValues()).toEqual({
      projects: { attachments: { maxFileSizeMb: 20 } },
    });
  });
  it('publishes a custom limit without private settings', async () => {
    const runtime = await resolve({
      attachments: { maxFileSizeMb: 50 },
      privateKey: 'synthetic',
    });
    expect(runtime.config.publicValues()).toEqual({
      projects: { attachments: { maxFileSizeMb: 50 } },
    });
  });
  it.each([0, -1, 1.5, '50', null, false, Number.MAX_SAFE_INTEGER])(
    'fails startup for invalid value %s',
    async (value) => {
      const runtime = await resolve({ attachments: { maxFileSizeMb: value } });
      const app = createAppFromRuntime(runtime);
      try {
        await expect(app.start()).rejects.toThrow(
          /projects\.attachments\.maxFileSizeMb/,
        );
      } finally {
        await app.shutdown();
      }
    },
  );
});
