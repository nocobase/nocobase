import { Action } from '@nocobase/resourcer';

export async function dataWrapping(ctx, next) {
  await next();
  if (ctx.withoutDataWrapping) {
    return;
  }
  if (!ctx?.action?.params) {
    return;
  }
  if (ctx.body instanceof Buffer) {
    return;
  }
  if (!ctx.body) {
    ctx.body = {};
  }
  const { rows, ...meta } = ctx.body;
  if (rows) {
    ctx.body = {
      data: rows,
      meta,
    };
  } else {
    ctx.body = {
      data: ctx.body,
    };
  }
}

export default dataWrapping;
