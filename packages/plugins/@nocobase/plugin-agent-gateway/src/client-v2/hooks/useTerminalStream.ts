/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useEffect, useState } from 'react';

import {
  TerminalStreamChunk,
  TerminalStreamClient,
  TerminalStreamClientState,
  TerminalStreamWebSocket,
} from '../utils/terminalStreamClient';

export interface UseTerminalStreamOptions {
  runId?: string;
  enabled?: boolean;
  token?: string;
  authenticator?: string;
  role?: string;
  baseUrl?: string;
  reconnectDelayMs?: number;
  maxReconnectAttempts?: number;
  createWebSocket?: (url: string) => TerminalStreamWebSocket;
}

export interface TerminalStreamHookChunk extends TerminalStreamChunk {
  sequence: number;
}

export interface UseTerminalStreamState extends TerminalStreamClientState {
  chunks: TerminalStreamHookChunk[];
  hasStreamOutput: boolean;
}

export const TERMINAL_STREAM_CHUNK_LIMIT = 500;

const CLOSED_STATE: UseTerminalStreamState = {
  connectionState: 'closed',
  currentOffset: 0,
  previewText: '',
  chunks: [],
  hasStreamOutput: false,
};

export function useTerminalStream(options: UseTerminalStreamOptions): UseTerminalStreamState {
  const {
    authenticator,
    baseUrl,
    createWebSocket,
    enabled: enabledOption,
    maxReconnectAttempts,
    reconnectDelayMs,
    role,
    runId,
    token,
  } = options;
  const enabled = enabledOption !== false;
  const [state, setState] = useState<UseTerminalStreamState>(CLOSED_STATE);

  useEffect(() => {
    if (!enabled || !runId || !token) {
      setState(CLOSED_STATE);
      return;
    }

    let sequence = 0;
    setState(CLOSED_STATE);
    const client = new TerminalStreamClient({
      runId,
      token,
      authenticator,
      role,
      baseUrl,
      reconnectDelayMs,
      maxReconnectAttempts,
      createWebSocket,
      onChunk(chunk) {
        sequence += 1;
        const nextChunk: TerminalStreamHookChunk = {
          ...chunk,
          sequence,
        };
        setState((previous) => ({
          ...previous,
          chunks: [...previous.chunks, nextChunk].slice(-TERMINAL_STREAM_CHUNK_LIMIT),
          hasStreamOutput: true,
        }));
      },
      onStateChange(nextState) {
        setState((previous) => ({
          ...previous,
          ...nextState,
          hasStreamOutput: previous.hasStreamOutput || Boolean(nextState.previewText),
        }));
      },
    });

    client.connect();
    return () => {
      client.close();
    };
  }, [authenticator, baseUrl, createWebSocket, enabled, maxReconnectAttempts, reconnectDelayMs, role, runId, token]);

  return state;
}
