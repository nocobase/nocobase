/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useEffect } from 'react';

export const RUN_REALTIME_REFRESH_INTERVAL_MS = 2000;
export const RUN_DETAIL_REFRESH_INTERVAL_MS = 5000;
export const RUN_LIST_REFRESH_INTERVAL_MS = 15000;

type PollingCallback = () => void | Promise<unknown>;

export interface RunDetailPollingOptions {
  enabled: boolean;
  live: boolean;
  pollTerminalFallback: boolean;
  pollConversation: boolean;
  refreshTerminalSnapshot: PollingCallback;
  refreshConversationEvents: PollingCallback;
  refreshRunDetails: PollingCallback;
  refreshRuns: PollingCallback;
}

export function useRunDetailPolling(options: RunDetailPollingOptions) {
  const {
    enabled,
    live,
    pollTerminalFallback,
    pollConversation,
    refreshTerminalSnapshot,
    refreshConversationEvents,
    refreshRunDetails,
    refreshRuns,
  } = options;

  useEffect(() => {
    if (!enabled || !live) {
      return;
    }

    const timers: number[] = [];
    const startPolling = (callback: PollingCallback, interval: number) => {
      let inFlight = false;
      const poll = async () => {
        if (inFlight) {
          return;
        }
        inFlight = true;
        try {
          const request = callback();
          if (request) {
            await request;
          }
        } catch {
          // The request hook owns its visible error state; polling continues on the next tick.
        } finally {
          inFlight = false;
        }
      };
      timers.push(window.setInterval(poll, interval));
    };

    if (pollTerminalFallback) {
      startPolling(refreshTerminalSnapshot, RUN_REALTIME_REFRESH_INTERVAL_MS);
    }
    if (pollConversation) {
      startPolling(refreshConversationEvents, RUN_REALTIME_REFRESH_INTERVAL_MS);
    }
    startPolling(refreshRunDetails, RUN_DETAIL_REFRESH_INTERVAL_MS);
    startPolling(refreshRuns, RUN_LIST_REFRESH_INTERVAL_MS);

    return () => {
      timers.forEach((timer) => window.clearInterval(timer));
    };
  }, [
    enabled,
    live,
    pollConversation,
    pollTerminalFallback,
    refreshConversationEvents,
    refreshRunDetails,
    refreshRuns,
    refreshTerminalSnapshot,
  ]);
}
