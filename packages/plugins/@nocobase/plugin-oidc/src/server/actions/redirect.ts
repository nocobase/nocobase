import { Context, Next } from '@nocobase/actions';
import { AppSupervisor } from '@nocobase/server';
import { OIDCAuth } from '../oidc-auth';

export const redirect = async (ctx: Context, next: Next) => {
  const {
    params: { state },
  } = ctx.action;
  const search = new URLSearchParams(decodeURIComponent(state));
  const authenticator = search.get('name');
  const appName = search.get('app');
  const redirect = search.get('redirect') || '/admin';
  let prefix = process.env.APP_PUBLIC_PATH || '';
  if (appName && appName !== 'main') {
    const appSupervisor = AppSupervisor.getInstance();
    if (appSupervisor?.runningMode !== 'single') {
      prefix += `apps/${appName}`;
    }
  }
  const auth = (await ctx.app.authManager.get(authenticator, ctx)) as OIDCAuth;
  if (prefix.endsWith('/')) {
    prefix = prefix.slice(0, -1);
  }
  try {
    const { token } = await auth.signIn();
    ctx.redirect(`${prefix}${redirect}?authenticator=${authenticator}&token=${token}`);
  } catch (error) {
    ctx.logger.error('OIDC auth error', { error });
    ctx.redirect(`${prefix}/signin?redirect=${redirect}&authenticator=${authenticator}&error=${error.message}`);
  }
  await next();
};
