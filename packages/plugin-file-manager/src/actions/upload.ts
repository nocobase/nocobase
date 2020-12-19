import multer from '@koa/multer';
import actions from '@nocobase/actions';

import { FILE_FIELD_NAME } from '../constants';

export async function middleware(ctx: actions.Context, next: actions.Next) {
  const { actionName } = ctx.action.params;

  if (actionName !== 'upload') {
    return next();
  }

  const options = {};
  const upload = multer(options);
  return upload.single(FILE_FIELD_NAME)(ctx, next);
};

export async function action(ctx: actions.Context, next: actions.Next) {
  const { [FILE_FIELD_NAME]: file } = ctx;
  console.log(file);
  ctx.body = file;
  await next();
};
