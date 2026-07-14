/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useRequest } from 'ahooks';
import { useCallback, useEffect, useState } from 'react';

import { AGENT_GATEWAY_API_ACTIONS } from '../../../../shared/apiContract';
import {
  getApiErrorMessage,
  getRequiredResponseData,
  requestAgentGatewayAction,
} from '../../../pages/AgentGatewayPageUtils';
import {
  getRunIdFromLocationSearch,
  pushRunIdInLocationSearch,
  replaceRunIdInLocationSearch,
} from '../../../pages/runs/runLocation';
import type {
  AgentGatewayPageContext,
  RunDetailTabKey,
  RunDetails,
  RunRecord,
  TFunction,
} from '../../../pages/runs/types';
import { isRunActionAllowed } from '../runShared';

interface UseRunDetailControllerOptions {
  ctx: AgentGatewayPageContext;
  t: TFunction;
  initialRunId?: string;
}

export function useRunDetailController({ ctx, t, initialRunId }: UseRunDetailControllerOptions) {
  const [open, setOpen] = useState(Boolean(initialRunId));
  const [selectedRunId, setSelectedRunId] = useState<string | undefined>(initialRunId);
  const [error, setError] = useState<string>();
  const [activeTab, setActiveTab] = useState<RunDetailTabKey>('summary');

  const resetSelectionState = useCallback(() => {
    setError(undefined);
    setActiveTab('summary');
  }, []);

  const syncFromLocation = useCallback(() => {
    const runId = getRunIdFromLocationSearch();
    resetSelectionState();
    setSelectedRunId(runId);
    setOpen(Boolean(runId));
  }, [resetSelectionState]);

  const request = useRequest(
    async (): Promise<RunDetails | null> => {
      if (!selectedRunId || !open) {
        return null;
      }
      const response = await requestAgentGatewayAction<RunRecord>(ctx.api, AGENT_GATEWAY_API_ACTIONS.getRun, {
        method: 'get',
        targetKey: selectedRunId,
      });
      const run = getRequiredResponseData(response, t('Failed to load run details'));
      return {
        run,
        conversationEvents: [],
        events: [],
        artifacts: [],
        snapshots: [],
        apiCallLogs: [],
        warnings: {},
      } satisfies RunDetails;
    },
    {
      refreshDeps: [selectedRunId, open],
      onSuccess(data) {
        if (!data?.run?.id || data.run.id !== selectedRunId) {
          return;
        }
        setError(undefined);
      },
      onError(requestError) {
        const message = getApiErrorMessage(requestError, t('Failed to load run details'));
        setError(message);
        ctx.message?.error(message);
      },
    },
  );

  const openById = useCallback(
    (runId: string) => {
      resetSelectionState();
      setSelectedRunId(runId);
      setOpen(true);
      pushRunIdInLocationSearch(runId);
    },
    [resetSelectionState],
  );

  const openRun = useCallback((run: RunRecord) => openById(run.id), [openById]);

  const close = useCallback(() => {
    resetSelectionState();
    setOpen(false);
    setSelectedRunId(undefined);
    replaceRunIdInLocationSearch();
  }, [resetSelectionState]);

  useEffect(() => {
    syncFromLocation();
    window.addEventListener('popstate', syncFromLocation);
    return () => {
      window.removeEventListener('popstate', syncFromLocation);
    };
  }, [syncFromLocation]);

  return {
    open,
    selectedRunId,
    error,
    activeTab,
    setActiveTab,
    request,
    openById,
    openRun,
    close,
  };
}
