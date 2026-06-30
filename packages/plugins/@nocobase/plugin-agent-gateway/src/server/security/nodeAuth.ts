/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { hashNodeToken, verifyNodeToken } from './tokens';

export const AGENT_GATEWAY_NODE_TOKEN_HEADER = 'x-agent-gateway-token';

export interface AgentGatewayMachineSubject {
  type: 'machine';
  nodeId: string | number;
  nodeKey: string;
  tokenLast4?: string;
}

export interface AgentGatewayNodeAuthResult {
  node: ModelLike;
  subject: AgentGatewayMachineSubject;
}

export interface NodeAuthContext {
  db: {
    getRepository(collectionName: string): {
      findOne(options: { filter: Record<string, unknown> }): Promise<ModelLike | null>;
    };
  };
  get(name: string): string | undefined;
  state: Record<string, unknown>;
  throw(status: number, message?: string): never;
}

export interface ModelLike {
  get(key: string): unknown;
}

type MiddlewareNext = () => Promise<void>;

function readModelString(model: ModelLike, key: string) {
  const value = model.get(key);
  return typeof value === 'string' ? value : '';
}

function readModelId(model: ModelLike) {
  const value = model.get('id');
  if (typeof value === 'string' || typeof value === 'number') {
    return value;
  }
  return '';
}

export function extractBearerToken(authorization: string | undefined) {
  if (!authorization) {
    return null;
  }

  const match = authorization.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || null;
}

export function extractNodeToken(ctx: Pick<NodeAuthContext, 'get'>) {
  return ctx.get(AGENT_GATEWAY_NODE_TOKEN_HEADER)?.trim() || extractBearerToken(ctx.get('authorization'));
}

export async function authenticateNodeToken(ctx: NodeAuthContext): Promise<AgentGatewayNodeAuthResult> {
  const token = extractNodeToken(ctx);
  if (!token) {
    ctx.throw(401, 'Missing Agent Gateway node token');
  }

  const node = await ctx.db.getRepository('agNodes').findOne({
    filter: {
      nodeTokenHash: hashNodeToken(token),
    },
  });

  if (!node || !verifyNodeToken(token, readModelString(node, 'nodeTokenHash'))) {
    ctx.throw(401, 'Invalid Agent Gateway node token');
  }

  if (readModelString(node, 'status') !== 'active') {
    ctx.throw(403, 'Agent Gateway node is not active');
  }

  const subject: AgentGatewayMachineSubject = {
    type: 'machine',
    nodeId: readModelId(node),
    nodeKey: readModelString(node, 'nodeKey'),
    tokenLast4: readModelString(node, 'tokenLast4') || undefined,
  };

  ctx.state.agentGatewaySubject = subject;
  ctx.state.agentGatewayNode = node;
  ctx.state.agentGatewayAuth = {
    authenticatedBy: 'node-token',
    subject,
  };

  return {
    node,
    subject,
  };
}

export function nodeTokenAuthMiddleware() {
  return async (ctx: NodeAuthContext, next: MiddlewareNext) => {
    await authenticateNodeToken(ctx);
    await next();
  };
}
