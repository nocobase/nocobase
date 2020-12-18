import multer from '@koa/multer';
import actions from '@nocobase/actions';

import { FILE_FIELD_NAME } from '../constants';

export default async function (ctx: actions.Context, next: actions.Next) {
  const { actionName } = ctx.action.params;

  if (actionName !== 'upload') {
    return next();
  }

  const options = {};
  const upload = multer(options);
  return upload.single(FILE_FIELD_NAME)(ctx, next);
};
