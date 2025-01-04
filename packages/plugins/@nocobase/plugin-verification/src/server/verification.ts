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
  afterVerify(options: { verifyResult: any }): Promise<any>;
}

export abstract class Verification implements IVerification {
  protected ctx: Context;
  constructor({ ctx }) {
    this.ctx = ctx;
  }
  abstract verify({ resource, action, userInfo, verifyParams }): Promise<any>;
  abstract afterVerify({ verifyResult }): Promise<any>;
}

export type VerificationExtend<T extends Verification> = new ({ ctx }) => T;
