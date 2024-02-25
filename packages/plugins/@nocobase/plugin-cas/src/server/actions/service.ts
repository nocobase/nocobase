import { Context, Next } from '@nocobase/actions';
import { AppSupervisor } from '@nocobase/server';
import { CASAuth } from '../auth';

export const service = async (ctx: Context, next: Next) => {
  const { authenticator, __appName: appName, redirect = '/admin' } = ctx.action.params;

  let prefix = '';
  if (appName && appName !== 'main') {
    const appSupervisor = AppSupervisor.getInstance();
    if (appSupervisor?.runningMode !== 'single') {
      prefix = `/apps/${appName}`;
    }
  }

  const auth = (await ctx.app.authManager.get(authenticator, ctx)) as CASAuth;
  try {
    const { token } = await auth.signIn();
    ctx.redirect(`${prefix}${redirect}?authenticator=${authenticator}&token=${token}`);
  } catch (error) {
    ctx.redirect(`${prefix}/signin?authenticator=${authenticator}&error=${error.message}&redirect=${redirect}`);
  }
  return next();
};
