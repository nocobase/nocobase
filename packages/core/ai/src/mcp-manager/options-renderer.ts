/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Context } from '@nocobase/actions';
import { parse } from '@nocobase/utils';
import type { MCPOptions } from './types';

const unsafePathSegments = new Set(['__proto__', 'prototype', 'constructor']);
const currentUserVariableRegExp = /{{\s*(?:(ctx)\.)?(currentUser|\$user)(?:\.([^}]+))?\s*}}/g;

const hasUnsafePathSegment = (path: string) => {
  return path
    .split(/[.[\]]+/)
    .filter(Boolean)
    .some((segment) => unsafePathSegments.has(segment));
};

const toPlainObject = (value: any) => {
  if (!value) {
    return value;
  }
  if (typeof value.toJSON === 'function') {
    return value.toJSON();
  }
  return value;
};

const getCurrentUserReferencePaths = (value: unknown) => {
  const text = typeof value === 'string' ? value : JSON.stringify(value ?? {});
  return Array.from(text.matchAll(currentUserVariableRegExp))
    .map((match) => match[3]?.trim())
    .filter((path): path is string => !!path && !hasUnsafePathSegment(path));
};

const getCurrentUserAppends = (paths: string[], currentUser: any) => {
  return Array.from(
    new Set(
      paths.map((path) => path.split('.')[0]).filter((append) => append && !Reflect.has(currentUser || {}, append)),
    ),
  );
};

async function getCurrentUser(ctx?: Context, template?: unknown) {
  const currentUser = ctx?.state?.currentUser ?? ctx?.auth?.user;
  if (!ctx || !currentUser) {
    return toPlainObject(currentUser);
  }

  const appends = getCurrentUserAppends(getCurrentUserReferencePaths(template), currentUser);
  if (!appends.length) {
    return toPlainObject(currentUser);
  }

  const user = await ctx.db.getRepository('users').findOne({
    filterByTk: currentUser.id,
    appends,
  });
  return toPlainObject(user) || toPlainObject(currentUser);
}

const stringifyRecord = (value: unknown): Record<string, string> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }
  return Object.entries(value as Record<string, unknown>).reduce<Record<string, string>>((result, [key, item]) => {
    if (!key || item == null) {
      return result;
    }
    result[key] = String(item);
    return result;
  }, {});
};

const stringifyArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((item) => item != null).map((item) => String(item));
};

export const normalizeMCPOptions = (options: MCPOptions): MCPOptions => {
  const normalized: MCPOptions = {
    ...options,
    args: stringifyArray(options.args),
    env: stringifyRecord(options.env),
    headers: stringifyRecord(options.headers),
    useUserContext: options.transport === 'stdio' ? false : options.useUserContext === true,
  };

  if (normalized.transport === 'stdio') {
    normalized.url = undefined;
    normalized.headers = {};
  }
  return normalized;
};

export async function renderMCPOptions(
  options: MCPOptions,
  app: { environment?: { getVariables?: () => Record<string, unknown> } },
  ctx?: Context,
): Promise<MCPOptions> {
  const currentUser = options.useUserContext ? await getCurrentUser(ctx, options) : undefined;
  const variables = {
    $env: app.environment?.getVariables?.() ?? {},
    currentUser,
    $user: currentUser,
    ctx: {
      currentUser,
    },
  };

  return normalizeMCPOptions(parse(options)(variables) as MCPOptions);
}
