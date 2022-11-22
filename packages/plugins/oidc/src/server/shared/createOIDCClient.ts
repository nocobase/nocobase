import { Issuer } from 'openid-client';
import { IDTOKEN_SIGN_ALG, OIDCProvider } from './types';

export const createOIDCClient = async (provider: OIDCProvider) => {
  const issuer = await Issuer.discover(provider.issuer);
  return new issuer.Client({
    client_id: provider.clientId,
    client_secret: provider.clientSecret,
    response_types: ['code'],
    id_token_signed_response_alg: provider.idTokenSignAlg,
  });
};
