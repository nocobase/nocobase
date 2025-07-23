import * as icons from '@ant-design/icons';
import { FormItem, FormLayout, Input, Select } from '@formily/antd-v5';
import { Application, Plugin } from '@nocobase/client';
import { defineFlow, escapeT, FlowModel, FlowModelRenderer } from '@nocobase/flow-engine';
import { Button } from 'antd';
import React from 'react';

// 自定义模型类，继承自 FlowModel
class MyModel extends FlowModel {
  render() {
    return <Button {...this.props} />;
  }
}

const buttonSettings = defineFlow({
  key: 'buttonSettings',
  title: '按钮设置',
  steps: {
    general: {
      title: '通用配置',
      paramsRequired: true,
      uiSchema: {
        title: {
          type: 'string',
          title: '按钮标题',
          'x-decorator': 'FormItem',
          'x-component': 'Input',
          'x-decorator-props': {
            tooltip: escapeT('Displays the AI employee’s assigned tasks on the profile when hovering over the button.'),
          },
        },
        type: {
          type: 'string',
          title: '类型',
          'x-decorator': 'FormItem',
          'x-component': 'Select',
          enum: [
            { label: '主要', value: 'primary' },
            { label: '次要', value: 'default' },
            { label: '危险', value: 'danger' },
            { label: '虚线', value: 'dashed' },
            { label: '链接', value: 'link' },
            { label: '文本', value: 'text' },
          ],
        },
        icon: {
          type: 'string',
          title: '图标',
          'x-decorator': 'FormItem',
          'x-component': 'Select',
          enum: [
            { label: '搜索', value: 'SearchOutlined' },
            { label: '添加', value: 'PlusOutlined' },
            { label: '删除', value: 'DeleteOutlined' },
            { label: '编辑', value: 'EditOutlined' },
            { label: '设置', value: 'SettingOutlined' },
          ],
        },
        tasks: {
          type: 'array',
          title: escapeT('Task'),
          'x-component': 'ArrayTabs',
          'x-component-props': {
            size: 'small',
          },
          items: {
            type: 'object',
            properties: {
              title: {
                type: 'string',
                title: escapeT('Title'),
                'x-decorator': 'FormItem',
                'x-component': 'Input',
                'x-decorator-props': {
                  tooltip: escapeT('Label for task selection buttons when multiple tasks exist'),
                },
              },
              message: {
                type: 'object',
                properties: {
                  system: {
                    title: escapeT('Background'),
                    type: 'string',
                    'x-decorator': 'FormItem',
                    'x-decorator-props': {
                      tooltip: escapeT(
                        'Additional system prompt appended to the AI employee’s definition, used to refine instructions',
                      ),
                    },
                    'x-component': 'Input.TextArea',
                  },
                  user: {
                    title: escapeT('Default user message'),
                    type: 'string',
                    'x-decorator': 'FormItem',
                    'x-component': 'Input.TextArea',
                  },
                  workContext: {
                    title: escapeT('Work context'),
                    type: 'array',
                    'x-decorator': 'FormItem',
                    'x-component': 'WorkContext',
                  },
                  attachments: {
                    title: escapeT('Files'),
                    type: 'array',
                    'x-decorator': 'FormItem',
                    'x-decorator-props': {
                      tooltip: escapeT('Please select file objects.'),
                    },
                    'x-component': 'ArrayItems',
                    items: {
                      type: 'void',
                      'x-component': 'Space',
                      properties: {
                        sort: {
                          type: 'void',
                          'x-decorator': 'FormItem',
                          'x-component': 'ArrayItems.SortHandle',
                        },
                        input: {
                          type: 'string',
                          'x-decorator': 'FormItem',
                          'x-component': 'Input',
                        },
                        remove: {
                          type: 'void',
                          'x-decorator': 'FormItem',
                          'x-component': 'ArrayItems.Remove',
                        },
                      },
                    },
                    properties: {
                      add: {
                        type: 'void',
                        title: escapeT('Add file'),
                        'x-component': 'ArrayItems.Addition',
                      },
                    },
                  },
                },
              },
              autoSend: {
                type: 'boolean',
                'x-content': escapeT('Send default user message automatically'),
                'x-decorator': 'FormItem',
                'x-component': 'Checkbox',
              },
            },
          },
        },
      },
      defaultParams: {
        type: 'primary',
      },
      // 步骤处理函数，设置模型属性
      handler(ctx, params) {
        ctx.model.setProps('children', params.title);
        ctx.model.setProps('type', params.type);
        ctx.model.setProps('icon', params.icon ? React.createElement(icons[params.icon]) : undefined);
      },
    },
  },
});

MyModel.registerFlow(buttonSettings);

// 插件类，负责注册模型、仓库，并加载或创建模型实例
class PluginHelloModel extends Plugin {
  async load() {
    // 启用 Flow Settings
    this.flowEngine.flowSettings.forceEnable();
    this.flowEngine.registerModels({ MyModel });
    const model = this.flowEngine.createModel({
      uid: 'my-model',
      use: 'MyModel',
      stepParams: {
        buttonSettings: {
          general: {
            title: 'Primary Button',
            type: 'primary',
          },
        },
      },
    });
    // 注册路由，渲染模型
    this.router.add('root', {
      path: '/',
      element: <FlowModelRenderer model={model} showFlowSettings={true} />,
    });
  }
}

// 创建应用实例，注册插件
const app = new Application({
  router: { type: 'memory', initialEntries: ['/'] },
  plugins: [PluginHelloModel],
});

export default app.getRootComponent();
