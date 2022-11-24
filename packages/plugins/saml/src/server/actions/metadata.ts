import { Context } from '@nocobase/actions';
import { SAML, SamlConfig } from '@node-saml/node-saml/lib';

export const metadata = async (ctx: Context, next) => {
  const {
    params: { clientId },
  } = ctx.action;
  const providerRepo = ctx.db.getRepository('samlProviders');
  const record = await providerRepo.findOne({
    filter: {
      'clientId.$eq': clientId,
    },
  });

  const options: SamlConfig = {
    entryPoint: record.loginUrl,
    issuer: record.issuer,
    cert: record.certificate,
  };

  const saml = new SAML(options);

  ctx.type = 'text/xml';
  ctx.body = saml.generateServiceProviderMetadata(record.certificate);
  ctx.withoutDataWrapping = true;

  return next();
};
