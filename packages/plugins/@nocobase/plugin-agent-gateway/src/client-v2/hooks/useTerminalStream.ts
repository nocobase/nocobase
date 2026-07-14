/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

import {
  TerminalStreamChunk,
  TerminalStreamClient,
  TerminalStreamClientState,
  TerminalStreamTicket,
  TerminalStreamWebSocket,
} from '../utils/terminalStreamClient';

export interface UseTerminalStreamOptions {
  runId?: string;
  enabled?: boolean;
  baseUrl?: string;
  reconnectDelayMs?: number;
  maxReconnectDelayMs?: number;
  maxReconnectAttempts?: number;
  createStreamTicket?: (runId: string) => Promise<TerminalStreamTicket>;
  createWebSocket?: (url: string) => TerminalStreamWebSocket;
}

export interface TerminalStreamHookChunk extends TerminalStreamChunk {
  sequence: number;
}

export interface UseTerminalStreamState extends TerminalStreamClientState {
  chunks: TerminalStreamHookChunk[];
  hasStreamOutput: boolean;
  notifyControl(controlRequestId: string): boolean;
}

export const TERMINAL_STREAM_CHUNK_LIMIT = 500;
const TERMINAL_STREAM_STATE_FLUSH_INTERVAL_MS = 250;

type TerminalStreamRenderState = Omit<UseTerminalStreamState, 'notifyControl'>;

const CLOSED_STATE: TerminalStreamRenderState = {
  connectionState: 'closed',
  currentOffset: 0,
  previewText: '',
  chunks: [],
  hasStreamOutput: false,
};

function getStoredOffset(runId: string) {
  if (typeof window === 'undefined') {
    return 0;
  }
  const storedValue = window.sessionStorage.getItem(`agentGatewayTerminalOffset:${runId}`);
  const storedOffset = Number(storedValue);
  return Number.isInteger(storedOffset) && storedOffset > 0 ? storedOffset : 0;
}

function storeOffset(runId: string, offset: number) {
  if (typeof window === 'undefined' || !Number.isInteger(offset) || offset <= 0) {
    return;
  }
  window.sessionStorage.setItem(`agentGatewayTerminalOffset:${runId}`, String(offset));
}

export function useTerminalStream(options: UseTerminalStreamOptions): UseTerminalStreamState {
  const {
    baseUrl,
    createStreamTicket,
    createWebSocket,
    enabled: enabledOption,
    maxReconnectDelayMs,
    maxReconnectAttempts,
    reconnectDelayMs,
    runId,
  } = options;
  const enabled = enabledOption !== false;
  const [state, setState] = useState<TerminalStreamRenderState>(CLOSED_STATE);
  const clientRef = useRef<TerminalStreamClient>();
  const notifyControl = useCallback((controlRequestId: string) => {
    return clientRef.current?.notifyControl(controlRequestId) ?? false;
  }, []);

  useEffect(() => {
    if (!enabled || !runId || !createStreamTicket) {
      setState(CLOSED_STATE);
      return;
    }

    let sequence = 0;
    let flushTimer: ReturnType<typeof setTimeout> | null = null;
    let pendingState: Partial<TerminalStreamClientState> | null = null;
    let pendingChunks: TerminalStreamHookChunk[] = [];
    let disposed = false;
    const flushPendingState = () => {
      flushTimer = null;
      const statePatch = pendingState;
      const chunksPatch = pendingChunks;
      pendingState = null;
      pendingChunks = [];
      if (disposed) {
        return;
      }
      if (!statePatch && !chunksPatch.length) {
        return;
      }
      setState((previous) => ({
        ...previous,
        ...(statePatch || {}),
        chunks: chunksPatch.length
          ? [...previous.chunks, ...chunksPatch].slice(-TERMINAL_STREAM_CHUNK_LIMIT)
          : previous.chunks,
        hasStreamOutput: previous.hasStreamOutput || chunksPatch.length > 0 || Boolean(statePatch?.previewText),
      }));
    };
    const schedulePendingFlush = () => {
      if (disposed) {
        return;
      }
      if (flushTimer) {
        return;
      }
      flushTimer = setTimeout(flushPendingState, TERMINAL_STREAM_STATE_FLUSH_INTERVAL_MS);
    };
    setState(CLOSED_STATE);
    const lastOffset = getStoredOffset(runId);
    const client = new TerminalStreamClient({
      runId,
      baseUrl,
      lastOffset,
      reconnectDelayMs,
      maxReconnectDelayMs,
      maxReconnectAttempts,
      createStreamTicket,
      createWebSocket,
      onChunk(chunk) {
        if (disposed) {
          return;
        }
        sequence += 1;
        const nextChunk: TerminalStreamHookChunk = {
          ...chunk,
          sequence,
        };
        pendingChunks.push(nextChunk);
        schedulePendingFlush();
      },
      onStateChange(nextState) {
        if (disposed) {
          return;
        }
        storeOffset(runId, nextState.currentOffset);
        pendingState = {
          ...(pendingState || {}),
          ...nextState,
        };
        schedulePendingFlush();
      },
    });

    clientRef.current = client;
    client.connect();
    return () => {
      disposed = true;
      client.close();
      if (clientRef.current === client) {
        clientRef.current = undefined;
      }
      if (flushTimer) {
        clearTimeout(flushTimer);
        flushTimer = null;
      }
      pendingState = null;
      pendingChunks = [];
    };
  }, [
    baseUrl,
    createStreamTicket,
    createWebSocket,
    enabled,
    maxReconnectAttempts,
    maxReconnectDelayMs,
    reconnectDelayMs,
    runId,
  ]);

  return {
    ...state,
    notifyControl,
  };
}
