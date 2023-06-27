import { Context } from '@nocobase/actions';
import { Model } from '@nocobase/database';

export type AuthConfig = {
  authenticator: Model;
  options: {
    [key: string]: any;
  };
  ctx: Context;
};

export type AuthExtend<T extends Auth> = new (config: AuthConfig) => T;

export abstract class Auth {
  abstract user: Model;
  protected authenticator: Model;
  protected options: {
    [key: string]: any;
  };
  protected ctx: Context;

  constructor(config: AuthConfig) {
    const { authenticator, options, ctx } = config;
    this.authenticator = authenticator;
    this.options = options;
    this.ctx = ctx;
  }

  // The abstract methods are required to be implemented by all authentications.
  abstract check(): Promise<Model>;
  // The following methods are mainly designed for user authentications.
  async signIn(): Promise<any> {}
  async signUp(): Promise<any> {}
  async signOut(): Promise<any> {}
}
