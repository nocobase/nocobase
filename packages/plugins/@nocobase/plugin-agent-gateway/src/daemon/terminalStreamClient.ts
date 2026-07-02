/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import WebSocket from 'ws';

import {
  TERMINAL_PROTOCOL,
  TERMINAL_STREAM_WS_PATH,
  TerminalAck,
  TerminalDaemonBindRun,
  TerminalEnd,
  TerminalError,
  TerminalFrame,
  TerminalServerFrame,
  parseTerminalFrameJson,
} from '../shared/terminalStreamProtocol';
import { TerminalRingBuffer } from './terminalRingBuffer';
import { RunLease } from './types';

export type DaemonTerminalStreamState = 'idle' | 'connecting' | 'bound' | 'reconnecting' | 'closed' | 'error';

export interface DaemonTerminalStreamClientOptions {
  serverUrl: string;
  nodeId: string;
  nodeToken: string;
  runId: string;
  sessionName: string;
  ringBuffer: TerminalRingBuffer;
  getLease(): RunLease;
  initialReconnectDelayMs?: number;
  maxReconnectDelayMs?: number;
  maxReconnectAttempts?: number;
  createWebSocket?: (url: string, headers: Record<string, string>) => TerminalStreamSocket;
  onStateChange?: (state: DaemonTerminalStreamState, detail?: string) => void;
}

export interface TerminalStreamSocket {
  readyState: number;
  send(data: string, callback?: (error?: Error) => void): void;
  close(): void;
  on(event: 'open', listener: () => void): this;
  on(event: 'message', listener: (data: WebSocket.RawData) => void): this;
  on(event: 'close', listener: () => void): this;
  on(event: 'error', listener: (error: Error) => void): this;
  off(event: 'open', listener: () => void): this;
  off(event: 'message', listener: (data: WebSocket.RawData) => void): this;
  off(event: 'close', listener: () => void): this;
  off(event: 'error', listener: (error: Error) => void): this;
}

interface PendingAck {
  resolve(): void;
  reject(error: Error): void;
}

const DEFAULT_INITIAL_RECONNECT_DELAY_MS = 250;
const DEFAULT_MAX_RECONNECT_DELAY_MS = 5000;
const DEFAULT_FINAL_END_WAIT_MS = 5000;
const MAX_REPLAY_DATA_FRAME_BYTES = 64 * 1024;

function buildWebSocketUrl(serverUrl: string) {
  const url = new URL(TERMINAL_STREAM_WS_PATH, serverUrl.replace(/\/$/, ''));
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  return url.toString();
}

function createRequestId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function isAck(frame: TerminalFrame, requestId: string): frame is TerminalAck {
  return frame.type === 'ack' && frame.requestId === requestId;
}

function isErrorForRequest(frame: TerminalFrame, requestId: string): frame is TerminalError {
  return frame.type === 'error' && frame.requestId === requestId;
}

export class DaemonTerminalStreamClient {
  private ws?: TerminalStreamSocket;
  private state: DaemonTerminalStreamState = 'idle';
  private active = false;
  private reconnectAttempts = 0;
  private reconnectTimer?: ReturnType<typeof setTimeout>;
  private connectPromise?: Promise<void>;
  private drainPromise?: Promise<void>;
  private nextSendOffset: number;
  private pendingEnd?: TerminalEnd;
  private readonly pendingEndWaiters = new Set<(sent: boolean) => void>();
  private readonly pendingAcks = new Map<string, PendingAck>();

  constructor(private readonly options: DaemonTerminalStreamClientOptions) {
    this.nextSendOffset = options.ringBuffer.retainedOffsetStart;
  }

  getState() {
    return this.state;
  }

  async start() {
    this.active = true;
    await this.connect();
  }

  async appendText(text: string) {
    const frame = this.options.ringBuffer.appendText(text);
    if (!frame) {
      return;
    }
    await this.drainRetainedData();
  }

  async end(reason: TerminalEnd['reason']) {
    this.pendingEnd = {
      type: 'terminal.end',
      protocol: TERMINAL_PROTOCOL,
      runId: this.options.runId,
      sessionName: this.options.sessionName,
      offsetEnd: this.options.ringBuffer.currentOffset,
      reason,
    };
    await this.flushPendingEnd(DEFAULT_FINAL_END_WAIT_MS);
  }

  close() {
    this.active = false;
    this.clearReconnectTimer();
    this.rejectPendingAcks(new Error('Terminal stream client closed'));
    this.detachSocket(true);
    this.setState('closed');
  }

  private async connect() {
    if (this.connectPromise) {
      await this.connectPromise;
      return;
    }
    this.connectPromise = this.connectOnce()
      .catch((error) => {
        this.setState('error', error instanceof Error ? error.message : String(error));
        this.scheduleReconnect();
      })
      .finally(() => {
        this.connectPromise = undefined;
      });
    await this.connectPromise;
  }

  private async connectOnce() {
    if (!this.active) {
      return;
    }

    this.detachSocket(true);
    this.setState(this.reconnectAttempts > 0 ? 'reconnecting' : 'connecting');
    const ws = this.createWebSocket();
    this.ws = ws;
    ws.on('message', this.handleMessage);
    ws.on('close', this.handleClose);
    ws.on('error', this.handleError);
    await this.waitForOpen(ws);
    await this.registerDaemon();
    await this.bindRun();
    this.reconnectAttempts = 0;
    this.setState('bound');
    await this.drainRetainedData();
    await this.flushPendingEnd(0);
  }

  private createWebSocket() {
    const headers = {
      Authorization: `Bearer ${this.options.nodeToken}`,
    };
    if (this.options.createWebSocket) {
      return this.options.createWebSocket(buildWebSocketUrl(this.options.serverUrl), headers);
    }
    return new WebSocket(buildWebSocketUrl(this.options.serverUrl), {
      headers,
    });
  }

  private waitForOpen(ws: TerminalStreamSocket) {
    if (ws.readyState === WebSocket.OPEN) {
      return Promise.resolve();
    }
    return new Promise<void>((resolve, reject) => {
      const onOpen = () => {
        cleanup();
        resolve();
      };
      const onError = (error: Error) => {
        cleanup();
        reject(error);
      };
      const onClose = () => {
        cleanup();
        reject(new Error('Terminal stream WebSocket closed before open'));
      };
      const cleanup = () => {
        ws.off('open', onOpen);
        ws.off('error', onError);
        ws.off('close', onClose);
      };
      ws.on('open', onOpen);
      ws.on('error', onError);
      ws.on('close', onClose);
    });
  }

  private async registerDaemon() {
    const requestId = createRequestId('daemon-register');
    await this.sendWithAck({
      type: 'daemon.register',
      protocol: TERMINAL_PROTOCOL,
      requestId,
      nodeId: this.options.nodeId,
      capabilities: {
        terminalStream: true,
      },
    });
  }

  private async bindRun() {
    const lease = this.options.getLease();
    const frame: TerminalDaemonBindRun = {
      type: 'daemon.bindRun',
      protocol: TERMINAL_PROTOCOL,
      requestId: createRequestId('daemon-bind'),
      runId: this.options.runId,
      sessionName: this.options.sessionName,
      startOffset: this.options.ringBuffer.retainedOffsetStart,
      claimToken: lease.claimToken,
      claimAttempt: lease.claimAttempt,
      leaseVersion: lease.leaseVersion,
    };
    await this.sendWithAck(frame);
  }

  private async sendWithAck(frame: TerminalFrame) {
    if (!('requestId' in frame) || !frame.requestId) {
      throw new Error('Terminal stream requestId is required');
    }
    const requestId = frame.requestId;
    const ackPromise = new Promise<void>((resolve, reject) => {
      this.pendingAcks.set(requestId, {
        resolve,
        reject,
      });
    });
    await this.sendFrame(frame);
    await ackPromise;
  }

  private async drainRetainedData() {
    if (this.state !== 'bound') {
      return;
    }
    if (this.drainPromise) {
      await this.drainPromise;
      return;
    }

    this.drainPromise = this.drainRetainedDataOnce().finally(() => {
      this.drainPromise = undefined;
    });
    await this.drainPromise;
  }

  private async drainRetainedDataOnce() {
    while (this.state === 'bound') {
      const replay = this.options.ringBuffer.createDataFrameFromOffset(
        this.nextSendOffset,
        MAX_REPLAY_DATA_FRAME_BYTES,
      );
      if (!replay.ok) {
        this.nextSendOffset = this.options.ringBuffer.retainedOffsetStart;
        continue;
      }
      if (!replay.frame) {
        return;
      }
      try {
        await this.sendFrame(replay.frame);
        this.nextSendOffset = replay.frame.offsetEnd;
      } catch (error) {
        this.setState('error', error instanceof Error ? error.message : String(error));
        this.scheduleReconnect();
        return;
      }
    }
  }

  private async sendIfBound(frame: TerminalServerFrame) {
    if (this.state !== 'bound') {
      return false;
    }
    try {
      await this.sendFrame(frame);
      return true;
    } catch (error) {
      this.setState('error', error instanceof Error ? error.message : String(error));
      this.scheduleReconnect();
      return false;
    }
  }

  private async sendFrame(frame: TerminalFrame | TerminalServerFrame) {
    const ws = this.ws;
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      throw new Error('Terminal stream WebSocket is not open');
    }
    await new Promise<void>((resolve, reject) => {
      ws.send(JSON.stringify(frame), (error?: Error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });
  }

  private readonly handleMessage = (data: WebSocket.RawData) => {
    const parsed = parseTerminalFrameJson(data.toString());
    if (parsed.ok === false) {
      this.setState('error', parsed.error.code);
      return;
    }
    const frame = parsed.frame;
    this.resolvePendingAck(frame);
    if (frame.type === 'daemon.snapshotRequest') {
      this.sendSnapshot(frame.requestId, frame.fromOffset);
    }
  };

  private resolvePendingAck(frame: TerminalFrame) {
    for (const [requestId, pending] of this.pendingAcks) {
      if (isAck(frame, requestId)) {
        this.pendingAcks.delete(requestId);
        pending.resolve();
        return;
      }
      if (isErrorForRequest(frame, requestId)) {
        this.pendingAcks.delete(requestId);
        pending.reject(new Error(`${frame.code}: ${frame.message}`));
        return;
      }
    }
  }

  private sendSnapshot(requestId: string, fromOffset: number) {
    const snapshot = this.options.ringBuffer.createSnapshot(requestId, fromOffset);
    this.sendIfBound(snapshot.frame).catch(() => {
      // A close event will schedule reconnect if the stream is still active.
    });
  }

  private async flushPendingEnd(waitMs: number) {
    if (!this.pendingEnd) {
      return;
    }
    if (this.state === 'bound') {
      await this.sendPendingEnd();
    }
    if (!this.pendingEnd || waitMs <= 0) {
      return;
    }
    await new Promise<void>((resolve) => {
      const waiter = () => {
        clearTimeout(timer);
        this.pendingEndWaiters.delete(waiter);
        resolve();
      };
      const timer = setTimeout(() => {
        this.pendingEndWaiters.delete(waiter);
        resolve();
      }, waitMs);
      this.pendingEndWaiters.add(waiter);
    });
  }

  private async sendPendingEnd() {
    if (!this.pendingEnd || this.state !== 'bound') {
      return;
    }
    await this.drainRetainedData();
    if (!this.pendingEnd || this.state !== 'bound') {
      return;
    }
    const sent = await this.sendIfBound({
      ...this.pendingEnd,
      offsetEnd: this.options.ringBuffer.currentOffset,
    });
    if (!sent) {
      return;
    }
    this.pendingEnd = undefined;
    for (const waiter of this.pendingEndWaiters) {
      waiter(true);
    }
    this.pendingEndWaiters.clear();
  }

  private readonly handleClose = () => {
    this.detachSocket(false);
    this.rejectPendingAcks(new Error('Terminal stream WebSocket closed'));
    if (this.active) {
      this.scheduleReconnect();
      return;
    }
    this.setState('closed');
  };

  private readonly handleError = (error: Error) => {
    this.setState('error', error.message);
  };

  private scheduleReconnect() {
    if (!this.active || this.reconnectTimer) {
      return;
    }
    const maxAttempts = this.options.maxReconnectAttempts;
    if (typeof maxAttempts === 'number' && this.reconnectAttempts >= maxAttempts) {
      this.setState('closed', 'terminal stream reconnect attempts exhausted');
      return;
    }
    this.reconnectAttempts += 1;
    this.setState('reconnecting');
    const delay = Math.min(
      (this.options.initialReconnectDelayMs ?? DEFAULT_INITIAL_RECONNECT_DELAY_MS) *
        2 ** Math.max(0, this.reconnectAttempts - 1),
      this.options.maxReconnectDelayMs ?? DEFAULT_MAX_RECONNECT_DELAY_MS,
    );
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = undefined;
      this.connect().catch(() => {
        // connect() owns state and reconnect scheduling.
      });
    }, delay);
  }

  private detachSocket(closeSocket: boolean) {
    const ws = this.ws;
    if (!ws) {
      return;
    }
    ws.off('message', this.handleMessage);
    ws.off('close', this.handleClose);
    ws.off('error', this.handleError);
    this.ws = undefined;
    if (closeSocket && ws.readyState !== WebSocket.CLOSED && ws.readyState !== WebSocket.CLOSING) {
      ws.close();
    }
  }

  private rejectPendingAcks(error: Error) {
    for (const pending of this.pendingAcks.values()) {
      pending.reject(error);
    }
    this.pendingAcks.clear();
  }

  private clearReconnectTimer() {
    if (!this.reconnectTimer) {
      return;
    }
    clearTimeout(this.reconnectTimer);
    this.reconnectTimer = undefined;
  }

  private setState(state: DaemonTerminalStreamState, detail?: string) {
    this.state = state;
    this.options.onStateChange?.(state, detail);
  }
}
