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

export interface IVerification {
  verify(options: {
    resource: string;
    action: string;
    userId: number;
    boundInfo: any;
    verifyParams?: any;
  }): Promise<any>;
  onActionComplete?(options: { userId: number; verifyResult: any }): Promise<any>;
  getBoundInfo?(userId: number): Promise<any>;
  getPublicBoundInfo?(userId: number): Promise<{
    bound: boolean;
    publicInfo?: any;
  }>;
  validateBoundInfo?(boundInfo: string): Promise<boolean>;
  bind?(
    userId: number,
    resource?: string,
    action?: string,
  ): Promise<{
    uuid: string;
    meta?: any;
  }>;
}

export abstract class Verification implements IVerification {
  verifier: Model;
  protected ctx: Context;
  protected options: Record<string, any>;
  constructor({ ctx, verifier, options }) {
    this.ctx = ctx;
    this.verifier = verifier;
    this.options = options;
  }

  get throughRepo() {
    return this.ctx.db.getRepository('usersVerifiers');
  }

  abstract verify({ resource, action, userId, boundInfo, verifyParams }): Promise<any>;
  async onActionComplete(options: { userId: number; verifyResult: any }): Promise<any> {}
  async bind(userId: number, resource?: string, action?: string): Promise<{ uuid: string; meta?: any }> {
    throw new Error('Not implemented');
  }

  async getBoundInfo(userId: number): Promise<any> {
    return this.throughRepo.findOne({
      filter: {
        verifier: this.verifier.name,
        userId,
      },
    });
  }

  async getPublicBoundInfo(userId: number): Promise<{
    bound: boolean;
    publicInfo?: any;
  }> {
    const boundInfo = await this.getBoundInfo(userId);
    return {
      bound: boundInfo ? true : false,
    };
  }

  async validateBoundInfo(boundInfo: any): Promise<boolean> {
    return true;
  }
}

export type VerificationExtend<T extends Verification> = new ({ ctx, verifier, options }) => T;
