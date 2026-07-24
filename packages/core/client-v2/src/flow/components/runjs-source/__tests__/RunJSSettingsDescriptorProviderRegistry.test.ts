/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';

import { RunJSSettingsDescriptorProviderRegistryManager } from '../RunJSSettingsDescriptorProviderRegistry';

describe('RunJSSettingsDescriptorProviderRegistryManager', () => {
  it('uses the highest-priority matching provider and supports disposal', async () => {
    const registry = new RunJSSettingsDescriptorProviderRegistryManager();
    const fallback = vi.fn(async () => ({ entryId: 'fallback', settingsSchemaHash: null, schema: null }));
    registry.registerProvider({ key: 'fallback', getSettingsDescriptor: fallback });
    const dispose = registry.registerProvider({
      key: 'inline-light-extension',
      priority: 100,
      canHandle: (input) => input.sourceMode === 'inline',
      getSettingsDescriptor: async () => ({
        entryId: 'inline:repo_1:welcome',
        settingsSchemaHash: 'commit_1:schema_1',
        schema: { type: 'object', properties: { title: { type: 'string' } } },
        defaults: {},
      }),
    });

    await expect(registry.getSettingsDescriptor({ sourceMode: 'inline' })).resolves.toMatchObject({
      entryId: 'inline:repo_1:welcome',
    });
    expect(fallback).not.toHaveBeenCalled();

    dispose();
    await expect(registry.getSettingsDescriptor({ sourceMode: 'inline' })).resolves.toMatchObject({
      entryId: 'fallback',
    });
  });

  it('continues when a matching provider has no descriptor', async () => {
    const registry = new RunJSSettingsDescriptorProviderRegistryManager();
    registry.registerProvider({
      key: 'empty',
      priority: 100,
      getSettingsDescriptor: async () => undefined,
    });
    registry.registerProvider({
      key: 'next',
      getSettingsDescriptor: async () => ({ entryId: 'next', settingsSchemaHash: null, schema: null }),
    });

    await expect(registry.getSettingsDescriptor({ sourceMode: 'inline' })).resolves.toMatchObject({ entryId: 'next' });
  });
});
