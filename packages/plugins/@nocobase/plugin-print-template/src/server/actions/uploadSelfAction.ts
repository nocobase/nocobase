/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { uid } from '@formily/shared';
import { Context, Next } from '@nocobase/actions';
import { resolve } from 'path';
import os from 'os';
export async function uploadSelfAction(ctx: Context, next: Next) {
  ctx.body = {
    id: uid(),
    filename: ctx.file.filename,
    size: ctx.file.size,
    mimetype: ctx.file.mimetype,
    // url: resolve(os.tmpdir(), ctx.file.filename)
  };
}
