import {
  AppConfig,
  defaultAppConfigs,
  defineAppConfig,
  envString,
} from '@nocobase/app-server/config';
import { describe, expect, it } from 'vitest';

import {
  type AIApplicationConfig,
  defineAIConfig,
  normalizeDisks,
  resolveAIEmployeeStorageDisk,
  resolveAIKnowledgeBaseStorageDisks,
} from '../server/config.js';
import { normalizeLLMServiceConfig } from '../server/manager/llm-service-config.js';

function storageConfig(
  shared?: readonly string[],
  employee?: readonly string[],
  knowledgeBase?: readonly string[],
): AIApplicationConfig {
  return {
    storage: { disk: shared },
    aiEmployee: { storage: { disk: employee } },
    aiKnowledgeBase: { storage: { disk: knowledgeBase } },
    llmServices: {},
  };
}

async function loadAIConfig(value: unknown): Promise<AppConfig> {
  const config = new AppConfig();
  if (value !== undefined) {
    config.load({
      name: 'test-config',
      read: async () => ({
        kind: 'map',
        value: value as Record<string, object>,
      }),
    });
  }
  await config.loadAll();
  config.mergeDefaults({
    ai: {
      storage: {},
      aiEmployee: { storage: {} },
      aiKnowledgeBase: { storage: {}, vectorDatabases: [], manifests: [] },
      llmServices: {},
      skills: { paths: [] },
      mcpServers: {},
    },
  });
  return config;
}

describe('AI application config', () => {
  it('defaults storage scopes, LLM services, and knowledge-base inputs', async () => {
    const config = await loadAIConfig(undefined);

    expect(config.get<AIApplicationConfig>('ai')!).toEqual({
      storage: {},
      aiEmployee: { storage: {} },
      aiKnowledgeBase: {
        storage: {},
        vectorDatabases: [],
        manifests: [],
      },
      skills: { paths: [] },
      llmServices: {},
      mcpServers: {},
    });
  });

  it('keeps knowledge-base list defaults when another nested option is configured', async () => {
    const config = await loadAIConfig({
      ai: { aiKnowledgeBase: { storage: { disk: ['local'] } } },
    });

    expect(config.get<AIApplicationConfig>('ai')!.aiKnowledgeBase).toEqual({
      storage: { disk: ['local'] },
      vectorDatabases: [],
      manifests: [],
    });
  });

  it('accepts complete services, custom model entries, and nested provider options', async () => {
    const config = await loadAIConfig({
      ai: {
        futureOption: { enabled: true },
        llmServices: {
          openai: {
            title: 'OpenAI',
            provider: 'openai',
            options: { credentials: { apiKey: '${OPENAI_API_KEY}' } },
            enabledModels: [{ label: 'GPT-4.1', value: 'gpt-4.1' }],
            modelOptions: { responseFormat: { type: 'json_schema' } },
            enabled: true,
            sort: 10,
          },
          'custom-model': {
            provider: 'openai',
            enabledModels: [{ label: 'Custom model', value: 'custom-model' }],
          },
        },
      },
    });

    expect(config.get<AIApplicationConfig>('ai')!).toMatchObject({
      futureOption: { enabled: true },
      llmServices: {
        openai: {
          options: { credentials: { apiKey: '${OPENAI_API_KEY}' } },
          modelOptions: { responseFormat: { type: 'json_schema' } },
        },
        'custom-model': {
          enabledModels: [{ label: 'Custom model', value: 'custom-model' }],
        },
      },
    });
  });

  it('accepts canonical knowledge-base vector databases and manifest sources', async () => {
    const config = await loadAIConfig({
      ai: {
        aiKnowledgeBase: {
          storage: { disk: ['local', 'archive'] },
          vectorDatabases: [
            {
              key: 'pgvector1',
              name: 'Primary PGVector',
              provider: 'NocobaseDefaultPGVectorProvider',
              databaseSpec: 'PGVector',
              connection: {
                host: '127.0.0.1',
                port: 5432,
                user: '${PG_VECTOR_USERNAME}',
                password: '${PG_VECTOR_PASSWORD}',
                database: 'nocobase',
                tableName: 'vectorRecords',
              },
              enabled: true,
            },
            {
              key: 'normalized-by-knowledge-base',
              connection: {
                host: 'database.internal',
                port: 5432,
                user: 'nocobase',
                database: 'nocobase',
                tableName: 'otherVectorRecords',
              },
            },
          ],
          manifests: [
            {
              disk: 'local',
              locations: [
                'preload/knowledge-base/manifest.yml',
                '/preload/knowledge-base/append.yml',
              ],
            },
          ],
        },
      },
    });

    expect(config.get<AIApplicationConfig>('ai')!.aiKnowledgeBase).toEqual({
      storage: { disk: ['local', 'archive'] },
      vectorDatabases: [
        {
          key: 'pgvector1',
          name: 'Primary PGVector',
          provider: 'NocobaseDefaultPGVectorProvider',
          databaseSpec: 'PGVector',
          connection: {
            host: '127.0.0.1',
            port: 5432,
            user: '${PG_VECTOR_USERNAME}',
            password: '${PG_VECTOR_PASSWORD}',
            database: 'nocobase',
            tableName: 'vectorRecords',
          },
          enabled: true,
        },
        {
          key: 'normalized-by-knowledge-base',
          connection: {
            host: 'database.internal',
            port: 5432,
            user: 'nocobase',
            database: 'nocobase',
            tableName: 'otherVectorRecords',
          },
        },
      ],
      manifests: [
        {
          disk: 'local',
          locations: [
            'preload/knowledge-base/manifest.yml',
            '/preload/knowledge-base/append.yml',
          ],
        },
      ],
    });
  });

  it('lets the application map an environment variable onto one service', async () => {
    const config = await loadAIConfig({
      ai: { llmServices: { openai: { provider: 'openai' } } },
    });
    const sections = defaultAppConfigs({
      ai: defineAppConfig<AIApplicationConfig>({
        defaults: { llmServices: {} },
        env: { OPENAI_API_KEY: envString('llmServices.openai.options.apiKey') },
      }),
    }).sections!;
    config.defineSections(sections);
    await config.loadSectionEnvironment({ OPENAI_API_KEY: 'from-env' });

    expect(
      normalizeLLMServiceConfig(
        config.get<AIApplicationConfig>('ai')!.llmServices,
      ),
    ).toEqual([
      {
        name: 'openai',
        provider: 'openai',
        options: { apiKey: 'from-env' },
        enabledModels: undefined,
      },
    ]);
  });

  it('rejects the list form with a pointer to the keyed map', () => {
    expect(() =>
      normalizeLLMServiceConfig([
        { name: 'openai', provider: 'openai' },
      ] as never),
    ).toThrow('expected a map keyed by service name');
  });

  it('rejects a name field, since the key is the name', () => {
    expect(() =>
      normalizeLLMServiceConfig({
        openai: { name: 'other', provider: 'openai' } as never,
      }),
    ).toThrow('Invalid ai.llmServices.openai.name');
  });

  it('reports a service by its name', () => {
    expect(() =>
      normalizeLLMServiceConfig({ openai: { title: 'OpenAI' } as never }),
    ).toThrow('Invalid ai.llmServices.openai.provider');
  });

  describe('validateAIConfig', () => {
    async function issuesFor(value: unknown) {
      const config = await loadAIConfig({ ai: value });
      config.defineSections(
        defaultAppConfigs({
          ai: defineAIConfig({ defaults: { llmServices: {} } }),
        }).sections!,
      );
      return config.validate();
    }

    it('warns about a service whose provider needs a key and has none', async () => {
      await expect(
        issuesFor({
          llmServices: {
            openai: { provider: 'openai' },
            blank: { provider: 'anthropic', options: { apiKey: '  ' } },
            keyed: { provider: 'deepseek', options: { apiKey: 'sk-test' } },
            local: { provider: 'ollama' },
            custom: { provider: 'company' },
          },
        }),
      ).resolves.toEqual([
        expect.objectContaining({
          level: 'warning',
          path: 'ai.llmServices.openai.options.apiKey',
          fix: expect.stringContaining(
            'pnpm nocobase config set --from-env ai.llmServices.openai.options.apiKey=<VARIABLE>',
          ),
        }),
        expect.objectContaining({
          level: 'warning',
          path: 'ai.llmServices.blank.options.apiKey',
        }),
      ]);
    });

    it('reports an MCP server named like a fixed route segment as an error', async () => {
      const issues = await issuesFor({
        mcpServers: {
          tools: { transport: 'http', url: 'http://127.0.0.1:1/mcp' },
          search: { transport: 'http', url: 'http://127.0.0.1:3/mcp' },
        },
      });
      expect(issues).toEqual([
        expect.objectContaining({
          level: 'error',
          path: 'ai.mcpServers.tools',
          message: expect.stringContaining('Reserved names: tools.'),
        }),
      ]);
    });

    it('reports nothing for a configuration without services', async () => {
      await expect(issuesFor({})).resolves.toEqual([]);
    });

    it('accepts a checkpoint cleanup schedule in a time zone', async () => {
      await expect(
        issuesFor({
          checkpointCleanup: {
            enabled: false,
            cron: '30 2 * * 1',
            tz: 'Asia/Shanghai',
            retentionDays: 0.5,
            batchSize: 50,
            jobs: 'redis',
          },
        }),
      ).resolves.toEqual([]);
    });

    it('reports an invalid checkpoint cleanup as an error, by path', async () => {
      await expect(
        issuesFor({
          checkpointCleanup: {
            enabled: 'yes',
            retentionDays: 0,
            batchSize: 1.5,
            cron: '0 3 * *',
          },
        }),
      ).resolves.toEqual([
        expect.objectContaining({
          level: 'error',
          path: 'ai.checkpointCleanup.enabled',
        }),
        expect.objectContaining({
          level: 'error',
          path: 'ai.checkpointCleanup.retentionDays',
        }),
        expect.objectContaining({
          level: 'error',
          path: 'ai.checkpointCleanup.batchSize',
        }),
        expect.objectContaining({
          level: 'error',
          path: 'ai.checkpointCleanup.cron',
          message: expect.stringContaining('five or six fields'),
        }),
      ]);
      await expect(
        issuesFor({
          checkpointCleanup: { cron: '0 3 * * *', tz: 'Mars/Base' },
        }),
      ).resolves.toEqual([
        expect.objectContaining({
          level: 'error',
          path: 'ai.checkpointCleanup.cron',
        }),
      ]);
      await expect(
        issuesFor({ checkpointCleanup: { tz: 'Mars/Base' } }),
      ).resolves.toEqual([
        expect.objectContaining({
          level: 'error',
          path: 'ai.checkpointCleanup.tz',
        }),
      ]);
    });

    it('reports a structural problem as an error, by path', async () => {
      await expect(
        issuesFor({
          llmServices: { openai: { name: 'openai', title: 1 } },
        }),
      ).resolves.toEqual([
        expect.objectContaining({
          level: 'error',
          path: 'ai.llmServices.openai.name',
        }),
        expect.objectContaining({
          level: 'error',
          path: 'ai.llmServices.openai.provider',
        }),
        expect.objectContaining({
          level: 'error',
          path: 'ai.llmServices.openai.title',
        }),
      ]);
    });

    it('reports the list form as an error', async () => {
      await expect(
        issuesFor({ llmServices: [{ name: 'openai', provider: 'openai' }] }),
      ).resolves.toEqual([
        expect.objectContaining({
          level: 'error',
          path: 'ai.llmServices',
          message: expect.stringContaining(
            'expected a map keyed by service name',
          ),
        }),
      ]);
    });
  });

  it('normalizes disk arrays without parsing comma-separated strings', () => {
    expect(normalizeDisks([' a ', '', 'a', 'b,c'])).toEqual(['a', 'b,c']);
  });

  it('resolves employee and knowledge base scopes independently', () => {
    const value = storageConfig(['a', 'b', 'c'], ['employee-a']);
    expect(resolveAIEmployeeStorageDisk(value, 'local')).toBe('employee-a');
    expect(resolveAIKnowledgeBaseStorageDisks(value, 'local')).toEqual([
      'a',
      'b',
      'c',
    ]);
  });

  it('falls back through shared storage to the application default disk', () => {
    expect(
      resolveAIEmployeeStorageDisk(storageConfig(['a', 'b']), 'local'),
    ).toBe('a');
    expect(
      resolveAIKnowledgeBaseStorageDisks(storageConfig(['a', 'b']), 'local'),
    ).toEqual(['a', 'b']);
    expect(resolveAIEmployeeStorageDisk(storageConfig(), 'local')).toBe(
      'local',
    );
    expect(
      resolveAIKnowledgeBaseStorageDisks(storageConfig(), 'local'),
    ).toEqual(['local']);
  });
});
