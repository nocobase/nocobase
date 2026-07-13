/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  TERMINAL_BROWSER_MAX_DECODED_PAYLOAD_BYTES_PER_FRAME,
  TERMINAL_PROTOCOL,
  TERMINAL_RECONNECT_INITIAL_DELAY_MS,
  TERMINAL_RECONNECT_JITTER_RATIO,
  TERMINAL_RECONNECT_MAX_DELAY_MS,
  TERMINAL_STREAM_BROWSER_SUBPROTOCOL,
  TERMINAL_STREAM_BROWSER_TICKET_PROTOCOL_PREFIX,
  TERMINAL_STREAM_WS_PATH,
  TerminalErrorCode,
  TerminalFrame,
  decodeTerminalPayload,
  parseTerminalFrame,
} from '../../shared/terminalStreamProtocol';

export type TerminalStreamConnectionState = 'connecting' | 'live' | 'reconnecting' | 'closed' | 'error';

export interface TerminalStreamClientState {
  connectionState: TerminalStreamConnectionState;
  currentOffset: number;
  previewText: string;
  lastErrorCode?: TerminalErrorCode;
}

export interface TerminalStreamChunk {
  frameType: 'terminal.data' | 'terminal.snapshot';
  offsetStart: number;
  offsetEnd: number;
  text: string;
}

export interface TerminalStreamTicket {
  ticket: string;
  expiresAt?: string;
  runId?: string;
  protocols?: string[];
}

export interface TerminalStreamClientOptions {
  runId: string;
  lastOffset?: number;
  baseUrl?: string;
  reconnectDelayMs?: number;
  maxReconnectDelayMs?: number;
  maxReconnectAttempts?: number;
  createStreamTicket?: (runId: string) => Promise<TerminalStreamTicket>;
  createWebSocket?: (url: string, protocols?: string[]) => TerminalStreamWebSocket;
  onStateChange?: (state: TerminalStreamClientState) => void;
  onChunk?: (chunk: TerminalStreamChunk) => void;
}

export interface TerminalStreamWebSocket {
  readyState: number;
  send(data: string): void;
  close(): void;
  addEventListener(type: string, listener: (event: TerminalStreamWebSocketEvent) => void): void;
  removeEventListener(type: string, listener: (event: TerminalStreamWebSocketEvent) => void): void;
}

export interface TerminalStreamWebSocketEvent {
  data?: string;
}

const DEFAULT_PREVIEW_LIMIT = 4000;
const DEFAULT_RECONNECT_DELAY_MS = TERMINAL_RECONNECT_INITIAL_DELAY_MS;
const DEFAULT_MAX_RECONNECT_DELAY_MS = TERMINAL_RECONNECT_MAX_DELAY_MS;
const DEFAULT_MAX_RECONNECT_ATTEMPTS = Number.POSITIVE_INFINITY;
const textEncoder = new TextEncoder();

function getDefaultBaseUrl() {
  if (typeof window === 'undefined') {
    return 'ws://127.0.0.1';
  }
  return `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}`;
}

export function buildTerminalStreamUrl(options: { baseUrl?: string }) {
  const baseUrl = options.baseUrl || getDefaultBaseUrl();
  const url = new URL(TERMINAL_STREAM_WS_PATH, baseUrl);
  url.protocol = url.protocol === 'https:' ? 'wss:' : url.protocol === 'http:' ? 'ws:' : url.protocol;
  return url.toString();
}

function encodeWebSocketProtocolValue(value?: string) {
  if (!value) {
    return '';
  }
  const bytes = textEncoder.encode(value);
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

export function buildTerminalStreamProtocols(ticket?: TerminalStreamTicket) {
  const protocols: string[] = [TERMINAL_STREAM_BROWSER_SUBPROTOCOL];
  const streamTicket = encodeWebSocketProtocolValue(ticket?.ticket);
  if (streamTicket) {
    protocols.push(`${TERMINAL_STREAM_BROWSER_TICKET_PROTOCOL_PREFIX}${streamTicket}`);
  }
  return protocols;
}

function sliceDecodedPayloadByByteOffset(text: string, byteOffset: number) {
  if (byteOffset <= 0) {
    return text;
  }
  let consumedBytes = 0;
  let charStartIndex = 0;
  for (const char of text) {
    const nextConsumedBytes = consumedBytes + textEncoder.encode(char).byteLength;
    if (nextConsumedBytes > byteOffset) {
      return text.slice(charStartIndex);
    }
    if (nextConsumedBytes === byteOffset) {
      return text.slice(charStartIndex + char.length);
    }
    consumedBytes = nextConsumedBytes;
    charStartIndex += char.length;
  }
  return '';
}

function splitDecodedTextByByteLimit(text: string, offsetStart: number, maxBytes: number) {
  const chunks: TerminalStreamChunk[] = [];
  let chunkText = '';
  let chunkBytes = 0;
  let chunkOffsetStart = offsetStart;
  for (const char of text) {
    const charBytes = textEncoder.encode(char).byteLength;
    if (chunkText && chunkBytes + charBytes > maxBytes) {
      chunks.push({
        frameType: 'terminal.data',
        offsetStart: chunkOffsetStart,
        offsetEnd: chunkOffsetStart + chunkBytes,
        text: chunkText,
      });
      chunkOffsetStart += chunkBytes;
      chunkText = '';
      chunkBytes = 0;
    }
    chunkText += char;
    chunkBytes += charBytes;
  }
  if (chunkText) {
    chunks.push({
      frameType: 'terminal.data',
      offsetStart: chunkOffsetStart,
      offsetEnd: chunkOffsetStart + chunkBytes,
      text: chunkText,
    });
  }
  return chunks;
}

function applyReconnectJitter(delayMs: number, maxDelayMs: number) {
  if (delayMs <= 1) {
    return delayMs;
  }
  const jitterRange = delayMs * TERMINAL_RECONNECT_JITTER_RATIO;
  const jitteredDelay = delayMs + (Math.random() * 2 - 1) * jitterRange;
  return Math.min(maxDelayMs, Math.max(0, Math.round(jitteredDelay)));
}

export class TerminalStreamClient {
  private ws?: TerminalStreamWebSocket;
  private readonly state: TerminalStreamClientState;
  private requestId = '';
  private ticketRequestId = 0;
  private subscribeTicket?: TerminalStreamTicket;
  private reconnectTimer?: ReturnType<typeof setTimeout>;
  private reconnectAttempts = 0;
  private closedByClient = false;
  private terminalEnded = false;

  constructor(private readonly options: TerminalStreamClientOptions) {
    this.state = {
      connectionState: 'closed',
      currentOffset: options.lastOffset || 0,
      previewText: '',
    };
  }

  getState() {
    return { ...this.state };
  }

  connect() {
    if (!this.options.createStreamTicket) {
      this.updateState({
        connectionState: 'error',
        lastErrorCode: 'TERMINAL_AUTH_FAILED',
      });
      return;
    }

    this.closedByClient = false;
    this.terminalEnded = false;
    this.reconnectAttempts = 0;
    this.openSocket('connecting');
  }

  close() {
    this.closedByClient = true;
    this.ticketRequestId += 1;
    this.clearReconnectTimer();
    this.detachSocket(true);
    this.updateState({ connectionState: 'closed' });
  }

  private openSocket(connectionState: TerminalStreamConnectionState) {
    this.detachSocket(false);
    this.subscribeTicket = undefined;
    this.updateState({ connectionState });
    const ticketRequestId = (this.ticketRequestId += 1);
    this.options
      .createStreamTicket?.(this.options.runId)
      .then((ticket) => {
        if (this.closedByClient || this.terminalEnded || this.ticketRequestId !== ticketRequestId) {
          return;
        }
        if (!ticket.ticket) {
          this.updateState({
            connectionState: 'error',
            lastErrorCode: 'TERMINAL_AUTH_FAILED',
          });
          return;
        }
        this.subscribeTicket = ticket;
        const ws = this.createWebSocket();
        this.ws = ws;
        ws.addEventListener('open', this.handleOpen);
        ws.addEventListener('message', this.handleMessage);
        ws.addEventListener('close', this.handleClose);
        ws.addEventListener('error', this.handleSocketError);
      })
      .catch(() => {
        if (this.closedByClient || this.terminalEnded || this.ticketRequestId !== ticketRequestId) {
          return;
        }
        this.updateState({
          connectionState: 'error',
          lastErrorCode: 'TERMINAL_AUTH_FAILED',
        });
      });
  }

  private detachSocket(closeSocket: boolean) {
    const ws = this.ws;
    if (!ws) {
      return;
    }
    ws.removeEventListener('open', this.handleOpen);
    ws.removeEventListener('message', this.handleMessage);
    ws.removeEventListener('close', this.handleClose);
    ws.removeEventListener('error', this.handleSocketError);
    this.ws = undefined;
    if (closeSocket) {
      ws.close();
    }
  }

  private clearReconnectTimer() {
    if (!this.reconnectTimer) {
      return;
    }
    clearTimeout(this.reconnectTimer);
    this.reconnectTimer = undefined;
  }

  private createWebSocket() {
    const url = buildTerminalStreamUrl({
      baseUrl: this.options.baseUrl,
    });
    const protocols = buildTerminalStreamProtocols(this.subscribeTicket);
    return this.options.createWebSocket ? this.options.createWebSocket(url, protocols) : new WebSocket(url, protocols);
  }

  private readonly handleOpen = () => {
    if (!this.subscribeTicket) {
      this.updateState({
        connectionState: 'error',
        lastErrorCode: 'TERMINAL_AUTH_FAILED',
      });
      this.detachSocket(true);
      return;
    }
    this.requestId = `browser-subscribe-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    this.ws?.send(
      JSON.stringify({
        type: 'browser.subscribe',
        protocol: TERMINAL_PROTOCOL,
        requestId: this.requestId,
        runId: this.options.runId,
        lastOffset: this.state.currentOffset,
      }),
    );
  };

  private readonly handleMessage = (event: TerminalStreamWebSocketEvent) => {
    if (!event.data) {
      return;
    }
    let payload: unknown;
    try {
      payload = JSON.parse(event.data) as unknown;
    } catch {
      this.updateState({
        connectionState: 'error',
        lastErrorCode: 'TERMINAL_PROTOCOL_ERROR',
      });
      return;
    }
    const parsed = parseTerminalFrame(payload, { allowMissingSessionName: true });
    if (parsed.ok === false) {
      this.updateState({
        connectionState: 'error',
        lastErrorCode: parsed.error.code,
      });
      return;
    }
    this.consumeFrame(parsed.frame);
  };

  private readonly handleClose = () => {
    this.detachSocket(false);
    if (this.closedByClient || this.terminalEnded || this.state.connectionState === 'error') {
      this.updateState({
        connectionState: this.state.connectionState === 'error' ? 'error' : 'closed',
      });
      return;
    }
    this.scheduleReconnect();
  };

  private readonly handleSocketError = () => {
    this.updateState({
      lastErrorCode: 'TERMINAL_DAEMON_UNAVAILABLE',
    });
  };

  private consumeFrame(frame: TerminalFrame) {
    if (frame.type === 'ack' && frame.requestId === this.requestId) {
      this.reconnectAttempts = 0;
      this.updateState({ connectionState: 'live', lastErrorCode: undefined });
      return;
    }
    if (frame.type === 'terminal.data' || frame.type === 'terminal.snapshot') {
      if (frame.offsetEnd <= this.state.currentOffset) {
        return;
      }
      if (frame.offsetStart > this.state.currentOffset) {
        this.reconnectForSnapshotCompensation('TERMINAL_OFFSET_GAP');
        return;
      }
      const currentOffset = this.state.currentOffset;
      const decodedText = decodeTerminalPayload(frame.payload);
      const text = sliceDecodedPayloadByByteOffset(decodedText, currentOffset - frame.offsetStart);
      const nextText = `${this.state.previewText}${text}`;
      for (const chunk of splitDecodedTextByByteLimit(
        text,
        Math.max(frame.offsetStart, currentOffset),
        TERMINAL_BROWSER_MAX_DECODED_PAYLOAD_BYTES_PER_FRAME,
      )) {
        this.options.onChunk?.({
          ...chunk,
          frameType: frame.type,
        });
      }
      this.updateState({
        connectionState: 'live',
        currentOffset: frame.offsetEnd,
        previewText: nextText.slice(-DEFAULT_PREVIEW_LIMIT),
        lastErrorCode: undefined,
      });
      return;
    }
    if (frame.type === 'terminal.end') {
      this.terminalEnded = true;
      this.updateState({
        connectionState: 'closed',
        currentOffset: Math.max(this.state.currentOffset, frame.offsetEnd),
      });
      return;
    }
    if (frame.type === 'error') {
      this.updateState({
        connectionState: 'error',
        lastErrorCode: frame.code,
      });
    }
  }

  private scheduleReconnect() {
    const maxReconnectAttempts = this.options.maxReconnectAttempts ?? DEFAULT_MAX_RECONNECT_ATTEMPTS;
    if (this.reconnectAttempts >= maxReconnectAttempts) {
      this.updateState({ connectionState: 'closed' });
      return;
    }
    this.reconnectAttempts += 1;
    this.updateState({ connectionState: 'reconnecting' });
    this.clearReconnectTimer();
    const maxReconnectDelayMs = this.options.maxReconnectDelayMs ?? DEFAULT_MAX_RECONNECT_DELAY_MS;
    const baseDelay = Math.min(
      (this.options.reconnectDelayMs ?? DEFAULT_RECONNECT_DELAY_MS) * 2 ** Math.max(0, this.reconnectAttempts - 1),
      maxReconnectDelayMs,
    );
    this.reconnectTimer = setTimeout(
      () => {
        this.reconnectTimer = undefined;
        if (this.closedByClient || this.terminalEnded) {
          return;
        }
        this.openSocket('reconnecting');
      },
      applyReconnectJitter(baseDelay, maxReconnectDelayMs),
    );
  }

  private reconnectForSnapshotCompensation(lastErrorCode: TerminalErrorCode) {
    this.updateState({ lastErrorCode });
    this.detachSocket(true);
    if (this.closedByClient || this.terminalEnded) {
      return;
    }
    this.scheduleReconnect();
  }

  private updateState(nextState: Partial<TerminalStreamClientState>) {
    Object.assign(this.state, nextState);
    this.options.onStateChange?.(this.getState());
  }
}
