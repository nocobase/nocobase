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

import { Context } from '@nocobase/actions';
import { Application, Gateway, Plugin } from '@nocobase/server';
import type { Transaction } from 'sequelize';
import WebSocket, { RawData, WebSocketServer } from 'ws';

import {
  TERMINAL_STREAM_WS_PATH,
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
  getModelNumber,
  getModelString,
  getModelTargetKey,
  getModelValue,
  getRecord,
  requireAgentGatewayPermission,
} from './utils';
import { validateRunLease } from './runLifecycle';

const MAX_TERMINAL_FRAME_BYTES = 256 * 1024;
const MAX_BROWSER_SUBSCRIPTIONS_PER_SOCKET = 16;
const ACTIVE_TERMINAL_STREAM_RUN_STATUSES = new Set(['claimed', 'syncing_skills', 'running', 'canceling']);

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

export class TerminalStreamBroker {
  private readonly wss = new WebSocketServer({ noServer: true });
  private readonly connections = new Map<WebSocket, TerminalStreamConnection>();
  private readonly boundRuns = new Map<string, BoundRunStream>();
  private readonly browserSubscriptions = new Map<string, Set<WebSocket>>();
  private readonly pendingSnapshotRequests = new Map<string, PendingSnapshotRequest>();
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

    if (Buffer.byteLength(data.toString()) > MAX_TERMINAL_FRAME_BYTES) {
      this.sendError(ws, 'TERMINAL_FRAME_TOO_LARGE', 'Terminal stream frame is too large');
      return;
    }

    let rawFrame: unknown;
    try {
      rawFrame = JSON.parse(data.toString()) as unknown;
    } catch {
      const parseResult = parseTerminalFrameJson(data.toString());
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
    this.dispatchFrame(connection, parsed.frame);
  }

  private dispatchFrame(connection: TerminalStreamConnection, frame: TerminalFrame) {
    if (frame.type === 'daemon.register') {
      this.handleDaemonRegister(connection, frame);
      return;
    }
    if (frame.type === 'daemon.bindRun') {
      this.handleDaemonBindRun(connection, frame);
      return;
    }
    if (frame.type === 'browser.subscribe') {
      this.handleBrowserSubscribe(connection, frame);
      return;
    }
    if (frame.type === 'terminal.data') {
      this.handleTerminalData(connection, frame);
      return;
    }
    if (frame.type === 'terminal.snapshot') {
      this.handleTerminalSnapshot(connection, frame);
      return;
    }
    if (frame.type === 'terminal.end') {
      this.handleTerminalEnd(connection, frame);
      return;
    }
    if (frame.type === 'error') {
      this.handleDaemonError(connection, frame);
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
    try {
      const ctx = await this.authenticateBrowser(connection.request);
      await requireAgentGatewayPermission(
        ctx,
        AGENT_GATEWAY_ACTIONS.readTerminal,
        'Agent Gateway terminal read permission required',
      );
      connection.kind = 'browser';
      connection.userId = getUserId(ctx.state.currentUser);
      if (connection.subscriptions.size >= MAX_BROWSER_SUBSCRIPTIONS_PER_SOCKET) {
        this.sendError(
          connection.ws,
          'TERMINAL_SUBSCRIPTION_LIMIT',
          'Too many terminal stream subscriptions',
          frame.requestId,
        );
        return;
      }
      this.addSubscription(connection, frame.runId);
      this.send(connection.ws, createTerminalAck(frame.requestId));
      if (frame.lastOffset !== undefined) {
        await this.requestDaemonSnapshot(connection.ws, frame.runId, frame.lastOffset);
      }
    } catch (error) {
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
        this.sendError(
          pending.browser,
          validation.reason === 'leaseLost' ? 'TERMINAL_LEASE_LOST' : 'TERMINAL_RUN_NOT_BOUND',
          'Run stream is no longer bound to this daemon',
        );
        return;
      }
      this.send(pending.browser, frame);
    }
  }

  private handleTerminalEnd(connection: TerminalStreamConnection, frame: TerminalEnd) {
    const bound = this.boundRuns.get(frame.runId);
    if (!bound || bound.ws !== connection.ws) {
      this.sendError(connection.ws, 'TERMINAL_RUN_NOT_BOUND', 'Run is not bound to this daemon');
      return;
    }
    this.boundRuns.delete(frame.runId);
    this.broadcastToRun(frame.runId, frame);
  }

  private async handleDaemonError(connection: TerminalStreamConnection, frame: TerminalError) {
    if (frame.requestId) {
      const pending = this.pendingSnapshotRequests.get(frame.requestId);
      if (pending) {
        if (pending.daemon !== connection.ws) {
          return;
        }
        this.pendingSnapshotRequests.delete(frame.requestId);
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

  private addSubscription(connection: TerminalStreamConnection, runId: string) {
    connection.subscriptions.add(runId);
    const subscribers = this.browserSubscriptions.get(runId) || new Set<WebSocket>();
    subscribers.add(connection.ws);
    this.browserSubscriptions.set(runId, subscribers);
  }

  private async requestDaemonSnapshot(browser: WebSocket, runId: string, fromOffset: number) {
    const validation = await this.validateBoundRun(runId);
    if (validation.ok === false) {
      if (fromOffset > 0) {
        this.sendError(
          browser,
          validation.reason === 'leaseLost' ? 'TERMINAL_LEASE_LOST' : 'TERMINAL_DAEMON_UNAVAILABLE',
          'No daemon stream is currently bound to this run',
        );
      } else if (validation.reason === 'leaseLost') {
        this.sendError(browser, 'TERMINAL_LEASE_LOST', 'Run lease is no longer active for this daemon');
      }
      return;
    }
    const { bound } = validation;

    const requestId = `snapshot:${Date.now()}:${Math.random().toString(16).slice(2)}`;
    this.pendingSnapshotRequests.set(requestId, {
      browser,
      daemon: bound.ws,
      runId,
    });
    this.send(bound.ws, {
      type: 'daemon.snapshotRequest',
      protocol: 'agent-gateway.terminal.v1',
      requestId,
      runId,
      fromOffset,
    });
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
    if (frame.offsetEnd - frame.offsetStart !== byteLength) {
      return createTerminalError('TERMINAL_PROTOCOL_ERROR', 'Terminal payload byte length does not match offsets');
    }
    return null;
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
          this.broadcastToRun(runId, {
            type: 'terminal.end',
            protocol: 'agent-gateway.terminal.v1',
            runId,
            sessionName: bound.sessionName,
            offsetEnd: 0,
            reason: 'disconnected',
          });
        }
      }
    }

    for (const [requestId, pending] of Array.from(this.pendingSnapshotRequests.entries())) {
      if (pending.browser === ws) {
        this.pendingSnapshotRequests.delete(requestId);
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
}

type TerminalServerFrameForSend = Exclude<TerminalFrame, TerminalClientSubscribe | TerminalDaemonBindRun>;

export function registerTerminalStreamBroker(plugin: Plugin) {
  const broker = new TerminalStreamBroker(plugin.app);
  broker.register();
  return broker;
}
