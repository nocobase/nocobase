import { Context, Next } from '@nocobase/actions';
import { SAML } from '@node-saml/node-saml';
import { SAMLAuth } from '../saml-auth';

export const getAuthUrl = async (ctx: Context, next: Next) => {
  const { redirect = '' } = ctx.action.params.values || {};
  const auth = ctx.auth as SAMLAuth;
  const options = auth.getOptions();
  const saml = new SAML(options);

  ctx.body = await saml.getAuthorizeUrlAsync(redirect, '', {});

  return next();
};
