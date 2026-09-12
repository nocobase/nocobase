/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createMockClient } from '@nocobase/client-v2';
import PluginUsersClientV2, { PasswordValidator } from '../plugin';

describe('plugin-users client-v2 password validator registry', () => {
  it('register / get / unregister round-trip', async () => {
    const app = createMockClient({});
    await app.pm.add(PluginUsersClientV2);
    await app.load();

    const plugin = app.pm.get(PluginUsersClientV2) as PluginUsersClientV2;
    expect(plugin.getPasswordValidators()).toEqual([]);

    const minLengthValidator: PasswordValidator = async (value) =>
      typeof value === 'string' && value.length < 6 ? 'too short' : null;
    const containsUserValidator: PasswordValidator = async (value, { username }) =>
      username && value.includes(username) ? 'contains username' : null;

    plugin.registerPasswordValidator('min-length', minLengthValidator);
    plugin.registerPasswordValidator('no-username', containsUserValidator);
    expect(plugin.getPasswordValidators()).toHaveLength(2);

    // Re-registering the same name overwrites — the registry is keyed by name so HMR / tests can swap implementations without ever doubling them up.
    const replacement: PasswordValidator = async () => 'replaced';
    plugin.registerPasswordValidator('min-length', replacement);
    expect(plugin.getPasswordValidators()).toHaveLength(2);
    const messages = await Promise.all(plugin.getPasswordValidators().map((fn) => fn('hi', { username: 'alice' })));
    expect(messages).toContain('replaced');

    plugin.unregisterPasswordValidator('min-length');
    plugin.unregisterPasswordValidator('no-username');
    expect(plugin.getPasswordValidators()).toEqual([]);
  });
});
