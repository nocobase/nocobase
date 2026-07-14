/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useRequest } from 'ahooks';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Dispatch, MutableRefObject, SetStateAction } from 'react';

import { AGENT_GATEWAY_API_ACTIONS } from '../../../../shared/apiContract';
import type { RunEventRecord } from '../../../hooks/useRunObservabilityDetails';
import { useTerminalStream } from '../../../hooks/useTerminalStream';
import {
  getApiErrorMessage,
  getRequiredResponseData,
  getResponseData,
  requestAgentGatewayAction,
} from '../../../pages/AgentGatewayPageUtils';
import { isLiveRunStatus } from '../../../pages/runs/runFormatters';
import type {
  AgentGatewayPageContext,
  ControlRequestResult,
  ControlRequestState,
  ControlRequestStatusPoll,
  RunDetailTabKey,
  RunRecord,
  TFunction,
  TerminalSnapshot,
  TerminalSnapshotState,
} from '../../../pages/runs/types';
import { useActiveRunDetailRequests } from './useActiveRunDetailRequests';
import { useRunDetailPolling } from './useRunDetailPolling';
import { isRunActionAllowed } from '../runShared';
import {
  createControlIdempotencyKey,
  createUnsupportedTerminalSnapshot,
  getRunCapability,
  isFinalControlStatus,
  shouldResetControlIdempotencyKey,
} from '../terminal/TerminalPanel';

interface UseRunTerminalControllerOptions {
  ctx: AgentGatewayPageContext;
  t: TFunction;
  activeTab: RunDetailTabKey;
  detailOpen: boolean;
  selectedRunId?: string;
  runDetailsError?: string;
  run?: RunRecord;
  runEvents?: RunEventRecord[];
  refreshConversationEvents(): void;
  refreshRunDetails(): void;
  refreshRuns(): void;
}

interface UseTerminalControlRequestOptions {
  ctx: AgentGatewayPageContext;
  t: TFunction;
  selectedRunIdRef: MutableRefObject<string | undefined>;
  setControlRequestState: Dispatch<SetStateAction<ControlRequestState | null>>;
  getControlIdempotencyKey(action: 'interrupt' | 'terminate', runId: string): string;
  resetControlIdempotencyKey(action: 'interrupt' | 'terminate'): void;
  refreshTerminalSnapshot(): void;
  refreshRunDetails(): void;
  refreshRuns(): void;
  notifyControl(controlRequestId: string): boolean;
}

function useTerminalControlRequest(
  action: 'interrupt' | 'terminate',
  {
    ctx,
    t,
    selectedRunIdRef,
    setControlRequestState,
    getControlIdempotencyKey,
    resetControlIdempotencyKey,
    refreshTerminalSnapshot,
    refreshRunDetails,
    refreshRuns,
    notifyControl,
  }: UseTerminalControlRequestOptions,
) {
  return useRequest(
    async (runId: string) => {
      if (!runId) {
        return null;
      }
      const response = await requestAgentGatewayAction<ControlRequestResult>(
        ctx.api,
        action === 'interrupt'
          ? AGENT_GATEWAY_API_ACTIONS.interruptTerminal
          : AGENT_GATEWAY_API_ACTIONS.terminateTerminal,
        {
          method: 'post',
          targetKey: runId,
          data: { idempotencyKey: getControlIdempotencyKey(action, runId) },
        },
      );
      return { runId, result: getResponseData(response, {}) };
    },
    {
      manual: true,
      onSuccess(payload) {
        if (!payload || selectedRunIdRef.current !== payload.runId) {
          return;
        }
        const status = payload.result.controlRequestStatus || 'accepted';
        setControlRequestState({
          action,
          runId: payload.runId,
          status,
          controlRequestId: payload.result.controlRequestId,
        });
        if (payload.result.controlRequestId) {
          notifyControl(payload.result.controlRequestId);
        }
        if (isFinalControlStatus(status)) {
          resetControlIdempotencyKey(action);
        }
        refreshTerminalSnapshot();
        if (action === 'terminate') {
          refreshRuns();
        }
        refreshRunDetails();
        ctx.message?.success(t('Control request accepted'));
      },
      onError(error) {
        if (shouldResetControlIdempotencyKey(error)) {
          resetControlIdempotencyKey(action);
        }
        ctx.message?.error(
          getApiErrorMessage(
            error,
            action === 'interrupt' ? t('Failed to interrupt terminal') : t('Failed to terminate terminal'),
          ),
        );
      },
    },
  );
}

export function useRunTerminalController({
  ctx,
  t,
  activeTab,
  detailOpen,
  selectedRunId,
  runDetailsError,
  run,
  runEvents,
  refreshConversationEvents,
  refreshRunDetails,
  refreshRuns,
}: UseRunTerminalControllerOptions) {
  const [snapshotState, setSnapshotState] = useState<TerminalSnapshotState | null>(null);
  const [controlRequestState, setControlRequestState] = useState<ControlRequestState | null>(null);
  const controlIdempotencyKeysRef = useRef<Partial<Record<'interrupt' | 'terminate', { runId: string; key: string }>>>(
    {},
  );
  const selectedRunIdRef = useRef(selectedRunId);
  const notifyControlRef = useRef<(controlRequestId: string) => boolean>(() => false);
  const notifyControl = useCallback((controlRequestId: string) => notifyControlRef.current(controlRequestId), []);

  const snapshotRequest = useRequest(
    async (requestRunId: string) => {
      if (requestRunId !== selectedRunIdRef.current || !detailOpen || runDetailsError || run?.id !== requestRunId) {
        return null;
      }
      if (!isRunActionAllowed(run.agentGatewayActionPermissionsJson, 'readTerminal')) {
        return null;
      }
      if (!getRunCapability(run, 'terminalOutput')) {
        return {
          runId: run.id,
          snapshot: createUnsupportedTerminalSnapshot(run),
        } satisfies TerminalSnapshotState;
      }
      const response = await requestAgentGatewayAction<TerminalSnapshot | null>(
        ctx.api,
        AGENT_GATEWAY_API_ACTIONS.getTerminalSnapshot,
        {
          method: 'get',
          targetKey: requestRunId,
        },
      );
      return {
        runId: requestRunId,
        snapshot: getResponseData(response, null),
      } satisfies TerminalSnapshotState;
    },
    {
      manual: true,
      onSuccess(data) {
        if (data?.runId === selectedRunIdRef.current) {
          setSnapshotState(data);
        }
      },
      onError(error, [requestRunId]) {
        if (requestRunId !== selectedRunIdRef.current) {
          return;
        }
        setSnapshotState(null);
        ctx.message?.error(getApiErrorMessage(error, t('Failed to load terminal')));
      },
    },
  );
  const runSnapshotRequest = snapshotRequest.run;
  const refreshTerminalSnapshot = useCallback(() => {
    const runId = selectedRunIdRef.current;
    if (runId) {
      runSnapshotRequest(runId);
    }
  }, [runSnapshotRequest]);

  const getControlIdempotencyKey = useCallback((action: 'interrupt' | 'terminate', runId: string) => {
    const existing = controlIdempotencyKeysRef.current[action];
    if (existing?.runId === runId) {
      return existing.key;
    }
    const key = createControlIdempotencyKey(action, runId);
    controlIdempotencyKeysRef.current[action] = { runId, key };
    return key;
  }, []);
  const resetControlIdempotencyKey = useCallback((action: 'interrupt' | 'terminate') => {
    delete controlIdempotencyKeysRef.current[action];
  }, []);

  const controlRequestOptions = {
    ctx,
    t,
    selectedRunIdRef,
    setControlRequestState,
    getControlIdempotencyKey,
    resetControlIdempotencyKey,
    refreshTerminalSnapshot,
    refreshRunDetails,
    refreshRuns,
    notifyControl,
  };
  const interruptRequest = useTerminalControlRequest('interrupt', controlRequestOptions);
  const terminateRequest = useTerminalControlRequest('terminate', controlRequestOptions);

  const refreshControlRequestStatus = useCallback(
    async (poll: ControlRequestStatusPoll) => {
      const response = await requestAgentGatewayAction<ControlRequestResult>(
        ctx.api,
        AGENT_GATEWAY_API_ACTIONS.getControlRequestStatus,
        {
          method: 'get',
          targetKey: poll.runId,
          params: { requestId: poll.controlRequestId },
        },
      );
      const result = getResponseData(response, {});
      if (result.controlRequestId !== poll.controlRequestId || !result.controlRequestStatus) {
        return;
      }
      setControlRequestState((previous) =>
        previous?.controlRequestId === result.controlRequestId && previous.runId === poll.runId
          ? previous.status === result.controlRequestStatus
            ? previous
            : { ...previous, status: result.controlRequestStatus }
          : previous,
      );
      if (isFinalControlStatus(result.controlRequestStatus)) {
        resetControlIdempotencyKey(poll.action);
      }
    },
    [ctx.api, resetControlIdempotencyKey],
  );

  const canReadTerminal = isRunActionAllowed(run?.agentGatewayActionPermissionsJson, 'readTerminal');
  const canStreamTerminal =
    activeTab === 'agent-sessions' &&
    canReadTerminal &&
    isLiveRunStatus(run?.status) &&
    Boolean(run && getRunCapability(run, 'terminalOutput'));
  const createStreamTicket = useCallback(
    async (runId: string) => {
      const response = await requestAgentGatewayAction<{
        ticket: string;
        runId?: string;
        protocols?: string[];
        expiresAt?: string;
      }>(ctx.api, AGENT_GATEWAY_API_ACTIONS.createTerminalStreamTicket, {
        method: 'post',
        targetKey: runId,
      });
      return getRequiredResponseData(response, t('Failed to create terminal stream ticket'));
    },
    [ctx.api, t],
  );
  const stream = useTerminalStream({
    runId: selectedRunId,
    enabled: detailOpen && canStreamTerminal && run?.id === selectedRunId,
    createStreamTicket,
  });
  notifyControlRef.current = stream.notifyControl;
  const streamFallbackActive =
    canStreamTerminal && (stream.connectionState !== 'live' || Boolean(stream.lastErrorCode));
  const pollingEnabled = Boolean(detailOpen && selectedRunId && !runDetailsError && run?.id === selectedRunId);
  const pollTerminalFallback =
    activeTab === 'agent-sessions' &&
    canReadTerminal &&
    Boolean(run && getRunCapability(run, 'terminalOutput')) &&
    streamFallbackActive;
  const pollConversation =
    activeTab === 'summary' && isRunActionAllowed(run?.agentGatewayActionPermissionsJson, 'readSessionMessages');

  useRunDetailPolling({
    enabled: pollingEnabled,
    live: isLiveRunStatus(run?.status),
    pollTerminalFallback,
    pollConversation,
    refreshTerminalSnapshot,
    refreshConversationEvents,
    refreshRunDetails,
    refreshRuns,
  });
  useActiveRunDetailRequests({
    activeTab,
    detailOpen,
    selectedRunId,
    refreshConversationEvents,
    refreshTerminalSnapshot,
    runDetailsError,
    run,
    setTerminalSnapshotState: setSnapshotState,
    terminalStreamFallbackActive: streamFallbackActive,
  });

  useEffect(() => {
    selectedRunIdRef.current = selectedRunId;
    setSnapshotState(null);
    setControlRequestState(null);
    controlIdempotencyKeysRef.current = {};
  }, [selectedRunId]);

  useEffect(() => {
    if (!controlRequestState?.controlRequestId || isFinalControlStatus(controlRequestState.status)) {
      return;
    }
    const poll = {
      action: controlRequestState.action,
      runId: controlRequestState.runId,
      controlRequestId: controlRequestState.controlRequestId,
    };
    const runPoll = () => {
      refreshControlRequestStatus(poll).catch(() => {
        // Keep the accepted state visible; the next interval can retry.
      });
    };
    if (controlRequestState.status === 'accepted') {
      runPoll();
    }
    const timer = window.setInterval(runPoll, 2000);
    return () => window.clearInterval(timer);
  }, [
    controlRequestState?.action,
    controlRequestState?.controlRequestId,
    controlRequestState?.runId,
    controlRequestState?.status,
    refreshControlRequestStatus,
  ]);

  useEffect(() => {
    if (!controlRequestState?.controlRequestId || controlRequestState.runId !== run?.id) {
      return;
    }
    const nextStatus = (runEvents || []).reduce<ControlRequestState['status'] | null>((status, event) => {
      if (
        event.contentJson?.controlRequestId !== controlRequestState.controlRequestId ||
        event.source !== 'terminal-control'
      ) {
        return status;
      }
      const eventType = event.eventType || '';
      if (eventType.endsWith('.succeeded')) {
        return 'succeeded';
      }
      if (eventType.endsWith('.failed')) {
        return 'failed';
      }
      if (eventType.endsWith('.delivered') && status !== 'succeeded' && status !== 'failed') {
        return 'delivered';
      }
      return status;
    }, null);
    if (!nextStatus || nextStatus === controlRequestState.status) {
      return;
    }
    setControlRequestState({ ...controlRequestState, status: nextStatus });
    if (isFinalControlStatus(nextStatus)) {
      resetControlIdempotencyKey(controlRequestState.action);
    }
  }, [controlRequestState, resetControlIdempotencyKey, run?.id, runEvents]);

  return {
    snapshot:
      canReadTerminal && !runDetailsError && snapshotState?.runId === selectedRunId ? snapshotState.snapshot : null,
    snapshotRequest,
    stream,
    controlRequestState,
    interruptRequest,
    terminateRequest,
    refreshTerminalSnapshot,
    notifyControl,
    canReadTerminal,
  };
}
