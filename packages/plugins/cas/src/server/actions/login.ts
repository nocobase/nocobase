import { Context, Next } from '@nocobase/actions';
import { CASAuth } from '../auth';
import { COOKIE_KEY_AUTHENTICATOR } from '../../constants';

export const login = async (ctx: Context, next: Next) => {
  const { authenticator } = ctx.action.params;
  ctx.cookies.set(COOKIE_KEY_AUTHENTICATOR, authenticator, {
    httpOnly: true,
  });
  const auth = (await ctx.app.authManager.get(authenticator, ctx)) as CASAuth;
  const { casUrl, serviceUrl } = auth.getOptions();
  ctx.redirect(`${casUrl}/login?service=${serviceUrl}`);
  next();
};
