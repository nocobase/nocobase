import { Context } from '@nocobase/actions';
import { SAML, SamlConfig } from '@node-saml/node-saml';
import { SAMLProvider } from '../shared/types';

export const saml = async (ctx: Context, next) => {
  const {
    params: {
      values: { clientId, samlResponse },
    },
  } = ctx.action;

  const providerRepo = ctx.db.getRepository('samlProviders');
  const record: SAMLProvider = await providerRepo.findOne({
    filter: {
      clientId: clientId,
    },
  });

  const options: SamlConfig = {
    issuer: record.issuer,
    cert: record.certificate,
    audience: record.spEntityId,
  };

  const saml = new SAML(options);

  const { profile } = await saml.validatePostResponseAsync(samlResponse);

  const usersRepo = ctx.db.getRepository('users');

  const { nameID, nickname, email } = profile as Record<string, string>;

  const name = nickname ?? nameID;

  let user = await usersRepo.findOne({
    filter: {
      nickname: name,
      email: email ?? null,
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
