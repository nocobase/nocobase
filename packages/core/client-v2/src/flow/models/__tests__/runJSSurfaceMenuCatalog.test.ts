/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { SubModelItem } from '@nocobase/flow-engine';
import { beforeEach, describe, expect, it, vi } from 'vitest';

type Surface = 'block' | 'action' | 'field';
type TestProvider = (input: unknown) => unknown;

const mocks = vi.hoisted(() => {
  const providers = {
    block: new Map<string, TestProvider>(),
    action: new Map<string, TestProvider>(),
    field: new Map<string, TestProvider>(),
  };
  const registrationOrder: Surface[] = [];
  const disposalOrder: Surface[] = [];
  let failingSurface: Surface | undefined;

  const register = (surface: Surface) => (key: string, provider: TestProvider) => {
    registrationOrder.push(surface);
    if (failingSurface === surface) {
      throw new Error(`failed to register ${surface}`);
    }
    providers[surface].set(key, provider);
    return () => {
      disposalOrder.push(surface);
      if (providers[surface].get(key) === provider) {
        providers[surface].delete(key);
      }
    };
  };

  return {
    providers,
    registrationOrder,
    disposalOrder,
    registerBlock: register('block'),
    registerAction: register('action'),
    registerField: register('field'),
    reset() {
      providers.block.clear();
      providers.action.clear();
      providers.field.clear();
      registrationOrder.length = 0;
      disposalOrder.length = 0;
      failingSurface = undefined;
    },
    failOn(surface: Surface) {
      failingSurface = surface;
    },
  };
});

vi.mock('../base/BlockGridModel', () => ({
  registerBlockGridSelectSceneAddBlockProvider: mocks.registerBlock,
}));

vi.mock('../base/ActionGroupModelCore', () => ({
  registerActionGroupMenuItemProvider: mocks.registerAction,
}));

vi.mock('../menuItemProviders', () => ({
  registerFieldMenuItemProvider: mocks.registerField,
}));

import { registerRunJSSurfaceMenuItemProvider } from '../runJSSurfaceMenuCatalog';

describe('runJSSurfaceMenuCatalog', () => {
  beforeEach(() => mocks.reset());

  it('registers one typed provider across block, action, and field surfaces and disposes in reverse order', async () => {
    const provider = vi.fn(({ surface }: { surface: string }) => ({ key: surface }));
    const dispose = registerRunJSSurfaceMenuItemProvider('test-provider', provider);

    expect(mocks.registrationOrder).toEqual(['block', 'action', 'field']);
    await expect(mocks.providers.block.get('test-provider')?.({ t: vi.fn() })).resolves.toEqual([{ key: 'block' }]);
    await expect(
      Promise.resolve(mocks.providers.action.get('test-provider')?.({ groupModelClass: class {}, ctx: {}, items: [] })),
    ).resolves.toEqual({ key: 'action' });
    await expect(
      Promise.resolve(
        mocks.providers.field.get('test-provider')?.({ surface: 'form-field', model: {}, ctx: {}, items: [] }),
      ),
    ).resolves.toEqual({ key: 'form-field' });
    expect(provider.mock.calls.map(([context]) => context.surface)).toEqual(['block', 'action', 'form-field']);

    dispose();

    expect(mocks.disposalOrder).toEqual(['field', 'action', 'block']);
    expect(mocks.providers.block.size).toBe(0);
    expect(mocks.providers.action.size).toBe(0);
    expect(mocks.providers.field.size).toBe(0);
  });

  it('rolls back earlier surface registrations when a later registration fails', () => {
    mocks.failOn('field');

    expect(() => registerRunJSSurfaceMenuItemProvider('test-provider', () => null)).toThrow('failed to register field');

    expect(mocks.registrationOrder).toEqual(['block', 'action', 'field']);
    expect(mocks.disposalOrder).toEqual(['action', 'block']);
    expect(mocks.providers.block.size).toBe(0);
    expect(mocks.providers.action.size).toBe(0);
    expect(mocks.providers.field.size).toBe(0);
  });

  it('does not remove later providers registered under the same key', () => {
    const dispose = registerRunJSSurfaceMenuItemProvider('shared-key', () => null);
    const laterProvider = (): SubModelItem => ({ key: 'later' });
    mocks.registerBlock('shared-key', laterProvider);
    mocks.registerAction('shared-key', laterProvider);
    mocks.registerField('shared-key', laterProvider);

    dispose();

    expect(mocks.providers.block.get('shared-key')).toBe(laterProvider);
    expect(mocks.providers.action.get('shared-key')).toBe(laterProvider);
    expect(mocks.providers.field.get('shared-key')).toBe(laterProvider);
  });
});
