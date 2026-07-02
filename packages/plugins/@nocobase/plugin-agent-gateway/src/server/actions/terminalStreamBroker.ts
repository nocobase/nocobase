/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { IncomingMessage } from 'http';
import { Duplex } from 'stream';
import { parse } from 'url';

import { Context, Next } from '@nocobase/actions';
import { Application, Gateway, Plugin } from '@nocobase/server';
import type { Transaction } from 'sequelize';
import WebSocket, { RawData, WebSocketServer } from 'ws';

import {
  TERMINAL_MAX_BROWSER_SUBSCRIPTIONS_PER_RUN,
  TERMINAL_MAX_BROWSER_SUBSCRIPTIONS_PER_USER,
  TERMINAL_MAX_DAEMON_STREAM_BINDINGS_PER_NODE,
  TERMINAL_STREAM_WS_PATH,
  TERMINAL_SERVER_MAX_RAW_FRAME_BYTES,
  TERMINAL_SERVER_MAX_DECODED_PAYLOAD_BYTES,
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
import { authenticateNodeToken, verifyClaimToken } from '../security';
import { AGENT_GATEWAY_ACTIONS } from '../security/permissions';
import {
  JsonRecord,
  ModelRecord,
  API_PREFIX,
  getCurrentUserId,
  getModelNumber,
  getModelString,
  getModelTargetKey,
  getModelValue,
  getRecord,
  getString,
  requireAgentGatewayPermission,
} from './utils';
import { validateRunLease } from './runLifecycle';

const MAX_TERMINAL_WEBSOCKET_BUFFERED_BYTES = 1024 * 1024;
const ACTIVE_TERMINAL_STREAM_RUN_STATUSES = new Set(['claimed', 'syncing_skills', 'running', 'canceling']);
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
  subscriptions: Set<string>;
}

interface BoundRunStream {
  ws: WebSocket;
  nodeId: string;
  sessionName: string;
  claimToken: string;
  claimAttempt: number;
  leaseVersion: number;
}

interface PendingSnapshotRequest {
  browser: WebSocket;
  daemon: WebSocket;
  runId: string;
  subscribeOnSuccess?: boolean;
  reservationId?: string;
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

interface BrowserAuth {
  user?: unknown;
  check(): Promise<unknown>;
  checkToken?(): Promise<{ user?: unknown }>;
}

interface BrowserAuthManager {
  get(name: string, ctx: unknown): Promise<BrowserAuth>;
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

function getQueryValue(request: IncomingMessage, key: string) {
  const url = new URL(request.url || '/', 'http://127.0.0.1');
  return url.searchParams.get(key)?.trim() || '';
}

function getBearerTokenFromRequest(request: IncomingMessage) {
  const queryToken = getQueryValue(request, 'token');
  if (queryToken) {
    return queryToken;
  }

  const authorization = getHeader(request.headers, 'authorization');
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || '';
}

function getAuthenticatorFromRequest(request: IncomingMessage) {
  return getQueryValue(request, 'authenticator') || getHeader(request.headers, 'x-authenticator') || 'basic';
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
  const role = getQueryValue(request, 'role') || getHeader(request.headers, 'x-role');
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
      return token;
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

function getUserId(user: unknown) {
  if (typeof (user as ModelRecord | null)?.get === 'function') {
    const id = (user as ModelRecord).get('id');
    return typeof id === 'string' || typeof id === 'number' ? id : null;
  }
  const record = getRecord(user);
  const id = record.id;
  return typeof id === 'string' || typeof id === 'number' ? id : null;
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
  return record.type === 'browser.write' || record.type === 'terminal.write' || record.type === 'terminal.input';
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
  private readonly wss = new WebSocketServer({
    noServer: true,
    maxPayload: TERMINAL_SERVER_MAX_RAW_FRAME_BYTES,
  });
  private readonly connections = new Map<WebSocket, TerminalStreamConnection>();
  private readonly boundRuns = new Map<string, BoundRunStream>();
  private readonly browserSubscriptions = new Map<string, Set<WebSocket>>();
  private readonly pendingSnapshotRequests = new Map<string, PendingSnapshotRequest>();
  private readonly pendingBrowserSubscriptionReservations = new Map<string, PendingBrowserSubscriptionReservation>();
  private readonly frameQueues = new Map<WebSocket, Promise<void>>();
  private readonly gatewayHandler: (
    request: IncomingMessage,
    socket: Duplex,
    head: Buffer,
    app: Application,
  ) => boolean | void;

  constructor(private readonly app: Application) {
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
        subscriptions: new Set(),
      });

      ws.on('message', (data) => {
        this.handleMessage(ws, data);
      });
      ws.on('close', () => {
        this.removeConnection(ws);
      });
      ws.on('error', () => {
        this.removeConnection(ws);
      });
    });
  }

  register() {
    Gateway.registerWsHandler(this.gatewayHandler);
  }

  unregister() {
    Gateway.unregisterWsHandler(this.gatewayHandler);
    this.wss.close();
    for (const connection of this.connections.values()) {
      connection.ws.close();
    }
    this.connections.clear();
    this.boundRuns.clear();
    this.browserSubscriptions.clear();
    this.pendingSnapshotRequests.clear();
    this.pendingBrowserSubscriptionReservations.clear();
  }

  handleUpgrade(request: IncomingMessage, socket: Duplex, head: Buffer) {
    const pathname = parse(request.url || '').pathname;
    if (pathname !== TERMINAL_STREAM_WS_PATH) {
      return false;
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
      this.sendError(ws, 'TERMINAL_RAW_WRITE_DISABLED', 'Raw terminal write is disabled');
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
      });
      this.send(connection.ws, createTerminalAck(frame.requestId));
    } catch (error) {
      this.sendError(connection.ws, this.mapAuthOrLeaseError(error), getErrorMessage(error), frame.requestId);
    }
  }

  private async handleBrowserSubscribe(connection: TerminalStreamConnection, frame: TerminalClientSubscribe) {
    let reservationId: string | undefined;
    try {
      const ctx = await this.authenticateBrowser(connection.request);
      await requireAgentGatewayPermission(
        ctx,
        AGENT_GATEWAY_ACTIONS.readTerminal,
        'Agent Gateway terminal read permission required',
      );
      connection.kind = 'browser';
      connection.userId = getUserId(ctx.state.currentUser);
      const limitError = this.getBrowserSubscriptionLimitError(connection, frame.runId);
      if (limitError) {
        this.sendError(connection.ws, 'TERMINAL_SUBSCRIPTION_LIMIT', limitError, frame.requestId);
        return;
      }
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

  private async handleTerminalData(connection: TerminalStreamConnection, frame: TerminalData) {
    if (!(await this.validateDaemonFrameBinding(connection, frame.runId))) {
      this.sendError(connection.ws, 'TERMINAL_RUN_NOT_BOUND', 'Run is not bound to this daemon');
      return;
    }
    const payloadError = this.validatePayloadOffsets(frame);
    if (payloadError) {
      this.send(connection.ws, payloadError);
      return;
    }
    this.broadcastToRun(frame.runId, frame);
  }

  private async handleTerminalSnapshot(connection: TerminalStreamConnection, frame: TerminalSnapshot) {
    const payloadError = this.validatePayloadOffsets(frame);
    if (payloadError) {
      this.send(connection.ws, payloadError);
      return;
    }
    if (frame.requestId) {
      const pending = this.pendingSnapshotRequests.get(frame.requestId);
      if (!pending || pending.runId !== frame.runId || pending.daemon !== connection.ws) {
        return;
      }
      this.pendingSnapshotRequests.delete(frame.requestId);
      const validation = await this.validateBoundRun(frame.runId, connection.ws);
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
    }
  }

  private async handleTerminalEnd(connection: TerminalStreamConnection, frame: TerminalEnd) {
    const validation = await this.validateBoundRun(frame.runId, connection.ws);
    if (validation.ok === false) {
      this.sendError(
        connection.ws,
        validation.reason === 'leaseLost' ? 'TERMINAL_LEASE_LOST' : 'TERMINAL_RUN_NOT_BOUND',
        'Run stream is no longer bound to this daemon',
      );
      return;
    }
    this.resolvePendingSnapshotsWithTerminalEnd(connection.ws, frame);
    this.boundRuns.delete(frame.runId);
    this.broadcastToRun(frame.runId, frame);
  }

  private resolvePendingSnapshotsWithTerminalEnd(daemon: WebSocket, frame: TerminalEnd) {
    for (const [requestId, pending] of Array.from(this.pendingSnapshotRequests.entries())) {
      if (pending.runId !== frame.runId || pending.daemon !== daemon) {
        continue;
      }
      this.pendingSnapshotRequests.delete(requestId);
      this.releaseBrowserSubscriptionReservation(pending.reservationId);
      this.send(pending.browser, frame);
    }
  }

  private async handleDaemonError(connection: TerminalStreamConnection, frame: TerminalError) {
    if (frame.requestId) {
      const pending = this.pendingSnapshotRequests.get(frame.requestId);
      if (pending) {
        if (pending.daemon !== connection.ws) {
          return;
        }
        this.pendingSnapshotRequests.delete(frame.requestId);
        this.releaseBrowserSubscriptionReservation(pending.reservationId);
        const validation = await this.validateBoundRun(pending.runId, connection.ws);
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
    const validation = await this.validateBoundRun(runId);
    if (validation.ok === false) {
      if (validation.reason === 'missing') {
        const completedRunEnd = await this.createTerminalEndForCompletedRun(runId, fromOffset);
        if (completedRunEnd) {
          this.releaseBrowserSubscriptionReservation(options.reservationId);
          this.send(browser, completedRunEnd);
          return true;
        }
      }
      if (fromOffset > 0) {
        this.sendError(
          browser,
          validation.reason === 'leaseLost' ? 'TERMINAL_LEASE_LOST' : 'TERMINAL_DAEMON_UNAVAILABLE',
          'No daemon stream is currently bound to this run',
        );
      } else if (validation.reason === 'leaseLost') {
        this.sendError(browser, 'TERMINAL_LEASE_LOST', 'Run lease is no longer active for this daemon');
      }
      return false;
    }
    const { bound } = validation;

    const requestId = `snapshot:${Date.now()}:${Math.random().toString(16).slice(2)}`;
    this.pendingSnapshotRequests.set(requestId, {
      browser,
      daemon: bound.ws,
      runId,
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
    const validation = await this.validateBoundRun(runId, connection.ws);
    return validation.ok && validation.bound.nodeId === connection.nodeId;
  }

  private async validateBoundRun(runId: string, expectedWs?: WebSocket): Promise<BoundRunValidationResult> {
    const bound = this.boundRuns.get(runId);
    if (!bound || (expectedWs && bound.ws !== expectedWs)) {
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
    const ctx = createAuthContext(this.app, connection.request);
    const auth = await authenticateNodeToken(ctx);
    if (String(auth.subject.nodeId) !== bound.nodeId) {
      return false;
    }

    return await this.app.db.sequelize.transaction(async (transaction: Transaction) => {
      const run = (await this.app.db.getRepository('agRuns').findOne({
        filterByTk: runId,
        transaction,
        lock: transaction.LOCK.UPDATE,
      })) as ModelRecord | null;
      if (!run) {
        return false;
      }
      if (String(getModelTargetKey(run, 'nodeId')) !== bound.nodeId) {
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
      return true;
    });
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

  private async authenticateBrowser(request: IncomingMessage) {
    const ctx = createAuthContext(this.app, request);
    if (!ctx.getBearerToken()) {
      ctx.throw(401, 'Authentication required');
    }
    const authManager = ctx.app.authManager as unknown as BrowserAuthManager | undefined;
    const auth = await authManager?.get(getAuthenticatorFromRequest(request), ctx);
    if (!auth) {
      ctx.throw(401, 'Authentication required');
    }
    const tokenResult = auth.checkToken ? await auth.checkToken() : { user: await auth.check() };
    const user = tokenResult.user;
    if (!user) {
      ctx.throw(401, 'Authentication required');
    }
    auth.user = user;
    ctx.auth = auth;
    ctx.state.currentUser = user;
    return ctx as unknown as Context;
  }

  private validatePayloadOffsets(frame: TerminalData | TerminalSnapshot) {
    const byteLength = getTerminalPayloadByteLength(frame.payload);
    if (byteLength > TERMINAL_SERVER_MAX_DECODED_PAYLOAD_BYTES) {
      return createTerminalError('TERMINAL_FRAME_TOO_LARGE', 'Terminal stream payload is too large', {
        details: {
          maxDecodedPayloadBytes: TERMINAL_SERVER_MAX_DECODED_PAYLOAD_BYTES,
          decodedPayloadBytes: byteLength,
        },
      });
    }
    if (frame.offsetEnd - frame.offsetStart !== byteLength) {
      return createTerminalError('TERMINAL_PROTOCOL_ERROR', 'Terminal payload byte length does not match offsets');
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

  private removeConnection(ws: WebSocket) {
    const connection = this.connections.get(ws);
    if (!connection) {
      return;
    }
    this.connections.delete(ws);
    this.frameQueues.delete(ws);

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
        }
      }
    }

    for (const [requestId, pending] of Array.from(this.pendingSnapshotRequests.entries())) {
      if (pending.browser === ws) {
        this.pendingSnapshotRequests.delete(requestId);
        this.releaseBrowserSubscriptionReservation(pending.reservationId);
      } else if (pending.daemon === ws) {
        this.pendingSnapshotRequests.delete(requestId);
        this.releaseBrowserSubscriptionReservation(pending.reservationId);
        pending.browser.close();
      }
    }
    for (const [reservationId, reservation] of Array.from(this.pendingBrowserSubscriptionReservations.entries())) {
      if (reservation.browser === ws) {
        this.pendingBrowserSubscriptionReservations.delete(reservationId);
      }
    }
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
    ws.send(JSON.stringify(frame));
  }

  private mapBrowserAuthError(error: unknown): TerminalError['code'] {
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

  getStats(options: { runId?: string; userId?: string; nodeId?: string } = {}) {
    let activeBrowserConnections = 0;
    let activeDaemonConnections = 0;
    let activeBrowserSubscriptions = 0;
    let activeBrowserSubscriptionsForUser = 0;
    let activeDaemonBindingsForNode = 0;
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
    return {
      activeConnections: this.connections.size,
      activeBrowserConnections,
      activeDaemonConnections,
      activeBrowserSubscriptions,
      activeBrowserSubscriptionsForRun: options.runId
        ? this.getActiveBrowserSubscriptionCountForRun(options.runId)
        : undefined,
      activeBrowserSubscriptionsForUser: options.userId ? activeBrowserSubscriptionsForUser : undefined,
      activeDaemonBindings: this.boundRuns.size,
      activeDaemonBindingsForNode: options.nodeId ? activeDaemonBindingsForNode : undefined,
      pendingSnapshotRequests: this.pendingSnapshotRequests.size,
    };
  }
}

type TerminalServerFrameForSend = Exclude<TerminalFrame, TerminalClientSubscribe | TerminalDaemonBindRun>;

function registerTerminalStreamStatsRoute(plugin: Plugin, broker: TerminalStreamBroker) {
  plugin.app.use(
    async (ctx: Context, next: Next) => {
      if (!ctx.path.startsWith(API_PREFIX)) {
        await next();
        return;
      }
      const routePath = ctx.path.slice(API_PREFIX.length);
      if (ctx.method !== 'GET' || routePath !== '/terminal-stream:stats') {
        await next();
        return;
      }
      await requireAgentGatewayPermission(
        ctx,
        AGENT_GATEWAY_ACTIONS.readTerminal,
        'Agent Gateway terminal read permission required',
      );
      const query = getRecord(ctx.query);
      const currentUserId = getCurrentUserId(ctx);
      ctx.body = broker.getStats({
        runId: getString(query.runId),
        userId: currentUserId === null ? undefined : String(currentUserId),
        nodeId: getString(query.nodeId),
      });
    },
    {
      tag: 'agentGatewayTerminalStreamStatsRoutes',
      after: 'agentGatewayRunTerminalRoutes',
      before: 'agentGatewayRunObservabilityRoutes',
    },
  );
}

export function registerTerminalStreamBroker(plugin: Plugin) {
  const broker = new TerminalStreamBroker(plugin.app);
  broker.register();
  registerTerminalStreamStatsRoute(plugin, broker);
  return broker;
}
