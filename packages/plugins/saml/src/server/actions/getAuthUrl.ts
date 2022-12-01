import { Context } from '@nocobase/actions';
import { getSaml } from '../shared/getSaml';
import { SAMLProvider } from '../shared/types';

export const getAuthUrl = async (ctx: Context, next) => {
  const {
    params: { values },
  } = ctx.action;
  const providerRepo = ctx.db.getRepository('samlProviders');

  const record: SAMLProvider = await providerRepo.findOne({
    filter: {
      clientId: values.clientId,
    },
  });

  const saml = getSaml(record);

  ctx.body = await saml.getAuthorizeUrlAsync('', '', {});

  return next();
};
