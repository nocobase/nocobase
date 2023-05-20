import path from 'path';

import type { HandlerType } from '@nocobase/resourcer';
import { importModule } from '@nocobase/utils';

import type Plugin from '..';

interface Authenticators {
  [key: string]: HandlerType;
}

export default async function (plugin: Plugin, more: Authenticators = {}) {
  const { authenticators } = plugin;

  const keys = ['password'];
  const natives = {};

  for (const key of keys) {
    natives[key] = (await importModule(path.isAbsolute(key) ? key : path.join(__dirname, key))) as HandlerType;
  }

  for (const [name, authenticator] of Object.entries(<Authenticators>{ ...more, ...natives })) {
    authenticators.register(name, authenticator);
  }
}
