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

  getOptions(): {
    casUrl?: string;
    serviceUrl?: string;
    autoSignup?: boolean;
  } {
    const opts = this.options || {};
    return {
      ...opts,
      serviceUrl: `${opts.serviceDomain}${process.env.API_BASE_PATH}cas:service`,
    };
  }

  getService(authenticator: string, appName: string, redirect: string) {
    const { serviceUrl } = this.getOptions();
    return encodeURIComponent(`${serviceUrl}?authenticator=${authenticator}&__appName=${appName}&redirect=${redirect}`);
  }

  async serviceValidate(ticket: string) {
    const { casUrl } = this.getOptions();
    const { authenticator, __appName: appName, redirect = '/admin' } = this.ctx.action.params;
    const service = this.getService(authenticator, appName, redirect);
    const url = `${casUrl}/serviceValidate?ticket=${ticket}&service=${service}`;
    this.ctx.logger.debug(`serviceValidate url: ${url}`, {
      module: 'auth',
      submodule: 'cas',
      method: 'serviceValidate',
    });
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
    ctx.logger.debug(res?.data, { module: 'auth', submodule: 'cas', method: 'validate' });
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
