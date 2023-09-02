import { AuthConfig, BaseAuth } from '@nocobase/auth';
import { Model } from '@nocobase/database';
import { AuthModel } from '@nocobase/plugin-auth';
import axios from 'axios';
import { COOKIE_KEY_AUTHENTICATOR, COOKIE_KEY_TICKET } from '../constants';

export class CASAuth extends BaseAuth {
  constructor(config: AuthConfig) {
    const { ctx } = config;
    super({
      ...config,
      userCollection: ctx.db.getCollection('users'),
    });
  }

  async signOut() {
    const ctx = this.ctx;
    ctx.cookies.set(COOKIE_KEY_TICKET, '');
    ctx.cookies.set(COOKIE_KEY_AUTHENTICATOR, '');
    await super.signOut();
  }

  getOptions() {
    const opts = this.options || {};
    return {
      ...opts,
      serviceUrl: `${opts.serviceDomain}/api/cas:service`,
    } as {
      casUrl?: string;
      serviceUrl?: string;
      autoSignup?: boolean;
    };
  }

  serviceValidate(ticket) {
    const { casUrl, serviceUrl } = this.getOptions();
    const url = `${casUrl}/serviceValidate?ticket=${ticket}&service=${serviceUrl}`;
    return axios.get(url).catch((err) => {
      throw new Error('CSA serviceValidate error: ' + err.message);
    });
  }

  async validate() {
    const ctx = this.ctx;
    let user: Model;
    const { autoSignup } = this.getOptions();
    const ticket = ctx.cookies.get(COOKIE_KEY_TICKET);
    const res = ticket ? await this.serviceValidate(ticket) : null;
    const pattern = /<(?:cas|sso):user>(.*?)<\/(?:cas|sso):user>/;
    const nickname = res?.data.match(pattern)?.[1];
    if (nickname) {
      const userRepo = this.userCollection.repository;
      user = await userRepo.findOne({
        filter: { nickname },
      });
      if (user) {
        await this.authenticator.addUser(user, {
          through: {
            uuid: nickname,
          },
        });
        return user;
      }
    }
    // New data
    const authenticator = this.authenticator as AuthModel;
    if (autoSignup) {
      user = await authenticator.findOrCreateUser(nickname, {
        nickname: nickname,
      });
      return user;
    }
    return user;
  }
}
