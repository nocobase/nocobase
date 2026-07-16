/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export interface OriginContext {
  protocol?: string;
  headers?: Record<string, string | string[] | undefined>;
  get(name: string): string;
}

export function getFirstHeaderValue(value: string | string[] | undefined) {
  const header = Array.isArray(value) ? value[0] : value;
  return header?.split(',')[0]?.trim();
}

export function getCorsWhitelist() {
  const whitelistString = process.env.CORS_ORIGIN_WHITELIST;
  if (!whitelistString) {
    return null;
  }
  return new Set(
    whitelistString
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean),
  );
}

export function getRequestOrigin(ctx: OriginContext) {
  const protocol = (getFirstHeaderValue(ctx.headers?.['x-forwarded-proto']) || ctx.protocol)?.toLowerCase();
  const host = getFirstHeaderValue(ctx.headers?.['x-forwarded-host']) || ctx.get('host');
  return host ? `${protocol}://${host}` : undefined;
}

export function getOrigin(value: string) {
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

export function isSameOrigin(ctx: OriginContext, origin: string) {
  return origin === getRequestOrigin(ctx);
}

export function isTrustedOrigin(ctx: OriginContext, origin: string) {
  if (isSameOrigin(ctx, origin)) {
    return true;
  }
  return getCorsWhitelist()?.has(origin) || false;
}
