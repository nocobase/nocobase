import { Context, Next } from '@nocobase/actions';
import { SAMLAuth } from '../saml-auth';

export const redirect = async (ctx: Context, next: Next) => {
  const { authenticator } = ctx.action.params || {};
  const auth = (await ctx.app.authManager.get(authenticator, ctx)) as SAMLAuth;
  try {
    const { token } = await auth.signIn();
    ctx.redirect(`/signin?authenticator=${authenticator}&token=${token}`);
  } catch (error) {
    ctx.redirect(`/signin?authenticator=${authenticator}&error=${error.message}`);
  }
  await next();
};
