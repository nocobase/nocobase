import { Context, Next } from '@nocobase/actions';
import { COOKIE_KEY_AUTHENTICATOR, COOKIE_KEY_TICKET } from '../../constants';

export const service = async (ctx: Context, next: Next) => {
  const { params } = ctx.action;
  ctx.cookies.set(COOKIE_KEY_TICKET, params.ticket, {
    httpOnly: true,
  });
  ctx.redirect(`/signin?authenticator=${ctx.cookies.get(COOKIE_KEY_AUTHENTICATOR)}`);
  return next();
};
