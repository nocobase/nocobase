/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useLightExtensionRepo } from '../hooks/useLightExtensionRepo';
import {
  getLightExtensionSettingsDescriptorCache,
  invalidateLightExtensionSettingsDescriptorCache,
} from '../resolvers/LightExtensionSettingsDescriptorCache';

const mocks = vi.hoisted(() => {
  const request = vi.fn();
  return {
    api: { request },
    request,
  };
});

vi.mock('@nocobase/flow-engine', () => ({
  useFlowContext: () => ({ api: mocks.api }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const BINDING = {
  repoId: 'repo_sales',
  entryId: 'entry_sales',
  kind: 'js-block' as const,
};

describe('settings descriptor mutation invalidation', () => {
  beforeEach(() => {
    mocks.request.mockReset();
    invalidateLightExtensionSettingsDescriptorCache(mocks.api);
  });

  it('invalidates the repository after lifecycle, source save, and delete mutations succeed', async () => {
    mocks.request.mockResolvedValue(resourceResponse({}));
    const { result } = renderHook(() => useLightExtensionRepo());
    const cache = getLightExtensionSettingsDescriptorCache(mocks.api);

    primeDescriptor();
    await act(async () => {
      await result.current.changeLifecycle({ repoId: 'repo_sales', lifecycleStatus: 'disabled' });
    });
    expect(cache.get(BINDING)).toBeUndefined();

    primeDescriptor();
    await act(async () => {
      await result.current.saveSource({
        repoId: 'repo_sales',
        expectedHeadCommitId: 'commit-1',
        message: 'Update settings schema',
        files: [],
      });
    });
    expect(cache.get(BINDING)).toBeUndefined();

    primeDescriptor();
    await act(async () => {
      await result.current.deleteRepo('repo_sales');
    });
    expect(cache.get(BINDING)).toBeUndefined();
  });

  it('keeps the cached descriptor when a mutation fails', async () => {
    mocks.request.mockRejectedValue(new Error('save failed'));
    const { result } = renderHook(() => useLightExtensionRepo());
    const cache = getLightExtensionSettingsDescriptorCache(mocks.api);
    primeDescriptor();

    await expect(
      act(async () => {
        await result.current.saveSource({
          repoId: 'repo_sales',
          expectedHeadCommitId: 'commit-1',
          message: 'Update settings schema',
          files: [],
        });
      }),
    ).rejects.toThrow('Light extension request failed');
    expect(cache.get(BINDING)).toMatchObject({ settingsSchemaHash: 'schema-v1' });
  });
});

function primeDescriptor(): void {
  getLightExtensionSettingsDescriptorCache(mocks.api).primeScope('repo_sales', 'js-block', [
    {
      id: 'entry_sales',
      repoId: 'repo_sales',
      kind: 'js-block',
      entryName: 'sales-kpi',
      entryPath: 'src/sales-kpi/index.tsx',
      title: 'Sales KPI',
      category: null,
      settingsSchema: {
        type: 'object',
        properties: {
          message: { type: 'string', default: 'Hello' },
        },
      },
      settingsSchemaHash: 'schema-v1',
      settingsDefaultsHash: 'defaults-v1',
      runtimeCodeHash: 'runtime-v1',
      runtimeAvailable: true,
    },
  ]);
}

function resourceResponse<T>(data: T) {
  return {
    data: {
      data,
    },
  };
}
