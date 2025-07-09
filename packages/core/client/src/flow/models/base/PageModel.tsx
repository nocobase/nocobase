/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { PlusOutlined } from '@ant-design/icons';
import { PageHeader } from '@ant-design/pro-layout';
import { uid } from '@formily/shared';
import { FlowModel, FlowModelRenderer, FlowSettingsButton, escapeT } from '@nocobase/flow-engine';
import { Tabs } from 'antd';
import _ from 'lodash';
import React from 'react';

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
    return this.mapSubModels('tabs', (tab) => {
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
        tabBarStyle={this.props.tabBarStyle}
        items={this.getItems()}
        // destroyInactiveTabPane
        tabBarExtraContent={
          <FlowSettingsButton
            icon={<PlusOutlined />}
            style={{ marginRight: 8 }}
            onClick={() => {
              this.addTab({
                use: 'PageTabModel',
                props: { key: uid(), label: `Tab - ${uid()}` },
                subModels: {
                  grid: {
                    use: 'BlockGridModel',
                  },
                },
              });
            }}
          >
            {this.flowEngine.translate('Add tab')}
          </FlowSettingsButton>
        }
      />
    );
  }

  render() {
    return (
      <>
        {this.props.displayTitle && <PageHeader title={this.props.title} style={this.props.headerStyle} />}
        {this.props.enableTabs ? this.renderTabs() : this.renderFirstTab()}
      </>
    );
  }
}

PageModel.registerFlow({
  key: 'pageSettings',
  title: escapeT('Page settings'),
  auto: true,
  steps: {
    general: {
      title: escapeT('General'),
      uiSchema: {
        displayTitle: {
          type: 'boolean',
          title: escapeT('Display page title'),
          'x-decorator': 'FormItem',
          'x-component': 'Switch',
        },
        title: {
          type: 'string',
          title: escapeT('Page title'),
          'x-decorator': 'FormItem',
          'x-component': 'Input',
          'x-reactions': {
            dependencies: ['displayTitle'],
            fulfill: {
              state: {
                visible: '{{$deps[0]}}',
              },
            },
          },
        },
        // enableTabs: {
        //   type: 'boolean',
        //   title: escapeT('Enable tabs'),
        //   'x-decorator': 'FormItem',
        //   'x-component': 'Switch',
        // },
      },
      defaultParams(ctx) {
        return {
          displayTitle: true,
          enableTabs: false,
        };
      },
      async handler(ctx, params) {
        ctx.model.setProps('displayTitle', params.displayTitle);
        ctx.model.setProps(
          'title',
          ctx.t(params.title || ctx.model.ctx.shared?.currentFlow.shared?.currentRoute.title),
        );
        ctx.model.setProps('enableTabs', params.enableTabs);

        if (ctx.shared.currentDrawer) {
          ctx.model.setProps('headerStyle', {
            backgroundColor: ctx.themeToken.colorBgLayout,
          });
          ctx.model.setProps('tabBarStyle', {
            backgroundColor: ctx.themeToken.colorBgLayout,
            paddingInline: 16,
            marginBottom: 0,
          });
        } else {
          ctx.model.setProps('headerStyle', {
            backgroundColor: ctx.themeToken.colorBgContainer,
          });
          ctx.model.setProps('tabBarStyle', {
            backgroundColor: ctx.themeToken.colorBgContainer,
            paddingInline: 16,
            marginBottom: 0,
          });
        }
      },
    },
  },
});
