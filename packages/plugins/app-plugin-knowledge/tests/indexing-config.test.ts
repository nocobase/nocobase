// @vitest-environment node
import { AppConfig, defaultAppConfigs } from '@nocobase/app-server/config';
import { defineServerPlugins } from '@nocobase/app-server/plugins';
import {
  defineAppRuntime,
  resolveAppRuntime,
} from '@nocobase/app-server/runtime';
import { describe, expect, it } from 'vitest';
import { defineKnowledgeConfig } from '../config.js';
import { createKnowledgeIndexingRegistry } from '../server/indexing/registry.js';
import { sqliteVecIndexingExtension } from '../server/extension/sqlite-vec/index.js';
import { parseIndexingInstances } from '../server/indexing/config.js';
async function config(value: unknown) {
  return resolveAppRuntime(
    defineAppRuntime({
      createAppConfig: () =>
        new AppConfig().load({
          name: 'fixture',
          read: async () => ({ kind: 'map', value: { knowledge: value } }),
        }),
      defaultConfigs: defaultAppConfigs({ knowledge: defineKnowledgeConfig() }),
      plugins: defineServerPlugins([]),
      serviceProviders: [],
      routes: [],
    }),
    {
      id: 'kb-config',
      appName: 'kb-config',
      basePath: '',
      mode: 'embedded',
      paths: { rootDir: process.cwd() },
      env: {},
      registerDisposer() {},
    },
  );
}
describe('pure Knowledge indexing deployment configuration', () => {
  it('composes the real factory without opening the configured file', async () => {
    const runtime = await config({
      indexing: {
        local: {
          name: 'Local',
          type: 'sqlite-vec',
          file: '/a/nonexistent/directory/knowledge.sqlite',
        },
      },
      jobs: 'knowledgeTasks',
    });
    expect(runtime.config.get('knowledge.jobs')).toBe('knowledgeTasks');
    expect(runtime.config.get('knowledge.indexing.local.type')).toBe(
      'sqlite-vec',
    );
  });
  it('accepts a trimmed named host selector without interpreting or probing a connection', async () => {
    const runtime = await config({ jobs: '  knowledgeTasks  ' });
    expect(await runtime.config.validate()).toEqual([]);
  });
  it('defaults to no instances', async () => {
    expect((await config({})).config.get('knowledge.indexing')).toEqual({});
  });
  it.each([
    { indexing: { local: { name: 'Local', type: 'missing' } } },
    {
      indexing: {
        local: { name: 'Local', type: 'sqlite-vec', file: ':memory:' },
      },
    },
    {
      indexing: {
        local: {
          name: 'Local',
          type: 'sqlite-vec',
          file: 'file.sqlite',
          secret: 'not-allowed',
        },
      },
    },
    { jobs: 'bad selector' },
  ])(
    'reports invalid values to the real config-check validator',
    async (value) => {
      const runtime = await config(value);
      expect((await runtime.config.validate()).length).toBeGreaterThan(0);
    },
  );
  it('rejects duplicate types and seals registration', () => {
    const registry = createKnowledgeIndexingRegistry();
    const release = registry.register(sqliteVecIndexingExtension);
    expect(() => registry.register(sqliteVecIndexingExtension)).toThrow();
    expect(parseIndexingInstances({}, registry).size).toBe(0);
    registry.seal();
    expect(release).toThrow();
  });
});
