import { ServiceContainer } from '@nocobase/service-provider';
import { describe, expect, it } from 'vitest';

import { __NOCOBASE_SYMBOL_NAME__Provider } from '../../server/providers/__NOCOBASE_SHORT_NAME__.js';
import { Default__NOCOBASE_SYMBOL_NAME__Service } from '../../server/services/__NOCOBASE_SHORT_NAME__.js';
import { __NOCOBASE_MODULE_NAME__ServiceToken } from '../../server/tokens.js';

describe(__NOCOBASE_PACKAGE_NAME_LITERAL__, () => {
  it('registers its service as a lazy singleton', () => {
    const container = new ServiceContainer();
    const provider = new __NOCOBASE_SYMBOL_NAME__Provider({ container });

    expect(provider.name).toBe(__NOCOBASE_PACKAGE_NAME_LITERAL__);
    expect(
      container.resolveIfCreated(__NOCOBASE_MODULE_NAME__ServiceToken),
    ).toBeUndefined();

    provider.register();

    const service = container.resolve(__NOCOBASE_MODULE_NAME__ServiceToken);
    expect(service).toBeInstanceOf(Default__NOCOBASE_SYMBOL_NAME__Service);
    expect(service.getMessage()).toBe(__NOCOBASE_HELLO_MESSAGE_LITERAL__);
    expect(container.resolve(__NOCOBASE_MODULE_NAME__ServiceToken)).toBe(
      service,
    );
  });
});
