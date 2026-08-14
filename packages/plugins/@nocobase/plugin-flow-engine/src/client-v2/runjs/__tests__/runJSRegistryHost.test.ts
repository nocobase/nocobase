/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  RunJSEditorProviderRegistry,
  RunJSSettingsDescriptorProviderRegistryManager,
  RunJSSourceResolverRegistryManager,
} from '../runJSRegistryHost';

describe('plugin-flow-engine RunJS registry host', () => {
  it('keeps priority order and prevents an old editor disposer from deleting its replacement', () => {
    const registry = new RunJSEditorProviderRegistry();
    const disposeFirst = registry.registerProvider({ key: 'same', priority: 1, renderEditor: () => null });
    const replacement = { key: 'same', priority: 20, renderEditor: () => null };
    const disposeReplacement = registry.registerProvider(replacement);
    registry.registerProvider({ key: 'lower', priority: 10, renderEditor: () => null });

    disposeFirst();
    expect(registry.getProviders()).toEqual([replacement, expect.objectContaining({ key: 'lower' })]);

    disposeReplacement();
    expect(registry.getProviders().map((provider) => provider.key)).toEqual(['lower']);
  });

  it('normalizes source modes and keeps a replacement resolver after the old disposer runs', async () => {
    const registry = new RunJSSourceResolverRegistryManager();
    const disposeFirst = registry.registerResolver({ sourceMode: ' custom ', resolve: () => ({ code: 'first' }) });
    const replacement = { sourceMode: 'custom', resolve: vi.fn(() => ({ code: 'second' })) };
    const disposeReplacement = registry.registerResolver(replacement);

    disposeFirst();
    const resolver = registry.getResolver(' custom ');
    if (!resolver) {
      throw new Error('Expected resolver');
    }
    expect(await resolver.resolve({ sourceMode: 'custom', sourceBinding: {} })).toEqual({ code: 'second' });

    disposeReplacement();
    expect(registry.getResolver('custom')).toBeNull();
  });

  it('queries settings providers by priority and preserves the current provider across stale disposal', async () => {
    const registry = new RunJSSettingsDescriptorProviderRegistryManager();
    const disposeFirst = registry.registerProvider({
      key: 'same',
      priority: 1,
      getSettingsDescriptor: () => ({ entryId: 'first', settingsSchemaHash: null }),
    });
    const replacement = {
      key: 'same',
      priority: 30,
      getSettingsDescriptor: vi.fn(() => ({ entryId: 'replacement', settingsSchemaHash: 'hash' })),
    };
    registry.registerProvider({
      key: 'fallback',
      priority: 10,
      getSettingsDescriptor: () => ({ entryId: 'fallback', settingsSchemaHash: null }),
    });
    const disposeReplacement = registry.registerProvider(replacement);

    disposeFirst();
    await expect(registry.getSettingsDescriptor({ sourceMode: 'inline' })).resolves.toEqual({
      entryId: 'replacement',
      settingsSchemaHash: 'hash',
    });

    disposeReplacement();
    await expect(registry.getSettingsDescriptor({ sourceMode: 'inline' })).resolves.toEqual({
      entryId: 'fallback',
      settingsSchemaHash: null,
    });
  });
});
