import { AuthConfig, BaseAuth } from '@nocobase/auth';

export class ApiKeysAuth extends BaseAuth {
  constructor(config: Partial<AuthConfig>) {
    const { ctx } = config;
    super({
      ...config,
      userCollection: ctx.db.getCollection('users'),
    } as any);
  }

  async validate() {
    return this.user;
  }
}
