import Plugin from '../Plugin';
import { PROVIDER_TYPE_SMS_ALIYUN, PROVIDER_TYPE_SMS_TENCENT } from '../constants';
import { Provider } from './Provider';
import smsAliyun from './sms-aliyun';
import smsTencent from './sms-tencent';

interface Providers {
  [key: string]: typeof Provider;
}

export default async function (plugin: Plugin, more: Providers = {}) {
  const { providers } = plugin;

  providers.register(PROVIDER_TYPE_SMS_ALIYUN, smsAliyun);
  providers.register(PROVIDER_TYPE_SMS_TENCENT, smsTencent);

  for (const [name, provider] of Object.entries({ ...more })) {
    providers.register(name, provider);
  }
}
