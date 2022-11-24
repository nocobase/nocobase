import { Context } from '@nocobase/actions';
import { SAML, SamlConfig } from '@node-saml/node-saml';

export const getAuthUrl = async (ctx: Context, next) => {
  const {
    params: { values },
  } = ctx.action;
  const providerRepo = ctx.db.getRepository('samlProviders');
  const record = await providerRepo.findOne({
    filter: {
      'clientId.$eq': values.clientId,
    },
  });

  const options: SamlConfig = {
    entryPoint: record.loginUrl,
    issuer: record.issuer,
    cert: record.certificate,
  };

  const saml = new SAML(options);

  ctx.body = await saml.getAuthorizeUrlAsync('', '', {});

  return next();
};
