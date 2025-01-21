/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Context, Next } from '@nocobase/actions';
import dayjs from 'dayjs';
import { randomInt, randomUUID } from 'crypto';
import { promisify } from 'util';
import PluginVerificationServer from '../../../Plugin';
import { SMSOTPVerification } from '..';
import { CODE_STATUS_UNUSED } from '../../../constants';
import { namespace } from '../../..';
const asyncRandomInt = promisify(randomInt);

async function create(ctx: Context, next: Next) {
  const { action: actionName, verificator: verificatorName } = ctx.action.params?.values || {};
  const plugin = ctx.app.getPlugin('verification') as PluginVerificationServer;
  const verificationManager = plugin.verificationManager;
  const action = verificationManager.actions.get(actionName);
  if (!action) {
    return ctx.throw(400, 'Invalid action type');
  }
  if (!verificatorName) {
    return ctx.throw(400, 'Invalid verificator');
  }
  const verificator = await ctx.db.getRepository('verificators').findOne({
    filterByTk: verificatorName,
  });
  if (!verificator) {
    return ctx.throw(400, 'Invalid verificator');
  }
  const Verification = verificationManager.getVerification(verificator.verificationType);
  const verification = new Verification({
    ctx,
    verificator,
    options: verificator.options,
  }) as SMSOTPVerification;
  const provider = await verification.getProvider();
  if (!provider) {
    console.error(`[verification] no provider for action (${actionName}) provided`);
    return ctx.throw(500);
  }

  let boundInfo: { uuid: string };
  if (action.getBoundInfoFromCtx) {
    boundInfo = await action.getBoundInfoFromCtx(ctx);
  } else {
    let userId: number;
    if (action.getUserIdFromCtx) {
      userId = await action.getUserIdFromCtx(ctx);
    } else {
      userId = ctx.auth.user.id;
    }
    boundInfo = await verification.getBoundInfo(userId);
  }
  await verification.validateBoundInfo?.(boundInfo);
  const { uuid: receiver } = boundInfo;
  const record = await ctx.db.getRepository('otpRecords').findOne({
    filter: {
      action: actionName,
      receiver,
      status: CODE_STATUS_UNUSED,
      expiresAt: {
        $gt: new Date(),
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
  // try {
  //   await provider.send(receiver, { code });
  //   console.log('verification code sent');
  // } catch (error) {
  //   switch (error.name) {
  //     case 'InvalidReceiver':
  //       // TODO: message should consider email and other providers, maybe use "receiver"
  //       return ctx.throw(400, {
  //         code: 'InvalidReceiver',
  //         message: ctx.t('Not a valid cellphone number, please re-enter', { ns: namespace }),
  //       });
  //     case 'RateLimit':
  //       return ctx.throw(429, ctx.t('You are trying so frequently, please slow down', { ns: namespace }));
  //     default:
  //       console.error(error);
  //       return ctx.throw(
  //         500,
  //         ctx.t('Verification send failed, please try later or contact to administrator', { ns: namespace }),
  //       );
  //   }
  // }

  const result = await ctx.db.getRepository('otpRecords').create({
    values: {
      id: randomUUID(),
      action: actionName,
      receiver,
      code,
      expiresAt: Date.now() + (verification.expiresIn ?? 60) * 1000,
      status: CODE_STATUS_UNUSED,
      verificatorName,
    },
  });

  ctx.body = {
    id: result.id,
    expiresAt: result.expiresAt,
  };

  return next();
}

export default {
  name: 'smsOTP',
  actions: {
    create,
    publicCreate: create,
  },
};
