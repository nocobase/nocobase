import { describe, expect, it, vi } from 'vitest';
import { createInMemoryBroker } from '@nocobase/realtime/server';
import { yamlParser } from '@nocobase/config/parsers/yaml';
import {
  environmentProvider,
  envString,
  envInteger,
} from '@nocobase/config/providers/env';
import { AppConfig, defaultAppConfigs } from '../src/config/index.js';
import {
  createRealtimeBrokerRegistry,
  createRealtimeService,
  defineRealtimeConfig,
  realtimeServiceOptions,
  type AppRealtimeConfig,
  type RealtimeBrokerFactoryContext,
} from '../src/realtime/index.js';

describe('realtime broker configuration', () => {
  it.each([
    undefined,
    {},
    { limits: { maxConnections: 17 } },
    { broker: { adapter: 'inMemory' } },
  ])(
    'preserves local operation and service defaults for %j',
    async (config) => {
      const options = realtimeServiceOptions(config, 'application');
      const service = createRealtimeService(options);
      await service.setup();
      expect(service.diagnostics().brokerState).toBe('ready');
      expect(options.namespace).toBe('application');
      expect(options.maxConnections).toBe(config?.limits?.maxConnections);
      await service.close();
    },
  );

  it.each([
    [{ adapter: 'inMemory' }, 'realtime.adapter'],
    [{ adapter: 'redis' }, 'realtime.adapter'],
    [{ redis: {} }, 'realtime.redis'],
    [{ adapter: 'redis', redis: {} }, 'realtime.adapter'],
    [{ adapter: undefined }, 'realtime.adapter'],
    [{ redis: null, broker: { adapter: 'inMemory' } }, 'realtime.redis'],
    [{ adapter: 'inMemory', broker: { adapter: 'redis' } }, 'realtime.adapter'],
    [{ broker: undefined }, 'realtime.broker'],
    [{ broker: null }, 'realtime.broker'],
    [{ broker: [] }, 'realtime.broker'],
    [{ broker: 'redis' }, 'realtime.broker'],
    [{ broker: 1 }, 'realtime.broker'],
    [{ broker: {} }, 'realtime.broker.adapter'],
    [{ broker: { adapter: null } }, 'realtime.broker.adapter'],
    [{ broker: { adapter: '' } }, 'realtime.broker.adapter'],
    [{ broker: { adapter: ' ' } }, 'realtime.broker.adapter'],
    [{ broker: { adapter: 1 } }, 'realtime.broker.adapter'],
    [{ broker: { adapter: [] } }, 'realtime.broker.adapter'],
    [
      { broker: { adapter: 'inMemory', namespace: 'other' } },
      'realtime.broker.namespace',
    ],
  ])(
    'rejects malformed and legacy configuration before selecting a factory: %j',
    (config, path) => {
      const registry = createRealtimeBrokerRegistry();
      const factory = vi.fn(createInMemoryBroker);
      registry.register('redis', factory);
      // Runtime input is intentionally wider than the public TypeScript contract.
      expect(() =>
        realtimeServiceOptions(config as AppRealtimeConfig, 'app', registry),
      ).toThrow(path);
      expect(factory).not.toHaveBeenCalled();
      expect(() =>
        registry.create('inMemory', { namespace: 'app', config: {} }),
      ).not.toThrow();
    },
  );

  it('passes the complete configuration and logger without moving service settings into the broker', async () => {
    const registry = createRealtimeBrokerRegistry();
    const factory = vi.fn((_context: RealtimeBrokerFactoryContext) =>
      createInMemoryBroker(),
    );
    registry.register('extension', factory);
    const logger = { warn: vi.fn() };
    const config = {
      namespace: 'shared',
      authorizationTimeoutMs: 5000,
      sessionCheckIntervalMs: 30000,
      limits: { maxConnections: 100, maxRecentEventIds: 30 },
      broker: {
        adapter: 'extension',
        setupTimeoutMs: 5000,
        connection: { host: 'example.internal' },
      },
    };
    const options = realtimeServiceOptions(config, 'app', registry, logger);
    expect(factory).toHaveBeenCalledWith({
      namespace: 'shared',
      config,
      logger,
    });
    expect(factory.mock.calls[0]?.[0].config).toBe(config);
    expect(options).toMatchObject({
      namespace: 'shared',
      maxConnections: 100,
      maxRecentEventIds: 30,
      authorizationTimeoutMs: 5000,
      sessionCheckIntervalMs: 30000,
    });
    expect(logger.warn).not.toHaveBeenCalled();
    await options.broker?.shutdown();
  });

  it('reports both migration paths without logging credentials or adapter input', () => {
    const secret = 'private-credential-sentinel';
    expect(() =>
      realtimeServiceOptions({
        adapter: secret,
        redis: { connection: { password: secret } },
      }),
    ).toThrow(
      'realtime.redis uses the old configuration format. Move its options to realtime.broker.',
    );
    for (const config of [
      { adapter: secret, redis: { connection: { password: secret } } },
      { broker: { adapter: secret, connection: { password: secret } } },
    ]) {
      let failure: unknown;
      try {
        realtimeServiceOptions(config);
      } catch (error) {
        failure = error;
      }
      expect(failure).toBeInstanceOf(Error);
      expect(String(failure)).not.toContain(secret);
    }
  });

  it('validates merged old code defaults and new file values without choosing a precedence', async () => {
    const config = new AppConfig();
    config.load(
      {
        name: 'yaml',
        read: async () => ({
          kind: 'bytes',
          value: new TextEncoder().encode(
            'realtime:\n  broker:\n    adapter: inMemory\n',
          ),
        }),
      },
      yamlParser(),
    );
    await config.loadAll();
    config.mergeDefaults({ realtime: { adapter: 'inMemory' } });
    config.defineSections(
      defaultAppConfigs({ realtime: defineRealtimeConfig() }).sections!,
    );
    expect(await config.validate()).toContainEqual(
      expect.objectContaining({ path: 'realtime.adapter', level: 'error' }),
    );
    expect(() => realtimeServiceOptions(config.get('realtime'))).toThrow(
      'Move it to realtime.broker.adapter.',
    );
  });
  it('applies declared environment destinations over YAML and refuses legacy environment destinations', async () => {
    for (const old of [false, true]) {
      const config = new AppConfig();
      config.load(
        {
          name: 'yaml',
          read: async () => ({
            kind: 'bytes',
            value: new TextEncoder().encode(
              'realtime:\n  namespace: app\n  broker:\n    adapter: redis\n    setupTimeoutMs: 5000\n',
            ),
          }),
        },
        yamlParser(),
      );
      config.load(
        environmentProvider(
          { REALTIME_ADAPTER: 'inMemory', REALTIME_SETUP_TIMEOUT: '7000' },
          {
            mappings: {
              REALTIME_ADAPTER: envString(
                old ? 'realtime.adapter' : 'realtime.broker.adapter',
              ),
              REALTIME_SETUP_TIMEOUT: envInteger(
                'realtime.broker.setupTimeoutMs',
              ),
            },
          },
        ),
      );
      await config.loadAll();
      config.mergeDefaults({ realtime: {} });
      config.defineSections(
        defaultAppConfigs({ realtime: defineRealtimeConfig() }).sections!,
      );
      if (old) {
        expect(await config.validate()).toContainEqual(
          expect.objectContaining({ path: 'realtime.adapter' }),
        );
        expect(() => realtimeServiceOptions(config.get('realtime'))).toThrow(
          'old configuration format',
        );
      } else {
        expect(config.get('realtime.broker')).toEqual({
          adapter: 'inMemory',
          setupTimeoutMs: 7000,
        });
        expect(await config.validate()).toEqual([]);
        expect(config.publicValues()).toEqual({});
        await realtimeServiceOptions(config.get('realtime')).broker?.shutdown();
      }
    }
  });
});
