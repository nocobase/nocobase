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

import PluginFlowEngineClientV2 from '../plugin';

describe('PluginFlowEngineClientV2', () => {
  afterEach(() => {
    clearRunJSRegistryHosts();
    clearRunJSRuntimeHosts();
  });

  it('does not own the default RunJS client hosts', async () => {
    const plugin = new PluginFlowEngineClientV2({}, {} as never);

    await plugin.beforeLoad();
    await plugin.load();

    expect(getRunJSRegistryHost()).toBeUndefined();
    expect(() => getRunJSRuntimeHost()).toThrow('RunJS client runtime is not installed');
  });
});
