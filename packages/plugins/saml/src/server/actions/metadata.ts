import { Context } from '@nocobase/actions';
import { getSaml } from '../shared/getSaml';

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

  const saml = getSaml(record);

  ctx.type = 'text/xml';
  ctx.body = saml.generateServiceProviderMetadata(record.certificate);
  ctx.withoutDataWrapping = true;

  return next();
};
