import { Issuer } from 'openid-client';
import { OIDCProvider } from './types';

export const createOIDCClient = async (provider: OIDCProvider) => {
  const issuer = await Issuer.discover(provider.issuer);
  return new issuer.Client({
    client_id: provider.clientId,
    client_secret: provider.clientSecret,
    response_types: ['code'],
  });
};
