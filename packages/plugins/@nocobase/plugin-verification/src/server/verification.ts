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
  verify(options: { resource: string; action: string; boundInfo: any; verifyParams?: any }): Promise<any>;
  onActionComplete?(options: { verifyResult: any }): Promise<any>;
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
  verificator: Model;
  protected ctx: Context;
  protected options: Record<string, any>;
  constructor({ ctx, verificator, options }) {
    this.ctx = ctx;
    this.verificator = verificator;
    this.options = options;
  }

  get throughRepo() {
    return this.ctx.db.getRepository('usersVerificators');
  }

  abstract verify({ resource, action, boundInfo, verifyParams }): Promise<any>;
  async onActionComplete(options: { verifyResult: any }): Promise<any> {}
  async bind(userId: number, resource?: string, action?: string): Promise<{ uuid: string; meta?: any }> {
    throw new Error('Not implemented');
  }

  async getBoundInfo(userId: number): Promise<any> {
    return this.throughRepo.findOne({
      filter: {
        verificator: this.verificator.name,
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

export type VerificationExtend<T extends Verification> = new ({ ctx, verificator, options }) => T;
