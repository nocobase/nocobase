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

import type { LightExtensionSyncOperationResult } from '../../shared/types';
import { useLightExtensionSync } from '../hooks/useLightExtensionSync';
import { getOrCreateLightExtensionRuntimeCache } from '../resolvers/LightExtensionRuntimeCacheRegistry';
import { getLightExtensionSettingsDescriptorCache } from '../resolvers/LightExtensionSettingsDescriptorCache';

const mocks = vi.hoisted(() => {
  const request = vi.fn();
  return { api: { request }, request };
});

vi.mock('@nocobase/flow-engine', () => ({
  useFlowContext: () => ({ api: mocks.api }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const executionInput = {
  repoId: 'repo-1',
  expectedHeadCommitId: 'local-1',
  expectedRemoteRevision: 'remote-1',
  expectedRemoteTargetVersion: 1,
  planFingerprint: 'plan-1',
};

const operationResult: LightExtensionSyncOperationResult = {
  repo: {
    id: 'repo-1',
    name: 'sales',
    normalizedName: 'sales',
    lifecycleStatus: 'enabled',
    healthStatus: 'ready',
    headCommitId: 'local-2',
  },
  source: {
    provider: 'github',
    config: { owner: 'nocobase', repository: 'extensions', branch: 'main', subdirectory: null },
    status: 'active',
    remoteTargetVersion: 1,
    revision: 'remote-2',
    credentialConfigured: true,
    authRefDisplay: '{{ $env.GITHUB_SYNC }}',
  },
  plan: {
    state: 'in-sync',
    action: 'noop',
    reasonCode: null,
    canPull: false,
    canPush: false,
    fingerprint: 'plan-2',
    remoteTargetVersion: 1,
    local: { headCommitId: 'local-2', contentHash: 'sha256:content' },
    remote: { revision: 'remote-2', contentHash: 'sha256:content', contentHashKnown: true },
    baseline: {
      remoteTargetVersion: 1,
      lastLocalCommitId: 'local-2',
      lastRemoteRevision: 'remote-2',
      lastSyncedContentHash: 'sha256:content',
    },
  },
};

describe('useLightExtensionSync', () => {
  beforeEach(() => {
    mocks.request.mockReset();
  });

  it.each([
    [409, 'LIGHT_EXTENSION_SYNC_REMOTE_CHANGED'],
    [422, 'LIGHT_EXTENSION_SYNC_AUTH_FAILED'],
    [403, 'LIGHT_EXTENSION_PERMISSION_DENIED'],
    [429, 'LIGHT_EXTENSION_SYNC_RATE_LIMITED'],
    [502, 'LIGHT_EXTENSION_SYNC_REMOTE_UNAVAILABLE'],
  ])('preserves structured facade errors with status %s', async (status, code) => {
    mocks.request.mockRejectedValue({
      response: {
        status,
        data: { errors: [{ code, status, message: 'Safe sync error', details: { reasonCode: 'safe' } }] },
      },
    });
    const { result } = renderHook(() => useLightExtensionSync());

    await expect(result.current.plan({ repoId: 'repo-1' })).rejects.toMatchObject({
      operation: 'plan',
      code,
      status,
      message: 'Safe sync error',
      details: { reasonCode: 'safe' },
    });
  });

  it('invalidates settings and runtime caches only after Pull succeeds', async () => {
    mocks.request.mockResolvedValue({ data: { data: operationResult } });
    const descriptorCache = getLightExtensionSettingsDescriptorCache(mocks.api);
    descriptorCache.primeScope('repo-1', 'js-block', [
      {
        id: 'entry-1',
        repoId: 'repo-1',
        kind: 'js-block',
        entryName: 'sales',
        entryPath: 'src/sales.tsx',
        title: 'Sales',
        category: null,
        settingsSchema: { type: 'object' },
        settingsSchemaHash: 'schema-1',
        settingsDefaultsHash: 'defaults-1',
        runtimeCodeHash: 'runtime-1',
        runtimeAvailable: true,
      },
    ]);
    const runtimeInvalidator = {
      invalidateRepo: vi.fn(),
      clear: vi.fn(),
    };
    getOrCreateLightExtensionRuntimeCache(mocks.api, () => runtimeInvalidator);
    const { result } = renderHook(() => useLightExtensionSync());

    await act(async () => {
      await result.current.pull(executionInput);
    });

    expect(descriptorCache.get({ repoId: 'repo-1', entryId: 'entry-1', kind: 'js-block' })).toBeUndefined();
    expect(runtimeInvalidator.invalidateRepo).toHaveBeenCalledWith('repo-1');
  });

  it('does not invalidate settings or runtime caches after Push', async () => {
    mocks.request.mockResolvedValue({ data: { data: operationResult } });
    const descriptorCache = getLightExtensionSettingsDescriptorCache(mocks.api);
    descriptorCache.primeScope('repo-1', 'js-block', [
      {
        id: 'entry-1',
        repoId: 'repo-1',
        kind: 'js-block',
        entryName: 'sales',
        entryPath: 'src/sales.tsx',
        title: 'Sales',
        category: null,
        settingsSchema: { type: 'object' },
        settingsSchemaHash: 'schema-2',
        settingsDefaultsHash: 'defaults-2',
        runtimeCodeHash: 'runtime-2',
        runtimeAvailable: true,
      },
    ]);
    const runtimeInvalidator = getOrCreateLightExtensionRuntimeCache(mocks.api, () => ({
      invalidateRepo: vi.fn(),
      clear: vi.fn(),
    }));
    runtimeInvalidator.invalidateRepo.mockClear();
    const { result } = renderHook(() => useLightExtensionSync());

    await act(async () => {
      await result.current.push(executionInput);
    });

    expect(descriptorCache.get({ repoId: 'repo-1', entryId: 'entry-1', kind: 'js-block' })).toMatchObject({
      settingsSchemaHash: 'schema-2',
    });
    expect(runtimeInvalidator.invalidateRepo).not.toHaveBeenCalled();
  });
});
