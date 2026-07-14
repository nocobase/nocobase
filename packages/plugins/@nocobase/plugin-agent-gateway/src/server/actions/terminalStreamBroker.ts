/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { IncomingMessage } from 'http';
import { randomUUID } from 'crypto';
import { Duplex } from 'stream';
import { parse } from 'url';

import { Context } from '@nocobase/actions';
import { Application, Gateway, Plugin } from '@nocobase/server';
import type { Transaction } from 'sequelize';
import WebSocket, { RawData, WebSocketServer } from 'ws';

import {
  TERMINAL_MAX_BROWSER_SUBSCRIPTIONS_PER_RUN,
  TERMINAL_MAX_BROWSER_SUBSCRIPTIONS_PER_USER,
  TERMINAL_MAX_DAEMON_STREAM_BINDINGS_PER_NODE,
  TERMINAL_STREAM_BROWSER_SUBPROTOCOL,
  TERMINAL_STREAM_BROWSER_TICKET_PROTOCOL_PREFIX,
  TERMINAL_STREAM_WS_PATH,
  TERMINAL_SERVER_MAX_RAW_FRAME_BYTES,
  TERMINAL_SERVER_MAX_DECODED_PAYLOAD_BYTES,
  TerminalBrowserControlNotify,
  TerminalClientSubscribe,
  TerminalDaemonBindRun,
  TerminalData,
  TerminalEnd,
  TerminalError,
  TerminalFrame,
  TerminalSnapshot,
  createTerminalAck,
  createTerminalError,
  getTerminalPayloadByteLength,
  parseTerminalFrame,
  parseTerminalFrameJson,
} from '../../shared/terminalStreamProtocol';
import { AGENT_GATEWAY_API_ACTIONS, getAgentGatewayApiActionName } from '../../shared/apiContract';
import { AGENT_GATEWAY_ACTIONS, authenticateNodeToken, verifyClaimToken } from '../security';
import {
  JsonRecord,
  ModelRecord,
  asActionContext,
  assertRunVisible,
  getCurrentUserId,
  getModelNumber,
  getModelString,
  getModelTargetKey,
  getModelValue,
  getRecord,
  getString,
  hasAgentGatewayPermission,
  requireAgentGatewayPermission,
} from './utils';
import { validateRunLease } from './runLifecycle';
import { TerminalStreamTicketError, consumeTerminalStreamTicket } from './terminalStreamTickets';
import { ACTIVE_RUN_STATUSES } from '../../shared/runState';
import {
  NocoBaseTerminalStreamTransport,
  TerminalStreamBrowserTransportEvent,
  TerminalStreamDaemonTransportEvent,
  TerminalStreamTransport,
  TerminalStreamTransportUnsubscribe,
} from '../services/terminalStreamTransport';

const MAX_TERMINAL_WEBSOCKET_BUFFERED_BYTES = 1024 * 1024;
const MAX_TERMINAL_QUEUED_FRAMES_PER_CONNECTION = 256;
const TERMINAL_ACTIVITY_TOUCH_MIN_INTERVAL_MS = 2000;
const TERMINAL_LEASE_REVALIDATION_INTERVAL_MS = 2000;
const TERMINAL_SNAPSHOT_REQUEST_TIMEOUT_MS = 10_000;
const TERMINAL_BROKER_HEARTBEAT_INTERVAL_MS = 2000;
const TERMINAL_BROKER_OWNER_TIMEOUT_MS = 10_000;
const TERMINAL_BROKER_DEDUP_EVENT_LIMIT = 8192;
const ACTIVE_TERMINAL_STREAM_RUN_STATUSES = new Set<string>(ACTIVE_RUN_STATUSES);
const TERMINALIZED_RUN_END_REASONS = new Map<string, TerminalEnd['reason']>([
  ['succeeded', 'completed'],
  ['failed', 'failed'],
  ['canceled', 'canceled'],
  ['timeout', 'timeout'],
  ['abandoned', 'disconnected'],
]);

type ConnectionKind = 'unknown' | 'daemon' | 'browser';

interface TerminalStreamConnection {
  ws: WebSocket;
  request: IncomingMessage;
  kind: ConnectionKind;
  nodeId?: string;
  nodeToken?: string;
  userId?: string | number;
  authorizedRunIds: Set<string>;
  subscriptions: Set<string>;
}

interface BoundRunStream {
  ws: WebSocket;
  nodeId: string;
  sessionName: string;
  claimToken: string;
  claimAttempt: number;
  leaseVersion: number;
  leaseExpiresAtMs: number;
  lastLeaseValidationAtMs: number;
}

interface PendingSnapshotRequest {
  browser: WebSocket;
  daemon?: WebSocket;
  runId: string;
  fromOffset: number;
  subscribeOnSuccess?: boolean;
  reservationId?: string;
  timeout: ReturnType<typeof setTimeout>;
}

interface RelayedSnapshotRequest {
  requesterId: string;
  runId: string;
  daemon: WebSocket;
  timeout: ReturnType<typeof setTimeout>;
}

interface RemoteRunOwner {
  ownerId: string;
  lastSeenAtMs: number;
  unavailableNotified: boolean;
}

interface PendingBrowserSubscriptionReservation {
  browser: WebSocket;
  runId: string;
}

type BoundRunValidationResult =
  | {
      ok: true;
      bound: BoundRunStream;
    }
  | {
      ok: false;
      reason: 'missing' | 'leaseLost';
    };

interface AuthContextShape {
  app: Application;
  db: Application['db'];
  cache: Application['cache'];
  logger: Application['logger'];
  log: Application['log'];
  headers: Record<string, string>;
  state: Record<string, unknown>;
  auth?: {
    user?: unknown;
  };
  body?: unknown;
  status?: number;
  originalUrl: string;
  req: {
    headers: Record<string, string>;
  };
  request: {
    headers: Record<string, string>;
  };
  get(name: string): string;
  getBearerToken(): string;
  throw(status: number, message?: string | { message?: string; code?: string }): never;
  t(key: string, options?: Record<string, unknown>): string;
}

function getHeader(headers: IncomingMessage['headers'], name: string) {
  const value = headers[name.toLowerCase()];
  if (Array.isArray(value)) {
    return value[0] || '';
  }
  return value || '';
}

function getHeaderRecord(request: IncomingMessage) {
  const headers: Record<string, string> = {};
  for (const [key, value] of Object.entries(request.headers)) {
    headers[key.toLowerCase()] = Array.isArray(value) ? value[0] || '' : value || '';
  }
  return headers;
}

function getBearerTokenFromRequest(request: IncomingMessage) {
  const authorization = getHeader(request.headers, 'authorization');
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || '';
}

function getBearerTokenFromHeaderRecord(headers: Record<string, string>) {
  const authorization = headers.authorization || '';
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || '';
}

function getWebSocketProtocolValues(request: IncomingMessage) {
  return getHeader(request.headers, 'sec-websocket-protocol')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function isBrowserStreamUpgrade(request: IncomingMessage) {
  return getWebSocketProtocolValues(request).includes(TERMINAL_STREAM_BROWSER_SUBPROTOCOL);
}

function parseForwardedHeaderPair(item: string, name: string) {
  const matcher = new RegExp(`^${name}=(?:"([^"]+)"|([^;]+))$`, 'i');
  const match = item.match(matcher);
  return match?.[1] || match?.[2] || '';
}

function getForwardedHeaderHosts(request: IncomingMessage) {
  return getHeader(request.headers, 'forwarded')
    .split(',')
    .flatMap((entry) => entry.split(';'))
    .map((item) => item.trim())
    .map((item) => parseForwardedHeaderPair(item, 'host'))
    .filter((value): value is string => Boolean(value))
    .map((value) => value.trim())
    .filter(Boolean);
}

function getForwardedHeaderValue(request: IncomingMessage, name: string) {
  return (
    getHeader(request.headers, 'forwarded')
      .split(',')
      .flatMap((entry) => entry.split(';'))
      .map((item) => item.trim())
      .map((item) => parseForwardedHeaderPair(item, name))
      .find(Boolean) || ''
  );
}

function getForwardedHosts(request: IncomingMessage) {
  return [
    getHeader(request.headers, 'host'),
    ...getHeader(request.headers, 'x-forwarded-host')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean),
    ...getForwardedHeaderHosts(request),
  ].filter(Boolean);
}

function isLoopbackHostname(hostname: string) {
  const normalized = hostname.toLowerCase();
  return normalized === 'localhost' || normalized === '127.0.0.1' || normalized === '::1' || normalized === '[::1]';
}

function getDefaultPort(protocol: string) {
  return protocol === 'https:' || protocol === 'wss:' ? '443' : '80';
}

function normalizeForwardedProto(proto: string) {
  const normalized = proto.trim().toLowerCase();
  if (normalized === 'ws') {
    return 'http:';
  }
  if (normalized === 'wss') {
    return 'https:';
  }
  return normalized ? `${normalized.replace(/:$/, '')}:` : '';
}

function isSameOriginThroughLoopbackDevProxy(request: IncomingMessage, originUrl: URL) {
  if (!isLoopbackHostname(originUrl.hostname)) {
    return false;
  }

  const forwardedPort = getHeader(request.headers, 'x-forwarded-port') || '';
  const forwardedProto =
    getHeader(request.headers, 'x-forwarded-proto') || getForwardedHeaderValue(request, 'proto') || '';
  if (!forwardedPort || !forwardedProto) {
    return false;
  }

  const originPort = originUrl.port || getDefaultPort(originUrl.protocol);
  return forwardedPort === originPort && normalizeForwardedProto(forwardedProto) === originUrl.protocol;
}

function isSameOriginBrowserUpgrade(request: IncomingMessage) {
  const origin = getHeader(request.headers, 'origin');
  if (!origin) {
    return true;
  }
  const hosts = getForwardedHosts(request);
  if (!hosts.length) {
    return false;
  }
  try {
    const originUrl = new URL(origin);
    const originHost = originUrl.host.toLowerCase();
    if (hosts.some((host) => originHost === host.toLowerCase())) {
      return true;
    }
    return isSameOriginThroughLoopbackDevProxy(request, originUrl);
  } catch {
    return false;
  }
}

function rejectWebSocketUpgrade(socket: Duplex, status: number, message: string) {
  socket.write(`HTTP/1.1 ${status} ${message}\r\nConnection: close\r\nContent-Length: 0\r\n\r\n`);
  socket.destroy();
}

function decodeWebSocketProtocolValue(value: string) {
  try {
    const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
    return Buffer.from(padded, 'base64').toString('utf8').trim();
  } catch {
    return '';
  }
}

function getPrefixedWebSocketProtocolValue(request: IncomingMessage, prefix: string) {
  const protocol = getWebSocketProtocolValues(request).find((item) => item.startsWith(prefix));
  return protocol ? decodeWebSocketProtocolValue(protocol.slice(prefix.length)) : '';
}

function getBrowserStreamTicketFromProtocol(request: IncomingMessage) {
  return getPrefixedWebSocketProtocolValue(request, TERMINAL_STREAM_BROWSER_TICKET_PROTOCOL_PREFIX);
}

function getAuthenticatorFromRequest(request: IncomingMessage) {
  return getHeader(request.headers, 'x-authenticator') || 'basic';
}

function createAuthContext(app: Application, request: IncomingMessage): AuthContextShape {
  const headers = getHeaderRecord(request);
  const token = getBearerTokenFromRequest(request);
  const authenticator = getAuthenticatorFromRequest(request);
  if (token) {
    headers.authorization = `Bearer ${token}`;
  }
  if (authenticator) {
    headers['x-authenticator'] = authenticator;
  }
  const role = getHeader(request.headers, 'x-role');
  if (role) {
    headers['x-role'] = role;
  }

  return {
    app,
    db: app.db,
    cache: app.cache,
    logger: app.logger,
    log: app.log,
    headers,
    state: {},
    originalUrl: request.url || TERMINAL_STREAM_WS_PATH,
    req: {
      headers,
    },
    request: {
      headers,
    },
    get(name: string) {
      return headers[name.toLowerCase()] || '';
    },
    getBearerToken() {
      return getBearerTokenFromHeaderRecord(headers);
    },
    throw(status: number, message?: string | { message?: string; code?: string }) {
      const error = new Error(typeof message === 'string' ? message : message?.message || `HTTP ${status}`) as Error & {
        status?: number;
        code?: string;
      };
      error.status = status;
      if (typeof message === 'object' && message?.code) {
        error.code = message.code;
      }
      throw error;
    },
    t(key: string) {
      return key;
    },
  };
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function getDateFromModel(model: ModelRecord, key: string) {
  const value = getModelValue(model, key);
  if (!value) {
    return null;
  }
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
}

function isProtocolRawWrite(input: unknown) {
  const record = getRecord(input);
  return (
    record.type === 'browser.write' ||
    record.type === 'browser.input' ||
    record.type === 'terminal.write' ||
    record.type === 'terminal.input'
  );
}

function getRawDataByteLength(data: RawData) {
  if (Buffer.isBuffer(data)) {
    return data.byteLength;
  }
  if (Array.isArray(data)) {
    return data.reduce((sum, chunk) => sum + chunk.byteLength, 0);
  }
  if (data instanceof ArrayBuffer) {
    return data.byteLength;
  }
  return Buffer.byteLength(String(data));
}

function rawDataToString(data: RawData) {
  if (Buffer.isBuffer(data)) {
    return data.toString();
  }
  if (Array.isArray(data)) {
    return Buffer.concat(data).toString();
  }
  if (data instanceof ArrayBuffer) {
    return Buffer.from(data).toString();
  }
  return String(data);
}

export class TerminalStreamBroker {
  private readonly ownerId = randomUUID();
  private readonly wss = new WebSocketServer({
    noServer: true,
    maxPayload: TERMINAL_SERVER_MAX_RAW_FRAME_BYTES,
    handleProtocols: (protocols) => {
      return protocols.has(TERMINAL_STREAM_BROWSER_SUBPROTOCOL) ? TERMINAL_STREAM_BROWSER_SUBPROTOCOL : false;
    },
  });
  private readonly connections = new Map<WebSocket, TerminalStreamConnection>();
  private readonly boundRuns = new Map<string, BoundRunStream>();
  private readonly browserSubscriptions = new Map<string, Set<WebSocket>>();
  private readonly pendingSnapshotRequests = new Map<string, PendingSnapshotRequest>();
  private readonly relayedSnapshotRequests = new Map<string, RelayedSnapshotRequest>();
  private readonly pendingBrowserSubscriptionReservations = new Map<string, PendingBrowserSubscriptionReservation>();
  private readonly frameQueues = new Map<WebSocket, Promise<void>>();
  private readonly frameQueueDepths = new Map<WebSocket, number>();
  private readonly terminalActivityTouchedAt = new Map<string, number>();
  private readonly daemonTransportSubscriptions = new Map<string, Promise<TerminalStreamTransportUnsubscribe>>();
  private readonly browserTransportSubscriptions = new Map<string, Promise<TerminalStreamTransportUnsubscribe>>();
  private readonly transportSequences = new Map<string, number>();
  private readonly receivedTransportSequences = new Map<string, number>();
  private readonly receivedTransportEventIds = new Set<string>();
  private readonly receivedTransportEventOrder: string[] = [];
  private readonly remoteRunOwners = new Map<string, RemoteRunOwner>();
  private sharedTransportAvailable = false;
  private brokerHeartbeatTimer?: ReturnType<typeof setInterval>;
  private brokerOwnerWatchdogTimer?: ReturnType<typeof setInterval>;
  private unregistered = false;
  private readonly gatewayHandler: (
    request: IncomingMessage,
    socket: Duplex,
    head: Buffer,
    app: Application,
  ) => boolean | void;

  constructor(
    private readonly app: Application,
    private readonly transport: TerminalStreamTransport = new NocoBaseTerminalStreamTransport(app),
  ) {
    this.gatewayHandler = (request, socket, head, gatewayApp) => {
      if ((gatewayApp?.name || 'main') !== (this.app.name || 'main')) {
        return false;
      }
      return this.handleUpgrade(request, socket, head);
    };

    this.wss.on('connection', (ws, request) => {
      this.connections.set(ws, {
        ws,
        request,
        kind: 'unknown',
        authorizedRunIds: new Set(),
        subscriptions: new Set(),
      });

      ws.on('message', (data) => {
        this.handleMessage(ws, data);
      });
      ws.on('close', () => {
        this.removeConnection(ws).catch((error) => {
          this.logTransportFailure('remove closed terminal connection', error);
        });
      });
      ws.on('error', () => {
        this.removeConnection(ws).catch((error) => {
          this.logTransportFailure('remove failed terminal connection', error);
        });
      });
    });
    this.startBrokerTimers();
    this.refreshTransportAvailability().catch((error) => {
      this.logTransportFailure('detect shared terminal transport', error);
    });
  }

  register() {
    Gateway.registerWsHandler(this.gatewayHandler);
  }

  async unregister() {
    if (this.unregistered) {
      return;
    }
    this.unregistered = true;
    Gateway.unregisterWsHandler(this.gatewayHandler);
    this.stopBrokerTimers();
    await Promise.all(
      Array.from(this.boundRuns.entries()).map(async ([runId, bound]) => {
        await this.publishDaemonState(runId, 'closed', bound.nodeId);
      }),
    );
    this.wss.close();
    for (const connection of this.connections.values()) {
      connection.ws.close();
    }
    this.connections.clear();
    this.boundRuns.clear();
    this.browserSubscriptions.clear();
    this.clearPendingSnapshotRequests();
    this.clearRelayedSnapshotRequests();
    this.pendingBrowserSubscriptionReservations.clear();
    this.frameQueueDepths.clear();
    this.remoteRunOwners.clear();
    this.receivedTransportSequences.clear();
    this.receivedTransportEventIds.clear();
    this.receivedTransportEventOrder.length = 0;
    await this.closeTransportSubscriptions();
    try {
      await this.transport.close();
    } catch (error) {
      this.logTransportFailure('close terminal broker transport', error);
    }
  }

  handleUpgrade(request: IncomingMessage, socket: Duplex, head: Buffer) {
    const pathname = parse(request.url || '').pathname;
    if (pathname !== TERMINAL_STREAM_WS_PATH) {
      return false;
    }

    if (isBrowserStreamUpgrade(request) && !isSameOriginBrowserUpgrade(request)) {
      rejectWebSocketUpgrade(socket, 403, 'Forbidden');
      return true;
    }

    this.wss.handleUpgrade(request, socket, head, (ws) => {
      this.wss.emit('connection', ws, request);
    });
    return true;
  }

  private handleMessage(ws: WebSocket, data: RawData) {
    const connection = this.connections.get(ws);
    if (!connection) {
      return;
    }

    if (getRawDataByteLength(data) > TERMINAL_SERVER_MAX_RAW_FRAME_BYTES) {
      this.sendError(ws, 'TERMINAL_FRAME_TOO_LARGE', 'Terminal stream frame is too large');
      return;
    }

    const rawMessage = rawDataToString(data);
    let rawFrame: unknown;
    try {
      rawFrame = JSON.parse(rawMessage) as unknown;
    } catch {
      const parseResult = parseTerminalFrameJson(rawMessage);
      if (parseResult.ok === false) {
        this.send(ws, parseResult.error);
      }
      return;
    }

    if (isProtocolRawWrite(rawFrame)) {
      this.sendError(
        ws,
        'TERMINAL_RAW_WRITE_DISABLED',
        'Raw terminal write is disabled',
        getString(getRecord(rawFrame).requestId) || undefined,
      );
      return;
    }

    const parsed = parseTerminalFrame(rawFrame);
    if (parsed.ok === false) {
      this.send(ws, parsed.error);
      return;
    }
    const payloadSizeError = this.validateDecodedPayloadSize(parsed.frame);
    if (payloadSizeError) {
      this.send(ws, payloadSizeError);
      return;
    }
    this.enqueueFrame(connection, parsed.frame);
  }

  private enqueueFrame(connection: TerminalStreamConnection, frame: TerminalFrame) {
    const queuedFrames = (this.frameQueueDepths.get(connection.ws) || 0) + 1;
    if (queuedFrames > MAX_TERMINAL_QUEUED_FRAMES_PER_CONNECTION) {
      this.sendError(connection.ws, 'TERMINAL_SUBSCRIPTION_LIMIT', 'Terminal stream frame queue limit exceeded');
      connection.ws.close();
      return;
    }
    this.frameQueueDepths.set(connection.ws, queuedFrames);
    const previous = this.frameQueues.get(connection.ws) || Promise.resolve();
    const next = previous
      .catch(() => {
        // Keep later frames moving after a previous handler failed.
      })
      .then(async () => {
        if (this.connections.get(connection.ws) !== connection) {
          return;
        }
        await this.dispatchFrame(connection, frame);
      })
      .catch((error) => {
        this.app.logger?.warn?.('Agent Gateway terminal frame handling failed', {
          error: getErrorMessage(error),
        });
        if (this.connections.get(connection.ws) === connection) {
          this.sendError(connection.ws, 'TERMINAL_PROTOCOL_ERROR', 'Terminal stream frame handling failed');
        }
      });
    this.frameQueues.set(connection.ws, next);
    next
      .finally(() => {
        const remainingFrames = Math.max(0, (this.frameQueueDepths.get(connection.ws) || 1) - 1);
        if (remainingFrames) {
          this.frameQueueDepths.set(connection.ws, remainingFrames);
        } else {
          this.frameQueueDepths.delete(connection.ws);
        }
        if (this.frameQueues.get(connection.ws) === next) {
          this.frameQueues.delete(connection.ws);
        }
      })
      .catch(() => {
        // The queue promise already handles frame errors; this only keeps cleanup non-floating.
      });
  }

  private async dispatchFrame(connection: TerminalStreamConnection, frame: TerminalFrame) {
    if (frame.type === 'daemon.register') {
      await this.handleDaemonRegister(connection, frame);
      return;
    }
    if (frame.type === 'daemon.bindRun') {
      await this.handleDaemonBindRun(connection, frame);
      return;
    }
    if (frame.type === 'browser.subscribe') {
      await this.handleBrowserSubscribe(connection, frame);
      return;
    }
    if (frame.type === 'browser.controlNotify') {
      await this.handleBrowserControlNotify(connection, frame);
      return;
    }
    if (frame.type === 'terminal.data') {
      await this.handleTerminalData(connection, frame);
      return;
    }
    if (frame.type === 'terminal.snapshot') {
      await this.handleTerminalSnapshot(connection, frame);
      return;
    }
    if (frame.type === 'terminal.end') {
      await this.handleTerminalEnd(connection, frame);
      return;
    }
    if (frame.type === 'error') {
      await this.handleDaemonError(connection, frame);
      return;
    }

    this.sendError(connection.ws, 'TERMINAL_PROTOCOL_ERROR', `Unexpected terminal stream frame: ${frame.type}`);
  }

  private async handleDaemonRegister(
    connection: TerminalStreamConnection,
    frame: TerminalFrame & { type: 'daemon.register' },
  ) {
    const ctx = createAuthContext(this.app, connection.request);
    try {
      const result = await authenticateNodeToken(ctx);
      const authenticatedNodeId = String(result.subject.nodeId);
      if (authenticatedNodeId !== frame.nodeId) {
        this.sendError(
          connection.ws,
          'TERMINAL_AUTH_FAILED',
          'Daemon node token does not match nodeId',
          frame.requestId,
        );
        return;
      }
      connection.kind = 'daemon';
      connection.nodeId = authenticatedNodeId;
      connection.nodeToken = getBearerTokenFromRequest(connection.request);
      this.send(connection.ws, createTerminalAck(frame.requestId));
    } catch (error) {
      this.sendError(connection.ws, 'TERMINAL_AUTH_FAILED', getErrorMessage(error), frame.requestId);
    }
  }

  private async handleDaemonBindRun(connection: TerminalStreamConnection, frame: TerminalDaemonBindRun) {
    if (connection.kind !== 'daemon' || !connection.nodeId) {
      this.sendError(
        connection.ws,
        'TERMINAL_AUTH_FAILED',
        'Daemon must register before binding a run',
        frame.requestId,
      );
      return;
    }

    try {
      const lease = await this.validateLease(connection, frame.runId, frame);
      if (!lease) {
        this.sendError(
          connection.ws,
          'TERMINAL_LEASE_LOST',
          'Run lease is not active for this daemon',
          frame.requestId,
        );
        return;
      }
      if (this.wouldExceedDaemonBindingLimit(connection.nodeId, frame.runId)) {
        this.sendError(
          connection.ws,
          'TERMINAL_SUBSCRIPTION_LIMIT',
          'Too many active terminal stream bindings for this node',
          frame.requestId,
        );
        return;
      }

      this.boundRuns.set(frame.runId, {
        ws: connection.ws,
        nodeId: connection.nodeId,
        sessionName: frame.sessionName,
        claimToken: frame.claimToken,
        claimAttempt: frame.claimAttempt,
        leaseVersion: frame.leaseVersion,
        leaseExpiresAtMs: getDateFromModel(lease.run, 'claimExpiresAt')?.getTime() || 0,
        lastLeaseValidationAtMs: Date.now(),
      });
      await this.ensureBrowserTransportSubscription(frame.runId);
      await this.publishDaemonState(frame.runId, 'bound', connection.nodeId);
      this.send(connection.ws, createTerminalAck(frame.requestId));
    } catch (error) {
      this.sendError(connection.ws, this.mapAuthOrLeaseError(error), getErrorMessage(error), frame.requestId);
    }
  }

  private async handleBrowserSubscribe(connection: TerminalStreamConnection, frame: TerminalClientSubscribe) {
    let reservationId: string | undefined;
    try {
      const auth = await consumeTerminalStreamTicket({
        app: this.app,
        runId: frame.runId,
        ticket: getBrowserStreamTicketFromProtocol(connection.request),
      });
      connection.kind = 'browser';
      connection.userId = auth.userId;
      const limitError = this.getBrowserSubscriptionLimitError(connection, frame.runId);
      if (limitError) {
        this.sendError(connection.ws, 'TERMINAL_SUBSCRIPTION_LIMIT', limitError, frame.requestId);
        return;
      }
      await this.ensureDaemonTransportSubscription(frame.runId);
      await this.publishBrowserLocate(frame.runId);
      connection.authorizedRunIds.add(frame.runId);
      reservationId =
        frame.lastOffset !== undefined ? this.reserveBrowserSubscription(connection, frame.runId) : undefined;
      this.send(connection.ws, createTerminalAck(frame.requestId));
      if (frame.lastOffset !== undefined) {
        const requested = await this.requestDaemonSnapshot(connection.ws, frame.runId, frame.lastOffset, {
          subscribeOnSuccess: true,
          reservationId,
        });
        if (requested) {
          return;
        }
      }
      this.promoteBrowserSubscription(connection, frame.runId, reservationId);
    } catch (error) {
      this.releaseBrowserSubscriptionReservation(reservationId);
      this.sendError(connection.ws, this.mapBrowserAuthError(error), getErrorMessage(error), frame.requestId);
    }
  }

  private async handleBrowserControlNotify(connection: TerminalStreamConnection, frame: TerminalBrowserControlNotify) {
    if (
      connection.kind !== 'browser' ||
      connection.userId === undefined ||
      !connection.authorizedRunIds.has(frame.runId)
    ) {
      this.sendError(
        connection.ws,
        'TERMINAL_PERMISSION_DENIED',
        'Control request is not available to this terminal connection',
        frame.requestId,
      );
      return;
    }

    const request = (await this.app.db.getRepository('agRunControlRequests').findOne({
      filter: {
        id: frame.controlRequestId,
        runId: frame.runId,
        requestedById: connection.userId,
      },
    })) as ModelRecord | null;
    const action = request ? getModelString(request, 'action') : '';
    if (!request || (action !== 'interrupt' && action !== 'terminate')) {
      this.sendError(
        connection.ws,
        'TERMINAL_PERMISSION_DENIED',
        'Control request is not available to this terminal connection',
        frame.requestId,
      );
      return;
    }

    const status = getModelString(request, 'status');
    if (status === 'accepted' || status === 'delivered') {
      await this.forwardControlAvailable(frame.runId, frame.controlRequestId);
    }
    this.send(connection.ws, createTerminalAck(frame.requestId));
  }

  private async forwardControlAvailable(runId: string, controlRequestId: string) {
    const validation = await this.validateBoundRun(runId);
    if (validation.ok) {
      this.send(validation.bound.ws, {
        type: 'daemon.controlAvailable',
        protocol: 'agent-gateway.terminal.v1',
        requestId: `control:${this.ownerId}:${randomUUID()}`,
        runId,
        controlRequestId,
      });
      return;
    }
    await this.publishBrowserControlAvailable(runId, controlRequestId);
  }

  private async handleTerminalData(connection: TerminalStreamConnection, frame: TerminalData) {
    if (!(await this.validateDaemonFrameBinding(connection, frame.runId))) {
      this.sendError(connection.ws, 'TERMINAL_RUN_NOT_BOUND', 'Run is not bound to this daemon', frame.requestId);
      return;
    }
    const payloadError = this.validatePayloadOffsets(frame);
    if (payloadError) {
      this.send(connection.ws, payloadError);
      return;
    }
    await this.touchRunTerminalActivity(frame.runId);
    this.broadcastToRun(frame.runId, frame);
    await this.publishDaemonFrame(frame.runId, frame);
    if (frame.requestId) {
      this.send(connection.ws, createTerminalAck(frame.requestId));
    }
  }

  private async handleTerminalSnapshot(connection: TerminalStreamConnection, frame: TerminalSnapshot) {
    const payloadError = this.validatePayloadOffsets(frame);
    if (payloadError) {
      this.send(connection.ws, payloadError);
      return;
    }
    if (!frame.requestId) {
      return;
    }
    const pending = this.pendingSnapshotRequests.get(frame.requestId);
    if (pending && pending.runId === frame.runId && pending.daemon === connection.ws) {
      this.takePendingSnapshotRequest(frame.requestId);
      const validation = await this.validateBoundRun(frame.runId, {
        expectedWs: connection.ws,
        forceRefresh: true,
      });
      if (validation.ok === false) {
        this.releaseBrowserSubscriptionReservation(pending.reservationId);
        this.sendError(
          pending.browser,
          validation.reason === 'leaseLost' ? 'TERMINAL_LEASE_LOST' : 'TERMINAL_RUN_NOT_BOUND',
          'Run stream is no longer bound to this daemon',
        );
        return;
      }
      if (pending.subscribeOnSuccess) {
        this.promoteBrowserSubscriptionBySocket(pending.browser, pending.runId, pending.reservationId);
      } else {
        this.releaseBrowserSubscriptionReservation(pending.reservationId);
      }
      this.send(pending.browser, frame);
      return;
    }
    const relayed = this.takeRelayedSnapshotRequest(frame.requestId);
    if (relayed) {
      const validation = await this.validateBoundRun(frame.runId, {
        expectedWs: connection.ws,
        forceRefresh: true,
      });
      if (validation.ok === false) {
        await this.publishSnapshotResponse(
          relayed,
          createTerminalError(
            validation.reason === 'leaseLost' ? 'TERMINAL_LEASE_LOST' : 'TERMINAL_RUN_NOT_BOUND',
            'Run stream is no longer bound to this daemon',
            { requestId: frame.requestId },
          ),
        );
        return;
      }
      await this.publishSnapshotResponse(relayed, frame);
    }
  }

  private async handleTerminalEnd(connection: TerminalStreamConnection, frame: TerminalEnd) {
    const validation = await this.validateBoundRun(frame.runId, {
      expectedWs: connection.ws,
      forceRefresh: true,
    });
    if (validation.ok === false) {
      this.sendError(
        connection.ws,
        validation.reason === 'leaseLost' ? 'TERMINAL_LEASE_LOST' : 'TERMINAL_RUN_NOT_BOUND',
        'Run stream is no longer bound to this daemon',
        frame.requestId,
      );
      return;
    }
    await this.resolvePendingSnapshotsWithTerminalEnd(connection.ws, frame);
    this.boundRuns.delete(frame.runId);
    this.terminalActivityTouchedAt.delete(frame.runId);
    this.broadcastToRun(frame.runId, frame);
    await this.publishDaemonFrame(frame.runId, frame);
    if (frame.requestId) {
      this.send(connection.ws, createTerminalAck(frame.requestId));
    }
  }

  private async touchRunTerminalActivity(runId: string) {
    const nowMs = Date.now();
    const previousMs = this.terminalActivityTouchedAt.get(runId) || 0;
    if (nowMs - previousMs < TERMINAL_ACTIVITY_TOUCH_MIN_INTERVAL_MS) {
      return;
    }
    this.terminalActivityTouchedAt.set(runId, nowMs);
    try {
      await this.app.db.getRepository('agRuns').update({
        filterByTk: runId,
        values: {
          terminalLastActivityAt: new Date(nowMs),
        },
      });
    } catch (error) {
      this.app.logger?.warn?.('Agent Gateway terminal activity update failed', {
        runId,
        error: getErrorMessage(error),
      });
    }
  }

  private async resolvePendingSnapshotsWithTerminalEnd(daemon: WebSocket, frame: TerminalEnd) {
    for (const [requestId, pending] of Array.from(this.pendingSnapshotRequests.entries())) {
      if (pending.runId !== frame.runId || pending.daemon !== daemon) {
        continue;
      }
      this.takePendingSnapshotRequest(requestId);
      this.releaseBrowserSubscriptionReservation(pending.reservationId);
      this.send(pending.browser, frame);
    }
    for (const [requestId, relayed] of Array.from(this.relayedSnapshotRequests.entries())) {
      if (relayed.runId !== frame.runId || relayed.daemon !== daemon) {
        continue;
      }
      this.takeRelayedSnapshotRequest(requestId);
      await this.publishSnapshotResponse(relayed, {
        ...frame,
        requestId,
      });
    }
  }

  private async handleDaemonError(connection: TerminalStreamConnection, frame: TerminalError) {
    if (frame.requestId) {
      const pending = this.pendingSnapshotRequests.get(frame.requestId);
      if (pending) {
        if (pending.daemon !== connection.ws) {
          return;
        }
        this.takePendingSnapshotRequest(frame.requestId);
        this.releaseBrowserSubscriptionReservation(pending.reservationId);
        const validation = await this.validateBoundRun(pending.runId, {
          expectedWs: connection.ws,
          forceRefresh: true,
        });
        if (validation.ok === false) {
          this.sendError(
            pending.browser,
            validation.reason === 'leaseLost' ? 'TERMINAL_LEASE_LOST' : 'TERMINAL_RUN_NOT_BOUND',
            'Run stream is no longer bound to this daemon',
          );
          return;
        }
        this.send(pending.browser, frame);
        return;
      }
      const relayed = this.takeRelayedSnapshotRequest(frame.requestId);
      if (relayed) {
        await this.publishSnapshotResponse(relayed, frame);
        return;
      }
    }
    if (connection.kind === 'daemon') {
      this.app.logger?.warn?.('Agent Gateway terminal daemon error', {
        code: frame.code,
        message: frame.message,
      });
    }
  }

  private addSubscriptionUnchecked(connection: TerminalStreamConnection, runId: string) {
    if (connection.subscriptions.has(runId)) {
      return;
    }
    connection.subscriptions.add(runId);
    const subscribers = this.browserSubscriptions.get(runId) || new Set<WebSocket>();
    subscribers.add(connection.ws);
    this.browserSubscriptions.set(runId, subscribers);
  }

  private reserveBrowserSubscription(connection: TerminalStreamConnection, runId: string) {
    if (connection.subscriptions.has(runId)) {
      return undefined;
    }
    const reservationId = `browser-subscription:${Date.now()}:${Math.random().toString(16).slice(2)}`;
    this.pendingBrowserSubscriptionReservations.set(reservationId, {
      browser: connection.ws,
      runId,
    });
    return reservationId;
  }

  private releaseBrowserSubscriptionReservation(reservationId?: string) {
    if (!reservationId) {
      return;
    }
    this.pendingBrowserSubscriptionReservations.delete(reservationId);
  }

  private promoteBrowserSubscription(connection: TerminalStreamConnection, runId: string, reservationId?: string) {
    if (this.connections.get(connection.ws) !== connection || connection.kind !== 'browser') {
      this.releaseBrowserSubscriptionReservation(reservationId);
      return;
    }
    if (reservationId) {
      const reservation = this.pendingBrowserSubscriptionReservations.get(reservationId);
      this.releaseBrowserSubscriptionReservation(reservationId);
      if (!reservation || reservation.browser !== connection.ws || reservation.runId !== runId) {
        return;
      }
      this.addSubscriptionUnchecked(connection, runId);
      return;
    }

    const limitError = this.getBrowserSubscriptionLimitError(connection, runId);
    if (limitError) {
      this.sendError(connection.ws, 'TERMINAL_SUBSCRIPTION_LIMIT', limitError);
      return;
    }
    this.addSubscriptionUnchecked(connection, runId);
  }

  private promoteBrowserSubscriptionBySocket(browser: WebSocket, runId: string, reservationId?: string) {
    const connection = this.connections.get(browser);
    if (!connection || connection.kind !== 'browser') {
      this.releaseBrowserSubscriptionReservation(reservationId);
      return;
    }
    this.promoteBrowserSubscription(connection, runId, reservationId);
  }

  private async requestDaemonSnapshot(
    browser: WebSocket,
    runId: string,
    fromOffset: number,
    options: { subscribeOnSuccess?: boolean; reservationId?: string } = {},
  ) {
    const validation = await this.validateBoundRun(runId, { forceRefresh: true });
    if (validation.ok === false) {
      if (validation.reason === 'missing') {
        const completedRunEnd = await this.createTerminalEndForCompletedRun(runId, fromOffset);
        if (completedRunEnd) {
          this.releaseBrowserSubscriptionReservation(options.reservationId);
          this.send(browser, completedRunEnd);
          return true;
        }
      }
      if (validation.reason === 'leaseLost') {
        this.sendError(browser, 'TERMINAL_LEASE_LOST', 'Run lease is no longer active for this daemon');
        return false;
      }
      if (!(await this.transport.isShared())) {
        if (fromOffset > 0) {
          this.sendError(browser, 'TERMINAL_DAEMON_UNAVAILABLE', 'No daemon stream is currently bound to this run');
        }
        return false;
      }
      const requestId = this.createSnapshotRequestId();
      this.addPendingSnapshotRequest(requestId, {
        browser,
        runId,
        fromOffset,
        subscribeOnSuccess: options.subscribeOnSuccess,
        reservationId: options.reservationId,
      });
      await this.publishBrowserSnapshotRequest(runId, requestId, fromOffset);
      return true;
    }
    const { bound } = validation;

    const requestId = this.createSnapshotRequestId();
    this.addPendingSnapshotRequest(requestId, {
      browser,
      daemon: bound.ws,
      runId,
      fromOffset,
      subscribeOnSuccess: options.subscribeOnSuccess,
      reservationId: options.reservationId,
    });
    this.send(bound.ws, {
      type: 'daemon.snapshotRequest',
      protocol: 'agent-gateway.terminal.v1',
      requestId,
      runId,
      fromOffset,
    });
    return true;
  }

  private createSnapshotRequestId() {
    return `snapshot:${this.ownerId}:${randomUUID()}`;
  }

  private addPendingSnapshotRequest(requestId: string, values: Omit<PendingSnapshotRequest, 'timeout'>) {
    const timeout = setTimeout(() => {
      const pending = this.takePendingSnapshotRequest(requestId);
      if (!pending) {
        return;
      }
      this.releaseBrowserSubscriptionReservation(pending.reservationId);
      this.sendError(
        pending.browser,
        'TERMINAL_SNAPSHOT_TIMEOUT',
        'Daemon did not return a terminal snapshot before the request timed out',
      );
    }, TERMINAL_SNAPSHOT_REQUEST_TIMEOUT_MS);
    timeout.unref?.();
    this.pendingSnapshotRequests.set(requestId, {
      ...values,
      timeout,
    });
  }

  private async ensureDaemonTransportSubscription(runId: string) {
    const existing = this.daemonTransportSubscriptions.get(runId);
    if (existing) {
      await existing;
      return;
    }
    const subscription = this.transport.subscribe(runId, 'daemon-to-browser', async (event) => {
      if (event.runId !== runId || !event.type.startsWith('daemon.')) {
        return;
      }
      await this.handleDaemonTransportEvent(event as TerminalStreamDaemonTransportEvent);
    });
    this.daemonTransportSubscriptions.set(runId, subscription);
    try {
      await subscription;
    } catch (error) {
      this.daemonTransportSubscriptions.delete(runId);
      throw error;
    }
  }

  private async ensureBrowserTransportSubscription(runId: string) {
    const existing = this.browserTransportSubscriptions.get(runId);
    if (existing) {
      await existing;
      return;
    }
    const subscription = this.transport.subscribe(runId, 'browser-to-daemon', async (event) => {
      if (event.runId !== runId || !event.type.startsWith('browser.')) {
        return;
      }
      await this.handleBrowserTransportEvent(event as TerminalStreamBrowserTransportEvent);
    });
    this.browserTransportSubscriptions.set(runId, subscription);
    try {
      await subscription;
    } catch (error) {
      this.browserTransportSubscriptions.delete(runId);
      throw error;
    }
  }

  private async closeTransportSubscriptions() {
    const subscriptions = [
      ...this.daemonTransportSubscriptions.values(),
      ...this.browserTransportSubscriptions.values(),
    ];
    this.daemonTransportSubscriptions.clear();
    this.browserTransportSubscriptions.clear();
    await Promise.all(
      subscriptions.map(async (subscription) => {
        try {
          const unsubscribe = await subscription;
          await unsubscribe();
        } catch (error) {
          this.logTransportFailure('unsubscribe terminal broker transport', error);
        }
      }),
    );
  }

  private rememberTransportEvent(eventId: string) {
    if (this.receivedTransportEventIds.has(eventId)) {
      return false;
    }
    this.receivedTransportEventIds.add(eventId);
    this.receivedTransportEventOrder.push(eventId);
    if (this.receivedTransportEventOrder.length > TERMINAL_BROKER_DEDUP_EVENT_LIMIT) {
      const expiredEventId = this.receivedTransportEventOrder.shift();
      if (expiredEventId) {
        this.receivedTransportEventIds.delete(expiredEventId);
      }
    }
    return true;
  }

  private acceptTransportSequence(event: TerminalStreamDaemonTransportEvent) {
    if (event.type !== 'daemon.frame') {
      return true;
    }
    const key = `${event.runId}:${event.ownerId}`;
    const previous = this.receivedTransportSequences.get(key);
    if (previous !== undefined && event.sequence <= previous) {
      return false;
    }
    this.receivedTransportSequences.set(key, event.sequence);
    if (previous !== undefined && event.sequence > previous + 1) {
      this.broadcastToRun(
        event.runId,
        createTerminalError('TERMINAL_OFFSET_GAP', 'Terminal broker transport lost one or more live frames', {
          details: {
            reconnectRequired: true,
          },
        }),
      );
      return false;
    }
    return true;
  }

  private async handleDaemonTransportEvent(event: TerminalStreamDaemonTransportEvent) {
    if (event.ownerId === this.ownerId || !this.rememberTransportEvent(event.eventId)) {
      return;
    }
    if (event.type === 'daemon.snapshotResponse') {
      if (event.targetId !== this.ownerId) {
        return;
      }
      const pending = this.pendingSnapshotRequests.get(event.requestId);
      if (!pending || pending.runId !== event.runId || pending.daemon) {
        return;
      }
      this.takePendingSnapshotRequest(event.requestId);
      if (event.frame.type === 'terminal.snapshot' && pending.subscribeOnSuccess) {
        this.promoteBrowserSubscriptionBySocket(pending.browser, pending.runId, pending.reservationId);
      } else {
        this.releaseBrowserSubscriptionReservation(pending.reservationId);
      }
      this.send(pending.browser, event.frame);
      return;
    }
    if (!this.acceptTransportSequence(event)) {
      return;
    }
    if (event.type === 'daemon.state') {
      if (event.state === 'closed') {
        const owner = this.remoteRunOwners.get(event.runId);
        if (!owner || owner.ownerId !== event.ownerId) {
          return;
        }
        this.remoteRunOwners.delete(event.runId);
        this.broadcastToRun(
          event.runId,
          createTerminalError('TERMINAL_DAEMON_UNAVAILABLE', 'Terminal daemon connection moved or closed', {
            details: {
              reconnectRequired: true,
            },
          }),
        );
        return;
      }
      this.remoteRunOwners.set(event.runId, {
        ownerId: event.ownerId,
        lastSeenAtMs: Date.now(),
        unavailableNotified: false,
      });
      await this.retryRemoteSnapshotRequests(event.runId);
      return;
    }
    this.remoteRunOwners.set(event.runId, {
      ownerId: event.ownerId,
      lastSeenAtMs: Date.now(),
      unavailableNotified: false,
    });
    this.broadcastToRun(event.runId, event.frame);
    if (event.frame.type === 'terminal.end') {
      this.remoteRunOwners.delete(event.runId);
    }
  }

  private async handleBrowserTransportEvent(event: TerminalStreamBrowserTransportEvent) {
    if (event.requesterId === this.ownerId || !this.rememberTransportEvent(event.eventId)) {
      return;
    }
    const validation = await this.validateBoundRun(event.runId);
    if (validation.ok === false) {
      return;
    }
    if (event.type === 'browser.locate') {
      await this.publishDaemonState(event.runId, 'bound', validation.bound.nodeId);
      return;
    }
    if (event.type === 'browser.controlAvailable') {
      this.send(validation.bound.ws, {
        type: 'daemon.controlAvailable',
        protocol: 'agent-gateway.terminal.v1',
        requestId: `control:${event.eventId}`,
        runId: event.runId,
        controlRequestId: event.controlRequestId,
      });
      return;
    }
    if (this.relayedSnapshotRequests.has(event.requestId)) {
      return;
    }
    const timeout = setTimeout(() => {
      this.takeRelayedSnapshotRequest(event.requestId);
    }, TERMINAL_SNAPSHOT_REQUEST_TIMEOUT_MS);
    timeout.unref?.();
    this.relayedSnapshotRequests.set(event.requestId, {
      requesterId: event.requesterId,
      runId: event.runId,
      daemon: validation.bound.ws,
      timeout,
    });
    this.send(validation.bound.ws, {
      type: 'daemon.snapshotRequest',
      protocol: 'agent-gateway.terminal.v1',
      requestId: event.requestId,
      runId: event.runId,
      fromOffset: event.fromOffset,
    });
  }

  private async retryRemoteSnapshotRequests(runId: string) {
    for (const [requestId, pending] of this.pendingSnapshotRequests.entries()) {
      if (pending.runId !== runId || pending.daemon) {
        continue;
      }
      await this.publishBrowserSnapshotRequest(runId, requestId, pending.fromOffset);
    }
  }

  private nextTransportSequence(runId: string) {
    const sequence = (this.transportSequences.get(runId) || 0) + 1;
    this.transportSequences.set(runId, sequence);
    return sequence;
  }

  private async publishDaemonState(runId: string, state: 'bound' | 'heartbeat' | 'closed', nodeId?: string) {
    await this.publishTransportEvent(runId, 'daemon-to-browser', {
      type: 'daemon.state',
      eventId: randomUUID(),
      ownerId: this.ownerId,
      runId,
      sequence: this.transportSequences.get(runId) || 0,
      state,
      nodeId,
    });
  }

  private async publishDaemonFrame(runId: string, frame: TerminalData | TerminalEnd) {
    await this.publishTransportEvent(runId, 'daemon-to-browser', {
      type: 'daemon.frame',
      eventId: randomUUID(),
      ownerId: this.ownerId,
      runId,
      sequence: this.nextTransportSequence(runId),
      frame,
    });
  }

  private async publishSnapshotResponse(
    relayed: RelayedSnapshotRequest,
    frame: TerminalSnapshot | TerminalEnd | TerminalError,
  ) {
    await this.publishTransportEvent(relayed.runId, 'daemon-to-browser', {
      type: 'daemon.snapshotResponse',
      eventId: randomUUID(),
      ownerId: this.ownerId,
      targetId: relayed.requesterId,
      runId: relayed.runId,
      requestId: frame.requestId || '',
      frame,
    });
  }

  private async publishBrowserLocate(runId: string) {
    await this.publishTransportEvent(runId, 'browser-to-daemon', {
      type: 'browser.locate',
      eventId: randomUUID(),
      requesterId: this.ownerId,
      runId,
    });
  }

  private async publishBrowserSnapshotRequest(runId: string, requestId: string, fromOffset: number) {
    await this.publishTransportEvent(runId, 'browser-to-daemon', {
      type: 'browser.snapshotRequest',
      eventId: randomUUID(),
      requesterId: this.ownerId,
      requestId,
      runId,
      fromOffset,
    });
  }

  private async publishBrowserControlAvailable(runId: string, controlRequestId: string) {
    await this.publishTransportEvent(runId, 'browser-to-daemon', {
      type: 'browser.controlAvailable',
      eventId: randomUUID(),
      requesterId: this.ownerId,
      runId,
      controlRequestId,
    });
  }

  private async publishTransportEvent(
    runId: string,
    direction: 'browser-to-daemon' | 'daemon-to-browser',
    event: TerminalStreamBrowserTransportEvent | TerminalStreamDaemonTransportEvent,
  ) {
    try {
      await this.transport.publish(runId, direction, event);
      await this.refreshTransportAvailability();
    } catch (error) {
      this.sharedTransportAvailable = false;
      this.logTransportFailure('publish terminal broker event', error, runId);
    }
  }

  private async refreshTransportAvailability() {
    this.sharedTransportAvailable = await this.transport.isShared();
  }

  private startBrokerTimers() {
    if (!this.brokerHeartbeatTimer) {
      this.brokerHeartbeatTimer = setInterval(() => {
        this.publishBrokerHeartbeats().catch((error) => {
          this.logTransportFailure('publish terminal broker heartbeat', error);
        });
      }, TERMINAL_BROKER_HEARTBEAT_INTERVAL_MS);
      this.brokerHeartbeatTimer.unref?.();
    }
    if (!this.brokerOwnerWatchdogTimer) {
      this.brokerOwnerWatchdogTimer = setInterval(() => {
        this.checkRemoteRunOwners();
      }, TERMINAL_BROKER_HEARTBEAT_INTERVAL_MS);
      this.brokerOwnerWatchdogTimer.unref?.();
    }
  }

  private stopBrokerTimers() {
    if (this.brokerHeartbeatTimer) {
      clearInterval(this.brokerHeartbeatTimer);
      this.brokerHeartbeatTimer = undefined;
    }
    if (this.brokerOwnerWatchdogTimer) {
      clearInterval(this.brokerOwnerWatchdogTimer);
      this.brokerOwnerWatchdogTimer = undefined;
    }
  }

  private async publishBrokerHeartbeats() {
    await this.refreshTransportAvailability();
    for (const [runId, bound] of this.boundRuns.entries()) {
      await this.publishDaemonState(runId, 'heartbeat', bound.nodeId);
    }
  }

  private checkRemoteRunOwners() {
    const nowMs = Date.now();
    for (const [runId, owner] of this.remoteRunOwners.entries()) {
      if (owner.unavailableNotified || nowMs - owner.lastSeenAtMs <= TERMINAL_BROKER_OWNER_TIMEOUT_MS) {
        continue;
      }
      owner.unavailableNotified = true;
      this.broadcastToRun(
        runId,
        createTerminalError('TERMINAL_DAEMON_UNAVAILABLE', 'Terminal broker owner heartbeat expired', {
          details: {
            reconnectRequired: true,
          },
        }),
      );
    }
  }

  private logTransportFailure(action: string, error: unknown, runId?: string) {
    this.app.logger?.warn?.(`Agent Gateway failed to ${action}`, {
      runId,
      error: getErrorMessage(error),
    });
  }

  private async createTerminalEndForCompletedRun(runId: string, offsetEnd: number): Promise<TerminalEnd | null> {
    const run = (await this.app.db.getRepository('agRuns').findOne({
      filterByTk: runId,
    })) as ModelRecord | null;
    if (!run) {
      return null;
    }
    const reason = TERMINALIZED_RUN_END_REASONS.get(getModelString(run, 'status'));
    if (!reason) {
      return null;
    }
    return {
      type: 'terminal.end',
      protocol: 'agent-gateway.terminal.v1',
      runId,
      sessionName: getModelString(run, 'terminalSessionName') || `ag-run-${runId}`,
      offsetEnd,
      reason,
    };
  }

  private async validateDaemonFrameBinding(connection: TerminalStreamConnection, runId: string) {
    const validation = await this.validateBoundRun(runId, { expectedWs: connection.ws });
    return validation.ok && validation.bound.nodeId === connection.nodeId;
  }

  private async validateBoundRun(
    runId: string,
    options: { expectedWs?: WebSocket; forceRefresh?: boolean } = {},
  ): Promise<BoundRunValidationResult> {
    const bound = this.boundRuns.get(runId);
    if (!bound || (options.expectedWs && bound.ws !== options.expectedWs)) {
      return {
        ok: false,
        reason: 'missing',
      };
    }
    const connection = this.connections.get(bound.ws);
    if (!connection || connection.kind !== 'daemon' || connection.nodeId !== bound.nodeId) {
      this.boundRuns.delete(runId);
      return {
        ok: false,
        reason: 'missing',
      };
    }
    const nowMs = Date.now();
    if (
      !options.forceRefresh &&
      nowMs < bound.leaseExpiresAtMs &&
      nowMs - bound.lastLeaseValidationAtMs < TERMINAL_LEASE_REVALIDATION_INTERVAL_MS
    ) {
      return {
        ok: true,
        bound,
      };
    }
    try {
      if (!(await this.validateCurrentLease(connection, runId, bound))) {
        this.unbindRunForLeaseLoss(runId);
        return {
          ok: false,
          reason: 'leaseLost',
        };
      }
      return {
        ok: true,
        bound,
      };
    } catch {
      this.unbindRunForLeaseLoss(runId);
      return {
        ok: false,
        reason: 'leaseLost',
      };
    }
  }

  private async validateCurrentLease(connection: TerminalStreamConnection, runId: string, bound: BoundRunStream) {
    if (!connection.nodeId) {
      return false;
    }
    const run = (await this.app.db.getRepository('agRuns').findOne({
      filterByTk: runId,
    })) as ModelRecord | null;
    if (!run || String(getModelTargetKey(run, 'nodeId')) !== bound.nodeId) {
      return false;
    }
    if (getModelNumber(run, 'claimAttempt') !== bound.claimAttempt) {
      return false;
    }
    if (!verifyClaimToken(bound.claimToken, getModelString(run, 'claimTokenHash'))) {
      return false;
    }
    if (!ACTIVE_TERMINAL_STREAM_RUN_STATUSES.has(getModelString(run, 'status'))) {
      return false;
    }
    const claimExpiresAt = getDateFromModel(run, 'claimExpiresAt');
    if (!claimExpiresAt || claimExpiresAt.getTime() <= Date.now()) {
      return false;
    }

    const currentLeaseVersion = getModelNumber(run, 'leaseVersion');
    if (currentLeaseVersion < bound.leaseVersion) {
      return false;
    }
    bound.leaseVersion = currentLeaseVersion;
    bound.leaseExpiresAtMs = claimExpiresAt.getTime();
    bound.lastLeaseValidationAtMs = Date.now();
    return true;
  }

  private unbindRunForLeaseLoss(runId: string) {
    if (!this.boundRuns.delete(runId)) {
      return;
    }
    this.broadcastToRun(
      runId,
      createTerminalError('TERMINAL_LEASE_LOST', 'Run lease is no longer active for this daemon'),
    );
  }

  private async validateLease(
    connection: TerminalStreamConnection,
    runId: string,
    values: Pick<TerminalDaemonBindRun, 'claimToken' | 'claimAttempt' | 'leaseVersion'>,
  ) {
    if (!connection.nodeId) {
      return null;
    }
    const ctx = createAuthContext(this.app, connection.request);
    return await this.app.db.sequelize.transaction(async (transaction: Transaction) => {
      return await validateRunLease(ctx as unknown as Context, connection.nodeId as string, runId, values, transaction);
    });
  }

  private validatePayloadOffsets(frame: TerminalData | TerminalSnapshot) {
    const byteLength = getTerminalPayloadByteLength(frame.payload);
    if (byteLength > TERMINAL_SERVER_MAX_DECODED_PAYLOAD_BYTES) {
      return createTerminalError('TERMINAL_FRAME_TOO_LARGE', 'Terminal stream payload is too large', {
        requestId: frame.requestId,
        details: {
          maxDecodedPayloadBytes: TERMINAL_SERVER_MAX_DECODED_PAYLOAD_BYTES,
          decodedPayloadBytes: byteLength,
        },
      });
    }
    if (frame.offsetEnd - frame.offsetStart !== byteLength) {
      return createTerminalError('TERMINAL_PROTOCOL_ERROR', 'Terminal payload byte length does not match offsets', {
        requestId: frame.requestId,
      });
    }
    return null;
  }

  private validateDecodedPayloadSize(frame: TerminalFrame) {
    if (frame.type !== 'terminal.data' && frame.type !== 'terminal.snapshot') {
      return null;
    }
    const byteLength = getTerminalPayloadByteLength(frame.payload);
    if (byteLength <= TERMINAL_SERVER_MAX_DECODED_PAYLOAD_BYTES) {
      return null;
    }
    return createTerminalError('TERMINAL_FRAME_TOO_LARGE', 'Terminal stream payload is too large', {
      requestId: frame.type === 'terminal.snapshot' ? frame.requestId : undefined,
      details: {
        maxDecodedPayloadBytes: TERMINAL_SERVER_MAX_DECODED_PAYLOAD_BYTES,
        decodedPayloadBytes: byteLength,
      },
    });
  }

  private getPendingBrowserSubscriptionCount(options: { runId?: string; userId?: string } = {}) {
    let count = 0;
    for (const pending of this.pendingSnapshotRequests.values()) {
      if (pending.reservationId) {
        continue;
      }
      if (!pending.subscribeOnSuccess) {
        continue;
      }
      if (options.runId && pending.runId !== options.runId) {
        continue;
      }
      const connection = this.connections.get(pending.browser);
      if (!connection || connection.kind !== 'browser') {
        continue;
      }
      if (options.userId && String(connection.userId) !== options.userId) {
        continue;
      }
      count += 1;
    }
    for (const reservation of this.pendingBrowserSubscriptionReservations.values()) {
      if (options.runId && reservation.runId !== options.runId) {
        continue;
      }
      const connection = this.connections.get(reservation.browser);
      if (!connection || connection.kind !== 'browser') {
        continue;
      }
      if (options.userId && String(connection.userId) !== options.userId) {
        continue;
      }
      count += 1;
    }
    return count;
  }

  private getActiveBrowserSubscriptionCountForUser(userId: string) {
    let count = 0;
    for (const connection of this.connections.values()) {
      if (connection.kind === 'browser' && String(connection.userId) === userId) {
        count += connection.subscriptions.size;
      }
    }
    return count;
  }

  private getActiveBrowserSubscriptionCountForRun(runId: string) {
    return this.browserSubscriptions.get(runId)?.size || 0;
  }

  private getBrowserSubscriptionLimitError(connection: TerminalStreamConnection, runId: string) {
    if (connection.subscriptions.has(runId)) {
      return null;
    }
    const userId = connection.userId === undefined || connection.userId === null ? '' : String(connection.userId);
    if (userId) {
      const userCount =
        this.getActiveBrowserSubscriptionCountForUser(userId) + this.getPendingBrowserSubscriptionCount({ userId });
      if (userCount >= TERMINAL_MAX_BROWSER_SUBSCRIPTIONS_PER_USER) {
        return 'Too many active terminal stream subscriptions for this user';
      }
    }
    const runCount =
      this.getActiveBrowserSubscriptionCountForRun(runId) + this.getPendingBrowserSubscriptionCount({ runId });
    if (runCount >= TERMINAL_MAX_BROWSER_SUBSCRIPTIONS_PER_RUN) {
      return 'Too many active terminal stream subscriptions for this run';
    }
    return null;
  }

  private wouldExceedDaemonBindingLimit(nodeId: string, runId: string) {
    let count = 0;
    for (const [boundRunId, bound] of this.boundRuns.entries()) {
      if (boundRunId !== runId && bound.nodeId === nodeId) {
        count += 1;
      }
    }
    return count >= TERMINAL_MAX_DAEMON_STREAM_BINDINGS_PER_NODE;
  }

  private broadcastToRun(runId: string, frame: TerminalServerFrameForSend) {
    const subscribers = this.browserSubscriptions.get(runId);
    if (!subscribers?.size) {
      return;
    }
    for (const ws of subscribers) {
      this.send(ws, frame);
    }
  }

  private async removeConnection(ws: WebSocket) {
    const connection = this.connections.get(ws);
    if (!connection) {
      return;
    }
    this.connections.delete(ws);
    this.frameQueues.delete(ws);
    this.frameQueueDepths.delete(ws);

    if (connection.kind === 'browser') {
      for (const runId of connection.subscriptions) {
        const subscribers = this.browserSubscriptions.get(runId);
        subscribers?.delete(ws);
        if (!subscribers?.size) {
          this.browserSubscriptions.delete(runId);
        }
      }
    }

    if (connection.kind === 'daemon') {
      for (const [runId, bound] of Array.from(this.boundRuns.entries())) {
        if (bound.ws === ws) {
          this.boundRuns.delete(runId);
          await this.publishDaemonState(runId, 'closed', bound.nodeId);
        }
      }
    }

    for (const [requestId, pending] of Array.from(this.pendingSnapshotRequests.entries())) {
      if (pending.browser === ws) {
        this.takePendingSnapshotRequest(requestId);
        this.releaseBrowserSubscriptionReservation(pending.reservationId);
      } else if (pending.daemon === ws) {
        this.takePendingSnapshotRequest(requestId);
        this.releaseBrowserSubscriptionReservation(pending.reservationId);
        this.sendError(pending.browser, 'TERMINAL_DAEMON_UNAVAILABLE', 'Terminal daemon connection closed', undefined, {
          reconnectRequired: true,
        });
      }
    }
    if (connection.kind === 'daemon') {
      for (const [requestId, relayed] of Array.from(this.relayedSnapshotRequests.entries())) {
        if (relayed.daemon !== ws) {
          continue;
        }
        this.takeRelayedSnapshotRequest(requestId);
        await this.publishSnapshotResponse(
          relayed,
          createTerminalError('TERMINAL_DAEMON_UNAVAILABLE', 'Terminal daemon connection closed', {
            requestId,
            details: {
              reconnectRequired: true,
            },
          }),
        );
      }
    }
    for (const [reservationId, reservation] of Array.from(this.pendingBrowserSubscriptionReservations.entries())) {
      if (reservation.browser === ws) {
        this.pendingBrowserSubscriptionReservations.delete(reservationId);
      }
    }
  }

  private takePendingSnapshotRequest(requestId: string) {
    const pending = this.pendingSnapshotRequests.get(requestId);
    if (!pending) {
      return undefined;
    }
    this.pendingSnapshotRequests.delete(requestId);
    clearTimeout(pending.timeout);
    return pending;
  }

  private clearPendingSnapshotRequests() {
    for (const pending of this.pendingSnapshotRequests.values()) {
      clearTimeout(pending.timeout);
    }
    this.pendingSnapshotRequests.clear();
  }

  private takeRelayedSnapshotRequest(requestId: string) {
    const relayed = this.relayedSnapshotRequests.get(requestId);
    if (!relayed) {
      return undefined;
    }
    this.relayedSnapshotRequests.delete(requestId);
    clearTimeout(relayed.timeout);
    return relayed;
  }

  private clearRelayedSnapshotRequests() {
    for (const relayed of this.relayedSnapshotRequests.values()) {
      clearTimeout(relayed.timeout);
    }
    this.relayedSnapshotRequests.clear();
  }

  private sendError(
    ws: WebSocket,
    code: TerminalError['code'],
    message: string,
    requestId?: string,
    details?: Record<string, unknown>,
  ) {
    this.send(ws, createTerminalError(code, message, { requestId, details }));
  }

  private send(ws: WebSocket, frame: TerminalServerFrameForSend) {
    if (ws.readyState !== WebSocket.OPEN) {
      return;
    }
    if (ws.bufferedAmount > MAX_TERMINAL_WEBSOCKET_BUFFERED_BYTES) {
      ws.close();
      return;
    }
    const connection = this.connections.get(ws);
    ws.send(JSON.stringify(connection?.kind === 'browser' ? sanitizeBrowserTerminalFrame(frame) : frame));
  }

  private mapBrowserAuthError(error: unknown): TerminalError['code'] {
    if (error instanceof TerminalStreamTicketError) {
      return error.terminalCode;
    }
    const status = (error as { status?: number } | null)?.status;
    return status === 403 ? 'TERMINAL_PERMISSION_DENIED' : 'TERMINAL_AUTH_FAILED';
  }

  private mapAuthOrLeaseError(error: unknown): TerminalError['code'] {
    const status = (error as { status?: number } | null)?.status;
    if (status === 401 || status === 403) {
      return 'TERMINAL_AUTH_FAILED';
    }
    return 'TERMINAL_LEASE_LOST';
  }

  getStats(
    options: {
      runId?: string;
      userId?: string;
      nodeId?: string;
      includeGlobalStats?: boolean;
      includeNodeStats?: boolean;
    } = {},
  ) {
    let activeBrowserConnections = 0;
    let activeDaemonConnections = 0;
    let activeBrowserSubscriptions = 0;
    let activeBrowserSubscriptionsForUser = 0;
    let activeDaemonBindingsForNode = 0;
    let pendingSnapshotRequests = 0;
    for (const connection of this.connections.values()) {
      if (connection.kind === 'browser') {
        activeBrowserConnections += 1;
        activeBrowserSubscriptions += connection.subscriptions.size;
        if (options.userId && String(connection.userId) === options.userId) {
          activeBrowserSubscriptionsForUser += connection.subscriptions.size;
        }
      }
      if (connection.kind === 'daemon') {
        activeDaemonConnections += 1;
      }
    }
    for (const bound of this.boundRuns.values()) {
      if (options.nodeId && bound.nodeId === options.nodeId) {
        activeDaemonBindingsForNode += 1;
      }
    }
    for (const request of this.pendingSnapshotRequests.values()) {
      if (!options.runId || request.runId === options.runId) {
        pendingSnapshotRequests += 1;
      }
    }
    return {
      ...(options.includeGlobalStats
        ? {
            activeConnections: this.connections.size,
            activeBrowserConnections,
            activeDaemonConnections,
            activeBrowserSubscriptions,
            activeDaemonBindings: this.boundRuns.size,
          }
        : {}),
      activeBrowserSubscriptionsForRun: options.runId
        ? this.getActiveBrowserSubscriptionCountForRun(options.runId)
        : undefined,
      activeBrowserSubscriptionsForUser: options.userId ? activeBrowserSubscriptionsForUser : undefined,
      activeDaemonBindingsForNode: options.nodeId && options.includeNodeStats ? activeDaemonBindingsForNode : undefined,
      pendingSnapshotRequests,
      brokerTransport: this.sharedTransportAvailable ? 'shared-pubsub' : 'single-instance-memory',
      remoteRunOwners: options.includeGlobalStats ? this.remoteRunOwners.size : undefined,
      queuedFrames: options.includeGlobalStats
        ? Array.from(this.frameQueueDepths.values()).reduce((sum, count) => sum + count, 0)
        : undefined,
    };
  }
}

type TerminalServerFrameForSend = Exclude<TerminalFrame, TerminalClientSubscribe | TerminalDaemonBindRun>;

type BrowserTerminalPayloadFrame =
  | Omit<TerminalData, 'sessionName' | 'requestId'>
  | Omit<TerminalSnapshot, 'sessionName'>
  | Omit<TerminalEnd, 'sessionName' | 'requestId'>;

type BrowserTerminalFrameForSend =
  | BrowserTerminalPayloadFrame
  | Exclude<TerminalServerFrameForSend, TerminalData | TerminalSnapshot | TerminalEnd>;

function sanitizeBrowserTerminalFrame(frame: TerminalServerFrameForSend): BrowserTerminalFrameForSend {
  if (frame.type === 'terminal.data' || frame.type === 'terminal.snapshot' || frame.type === 'terminal.end') {
    const browserFrame: Record<string, unknown> = { ...frame };
    delete browserFrame.sessionName;
    if (frame.type === 'terminal.data' || frame.type === 'terminal.end') {
      delete browserFrame.requestId;
    }
    return browserFrame as BrowserTerminalPayloadFrame;
  }
  return frame;
}

function registerTerminalStreamStatsRoute(plugin: Plugin, broker: TerminalStreamBroker) {
  plugin.app.resourceManager.registerActionHandlers({
    [getAgentGatewayApiActionName(AGENT_GATEWAY_API_ACTIONS.getTerminalStreamStats)]: async (ctx, next) => {
      const actionCtx = asActionContext(ctx);
      await requireAgentGatewayPermission(
        actionCtx,
        AGENT_GATEWAY_ACTIONS.readTerminal,
        'Agent Gateway terminal read permission required',
      );
      const query = getRecord(actionCtx.query);
      const currentUserId = getCurrentUserId(actionCtx);
      const runId = getString(query.runId);
      const nodeId = getString(query.nodeId);
      const canManage = await hasAgentGatewayPermission(actionCtx, AGENT_GATEWAY_ACTIONS.manage);
      if (!canManage && !runId) {
        actionCtx.throw(400, 'Agent Gateway terminal stream stats require a runId');
      }
      if (!canManage && nodeId) {
        actionCtx.throw(403, 'Agent Gateway management permission required for node stream stats');
      }
      if (runId) {
        await assertRunVisible(actionCtx, runId, 'get');
      }
      actionCtx.body = broker.getStats({
        runId,
        userId: currentUserId === null ? undefined : String(currentUserId),
        nodeId,
        includeGlobalStats: canManage,
        includeNodeStats: canManage,
      });
      await next();
    },
  });
}

export function registerTerminalStreamBroker(plugin: Plugin) {
  const broker = new TerminalStreamBroker(plugin.app);
  broker.register();
  registerTerminalStreamStatsRoute(plugin, broker);
  return broker;
}
