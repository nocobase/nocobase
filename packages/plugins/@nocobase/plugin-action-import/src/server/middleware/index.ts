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
import fs from 'fs';
import path from 'path';

function getUploadDir() {
  return path.join(process.cwd(), 'storage', 'tmp');
}

export async function importMiddleware(ctx: Context, next: Next) {
  if (ctx.action.actionName !== 'importXlsx') {
    return next();
  }
  const storage = multer.diskStorage({
    destination(req, file, cb) {
      const dir = getUploadDir();
      fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename(req, file, cb) {
      const ext = path.extname(file.originalname || '.xlsx') || '.xlsx';
      cb(null, `import-${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
    },
  });
  const upload = multer({ storage }).single('file');
  return upload(ctx, next);
}
