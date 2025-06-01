/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import _ from 'lodash';
import { Plugin } from '../application/Plugin';
import { MockFlowModelRepository } from './FlowModelRepository';
import { FlowPage } from './FlowPage';
import { PageFlowModel, TabFlowModel } from './model';

export class PluginFlowEngine extends Plugin {
  async load() {
    this.app.flowEngine.setModelRepository(new MockFlowModelRepository());
    this.flowEngine.registerModels({ PageFlowModel, TabFlowModel });
    this.app.addComponents({ FlowPage });
  }
}
