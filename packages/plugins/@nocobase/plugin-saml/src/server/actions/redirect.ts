import { Context, Next } from '@nocobase/actions';
import { AppSupervisor } from '@nocobase/server';
import { SAMLAuth } from '../saml-auth';

export const redirect = async (ctx: Context, next: Next) => {
  const { authenticator, __appName: appName } = ctx.action.params || {};
  const { RelayState: redirect } = ctx.action.params.values || {};
  let prefix = process.env.APP_PUBLIC_PATH || '';
  if (appName && appName !== 'main') {
    const appSupervisor = AppSupervisor.getInstance();
    if (appSupervisor?.runningMode !== 'single') {
      prefix += `/apps/${appName}`;
    }
  }
  const auth = (await ctx.app.authManager.get(authenticator, ctx)) as SAMLAuth;
  if (prefix.endsWith('/')) {
    prefix = prefix.slice(0, -1);
  }
  try {
    const { token } = await auth.signIn();
    ctx.redirect(`${prefix}${redirect || '/admin'}?authenticator=${authenticator}&token=${token}`);
  } catch (error) {
    ctx.redirect(`${prefix}/signin?authenticator=${authenticator}&error=${error.message}&redirect=${redirect}`);
  }
  await next();
};
