import multer from '@koa/multer';

import { FILE_FIELD_NAME } from '../constants';

export default {
  // @ts-ignore
  async middleware(ctx, next) {
    const options = {};
    const upload = multer(options);
    return upload.single(FILE_FIELD_NAME)(ctx, next);
  },

  // @ts-ignore
  async handler(ctx, next) {
    const { [FILE_FIELD_NAME]: file } = ctx;
    console.log(file);
    ctx.body = file;
    await next();
  }
};
