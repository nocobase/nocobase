/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Application } from '@nocobase/server';

import { NAMESPACE } from '../../constants';
import packageJson from '../../../package.json';
import PluginLightExtensionServer from '../plugin';

describe('plugin-light-extension bootstrap', () => {
  it('declares the vsc-file dependency and keeps lifecycle hooks safe without a full app', async () => {
    expect(packageJson.peerDependencies['@nocobase/plugin-vsc-file']).toBe('2.x');

    const plugin = new PluginLightExtensionServer({} as Application, {
      name: 'light-extension',
      packageName: NAMESPACE,
    });

    await expect(plugin.afterAdd()).resolves.toBeUndefined();
    await expect(plugin.beforeLoad()).resolves.toBeUndefined();
    await expect(plugin.load()).resolves.toBeUndefined();
    await expect(plugin.install()).resolves.toBeUndefined();
    expect(plugin.getName()).toBe('light-extension');
    expect('createRepository' in plugin).toBe(false);
  });
});
