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
  TERMINAL_DAEMON_TARGET_CHUNK_BYTES,
  TERMINAL_PROTOCOL,
  TERMINAL_RECONNECT_INITIAL_DELAY_MS,
  TERMINAL_RECONNECT_JITTER_RATIO,
  TERMINAL_RECONNECT_MAX_DELAY_MS,
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
  ackTimeoutMs?: number;
  sendTimeoutMs?: number;
  createWebSocket?: (url: string, headers: Record<string, string>) => TerminalStreamSocket;
  onStateChange?: (state: DaemonTerminalStreamState, detail?: string) => void;
  onControlAvailable?: (controlRequestId: string) => void;
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
  timer: ReturnType<typeof setTimeout>;
}

const DEFAULT_INITIAL_RECONNECT_DELAY_MS = TERMINAL_RECONNECT_INITIAL_DELAY_MS;
const DEFAULT_MAX_RECONNECT_DELAY_MS = TERMINAL_RECONNECT_MAX_DELAY_MS;
const DEFAULT_FINAL_END_WAIT_MS = 5000;
const DEFAULT_ACK_TIMEOUT_MS = 5000;
const DEFAULT_SEND_TIMEOUT_MS = 5000;
const MAX_REPLAY_DATA_FRAME_BYTES = TERMINAL_DAEMON_TARGET_CHUNK_BYTES;

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

function applyReconnectJitter(delayMs: number, maxDelayMs: number) {
  if (delayMs <= 1) {
    return delayMs;
  }
  const jitterRange = delayMs * TERMINAL_RECONNECT_JITTER_RATIO;
  const jitteredDelay = delayMs + (Math.random() * 2 - 1) * jitterRange;
  return Math.min(maxDelayMs, Math.max(0, Math.round(jitteredDelay)));
}

function isUnscopedTerminalStreamError(frame: TerminalFrame): frame is TerminalError {
  if (frame.type !== 'error' || frame.requestId) {
    return false;
  }
  return [
    'TERMINAL_RUN_NOT_BOUND',
    'TERMINAL_LEASE_LOST',
    'TERMINAL_FRAME_TOO_LARGE',
    'TERMINAL_PROTOCOL_ERROR',
  ].includes(frame.code);
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
  private terminalEndSent = false;
  private streamReplayOffsetStart?: number;
  private sentTerminalEnd?: TerminalEnd;
  private pendingEndSendPromise?: Promise<void>;
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

  async end(reason: TerminalEnd['reason']): Promise<boolean> {
    if (this.terminalEndSent) {
      return true;
    }
    if (this.pendingEnd) {
      this.reconnectForFinalFlush();
      return await this.flushPendingEnd(this.getFinalEndWaitMs());
    }
    this.pendingEnd = {
      type: 'terminal.end',
      protocol: TERMINAL_PROTOCOL,
      requestId: createRequestId('terminal-end'),
      runId: this.options.runId,
      sessionName: this.options.sessionName,
      offsetEnd: this.options.ringBuffer.currentOffset,
      reason,
    };
    this.reconnectForFinalFlush();
    return await this.flushPendingEnd(this.getFinalEndWaitMs());
  }

  close() {
    this.active = false;
    this.clearReconnectTimer();
    this.rejectPendingAcks(new Error('Terminal stream client closed'));
    this.detachSocket(true);
    this.resolvePendingEndWaiters(false);
    this.setState('closed');
  }

  private getFinalEndWaitMs() {
    const reconnectDelayMs = this.options.maxReconnectDelayMs ?? DEFAULT_MAX_RECONNECT_DELAY_MS;
    const ackTimeoutMs = this.options.ackTimeoutMs ?? DEFAULT_ACK_TIMEOUT_MS;
    const sendTimeoutMs = this.options.sendTimeoutMs ?? DEFAULT_SEND_TIMEOUT_MS;
    return Math.max(DEFAULT_FINAL_END_WAIT_MS, reconnectDelayMs + ackTimeoutMs * 2 + sendTimeoutMs);
  }

  private reconnectForFinalFlush() {
    if (!this.active || this.state === 'bound') {
      return;
    }
    this.clearReconnectTimer();
    this.connect().catch(() => {
      // connect() owns state and reconnect scheduling.
    });
  }

  private async connect() {
    if (this.connectPromise) {
      await this.connectPromise;
      return;
    }
    this.connectPromise = this.connectOnce()
      .catch((error) => {
        this.detachSocket(true);
        if (!this.active) {
          return;
        }
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
    if (!this.active || this.ws !== ws) {
      return;
    }
    this.reconnectAttempts = 0;
    this.streamReplayOffsetStart = undefined;
    this.sentTerminalEnd = undefined;
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
      const timer = setTimeout(() => {
        cleanup();
        reject(new Error('Terminal stream WebSocket open timed out'));
      }, this.options.ackTimeoutMs ?? DEFAULT_ACK_TIMEOUT_MS);
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
        clearTimeout(timer);
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
      const timer = setTimeout(() => {
        const pending = this.pendingAcks.get(requestId);
        if (!pending) {
          return;
        }
        this.pendingAcks.delete(requestId);
        pending.reject(new Error(`Terminal stream ACK timed out: ${requestId}`));
      }, this.options.ackTimeoutMs ?? DEFAULT_ACK_TIMEOUT_MS);
      this.pendingAcks.set(requestId, {
        resolve,
        reject,
        timer,
      });
    });
    const sendPromise = this.sendFrame(frame).catch((error) => {
      this.rejectPendingAck(requestId, error instanceof Error ? error : new Error(String(error)));
      throw error;
    });
    await Promise.race([ackPromise, sendPromise.then(() => ackPromise)]);
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
        const frame = {
          ...replay.frame,
          requestId: createRequestId('terminal-data'),
        };
        await this.sendWithAck(frame);
        this.recordSentStreamData(frame.offsetStart);
        this.nextSendOffset = frame.offsetEnd;
      } catch (error) {
        this.setState('error', error instanceof Error ? error.message : String(error));
        this.scheduleReconnect();
        return;
      }
    }
  }

  private recordSentStreamData(offsetStart: number) {
    this.streamReplayOffsetStart =
      this.streamReplayOffsetStart === undefined ? offsetStart : Math.min(this.streamReplayOffsetStart, offsetStart);
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

  private async sendWithAckIfBound(frame: TerminalFrame) {
    if (this.state !== 'bound') {
      return false;
    }
    try {
      await this.sendWithAck(frame);
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
      let settled = false;
      const finish = (error?: Error) => {
        if (settled) {
          return;
        }
        settled = true;
        clearTimeout(timer);
        if (error) {
          reject(error);
          return;
        }
        resolve();
      };
      const timer = setTimeout(() => {
        finish(new Error(`Terminal stream send timed out: ${frame.type}`));
      }, this.options.sendTimeoutMs ?? DEFAULT_SEND_TIMEOUT_MS);
      try {
        ws.send(JSON.stringify(frame), (error?: Error) => {
          finish(error);
        });
      } catch (error) {
        finish(error instanceof Error ? error : new Error(String(error)));
      }
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
    if (this.handleUnscopedStreamError(frame)) {
      return;
    }
    if (frame.type === 'daemon.snapshotRequest') {
      this.sendSnapshot(frame.requestId, frame.fromOffset);
      return;
    }
    if (frame.type === 'daemon.controlAvailable' && frame.runId === this.options.runId) {
      this.options.onControlAvailable?.(frame.controlRequestId);
    }
  };

  private handleUnscopedStreamError(frame: TerminalFrame) {
    if (!isUnscopedTerminalStreamError(frame)) {
      return false;
    }
    const rewindOffset =
      this.streamReplayOffsetStart ?? this.sentTerminalEnd?.offsetEnd ?? this.options.ringBuffer.retainedOffsetStart;
    this.nextSendOffset = Math.min(this.nextSendOffset, rewindOffset);
    if (this.sentTerminalEnd && !this.pendingEnd) {
      this.pendingEnd = this.sentTerminalEnd;
      this.terminalEndSent = false;
    }
    this.sentTerminalEnd = undefined;
    this.setState('error', `${frame.code}: ${frame.message}`);
    this.rejectPendingAcks(new Error(`${frame.code}: ${frame.message}`));
    this.detachSocket(true);
    this.scheduleReconnect();
    return true;
  }

  private resolvePendingAck(frame: TerminalFrame) {
    for (const [requestId, pending] of this.pendingAcks) {
      if (isAck(frame, requestId)) {
        this.pendingAcks.delete(requestId);
        clearTimeout(pending.timer);
        pending.resolve();
        return;
      }
      if (isErrorForRequest(frame, requestId)) {
        this.pendingAcks.delete(requestId);
        clearTimeout(pending.timer);
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
      return this.terminalEndSent;
    }
    if (this.state === 'bound') {
      await this.sendPendingEnd();
    }
    if (!this.pendingEnd || waitMs <= 0) {
      return this.terminalEndSent;
    }
    if (!this.active || this.state === 'closed') {
      return false;
    }
    return await new Promise<boolean>((resolve) => {
      const waiter = (sent: boolean) => {
        clearTimeout(timer);
        this.pendingEndWaiters.delete(waiter);
        resolve(sent);
      };
      const timer = setTimeout(() => {
        this.pendingEndWaiters.delete(waiter);
        resolve(false);
      }, waitMs);
      this.pendingEndWaiters.add(waiter);
    });
  }

  private async sendPendingEnd() {
    if (this.pendingEndSendPromise) {
      await this.pendingEndSendPromise;
      return;
    }
    this.pendingEndSendPromise = this.sendPendingEndOnce().finally(() => {
      this.pendingEndSendPromise = undefined;
    });
    await this.pendingEndSendPromise;
  }

  private async sendPendingEndOnce() {
    if (!this.pendingEnd || this.state !== 'bound') {
      return;
    }
    await this.drainRetainedData();
    if (!this.pendingEnd || this.state !== 'bound') {
      return;
    }
    const frame: TerminalEnd = {
      ...this.pendingEnd,
      offsetEnd: this.options.ringBuffer.currentOffset,
    };
    const sent = await this.sendWithAckIfBound(frame);
    if (!sent) {
      return;
    }
    this.sentTerminalEnd = frame;
    this.pendingEnd = undefined;
    this.terminalEndSent = true;
    this.resolvePendingEndWaiters(true);
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

  private readonly ignoreDetachedSocketError = () => undefined;

  private scheduleReconnect() {
    if (!this.active || this.reconnectTimer) {
      return;
    }
    const maxAttempts = this.options.maxReconnectAttempts;
    if (typeof maxAttempts === 'number' && this.reconnectAttempts >= maxAttempts) {
      this.setState('closed', 'terminal stream reconnect attempts exhausted');
      this.resolvePendingEndWaiters(false);
      return;
    }
    this.reconnectAttempts += 1;
    this.setState('reconnecting');
    const maxDelay = this.options.maxReconnectDelayMs ?? DEFAULT_MAX_RECONNECT_DELAY_MS;
    const baseDelay = Math.min(
      (this.options.initialReconnectDelayMs ?? DEFAULT_INITIAL_RECONNECT_DELAY_MS) *
        2 ** Math.max(0, this.reconnectAttempts - 1),
      maxDelay,
    );
    this.reconnectTimer = setTimeout(
      () => {
        this.reconnectTimer = undefined;
        this.connect().catch(() => {
          // connect() owns state and reconnect scheduling.
        });
      },
      applyReconnectJitter(baseDelay, maxDelay),
    );
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
      ws.on('error', this.ignoreDetachedSocketError);
      ws.close();
    }
  }

  private rejectPendingAcks(error: Error) {
    for (const pending of this.pendingAcks.values()) {
      clearTimeout(pending.timer);
      pending.reject(error);
    }
    this.pendingAcks.clear();
  }

  private rejectPendingAck(requestId: string, error: Error) {
    const pending = this.pendingAcks.get(requestId);
    if (!pending) {
      return;
    }
    this.pendingAcks.delete(requestId);
    clearTimeout(pending.timer);
    pending.reject(error);
  }

  private clearReconnectTimer() {
    if (!this.reconnectTimer) {
      return;
    }
    clearTimeout(this.reconnectTimer);
    this.reconnectTimer = undefined;
  }

  private resolvePendingEndWaiters(sent: boolean) {
    for (const waiter of this.pendingEndWaiters) {
      waiter(sent);
    }
    this.pendingEndWaiters.clear();
  }

  private setState(state: DaemonTerminalStreamState, detail?: string) {
    this.state = state;
    this.options.onStateChange?.(state, detail);
  }
}
