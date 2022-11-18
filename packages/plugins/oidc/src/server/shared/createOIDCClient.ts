import { Issuer } from 'openid-client';

export const createOIDCClient = (issuer: Issuer, clientId: string, clientSecret: string) => {
  return new issuer.Client({
    client_id: clientId,
    client_secret: clientSecret,
    response_types: ['code'],
  });
};
