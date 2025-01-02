/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Context } from '@nocobase/actions';
import { Model } from '@nocobase/database';
import { Authenticator } from './auth-manager';
export type AuthConfig = {
  authenticator: Authenticator;
  options: {
    [key: string]: any;
  };
  ctx: Context;
};

export type AuthErrorType =
  | 'EMPTY_TOKEN'
  | 'EXPIRED_TOKEN'
  | 'INVALID_TOKEN'
  | 'RENEWED_SESSION'
  | 'MISSING_SESSION'
  | 'INACTIVE_SESSION'
  | 'BLOCKED_TOKEN'
  | 'BLOCKED_SESSION'
  | 'EXPIRED_SESSION';

export type AuthExtend<T extends Auth> = new (config: AuthConfig) => T;

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
  protected authenticator: Authenticator;
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

  async skipCheck() {
    if (!this.ctx.app.acl) {
      return true;
    }
    const { resourceName, actionName } = this.ctx.action;
    const acl = this.ctx.dataSource.acl;
    const isPublic = await acl.allowManager.isAllowed(resourceName, actionName, this.ctx);
    return isPublic;
  }

  // The abstract methods are required to be implemented by all authentications.
  abstract check(): Promise<Model>;
  // The following methods are mainly designed for user authentications.

  async signIn(): Promise<any> {}
  async signUp(): Promise<any> {}
  async signOut(): Promise<any> {}
}
