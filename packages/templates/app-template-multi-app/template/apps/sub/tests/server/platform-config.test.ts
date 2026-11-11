import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import YAML from 'yaml';
import { expect, it } from 'vitest';
import { AppConfig, defaultAppConfigs } from '@nocobase/app-server/config';
import { resolveAppRuntime } from '@nocobase/app-server/runtime';
import { defineServerPlugins } from '@nocobase/app-server/plugins';
import lab from '../../server/config/lab.js';
import platform from '../../server/config/platform.js';

it.each([
  { name: 'default', config: {}, env: {}, expected: '/main/' },
  {
    name: 'legacy YAML',
    config: { lab: { portalUrl: '/old-platform/' } },
    env: {},
    expected: '/old-platform/',
  },
  {
    name: 'legacy environment',
    config: { lab: { portalUrl: '/old-platform/' } },
    env: { LAB_PORTAL_URL: '/legacy-env/' },
    expected: '/legacy-env/',
  },
  {
    name: 'new YAML overrides legacy environment',
    config: {
      platform: { url: '/new-platform/' },
      lab: { portalUrl: '/old-platform/' },
    },
    env: { LAB_PORTAL_URL: '/legacy-env/' },
    expected: '/new-platform/',
  },
  {
    name: 'new environment overrides all older values',
    config: {
      platform: { url: '/new-platform/' },
      lab: { portalUrl: '/old-platform/' },
    },
    env: {
      PLATFORM_URL: 'https://platform.example.test/hub/',
      LAB_PORTAL_URL: '/legacy-env/',
    },
    expected: 'https://platform.example.test/hub/',
  },
])(
  'resolves and publishes the platform address: $name',
  async ({ config, env, expected }) => {
    const directory = await mkdtemp(path.join(os.tmpdir(), 'platform-config-'));
    try {
      const file = path.join(directory, 'config.yml');
      await writeFile(file, YAML.stringify(config));
      const runtime = await resolveAppRuntime(
        {
          createAppConfig: () => new AppConfig().loadFile(file),
          defaultConfigs: defaultAppConfigs({ lab, platform }),
          plugins: defineServerPlugins([]),
          serviceProviders: [],
          routes: [],
        },
        {
          mode: 'embedded',
          id: 'config-test',
          basePath: '/config-test',
          rootDir: process.cwd(),
          env,
          registerDisposer: () => {},
        },
      );
      expect(runtime.config.get('platform.url')).toBe(expected);
      expect(runtime.config.publicValues()).toMatchObject({
        platform: { url: expected },
      });
      expect(runtime.config.environmentVariableMappings()).toMatchObject({
        PLATFORM_URL: { path: 'platform.url' },
      });
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  },
);
