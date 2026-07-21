/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { McpToolCallContext } from '@nocobase/ai';

export const MCP_IDENTITY_HEADER_NAMES = ['authorization', 'x-role', 'x-authenticator'] as const;

function normalizeHeaderValue(value?: string | string[]) {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

function readHeader(headers: McpToolCallContext['headers'], name: (typeof MCP_IDENTITY_HEADER_NAMES)[number]) {
  if (!headers) {
    return undefined;
  }

  const direct = normalizeHeaderValue(headers[name]);
  if (direct) {
    return direct;
  }

  const matchingEntry = Object.entries(headers).find(([headerName]) => headerName.toLowerCase() === name);
  return normalizeHeaderValue(matchingEntry?.[1]);
}

export function buildMcpIdentityHeaders(context?: McpToolCallContext) {
  const headers: Record<string, string> = {};
  const role = readHeader(context?.headers, 'x-role');
  const authenticator = readHeader(context?.headers, 'x-authenticator');

  if (role) {
    headers['x-role'] = role;
  }
  if (authenticator) {
    headers['x-authenticator'] = authenticator;
  }

  if (context?.token) {
    headers.authorization = `Bearer ${context.token}`;
  } else {
    const authorization = readHeader(context?.headers, 'authorization');
    if (authorization) {
      headers.authorization = authorization;
    }
  }

  return headers;
}

export function isMcpIdentityHeader(name: string) {
  return MCP_IDENTITY_HEADER_NAMES.includes(name.toLowerCase() as (typeof MCP_IDENTITY_HEADER_NAMES)[number]);
}
