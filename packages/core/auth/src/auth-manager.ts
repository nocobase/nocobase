import { Registry } from '@nocobase/utils';
import { AuthExtend, Auth } from './auth';
import { Application } from '@nocobase/server';
import { Model } from '@nocobase/database';
import { Context, Next } from '@nocobase/actions';
import actions from './actions';

type Storer = {
  get: (name: string) => Promise<Model>;
};

type AuthManagerOptions = {
  authKey: string;
};

export class AuthManager {
  protected app: Application;
  protected options: AuthManagerOptions;
  protected authTypes: Registry<AuthExtend<Auth>> = new Registry();
  // authenticators collection manager.
  protected storer: Storer;

  constructor(app, options: AuthManagerOptions) {
    this.app = app;
    this.options = options;

    this.app.resourcer.registerActions(actions);
  }

  setStorer(storer: Storer) {
    this.storer = storer;
  }

  /**
   * registerTypes
   * Add a new authenticate type and the corresponding authenticator.
   * The types will show in the authenticators list of the admin panel.
   *
   * @param {string} authType - The type of the authenticator. It is required to be unique.
   * @param {Auth} auth - The authentication class.
   */
  registerTypes(authType: string, auth: AuthExtend<Auth>) {
    this.authTypes.register(authType, auth);
  }

  /**
   * get
   * Get authenticator instance by name.
   *
   * @param {string} name - The name of the authenticator.
   * @return {Promise<Auth>} authenticator instance.
   */
  async get(name: string, ctx: Context) {
    const authenticator = await this.storer.get(name);
    const auth = this.authTypes.get(name);
    return new auth(authenticator.options, ctx);
  }

  /**
   * middleware
   * Auth middleware, used to check the authentication status.
   */
  middleware() {
    return async (ctx: Context, next: Next) => {
      const name = ctx.get(this.options.authKey);
      ctx.auth = await ctx.app.authManager.get(name, ctx);
      if (!(await ctx.auth.check(ctx))) {
        ctx.throw(401, 'Unauthorized');
      }
      await next();
    };
  }
}
