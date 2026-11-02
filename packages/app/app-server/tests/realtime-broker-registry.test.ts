import { describe, expect, it, vi } from 'vitest';
import { ServiceContainer } from '@nocobase/service-provider';
import { createInMemoryBroker } from '@nocobase/realtime/server';
import {
  createRealtimeBrokerRegistry,
  realtimeServiceOptions,
  realtimeBrokerRegistryToken,
  realtimeServiceToken,
  RealtimeProvider,
} from '../src/realtime/index.js';

const context = { namespace: 'test', config: {} };

describe('application-local realtime brokers', () => {
  it('defaults to Memory without inspecting unused extension settings', async () => {
    const options = realtimeServiceOptions({ redis: 'not selected' }, 'app');
    expect(options.namespace).toBe('app');
    expect(realtimeServiceOptions().namespace).toBe('default');
    await options.broker?.shutdown();
  });
  it('rejects missing, duplicate, empty, and late registrations without fallback', () => {
    const registry = createRealtimeBrokerRegistry();
    expect(() => registry.register('inMemory', createInMemoryBroker)).toThrow(
      /already registered/u,
    );
    expect(() => registry.register('', createInMemoryBroker)).toThrow(
      /non-empty/u,
    );
    expect(() => registry.create('redis', context)).toThrow(/Install.*Server/u);
    expect(() => registry.register('redis', createInMemoryBroker)).toThrow(
      /too late/u,
    );
    expect(() => registry.create('inMemory', context)).toThrow(
      /already been selected/u,
    );
    expect(() => realtimeServiceOptions({ adapter: 'typo' })).toThrow(/typo/u);
    expect(() => realtimeServiceOptions({ adapter: ' ' })).toThrow(
      /non-empty/u,
    );
  });
  it('freezes even a failed factory and preserves the original failure', () => {
    const registry = createRealtimeBrokerRegistry();
    const failure = new Error('factory failed');
    const factory = vi.fn(() => {
      throw failure;
    });
    registry.register('extension', factory);
    expect(() => registry.create('extension', context)).toThrow(failure);
    expect(() => registry.create('extension', context)).toThrow(/selected/u);
    expect(factory).toHaveBeenCalledOnce();
  });
  it('keeps two providers independent, lazy, and owned by the original service token', async () => {
    const first = { container: new ServiceContainer() };
    const second = { container: new ServiceContainer() };
    const a = new RealtimeProvider(first);
    const b = new RealtimeProvider(second);
    a.register();
    b.register();
    const factory = vi.fn(createInMemoryBroker);
    for (const app of [first, second]) {
      app.container
        .resolve(realtimeBrokerRegistryToken)
        .register('extension', factory);
      expect(
        app.container.resolveIfCreated(realtimeServiceToken),
      ).toBeUndefined();
    }
    await a.start();
    await b.start();
    expect(first.container.resolve(realtimeServiceToken)).not.toBe(
      second.container.resolve(realtimeServiceToken),
    );
    expect(factory).not.toHaveBeenCalled();
    await a.shutdown();
    expect(
      second.container.resolve(realtimeServiceToken).diagnostics().brokerState,
    ).toBe('ready');
    await b.shutdown();
  });
  it('reports early service resolution instead of silently keeping Memory', async () => {
    const app = { container: new ServiceContainer() };
    const provider = new RealtimeProvider(app);
    provider.register();
    app.container.resolve(realtimeServiceToken);
    expect(() =>
      app.container
        .resolve(realtimeBrokerRegistryToken)
        .register('redis', createInMemoryBroker),
    ).toThrow(/too late/u);
    await provider.shutdown();
  });
  it('preserves the helper first two arguments and forwards extension config and logger', () => {
    const registry = createRealtimeBrokerRegistry();
    const factory = vi.fn(createInMemoryBroker);
    const config = { adapter: 'extension', redis: { connection: {} } };
    registry.register('extension', factory);
    realtimeServiceOptions(config, 'name', registry);
    expect(factory).toHaveBeenCalledWith({
      namespace: 'name',
      config,
      logger: undefined,
    });
  });
});
