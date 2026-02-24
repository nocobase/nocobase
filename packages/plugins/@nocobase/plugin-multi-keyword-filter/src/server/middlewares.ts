/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Context, Next } from 'koa';
import qs from 'qs';

export async function bodyToQueryMiddleware(ctx: Context, next: Next) {
  const bodyData: any = ctx.request.body || {};

  if (bodyData.__params__) {
    ctx.method = bodyData.__method__?.toUpperCase() || 'GET';

    const parsedQuerystring = qs.parse(ctx.request.querystring, { strictNullHandling: true });
    const mergedQuery = { ...parsedQuerystring, ...bodyData.__params__ };

    delete bodyData.__params__;
    delete bodyData.__method__;

    ctx.request.query = mergedQuery;
    ctx.request.querystring = qs.stringify(mergedQuery, {
      strictNullHandling: true,
      arrayFormat: 'brackets',
    });
  }

  await next();
}
