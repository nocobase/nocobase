/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  RUN_DETAIL_REFRESH_INTERVAL_MS,
  RUN_LIST_REFRESH_INTERVAL_MS,
  RUN_REALTIME_REFRESH_INTERVAL_MS,
  useRunDetailPolling,
} from '../../features/runs/hooks/useRunDetailPolling';

function createOptions() {
  return {
    enabled: true,
    live: true,
    pollTerminalFallback: false,
    pollConversation: false,
    refreshTerminalSnapshot: vi.fn(),
    refreshConversationEvents: vi.fn(),
    refreshRunDetails: vi.fn(),
    refreshRuns: vi.fn(),
  };
}

describe('useRunDetailPolling', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('uses websocket output without snapshot polling until fallback is active', () => {
    const options = createOptions();
    const { rerender } = renderHook((props) => useRunDetailPolling(props), {
      initialProps: options,
    });

    act(() => {
      vi.advanceTimersByTime(RUN_REALTIME_REFRESH_INTERVAL_MS);
    });
    expect(options.refreshTerminalSnapshot).not.toHaveBeenCalled();

    rerender({ ...options, pollTerminalFallback: true });
    act(() => {
      vi.advanceTimersByTime(RUN_REALTIME_REFRESH_INTERVAL_MS);
    });
    expect(options.refreshTerminalSnapshot).toHaveBeenCalledTimes(1);
  });

  it('polls only the selected conversation surface at realtime frequency', () => {
    const options = { ...createOptions(), pollConversation: true };
    renderHook(() => useRunDetailPolling(options));

    act(() => {
      vi.advanceTimersByTime(RUN_REALTIME_REFRESH_INTERVAL_MS);
    });
    expect(options.refreshConversationEvents).toHaveBeenCalledTimes(1);
    expect(options.refreshTerminalSnapshot).not.toHaveBeenCalled();
  });

  it('refreshes selected run details more often than the whole run list', () => {
    const options = createOptions();
    renderHook(() => useRunDetailPolling(options));

    act(() => {
      vi.advanceTimersByTime(RUN_DETAIL_REFRESH_INTERVAL_MS);
    });
    expect(options.refreshRunDetails).toHaveBeenCalledTimes(1);
    expect(options.refreshRuns).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(RUN_LIST_REFRESH_INTERVAL_MS - RUN_DETAIL_REFRESH_INTERVAL_MS);
    });
    expect(options.refreshRunDetails).toHaveBeenCalledTimes(3);
    expect(options.refreshRuns).toHaveBeenCalledTimes(1);
  });

  it('stops polling for settled runs and closed details', () => {
    const options = createOptions();
    const { rerender } = renderHook((props) => useRunDetailPolling(props), {
      initialProps: options,
    });

    rerender({ ...options, live: false });
    act(() => {
      vi.advanceTimersByTime(RUN_LIST_REFRESH_INTERVAL_MS);
    });
    expect(options.refreshRunDetails).not.toHaveBeenCalled();
    expect(options.refreshRuns).not.toHaveBeenCalled();

    rerender({ ...options, enabled: false, live: true });
    act(() => {
      vi.advanceTimersByTime(RUN_LIST_REFRESH_INTERVAL_MS);
    });
    expect(options.refreshRunDetails).not.toHaveBeenCalled();
    expect(options.refreshRuns).not.toHaveBeenCalled();
  });

  it('does not overlap a slow poll and resumes after it settles', async () => {
    let resolveRequest: (() => void) | undefined;
    const request = new Promise<void>((resolve) => {
      resolveRequest = resolve;
    });
    const options = {
      ...createOptions(),
      refreshRunDetails: vi.fn(() => request),
    };
    renderHook(() => useRunDetailPolling(options));

    act(() => {
      vi.advanceTimersByTime(RUN_DETAIL_REFRESH_INTERVAL_MS * 2);
    });
    expect(options.refreshRunDetails).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveRequest?.();
      await request;
    });
    act(() => {
      vi.advanceTimersByTime(RUN_DETAIL_REFRESH_INTERVAL_MS);
    });
    expect(options.refreshRunDetails).toHaveBeenCalledTimes(2);
  });
});
