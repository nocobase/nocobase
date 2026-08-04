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

import type { JsTemplateSyncOperationResult } from '../../shared/types';
import { listSelectableJsTemplates } from '../api/jsTemplatesRequests';
import { useJsTemplateSync } from '../hooks/useJsTemplateSync';
import { getOrCreateJsTemplateRuntimeCache } from '../resolvers/JsTemplateRuntimeCacheRegistry';
import { getJsTemplateSettingsDescriptorCache } from '../resolvers/JsTemplateSettingsDescriptorCache';

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
  projectId: 'jtp-1',
  expectedHeadCommitId: 'local-1',
  expectedRemoteRevision: 'remote-1',
  expectedRemoteTargetVersion: 1,
  planFingerprint: 'plan-1',
};

const operationResult: JsTemplateSyncOperationResult = {
  project: {
    id: 'jtp-1',
    name: 'sales',
    normalizedName: 'sales',
    lifecycleStatus: 'enabled',
    healthStatus: 'ready',
    headCommitId: 'local-2',
  },
  source: {
    provider: 'git',
    config: {
      url: 'https://git.example.com/nocobase/extensions.git',
      branch: 'main',
      subdirectory: null,
      transport: 'https',
    },
    status: 'active',
    remoteTargetVersion: 1,
    revision: 'remote-2',
    credentialConfigured: true,
    authRefDisplay: '********',
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

describe('useJsTemplateSync', () => {
  beforeEach(() => {
    mocks.request.mockReset();
  });

  it.each([
    [409, 'JS_TEMPLATE_SYNC_REMOTE_CHANGED'],
    [422, 'JS_TEMPLATE_SYNC_AUTH_FAILED'],
    [403, 'JS_TEMPLATE_PERMISSION_DENIED'],
    [429, 'JS_TEMPLATE_SYNC_RATE_LIMITED'],
    [502, 'JS_TEMPLATE_SYNC_REMOTE_UNAVAILABLE'],
  ])('preserves structured public API errors with status %s', async (status, code) => {
    mocks.request.mockRejectedValue({
      response: {
        status,
        data: { errors: [{ code, status, message: 'Safe sync error', details: { reasonCode: 'safe' } }] },
      },
    });
    const { result } = renderHook(() => useJsTemplateSync());

    await expect(result.current.plan({ projectId: 'jtp-1' })).rejects.toMatchObject({
      operation: 'plan',
      code,
      status,
      message: 'Safe sync error',
      details: { reasonCode: 'safe' },
    });
  });

  it('invalidates settings and runtime caches only after Pull succeeds', async () => {
    mocks.request.mockResolvedValue({ data: { data: operationResult } });
    const descriptorCache = getJsTemplateSettingsDescriptorCache(mocks.api);
    descriptorCache.primeScope('jtp-1', 'js-block', [
      {
        id: 'jtt-1',
        projectId: 'jtp-1',
        kind: 'js-block',
        templateName: 'sales',
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
      invalidateProject: vi.fn(),
      clear: vi.fn(),
    };
    getOrCreateJsTemplateRuntimeCache(mocks.api, () => runtimeInvalidator);
    const { result } = renderHook(() => useJsTemplateSync());

    await act(async () => {
      await result.current.pull(executionInput);
    });

    expect(descriptorCache.get({ projectId: 'jtp-1', templateId: 'jtt-1', kind: 'js-block' })).toBeUndefined();
    expect(runtimeInvalidator.invalidateProject).toHaveBeenCalledWith('jtp-1');
  });

  it('does not invalidate settings or runtime caches after Push', async () => {
    mocks.request.mockResolvedValue({ data: { data: operationResult } });
    const descriptorCache = getJsTemplateSettingsDescriptorCache(mocks.api);
    descriptorCache.primeScope('jtp-1', 'js-block', [
      {
        id: 'jtt-1',
        projectId: 'jtp-1',
        kind: 'js-block',
        templateName: 'sales',
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
    const runtimeInvalidator = getOrCreateJsTemplateRuntimeCache(mocks.api, () => ({
      invalidateProject: vi.fn(),
      clear: vi.fn(),
    }));
    runtimeInvalidator.invalidateProject.mockClear();
    const { result } = renderHook(() => useJsTemplateSync());

    await act(async () => {
      await result.current.push(executionInput);
    });

    expect(descriptorCache.get({ projectId: 'jtp-1', templateId: 'jtt-1', kind: 'js-block' })).toMatchObject({
      settingsSchemaHash: 'schema-2',
    });
    expect(runtimeInvalidator.invalidateProject).not.toHaveBeenCalled();
  });

  it('does not invalidate final project caches when createFromGit is only accepted', async () => {
    let catalogVersion = 0;
    mocks.request.mockImplementation((options: { url: string }) => {
      if (options.url === 'jsTemplates:listSelectable') {
        catalogVersion += 1;
        return Promise.resolve({
          data: {
            data: [
              {
                id: `jtt-${catalogVersion}`,
                projectId: 'jtp-1',
                kind: 'js-block',
                templateName: 'sales',
                entryPath: 'src/sales.tsx',
                title: null,
                category: null,
                settingsSchema: null,
                settingsSchemaHash: null,
                settingsDefaultsHash: null,
                runtimeCodeHash: 'runtime-1',
                runtimeAvailable: true,
              },
            ],
          },
        });
      }
      return Promise.resolve({ data: { data: operationResult } });
    });
    const runtimeInvalidator = getOrCreateJsTemplateRuntimeCache(mocks.api, () => ({
      invalidateProject: vi.fn(),
      clear: vi.fn(),
    }));
    runtimeInvalidator.invalidateProject.mockClear();
    const descriptorCache = getJsTemplateSettingsDescriptorCache(mocks.api);
    descriptorCache.primeScope('jtp-1', 'js-block', [
      {
        id: 'jtt-1',
        projectId: 'jtp-1',
        kind: 'js-block',
        templateName: 'sales',
        entryPath: 'src/sales.tsx',
        title: null,
        category: null,
        settingsSchema: null,
        settingsSchemaHash: null,
        settingsDefaultsHash: null,
        runtimeCodeHash: 'runtime-1',
        runtimeAvailable: true,
      },
    ]);
    const { result } = renderHook(() => useJsTemplateSync());

    await expect(listSelectableJsTemplates(mocks.api)).resolves.toMatchObject([{ id: 'jtt-1' }]);
    await act(async () => {
      await result.current.createFromGit({
        provider: 'git',
        config: {
          url: 'https://git.example.com/nocobase/extensions.git',
          branch: 'main',
          subdirectory: null,
          transport: 'https',
        },
        name: 'sales',
      });
    });

    expect(descriptorCache.get({ projectId: 'jtp-1', templateId: 'jtt-1', kind: 'js-block' })).toMatchObject({
      entryId: 'jtt-1',
    });
    expect(runtimeInvalidator.invalidateProject).not.toHaveBeenCalled();
    await expect(listSelectableJsTemplates(mocks.api)).resolves.toMatchObject([{ id: 'jtt-1' }]);
  });
});
