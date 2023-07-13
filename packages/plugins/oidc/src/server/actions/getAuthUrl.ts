import { Context, Next } from '@nocobase/actions';
import { OIDCAuth } from '../oidc-auth';
import { nanoid } from 'nanoid';
import { cookieName } from '../../constants';

export const getAuthUrl = async (ctx: Context, next: Next) => {
  const auth = ctx.auth as OIDCAuth;
  const client = await auth.createOIDCClient();
  const { scope } = auth.getOptions();
  const token = nanoid(15);
  ctx.cookies.set(cookieName, token, {
    httpOnly: true,
    domain: ctx.hostname,
  });
  ctx.body = client.authorizationUrl({
    response_type: 'code',
    scope: scope || 'openid email profile',
    redirect_uri: auth.getRedirectUri(),
    state: `token=${token}&name=${ctx.headers['x-authenticator']}`,
  });

  return next();
};
