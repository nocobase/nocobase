/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CreateModelOptions, FlowModel } from '@nocobase/flow-engine';
import { Plugin } from '../application';
import { FlowPage } from './FlowPage';

class TabFlowModel extends FlowModel {}

TabFlowModel.registerFlow('defaultFlow', {
  key: 'defaultFlow',
  autoApply: true,
  steps: {
    step1: {
      handler(ctx, model: TabFlowModel, params) {
        model.setProps('key', model.uid);
        model.setProps('title', params.title);
        console.log('TabFlowModel', params);
      },
    },
  },
});

export class PageFlowModel extends FlowModel {
  tabs: Array<TabFlowModel> = [];
  addTab(tabOptions: CreateModelOptions) {
    const model = this.flowEngine.createModel(tabOptions);
    this.tabs.push(model);
    return model;
  }

  async mapTabs(callback) {
    return Promise.all(
      this.tabs.map(async (tab) => {
        return await callback(tab);
      }),
    );
  }
}

PageFlowModel.registerFlow('defaultFlow', {
  key: 'defaultFlow',
  autoApply: true,
  steps: {
    step1: {
      async handler(ctx, model: PageFlowModel, params) {
        model.addTab({
          use: 'TabFlowModel',
          stepParams: {
            defaultFlow: {
              step1: {
                title: 'Tab1'
              }
            }
          }
        });
        model.addTab({
          use: 'TabFlowModel',
          stepParams: {
            defaultFlow: {
              step1: {
                title: 'Tab2'
              }
            }
          }
        });
        const tabList = await model.mapTabs(async (tab: TabFlowModel) => {
          await tab.applyAutoFlows();
          return tab.getProps();
        });
        console.log('tabList', tabList);
        model.setProps('tabList', tabList);
      },
    },
  },
});

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
    this.app.addComponents({ FlowPage });
  }
}
