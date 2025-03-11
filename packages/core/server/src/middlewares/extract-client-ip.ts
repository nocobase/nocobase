/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Context, Next } from '@nocobase/actions';

export function extractClientIp() {
  return async function extractClientIp(ctx: Context, next: Next) {
    const forwardedFor = ctx.get('X-Forwarded-For');
    const ipArray = forwardedFor ? forwardedFor.split(',') : [];
    const clientIp = ipArray.length > 0 ? ipArray[0].trim() : ctx.request.ip;
    ctx.state.clientIp = clientIp;

    await next();
  };
}
