import { AuthConfig, BaseAuth } from '@nocobase/auth';
import { Issuer } from 'openid-client';
import { cookieName } from '../constants';

export class OIDCAuth extends BaseAuth {
  constructor(config: AuthConfig) {
    const { ctx } = config;
    super({
      ...config,
      userCollection: ctx.db.getCollection('users'),
    });
  }

  getRedirectUri() {
    const ctx = this.ctx;
    return `https://${ctx.host}/api/oidc:redirect`;
  }

  async createOIDCClient() {
    const { issuer, clientId, clientSecret } = this.options?.oidc || {};
    const oidc = await Issuer.discover(issuer);
    return new oidc.Client({
      client_id: clientId,
      client_secret: clientSecret,
    });
  }

  async validate() {
    const ctx = this.ctx;
    const {
      params: { values },
    } = ctx.action;
    const token = ctx.cookies.get(cookieName);
    const search = new URLSearchParams(values.state);
    if (search.get('token') !== token) {
      ctx.app.logger.warn('odic-auth: state mismatch');
      return null;
    }
    const client = await this.createOIDCClient();
    const tokens = await client.callback(this.getRedirectUri(), {
      code: values.code,
    });
    const userInfo = await client.userinfo(tokens.access_token);
    const { nickname, name, sub, email } = userInfo;
    const username = nickname || name || sub;
    // Compatible processing
    // When email is provided, use email to find user
    // If found, associate the user with the current authenticator
    if (email) {
      const userRepo = this.userCollection.repository;
      const user = await userRepo.findOne({
        filter: { email },
      });
      if (user) {
        await this.authenticator.addUser(user, {
          through: {
            uuid: sub,
          },
        });
        return user;
      }
    }

    return await this.authenticator.findOrCreateUser(sub, {
      nickname: username,
      email: email ?? null,
    });
  }
}
