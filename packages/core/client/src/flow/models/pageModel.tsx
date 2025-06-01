/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { action, define, observable } from '@formily/reactive';
import { observer } from '@formily/reactive-react';
import { CreateModelOptions, FlowModel, FlowModelRenderer } from '@nocobase/flow-engine';
import { Button, Tabs, Typography } from 'antd';
import React from 'react';
import { TabModel } from './tabModel';
import { FlowsFloatContextMenu } from '@nocobase/flow-engine';

const { Title } = Typography;

export class PageModel extends FlowModel {
  tabs: Array<TabModel> = observable([]);
  currentTab: TabModel | null = null;

  constructor(options: { uid: string; stepParams?: any }) {
    super(options);
    define(this, {
      tabs: observable,
      currentTab: observable,
      setCurrentTab: action,
      addTab: action,
    });
  }

  async addTab(tabOptions: Omit<CreateModelOptions, 'use'>, ctx?: any) {
    console.log('PageModel.addTab: Creating new tab');
    const model = this.flowEngine.createModel<TabModel>({
      use: 'TabModel',
      ...tabOptions,
    });

    this.tabs.push(model);
    model.applyAutoFlows();
    // 如果是第一个tab，设置为当前tab并激活
    if (this.tabs.length === 1) {
      await this.setCurrentTab(model);
    }

    return model;
  }

  async setCurrentTab(tab: TabModel) {
    console.log('PageModel.setCurrentTab: Setting current tab to:', tab.uid);
    this.currentTab = tab;
    // 触发 tab 的 onActive 事件
    tab.dispatchEvent('onActive');
    console.log('PageModel.setCurrentTab: Tab activated:', tab.uid);
  }

  getTabList(): any[] {
    return this.tabs.map((tab) => ({
      key: tab.uid,
      label: tab.getProps().title || 'Unnamed',
      children: <FlowModelRenderer model={tab} />,
    }));
  }

  render() {
    const { title: pageTitle, description: pageDescription } = this.getProps();

    const RenderComponent = observer(() => (
      <div style={{ backgroundColor: '#f0f2f5', minHeight: '100vh' }}>
        {/* 页面标题 */}
        <FlowsFloatContextMenu model={this} showDeleteButton={false}>
          {pageTitle && (
            <div
              style={{
                backgroundColor: 'white',
                padding: '16px 0',
                borderBottom: '1px solid #f0f0f0',
                marginBottom: '0',
              }}
            >
              <Title level={3} style={{ margin: 0 }}>
                {pageTitle}
              </Title>
              {pageDescription && <div style={{ color: '#666', marginTop: '4px' }}>{pageDescription}</div>}
            </div>
          )}
        </FlowsFloatContextMenu>

        {/* 标签页内容 */}
        <div style={{ padding: '16px 0' }}>
          <Tabs
            onChange={async (activeKey) => {
              console.log('PageModel.Tabs.onChange: Switching to tab:', activeKey);
              const tab = this.tabs.find((t) => t.uid === activeKey);
              if (tab) {
                console.log('PageModel.Tabs.onChange: Found tab:', tab.uid);
                this.setCurrentTab(tab);
              } else {
                console.log('PageModel.Tabs.onChange: Tab not found for key:', activeKey);
              }
            }}
            items={this.getTabList()}
            tabBarExtraContent={
              <Button
                type="dashed"
                size="small"
                style={{
                  borderColor: '#ff7875',
                  color: '#ff7875',
                  backgroundColor: 'white',
                }}
                onClick={async () => {
                  await this.addTab({
                    stepParams: {
                      defaultFlow: {
                        step1: {
                          title: `Tab ${this.tabs.length + 1}`,
                          content: `Content for tab ${this.tabs.length + 1}`,
                        },
                      },
                    },
                  });
                }}
              >
                + Add tab
              </Button>
            }
          />
        </div>
      </div>
    ));

    return <RenderComponent />;
  }
}

PageModel.registerFlow('defaultFlow', {
  auto: true,
  steps: {
    setPageInfo: {
      title: '设置页面信息',
      uiSchema: {
        title: {
          type: 'string',
          title: 'Page Title',
          'x-component': 'Input',
        },
        description: {
          type: 'string',
          title: 'Page Description',
          'x-component': 'Input.TextArea',
        },
      },
      defaultParams: {
        title: 'Flow Page',
        description: 'page description',
      },
      async handler(_ctx, model: PageModel, params) {
        model.setProps('title', params.title);
        model.setProps('description', params.description);
      },
    },
    convertRouteToTabs: {
      async handler(_ctx, model: PageModel, params) {
        // 第二步：TODO - 从 params.route 转换为 tabs model
        if (params?.route) {
          console.log('PageModel: TODO - Convert route to tabs', params.route);
          // 未来在这里实现路由到标签页的转换逻辑
          // 例如：根据路由配置创建不同类型的标签页
          // 每个路由可能对应一个特定的 FlowModel 或组件

          // 示例实现（待完善）：
          // if (Array.isArray(params.route.tabs)) {
          //   for (const tabConfig of params.route.tabs) {
          //     await model.addTab({
          //       stepParams: {
          //         defaultFlow: {
          //           step1: {
          //             title: tabConfig.title,
          //             content: tabConfig.content,
          //           },
          //         },
          //       },
          //     });
          //   }
          // }
        } else if (model.tabs.length === 0) {
          console.log('PageModel: Creating default tabs (no route config)');
          await model.addTab({
            stepParams: {
              defaultFlow: {
                step1: {
                  title: 'Tab1',
                  content: model.getProps().content,
                },
              },
            },
          });
        }
      },
    },
  },
});
