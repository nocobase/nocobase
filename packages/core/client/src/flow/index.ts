/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DataSource, DataSourceManager, FlowModel } from '@nocobase/flow-engine';
import _ from 'lodash';
import { Plugin } from '../application/Plugin';
import { IconPicker } from '../schema-component/antd/icon-picker';
import * as actions from './actions';
import * as filterFormActions from './models/filter-blocks/filter-manager/flow-actions';
import { FlowEngineRunner } from './FlowEngineRunner';
import { FlowModelRepository, MockFlowModelRepository } from './FlowModelRepository';
import { FlowRoute } from './FlowPage';
import * as models from './models';

export class PluginFlowEngine extends Plugin {
  async load() {
    this.app.addComponents({ FlowRoute });
    // this.app.flowEngine.setModelRepository(new MockFlowModelRepository());
    this.app.flowEngine.setModelRepository(new FlowModelRepository(this.app));
    const filteredModels = Object.fromEntries(
      Object.entries(models).filter(
        ([, ModelClass]) => typeof ModelClass === 'function' && ModelClass.prototype instanceof FlowModel,
      ),
    ) as Record<string, typeof FlowModel>;
    // console.log('Registering flow models:', Object.keys(filteredModels));
    this.flowEngine.registerModels(filteredModels);
    this.flowEngine.registerActions(actions);
    this.flowEngine.registerActions(filterFormActions);
    this.app.addProvider(FlowEngineRunner, {});
    this.flowEngine.flowSettings.registerComponents({
      IconPicker,
    });
  }
}

// Export all models for external use
export * from './FlowModelRepository';
export * from './models';
//
