import path from 'path';

import { requireModule } from '@nocobase/utils';

import Plugin from '../Plugin';
import { PROVIDER_TYPE_SMS_ALIYUN, PROVIDER_TYPE_SMS_TENCENT } from '../constants';

export class Provider {
  constructor(protected plugin: Plugin, protected options) {}

  async send(receiver: string, data: { [key: string]: any }): Promise<any> {}
}

interface Providers {
  [key: string]: typeof Provider;
}

export default function (plugin: Plugin, more: Providers = {}) {
  const { providers } = plugin;

  const natives = [PROVIDER_TYPE_SMS_ALIYUN, PROVIDER_TYPE_SMS_TENCENT].reduce(
    (result, key) =>
      Object.assign(result, {
        [key]: requireModule(path.isAbsolute(key) ? key : path.join(__dirname, key)) as typeof Provider,
      }),
    {} as Providers,
  );

  for (const [name, provider] of Object.entries({ ...more, ...natives })) {
    providers.register(name, provider);
  }
}
