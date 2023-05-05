import { Registry } from '@nocobase/utils';
import { AuthExtend, Auth } from './auth';
import { Model } from '@nocobase/database';
import { Context, Next } from '@nocobase/actions';
import actions from './actions';

type Storer = {
  get: (name: string) => Promise<Model>;
};

type AuthManagerOptions = {
  authKey: string;
};

type AuthConfig = {
  auth: AuthExtend<Auth>; // The authentication class.
};

export class AuthManager {
  protected options: AuthManagerOptions;
  protected authTypes: Registry<AuthConfig> = new Registry();
  // authenticators collection manager.
  protected storer: Storer;

  constructor(options: AuthManagerOptions) {
    this.options = options;
  }

  setStorer(storer: Storer) {
    this.storer = storer;
  }

  /**
   * registerTypes
   * @description Add a new authenticate type and the corresponding authenticator.
   * The types will show in the authenticators list of the admin panel.
   *
   * @param {string} authType - The type of the authenticator. It is required to be unique.
   * @param {AuthConfig} authConfig - Configurations of the kind of authenticator.
   */
  registerTypes(authType: string, authConfig: AuthConfig) {
    this.authTypes.register(authType, authConfig);
  }

  listTypes() {
    return Array.from(this.authTypes.getKeys());
  }

  getAuthConfig(authType: string) {
    return this.authTypes.get(authType);
  }

  /**
   * get
   * @description Get authenticator instance by name.
   * @param {string} name - The name of the authenticator.
   * @return {Promise<Auth>} authenticator instance.
   */
  async get(name: string, ctx: Context) {
    if (!this.storer) {
      throw new Error('AuthManager.storer is not set.');
    }
    const authenticator = await this.storer.get(name);
    if (!authenticator) {
      throw new Error(`Authenticator [${name}] is not found.`);
    }
    const { auth } = this.authTypes.get(authenticator.authType);
    if (!auth) {
      throw new Error(`AuthType [${name}] is not found.`);
    }
    return new auth(authenticator.options, ctx);
  }

  /**
   * middleware
   * @description Auth middleware, used to check the authentication status.
   */
  middleware() {
    return async (ctx: Context & { auth: Auth }, next: Next) => {
      const name = ctx.get(this.options.authKey);
      let authenticator: Auth;
      try {
        authenticator = await ctx.app.authManager.get(name, ctx);
        ctx.auth = authenticator;
      } catch (err) {
        ctx.auth = {} as Auth;
        ctx.app.logger.error(`authCheck, ${err.message}`);
        return next();
      }
      if (authenticator) {
        const user = await ctx.auth.check();
        if (user) {
          ctx.auth.user = user;
        }
      }
      await next();
    };
  }
}
