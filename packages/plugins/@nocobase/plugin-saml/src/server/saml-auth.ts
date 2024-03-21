import { AuthConfig, BaseAuth } from '@nocobase/auth';
import { AuthModel } from '@nocobase/plugin-auth';
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

  getOptions(): SamlConfig {
    const ctx = this.ctx;
    const { ssoUrl, certificate, idpIssuer, http }: SAMLOptions = this.options?.saml || {};
    const name = this.authenticator.get('name');
    const protocol = http ? 'http' : 'https';
    return {
      callbackUrl: `${protocol}://${ctx.host}${process.env.API_BASE_PATH}saml:redirect?authenticator=${name}&__appName=${ctx.app.name}`,
      entryPoint: ssoUrl,
      issuer: name,
      cert: certificate,
      idpIssuer,
      wantAssertionsSigned: false,
    };
  }

  async validate() {
    const ctx = this.ctx;
    const {
      params: { values: samlResponse },
    } = ctx.action;
    const saml = new SAML(this.getOptions());

    const { profile } = await saml.validatePostResponseAsync(samlResponse);
    const { nameID, nickname, firstName, lastName, phone } = profile;
    let { email, username } = profile;
    const isEmail = nameID.match(/^.+@.+\..+$/);
    if (!email && isEmail) {
      email = nameID;
    }
    if (!username && !isEmail) {
      username = nameID;
    }

    const authenticator = this.authenticator as AuthModel;
    let user = await authenticator.findUser(nameID);
    if (user) {
      return user;
    }
    // Bind existed user
    const { userBindField = 'email' } = this.options?.saml || {};
    if (userBindField === 'email' && email) {
      user = await this.userRepository.findOne({
        filter: { email },
      });
    } else if (userBindField === 'username' && username) {
      user = await this.userRepository.findOne({
        filter: { username },
      });
    }
    if (user) {
      await this.authenticator.addUser(user.id, {
        through: {
          uuid: nameID,
        },
      });
      return user;
    }
    // Create new user
    const { autoSignup } = this.options?.public || {};
    if (!autoSignup) {
      throw new Error('User not found');
    }
    if (username && !this.validateUsername(username as string)) {
      throw new Error('Username must be 2-16 characters in length (excluding @.<>"\'/)');
    }
    const fullName = firstName && lastName && `${firstName} ${lastName}`;
    return await authenticator.newUser(nameID, {
      username: username ?? null,
      nickname: nickname || fullName || username || nameID,
      email: email ?? null,
      phone: phone ?? null,
    });
  }
}
