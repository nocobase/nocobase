import { Context } from '@nocobase/actions';
import { Model } from '@nocobase/database';

export type AuthExtend<T extends Auth> = new (options: { [key: string]: any }, ctx: Context) => T;

interface IAuth {
  // Check the authenticaiton status and return the current identity.
  check: () => Promise<Model>;
  // Get the current identity of request.
  getIdentity: () => Promise<Model>;

  signIn: () => Promise<any>;
  signUp: () => Promise<any>;
  signOut: () => Promise<any>;
}

export abstract class Auth implements IAuth {
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
  abstract getIdentity();
  // The following methods are mainly designed for user authentications.
  signIn: () => Promise<any>;
  signOut: () => Promise<any>;
  signUp: () => Promise<any>;
}
