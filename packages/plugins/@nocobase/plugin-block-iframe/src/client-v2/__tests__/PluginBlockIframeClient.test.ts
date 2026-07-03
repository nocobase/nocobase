/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowEngine } from '@nocobase/flow-engine';
import { describe, expect, it } from 'vitest';
import { IframeBlockModel } from '../models/IframeBlockModel';
import PluginBlockIframeClient, { PluginBlockIframeClient as NamedPluginBlockIframeClient } from '../plugin';

describe('PluginBlockIframeClient', () => {
  it('registers the iframe block model loader', async () => {
    const flowEngine = new FlowEngine();

    await PluginBlockIframeClient.prototype.load.call({ flowEngine });
    await flowEngine.preloadModelLoaders();

    expect(flowEngine.getModelClass('IframeBlockModel')).toBe(IframeBlockModel);
  });

  it('exports the plugin class as the default client plugin', () => {
    expect(PluginBlockIframeClient).toBe(NamedPluginBlockIframeClient);
  });
});
