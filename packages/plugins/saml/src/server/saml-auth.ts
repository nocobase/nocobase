import { AuthConfig, BaseAuth } from '@nocobase/auth';
import { SAML, SamlConfig } from '@node-saml/node-saml';

interface SAMLOptions {
  ssoUrl?: string;
  certificate?: string;
  idpIssuer?: string;
}

export class SAMLAuth extends BaseAuth {
  constructor(config: AuthConfig) {
    const { ctx } = config;
    super({
      ...config,
      userCollection: ctx.db.getCollection('users'),
    });
  }

  getOptions() {
    const { ssoUrl, certificate, idpIssuer }: SAMLOptions = this.options?.saml || {};
    return {
      entryPoint: ssoUrl,
      issuer: this.authenticator.get('name'),
      cert: certificate,
      wantAuthnResponseSigned: false,
      idpIssuer,
    } as SamlConfig;
  }

  async validate() {
    const ctx = this.ctx;
    const {
      params: {
        values: { samlResponse },
      },
    } = ctx.action;
    const saml = new SAML(this.getOptions());

    const { profile } = await saml.validatePostResponseAsync(samlResponse);

    const { nameID, nickname, username, email, firstName, lastName, phone } = profile as Record<string, string>;

    const name = nickname ?? username ?? `${firstName} ${lastName}` ?? nameID;

    return await this.authenticator.findOrCreateUser(nameID, {
      nickname: name,
      email: email ?? null,
      phone: phone ?? null,
    });
  }
}
