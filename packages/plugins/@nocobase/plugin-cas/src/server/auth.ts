import { AuthConfig, BaseAuth } from '@nocobase/auth';
import { AuthModel } from '@nocobase/plugin-auth';
import axios from 'axios';

export class CASAuth extends BaseAuth {
  constructor(config: AuthConfig) {
    const { ctx } = config;
    super({
      ...config,
      userCollection: ctx.db.getCollection('users'),
    });
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

  async serviceValidate(ticket: string) {
    const { casUrl, serviceUrl } = this.getOptions();
    const url = `${casUrl}/serviceValidate?ticket=${ticket}&service=${serviceUrl}`;
    try {
      const res = await axios.get(url);
      return res;
    } catch (error) {
      throw new Error('CSA serviceValidate error: ' + error.message);
    }
  }

  async validate() {
    const ctx = this.ctx;
    const { autoSignup } = this.getOptions();
    const { ticket } = ctx.action.params;
    if (!ticket) {
      throw new Error('Missing ticket');
    }
    const res = await this.serviceValidate(ticket);
    const pattern = /<(?:cas|sso):user>(.*?)<\/(?:cas|sso):user>/;
    const username = res?.data.match(pattern)?.[1];
    if (!username) {
      throw new Error('Invalid ticket');
    }
    const authenticator = this.authenticator as AuthModel;
    let user = await authenticator.findUser(username);
    if (user) {
      return user;
    }
    // Bind existed user
    user = await this.userRepository.findOne({
      filter: { username },
    });
    if (user) {
      await this.authenticator.addUser(user, {
        through: {
          uuid: username,
        },
      });
      return user;
    }
    // New data
    if (!autoSignup) {
      throw new Error('User not found');
    }
    if (!this.validateUsername(username as string)) {
      throw new Error('Username must be 2-16 characters in length (excluding @.<>"\'/)');
    }
    return await authenticator.newUser(username, {
      username: username,
      nickname: username,
    });
  }
}
