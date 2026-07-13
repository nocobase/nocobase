/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useEffect, useRef } from 'react';
import type { Dispatch, SetStateAction } from 'react';

import type { RunDetailTabKey, RunRecord, TerminalSnapshotState } from '../../../pages/runs/types';
import { isLiveRunStatus } from '../../../pages/runs/runFormatters';
import { isRunActionAllowed } from '../runShared';
import { createUnsupportedTerminalSnapshot, getRunCapability } from '../terminal/TerminalPanel';

interface UseActiveRunDetailRequestsOptions {
  activeTab: RunDetailTabKey;
  detailOpen: boolean;
  selectedRunId?: string;
  runDetailsError?: string;
  run?: RunRecord;
  terminalStreamFallbackActive: boolean;
  refreshConversationEvents(): void;
  refreshTerminalSnapshot(): void;
  setTerminalSnapshotState: Dispatch<SetStateAction<TerminalSnapshotState | null>>;
}

export function useActiveRunDetailRequests({
  activeTab,
  detailOpen,
  selectedRunId,
  runDetailsError,
  run,
  terminalStreamFallbackActive,
  refreshConversationEvents,
  refreshTerminalSnapshot,
  setTerminalSnapshotState,
}: UseActiveRunDetailRequestsOptions) {
  const terminalSnapshotRequestKeyRef = useRef<string>();

  useEffect(() => {
    if (!detailOpen || !selectedRunId || runDetailsError || run?.id !== selectedRunId) {
      terminalSnapshotRequestKeyRef.current = undefined;
      return;
    }
    const actionPermissions = run.agentGatewayActionPermissionsJson || {};
    const canRequestTerminal = activeTab === 'agent-sessions' && isRunActionAllowed(actionPermissions, 'readTerminal');
    const terminalOutputSupported = getRunCapability(run, 'terminalOutput');
    const canRequestConversation =
      activeTab === 'summary' && isRunActionAllowed(actionPermissions, 'readSessionMessages');

    if (!canRequestTerminal) {
      terminalSnapshotRequestKeyRef.current = undefined;
    } else if (!terminalOutputSupported) {
      terminalSnapshotRequestKeyRef.current = `${run.id}:unsupported`;
      setTerminalSnapshotState((previous) => {
        if (previous?.runId === run.id && previous.snapshot?.unsupportedCapability === 'terminalOutput') {
          return previous;
        }
        return {
          runId: run.id,
          snapshot: createUnsupportedTerminalSnapshot(run),
        };
      });
    } else {
      const snapshotRequestKey = `${run.id}:${isLiveRunStatus(run.status) ? 'live' : 'settled'}`;
      const needsInitialSnapshot = terminalSnapshotRequestKeyRef.current !== snapshotRequestKey;
      terminalSnapshotRequestKeyRef.current = snapshotRequestKey;
      if (needsInitialSnapshot || terminalStreamFallbackActive) {
        refreshTerminalSnapshot();
      }
    }
    if (canRequestConversation) {
      refreshConversationEvents();
    }
  }, [
    activeTab,
    detailOpen,
    refreshConversationEvents,
    refreshTerminalSnapshot,
    run,
    runDetailsError,
    selectedRunId,
    setTerminalSnapshotState,
    terminalStreamFallbackActive,
  ]);
}
