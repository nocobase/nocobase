/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Context, Next } from '@nocobase/actions';
import type { Application } from '@nocobase/server';
import { createHmac, timingSafeEqual } from 'crypto';

function signature(app: Application, fileName: string, expires: Buffer) {
  return createHmac('sha256', app.authManager.jwt.getSecret())
    .update(JSON.stringify(['backup-download', app.name, fileName]))
    .update(expires)
    .digest();
}

export function signDownloadToken(app: Application, fileName: string) {
  // Six bytes for the expiry in milliseconds and the full 32-byte HMAC encode to 51 URL-safe characters.
  const expires = Buffer.alloc(6);
  expires.writeUIntBE(Date.now() + 30_000, 0, 6);
  return Buffer.concat([expires, signature(app, fileName, expires)]).toString('base64url');
}

export async function authenticateDownload(ctx: Context, next: Next) {
  if (ctx.action.resourceName !== 'backups' || ctx.action.actionName !== 'download' || !('hash' in ctx.query)) {
    return next();
  }
  ctx.assert(ctx.method === 'GET', 405);
  ctx.set('Cache-Control', 'private, no-store');
  const token = ctx.query.hash;
  if (typeof token !== 'string' || !/^[A-Za-z0-9_-]{51}$/.test(token)) {
    return ctx.throw(401);
  }
  const bytes = Buffer.from(token, 'base64url');
  const expires = bytes.subarray(0, 6);
  ctx.assert(
    bytes.toString('base64url') === token &&
      expires.readUIntBE(0, 6) > Date.now() &&
      timingSafeEqual(bytes.subarray(6), signature(ctx.app, ctx.action.params.filterByTk, expires)),
    401,
  );
  // Validate once at request entry; token expiry must not interrupt an accepted file stream.
  ctx.skipAuthCheck = true;
  ctx.state.backupDownload = true;
  await next();
}
