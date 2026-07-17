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
import { useChatConversationActions } from '../useChatConversationActions';

const mocks = vi.hoisted(() => ({
  list: vi.fn(),
  unreadCounts: vi.fn(),
}));

vi.mock('@nocobase/client-v2', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@nocobase/client-v2')>()),
  useApp: () => ({
    apiClient: {
      resource: (name: string) => {
        if (name === 'aiConversations') {
          return {
            list: mocks.list,
            unreadCounts: mocks.unreadCounts,
          };
        }
        throw new Error(`Unexpected resource: ${name}`);
      },
    },
  }),
}));

describe('useChatConversationActions', () => {
  beforeEach(() => {
    mocks.list.mockReset();
    mocks.unreadCounts.mockReset();
    mocks.list.mockResolvedValue({
      data: {
        data: [],
        meta: {
          count: 0,
          page: 1,
          pageSize: 50,
          totalPage: 1,
        },
      },
    });
  });

  it('sends non-empty runtime scope through the list filter', async () => {
    const runtime = createChatBoxRuntime({ mode: 'block', scope: 'shared-sales' });
    const { result } = renderHook(() => useChatConversationActions(runtime));

    act(() => {
      result.current.runSearch('Q3');
    });

    await waitFor(() => expect(mocks.list).toHaveBeenCalled());
    expect(mocks.list).toHaveBeenCalledWith(
      expect.objectContaining({
        filter: {
          title: {
            $includes: 'Q3',
          },
          scope: 'shared-sales',
        },
      }),
    );
  });

  it('omits scope from the list filter when runtime scope is empty', async () => {
    const runtime = createChatBoxRuntime({ mode: 'block', scope: undefined });
    const { result } = renderHook(() => useChatConversationActions(runtime));

    act(() => {
      result.current.runSearch();
    });

    await waitFor(() => expect(mocks.list).toHaveBeenCalled());
    expect(mocks.list).toHaveBeenCalledWith(
      expect.objectContaining({
        filter: {},
      }),
    );
  });
});
