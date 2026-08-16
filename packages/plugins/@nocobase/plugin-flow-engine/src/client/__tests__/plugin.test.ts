/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  clearRunJSRegistryHosts,
  clearRunJSRuntimeHosts,
  getRunJSRegistryHost,
  getRunJSRuntimeHost,
} from '@nocobase/client-v2';

import PluginFlowEngineClient from '..';

describe('PluginFlowEngineClient', () => {
  afterEach(() => {
    clearRunJSRegistryHosts();
    clearRunJSRuntimeHosts();
  });

  it('leaves default RunJS host ownership to the built-in core plugin', async () => {
    const plugin = new PluginFlowEngineClient({}, {} as never);

    await plugin.afterAdd();
    await plugin.beforeLoad();
    await plugin.load();

    expect(getRunJSRegistryHost()).toBeUndefined();
    expect(() => getRunJSRuntimeHost()).toThrow('RunJS client runtime is not installed');
  });
});
