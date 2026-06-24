/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  type UseVscFileRepoResult,
  VscFileRepoHookError,
  type VscFileRepoDiffFileInput,
  type VscFileRepoDiffInput,
  type VscFileRepoDraftInput,
  type VscFileRepoGetFileInput,
  type VscFileRepoListCommitsInput,
  type VscFileRepoListRefsInput,
  type VscFileRepoOperation,
  type VscFileRepoPullInput,
  type VscFileRepoPushInput,
  type VscFileRepoRestoreCommitInput,
  type VscFileRepoRestoreFileInput,
  type VscFileRepoSaveDraftInput,
  type VscFileRepoUpdateRefInput,
  useVscFileRepo,
} from '../useVscFileRepo';

const mocks = vi.hoisted(() => ({
  request: vi.fn(),
  translate: vi.fn((key: string) => `translated:${key}`),
}));

vi.mock('@nocobase/flow-engine', () => ({
  tExpr: (key: string) => key,
  useFlowContext: () => ({
    api: {
      request: mocks.request,
    },
  }),
  useFlowEngine: () => ({
    context: {
      t: mocks.translate,
    },
  }),
}));

const repoInput = {
  repoId: 'repo-1',
} satisfies VscFileRepoDraftInput;

const pullInput = {
  repoId: 'repo-1',
  includeContent: 'selected',
  selectedPaths: ['README.md'],
} satisfies VscFileRepoPullInput;

const getFileInput = {
  repoId: 'repo-1',
  path: 'README.md',
} satisfies VscFileRepoGetFileInput;

const saveDraftInput = {
  repoId: 'repo-1',
  baseCommitId: 'commit-1',
  files: [
    {
      path: 'README.md',
      operation: 'upsert',
      content: '# test',
    },
  ],
} satisfies VscFileRepoSaveDraftInput;

const pushInput = {
  repoId: 'repo-1',
  baseCommitId: 'commit-1',
  message: 'Update README',
  files: [
    {
      path: 'README.md',
      content: '# test',
    },
  ],
} satisfies VscFileRepoPushInput;

const listCommitsInput = {
  repoId: 'repo-1',
} satisfies VscFileRepoListCommitsInput;

const diffInput = {
  repoId: 'repo-1',
  fromCommitId: 'commit-1',
  toCommitId: 'commit-2',
} satisfies VscFileRepoDiffInput;

const diffFileInput = {
  repoId: 'repo-1',
  from: {
    type: 'commit',
    commitId: 'commit-1',
    path: 'README.md',
  },
  to: null,
} satisfies VscFileRepoDiffFileInput;

const restoreFileInput = {
  repoId: 'repo-1',
  sourceCommitId: 'commit-1',
  path: 'README.md',
} satisfies VscFileRepoRestoreFileInput;

const restoreCommitInput = {
  repoId: 'repo-1',
  sourceCommitId: 'commit-1',
} satisfies VscFileRepoRestoreCommitInput;

const listRefsInput = {
  repoId: 'repo-1',
} satisfies VscFileRepoListRefsInput;

const updateRefInput = {
  repoId: 'repo-1',
  name: 'published',
  targetCommitId: 'commit-2',
  basePublishedCommitId: 'commit-1',
} satisfies VscFileRepoUpdateRefInput;

type HookCallCase = {
  operation: VscFileRepoOperation;
  input: unknown;
  call: (hook: UseVscFileRepoResult) => Promise<unknown>;
};

const hookCallCases: HookCallCase[] = [
  {
    operation: 'pull',
    input: pullInput,
    call: (hook) => hook.pull(pullInput),
  },
  {
    operation: 'getFile',
    input: getFileInput,
    call: (hook) => hook.getFile(getFileInput),
  },
  {
    operation: 'saveDraft',
    input: saveDraftInput,
    call: (hook) => hook.saveDraft(saveDraftInput),
  },
  {
    operation: 'getDraft',
    input: repoInput,
    call: (hook) => hook.getDraft(repoInput),
  },
  {
    operation: 'discardDraft',
    input: repoInput,
    call: (hook) => hook.discardDraft(repoInput),
  },
  {
    operation: 'diffDraft',
    input: repoInput,
    call: (hook) => hook.diffDraft(repoInput),
  },
  {
    operation: 'push',
    input: pushInput,
    call: (hook) => hook.push(pushInput),
  },
  {
    operation: 'listCommits',
    input: listCommitsInput,
    call: (hook) => hook.listCommits(listCommitsInput),
  },
  {
    operation: 'diff',
    input: diffInput,
    call: (hook) => hook.diff(diffInput),
  },
  {
    operation: 'diffFile',
    input: diffFileInput,
    call: (hook) => hook.diffFile(diffFileInput),
  },
  {
    operation: 'restoreFile',
    input: restoreFileInput,
    call: (hook) => hook.restoreFile(restoreFileInput),
  },
  {
    operation: 'restoreCommit',
    input: restoreCommitInput,
    call: (hook) => hook.restoreCommit(restoreCommitInput),
  },
  {
    operation: 'listRefs',
    input: listRefsInput,
    call: (hook) => hook.listRefs(listRefsInput),
  },
  {
    operation: 'updateRef',
    input: updateRefInput,
    call: (hook) => hook.updateRef(updateRefInput),
  },
];

describe('useVscFileRepo', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('calls every repository operation through the vscFile resource action URL', async () => {
    const { result } = renderHook(() => useVscFileRepo());

    for (const hookCallCase of hookCallCases) {
      const responseData = { operation: hookCallCase.operation };
      mocks.request.mockResolvedValueOnce({
        data: {
          data: responseData,
        },
      });

      let actual: unknown;
      await act(async () => {
        actual = await hookCallCase.call(result.current);
      });

      expect(actual).toEqual(responseData);
      expect(mocks.request).toHaveBeenLastCalledWith({
        url: `vscFile:${hookCallCase.operation}`,
        method: 'post',
        data: hookCallCase.input,
      });
    }
  });

  it('tracks loading state per operation', async () => {
    const deferred = createDeferred<{ data: { data: { ok: boolean } } }>();
    mocks.request.mockReturnValueOnce(deferred.promise);
    const { result } = renderHook(() => useVscFileRepo());
    let pendingRequest: Promise<unknown> = Promise.resolve();

    act(() => {
      pendingRequest = result.current.pull(pullInput);
    });

    expect(result.current.loading.pull).toBe(true);
    expect(result.current.isLoading('pull')).toBe(true);
    expect(result.current.isLoading('push')).toBe(false);

    await act(async () => {
      deferred.resolve({
        data: {
          data: {
            ok: true,
          },
        },
      });
      await pendingRequest;
    });

    expect(result.current.loading.pull).toBe(false);
    expect(result.current.isLoading('pull')).toBe(false);
  });

  it('keeps same-operation concurrent requests isolated', async () => {
    const firstDeferred = createDeferred<{ data: { data: { ok: string } } }>();
    const secondDeferred = createDeferred<{ data: { data: { ok: string } } }>();
    mocks.request.mockReturnValueOnce(firstDeferred.promise).mockReturnValueOnce(secondDeferred.promise);
    const { result } = renderHook(() => useVscFileRepo());
    let firstRequest: Promise<unknown> = Promise.resolve();
    let secondRequest: Promise<unknown> = Promise.resolve();

    act(() => {
      firstRequest = result.current.pull(pullInput);
      secondRequest = result.current.pull({
        ...pullInput,
        knownTreeHash: 'newer-known-tree',
      });
    });

    expect(result.current.isLoading('pull')).toBe(true);

    await act(async () => {
      firstDeferred.reject({
        response: {
          data: {
            errors: [
              {
                code: 'NO_CHANGES',
                message: 'Older request failed',
                status: 409,
              },
            ],
          },
        },
      });
      try {
        await firstRequest;
      } catch {
        // The older request rejects for its caller but must not overwrite hook state.
      }
    });

    expect(result.current.isLoading('pull')).toBe(true);
    expect(result.current.getError('pull')).toBeNull();

    await act(async () => {
      secondDeferred.resolve({
        data: {
          data: {
            ok: 'second',
          },
        },
      });
      await secondRequest;
    });

    expect(result.current.isLoading('pull')).toBe(false);
    expect(result.current.getError('pull')).toBeNull();
  });

  it('preserves server error codes and details in hook state', async () => {
    mocks.request.mockRejectedValueOnce({
      response: {
        status: 403,
        data: {
          errors: [
            {
              code: 'PERMISSION_DENIED',
              message: 'Draft user does not match the current user',
              status: 403,
              details: {
                action: 'saveDraft',
              },
            },
          ],
        },
      },
    });
    const { result } = renderHook(() => useVscFileRepo());

    let caughtError: unknown;
    await act(async () => {
      try {
        await result.current.saveDraft(saveDraftInput);
      } catch (error) {
        caughtError = error;
      }
    });

    expect(caughtError).toBeInstanceOf(VscFileRepoHookError);
    expect(result.current.errors.saveDraft).toBe(caughtError);
    expect(result.current.getError('saveDraft')).toMatchObject({
      operation: 'saveDraft',
      code: 'PERMISSION_DENIED',
      status: 403,
      message: 'Draft user does not match the current user',
      details: {
        action: 'saveDraft',
      },
    });
  });

  it('uses the plugin translation as the fallback request error message', async () => {
    mocks.request.mockRejectedValueOnce(new Error('Network Error'));
    const { result } = renderHook(() => useVscFileRepo());

    await act(async () => {
      try {
        await result.current.pull(pullInput);
      } catch {
        // The hook stores the normalized translated error in state.
      }
    });

    expect(result.current.errors.pull?.message).toBe('translated:VSC file request failed');
    expect(mocks.translate).toHaveBeenCalledWith('VSC file request failed', {
      ns: ['@nocobase/plugin-vsc-file', 'client'],
    });
  });

  it('clears operation errors', async () => {
    mocks.request.mockRejectedValueOnce({
      response: {
        data: {
          errors: [
            {
              code: 'NO_CHANGES',
              message: 'Push does not change the repository tree',
              status: 409,
            },
          ],
        },
      },
    });
    const { result } = renderHook(() => useVscFileRepo());

    await act(async () => {
      try {
        await result.current.push(pushInput);
      } catch {
        // Expected for this test.
      }
    });

    expect(result.current.getError('push')?.code).toBe('NO_CHANGES');

    act(() => {
      result.current.clearError('push');
    });

    expect(result.current.getError('push')).toBeNull();
  });
});

function createDeferred<T>() {
  let resolvePromise: (value: T) => void = () => {};
  let rejectPromise: (reason: unknown) => void = () => {};
  const promise = new Promise<T>((resolve, reject) => {
    resolvePromise = resolve;
    rejectPromise = reject;
  });

  return {
    promise,
    resolve: resolvePromise,
    reject: rejectPromise,
  };
}
