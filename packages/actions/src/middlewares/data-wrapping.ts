import { Context, Next } from '../actions';
import { Action } from '@nocobase/resourcer';

export async function dataWrapping(ctx: Context, next: Next) {
  await next();
  if (!(ctx.action instanceof Action)) {
    return;
  }
  if (ctx.withoutDataWrapping) {
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
