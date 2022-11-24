import { Context } from '@nocobase/actions';
import { SAML, SamlConfig } from '@node-saml/node-saml';

export const saml = async (ctx: Context, next) => {
  const {
    params: {
      values: { clientId, samlResponse },
    },
  } = ctx.action;

  const providerRepo = ctx.db.getRepository('samlProviders');
  const record = await providerRepo.findOne({
    filter: {
      'clientId.$eq': clientId,
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

  const { nameID, email } = profile;

  let user = await usersRepo.findOne({
    filter: {
      'nickname.$eq': nameID,
      'email.$eq': email ?? null,
    },
  });

  if (!user) {
    user = await usersRepo.create({
      values: {
        nickname: nameID,
      },
    });
  }

  ctx.state.currentUser = user;

  return next();
};
