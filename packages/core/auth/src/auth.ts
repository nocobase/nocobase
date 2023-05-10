import { Context } from '@nocobase/actions';
import { Model } from '@nocobase/database';

export type AuthExtend<T extends Auth> = new (config: {
  options: {
    [key: string]: any;
  };
  ctx: Context;
}) => T;

interface IAuth {
  user: Model;
  // Check the authenticaiton status and return the current user.
  check(): Promise<Model>;
  signIn(): Promise<any>;
  signUp(): Promise<any>;
  signOut(): Promise<any>;
}

export abstract class Auth implements IAuth {
  abstract user: Model;
  protected options: {
    [key: string]: any;
  };
  protected ctx: Context;

  constructor(config: { options: { [key: string]: any }; ctx: Context }) {
    this.options = config.options;
    this.ctx = config.ctx;
  }

  // The abstract methods are required to be implemented by all authentications.
  abstract check();
  // The following methods are mainly designed for user authentications.
  async signIn(): Promise<any> {}
  async signUp(): Promise<any> {}
  async signOut(): Promise<any> {}
}
