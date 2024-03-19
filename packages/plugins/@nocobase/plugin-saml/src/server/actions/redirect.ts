import { Context, Next } from '@nocobase/actions';
import { AppSupervisor } from '@nocobase/server';
import { SAMLAuth } from '../saml-auth';

export const redirect = async (ctx: Context, next: Next) => {
  const { authenticator, __appName: appName } = ctx.action.params || {};
  const { RelayState: redirect = '/admin' } = ctx.action.params.values || {};
  let prefix = '';
  if (appName && appName !== 'main') {
    const appSupervisor = AppSupervisor.getInstance();
    if (appSupervisor?.runningMode !== 'single') {
      prefix = process.env.APP_PUBLIC_PATH + `apps/${appName}`;
    }
  }
  const auth = (await ctx.app.authManager.get(authenticator, ctx)) as SAMLAuth;
  try {
    const { token } = await auth.signIn();
    ctx.redirect(`${prefix}${redirect}?authenticator=${authenticator}&token=${token}`);
  } catch (error) {
    ctx.redirect(`${prefix}/signin?authenticator=${authenticator}&error=${error.message}&redirect=${redirect}`);
  }
  await next();
};
