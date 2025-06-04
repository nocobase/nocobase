/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowModel } from '@nocobase/flow-engine';
import _ from 'lodash';
import { Plugin } from '../application/Plugin';
import { MockFlowModelRepository } from './FlowModelRepository';
import { FlowPage } from './FlowPage';
import * as models from './models';

export class PluginFlowEngine extends Plugin {
  async load() {
    this.app.addComponents({ FlowPage });
    this.app.flowEngine.setModelRepository(new MockFlowModelRepository());
    const filteredModels = Object.fromEntries(
      Object.entries(models).filter(
        ([, ModelClass]) => typeof ModelClass === 'function' && ModelClass.prototype instanceof FlowModel,
      ),
    );
    this.flowEngine.registerModels(filteredModels);
    await this.flowEngine.flowSettings.load();
  }
}

// Export all models for external use
export * from './models';
