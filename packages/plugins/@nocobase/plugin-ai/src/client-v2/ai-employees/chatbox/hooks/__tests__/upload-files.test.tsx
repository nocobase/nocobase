/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createChatBoxRuntime } from '../../stores/runtime';
import { useUploadFiles, useUploadProps } from '../useUploadFiles';

const mocks = vi.hoisted(() => ({
  request: vi.fn(),
}));

vi.mock('@nocobase/client-v2', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@nocobase/client-v2')>()),
  useApp: () => ({
    apiClient: {
      request: mocks.request,
    },
  }),
}));

vi.mock('ahooks', async (importOriginal) => ({
  ...(await importOriginal<typeof import('ahooks')>()),
  useRequest: () => ({ loading: false, data: null }),
}));

describe('useUploadProps', () => {
  beforeEach(() => {
    mocks.request.mockReset();
  });

  it('uses the shared AI upload pipeline and preserves the Upload response shape', async () => {
    const source = {
      dataSourceKey: 'main',
      collectionName: 'aiFiles',
    };
    mocks.request.mockImplementation(async (options) => {
      options.onUploadProgress?.({ loaded: 50, total: 100 });
      return {
        data: {
          data: {
            id: 1,
            filename: 'report.txt',
            meta: { source },
          },
        },
      };
    });
    const onError = vi.fn();
    const onProgress = vi.fn();
    const onSuccess = vi.fn();
    const file = new File(['report'], 'report.txt', { type: 'text/plain' });
    const { result } = renderHook(() => useUploadProps({ action: 'aiFiles:create' }));

    const request = result.current.customRequest({
      action: 'aiFiles:create',
      file,
      filename: 'file',
      onError,
      onProgress,
      onSuccess,
    });

    expect(request).toEqual({ abort: expect.any(Function) });
    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith(
        {
          data: {
            id: 1,
            filename: 'report.txt',
            meta: { source },
            source,
            status: 'done',
          },
        },
        file,
      );
    });
    expect(onProgress).toHaveBeenCalledWith({ percent: 50 });
    expect(onError).not.toHaveBeenCalled();
  });

  it('stores the normalized attachment returned by the shared upload pipeline', () => {
    const runtime = createChatBoxRuntime();
    const attachment = {
      id: 1,
      filename: 'report.txt',
      source: {
        dataSourceKey: 'main',
        collectionName: 'aiFiles',
      },
      status: 'done',
    };
    const { result } = renderHook(() => useUploadFiles(runtime));

    act(() => {
      result.current.onChange({
        fileList: [
          {
            filename: 'report.txt',
            status: 'done',
            response: { data: attachment },
          },
        ],
      });
    });

    expect(runtime.chatMessageModel.getSessionState(undefined).attachments).toEqual([attachment]);
  });
});
