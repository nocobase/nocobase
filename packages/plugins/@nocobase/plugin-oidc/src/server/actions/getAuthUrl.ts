import { Context, Next } from '@nocobase/actions';
import { OIDCAuth } from '../oidc-auth';
import { nanoid } from 'nanoid';
import { cookieName } from '../../constants';

export const getAuthUrl = async (ctx: Context, next: Next) => {
  const { redirect = '' } = ctx.action.params.values || {};
  const app = ctx.app.name;
  const auth = ctx.auth as OIDCAuth;
  const client = await auth.createOIDCClient();
  const { scope, stateToken } = auth.getOptions();
  const token = stateToken || nanoid(15);
  ctx.cookies.set(cookieName, token, {
    httpOnly: true,
    domain: ctx.hostname,
  });
  ctx.body = client.authorizationUrl({
    response_type: 'code',
    scope: scope || 'openid email profile',
    redirect_uri: `${auth.getRedirectUri()}`,
    state: encodeURIComponent(`token=${token}&name=${ctx.headers['x-authenticator']}&app=${app}&redirect=${redirect}`),
  });

  return next();
};
