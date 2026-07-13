/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { act, renderHook, waitFor } from '@testing-library/react';
import type { Dispatch, SetStateAction } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { useActiveRunDetailRequests } from '../../../features/runs/hooks/useActiveRunDetailRequests';
import { useRunObservabilityDetails } from '../../../hooks/useRunObservabilityDetails';
import type { AgentGatewayApi } from '../../../pages/AgentGatewayPageUtils';
import type { RunDetailTabKey, RunRecord, TerminalSnapshotState } from '../../../pages/runs/types';

const run: RunRecord = {
  id: 'run-1',
  runCode: 'RUN-1',
  status: 'running',
  agentSessionId: 'session-1',
  capabilitiesSnapshotJson: {
    terminalOutput: true,
  },
  agentGatewayActionPermissionsJson: {
    readSessionMessages: true,
    readTerminal: true,
  },
};

describe('run detail request gating', () => {
  it('requests conversation and terminal data only for their active tabs', () => {
    const refreshConversationEvents = vi.fn();
    const refreshTerminalSnapshot = vi.fn();
    const setTerminalSnapshotState = vi.fn() as Dispatch<SetStateAction<TerminalSnapshotState | null>>;
    const baseProps = {
      detailOpen: true,
      selectedRunId: run.id,
      run,
      runDetailsError: undefined,
      terminalStreamFallbackActive: false,
      refreshConversationEvents,
      refreshTerminalSnapshot,
      setTerminalSnapshotState,
    };
    const { rerender } = renderHook(
      (props: typeof baseProps & { activeTab: RunDetailTabKey }) => useActiveRunDetailRequests(props),
      { initialProps: { ...baseProps, activeTab: 'summary' } },
    );

    expect(refreshConversationEvents).toHaveBeenCalledTimes(1);
    expect(refreshTerminalSnapshot).not.toHaveBeenCalled();

    rerender({ ...baseProps, activeTab: 'agent-sessions' });
    expect(refreshConversationEvents).toHaveBeenCalledTimes(1);
    expect(refreshTerminalSnapshot).toHaveBeenCalledTimes(1);

    rerender({ ...baseProps, activeTab: 'logs' });
    expect(refreshConversationEvents).toHaveBeenCalledTimes(1);
    expect(refreshTerminalSnapshot).toHaveBeenCalledTimes(1);
  });

  it('starts only the logs, artifacts, or API-log requests for the selected tab', async () => {
    const request = vi.fn().mockResolvedValue({ data: { data: [], meta: {} } });
    const api = { request } as unknown as AgentGatewayApi;
    const baseProps = {
      api,
      t: (key: string) => key,
      selectedRunId: run.id,
      run,
      enabled: true,
      conversationEnabled: true,
    };
    const { rerender } = renderHook(
      (props: typeof baseProps & { activeTab: RunDetailTabKey }) => useRunObservabilityDetails(props),
      { initialProps: { ...baseProps, activeTab: 'summary' } },
    );

    expect(request).not.toHaveBeenCalled();

    rerender({ ...baseProps, activeTab: 'logs' });
    await waitFor(() => expect(request).toHaveBeenCalledTimes(1));

    rerender({ ...baseProps, activeTab: 'agent-sessions' });
    await act(async () => Promise.resolve());
    expect(request).toHaveBeenCalledTimes(1);

    rerender({ ...baseProps, activeTab: 'artifacts' });
    await waitFor(() => expect(request).toHaveBeenCalledTimes(3));

    rerender({ ...baseProps, activeTab: 'api-logs' });
    await waitFor(() => expect(request).toHaveBeenCalledTimes(4));
  });
});
