import path from 'path';

import { importModule } from '@nocobase/utils';

import Plugin from '../Plugin';
import { PROVIDER_TYPE_SMS_ALIYUN, PROVIDER_TYPE_SMS_TENCENT } from '../constants';

export class Provider {
  constructor(
    protected plugin: Plugin,
    protected options,
  ) {}

  async send(receiver: string, data: { [key: string]: any }): Promise<any> {}
}

interface Providers {
  [key: string]: typeof Provider;
}

export default async function (plugin: Plugin, more: Providers = {}) {
  const { providers } = plugin;

  async function loadProviders(types) {
    const providers = {};

    for (const key of types) {
      const modulePath = path.isAbsolute(key) ? key : path.join(__dirname, key);
      providers[key] = (await importModule(modulePath)) as typeof Provider;
    }

    return providers as Providers;
  }

  const natives = await loadProviders([PROVIDER_TYPE_SMS_ALIYUN, PROVIDER_TYPE_SMS_TENCENT]);

  for (const [name, provider] of Object.entries({ ...more, ...natives })) {
    providers.register(name, provider);
  }
}
