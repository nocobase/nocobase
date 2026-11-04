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
import { createHmac } from 'crypto';
import jwt from 'jsonwebtoken';

const audience = 'backup-download';

function downloadSecret(app: Application) {
  return createHmac('sha256', app.authManager.jwt.getSecret()).update(`${audience}:${app.name}`).digest();
}

export function signDownloadToken(app: Application, fileName: string) {
  return jwt.sign({ fileName }, downloadSecret(app), {
    algorithm: 'HS256',
    audience,
    expiresIn: 30,
  });
}

export async function authenticateDownload(ctx: Context, next: Next) {
  if (ctx.action.resourceName !== 'backups' || ctx.action.actionName !== 'download' || !('hash' in ctx.query)) {
    return next();
  }
  ctx.assert(ctx.method === 'GET', 405);
  ctx.set('Cache-Control', 'private, no-store');
  const token = ctx.query.hash;
  if (typeof token !== 'string') {
    return ctx.throw(401);
  }
  try {
    const payload = jwt.verify(token, downloadSecret(ctx.app), { algorithms: ['HS256'], audience });
    ctx.assert(typeof payload !== 'string' && payload.fileName === ctx.action.params.filterByTk, 401);
  } catch {
    ctx.throw(401);
  }
  // Validate once at request entry; token expiry must not interrupt an accepted file stream.
  ctx.skipAuthCheck = true;
  ctx.state.backupDownload = true;
  await next();
}
