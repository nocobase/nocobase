import type { SamlConfig } from '@node-saml/node-saml';
import { SAML } from '@node-saml/node-saml';
import type { SAMLProvider } from './types';

export const getSaml = (provider: SAMLProvider) => {
  const options: SamlConfig = {
    entryPoint: provider.loginUrl,
    issuer: provider.issuer,
    cert: provider.certificate,
    audience: false,
    wantAuthnResponseSigned: false,
  };

  return new SAML(options);
};
