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
    this.app.resourcer.use(this.middleware, { tag: 'authCheck' });
    this.app.resource({
      name: 'auth',
      actions,
    });
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
   * @param {Auth} auth - The authentication class.
   */
  registerTypes(authType: string, auth: AuthExtend<Auth>) {
    this.authTypes.register(authType, auth);
  }

  listTypes() {
    return this.authTypes.getKeys();
  }

  /**
   * get
   * @description Get authenticator instance by name.
   * @param {string} name - The name of the authenticator.
   * @return {Promise<Auth>} authenticator instance.
   */
  async get(name: string, ctx: Context) {
    const authenticator = await this.storer.get(name);
    if (!authenticator) {
      throw new Error(`Authenticator [${name}] is not found.`);
    }
    const auth = this.authTypes.get(authenticator.authType);
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
      try {
        ctx.auth = await ctx.app.authManager.get(name, ctx);
        const user = await ctx.auth.check();
        if (user) {
          ctx.auth.user = user;
        }
        ctx.app.logger.info(`authCheck, name: ${name}, ${user ? user.id : 'anonymous'}`);
      } catch (err) {
        ctx.throw(500, err.message);
      }

      return next();
    };
  }
}
