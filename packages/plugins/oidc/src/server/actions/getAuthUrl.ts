import { Context } from '@nocobase/actions';
import { Issuer } from 'openid-client';
import { createOIDCClient } from '../shared/createOIDCClient';

export const getAuthUrl = async (ctx: Context, next) => {
  const {
    params: { values },
  } = ctx.action;
  const providerRepo = ctx.db.getRepository('oidcProviders');
  const record = await providerRepo.findOne({
    filter: {
      'clientId.$eq': values.clientId,
    },
  });
  const provider = record.toJSON();
  const issuer = await Issuer.discover(provider.issuer);
  const client = createOIDCClient(issuer, provider.clientId, provider.clientSecret);

  ctx.body = client.authorizationUrl({
    nonce: provider.clientId,
    scope: 'openid profile',
  });

  return next();
};
