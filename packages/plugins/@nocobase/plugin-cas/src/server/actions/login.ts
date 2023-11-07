import { Context, Next } from '@nocobase/actions';
import { CASAuth } from '../auth';

export const login = async (ctx: Context, next: Next) => {
  const { authenticator } = ctx.action.params;
  const auth = (await ctx.app.authManager.get(authenticator, ctx)) as CASAuth;
  const { casUrl, serviceUrl } = auth.getOptions();
  const service = encodeURIComponent(`${serviceUrl}?authenticator=${authenticator}&__appName=${ctx.app.name}`);
  ctx.redirect(`${casUrl}/login?service=${service}`);
  next();
};
