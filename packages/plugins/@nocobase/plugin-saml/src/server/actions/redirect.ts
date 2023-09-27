import { Context, Next } from '@nocobase/actions';

export const redirect = async (ctx: Context, next: Next) => {
  const { params } = ctx.action;
  const url = `/signin?${new URLSearchParams(params).toString()}`;
  ctx.redirect(url);

  await next();
};
