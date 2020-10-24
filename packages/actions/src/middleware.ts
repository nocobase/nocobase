import { Context, Next } from './actions';
import { Action } from '@nocobase/resourcer';

export async function middleware(ctx: Context, next: Next) {
  await next();
  if (ctx.action instanceof Action) {
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
}

export default middleware;
