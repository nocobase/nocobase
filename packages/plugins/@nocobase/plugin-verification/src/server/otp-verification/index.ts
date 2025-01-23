/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Verification } from '../verification';
import { CODE_STATUS_UNUSED, CODE_STATUS_USED } from '../constants';
import pkg from '../../../package.json';

export class OTPVerification extends Verification {
  expiresIn = 120;

  async verify({ resource, action, boundInfo, verifyParams }): Promise<any> {
    const { uuid: receiver } = boundInfo;
    const code = verifyParams.code;
    if (!code) {
      return this.ctx.throw(400, 'Verification code is invalid');
    }
    const VerificationRepo = this.ctx.db.getRepository('otpRecords');
    const item = await VerificationRepo.findOne({
      filter: {
        receiver,
        action: `${resource}:${action}`,
        code,
        expiresAt: {
          $dateAfter: new Date(),
        },
        status: CODE_STATUS_UNUSED,
        verificatorName: this.verificator.name,
      },
    });

    if (!item) {
      return this.ctx.throw(400, {
        code: 'InvalidVerificationCode',
        message: this.ctx.t('Verification code is invalid', { ns: pkg.name }),
      });
    }

    return { codeInfo: item };
  }

  async bind(userId: number, resource?: string, action?: string): Promise<{ uuid: string; meta?: any }> {
    const { uuid, code } = this.ctx.action.params.values || {};
    await this.verify({
      resource: resource || 'verificators',
      action: action || 'bind',
      boundInfo: { uuid },
      verifyParams: { code },
    });
    return { uuid };
  }

  async onActionComplete({ verifyResult }) {
    const { codeInfo } = verifyResult;
    await codeInfo.update({
      status: CODE_STATUS_USED,
    });
  }
}
