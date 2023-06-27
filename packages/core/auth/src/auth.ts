import { Context } from '@nocobase/actions';
import { Model } from '@nocobase/database';
import { SignOptions } from 'jsonwebtoken';
import { SignPayload } from './base/jwt-service';

export type AuthConfig = {
  authenticator: Model;
  options: {
    [key: string]: any;
  };
  ctx: Context;
};

export type AuthExtend<T extends Auth> = new (config: AuthConfig) => T;

interface IAuth {
  user: Model;
  // Check the authenticaiton status and return the current user.
  check(): Promise<Model>;
  signIn(payload: SignPayload, options: SignOptions): Promise<any>;
  signUp(): Promise<any>;
  signOut(): Promise<any>;
}

export abstract class Auth implements IAuth {
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
  abstract check();
  // The following methods are mainly designed for user authentications.
  async signIn(): Promise<any> {}
  async signUp(): Promise<any> {}
  async signOut(): Promise<any> {}
}
