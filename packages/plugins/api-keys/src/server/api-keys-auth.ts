import { AuthConfig, BaseAuth } from '@nocobase/auth';

export class ApiKeysAuth extends BaseAuth {
  constructor(config: AuthConfig) {
    const { ctx } = config;
    super({
      ...config,
      userCollection: ctx.db.getCollection('users'),
    });
  }

  async validate() {
    return this.user;
  }
}
