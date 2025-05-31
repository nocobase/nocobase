/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { define, observable } from '@formily/reactive';
import { uid } from '@formily/shared';
import { CreateModelOptions, FlowModel } from '@nocobase/flow-engine';
import { Plugin } from '../application';
import { FlowPage } from './FlowPage';
import { PageFlowModel, TabFlowModel } from './model';

export class PluginFlowEngine extends Plugin {
  async load() {
    this.app.flowEngine.registerModelClass('PageFlowModel', PageFlowModel);
    this.app.flowEngine.registerModelClass('TabFlowModel', TabFlowModel);
    const model = this.app.flowEngine.createModel({
      uid: 'hhv19n26r40',
      use: 'PageFlowModel',
    }) as PageFlowModel;
    this.app.flowEngine.createModel({
      uid: 'brsqpz5fg6b',
      use: 'PageFlowModel',
    });
    this.app.flowEngine.createModel({
      uid: 'brsqpz5fg6b',
      use: 'PageFlowModel',
    });
    this.app.addComponents({ FlowPage });
  }
}
