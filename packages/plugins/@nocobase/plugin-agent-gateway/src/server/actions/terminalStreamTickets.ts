/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { randomUUID } from 'crypto';

import { Context } from '@nocobase/actions';
import { Model } from '@nocobase/database';
import { setCurrentRole } from '@nocobase/plugin-acl';
import { Application, Plugin } from '@nocobase/server';
import type { Transaction } from 'sequelize';

import {
  TERMINAL_STREAM_BROWSER_SUBPROTOCOL,
  TERMINAL_STREAM_BROWSER_TICKET_PROTOCOL_PREFIX,
} from '../../shared/terminalStreamProtocol';
import { AGENT_GATEWAY_API_ACTIONS, getAgentGatewayApiActionName } from '../../shared/apiContract';
import { AGENT_GATEWAY_ACTIONS, createStreamToken, hashStreamToken } from '../security';
import {
  ModelRecord,
  asActionContext,
  assertRunVisible,
  getCurrentUserId,
  getModelString,
  getModelTargetKey,
  getModelValue,
  getString,
  getActionTargetKey,
  requireAgentGatewayPermission,
} from './utils';
import { getRunProviderCapabilitySummary, isRunCapabilitySupported } from './capabilityUtils';
import {
  AGENT_GATEWAY_ACTION_UNSUPPORTED_CODE,
  getUnsupportedCapabilityMessage,
} from '../../shared/providerCapabilities';

export const DEFAULT_TERMINAL_STREAM_TICKET_TTL_MS = 60 * 1000;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const REDACTED_PROTOCOL_VALUE = '<redacted>';

export type TerminalStreamTicketErrorCode =
  | 'TERMINAL_PERMISSION_DENIED'
  | 'TERMINAL_STREAM_TICKET_EXPIRED'
  | 'TERMINAL_STREAM_TICKET_SCOPE_MISMATCH';

export class TerminalStreamTicketError extends Error {
  readonly terminalCode: TerminalStreamTicketErrorCode;
  readonly status: number;

  constructor(code: TerminalStreamTicketErrorCode, message: string, status = 403) {
    super(message);
    this.name = 'TerminalStreamTicketError';
    this.terminalCode = code;
    this.status = status;
  }
}

interface MinimalActionContext {
  app: Application;
  db: Application['db'];
  cache: Application['cache'];
  logger: Application['logger'];
  log: Application['log'];
  headers: Record<string, string>;
  state: Record<string, unknown>;
  auth: {
    user?: Model;
  };
  req: {
    headers: Record<string, string>;
  };
  request: {
    headers: Record<string, string>;
  };
  originalUrl: string;
  get(name: string): string;
  throw(status: number, message?: string | { message?: string; code?: string }): never;
  t(key: string, options?: Record<string, unknown>): string;
}

function createTerminalStreamActionContext(options: {
  app: Application;
  user: Model;
  authenticator: string;
  currentRole: string;
  originalUrl?: string;
}) {
  const headers: Record<string, string> = {
    'x-authenticator': options.authenticator,
    'x-role': options.currentRole,
  };
  const ctx: MinimalActionContext = {
    app: options.app,
    db: options.app.db,
    cache: options.app.cache,
    logger: options.app.logger,
    log: options.app.log,
    headers,
    state: {
      currentUser: options.user,
    },
    auth: {
      user: options.user,
    },
    req: {
      headers,
    },
    request: {
      headers,
    },
    originalUrl: options.originalUrl || '/ws/agent-gateway/terminal',
    get(name: string) {
      return headers[name.toLowerCase()] || '';
    },
    throw(status: number, message?: string | { message?: string; code?: string }): never {
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
  return ctx as unknown as Context;
}

function getDateFromModel(model: ModelRecord, key: string) {
  const value = getModelValue(model, key);
  if (!value) {
    return null;
  }
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
}

function getRoleNames(value: unknown) {
  return Array.isArray(value)
    ? Array.from(new Set(value.filter((role): role is string => typeof role === 'string' && Boolean(role))))
    : [];
}

function getAuthenticatorName(ctx: Context) {
  return getString(ctx.get('X-Authenticator')) || 'basic';
}

function getRedactedBrowserStreamProtocols() {
  return [
    TERMINAL_STREAM_BROWSER_SUBPROTOCOL,
    `${TERMINAL_STREAM_BROWSER_TICKET_PROTOCOL_PREFIX}${REDACTED_PROTOCOL_VALUE}`,
  ];
}

function isDisabledUser(user: ModelRecord) {
  const enabled = getModelValue(user, 'enabled');
  const status = getModelString(user, 'status').toLowerCase();
  return (
    enabled === false ||
    Boolean(getModelValue(user, 'disabledAt')) ||
    ['blocked', 'disabled', 'inactive', 'suspended'].includes(status)
  );
}

async function restoreTerminalStreamTicketContext(options: {
  app: Application;
  user: Model;
  authenticator: string;
  currentRole: string;
  currentRoles: string[];
}) {
  const ctx = createTerminalStreamActionContext(options);
  const builtInAuthenticator = options.app.authManager.getBuiltInAuthenticator(options.authenticator);
  if (!builtInAuthenticator) {
    const storedAuthenticator = (await options.app.db.getRepository('authenticators').findOne({
      filter: {
        name: options.authenticator,
        enabled: true,
      },
    })) as ModelRecord | null;
    if (!storedAuthenticator) {
      throw new TerminalStreamTicketError('TERMINAL_PERMISSION_DENIED', 'Terminal stream authenticator is disabled');
    }
  }

  const auth = await options.app.authManager.get(options.authenticator, ctx);
  auth.user = options.user;
  (ctx as Context & { auth: typeof auth }).auth = auth;
  await setCurrentRole(ctx, async () => {});

  const restoredCurrentRole = getString(ctx.state.currentRole);
  const restoredCurrentRoles = getRoleNames(ctx.state.currentRoles);
  if (
    restoredCurrentRole !== options.currentRole ||
    !options.currentRoles.length ||
    options.currentRoles.some((role) => !restoredCurrentRoles.includes(role))
  ) {
    throw new TerminalStreamTicketError(
      'TERMINAL_PERMISSION_DENIED',
      'Terminal stream ticket role context is no longer available',
    );
  }

  ctx.state.currentRole = options.currentRole;
  ctx.state.currentRoles = options.currentRoles;
  return ctx;
}

async function requireTerminalStreamTicketPermission(ctx: Context) {
  await requireAgentGatewayPermission(
    ctx,
    AGENT_GATEWAY_ACTIONS.readTerminal,
    'Agent Gateway terminal read permission required',
  );
}

async function requireTerminalOutputCapability(
  ctx: Context,
  run: ModelRecord,
  phase: 'stream-ticket-create' | 'stream-subscribe',
) {
  const capabilitySummary = await getRunProviderCapabilitySummary(ctx, run);
  if (isRunCapabilitySupported(capabilitySummary, 'terminalOutput')) {
    return;
  }

  if (phase === 'stream-ticket-create') {
    ctx.throw(409, {
      code: AGENT_GATEWAY_ACTION_UNSUPPORTED_CODE,
      message: getUnsupportedCapabilityMessage('terminalOutput'),
    });
  }

  throw new TerminalStreamTicketError('TERMINAL_PERMISSION_DENIED', getUnsupportedCapabilityMessage('terminalOutput'));
}

async function cleanupTerminalStreamTickets(app: Application, now = new Date()) {
  await app.db.getRepository('agTerminalStreamTickets').destroy({
    filter: {
      $or: [
        {
          expiresAt: {
            $lte: now,
          },
        },
        {
          usedAt: {
            $ne: null,
          },
        },
      ],
    },
  });
}

export async function createTerminalStreamTicket(ctx: Context, runId: string) {
  await requireTerminalStreamTicketPermission(ctx);
  const run = await assertRunVisible(ctx, runId, 'get');
  await requireTerminalOutputCapability(ctx, run, 'stream-ticket-create');
  const userId = getCurrentUserId(ctx);
  if (!userId) {
    ctx.throw(401, 'Authentication required');
  }

  await cleanupTerminalStreamTickets(ctx.app);

  const ticket = createStreamToken();
  const currentRole = getString(ctx.state.currentRole);
  const currentRoles = getRoleNames(ctx.state.currentRoles);
  if (!currentRole || !currentRoles.length) {
    ctx.throw(401, 'The current user has no roles');
  }
  const authenticator = getAuthenticatorName(ctx);
  const expiresAt = new Date(Date.now() + DEFAULT_TERMINAL_STREAM_TICKET_TTL_MS);
  await ctx.db.getRepository('agTerminalStreamTickets').create({
    values: {
      id: randomUUID(),
      ticketHash: ticket.tokenHash,
      ticketLast4: ticket.tokenLast4,
      runId,
      userId,
      authenticator,
      currentRole,
      currentRoles,
      expiresAt,
    },
  });

  ctx.body = {
    ticket: ticket.token,
    expiresAt: expiresAt.toISOString(),
    runId,
    protocols: getRedactedBrowserStreamProtocols(),
  };
}

async function findTicketForUpdate(app: Application, ticket: string, transaction: Transaction) {
  return (await app.db.getRepository('agTerminalStreamTickets').findOne({
    filter: {
      ticketHash: hashStreamToken(ticket),
    },
    transaction,
    lock: transaction.LOCK.UPDATE,
  })) as ModelRecord | null;
}

function assertTicketScope(ticketRecord: ModelRecord, options: { runId: string }) {
  if (getModelString(ticketRecord, 'runId') !== options.runId) {
    throw new TerminalStreamTicketError(
      'TERMINAL_STREAM_TICKET_SCOPE_MISMATCH',
      'Terminal stream ticket is not scoped to this run',
    );
  }
  if (getDateFromModel(ticketRecord, 'usedAt')) {
    throw new TerminalStreamTicketError(
      'TERMINAL_STREAM_TICKET_SCOPE_MISMATCH',
      'Terminal stream ticket has already been used',
    );
  }
  const expiresAt = getDateFromModel(ticketRecord, 'expiresAt');
  if (!expiresAt || expiresAt.getTime() <= Date.now()) {
    throw new TerminalStreamTicketError('TERMINAL_STREAM_TICKET_EXPIRED', 'Terminal stream ticket has expired', 401);
  }
}

export async function consumeTerminalStreamTicket(options: { app: Application; runId: string; ticket?: string }) {
  const ticket = getString(options.ticket);
  if (!ticket) {
    throw new TerminalStreamTicketError(
      'TERMINAL_STREAM_TICKET_SCOPE_MISMATCH',
      'Terminal stream ticket is required',
      401,
    );
  }

  let ticketRecord: ModelRecord | null = null;
  await options.app.db.sequelize.transaction(async (transaction) => {
    ticketRecord = await findTicketForUpdate(options.app, ticket, transaction);
    if (!ticketRecord) {
      throw new TerminalStreamTicketError(
        'TERMINAL_STREAM_TICKET_SCOPE_MISMATCH',
        'Terminal stream ticket is invalid',
        401,
      );
    }
    assertTicketScope(ticketRecord, { runId: options.runId });
    await options.app.db.getRepository('agTerminalStreamTickets').update({
      filterByTk: getModelTargetKey(ticketRecord, 'id'),
      values: {
        usedAt: new Date(),
      },
      transaction,
    });
  });

  if (!ticketRecord) {
    throw new TerminalStreamTicketError(
      'TERMINAL_STREAM_TICKET_SCOPE_MISMATCH',
      'Terminal stream ticket is invalid',
      401,
    );
  }
  const userId = getModelTargetKey(ticketRecord, 'userId');
  const user = (await options.app.db.getRepository('users').findOne({
    filterByTk: userId,
  })) as Model | null;
  if (!user || isDisabledUser(user)) {
    throw new TerminalStreamTicketError(
      'TERMINAL_STREAM_TICKET_SCOPE_MISMATCH',
      'Terminal stream ticket user is invalid',
      401,
    );
  }

  const authenticator = getModelString(ticketRecord, 'authenticator');
  const currentRole = getModelString(ticketRecord, 'currentRole');
  const currentRoles = getRoleNames(getModelValue(ticketRecord, 'currentRoles'));
  try {
    const ctx = await restoreTerminalStreamTicketContext({
      app: options.app,
      user,
      authenticator,
      currentRole,
      currentRoles,
    });
    await requireAgentGatewayPermission(
      ctx,
      AGENT_GATEWAY_ACTIONS.readTerminal,
      'Agent Gateway terminal read permission required',
    );
    const run = await assertRunVisible(ctx, options.runId, 'get');
    await requireTerminalOutputCapability(ctx, run, 'stream-subscribe');
    return {
      ctx,
      userId,
    };
  } catch (error) {
    if (error instanceof TerminalStreamTicketError) {
      throw error;
    }
    throw new TerminalStreamTicketError(
      'TERMINAL_PERMISSION_DENIED',
      'Agent Gateway terminal read permission required',
    );
  }
}

export function registerTerminalStreamTicketRoutes(plugin: Plugin) {
  plugin.app.resourceManager.registerActionHandlers({
    [getAgentGatewayApiActionName(AGENT_GATEWAY_API_ACTIONS.createTerminalStreamTicket)]: async (ctx, next) => {
      const actionCtx = asActionContext(ctx);
      const runId = getActionTargetKey(actionCtx);
      if (!UUID_PATTERN.test(runId)) {
        actionCtx.throw(400, 'runId must be a valid UUID');
      }
      await createTerminalStreamTicket(actionCtx, runId);
      await next();
    },
  });
}
