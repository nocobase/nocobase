import { Context, Next } from '@nocobase/actions';
import { OIDCAuth } from '../oidc-auth';

export const redirect = async (ctx: Context, next: Next) => {
  const {
    params: { state },
  } = ctx.action;
  const search = new URLSearchParams(state);
  const authenticator = search.get('name');
  const auth = (await ctx.app.authManager.get(authenticator, ctx)) as OIDCAuth;
  try {
    const { token } = await auth.signIn();
    ctx.redirect(`/signin?authenticator=${authenticator}&token=${token}`);
  } catch (error) {
    ctx.redirect(`/signin?authenticator=${authenticator}&error=${error.message}`);
  }
  await next();
};
