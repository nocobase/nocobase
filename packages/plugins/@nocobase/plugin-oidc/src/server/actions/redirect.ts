import { Context, Next } from '@nocobase/actions';
import { OIDCAuth } from '../oidc-auth';
import { AppSupervisor } from '@nocobase/server';

export const redirect = async (ctx: Context, next: Next) => {
  const {
    params: { state },
  } = ctx.action;
  const search = new URLSearchParams(decodeURIComponent(state));
  const authenticator = search.get('name');
  const appName = search.get('app');
  let prefix = '';
  if (appName && appName !== 'main') {
    const appSupervisor = AppSupervisor.getInstance();
    if (appSupervisor?.runningMode !== 'single') {
      prefix = `/apps/${appName}`;
    }
  }
  const auth = (await ctx.app.authManager.get(authenticator, ctx)) as OIDCAuth;
  try {
    const { token } = await auth.signIn();
    ctx.redirect(`${prefix}/admin?authenticator=${authenticator}&token=${token}`);
  } catch (error) {
    ctx.logger.error('OIDC auth error', { error });
    ctx.redirect(`${prefix}/signin?authenticator=${authenticator}&error=${error.message}`);
  }
  await next();
};
