import path from 'path';

import { importModule } from '@nocobase/utils';

import type Plugin from '../Plugin';
import { PROVIDER_TYPE_SMS_ALIYUN, PROVIDER_TYPE_SMS_TENCENT } from '../constants';

export class Provider {
  constructor(protected plugin: Plugin, protected options) {}

  async send(receiver: string, data: { [key: string]: any }): Promise<any> {}
}

interface Providers {
  [key: string]: typeof Provider;
}

export default async function (plugin: Plugin, more: Providers = {}) {
  const { providers } = plugin;

  const keys = [PROVIDER_TYPE_SMS_ALIYUN, PROVIDER_TYPE_SMS_TENCENT];
  const natives = {} as Providers;

  for (const key of keys) {
    natives[key] = (await importModule(path.isAbsolute(key) ? key : path.join(__dirname, key))) as typeof Provider;
  }

  for (const [name, provider] of Object.entries({ ...more, ...natives })) {
    providers.register(name, provider);
  }
}
