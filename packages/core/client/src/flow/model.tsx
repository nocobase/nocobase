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
import { useRequest } from 'ahooks';
import { Button, Tabs } from 'antd';
import React from 'react';

export class GridFlowModel extends FlowModel {
  render() {
    return 'a';
  }
}

export class TabFlowModel extends FlowModel {}

TabFlowModel.registerFlow('defaultFlow', {
  key: 'defaultFlow',
  autoApply: true,
  steps: {
    step1: {
      handler(ctx, model: TabFlowModel, params) {
        model.setProps('key', model.uid);
        model.setProps('label', params.title);
        console.log('TabFlowModel', params);
      },
    },
  },
});

export class PageFlowModel extends FlowModel {
  tabs: Array<TabFlowModel> = observable([]);

  async addTab(tabOptions: Omit<CreateModelOptions, 'use'>, ctx?: any) {
    const model = this.flowEngine.createModel({
      use: 'TabFlowModel',
      ...tabOptions,
    });
    this.tabs.push(model);
    await model.applyAutoFlows(ctx);
    return model;
  }

  getTabList(): any[] {
    return this.tabs.map((tab) => tab.getProps());
  }

  render() {
    return (
      <div>
        {this.tabs.length}
        <Tabs
          items={this.getTabList()}
          tabBarExtraContent={
            <Button
              onClick={async () => {
                await this.addTab({
                  stepParams: {
                    defaultFlow: {
                      step1: {
                        title: `tab-${uid()}`,
                      },
                    },
                  },
                });
              }}
            >
              Add tab
            </Button>
          }
        />
        Page {this.uid}
      </div>
    );
  }
}

PageFlowModel.registerFlow('defaultFlow', {
  autoApply: true,
  steps: {
    step1: {
      async handler(ctx, model: PageFlowModel, params) {
        await model.addTab({
          stepParams: {
            defaultFlow: {
              step1: {
                title: `tab-${uid()}`,
              },
            },
          },
        });
        await model.addTab({
          stepParams: {
            defaultFlow: {
              step1: {
                title: `tab-${uid()}`,
              },
            },
          },
        });
      },
    },
  },
});
