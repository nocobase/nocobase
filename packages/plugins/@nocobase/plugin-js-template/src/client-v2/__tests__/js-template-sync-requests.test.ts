/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';

import type {
  JsTemplateSyncActionContract,
  JsTemplateSyncConfigureInput,
  JsTemplateSyncCreateFromGitInput,
  JsTemplateSyncPullInput,
} from '../../shared/types';
import type { ApiClientLike } from '../api/jsTemplatesRequests';
import { JsTemplateSyncRequestInputError, requestJsTemplateSync } from '../api/jsTemplateSyncRequests';

describe('js-template sync requests', () => {
  it.each([
    ['get', { projectId: 'jtp-1' } satisfies JsTemplateSyncActionContract['get']['input']],
    [
      'configure',
      {
        projectId: 'jtp-1',
        provider: 'git',
        config: gitConfig(),
        authRef: '{{ $env.GITHUB_SYNC }}',
      } satisfies JsTemplateSyncActionContract['configure']['input'],
    ],
    ['disconnect', { projectId: 'jtp-1' } satisfies JsTemplateSyncActionContract['disconnect']['input']],
    [
      'testConnection',
      {
        projectId: 'jtp-1',
        authRef: '{{ $env.GITHUB_SYNC }}',
      } satisfies JsTemplateSyncActionContract['testConnection']['input'],
    ],
    ['plan', { projectId: 'jtp-1' } satisfies JsTemplateSyncActionContract['plan']['input']],
    [
      'pull',
      {
        projectId: 'jtp-1',
        expectedHeadCommitId: 'local-1',
        expectedRemoteRevision: 'remote-1',
        expectedRemoteTargetVersion: 2,
        planFingerprint: 'plan-1',
      } satisfies JsTemplateSyncActionContract['pull']['input'],
    ],
    [
      'push',
      {
        projectId: 'jtp-1',
        expectedHeadCommitId: 'local-1',
        expectedRemoteRevision: 'remote-1',
        expectedRemoteTargetVersion: 2,
        planFingerprint: 'plan-1',
      } satisfies JsTemplateSyncActionContract['push']['input'],
    ],
    [
      'createFromGit',
      {
        idempotencyKey: 'create-sales-from-git',
        name: 'sales',
        provider: 'git',
        config: { ...gitConfig(), subdirectory: 'sales' },
        authRef: '{{ $env.GITHUB_SYNC }}',
      } satisfies JsTemplateSyncActionContract['createFromGit']['input'],
    ],
  ] as const)('calls only the public API action for %s', async (action, input) => {
    const request = vi.fn().mockResolvedValue({ data: { data: { ok: true } } });
    const api: ApiClientLike = { request };

    await requestJsTemplateSync(api, action, input);

    expect(request).toHaveBeenCalledWith({
      url: `jsTemplateSync:${action}`,
      method: 'post',
      data: input,
      skipNotify: true,
    });
    expect(request.mock.calls[0][0].url).not.toMatch(/vscFile(?:Remotes|SyncJobs|ExternalCommitMaps|Conflicts)/);
  });

  it('rejects misplaced credential fields and invalid authRef values before calling the API', async () => {
    const request = vi.fn();
    const api: ApiClientLike = { request };
    const rawCredentialInput = {
      projectId: 'jtp-1',
      provider: 'git',
      config: gitConfig(),
      token: 'not-allowed',
    } as unknown as JsTemplateSyncConfigureInput;

    await expect(requestJsTemplateSync(api, 'configure', rawCredentialInput)).rejects.toBeInstanceOf(
      JsTemplateSyncRequestInputError,
    );
    await expect(
      requestJsTemplateSync(api, 'plan', {
        projectId: 'jtp-1',
        authRef: '{{ $env.GITHUB_SYNC }}',
      } as unknown as { projectId: string }),
    ).rejects.toBeInstanceOf(JsTemplateSyncRequestInputError);
    await expect(
      requestJsTemplateSync(api, 'configure', {
        projectId: 'jtp-1',
        provider: 'git',
        config: {
          ...gitConfig(),
          private_key: 'not-allowed',
        },
        authRef: '{{ $env.GITHUB_SYNC }}',
      } as unknown as JsTemplateSyncConfigureInput),
    ).rejects.toBeInstanceOf(JsTemplateSyncRequestInputError);
    await expect(
      requestJsTemplateSync(api, 'configure', {
        projectId: 'jtp-1',
        provider: 'git',
        config: gitConfig(),
        githubToken: 'not-allowed',
      } as unknown as JsTemplateSyncConfigureInput),
    ).rejects.toBeInstanceOf(JsTemplateSyncRequestInputError);
    await expect(
      requestJsTemplateSync(api, 'configure', {
        projectId: 'jtp-1',
        provider: 'git',
        config: gitConfig(),
        authRef: 'Bearer {{ $env.GITHUB_SYNC }}',
      }),
    ).rejects.toBeInstanceOf(JsTemplateSyncRequestInputError);
    expect(request).not.toHaveBeenCalled();
  });

  it('rejects a literal credential in authRef before calling the API', async () => {
    const request = vi.fn();
    const api: ApiClientLike = { request };
    const input = {
      projectId: 'jtp-1',
      provider: 'git' as const,
      config: gitConfig(),
      authRef: 'github_pat_test_direct_123',
    };

    await expect(requestJsTemplateSync(api, 'configure', input)).rejects.toBeInstanceOf(
      JsTemplateSyncRequestInputError,
    );
    expect(request).not.toHaveBeenCalled();
  });

  it('rejects fields outside the public API contract', async () => {
    const request = vi.fn();
    const api: ApiClientLike = { request };

    await expect(
      requestJsTemplateSync(api, 'get', {
        projectId: 'jtp-1',
        internalVscRepoId: 'vsc-internal',
      } as unknown as { projectId: string }),
    ).rejects.toBeInstanceOf(JsTemplateSyncRequestInputError);
    await expect(
      requestJsTemplateSync(api, 'pull', {
        projectId: 'jtp-1',
        expectedHeadCommitId: null,
        expectedRemoteRevision: null,
        expectedRemoteTargetVersion: 1,
        planFingerprint: 'plan-1',
        jobId: 'job-internal',
      } as unknown as JsTemplateSyncPullInput),
    ).rejects.toBeInstanceOf(JsTemplateSyncRequestInputError);
    await expect(
      requestJsTemplateSync(api, 'configure', {
        projectId: 'jtp-1',
        provider: 'git',
        config: { ...gitConfig(), transport: 'https' },
      } as unknown as JsTemplateSyncConfigureInput),
    ).rejects.toBeInstanceOf(JsTemplateSyncRequestInputError);
    expect(request).not.toHaveBeenCalled();
  });

  it('accepts a Git config with an unresolved branch', async () => {
    const request = vi.fn().mockResolvedValue({ data: { data: { ok: true } } });
    const api: ApiClientLike = { request };
    const input = {
      idempotencyKey: 'create-sales-from-git-unresolved-branch',
      name: 'sales',
      provider: 'git',
      config: { ...gitConfig(), branch: null },
    } satisfies JsTemplateSyncCreateFromGitInput;

    await requestJsTemplateSync(api, 'createFromGit', input);

    expect(request).toHaveBeenCalledTimes(1);
  });
});

function gitConfig() {
  return {
    url: 'https://git.example.com/nocobase/extensions.git',
    branch: 'main',
    subdirectory: null,
  } satisfies JsTemplateSyncConfigureInput['config'];
}
