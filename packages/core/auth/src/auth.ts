import { Context } from '@nocobase/actions';
import { Model } from '@nocobase/database';

export type AuthExtend<T extends Auth> = new (options: { [key: string]: any }, ctx: Context) => T;

interface IAuth {
  signIn: () => Promise<any>;
  signOut: () => Promise<any>;
  signUp: () => Promise<any>;
  check: () => Promise<any>;
  getUser: () => Promise<Model>;
}

export abstract class Auth implements IAuth {
  protected options: {
    [key: string]: any;
  };
  protected ctx: Context;

  constructor(options, ctx) {
    this.options = options;
    this.ctx = ctx;
  }

  abstract signIn();
  abstract check();
  abstract getUser();

  signOut: () => Promise<any>;
  signUp: () => Promise<any>;
}
