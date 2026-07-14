/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { AgentGatewayPageContext, RunRecord } from '../../../pages/runs/types';
import { useRunTerminalController } from '../../../features/runs/hooks/useRunTerminalController';

const streamMocks = vi.hoisted(() => ({
  notifyControl: vi.fn(() => true),
}));

vi.mock('../../../hooks/useTerminalStream', () => ({
  useTerminalStream: () => ({
    connectionState: 'live',
    currentOffset: 0,
    previewText: '',
    chunks: [],
    hasStreamOutput: false,
    notifyControl: streamMocks.notifyControl,
  }),
}));

describe('useRunTerminalController', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('notifies the browser stream after REST accepts a control request', async () => {
    const request = vi.fn(async () => ({
      data: {
        data: {
          runId: 'run-id-1',
          controlRequestId: 'control-request-controller',
          controlRequestStatus: 'succeeded',
        },
      },
    }));
    const ctx = {
      api: { request },
      message: { success: vi.fn(), error: vi.fn() },
    } as unknown as AgentGatewayPageContext;
    const run: RunRecord = {
      id: 'run-id-1',
      runCode: 'run-controller-1',
      status: 'running',
      agentGatewayActionPermissionsJson: { readTerminal: true },
      capabilitiesSnapshotJson: { terminalOutput: true },
    };
    const { result } = renderHook(() =>
      useRunTerminalController({
        ctx,
        t: (key) => key,
        activeTab: 'summary',
        detailOpen: true,
        selectedRunId: run.id,
        run,
        refreshConversationEvents: vi.fn(),
        refreshRunDetails: vi.fn(),
        refreshRuns: vi.fn(),
      }),
    );

    await act(async () => {
      await result.current.interruptRequest.runAsync(run.id);
    });

    expect(streamMocks.notifyControl).toHaveBeenCalledWith('control-request-controller');
  });
});
