/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export const TERMINAL_PROTOCOL = 'agent-gateway.terminal.v1' as const;
export const TERMINAL_PAYLOAD_ENCODING = 'base64-utf8' as const;
export const TERMINAL_STREAM_WS_PATH = '/ws/agent-gateway/terminal' as const;
export const TERMINAL_DAEMON_TARGET_CHUNK_BYTES = 32 * 1024;
export const TERMINAL_SERVER_MAX_RAW_FRAME_BYTES = 512 * 1024;
export const TERMINAL_SERVER_MAX_DECODED_PAYLOAD_BYTES = 256 * 1024;
export const TERMINAL_BROWSER_MAX_DECODED_PAYLOAD_BYTES_PER_FRAME = 128 * 1024;
export const TERMINAL_MAX_BROWSER_SUBSCRIPTIONS_PER_USER = 8;
export const TERMINAL_MAX_BROWSER_SUBSCRIPTIONS_PER_RUN = 32;
export const TERMINAL_MAX_DAEMON_STREAM_BINDINGS_PER_NODE = 64;
export const TERMINAL_RING_BUFFER_MAX_BYTES = 4 * 1024 * 1024;
export const TERMINAL_RING_BUFFER_MAX_CHUNKS = 4096;
export const TERMINAL_RING_BUFFER_MIN_RETENTION_MS = 10 * 60 * 1000;
export const TERMINAL_RING_BUFFER_RELEASE_AFTER_END_MS = 10 * 60 * 1000;
export const TERMINAL_RECONNECT_INITIAL_DELAY_MS = 500;
export const TERMINAL_RECONNECT_MAX_DELAY_MS = 10 * 1000;
export const TERMINAL_RECONNECT_JITTER_RATIO = 0.2;

export type TerminalProtocol = typeof TERMINAL_PROTOCOL;
export type TerminalPayloadEncoding = typeof TERMINAL_PAYLOAD_ENCODING;

export type TerminalClientSubscribe = {
  type: 'browser.subscribe';
  protocol: TerminalProtocol;
  requestId: string;
  runId: string;
  lastOffset?: number;
};

export type TerminalDaemonRegister = {
  type: 'daemon.register';
  protocol: TerminalProtocol;
  requestId: string;
  nodeId: string;
  capabilities: {
    terminalStream: boolean;
  };
};

export type TerminalDaemonBindRun = {
  type: 'daemon.bindRun';
  protocol: TerminalProtocol;
  requestId: string;
  runId: string;
  sessionName: string;
  startOffset: number;
  claimToken: string;
  claimAttempt: number;
  leaseVersion: number;
};

export type TerminalSnapshotRequest = {
  type: 'daemon.snapshotRequest';
  protocol: TerminalProtocol;
  requestId: string;
  runId: string;
  fromOffset: number;
};

export type TerminalData = {
  type: 'terminal.data';
  protocol: TerminalProtocol;
  runId: string;
  sessionName: string;
  offsetStart: number;
  offsetEnd: number;
  payloadEncoding: TerminalPayloadEncoding;
  payload: string;
};

export type TerminalSnapshot = {
  type: 'terminal.snapshot';
  protocol: TerminalProtocol;
  requestId?: string;
  runId: string;
  sessionName: string;
  offsetStart: number;
  offsetEnd: number;
  payloadEncoding: TerminalPayloadEncoding;
  payload: string;
};

export type TerminalEnd = {
  type: 'terminal.end';
  protocol: TerminalProtocol;
  runId: string;
  sessionName: string;
  offsetEnd: number;
  reason: 'completed' | 'canceled' | 'failed' | 'timeout' | 'disconnected';
};

export type TerminalAck = {
  type: 'ack';
  protocol: TerminalProtocol;
  requestId: string;
};

export type TerminalErrorCode =
  | 'TERMINAL_PROTOCOL_ERROR'
  | 'TERMINAL_AUTH_FAILED'
  | 'TERMINAL_PERMISSION_DENIED'
  | 'TERMINAL_RUN_NOT_BOUND'
  | 'TERMINAL_LEASE_LOST'
  | 'TERMINAL_DAEMON_UNAVAILABLE'
  | 'TERMINAL_OFFSET_GAP'
  | 'TERMINAL_FRAME_TOO_LARGE'
  | 'TERMINAL_SUBSCRIPTION_LIMIT'
  | 'TERMINAL_RAW_WRITE_DISABLED';

export type TerminalError = {
  type: 'error';
  protocol: TerminalProtocol;
  requestId?: string;
  code: TerminalErrorCode;
  message: string;
  details?: Record<string, unknown>;
};

export type TerminalClientFrame = TerminalClientSubscribe;

export type TerminalDaemonFrame =
  | TerminalDaemonRegister
  | TerminalDaemonBindRun
  | TerminalData
  | TerminalSnapshot
  | TerminalEnd
  | TerminalError;

export type TerminalServerFrame =
  | TerminalSnapshotRequest
  | TerminalAck
  | TerminalData
  | TerminalSnapshot
  | TerminalEnd
  | TerminalError;

export type TerminalFrame = TerminalClientFrame | TerminalDaemonFrame | TerminalServerFrame;

export type TerminalFrameType = TerminalFrame['type'];

export type TerminalParseResult =
  | {
      ok: true;
      frame: TerminalFrame;
    }
  | {
      ok: false;
      error: TerminalError;
    };

export interface TerminalParseOptions {
  allowMissingSessionName?: boolean;
}

type JsonRecord = Record<string, unknown>;

const TERMINAL_FRAME_TYPES = new Set<TerminalFrameType>([
  'browser.subscribe',
  'daemon.register',
  'daemon.bindRun',
  'daemon.snapshotRequest',
  'terminal.data',
  'terminal.snapshot',
  'terminal.end',
  'ack',
  'error',
]);

const TERMINAL_ERROR_CODES = new Set<TerminalErrorCode>([
  'TERMINAL_PROTOCOL_ERROR',
  'TERMINAL_AUTH_FAILED',
  'TERMINAL_PERMISSION_DENIED',
  'TERMINAL_RUN_NOT_BOUND',
  'TERMINAL_LEASE_LOST',
  'TERMINAL_DAEMON_UNAVAILABLE',
  'TERMINAL_OFFSET_GAP',
  'TERMINAL_FRAME_TOO_LARGE',
  'TERMINAL_SUBSCRIPTION_LIMIT',
  'TERMINAL_RAW_WRITE_DISABLED',
]);

const TERMINAL_END_REASONS = new Set<TerminalEnd['reason']>([
  'completed',
  'canceled',
  'failed',
  'timeout',
  'disconnected',
]);

function isRecord(value: unknown): value is JsonRecord {
  return Object.prototype.toString.call(value) === '[object Object]';
}

function getString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function isNonEmptyString(value: unknown) {
  return Boolean(getString(value));
}

function isNonNegativeInteger(value: unknown) {
  return Number.isInteger(value) && Number(value) >= 0;
}

function protocolError(message: string, requestId?: string): TerminalError {
  return {
    type: 'error',
    protocol: TERMINAL_PROTOCOL,
    requestId,
    code: 'TERMINAL_PROTOCOL_ERROR',
    message,
  };
}

function validateBaseFields(record: JsonRecord): TerminalError | null {
  if (!TERMINAL_FRAME_TYPES.has(record.type as TerminalFrameType)) {
    return protocolError('Unsupported terminal stream frame type');
  }
  if (record.protocol !== TERMINAL_PROTOCOL) {
    return protocolError('Unsupported terminal stream protocol', getString(record.requestId) || undefined);
  }
  return null;
}

function validateRequestId(record: JsonRecord) {
  return isNonEmptyString(record.requestId) ? null : protocolError('requestId is required');
}

function validateRunId(record: JsonRecord) {
  return isNonEmptyString(record.runId)
    ? null
    : protocolError('runId is required', getString(record.requestId) || undefined);
}

function validateOffsetPair(record: JsonRecord) {
  if (!isNonNegativeInteger(record.offsetStart) || !isNonNegativeInteger(record.offsetEnd)) {
    return protocolError(
      'offsetStart and offsetEnd must be non-negative integers',
      getString(record.requestId) || undefined,
    );
  }
  if (Number(record.offsetStart) > Number(record.offsetEnd)) {
    return protocolError(
      'offsetStart must be less than or equal to offsetEnd',
      getString(record.requestId) || undefined,
    );
  }
  return null;
}

function validateSessionName(record: JsonRecord, options: TerminalParseOptions) {
  if (isNonEmptyString(record.sessionName) || options.allowMissingSessionName) {
    return null;
  }
  return protocolError('sessionName is required', getString(record.requestId) || undefined);
}

function validatePayloadFrame(record: JsonRecord, options: TerminalParseOptions) {
  const payloadIsValid =
    isNonEmptyString(record.payload) ||
    (record.type === 'terminal.snapshot' &&
      typeof record.payload === 'string' &&
      record.payload === '' &&
      record.offsetStart === record.offsetEnd);
  return (
    validateRunId(record) ||
    validateSessionName(record, options) ||
    validateOffsetPair(record) ||
    (record.payloadEncoding === TERMINAL_PAYLOAD_ENCODING
      ? null
      : protocolError('payloadEncoding must be base64-utf8', getString(record.requestId) || undefined)) ||
    (payloadIsValid ? null : protocolError('payload is required', getString(record.requestId) || undefined))
  );
}

function normalizeTerminalFrame(record: JsonRecord): TerminalFrame {
  if (record.type === 'browser.subscribe') {
    return {
      type: 'browser.subscribe',
      protocol: TERMINAL_PROTOCOL,
      requestId: getString(record.requestId),
      runId: getString(record.runId),
      lastOffset: record.lastOffset === undefined ? undefined : Number(record.lastOffset),
    };
  }
  if (record.type === 'daemon.register') {
    return {
      type: 'daemon.register',
      protocol: TERMINAL_PROTOCOL,
      requestId: getString(record.requestId),
      nodeId: getString(record.nodeId),
      capabilities: {
        terminalStream: Boolean((record.capabilities as JsonRecord).terminalStream),
      },
    };
  }
  if (record.type === 'daemon.bindRun') {
    return {
      type: 'daemon.bindRun',
      protocol: TERMINAL_PROTOCOL,
      requestId: getString(record.requestId),
      runId: getString(record.runId),
      sessionName: getString(record.sessionName),
      startOffset: Number(record.startOffset),
      claimToken: getString(record.claimToken),
      claimAttempt: Number(record.claimAttempt),
      leaseVersion: Number(record.leaseVersion),
    };
  }
  if (record.type === 'daemon.snapshotRequest') {
    return {
      type: 'daemon.snapshotRequest',
      protocol: TERMINAL_PROTOCOL,
      requestId: getString(record.requestId),
      runId: getString(record.runId),
      fromOffset: Number(record.fromOffset),
    };
  }
  if (record.type === 'terminal.data') {
    return {
      type: 'terminal.data',
      protocol: TERMINAL_PROTOCOL,
      runId: getString(record.runId),
      sessionName: getString(record.sessionName),
      offsetStart: Number(record.offsetStart),
      offsetEnd: Number(record.offsetEnd),
      payloadEncoding: TERMINAL_PAYLOAD_ENCODING,
      payload: getString(record.payload),
    };
  }
  if (record.type === 'terminal.snapshot') {
    return {
      type: 'terminal.snapshot',
      protocol: TERMINAL_PROTOCOL,
      requestId: record.requestId === undefined ? undefined : getString(record.requestId),
      runId: getString(record.runId),
      sessionName: getString(record.sessionName),
      offsetStart: Number(record.offsetStart),
      offsetEnd: Number(record.offsetEnd),
      payloadEncoding: TERMINAL_PAYLOAD_ENCODING,
      payload: getString(record.payload),
    };
  }
  if (record.type === 'terminal.end') {
    return {
      type: 'terminal.end',
      protocol: TERMINAL_PROTOCOL,
      runId: getString(record.runId),
      sessionName: getString(record.sessionName),
      offsetEnd: Number(record.offsetEnd),
      reason: record.reason as TerminalEnd['reason'],
    };
  }
  if (record.type === 'ack') {
    return {
      type: 'ack',
      protocol: TERMINAL_PROTOCOL,
      requestId: getString(record.requestId),
    };
  }

  return {
    type: 'error',
    protocol: TERMINAL_PROTOCOL,
    requestId: record.requestId === undefined ? undefined : getString(record.requestId),
    code: record.code as TerminalErrorCode,
    message: getString(record.message),
  };
}

export function parseTerminalFrame(input: unknown, options: TerminalParseOptions = {}): TerminalParseResult {
  const record = isRecord(input) ? input : null;
  if (!record) {
    return {
      ok: false,
      error: protocolError('Terminal stream frame must be a JSON object'),
    };
  }

  const baseError = validateBaseFields(record);
  if (baseError) {
    return {
      ok: false,
      error: baseError,
    };
  }

  const error =
    record.type === 'browser.subscribe'
      ? validateRequestId(record) ||
        validateRunId(record) ||
        (record.lastOffset === undefined || isNonNegativeInteger(record.lastOffset)
          ? null
          : protocolError('lastOffset must be a non-negative integer', getString(record.requestId)))
      : record.type === 'daemon.register'
        ? validateRequestId(record) ||
          (isNonEmptyString(record.nodeId) ? null : protocolError('nodeId is required', getString(record.requestId))) ||
          (isRecord(record.capabilities) && typeof record.capabilities.terminalStream === 'boolean'
            ? null
            : protocolError('capabilities.terminalStream is required', getString(record.requestId)))
        : record.type === 'daemon.bindRun'
          ? validateRequestId(record) ||
            validateRunId(record) ||
            (isNonEmptyString(record.sessionName)
              ? null
              : protocolError('sessionName is required', getString(record.requestId))) ||
            (isNonNegativeInteger(record.startOffset)
              ? null
              : protocolError('startOffset must be a non-negative integer', getString(record.requestId))) ||
            (isNonEmptyString(record.claimToken)
              ? null
              : protocolError('claimToken is required', getString(record.requestId))) ||
            (isNonNegativeInteger(record.claimAttempt)
              ? null
              : protocolError('claimAttempt must be a non-negative integer', getString(record.requestId))) ||
            (isNonNegativeInteger(record.leaseVersion)
              ? null
              : protocolError('leaseVersion must be a non-negative integer', getString(record.requestId)))
          : record.type === 'daemon.snapshotRequest'
            ? validateRequestId(record) ||
              validateRunId(record) ||
              (isNonNegativeInteger(record.fromOffset)
                ? null
                : protocolError('fromOffset must be a non-negative integer', getString(record.requestId)))
            : record.type === 'terminal.data' || record.type === 'terminal.snapshot'
              ? validatePayloadFrame(record, options)
              : record.type === 'terminal.end'
                ? validateRunId(record) ||
                  validateSessionName(record, options) ||
                  (isNonNegativeInteger(record.offsetEnd)
                    ? null
                    : protocolError(
                        'offsetEnd must be a non-negative integer',
                        getString(record.requestId) || undefined,
                      )) ||
                  (TERMINAL_END_REASONS.has(record.reason as TerminalEnd['reason'])
                    ? null
                    : protocolError('terminal end reason is invalid', getString(record.requestId) || undefined))
                : record.type === 'ack'
                  ? validateRequestId(record)
                  : record.type === 'error'
                    ? (record.requestId === undefined || isNonEmptyString(record.requestId)
                        ? null
                        : protocolError('requestId must be a non-empty string')) ||
                      (TERMINAL_ERROR_CODES.has(record.code as TerminalErrorCode)
                        ? null
                        : protocolError('terminal error code is invalid', getString(record.requestId) || undefined)) ||
                      (isNonEmptyString(record.message)
                        ? null
                        : protocolError('terminal error message is required', getString(record.requestId) || undefined))
                    : protocolError('Unsupported terminal stream frame type', getString(record.requestId) || undefined);

  if (error) {
    return {
      ok: false,
      error,
    };
  }

  return {
    ok: true,
    frame: normalizeTerminalFrame(record),
  };
}

export function parseTerminalFrameJson(input: string, options: TerminalParseOptions = {}): TerminalParseResult {
  try {
    return parseTerminalFrame(JSON.parse(input) as unknown, options);
  } catch {
    return {
      ok: false,
      error: protocolError('Terminal stream frame must be valid JSON'),
    };
  }
}

export function createTerminalAck(requestId: string): TerminalAck {
  return {
    type: 'ack',
    protocol: TERMINAL_PROTOCOL,
    requestId,
  };
}

export function createTerminalError(
  code: TerminalErrorCode,
  message: string,
  options: { requestId?: string; details?: Record<string, unknown> } = {},
): TerminalError {
  return {
    type: 'error',
    protocol: TERMINAL_PROTOCOL,
    requestId: options.requestId,
    code,
    message,
    details: options.details,
  };
}

export function encodeTerminalPayload(text: string) {
  return Buffer.from(text, 'utf8').toString('base64');
}

export function decodeTerminalPayload(payload: string) {
  return Buffer.from(payload, 'base64').toString('utf8');
}

export function getTerminalPayloadByteLength(payload: string) {
  return Buffer.from(payload, 'base64').byteLength;
}

export function createTerminalDataFrame(options: {
  runId: string;
  sessionName: string;
  offsetStart: number;
  text: string;
}): TerminalData {
  const payload = encodeTerminalPayload(options.text);
  const byteLength = Buffer.byteLength(options.text, 'utf8');
  return {
    type: 'terminal.data',
    protocol: TERMINAL_PROTOCOL,
    runId: options.runId,
    sessionName: options.sessionName,
    offsetStart: options.offsetStart,
    offsetEnd: options.offsetStart + byteLength,
    payloadEncoding: TERMINAL_PAYLOAD_ENCODING,
    payload,
  };
}
