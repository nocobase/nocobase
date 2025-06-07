/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { uid } from '@formily/shared';
import { FlowModel, FlowModelRenderer } from '@nocobase/flow-engine';
import { Button, Tabs } from 'antd';
import _ from 'lodash';
import React from 'react';

type PageFlowModelRelatedModels = {
  subModels: {
    tabs: FlowModel[];
  }
}

export class PageFlowModel extends FlowModel<PageFlowModelRelatedModels> {
  onInit(options: any) {
    const tabs = options.tabs || [];
    tabs.forEach((tab: any) => {
      this.addSubModel('tabs', tab);
    });
  }

  addTab(tab: any) {
    const model = this.addSubModel('tabs', tab);
    model.save();
  }

  getItems() {
    return this.subModels.tabs.map((tab) => {
      return {
        key: tab.uid,
        label: tab.props.label || 'Unnamed',
        children: <FlowModelRenderer model={tab} />,
      };
    });
  }

  renderFirstTab() {
    return <FlowModelRenderer model={this.subModels.tabs[0]} />;
  }

  renderTabs() {
    return (
      <Tabs
        items={this.getItems()}
        // destroyInactiveTabPane
        tabBarExtraContent={
          <Button
            onClick={() =>
              this.addTab({
                use: 'PageTabFlowModel',
                props: { key: uid(), label: `Tab - ${uid()}` },
                grid: {
                  use: 'BlockGridFlowModel',
                },
              })
            }
          >
            Add Tab
          </Button>
        }
      />
    );
  }

  render() {
    return this.props.enableTabs ? this.renderTabs() : this.renderFirstTab();
  }
}

PageFlowModel.registerFlow({
  key: 'default',
  auto: true,
  steps: {
    step1: {
      uiSchema: {
        title: {
          type: 'string',
          title: 'Page Title',
          'x-decorator': 'FormItem',
          'x-component': 'Input',
          'x-component-props': {
            placeholder: 'Enter page title',
          },
        },
        enableTabs: {
          type: 'boolean',
          title: 'Enable tabs',
          'x-decorator': 'FormItem',
          'x-component': 'Switch',
        },
      },
      async handler(ctx, params) {
        ctx.model.setProps('enableTabs', params.enableTabs || false);
        console.log('PageFlowModel step1 handler', ctx.model.props.enableTabs);
      },
    },
  },
});
