import multer from '@koa/multer';

import { FILE_FIELD_NAME } from '../constants';

export default async function (ctx, next) {
  const { [FILE_FIELD_NAME]: file } = ctx;
  console.log(file);
  ctx.body = file;
  await next();
};
