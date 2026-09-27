import type { ConfigEnv, UserConfig, UserConfigFn } from 'vite';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createAppViteConfig } from '../vite/app.ts';

const buildEnvironment: ConfigEnv = { command: 'build', mode: 'production' };
const serveEnvironment: ConfigEnv = { command: 'serve', mode: 'development' };

const resolveAppConfig = async (
  localConfig: UserConfig = {},
  environment: ConfigEnv = buildEnvironment,
): Promise<UserConfig> => {
  const config = createAppViteConfig(localConfig) as UserConfigFn;
  return (await config(environment)) as UserConfig;
};

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('createAppViteConfig base', () => {
  // A relative base resolves every chunk, preload dependency and asset against the module that references it, so one
  // build can be mounted at any path. See the comment in vite/app.ts.
  it('builds with a relative base, whatever mount path the environment names', async () => {
    vi.stubEnv('APP_BASE_PATH', '/crm');

    const config = await resolveAppConfig();

    expect(config.base).toBe('./');
    expect(config.experimental?.renderBuiltUrl).toBeUndefined();
  });

  it('serves development from the mount path pnpm dev passes', async () => {
    vi.stubEnv('APP_BASE_PATH', 'crm/');

    const config = await resolveAppConfig({}, serveEnvironment);

    expect(config.base).toBe('/crm/');
  });

  it('serves development from the origin root for an empty mount path', async () => {
    vi.stubEnv('APP_BASE_PATH', '');

    const config = await resolveAppConfig({}, serveEnvironment);

    expect(config.base).toBe('/');
  });

  it('refuses to serve development without a mount path', async () => {
    vi.stubEnv('APP_BASE_PATH', undefined);

    await expect(resolveAppConfig({}, serveEnvironment)).rejects.toThrow(
      'APP_BASE_PATH is not set',
    );
  });

  it('keeps a base the consumer configures', async () => {
    const config = await resolveAppConfig({ base: '/cdn/' });

    expect(config.base).toBe('/cdn/');
  });
});

it('preserves OOXML WASM URLs and consumer dependency exclusions', async () => {
  const config = await resolveAppConfig({
    optimizeDeps: { exclude: ['custom-viewer'] },
  });
  expect(config.optimizeDeps?.exclude).toEqual(
    expect.arrayContaining(['@silurus/ooxml', 'custom-viewer']),
  );
});
