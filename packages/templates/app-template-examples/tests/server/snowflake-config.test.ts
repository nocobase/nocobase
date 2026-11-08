import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  AppConfig,
  defaultAppConfigs,
  defineAppConfig,
  envString,
  type AppConfigFactory,
} from '@nocobase/app-server/config';
import { resolveStandaloneAppRuntime } from '@nocobase/app-server/node';
import type { AppRuntimeContext } from '@nocobase/app-server/runtime';
import snowflake from '../../server/config/snowflake.ts';
import {
  AppIdGenerator,
  defineAppSnowflakeConfig,
  type AppSnowflakeConfig,
} from '@nocobase/app-server/id-generator';

const roots: string[] = [];
const runtimes: AppRuntimeContext[] = [];
afterEach(async () => {
  for (const runtime of runtimes.splice(0)) await runtime.scope.destroy();
  for (const root of roots.splice(0))
    await rm(root, { recursive: true, force: true });
});

async function resolve(
  source = '{}',
  env: Record<string, string> = {},
  factory: AppConfigFactory = snowflake,
) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'snowflake-config-'));
  roots.push(root);
  const configFile = path.join(root, 'config.yml');
  await writeFile(configFile, source);
  const runtime = await resolveStandaloneAppRuntime(
    {
      createAppConfig: () => new AppConfig().loadFile(configFile),
      defaultConfigs: defaultAppConfigs({ snowflake: factory }),
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
    const omitted = (await resolve()).get('snowflake');
    expect(omitted).toMatchObject({
      workerId: 0,
      epoch: 1605024000,
    });
    expect(
      (await resolve('snowflake:\n  mode: manual\n')).get('snowflake'),
    ).toEqual(omitted);
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
    const ids = new AppIdGenerator(
      config.get<AppSnowflakeConfig>('snowflake')!,
    );
    await expect(ids.initialize()).rejects.toThrow(
      'requires an ID generator factory',
    );
  });

  it.each(['autoo', '1', 'true', '[]', '{}', 'null'])(
    'reports a configuration error for mode %s',
    async (mode) => {
      const config = await resolve(`snowflake:\n  mode: ${mode}\n`);
      expect(await config.validate()).toEqual([
        expect.objectContaining({
          path: 'snowflake.mode',
          level: 'error',
          message: 'Snowflake mode must be manual or auto.',
        }),
      ]);
    },
  );

  it('composes adapter defaults and validation without losing host defaults or environment mappings', async () => {
    const factory = defineAppSnowflakeConfig(
      defineAppConfig({
        defaults: {
          mode: 'auto',
          workerId: 9,
          epoch: 1,
          adapterOption: 'valid',
        },
        env: { TEST_ADAPTER_OPTION: envString('adapterOption') },
        public: ['adapterOption'],
        validate(value, context) {
          if (value.adapterOption !== 'valid')
            context.error('adapterOption', 'Invalid adapter option.');
        },
      }),
    );
    const manual = await resolve('{}', {}, factory);
    expect(manual.get('snowflake')).toMatchObject({
      mode: 'manual',
      workerId: 0,
      epoch: 1605024000,
    });
    const config = await resolve('{}', { SNOWFLAKE_WORKER_ID: '31' }, factory);
    expect(config.get('snowflake')).toMatchObject({
      workerId: 31,
      epoch: 1605024000,
      adapterOption: 'valid',
    });
    expect(await config.validate()).toEqual([]);
    expect(config.publicValues()).toEqual({
      snowflake: { adapterOption: 'valid' },
    });
    const auto = await resolve(
      'snowflake:\n  mode: auto\n',
      { TEST_ADAPTER_OPTION: 'invalid', SNOWFLAKE_WORKER_ID: '0' },
      factory,
    );
    expect(auto.get('snowflake.epoch')).toBeUndefined();
    const validAuto = await resolve('snowflake:\n  mode: auto\n', {}, factory);
    expect(validAuto.get('snowflake')).toEqual({
      mode: 'auto',
      adapterOption: 'valid',
    });
    expect(await validAuto.validate()).toEqual([]);
    expect((await auto.validate()).map((issue) => issue.path)).toEqual([
      'snowflake.workerId',
      'snowflake.adapterOption',
    ]);
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
