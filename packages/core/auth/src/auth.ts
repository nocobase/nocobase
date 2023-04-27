import { Context } from '@nocobase/actions';
import { Model } from '@nocobase/database';

export type AuthExtend<T extends Auth> = new (options: { [key: string]: any }, ctx: Context) => T;

interface IAuth {
  user: Model;
  // Check the authenticaiton status and return the current user.
  check(): Promise<Model>;
  signIn(): Promise<{
    user: Model;
    token: string;
  }>;
  signUp(): Promise<any>;
  signOut(): Promise<any>;
}

export abstract class Auth implements IAuth {
  abstract user: Model;
  protected options: {
    [key: string]: any;
  };
  protected ctx: Context;

  constructor(options: { [key: string]: any }, ctx: Context) {
    this.options = options;
    this.ctx = ctx;
  }

  // The abstract methods are required to be implemented by all authentications.
  abstract check();
  // The following methods are mainly designed for user authentications.
  async signIn() {
    return { user: null, token: '' };
  }
  async signUp() {}
  async signOut() {}
}
