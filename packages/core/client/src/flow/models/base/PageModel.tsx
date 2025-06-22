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
import { PageHeader } from '@ant-design/pro-layout';

type PageModelStructure = {
  subModels: {
    tabs: FlowModel[];
  };
};

export class PageModel extends FlowModel<PageModelStructure> {
  addTab(tab: any) {
    const model = this.addSubModel('tabs', tab);
    model.save();
  }

  getItems() {
    return this.subModels.tabs?.map((tab) => {
      return {
        key: tab.uid,
        label: tab.props.label || 'Unnamed',
        children: <FlowModelRenderer model={tab} />,
      };
    });
  }

  renderFirstTab() {
    return <FlowModelRenderer model={this.subModels.tabs?.[0]} />;
  }

  renderTabs() {
    return (
      <Tabs
        tabBarStyle={{ backgroundColor: '#fff', paddingInline: 16 }}
        items={this.getItems()}
        // destroyInactiveTabPane
        tabBarExtraContent={
          <Button
            onClick={() =>
              this.addTab({
                use: 'PageTabModel',
                props: { key: uid(), label: `Tab - ${uid()}` },
                subModels: {
                  grid: {
                    use: 'BlockGridModel',
                  },
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
    return (
      <>
        {this.props.title && <PageHeader title={this.props.title} style={{ backgroundColor: '#fff' }} />}
        {this.props.enableTabs ? this.renderTabs() : this.renderFirstTab()}
      </>
    );
  }
}

PageModel.registerFlow({
  key: 'default',
  title: '基础配置',
  auto: true,
  steps: {
    settings: {
      title: '配置页面',
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
      defaultParams(ctx) {
        return {
          title: 'Page title',
          enableTabs: false,
        };
      },
      async handler(ctx, params) {
        ctx.model.setProps('title', params.title);
        ctx.model.setProps('enableTabs', params.enableTabs);
      },
    },
  },
});
