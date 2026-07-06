/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { randomUUID } from 'crypto';

import { Context, Next } from '@nocobase/actions';
import { Application, Plugin } from '@nocobase/server';
import type { Transaction } from 'sequelize';

import {
  TERMINAL_STREAM_BROWSER_AUTHENTICATOR_PROTOCOL_PREFIX,
  TERMINAL_STREAM_BROWSER_AUTH_PROOF_PROTOCOL_PREFIX,
  TERMINAL_STREAM_BROWSER_ROLE_PROTOCOL_PREFIX,
  TERMINAL_STREAM_BROWSER_SUBPROTOCOL,
  TERMINAL_STREAM_BROWSER_TICKET_PROOF_PROTOCOL_PREFIX,
  TERMINAL_STREAM_BROWSER_TICKET_PROTOCOL_PREFIX,
} from '../../shared/terminalStreamProtocol';
import { AGENT_GATEWAY_ACTIONS, createStreamToken, hashStreamToken, verifyStreamToken } from '../security';
import {
  API_PREFIX,
  ModelRecord,
  assertRunVisible,
  getCurrentUserId,
  getModelString,
  getModelTargetKey,
  getModelValue,
  getRecord,
  getString,
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
    user?: unknown;
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
  user: unknown;
  roleName?: string;
  originalUrl?: string;
}) {
  const headers: Record<string, string> = {};
  if (options.roleName) {
    headers['x-role'] = options.roleName;
  }
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

function getCurrentRoleName(ctx: Context) {
  const roleName = getString(ctx.state.currentRole);
  if (roleName && roleName !== '__union__') {
    return roleName;
  }
  return '';
}

function getAuthenticatorName(ctx: Context) {
  return getString(ctx.get('X-Authenticator')) || 'basic';
}

function getRedactedBrowserStreamProtocols(roleName?: string | null) {
  return [
    TERMINAL_STREAM_BROWSER_SUBPROTOCOL,
    `${TERMINAL_STREAM_BROWSER_TICKET_PROTOCOL_PREFIX}${REDACTED_PROTOCOL_VALUE}`,
    `${TERMINAL_STREAM_BROWSER_TICKET_PROOF_PROTOCOL_PREFIX}${REDACTED_PROTOCOL_VALUE}`,
    `${TERMINAL_STREAM_BROWSER_AUTH_PROOF_PROTOCOL_PREFIX}${REDACTED_PROTOCOL_VALUE}`,
    `${TERMINAL_STREAM_BROWSER_AUTHENTICATOR_PROTOCOL_PREFIX}${REDACTED_PROTOCOL_VALUE}`,
    ...(roleName ? [`${TERMINAL_STREAM_BROWSER_ROLE_PROTOCOL_PREFIX}${REDACTED_PROTOCOL_VALUE}`] : []),
  ];
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
  const proof = createStreamToken();
  const authProof = createStreamToken();
  const roleName = getCurrentRoleName(ctx) || null;
  const authenticator = getAuthenticatorName(ctx);
  const expiresAt = new Date(Date.now() + DEFAULT_TERMINAL_STREAM_TICKET_TTL_MS);
  await ctx.db.getRepository('agTerminalStreamTickets').create({
    values: {
      id: randomUUID(),
      ticketHash: ticket.tokenHash,
      ticketLast4: ticket.tokenLast4,
      ticketProofHash: proof.tokenHash,
      authProofHash: authProof.tokenHash,
      runId,
      userId,
      roleName,
      expiresAt,
      metadataJson: {
        ttlMs: DEFAULT_TERMINAL_STREAM_TICKET_TTL_MS,
      },
    },
  });

  ctx.body = {
    ticket: ticket.token,
    ticketProof: proof.token,
    authProof: authProof.token,
    authenticator,
    role: roleName,
    expiresAt: expiresAt.toISOString(),
    runId,
    protocols: getRedactedBrowserStreamProtocols(roleName),
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

function assertTicketScope(
  ticketRecord: ModelRecord,
  options: { runId: string; ticketProof: string; authProof?: string },
) {
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
  if (!verifyStreamToken(options.ticketProof, getModelString(ticketRecord, 'ticketProofHash'))) {
    throw new TerminalStreamTicketError(
      'TERMINAL_STREAM_TICKET_SCOPE_MISMATCH',
      'Terminal stream ticket proof is invalid',
    );
  }
  const expiresAt = getDateFromModel(ticketRecord, 'expiresAt');
  if (!expiresAt || expiresAt.getTime() <= Date.now()) {
    throw new TerminalStreamTicketError('TERMINAL_STREAM_TICKET_EXPIRED', 'Terminal stream ticket has expired', 401);
  }
  const authProofHash = getModelString(ticketRecord, 'authProofHash');
  const authProof = getString(options.authProof);
  if (authProof && (!authProofHash || !verifyStreamToken(authProof, authProofHash))) {
    throw new TerminalStreamTicketError(
      'TERMINAL_STREAM_TICKET_SCOPE_MISMATCH',
      'Terminal stream auth proof is invalid',
      401,
    );
  }
}

export async function consumeTerminalStreamTicket(options: {
  app: Application;
  runId: string;
  ticket?: string;
  ticketProof?: string;
  authProof?: string;
}) {
  const ticket = getString(options.ticket);
  const ticketProof = getString(options.ticketProof);
  if (!ticket || !ticketProof) {
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
    assertTicketScope(ticketRecord, {
      runId: options.runId,
      ticketProof,
      authProof: options.authProof,
    });
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
  })) as ModelRecord | null;
  if (!user) {
    throw new TerminalStreamTicketError(
      'TERMINAL_STREAM_TICKET_SCOPE_MISMATCH',
      'Terminal stream ticket user is invalid',
      401,
    );
  }

  const ctx = createTerminalStreamActionContext({
    app: options.app,
    user,
    roleName: getModelString(ticketRecord, 'roleName') || undefined,
  });
  try {
    await requireAgentGatewayPermission(
      ctx,
      AGENT_GATEWAY_ACTIONS.readTerminal,
      'Agent Gateway terminal read permission required',
    );
    const run = await assertRunVisible(ctx, options.runId, 'get');
    await requireTerminalOutputCapability(ctx, run, 'stream-subscribe');
  } catch (error) {
    if (error instanceof TerminalStreamTicketError) {
      throw error;
    }
    throw new TerminalStreamTicketError(
      'TERMINAL_PERMISSION_DENIED',
      'Agent Gateway terminal read permission required',
    );
  }

  return {
    ctx,
    userId,
  };
}

export function registerTerminalStreamTicketRoutes(plugin: Plugin) {
  plugin.app.use(
    async (ctx: Context, next: Next) => {
      if (!ctx.path.startsWith(API_PREFIX)) {
        await next();
        return;
      }
      const routePath = ctx.path.slice(API_PREFIX.length);
      const ticketCreateMatch = routePath.match(/^\/runs\/([^/]+)\/terminal-stream-tickets:create$/);

      if (ctx.method === 'POST' && ticketCreateMatch) {
        if (!UUID_PATTERN.test(ticketCreateMatch[1])) {
          ctx.throw(400, 'runId must be a valid UUID');
        }
        await createTerminalStreamTicket(ctx, ticketCreateMatch[1]);
        return;
      }

      await next();
    },
    {
      tag: 'agentGatewayTerminalStreamTicketRoutes',
      after: 'agentGatewayRunTerminalRoutes',
      before: 'agentGatewayRunObservabilityRoutes',
    },
  );
}
