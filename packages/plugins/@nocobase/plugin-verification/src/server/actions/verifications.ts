/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import actions, { Context, Next } from '@nocobase/actions';
import { Op } from '@nocobase/database';
import dayjs from 'dayjs';
import { randomInt, randomUUID } from 'crypto';
import { promisify } from 'util';
import Plugin, { namespace } from '..';
import { CODE_STATUS_UNUSED } from '../constants';
import { OTPVerification } from '../otp-verification/opt-verification';

const asyncRandomInt = promisify(randomInt);

export async function create(ctx: Context, next: Next) {
  const { values } = ctx.action.params;
  const plugin = ctx.app.getPlugin('verification') as Plugin;
  const verificationManager = plugin.verificationManager;
  const action = verificationManager.actions.get(values?.action);
  if (!action) {
    return ctx.throw(400, 'Invalid action type');
  }
  const verificationType = verificationManager.getVerificationType(ctx, action);
  const Verification = verificationManager.getVerification(verificationType);
  const verification = new Verification({ ctx }) as OTPVerification;
  const defaultProvider = await verification.getDefaultProvider();
  if (!defaultProvider) {
    console.error(`[verification] no provider for action (${values.action}) provided`);
    return ctx.throw(500);
  }

  const receiver = action.getUserInfo(ctx);
  if (!receiver) {
    return ctx.throw(400, {
      code: 'InvalidReceiver',
      message: ctx.t('Not a valid cellphone number, please re-enter', { ns: namespace }),
    });
  }
  const VerificationModel = ctx.db.getModel('verifications');
  const record = await VerificationModel.findOne({
    where: {
      type: values.action,
      receiver,
      status: CODE_STATUS_UNUSED,
      expiresAt: {
        [Op.gt]: new Date(),
      },
    },
  });
  if (record) {
    const seconds = dayjs(record.get('expiresAt')).diff(dayjs(), 'seconds');
    // return ctx.throw(429, { code: 'RateLimit', message: ctx.t('Please don\'t retry in {{time}}', { time: moment().locale('zh').to(record.get('expiresAt')) }) });
    return ctx.throw(429, {
      code: 'RateLimit',
      message: ctx.t("Please don't retry in {{time}} seconds", { time: seconds, ns: namespace }),
    });
  }

  const code = (<number>await asyncRandomInt(999999)).toString(10).padStart(6, '0');
  if (action.validateUser) {
    try {
      await action.validateUser(ctx, receiver);
    } catch (err) {
      return ctx.throw(400, { code: 'InvalidReceiver', message: err.message });
    }
  }

  const { provider, model: providerItem } = defaultProvider;
  try {
    await provider.send(receiver, { code });
    console.log('verification code sent');
  } catch (error) {
    switch (error.name) {
      case 'InvalidReceiver':
        // TODO: message should consider email and other providers, maybe use "receiver"
        return ctx.throw(400, {
          code: 'InvalidReceiver',
          message: ctx.t('Not a valid cellphone number, please re-enter', { ns: namespace }),
        });
      case 'RateLimit':
        return ctx.throw(429, ctx.t('You are trying so frequently, please slow down', { ns: namespace }));
      default:
        console.error(error);
        return ctx.throw(
          500,
          ctx.t('Verification send failed, please try later or contact to administrator', { ns: namespace }),
        );
    }
  }

  const data = {
    id: randomUUID(),
    type: values.action,
    receiver,
    content: code,
    expiresAt: Date.now() + (action.expiresIn ?? 60) * 1000,
    status: CODE_STATUS_UNUSED,
    providerId: providerItem.get('id'),
  };

  ctx.action.mergeParams(
    {
      values: data,
    },
    {
      values: 'overwrite',
    },
  );

  await actions.create(ctx, async () => {
    const { body: result } = ctx;
    ctx.body = {
      id: result.id,
      expiresAt: result.expiresAt,
    };

    return next();
  });
}
