import { promisify } from 'util';
import { randomInt, randomUUID } from 'crypto';

import { Op } from '@nocobase/database';
import actions, { Context, Next } from '@nocobase/actions';

import Plugin from '..';
import { CODE_STATUS_UNUSED } from '../constants';

const asyncRandomInt = promisify(randomInt);

export async function create(context: Context, next: Next) {
  const plugin = context.app.getPlugin('@nocobase/plugin-verification') as Plugin;

  const { values } = context.action.params;
  const interceptor = plugin.interceptors.get(values?.type);
  if (!interceptor) {
    return context.throw(400, 'Invalid action type');
  }

  const ProviderRepo = context.db.getRepository('verifications_providers');
  const providerItem = await ProviderRepo.findOne({
    filterByTk: interceptor.provider
  });
  if (!providerItem) {
    console.error(`[verification] no provider for action (${values.type}) provided`);
    return context.throw(500);
  }

  const receiver = interceptor.getReceiver(context);
  if (!receiver) {
    return context.throw(400, { code: 'InvalidReceiver', message: 'Invalid receiver' });
  }
  const VerificationModel = context.db.getModel('verifications');
  const exists = await VerificationModel.count({
    where: {
      type: values.type,
      receiver,
      status: CODE_STATUS_UNUSED,
      expiresAt: {
        [Op.gt]: new Date()
      }
    }
  });
  if (exists) {
    return context.throw(429, { code: 'RateLimit', message: 'Please wait code to be expired' });
  }

  const code = (<number>(await asyncRandomInt(999999))).toString(10).padStart(6, '0');
  if (interceptor.validate) {
    const receiverValid = await interceptor.validate(receiver);
    if (!receiverValid) {
      return context.throw(400, { code: 'InvalidReceiver', message: 'Invalid receiver' });
    }
  }

  const ProviderType = plugin.providers.get(<string>providerItem.get('type'));
  const provider = new ProviderType(plugin, providerItem.get('options'));

  try {
    await provider.send(receiver, { code });
    console.log('sms verification code sent');
  } catch (error) {
    switch (error.name) {
      case 'InvalidReceiver':
        return context.throw(400, { code: 'InvalidReceiver', message: 'Invalid receiver' });
      default:
        console.error(error);
        return context.throw(500);
    }
  }

  const data = {
    id: randomUUID(),
    type: values.type,
    receiver,
    content: code,
    expiresAt: Date.now() + (interceptor.expiresIn ?? 60) * 1000,
    status: CODE_STATUS_UNUSED,
    providerId: providerItem.get('id')
  };

  context.action.mergeParams({
    values: data
  }, {
    values: 'overwrite'
  });

  await actions.create(context, async () => {
    const { body: result } = context;
    context.body = {
      id: result.id,
      expiresAt: result.expiresAt
    };

    return next();
  });
}
