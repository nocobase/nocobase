import { Context } from '@nocobase/actions';
import { createOIDCClient } from '../shared/createOIDCClient';
import { OIDCProvider } from '../shared/types';

export const oidc = async (ctx: Context, next) => {
  const {
    params: { values },
  } = ctx.action;

  const providerRepo = ctx.db.getRepository('oidcProviders');
  const record = await providerRepo.findOne({
    filter: {
      clientId: values.clientId,
    },
  });
  const provider: OIDCProvider = record.toJSON();
  const client = await createOIDCClient(provider);

  const tokens = await client.callback(
    provider.redirectUrl,
    {
      code: values.code,
    },
    {
      nonce: ctx.OIDC_NONCE,
    },
  );

  const userinfo = await client.userinfo(tokens.access_token);
  const usersRepo = ctx.db.getRepository('users');

  const name = userinfo.preferred_username || userinfo.nickname || userinfo.name;

  let user = await usersRepo.findOne({
    filter: {
      nickname: name,
      email: userinfo.email ?? null,
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
