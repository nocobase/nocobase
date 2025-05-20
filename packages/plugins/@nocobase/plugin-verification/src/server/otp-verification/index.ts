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
import PluginVerificationServer from '../Plugin';
import dayjs from 'dayjs';

export class OTPVerification extends Verification {
  expiresIn = 120;
  maxVerifyAttempts = 5;

  async verify({ resource, action, boundInfo, verifyParams }): Promise<any> {
    const { uuid: receiver } = boundInfo;
    const code = verifyParams.code;
    if (!code) {
      return this.ctx.throw(400, 'Verification code is invalid');
    }
    const plugin = this.ctx.app.pm.get('verification') as PluginVerificationServer;
    const counter = plugin.smsOTPCounter;
    const key = `${resource}:${action}:${receiver}`;
    let attempts = 0;
    try {
      attempts = await counter.get(key);
    } catch (e) {
      this.ctx.logger.error(e.message, {
        module: 'verification',
        submodule: 'sms-otp',
        method: 'verify',
        receiver,
        action: `${resource}:${action}`,
      });
      this.ctx.throw(500, 'Internal Server Error');
    }
    if (attempts > this.maxVerifyAttempts) {
      this.ctx.throw(
        429,
        this.ctx.t('Too many failed attempts. Please request a new verification code.', { ns: pkg.name }),
      );
    }

    const repo = this.ctx.db.getRepository('otpRecords');
    const item = await repo.findOne({
      filter: {
        receiver,
        action: `${resource}:${action}`,
        code,
        expiresAt: {
          $dateAfter: new Date(),
        },
        status: CODE_STATUS_UNUSED,
        verifierName: this.verifier.name,
      },
    });

    if (!item) {
      let attempts = 0;
      try {
        let ttl = this.expiresIn * 1000;
        const record = await repo.findOne({
          filter: {
            action: `${resource}:${action}`,
            receiver,
            status: CODE_STATUS_UNUSED,
            expiresAt: {
              $dateAfter: new Date(),
            },
          },
        });
        if (record) {
          ttl = dayjs(record.get('expiresAt')).diff(dayjs());
        }
        attempts = await counter.incr(key, ttl);
      } catch (e) {
        this.ctx.logger.error(e.message, {
          module: 'verification',
          submodule: 'totp-authenticator',
          method: 'verify',
          receiver,
          action: `${resource}:${action}`,
        });
        this.ctx.throw(500, 'Internal Server Error');
      }

      if (attempts > this.maxVerifyAttempts) {
        this.ctx.throw(
          429,
          this.ctx.t('Too many failed attempts. Please request a new verification code', { ns: pkg.name }),
        );
      }

      return this.ctx.throw(400, {
        code: 'InvalidVerificationCode',
        message: this.ctx.t('Verification code is invalid', { ns: pkg.name }),
      });
    }

    await counter.reset(key);
    return { codeInfo: item };
  }

  async bind(userId: number, resource?: string, action?: string): Promise<{ uuid: string; meta?: any }> {
    const { uuid, code } = this.ctx.action.params.values || {};
    await this.verify({
      resource: resource || 'verifiers',
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
