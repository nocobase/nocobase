import path from 'path';

import { requireModule } from '@nocobase/utils';
import { HandlerType } from '@nocobase/resourcer';

import Plugin from '..';

interface Authenticators {
  [key: string]: HandlerType;
}

export default function (plugin: Plugin, more: Authenticators = {}) {
  const { authenticators } = plugin;

  const natives = ['password'].reduce(
    (result, key) =>
      Object.assign(result, {
        [key]: requireModule(path.isAbsolute(key) ? key : path.join(__dirname, key)) as HandlerType,
      }),
    {},
  );

  for (const [name, authenticator] of Object.entries(<Authenticators>{ ...more, ...natives })) {
    authenticators.register(name, authenticator);
  }
}
