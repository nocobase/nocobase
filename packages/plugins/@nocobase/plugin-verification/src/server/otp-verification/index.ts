/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Verification } from '../verification';
import { Op } from '@nocobase/database';
import { CODE_STATUS_UNUSED, CODE_STATUS_USED } from '../constants';
import pkg from '../../../package.json';

export class OTPVerification extends Verification {
  expiresIn = 120;

  async verify({ resource, action, userInfo, verifyParams }): Promise<any> {
    // check if code match, then call next
    // find the code based on action params
    const receiver = await this.getUserVerificationInfo(userInfo);
    const content = verifyParams.code;
    const VerificationRepo = this.ctx.db.getRepository('verifications');
    const item = await VerificationRepo.findOne({
      filter: {
        receiver,
        type: `${resource}:${action}`,
        content,
        expiresAt: {
          [Op.gt]: new Date(),
        },
        status: CODE_STATUS_UNUSED,
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

  async postAction({ verifyResult }) {
    const { codeInfo } = verifyResult;
    await codeInfo.update({
      status: CODE_STATUS_USED,
    });
  }
}
