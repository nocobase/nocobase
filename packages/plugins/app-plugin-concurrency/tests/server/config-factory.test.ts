import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AppConfig, defaultAppConfigs } from '@nocobase/app-server/config';
import { defineAppRuntime } from '@nocobase/app-server/runtime';
import { defineServerPlugins } from '@nocobase/app-server/plugins';
import { resolveStandaloneAppRuntime } from '@nocobase/app-server/node';
import concurrency from '../../server/index.js';
import {
  defineConcurrencyConfig,
  validateConcurrencyConfig,
} from '../../config/index.js';

const directories: string[] = [];
afterEach(async () => {
  for (const directory of directories.splice(0))
    await rm(directory, { recursive: true, force: true });
});
async function runtime(file: string, env: Record<string, string> = {}) {
  const rootDir = await mkdtemp(
    path.join(tmpdir(), 'concurrency-config-factory-'),
  );
  directories.push(rootDir);
  const configPath = path.join(rootDir, 'config.yml');
  await writeFile(configPath, file);
  const definition = defineAppRuntime({
    defaultConfigs: defaultAppConfigs({
      concurrency: defineConcurrencyConfig(),
    }),
    createAppConfig(context) {
      const config = new AppConfig();
      config.loadFile(context.configPath!);
      return config;
    },
    plugins: defineServerPlugins([concurrency]),
    serviceProviders: [],
    routes: [],
  });
  return resolveStandaloneAppRuntime(definition, { rootDir, configPath, env });
}
describe('public concurrency configuration factory', () => {
  it('supplies the single-process defaults through the real application runtime', async () => {
    const resolved = await runtime('{}');
    expect(resolved.config.get('concurrency')).toEqual({
      default: 'memory',
      memory: { adapter: 'mutex' },
    });
  });
  it('applies declared environment selection above file and defaults', async () => {
    const resolved = await runtime(
      'concurrency:\n  default: memory\n  alternate:\n    adapter: mutex\n    ttl: 2000\n',
      { CONCURRENCY_DEFAULT: 'alternate' },
    );
    expect(resolved.config.get('concurrency.default')).toBe('alternate');
    expect(resolved.config.get('concurrency.alternate')).toEqual({
      adapter: 'mutex',
      ttl: 2000,
    });
  });
  it('reports an invalid environment-selected name through the real config check without starting services', async () => {
    const resolved = await runtime('{}', { CONCURRENCY_DEFAULT: 'missing' });
    expect(await resolved.config.validate()).toEqual([
      {
        level: 'error',
        path: 'concurrency.default',
        message: 'Must name an existing configuration.',
      },
    ]);
  });
  it('always includes common validation and accepts a single extra validator', () => {
    const extra = vi.fn();
    const factory = defineConcurrencyConfig({ validate: extra });
    expect(factory.rules?.validators).toEqual([
      validateConcurrencyConfig,
      extra,
    ]);
    expect(factory.rules?.public).toEqual([]);
  });
  it('preserves an array of implementation validators and explicit environment mappings', () => {
    const one = vi.fn();
    const two = vi.fn();
    const factory = defineConcurrencyConfig({ validate: [one, two], env: {} });
    expect(factory.rules?.validators).toEqual([
      validateConcurrencyConfig,
      one,
      two,
    ]);
    expect(Object.keys(factory.rules?.env ?? {})).toEqual([
      'CONCURRENCY_DEFAULT',
    ]);
  });
});
