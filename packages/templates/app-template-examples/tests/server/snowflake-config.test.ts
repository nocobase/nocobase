import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { AppConfig, defaultAppConfigs } from '@nocobase/app-server/config';
import { resolveStandaloneAppRuntime } from '@nocobase/app-server/node';
import type { AppRuntimeContext } from '@nocobase/app-server/runtime';
import snowflake from '../../server/config/snowflake.ts';

const roots: string[] = [];
const runtimes: AppRuntimeContext[] = [];
afterEach(async () => {
  for (const runtime of runtimes.splice(0)) await runtime.scope.destroy();
  for (const root of roots.splice(0))
    await rm(root, { recursive: true, force: true });
});

async function resolve(source = '{}', env: Record<string, string> = {}) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'snowflake-config-'));
  roots.push(root);
  const configFile = path.join(root, 'config.yml');
  await writeFile(configFile, source);
  const runtime = await resolveStandaloneAppRuntime(
    {
      createAppConfig: () => new AppConfig().loadFile(configFile),
      defaultConfigs: defaultAppConfigs({ snowflake }),
      plugins: { plugins: [] },
      serviceProviders: [],
      routes: [],
    },
    { rootDir: root, env },
  );
  runtimes.push(runtime);
  return runtime.config;
}

describe('Snowflake template configuration', () => {
  it('keeps manual worker 0 and its environment mapping by default', async () => {
    expect((await resolve()).get('snowflake')).toEqual({
      mode: 'manual',
      workerId: 0,
      epoch: 1605024000,
    });
    const config = await resolve('{}', { SNOWFLAKE_WORKER_ID: '31' });
    expect(config.get('snowflake.workerId')).toBe(31);
    expect(await config.validate()).toEqual([]);
    expect(snowflake.rules?.env?.SNOWFLAKE_WORKER_ID.description).toContain(
      '0 to 31',
    );
  });

  it('omits manual defaults in auto mode without installing an allocation plugin', async () => {
    const config = await resolve('snowflake:\n  mode: auto\n');
    expect(config.get('snowflake')).toEqual({ mode: 'auto' });
    expect(await config.validate()).toEqual([]);
  });

  it('rejects a manual environment worker in auto mode', async () => {
    const config = await resolve('snowflake:\n  mode: auto\n', {
      SNOWFLAKE_WORKER_ID: '0',
    });
    expect(await config.validate()).toEqual([
      expect.objectContaining({ path: 'snowflake.workerId', level: 'error' }),
    ]);
  });

  it('rejects explicit worker and epoch overrides in auto mode', async () => {
    const config = await resolve(
      'snowflake:\n  mode: auto\n  workerId: 1\n  epoch: 1605024000\n',
    );
    expect((await config.validate()).map((issue) => issue.path)).toEqual([
      'snowflake.workerId',
      'snowflake.epoch',
    ]);
  });
});
