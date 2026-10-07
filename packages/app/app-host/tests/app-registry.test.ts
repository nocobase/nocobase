/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import { AppConfig } from '@nocobase/app-server/config';

import { AppRuntimeRegistry } from '../dist/app-registry.js';

const registries: AppRuntimeRegistry[] = [];

afterEach(async () => {
  await Promise.all(
    registries.splice(0).map((registry) => registry.destroyAll('test cleanup')),
  );
});

function createRegistry(events: string[]): AppRuntimeRegistry {
  const registry = new AppRuntimeRegistry({
    startEvictionLoop: false,
    resolveFactory: (definition) => async (scope) => {
      const version = definition.desiredVersion;
      events.push(`start:${version}`);
      if (version === 'broken') {
        throw new Error('replacement failed');
      }
      scope.registerDisposer('test runtime', () => {
        events.push(`stop:${version}`);
      });
      return { fetch: () => new Response(version), config: new AppConfig() };
    },
  });
  registries.push(registry);
  return registry;
}

describe('AppRuntimeRegistry runtime replacement', () => {
  it('reloads only the active App configuration without replacing its runtime', async () => {
    const config = new AppConfig();
    const reload = vi
      .spyOn(config, 'reload')
      .mockResolvedValue({ changedNamespaces: ['feature'] });
    const registry = new AppRuntimeRegistry({
      startEvictionLoop: false,
      resolveFactory: () => async () => ({
        fetch: () => new Response('ok'),
        config,
      }),
    });
    registries.push(registry);
    await registry.create('customer');
    const snapshot = registry.requireSnapshot('customer');
    await expect(registry.reloadAppConfig('customer')).resolves.toEqual({
      changedNamespaces: ['feature'],
    });
    expect(reload).toHaveBeenCalledTimes(1);
    expect(registry.requireSnapshot('customer').version).toBe(snapshot.version);
    reload.mockRejectedValueOnce(new Error('Invalid configuration'));
    await expect(registry.reloadAppConfig('customer')).rejects.toThrow(
      'Invalid configuration',
    );
    expect(registry.isActive('customer')).toBe(true);
    await registry.evict('customer');
    await expect(registry.reloadAppConfig('customer')).resolves.toBeNull();
    expect(reload).toHaveBeenCalledTimes(2);
    expect(registry.isActive('customer')).toBe(false);
  });

  it("gives an in-process App its definition's variables as its scope's environment", async () => {
    const seen: (Readonly<Record<string, string>> | undefined)[] = [];
    const registry = new AppRuntimeRegistry({
      startEvictionLoop: false,
      resolveFactory: () => async (scope) => {
        seen.push((scope as { env?: Readonly<Record<string, string>> }).env);
        return { fetch: () => new Response('ok'), config: new AppConfig() };
      },
    });
    registries.push(registry);
    await registry.create('customer', { env: { DB_PASSWORD: 'first' } });
    expect(seen).toEqual([{ DB_PASSWORD: 'first' }]);
    await registry.replaceDefinition(
      {
        ...registry.requireDefinition('customer'),
        env: { DB_PASSWORD: 'second' },
      },
      { activate: true, reason: 'new variables' },
    );
    expect(seen.at(-1)).toEqual({ DB_PASSWORD: 'second' });
  });

  it('stops the current runtime before activating its replacement', async () => {
    const events: string[] = [];
    const registry = createRegistry(events);
    await registry.create('customer', { desiredVersion: '1.0.0' });

    await registry.replaceDefinition({
      ...registry.requireDefinition('customer'),
      desiredVersion: '2.0.0',
    });

    expect(events).toEqual(['start:1.0.0', 'stop:1.0.0', 'start:2.0.0']);
    expect(registry.requireSnapshot('customer').desiredVersion).toBe('2.0.0');
  });

  it('restores the previous runtime when replacement activation fails', async () => {
    const events: string[] = [];
    const registry = createRegistry(events);
    await registry.create('customer', { desiredVersion: '1.0.0' });

    await expect(
      registry.replaceDefinition({
        ...registry.requireDefinition('customer'),
        desiredVersion: 'broken',
      }),
    ).rejects.toThrow('App "customer" failed to reload');

    expect(events).toEqual([
      'start:1.0.0',
      'stop:1.0.0',
      'start:broken',
      'start:1.0.0',
    ]);
    expect(registry.requireDefinition('customer').desiredVersion).toBe('1.0.0');
    expect(registry.requireSnapshot('customer').desiredVersion).toBe('1.0.0');
  });

  it('preserves both errors when replacement and restoration fail', async () => {
    const events: string[] = [];
    let oldVersionStarts = 0;
    const registry = new AppRuntimeRegistry({
      startEvictionLoop: false,
      resolveFactory: (definition) => async (scope) => {
        const version = definition.desiredVersion;
        events.push(`start:${version}`);
        if (
          version === 'broken' ||
          (version === '1.0.0' && oldVersionStarts++ > 0)
        ) {
          throw new Error(`${version} failed`);
        }
        scope.registerDisposer('test runtime', () => {
          events.push(`stop:${version}`);
        });
        return { fetch: () => new Response(version) };
      },
    });
    registries.push(registry);
    await registry.create('customer', { desiredVersion: '1.0.0' });

    let failure: unknown;
    try {
      await registry.replaceDefinition({
        ...registry.requireDefinition('customer'),
        desiredVersion: 'broken',
      });
    } catch (error) {
      failure = error;
    }

    // Hub serialises an error across its IPC channel as `message` alone, so both reasons have to be in that
    // string. It used to read `App "customer" failed to reload` and nothing said which version failed, or why.
    expect((failure as Error).message).toBe(
      'App "customer" failed to reload: failed to activate the replacement and restore the previous runtime (failed to initialize: broken failed; failed to initialize: 1.0.0 failed)',
    );
    expect(failure).toMatchObject({
      cause: {
        message:
          'App "customer" failed to activate the replacement and restore the previous runtime',
        errors: [
          { message: 'App "customer" failed to initialize: broken failed' },
          { message: 'App "customer" failed to initialize: 1.0.0 failed' },
        ],
      },
    });
    expect(events).toEqual([
      'start:1.0.0',
      'stop:1.0.0',
      'start:broken',
      'start:1.0.0',
    ]);
    expect(registry.isActive('customer')).toBe(false);
    expect(registry.requireDefinition('customer').desiredVersion).toBe('1.0.0');
  });
});
