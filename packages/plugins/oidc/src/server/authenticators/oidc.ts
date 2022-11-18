import { Context } from '@nocobase/actions';
import { Issuer } from 'openid-client';
import { createOIDCClient } from '../shared/createOIDCClient';

export const oidc = async (ctx: Context, next) => {
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

  const tokens = await client.callback(
    provider.redirectUrl,
    {
      code: values.code,
    },
    {
      nonce: provider.clientId,
    },
  );

  const userinfo = await client.userinfo(tokens.access_token);
  const usersRepo = ctx.db.getRepository('users');

  const name = userinfo.preferred_username || userinfo.nickname || userinfo.name;

  let user = await usersRepo.findOne({
    filter: {
      'nickname.$eq': name,
      'email.$eq': userinfo.email ?? null,
    },
  });

  if (!user) {
    user = await usersRepo.create({
      values: {
        nickname: name,
      },
    });
  }

  ctx.state.currentUser = user;

  return next();
};
