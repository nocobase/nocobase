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
  const { action: actionName, verifier: verifierName } = ctx.action.params?.values || {};
  const plugin = ctx.app.getPlugin('verification') as PluginVerificationServer;
  const verificationManager = plugin.verificationManager;
  const action = verificationManager.actions.get(actionName);
  if (!action) {
    return ctx.throw(400, 'Invalid action type');
  }
  if (!verifierName) {
    return ctx.throw(400, 'Invalid verifier');
  }
  const verifier = await ctx.db.getRepository('verifiers').findOne({
    filter: {
      name: verifierName,
    },
  });
  if (!verifier) {
    return ctx.throw(400, 'Invalid verifier');
  }
  const Verification = verificationManager.getVerification(verifier.verificationType);
  const verification = new Verification({
    ctx,
    verifier,
    options: verifier.options,
  }) as SMSOTPVerification;
  const provider = await verification.getProvider();
  if (!provider) {
    ctx.log.error(`[verification] no provider for action (${actionName}) provided`);
    return ctx.throw(500, 'Invalid provider');
  }
  const { boundInfo } = await verificationManager.getAndValidateBoundInfo(ctx, action, verification);
  const { uuid: receiver } = boundInfo;
  const record = await ctx.db.getRepository('otpRecords').findOne({
    filter: {
      action: actionName,
      receiver,
      status: CODE_STATUS_UNUSED,
      expiresAt: {
        $dateAfter: new Date(),
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
  try {
    await provider.send(receiver, { code });
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
        ctx.log.error(error);
        return ctx.throw(
          500,
          ctx.t('Verification send failed, please try later or contact to administrator', { ns: namespace }),
        );
    }
  }

  const result = await ctx.db.getRepository('otpRecords').create({
    values: {
      id: randomUUID(),
      action: actionName,
      receiver,
      code,
      expiresAt: Date.now() + (verification.expiresIn ?? 60) * 1000,
      status: CODE_STATUS_UNUSED,
      verifierName,
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
