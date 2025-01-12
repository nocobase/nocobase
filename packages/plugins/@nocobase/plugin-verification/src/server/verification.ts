/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Context } from '@nocobase/actions';

export interface IVerification {
  verify(options: { resource: string; action: string; userInfo: any; verifyParams?: any }): Promise<any>;
  postAction?(options: { verifyResult: any }): Promise<any>;
  getUserVerificationInfo?(userInfo: Record<string, any>): Promise<any>;
  getUserPublicInfo?(userInfo: Record<string, any>): Promise<any>;
  validateUserInfo?(userInfo: Record<string, any>): Promise<boolean>;
}

export abstract class Verification implements IVerification {
  name: string;
  protected ctx: Context;
  protected options: Record<string, any>;
  constructor({ ctx, name, options }) {
    this.ctx = ctx;
    this.name = name;
    this.options = options;
  }
  abstract verify({ resource, action, userInfo, verifyParams }): Promise<any>;
  async postAction(options: { verifyResult: any }): Promise<any> {}
  async getUserVerificationInfo(userInfo: Record<string, any>): Promise<any> {
    return userInfo;
  }
  async getUserPublicInfo(userInfo: Record<string, any>): Promise<any> {
    return {};
  }
  async validateUserInfo(userInfo: Record<string, any>): Promise<boolean> {
    return true;
  }
}

export type VerificationExtend<T extends Verification> = new ({ ctx, name, options }) => T;
