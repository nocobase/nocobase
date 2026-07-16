/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';

import type { LightExtensionSyncConfigureInput, LightExtensionSyncPullInput } from '../../shared/types';
import type { ApiClientLike } from '../api/lightExtensionEntriesRequests';
import { LightExtensionSyncRequestInputError, requestLightExtensionSync } from '../api/lightExtensionSyncRequests';

describe('light-extension sync requests', () => {
  it.each([
    ['get', { repoId: 'repo-1' }],
    [
      'configure',
      {
        repoId: 'repo-1',
        provider: 'github',
        config: { owner: 'nocobase', repository: 'extensions', branch: 'main', subdirectory: null },
        authRef: '{{ $env.GITHUB_SYNC }}',
      },
    ],
    ['disconnect', { repoId: 'repo-1' }],
    ['testConnection', { repoId: 'repo-1', authRef: '{{ $env.GITHUB_SYNC }}' }],
    ['plan', { repoId: 'repo-1' }],
    [
      'pull',
      {
        repoId: 'repo-1',
        expectedHeadCommitId: 'local-1',
        expectedRemoteRevision: 'remote-1',
        expectedRemoteTargetVersion: 2,
        planFingerprint: 'plan-1',
      },
    ],
    [
      'push',
      {
        repoId: 'repo-1',
        expectedHeadCommitId: 'local-1',
        expectedRemoteRevision: 'remote-1',
        expectedRemoteTargetVersion: 2,
        planFingerprint: 'plan-1',
      },
    ],
    [
      'createFromGit',
      {
        name: 'sales',
        provider: 'github',
        config: { owner: 'nocobase', repository: 'extensions', branch: '', subdirectory: 'sales' },
      },
    ],
  ] as const)('calls only the facade action for %s', async (action, input) => {
    const request = vi.fn().mockResolvedValue({ data: { data: { ok: true } } });
    const api: ApiClientLike = { request };

    await requestLightExtensionSync(api, action, input);

    expect(request).toHaveBeenCalledWith({
      url: `lightExtensionSync:${action}`,
      method: 'post',
      data: input,
    });
    expect(request.mock.calls[0][0].url).not.toMatch(/vscFile(?:Remotes|SyncJobs|ExternalCommitMaps|Conflicts)/);
  });

  it('rejects raw or misplaced credential fields before calling the API', async () => {
    const request = vi.fn();
    const api: ApiClientLike = { request };
    const rawCredentialInput = {
      repoId: 'repo-1',
      provider: 'github',
      config: { owner: 'nocobase', repository: 'extensions', branch: 'main', subdirectory: null },
      token: 'not-allowed',
    } as unknown as LightExtensionSyncConfigureInput;

    await expect(requestLightExtensionSync(api, 'configure', rawCredentialInput)).rejects.toBeInstanceOf(
      LightExtensionSyncRequestInputError,
    );
    await expect(
      requestLightExtensionSync(api, 'plan', {
        repoId: 'repo-1',
        authRef: '{{ $env.GITHUB_SYNC }}',
      } as unknown as { repoId: string }),
    ).rejects.toBeInstanceOf(LightExtensionSyncRequestInputError);
    await expect(
      requestLightExtensionSync(api, 'configure', {
        repoId: 'repo-1',
        provider: 'github',
        config: { owner: 'nocobase', repository: 'extensions', branch: 'main', subdirectory: null },
        authRef: 'literal-value',
      }),
    ).rejects.toBeInstanceOf(LightExtensionSyncRequestInputError);
    await expect(
      requestLightExtensionSync(api, 'configure', {
        repoId: 'repo-1',
        provider: 'github',
        config: {
          owner: 'nocobase',
          repository: 'extensions',
          branch: 'main',
          subdirectory: null,
          private_key: 'not-allowed',
        },
        authRef: '{{ $env.GITHUB_SYNC }}',
      } as unknown as LightExtensionSyncConfigureInput),
    ).rejects.toBeInstanceOf(LightExtensionSyncRequestInputError);
    await expect(
      requestLightExtensionSync(api, 'configure', {
        repoId: 'repo-1',
        provider: 'github',
        config: { owner: 'nocobase', repository: 'extensions', branch: 'main', subdirectory: null },
        githubToken: 'not-allowed',
      } as unknown as LightExtensionSyncConfigureInput),
    ).rejects.toBeInstanceOf(LightExtensionSyncRequestInputError);
    await expect(
      requestLightExtensionSync(api, 'configure', {
        repoId: 'repo-1',
        provider: 'github',
        config: { owner: 'nocobase', repository: 'extensions', branch: 'main', subdirectory: null },
        authRef: '',
      }),
    ).rejects.toBeInstanceOf(LightExtensionSyncRequestInputError);
    expect(request).not.toHaveBeenCalled();
  });

  it('rejects fields outside the facade contract', async () => {
    const request = vi.fn();
    const api: ApiClientLike = { request };

    await expect(
      requestLightExtensionSync(api, 'get', {
        repoId: 'repo-1',
        internalVscRepoId: 'vsc-internal',
      } as unknown as { repoId: string }),
    ).rejects.toBeInstanceOf(LightExtensionSyncRequestInputError);
    await expect(
      requestLightExtensionSync(api, 'pull', {
        repoId: 'repo-1',
        expectedHeadCommitId: null,
        expectedRemoteRevision: null,
        expectedRemoteTargetVersion: 1,
        planFingerprint: 'plan-1',
        jobId: 'job-internal',
      } as unknown as LightExtensionSyncPullInput),
    ).rejects.toBeInstanceOf(LightExtensionSyncRequestInputError);
    expect(request).not.toHaveBeenCalled();
  });
});
