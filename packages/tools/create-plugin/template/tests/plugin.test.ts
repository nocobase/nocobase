import { describe, expect, it } from 'vitest';

import { __NOCOBASE_SYMBOL_NAME__JobsProvider } from '../server/jobs/provider.js';
import { __NOCOBASE_SYMBOL_NAME__Provider } from '../server/providers/__NOCOBASE_SHORT_NAME__.js';
import serviceProviders from '../server/providers/index.js';
import routes from '../server/routes/index.js';
import __NOCOBASE_MODULE_NAME__Plugin from '../server/index.js';

describe(__NOCOBASE_PACKAGE_NAME_LITERAL__, () => {
  it('declares its server contributions', () => {
    expect(__NOCOBASE_MODULE_NAME__Plugin).toMatchObject({
      packageName: __NOCOBASE_PACKAGE_NAME_LITERAL__,
      serviceProviders: [...serviceProviders, __NOCOBASE_SYMBOL_NAME__JobsProvider],
      routes,
    });
    // Named explicitly, so removing the provider from the list fails here rather than passing against an empty array.
    expect(serviceProviders).toContain(__NOCOBASE_SYMBOL_NAME__Provider);
    expect(__NOCOBASE_MODULE_NAME__Plugin.database).toEqual({
      migrations: './database/migrations',
      seeds: './database/seeds',
    });
  });
});
