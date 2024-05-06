/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Context, Next } from '@nocobase/actions';
import { koaMulter as multer } from '@nocobase/utils';

export async function uploadMiddleware(ctx: Context, next: Next) {
  if (ctx.action.resourceName === 'pm' && ['add', 'update'].includes(ctx.action.actionName)) {
    const upload = multer().single('file');
    return upload(ctx, next);
  }
  return next();
}
