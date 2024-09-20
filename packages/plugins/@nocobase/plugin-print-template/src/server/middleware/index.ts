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

// const mimeTypeToExtensionMap = {
//   'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
//   'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
// };
import { mimeTypeToExtensionMap } from './../util';
const storage = multer.diskStorage({
  // destination: os.tmpdir(), //  If no destination is given, the operating system's default directory for temporary files is used.
  filename(req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = mimeTypeToExtensionMap[file.mimetype];
    cb(null, 'printTemplate' + '-' + uniqueSuffix + '.' + ext);
  },
});
export async function uploadSelfMiddleware(ctx: Context, next: Next) {
  if (ctx.action.actionName === 'uploadSelf') {
    const upload = multer({ storage }).single('file');
    return upload(ctx, next);
  }
  return next();
}
