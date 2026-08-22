/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export type { AuthCookieType } from './auth-cookie-name';
export { getAuthCookieName } from './auth-cookie-name';

function getFirstHeaderValue(value: string | string[] | undefined) {
  const header = Array.isArray(value) ? value[0] : value;
  return header?.split(',')[0]?.trim().toLowerCase();
}

export function getAuthCookieOptions(
  ctx: { protocol?: string; headers?: Record<string, string | string[] | undefined> },
  httpOnly = true,
  maxAge?: number,
) {
  const forwardedProto = ctx.headers?.['x-forwarded-proto'];
  const forwardedProtocol = getFirstHeaderValue(forwardedProto);
  const protocol = forwardedProtocol || ctx.protocol;
  const publicPath = process.env.APP_PUBLIC_PATH?.replace(/\/+$/g, '') || '/';
  const secure = protocol === 'https';

  return {
    httpOnly,
    sameSite: 'lax' as const,
    secure: secure && !forwardedProtocol,
    path: publicPath || '/',
    ...(secure && forwardedProtocol ? { secureProxy: true } : {}),
    ...(maxAge ? { maxAge } : {}),
  };
}
