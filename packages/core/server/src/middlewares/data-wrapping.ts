import { Context, Next } from '@nocobase/actions';

export function dataWrapping() {
  return async function dataWrapping(ctx: Context, next: Next) {
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

    if (ctx.body === undefined) {
      ctx.body = {};
    }

    const { rows, ...meta } = ctx.body || {};

    if (rows) {
      ctx.body = {
        data: rows,
        meta,
      };
    } else {
      ctx.body = {
        data: ctx.body,
      };

      if (ctx.status === 204) {
        ctx.status = 200;
      }
    }
  };
}

export default dataWrapping;
