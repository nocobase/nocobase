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
import { listSelectableLightExtensionEntries } from '../api/lightExtensionEntriesRequests';
import { getOrCreateLightExtensionRuntimeCache } from '../resolvers/LightExtensionRuntimeCacheRegistry';
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
  const runtimeInvalidator = getOrCreateLightExtensionRuntimeCache(mocks.api, () => ({
    invalidateRepo: vi.fn(),
    clear: vi.fn(),
  }));

  beforeEach(() => {
    mocks.request.mockReset();
    invalidateLightExtensionSettingsDescriptorCache(mocks.api);
    runtimeInvalidator.invalidateRepo.mockClear();
    runtimeInvalidator.clear.mockClear();
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
    expect(runtimeInvalidator.invalidateRepo).toHaveBeenLastCalledWith('repo_sales');

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
    expect(runtimeInvalidator.invalidateRepo).toHaveBeenLastCalledWith('repo_sales');

    primeDescriptor();
    await act(async () => {
      await result.current.deleteRepo('repo_sales');
    });
    expect(cache.get(BINDING)).toBeUndefined();
    expect(runtimeInvalidator.invalidateRepo).toHaveBeenCalledTimes(3);
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
    expect(runtimeInvalidator.invalidateRepo).not.toHaveBeenCalled();
  });

  it('reloads the selectable catalog after completed mutations but not accepted creation', async () => {
    let catalogVersion = 0;
    mocks.request.mockImplementation((options: { url: string }) => {
      if (options.url === 'lightExtensionEntries:listSelectable') {
        catalogVersion += 1;
        return Promise.resolve(resourceResponse([{ ...createSelectableEntry(), id: `entry-${catalogVersion}` }]));
      }
      if (options.url === 'lightExtensionRepos:create') {
        return Promise.resolve(resourceResponse(createAcceptedJob()));
      }
      return Promise.resolve(resourceResponse({ id: 'repo_sales' }));
    });
    const { result } = renderHook(() => useLightExtensionRepo());

    await expect(listSelectableLightExtensionEntries(mocks.api)).resolves.toMatchObject([{ id: 'entry-1' }]);

    await act(async () => {
      await result.current.createRepo({ name: 'sales' });
    });
    await expect(listSelectableLightExtensionEntries(mocks.api)).resolves.toMatchObject([{ id: 'entry-1' }]);

    await act(async () => {
      await result.current.updateRepo({ repoId: 'repo_sales', title: 'Sales tools' });
    });
    await expect(listSelectableLightExtensionEntries(mocks.api)).resolves.toMatchObject([{ id: 'entry-2' }]);

    await act(async () => {
      await result.current.changeLifecycle({ repoId: 'repo_sales', lifecycleStatus: 'disabled' });
    });
    await expect(listSelectableLightExtensionEntries(mocks.api)).resolves.toMatchObject([{ id: 'entry-3' }]);

    await act(async () => {
      await result.current.saveSource({
        repoId: 'repo_sales',
        expectedHeadCommitId: 'commit-1',
        message: 'Rename entry',
        files: [],
      });
    });
    await expect(listSelectableLightExtensionEntries(mocks.api)).resolves.toMatchObject([{ id: 'entry-4' }]);

    await act(async () => {
      await result.current.deleteRepo('repo_sales');
    });
    await expect(listSelectableLightExtensionEntries(mocks.api)).resolves.toMatchObject([{ id: 'entry-5' }]);
  });
});

function primeDescriptor(): void {
  getLightExtensionSettingsDescriptorCache(mocks.api).primeScope('repo_sales', 'js-block', [createSelectableEntry()]);
}

function createSelectableEntry() {
  return {
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
  } as const;
}

function createAcceptedJob() {
  return {
    id: 'lecj_sales',
    targetRepoId: 'repo_sales',
    name: 'sales',
    title: null,
    description: null,
    sourceType: 'template',
    status: 'pending',
    resultRepoId: null,
    errorCode: null,
    errorMessage: null,
    canRetry: false,
    canDismiss: false,
    startedAt: null,
    finishedAt: null,
    createdAt: '2026-07-27T00:00:00.000Z',
    updatedAt: '2026-07-27T00:00:00.000Z',
  } as const;
}

function resourceResponse<T>(data: T) {
  return {
    data: {
      data,
    },
  };
}
