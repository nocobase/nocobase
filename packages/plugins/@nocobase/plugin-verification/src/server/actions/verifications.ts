import actions, { Context, Next } from '@nocobase/actions';
import { Op } from '@nocobase/database';
import dayjs from 'dayjs';
import { randomInt, randomUUID } from 'crypto';
import { promisify } from 'util';
import Plugin, { namespace } from '..';
import { CODE_STATUS_UNUSED } from '../constants';

const asyncRandomInt = promisify(randomInt);

export async function create(context: Context, next: Next) {
  const plugin = context.app.getPlugin('verification') as Plugin;

  const { values } = context.action.params;
  const interceptor = plugin.interceptors.get(values?.type);
  if (!interceptor) {
    return context.throw(400, 'Invalid action type');
  }

  const providerItem = await plugin.getDefault();
  if (!providerItem) {
    console.error(`[verification] no provider for action (${values.type}) provided`);
    return context.throw(500);
  }

  const receiver = interceptor.getReceiver(context);
  if (!receiver) {
    return context.throw(400, {
      code: 'InvalidReceiver',
      message: context.t('Not a valid cellphone number, please re-enter', { ns: namespace }),
    });
  }
  const VerificationModel = context.db.getModel('verifications');
  const record = await VerificationModel.findOne({
    where: {
      type: values.type,
      receiver,
      status: CODE_STATUS_UNUSED,
      expiresAt: {
        [Op.gt]: new Date(),
      },
    },
  });
  if (record) {
    const seconds = dayjs(record.get('expiresAt')).diff(dayjs(), 'seconds');
    // return context.throw(429, { code: 'RateLimit', message: context.t('Please don\'t retry in {{time}}', { time: moment().locale('zh').to(record.get('expiresAt')) }) });
    return context.throw(429, {
      code: 'RateLimit',
      message: context.t("Please don't retry in {{time}} seconds", { time: seconds, ns: namespace }),
    });
  }

  const code = (<number>await asyncRandomInt(999999)).toString(10).padStart(6, '0');
  if (interceptor.validate) {
    try {
      await interceptor.validate(context, receiver);
    } catch (err) {
      return context.throw(400, { code: 'InvalidReceiver', message: err.message });
    }
  }

  const ProviderType = plugin.providers.get(<string>providerItem.get('type'));
  const provider = new ProviderType(plugin, providerItem.get('options'));

  try {
    await provider.send(receiver, { code });
    console.log('verification code sent');
  } catch (error) {
    switch (error.name) {
      case 'InvalidReceiver':
        // TODO: message should consider email and other providers, maybe use "receiver"
        return context.throw(400, {
          code: 'InvalidReceiver',
          message: context.t('Not a valid cellphone number, please re-enter', { ns: namespace }),
        });
      case 'RateLimit':
        return context.throw(429, context.t('You are trying so frequently, please slow down', { ns: namespace }));
      default:
        console.error(error);
        return context.throw(
          500,
          context.t('Verification send failed, please try later or contact to administrator', { ns: namespace }),
        );
    }
  }

  const data = {
    id: randomUUID(),
    type: values.type,
    receiver,
    content: code,
    expiresAt: Date.now() + (interceptor.expiresIn ?? 60) * 1000,
    status: CODE_STATUS_UNUSED,
    providerId: providerItem.get('id'),
  };

  context.action.mergeParams(
    {
      values: data,
    },
    {
      values: 'overwrite',
    },
  );

  await actions.create(context, async () => {
    const { body: result } = context;
    context.body = {
      id: result.id,
      expiresAt: result.expiresAt,
    };

    return next();
  });
}
