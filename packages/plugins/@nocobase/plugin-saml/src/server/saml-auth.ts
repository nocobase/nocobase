import { AuthConfig, BaseAuth } from '@nocobase/auth';
import { SAML, SamlConfig } from '@node-saml/node-saml';

interface SAMLOptions {
  ssoUrl?: string;
  certificate?: string;
  idpIssuer?: string;
  http?: boolean;
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
    const ctx = this.ctx;
    const { ssoUrl, certificate, idpIssuer, http }: SAMLOptions = this.options?.saml || {};
    const name = this.authenticator.get('name');
    const protocol = http ? 'http' : 'https';
    return {
      callbackUrl: `${protocol}://${ctx.host}/api/saml:redirect?authenticator=${name}`,
      entryPoint: ssoUrl,
      issuer: name,
      cert: certificate,
      idpIssuer,
      wantAssertionsSigned: false,
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

    const fullName = firstName && lastName && `${firstName} ${lastName}`;
    const name = nickname ?? username ?? fullName ?? nameID;

    // Compatible processing
    // When email is provided or nameID is email, use email to find user
    // If found, associate the user with the current authenticator
    if (email || nameID.match(/^.+@.+\..+$/)) {
      const user = await this.userRepository.findOne({
        filter: { email: email || nameID },
      });
      if (user) {
        await this.authenticator.addUser(user, {
          through: {
            uuid: nameID,
          },
        });
        return user;
      }
    }

    return await this.authenticator.findOrCreateUser(nameID, {
      nickname: name,
      email: email ?? null,
      phone: phone ?? null,
    });
  }
}
