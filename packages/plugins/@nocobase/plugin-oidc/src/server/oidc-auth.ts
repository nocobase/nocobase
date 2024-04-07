import { AuthConfig, BaseAuth } from '@nocobase/auth';
import { AuthModel } from '@nocobase/plugin-auth';
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
    const { http, port } = this.getOptions();
    const protocol = http ? 'http' : 'https';
    const host = port ? `${ctx.hostname}${port ? `:${port}` : ''}` : ctx.host;
    return `${protocol}://${host}${process.env.API_BASE_PATH}oidc:redirect`;
  }

  getOptions() {
    return this.options?.oidc || {};
  }

  getExchangeBody() {
    const options = this.getOptions();
    const { exchangeBodyKeys } = options;
    if (!exchangeBodyKeys) {
      return {};
    }
    const body = {};
    exchangeBodyKeys
      .filter((item: { enabled: boolean }) => item.enabled)
      .forEach((item: { paramName: string; optionsKey: string }) => {
        const name = item.paramName || item.optionsKey;
        body[name] = options[item.optionsKey];
      });
    return body;
  }

  mapField(userInfo: { [source: string]: any }) {
    const { fieldMap } = this.getOptions();
    if (!fieldMap) {
      return userInfo;
    }
    fieldMap.forEach((item: { source: string; target: string }) => {
      const { source, target } = item;
      if (userInfo[source]) {
        userInfo[target] = userInfo[source];
      }
    });
    return userInfo;
  }

  async createOIDCClient() {
    const { issuer, clientId, clientSecret, idTokenSignedResponseAlg } = this.getOptions();
    const oidc = await Issuer.discover(issuer);
    return new oidc.Client({
      client_id: clientId,
      client_secret: clientSecret,
      id_token_signed_response_alg: idTokenSignedResponseAlg || 'RS256',
    });
  }

  async validate() {
    const ctx = this.ctx;
    const { params: values } = ctx.action;
    const { userInfoMethod = 'GET', accessTokenVia = 'header', stateToken } = this.getOptions();
    const token = stateToken || ctx.cookies.get(cookieName);
    const search = new URLSearchParams(decodeURIComponent(values.state));
    if (search.get('token') !== token) {
      ctx.logger.error('nocobase_oidc state mismatch', { method: 'validate' });
      return null;
    }
    const client = await this.createOIDCClient();
    const tokens = await client.callback(
      this.getRedirectUri(),
      {
        code: values.code,
        iss: values.iss,
      },
      {},
      { exchangeBody: this.getExchangeBody() },
    );
    const userInfo: { [key: string]: any } = await client.userinfo(tokens, {
      method: userInfoMethod,
      via: accessTokenVia !== 'query' ? accessTokenVia : 'header',
      params:
        accessTokenVia === 'query'
          ? {
              access_token: tokens.access_token,
            }
          : {},
    });
    const mappedUserInfo = this.mapField(userInfo);
    const { nickname, username, name, sub, email, phone } = mappedUserInfo;
    const authenticator = this.authenticator as AuthModel;
    let user = await authenticator.findUser(sub);
    if (user) {
      return user;
    }
    // Bind existed user
    const { userBindField = 'email' } = this.getOptions();
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
      await authenticator.addUser(user.id, {
        through: {
          uuid: sub,
        },
      });
      return user;
    }
    // Create new user
    const { autoSignup } = this.options?.public || {};
    if (!autoSignup) {
      throw new Error('User not found');
    }
    if (username && !this.validateUsername(username)) {
      throw new Error('Username must be 2-16 characters in length (excluding @.<>"\'/)');
    }
    return await authenticator.newUser(sub, {
      username: username ?? null,
      nickname: nickname || name || username || sub,
      email: email ?? null,
      phone: phone ?? null,
    });
  }
}
