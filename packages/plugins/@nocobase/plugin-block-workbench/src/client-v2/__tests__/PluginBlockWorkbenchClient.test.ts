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
import { ActionPanelBlockModel } from '../models/ActionPanelBlockModel';
import { ActionPanelGroupActionModel } from '../models/actions/ActionPanelGroupAction';
import { ActionPanelScanActionModel } from '../models/actions/ActionPanelScanActionModel';
import PluginBlockWorkbenchClient from '../plugin';

describe('PluginBlockWorkbenchClient', () => {
  it('registers action panel model loaders', async () => {
    const flowEngine = new FlowEngine();

    await PluginBlockWorkbenchClient.prototype.load.call({ flowEngine });
    await flowEngine.preloadModelLoaders();

    expect(flowEngine.getModelClass('ActionPanelBlockModel')).toBe(ActionPanelBlockModel);
    expect(flowEngine.getModelClass('ActionPanelGroupActionModel')).toBe(ActionPanelGroupActionModel);
    expect(flowEngine.getModelClass('ActionPanelScanActionModel')).toBe(ActionPanelScanActionModel);
  });
});
